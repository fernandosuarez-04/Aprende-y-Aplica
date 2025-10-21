const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DEV_MODE = process.env.NODE_ENV !== 'production';

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log('✅ Supabase configurado correctamente');
} else {
    console.warn('⚠️ SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados en .env');
}

// Configuración de seguridad
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com', 'https://source.zoom.us', 'https://cdnjs.cloudflare.com'],
            // En desarrollo permitimos inline scripts (onclick) para compatibilidad rápida
            scriptSrc: DEV_MODE ? ["'self'", "'unsafe-inline'", 'https://source.zoom.us', 'https://esm.sh', 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://www.youtube.com'] : ["'self'", 'https://source.zoom.us', 'https://esm.sh', 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://www.youtube.com'],
            // Permitir carga de módulos ESM externos solo si fuera necesario (actualmente eliminamos supabase-client)
            // scriptSrcElem: DEV_MODE ? ["'self'", 'https://esm.sh'] : ["'self'"],
            // Permitir atributos inline (onclick) explícitamente en CSP nivel 3 durante desarrollo
            scriptSrcAttr: DEV_MODE ? ["'unsafe-inline'"] : [],
            // Permitir iframes de YouTube/Vimeo para reproducir videos, Google Forms
            frameSrc: [
                "'self'",
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
                'https://player.vimeo.com',
                'https://meet.google.com',
                'https://meet.jit.si',
                'https://zoom.us',
                'https://*.zoom.us',
                'https://source.zoom.us',
                'https://forms.gle',
                'https://docs.google.com'
            ],
            childSrc: [
                "'self'",
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
                'https://player.vimeo.com',
                'https://meet.google.com',
                'https://meet.jit.si',
                'https://zoom.us',
                'https://*.zoom.us',
                'https://source.zoom.us',
                'https://forms.gle',
                'https://docs.google.com'
            ],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            connectSrc: [
                "'self'",
                'ws:', 'wss:',
                'https://api.openai.com',
                'https://api.assemblyai.com',
                'https://meet.google.com',
                'https://zoom.us', 'https://*.zoom.us', 'https://source.zoom.us',
                'https://*.supabase.co'
            ],
            mediaSrc: ["'self'", 'blob:', 'data:', 'https:'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://unpkg.com', 'https://cdnjs.cloudflare.com', 'data:'],
            // Permitir que nosotros mostremos iframes de terceros dentro de nuestra propia app
            frameAncestors: ["'self'"],
            objectSrc: ["'none'"]
        }
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'same-origin' },
    noSniff: true,
    xssFilter: true,
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));

// Rate limiting para prevenir abuso
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use('/api/', limiter);

// CORS configurado de forma segura (habilitar preflight con cabeceras personalizadas)
const allowedOriginsFromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// Whitelist por hostname cuando no hay ALLOWED_ORIGINS configurado
const hostnameWhitelist = [
    'aprendeyaplica.ai',
    'www.aprendeyaplica.ai'
];

const tldsWhitelist = [
    'netlify.app',
    'netlify.live',
    'herokuapp.com'
];

function isHostAllowed(hostname) {
    if (!hostname) return false;
    if (hostnameWhitelist.includes(hostname)) return true;
    return tldsWhitelist.some(tld => hostname.endsWith(`.${tld}`));
}

const resolveCorsOrigin = (origin, callback) => {
    // Permitir solicitudes sin cabecera Origin (cURL, same-origin)
    if (!origin) return callback(null, true);

    // Si se configuró ALLOWED_ORIGINS, aceptar coincidencia exacta o por hostname
    if (allowedOriginsFromEnv.length > 0) {
        if (allowedOriginsFromEnv.includes(origin)) return callback(null, true);
        try {
            const host = new URL(origin).hostname;
            const allowedByHost = allowedOriginsFromEnv.some(value => {
                try {
                    const valHost = new URL(value).hostname;
                    return valHost === host;
                } catch { return false; }
            });
            return callback(null, allowedByHost);
        } catch {
            return callback(null, false);
        }
    }

    // Sin ALLOWED_ORIGINS, usar whitelist por hostname/TLD
    try {
        const host = new URL(origin).hostname;
        return callback(null, isHostAllowed(host));
    } catch {
        return callback(null, false);
    }
};

const corsOptions = {
    origin: resolveCorsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'X-API-Key', 'Authorization', 'Accept', 'Origin'],
    optionsSuccessStatus: 204,
    maxAge: 86400
};

app.use(cors(corsOptions));
// Responder explícitamente preflight para rutas de API
app.options('/api/*', cors(corsOptions));

// Salvaguarda: establecer encabezados CORS manualmente para todos los orígenes permitidos
app.use((req, res, next) => {
    try {
        const origin = req.headers.origin;
        let allow = false;
        if (!origin) {
            allow = true;
        } else if (allowedOriginsFromEnv.length > 0) {
            allow = allowedOriginsFromEnv.includes(origin);
            if (!allow) {
                try {
                    const host = new URL(origin).hostname;
                    allow = allowedOriginsFromEnv.some(v => {
                        try { return new URL(v).hostname === host; } catch { return false; }
                    });
                } catch {}
            }
        } else {
            try {
                const host = new URL(origin).hostname;
                allow = isHostAllowed(host);
            } catch {}
        }

        if (allow) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
            res.setHeader('Vary', 'Origin');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, X-API-Key, Authorization, Accept, Origin');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        }

        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
    } catch (_) {}
    next();
});

app.use(express.json({ limit: '10mb' }));

// Endpoint para obtener datos de adopción de GenAI por países
app.get('/api/adopcion-genai', async (req, res) => {
    try {
        console.log('🌍 Obteniendo datos de adopción GenAI por países...');
        
        if (!supabase) {
            console.error('❌ Supabase no configurado');
            return res.status(500).json({ error: 'Supabase no configurado' });
        }
        
        const { data, error } = await supabase
            .from('adopcion_genai')
            .select('*')
            .order('indice_aipi', { ascending: false });
        
        if (error) {
            console.error('❌ Error obteniendo datos de adopción:', error);
            return res.status(500).json({ error: error.message });
        }
        
        console.log(`✅ Datos de adopción obtenidos: ${data.length} países`);
        res.json(data);
        
    } catch (error) {
        console.error('❌ Error en adopcion-genai:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener mensajes explicativos personalizados
app.get('/api/analysis-messages', async (req, res) => {
    try {
        const { messageType, score, area, userId } = req.query;

        // Validar parámetros requeridos
        if (!messageType || score === undefined) {
            return res.status(400).json({
                success: false,
                error: 'messageType y score son requeridos'
            });
        }

        // Validar tipo de mensaje
        const validTypes = ['adoption_explanation', 'knowledge_explanation', 'recommendation'];
        if (!validTypes.includes(messageType)) {
            return res.status(400).json({
                success: false,
                error: 'messageType debe ser: ' + validTypes.join(', ')
            });
        }

        // Validar score
        const scoreNum = parseInt(score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
            return res.status(400).json({
                success: false,
                error: 'score debe ser un número entre 0 y 100'
            });
        }

        console.log(`🔍 Buscando mensaje: tipo=${messageType}, score=${scoreNum}, área=${area || 'general'}`);

        if (!supabase) {
            console.warn('⚠️ Supabase no configurado, usando fallback');
            return res.json({ success: false, error: 'Supabase no configurado' });
        }

        // Construir query base
        let query = supabase
            .from('analysis_messages')
            .select('*')
            .eq('message_type', messageType)
            .lte('score_range_min', scoreNum)
            .gte('score_range_max', scoreNum)
            .eq('is_active', true);

        // Filtrar por área si se proporciona
        if (area && area !== 'general') {
            // Buscar primero por área específica, luego por general
            query = query.in('target_area', [area, 'general']);
        } else {
            // Solo mensajes generales
            query = query.in('target_area', ['general']);
        }

        // Ordenar por prioridad: área específica primero, luego general
        if (area && area !== 'general') {
            query = query.order('target_area', { ascending: false }); // área específica primero
        }

        // Para recomendaciones, ordenar también por prioridad
        if (messageType === 'recommendation') {
            query = query.order('priority_level', { ascending: true }); // high, medium, low
        }

        query = query.limit(1);

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error obteniendo mensaje:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        if (data && data.length > 0) {
            console.log(`✅ Mensaje encontrado: ${data[0].title || 'Sin título'}`);
            res.json({
                success: true,
                message: data[0],
                source: 'database'
            });
        } else {
            console.log(`⚠️ No se encontró mensaje para los criterios especificados`);
            res.json({
                success: false,
                error: 'No se encontró mensaje para los criterios especificados',
                source: 'database'
            });
        }

    } catch (error) {
        console.error('❌ Error en analysis-messages:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'database'
        });
    }
});

app.use(express.static('src'));
app.use(express.static(__dirname)); // Servir archivos desde la raíz también
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir prompts para depuración/inspección (protegido por API en endpoints abajo)
app.use('/prompts', express.static(path.join(__dirname, 'prompts')));
// Servir datos del curso
app.use('/data', express.static(path.join(__dirname, 'src/data')));
// Servir archivos estáticos de SIF ICAP
app.use('/sif-icap', express.static(path.join(__dirname, 'sif-icap')));

// Carpeta temporal de audios (entradas del micro)
const tempDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Página de bienvenida (antes del inicio de sesión)
app.get('/', (req, res) => {
    try {
        // Intentar servir la nueva página de bienvenida primero
        const newWelcomePath = path.join(__dirname, 'src', 'welcome-new.html');
        if (fs.existsSync(newWelcomePath)) {
            res.sendFile(newWelcomePath);
        } else {
            res.sendFile(path.join(__dirname, 'src', 'welcome.html'));
        }
    } catch (_) {
        // Fallback en caso de que no exista la landing: redirigir a index
        res.redirect('/index.html');
    }
});

// Panel de administrador
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'admin', 'admin.html'));
});

// Ruta para la página de noticias
app.get('/notices', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'Notices', 'notices.html'));
});

app.get('/community', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'Community', 'community.html'));
});

app.get('/chat-general', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'ChatGeneral', 'chat-general.html'));
});

// Ruta para SIF ICAP
app.get('/sif-icap', (req, res) => {
    res.sendFile(path.join(__dirname, 'sif-icap', 'index.html'));
});



// Pool de conexiones a PostgreSQL
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
}

// Middleware de autenticación básica
function authenticateRequest(req, res, next) {
    if (DEV_MODE) return next();
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
}

// Verificación de origen/Referer para reducir CSRF cuando se usen cookies (defensa adicional)
function verifyOrigin(req, res, next) {
    try {
        const origin = req.headers.origin || '';
        const referer = req.headers.referer || '';

        const isAllowedOrigin = (cb) => resolveCorsOrigin(origin, (err, ok) => cb(ok));
        const isAllowedReferer = () => {
            if (!referer) return true;
            try { return isHostAllowed(new URL(referer).hostname); } catch { return false; }
        };

        return isAllowedOrigin((ok) => {
            if (!ok) return res.status(403).json({ error: 'Origen no permitido' });
            if (!isAllowedReferer()) return res.status(403).json({ error: 'Referer no permitido' });
        next();
        });
    } catch (_) { next(); }
}
if (!DEV_MODE) app.use('/api/', verifyOrigin);

// Exigir cabecera AJAX personalizada en métodos inseguros para mitigar CSRF
function requireAjaxHeader(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const xr = req.headers['x-requested-with'];
    if (xr !== 'XMLHttpRequest') return res.status(403).json({ error: 'Solicitud no válida' });
    next();
}
if (!DEV_MODE) app.use('/api/', requireAjaxHeader);

// Sesiones temporales (hasta integrar BD)
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const sessions = new Map(); // userId -> { username, fp, exp }

function getFingerprint(req) {
    try {
        const ua = req.headers['user-agent'] || '';
        const lang = req.headers['accept-language'] || '';
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
        return crypto.createHash('sha256').update(`${ua}|${lang}|${ip}`).digest('hex');
    } catch (_) {
        return '';
    }
}

function requireUserSession(req, res, next) {
    if (DEV_MODE) {
        req.user = { userId: 'dev-user-id', username: 'dev-user' };
        return next();
    }
    try {
        const auth = req.headers['authorization'] || '';
        const userId = req.headers['x-user-id'];
        if (!auth.startsWith('Bearer ') || !userId) {
            return res.status(401).json({ error: 'Sesión requerida' });
        }
        const token = auth.slice(7);
        const payload = jwt.verify(token, USER_JWT_SECRET);
        if (payload.sub !== userId) return res.status(401).json({ error: 'Token inválido' });
        const fpNow = getFingerprint(req);
        if (payload.fp && payload.fp !== fpNow) return res.status(401).json({ error: 'Dispositivo no autorizado' });
        const s = sessions.get(userId);
        if (!s || s.username !== payload.username || s.fp !== fpNow || s.exp < Date.now()) {
            return res.status(401).json({ error: 'Sesión expirada o inválida' });
        }
        // renovar TTL (deslizante)
        s.exp = Date.now() + SESSION_TTL_MS;
        sessions.set(userId, s);
        req.user = { userId, username: payload.username };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Sesión inválida' });
    }
}

// Utilidades para cargar prompts de /prompts
function safeRead(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (_) {
        return '';
    }
}

function getPrompts() {
    const base = path.join(__dirname, 'prompts');
    const system = safeRead(path.join(base, 'system.es.md'));
    const style = safeRead(path.join(base, 'style.es.md'));
    const tools = safeRead(path.join(base, 'tools.es.md'));
    const safety = safeRead(path.join(base, 'safety.es.md'));
    const examples = safeRead(path.join(base, 'examples.es.md'));
    const useCases = safeRead(path.join(base, 'use_cases.es.md'));
    const combined = [system, style, safety, tools, useCases]
        .filter(Boolean)
        .join('\n\n')
        .trim();
    return { system, style, tools, safety, useCases, examples, combined };
}

// Configuración de almacenamiento (Multer)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Storage específico para archivos de audio
const audioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname || '.webm') || '.webm';
        cb(null, `audio_${uuidv4()}${ext}`);
    }
});

// Storage específico para archivos de perfil (avatares/documentos)
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname) || '.jpg';
        const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype);
        const prefix = isImage ? 'avatar' : 'profile';
        cb(null, `${prefix}_${uuidv4()}${ext}`);
    }
});

// Multer para archivos de audio
const upload = multer({
    storage: audioStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'video/webm'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Tipo de archivo no permitido'));
    }
});

// Multer para imágenes/documentos del perfil
const uploadGeneral = multer({
    storage: profileStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Tipo de archivo no permitido'));
    }
});

// ====== AssemblyAI: transcripción ======
app.post('/api/transcribe', authenticateRequest, requireUserSession, upload.single('audio'), async (req, res) => {
    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'ASSEMBLYAI_API_KEY no configurada' });
        // Soportar 2 modos: archivo (multipart) o URL pregrabada (JSON body { audio_url })
        let audioUrl = (req.body && req.body.audio_url) ? String(req.body.audio_url) : null;
        if (!audioUrl) {
            if (!req.file) return res.status(400).json({ error: 'Archivo de audio o audio_url requerido' });
            // 1) Subir el archivo binario a AssemblyAI
            const audioPath = path.join(uploadsDir, req.file.filename);
            const audioData = fs.readFileSync(audioPath);
            const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
                method: 'POST',
                headers: {
                    'authorization': apiKey,
                    'content-type': 'application/octet-stream'
                },
                body: audioData
            });
            if (!uploadRes.ok) {
                const t = await uploadRes.text();
                return res.status(500).json({ error: 'Fallo subiendo audio a AssemblyAI', details: t.slice(0,200) });
            }
            const uploadJson = await uploadRes.json();
            audioUrl = uploadJson.upload_url;
        }

        // 2) Crear trabajo de transcripción
        const transcribeRes = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({ audio_url: audioUrl, language_code: 'es' })
        });
        if (!transcribeRes.ok) {
            const t = await transcribeRes.text();
            return res.status(500).json({ error: 'Fallo creando transcripción', details: t.slice(0,200) });
        }
        const job = await transcribeRes.json();

        // 3) Polling simple hasta completar
        let status = job.status;
        let transcript = null;
        const endpoint = `https://api.assemblyai.com/v2/transcript/${job.id}`;
        const started = Date.now();
        while (status && ['queued','processing','submitted'].includes(status)) {
            if (Date.now() - started > 120000) break; // 2 min máx
            await new Promise(r=>setTimeout(r, 2500));
            const st = await fetch(endpoint, { headers: { 'authorization': apiKey } });
            const js = await st.json();
            status = js.status;
            if (status === 'completed') transcript = js.text;
            if (status === 'error') return res.status(500).json({ error: 'Transcripción falló', details: js.error });
        }
        if (!transcript) return res.status(202).json({ status: status || 'processing' });
        res.json({ text: transcript, status: 'completed' });
    } catch (err) {
        console.error('AssemblyAI error:', err);
        res.status(500).json({ error: 'Error transcribiendo audio', details: err.message });
    }
});

// Importar servicios de email y OTP
const emailService = require('./src/utils/email-service');
const otpService = require('./src/utils/otp-service');
const otpCleanupService = require('./src/utils/cleanup-otps');

// Registro de usuarios con verificación de email
app.post('/api/register', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        
        const { full_name, username, email, password, type_rol } = req.body || {};
        
        // Validaciones obligatorias
        if (!full_name || !username || !email || !password) {
            return res.status(400).json({ 
                error: 'Nombre completo, usuario, email y contraseña son requeridos' 
            });
        }

        // Validación de contraseña (mínimo 8 caracteres)
        if (String(password).length < 8) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener de 8 caracteres en adelante' 
            });
        }

        // Validación de email básica
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email))) {
            return res.status(400).json({ 
                error: 'El email debe tener un formato válido' 
            });
        }

        // Verificar si el email ya está registrado
        const existingUser = await pool.query(
            'SELECT id, email_verified FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            const existing = existingUser.rows[0];
            if (existing.email === email) {
                return res.status(409).json({ error: 'El email ya está registrado' });
            } else {
                return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
            }
        }

        // Verificar configuración de email
        if (!emailService.isConfigured()) {
            console.warn('⚠️ Servicio de email no configurado, creando usuario sin verificación');
            // Crear usuario sin verificación en modo desarrollo
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash(String(password), 10);
            
            const result = await pool.query(`
                INSERT INTO users (username, email, password_hash, display_name, email_verified, email_verified_at) 
                VALUES ($1, $2, $3, $4, true, NOW()) 
                RETURNING id, username, email, display_name, email_verified
            `, [username, email, hash, full_name]);

            return res.status(201).json({ 
                user: result.rows[0],
                message: 'Usuario creado sin verificación de email (modo desarrollo)'
            });
        }

        // Crear usuario con email no verificado
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(String(password), 10);
        
        const result = await pool.query(`
            INSERT INTO users (username, email, password_hash, display_name, email_verified) 
            VALUES ($1, $2, $3, $4, false) 
            RETURNING id, username, email, display_name, email_verified
        `, [username, email, hash, full_name]);

        const newUser = result.rows[0];

        // Generar y enviar código OTP
        try {
            const otpResult = await otpService.createOTP(pool, newUser.id, 'verify_email');
            
            if (otpResult.success) {
                await emailService.sendVerificationEmail(email, otpResult.otp, full_name);
                
                console.log('📧 Email de verificación enviado para nuevo usuario:', {
                    userId: newUser.id,
                    email: email,
                    otpId: otpResult.otpId
                });

                res.status(201).json({ 
                    user: newUser,
                    message: 'Usuario creado. Revisa tu email para verificar tu cuenta.',
                    requiresVerification: true
                });
            } else {
                throw new Error('Error generando código de verificación');
            }
        } catch (emailError) {
            console.error('❌ Error enviando email de verificación:', emailError);
            
            // Si falla el envío de email, eliminar el usuario creado
            await pool.query('DELETE FROM users WHERE id = $1', [newUser.id]);
            
            return res.status(500).json({ 
                error: 'Error enviando email de verificación. Inténtalo de nuevo.' 
            });
        }
        
    } catch (error) {
        console.error('Error registrando usuario:', error);
        
        // Manejar errores específicos
        const errorMsg = String(error.message || '').toLowerCase();
        if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
            if (errorMsg.includes('username')) {
                return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
            } else if (errorMsg.includes('email')) {
                return res.status(409).json({ error: 'El email ya está registrado' });
            } else {
                return res.status(409).json({ error: 'El usuario ya existe' });
            }
        }
        
        res.status(500).json({ error: 'Error registrando usuario' });
    }
});

// Login de usuario con verificación de email
app.post('/api/login', async (req, res) => {
    try {
        const { username, identifier, password } = req.body || {};
        const input = (identifier || username || '').trim();
        if (!input || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        if (!pool) {
            if (DEV_MODE) {
                console.warn('[DEV] /api/login sin BD: devolviendo usuario simulado');
                return res.json({ user: { id: 'dev-user-id', username: input, email: null, display_name: input } });
            }
            return res.status(503).json({ error: 'Base de datos no configurada' });
        }

        // Buscar usuario con información de verificación de email
        const query = `
            SELECT 
                id, 
                username, 
                email,
                password_hash,
                email_verified,
                COALESCE(display_name, NULLIF(TRIM(CONCAT(COALESCE(first_name,''),' ',COALESCE(last_name,''))), '')) AS display_name
            FROM users 
            WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) 
            LIMIT 1
        `;
        
        const result = await pool.query(query, [String(input)]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        // Verificar contraseña
        const bcrypt = require('bcryptjs');
        let passwordValid = false;
        try {
            passwordValid = await bcrypt.compare(String(password), user.password_hash || '');
        } catch(_) { passwordValid = false; }
        
        // Modo desarrollo: permitir coincidencia en texto plano si el hash no es válido
        if (!passwordValid && DEV_MODE && user.password_hash && !String(user.password_hash).startsWith('$2')) {
            passwordValid = String(user.password_hash) === String(password);
        }
        
        if (!passwordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar si el email está verificado
        if (!user.email_verified) {
            return res.status(403).json({ 
                error: 'Email no verificado',
                requiresVerification: true,
                userId: user.id,
                email: user.email,
                message: 'Debes verificar tu email antes de iniciar sesión'
            });
        }

        // Actualizar último login
        await pool.query(
            'UPDATE users SET last_login_at = NOW() WHERE id = $1',
            [user.id]
        );

        return res.json({ 
            user: { 
                id: user.id, 
                username: user.username, 
                display_name: user.display_name || null, 
                email: user.email,
                email_verified: user.email_verified
            } 
        });
    } catch (err) {
        console.error('Error en /api/login:', err);
        return res.status(500).json({ error: 'Error interno en login' });
    }
});

// Rate limiting específico para recuperación de contraseña
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 3, // máximo 3 intentos por IP cada 15 minutos
    message: { error: 'Demasiados intentos de recuperación de contraseña. Inténtalo más tarde.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Endpoint para recuperación de contraseña
app.post('/api/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Formato de email inválido' });
        }

        // Verificar si el usuario existe en la base de datos
        let userExists = false;
        try {
            const result = await pool.query(
                'SELECT id, email, username FROM users WHERE email = $1',
                [email.toLowerCase()]
            );
            userExists = result.rows.length > 0;
        } catch (dbError) {
            console.error('Error verificando usuario:', dbError);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (!userExists) {
            // Por seguridad, no revelamos si el email existe o no
            return res.status(200).json({
                message: 'Si el correo está registrado, recibirás un enlace de recuperación'
            });
        }

        // Intentar con Supabase si está configurado
        if (supabase) {
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${req.protocol}://${req.get('host')}/src/login/reset-password.html`
                });

                if (!error) {
                    return res.status(200).json({
                        message: 'Se ha enviado un enlace de recuperación a tu correo electrónico'
                    });
                } else {
                    // Detectar si el error es porque Email logins está deshabilitado
                    const isEmailLoginsDisabled = error.message && (
                        error.message.includes('Email logins are disabled') ||
                        error.message.includes('Email login is disabled') ||
                        error.message.includes('email provider is disabled')
                    );

                    if (isEmailLoginsDisabled) {
                        console.log('ℹ️ Supabase Email Provider no habilitado, usando sistema de tokens propio...');
                    } else {
                        console.warn('Error Supabase reset password:', error.message);
                    }
                }
            } catch (supabaseError) {
                // Solo registrar como advertencia si no es el error esperado
                const isExpectedError = supabaseError.message && (
                    supabaseError.message.includes('Email logins are disabled') ||
                    supabaseError.message.includes('Email login is disabled') ||
                    supabaseError.message.includes('email provider is disabled')
                );

                if (isExpectedError) {
                    console.log('ℹ️ Supabase Email Provider no configurado, usando sistema de tokens propio...');
                } else {
                    console.warn('Error con Supabase:', supabaseError.message);
                }
            }
        }

        // Generar token de recuperación (para implementación futura con email)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

        try {
            // Crear tabla si no existe (versión simplificada)
            await pool.query(`
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    email VARCHAR(255) PRIMARY KEY,
                    token VARCHAR(255) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Guardar token en la base de datos
            await pool.query(
                `INSERT INTO password_reset_tokens (email, token, expires_at, created_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (email) DO UPDATE SET
                 token = $2, expires_at = $3, created_at = NOW()`,
                [email.toLowerCase(), resetToken, resetTokenExpiry]
            );
        } catch (tokenError) {
            console.error('Error guardando token:', tokenError);
            // Continuar sin fallar para no revelar información
        }

        // 🚨 ENVIAR EMAIL REAL CON EL TOKEN
        try {
            if (emailService.isConfigured()) {
                console.log(`📧 Intentando enviar email de recuperación a ${email}...`);

                // Obtener username del usuario
                let username = email.split('@')[0];
                try {
                    const userResult = await pool.query(
                        'SELECT username, full_name FROM users WHERE email = $1',
                        [email.toLowerCase()]
                    );
                    if (userResult.rows.length > 0) {
                        username = userResult.rows[0].full_name || userResult.rows[0].username || username;
                    }
                } catch (err) {
                    console.warn('No se pudo obtener username:', err.message);
                }

                await emailService.sendPasswordResetEmail(email, resetToken, username);

                console.log(`✅ Email de recuperación enviado exitosamente a ${email}`);
                res.status(200).json({
                    message: 'Se ha enviado un enlace de recuperación a tu correo electrónico'
                });
            } else {
                console.error('⚠️ Servicio de email no configurado - Verifica variables SMTP_*');

                // En modo desarrollo, mostrar el token en la consola
                if (DEV_MODE) {
                    console.log(`🔐 [DEV MODE] Token de recuperación para ${email}: ${resetToken}`);
                    console.log(`🔗 [DEV MODE] URL: ${req.protocol}://${req.get('host')}/src/login/new-auth.html?token=${resetToken}`);
                }

                res.status(200).json({
                    message: 'Se ha enviado un enlace de recuperación a tu correo electrónico'
                });
            }
        } catch (emailError) {
            console.error('❌ Error enviando email de recuperación:', emailError);

            // En modo desarrollo, mostrar el token
            if (DEV_MODE) {
                console.log(`🔐 [DEV MODE] Token de recuperación para ${email}: ${resetToken}`);
                console.log(`🔗 [DEV MODE] URL: ${req.protocol}://${req.get('host')}/src/login/new-auth.html?token=${resetToken}`);
            }

            // No revelar el error al usuario por seguridad
            res.status(200).json({
                message: 'Se ha enviado un enlace de recuperación a tu correo electrónico'
            });
        }

    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para procesar reset de contraseña
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        // Verificar token en la base de datos
        const tokenResult = await pool.query(
            'SELECT email, expires_at FROM password_reset_tokens WHERE token = $1',
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'Token inválido' });
        }

        const tokenData = tokenResult.rows[0];
        const now = new Date();

        if (new Date(tokenData.expires_at) < now) {
            return res.status(400).json({ error: 'Token expirado' });
        }

        // Actualizar contraseña del usuario
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(String(newPassword), 10);

        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [hash, tokenData.email]
        );

        // Eliminar token usado
        await pool.query(
            'DELETE FROM password_reset_tokens WHERE token = $1',
            [token]
        );

        console.log(`✅ Contraseña actualizada para ${tokenData.email}`);

        res.status(200).json({
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar código OTP
app.post('/api/verify-email', async (req, res) => {
    try {
        const { userId, otp } = req.body || {};
        
        if (!userId || !otp) {
            return res.status(400).json({ error: 'ID de usuario y código OTP requeridos' });
        }

        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        // Validar formato del OTP
        if (!otpService.validateOTPFormat(otp)) {
            return res.status(400).json({ error: 'Formato de código inválido. Debe ser de 6 dígitos.' });
        }

        // Verificar el código OTP
        const verificationResult = await otpService.verifyOTP(pool, userId, otp, 'verify_email');

        if (!verificationResult.success) {
            return res.status(400).json({ error: verificationResult.error });
        }

        // Marcar email como verificado
        await pool.query(`
            UPDATE users 
            SET email_verified = true, email_verified_at = NOW() 
            WHERE id = $1
        `, [userId]);

        // Obtener información actualizada del usuario
        const userResult = await pool.query(`
            SELECT id, username, email, display_name, email_verified, email_verified_at
            FROM users WHERE id = $1
        `, [userId]);

        console.log('✅ Email verificado exitosamente:', {
            userId: userId,
            verifiedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Email verificado correctamente',
            user: userResult.rows[0]
        });

    } catch (error) {
        console.error('❌ Error verificando email:', error);
        res.status(500).json({ error: 'Error interno verificando email' });
    }
});

// Endpoint para obtener estadísticas de OTPs (solo administradores)
app.get('/api/otp-stats', async (req, res) => {
    try {
        // Verificar si es administrador (implementar según tu lógica de roles)
        const isAdmin = req.headers['x-admin-key'] === process.env.API_SECRET_KEY;
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const stats = await otpCleanupService.getOTPStats();
        
        if (stats) {
            res.json({
                success: true,
                stats: stats,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ error: 'Error obteniendo estadísticas' });
        }

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas de OTPs:', error);
        res.status(500).json({ error: 'Error interno obteniendo estadísticas' });
    }
});

// Endpoint para reenviar código de verificación
app.post('/api/resend-verification', async (req, res) => {
    try {
        const { userId, email } = req.body || {};
        
        if (!userId || !email) {
            return res.status(400).json({ error: 'ID de usuario y email requeridos' });
        }

        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        // Verificar que el usuario existe y no está verificado
        const userResult = await pool.query(`
            SELECT id, username, email, display_name, email_verified
            FROM users WHERE id = $1 AND email = $2
        `, [userId, email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = userResult.rows[0];

        if (user.email_verified) {
            return res.status(400).json({ error: 'El email ya está verificado' });
        }

        // Verificar configuración de email
        if (!emailService.isConfigured()) {
            return res.status(500).json({ error: 'Servicio de email no configurado' });
        }

        // Generar y enviar nuevo código OTP
        try {
            const otpResult = await otpService.createOTP(pool, userId, 'verify_email');
            
            if (otpResult.success) {
                await emailService.sendVerificationEmail(email, otpResult.otp, user.display_name || user.username);
                
                console.log('📧 Código de verificación reenviado:', {
                    userId: userId,
                    email: email,
                    otpId: otpResult.otpId
                });

                res.json({
                    success: true,
                    message: 'Código de verificación reenviado. Revisa tu email.'
                });
            } else {
                throw new Error('Error generando código de verificación');
            }
        } catch (emailError) {
            console.error('❌ Error reenviando código:', emailError);
            res.status(500).json({ error: 'Error reenviando código de verificación' });
        }

    } catch (error) {
        console.error('❌ Error en resend-verification:', error);
        res.status(500).json({ error: 'Error interno reenviando verificación' });
    }
});

// Endpoint para subir audio (push-to-talk)
app.post('/api/audio/upload', authenticateRequest, requireUserSession, upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Archivo de audio requerido' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, size: req.file.size, mimetype: req.file.mimetype });
    } catch (error) {
        console.error('Error subiendo audio:', error);
        res.status(500).json({ error: 'Error subiendo audio' });
    }
});

// Subida de archivos de perfil (avatar/CV)
app.post('/api/profile/upload', uploadGeneral.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, size: req.file.size, mimetype: req.file.mimetype });
    } catch (error) {
        console.error('Error subiendo archivo de perfil:', error);
        res.status(500).json({ error: 'Error subiendo archivo' });
    }
});

// Endpoint de salud para verificar configuración
app.get('/api/health', async (req, res) => {
    try {
        const health = {
            ok: true,
            timestamp: new Date().toISOString(),
            modelEnUso: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
            nodeVersion: process.version,
            env: process.env.NODE_ENV || 'development'
        };

        const checks = {
            openaiConfigured: !!process.env.OPENAI_API_KEY,
            databaseConfigured: !!process.env.DATABASE_URL,
            secretsConfigured: !!(process.env.API_SECRET_KEY && process.env.USER_JWT_SECRET)
        };

        // Pruebas de base de datos
        let dbConnectable = false;
        let usersTableExists = false;
        if (pool) {
            try {
                await pool.query('SELECT 1');
                dbConnectable = true;
            } catch (_) { dbConnectable = false; }
            try {
                const r = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='users') AS exists");
                usersTableExists = !!r.rows?.[0]?.exists;
            } catch (_) { usersTableExists = false; }
        }

        health.checks = { ...checks, dbConnectable, usersTableExists };
        health.allGreen = Object.values(health.checks).every(Boolean);
        res.json(health);
    } catch (error) {
        console.error('Error en health check:', error);
        res.status(500).json({ ok: false, error: 'Health check failed' });
    }
});

// Endpoint de prueba para verificar que el servidor está funcionando
app.get('/api/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        socketio: 'habilitado',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000
    });
});

// Endpoint seguro para obtener configuración
app.get('/api/config', authenticateRequest, (req, res) => {
    try {
        // Solo devolver configuración no sensible
        const prompts = getPrompts();
        res.json({
            openaiModel: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
            maxTokens: process.env.CHATBOT_MAX_TOKENS || 700,
            temperature: process.env.CHATBOT_TEMPERATURE || 0.5,
            audioEnabled: process.env.AUDIO_ENABLED === 'true',
            audioVolume: process.env.AUDIO_VOLUME || 0.7,
            prompts
        });
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener configuración de Supabase (no sensible)
app.get('/api/supabase-config', (req, res) => {
    try {
        res.json({
            url: process.env.SUPABASE_URL,
            anon_key: process.env.SUPABASE_ANON_KEY
        });
    } catch (error) {
        console.error('Error obteniendo configuración de Supabase:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ====== PERFIL DE USUARIO (lectura/actualización simple) ======
app.get('/api/profile', async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        const { userId, username, email } = req.query || {};
        if (!userId && !username && !email) {
            return res.status(400).json({ error: 'userId, username o email requerido' });
        }
        const where = userId ? 'id = $1' : (username ? 'LOWER(username) = LOWER($1)' : 'LOWER(email) = LOWER($1)');
        const value = userId || username || email;

        // Detectar columnas existentes para compatibilidad con distintos esquemas
        // Detectar esquema que contiene la tabla users (no asumir 'public')
        const tblInfo = await pool.query(`
            SELECT schemaname FROM pg_catalog.pg_tables 
            WHERE tablename = 'users' 
            ORDER BY (schemaname = 'public') DESC
            LIMIT 1
        `);
        const schema = tblInfo.rows?.[0]?.schemaname || 'public';
        const qualified = `${schema}.users`;

        const colsRes = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'users'
        `, [schema]);
        const cols = new Set(colsRes.rows.map(r => r.column_name));
        const want = [
            'id','username','email','display_name','first_name','last_name','cargo_rol','type_rol','phone','bio','location',
            'profile_picture_url','curriculum_url','linkedin_url','github_url','website_url','created_at','updated_at','last_login_at'
        ];
        const selected = want.filter(c => cols.has(c));
        // Siempre incluir id, username, email si existen
        if (!selected.includes('id') && cols.has('id')) selected.unshift('id');
        if (!selected.includes('username') && cols.has('username')) selected.unshift('username');
        if (!selected.includes('email') && cols.has('email')) selected.unshift('email');
        const q = `SELECT ${selected.join(', ')} FROM ${qualified} WHERE ${where} LIMIT 1`;
        const r = await pool.query(q, [String(value)]);
        if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        return res.json({ user: r.rows[0] });
    } catch (err) {
        console.error('Error en GET /api/profile:', err);
        return res.status(500).json({ error: 'Error obteniendo perfil', details: process.env.NODE_ENV !== 'production' ? String(err.message || err) : undefined });
    }
});

app.put('/api/profile', async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        const { id, username } = req.body || {};
        if (!id && !username) return res.status(400).json({ error: 'id o username requerido' });
        // Filtrar por columnas realmente existentes
        // Detectar esquema de users
        const tblInfo = await pool.query(`
            SELECT schemaname FROM pg_catalog.pg_tables 
            WHERE tablename = 'users' 
            ORDER BY (schemaname = 'public') DESC
            LIMIT 1
        `);
        const schema = tblInfo.rows?.[0]?.schemaname || 'public';
        const qualified = `${schema}.users`;

        const colsRes = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'users'
        `, [schema]);
        const existing = new Set(colsRes.rows.map(r => r.column_name));
        const allowed = ['email','display_name','first_name','last_name','cargo_rol','type_rol','phone','bio','location',
                         'linkedin_url','github_url','website_url','profile_picture_url','curriculum_url'];
        const updates = {};
        for (const key of allowed) {
            if (key in (req.body || {}) && existing.has(key)) updates[key] = req.body[key];
        }
        if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Sin campos para actualizar' });
        const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i+1}`);
        if (existing.has('updated_at')) setClauses.push('updated_at = NOW()');
        const params = Object.values(updates);
        params.push(id || username);
        const where = id ? `id = $${params.length}` : `LOWER(username) = LOWER($${params.length})`;
        // Campos a retornar (solo los que existan)
        const returnCols = ['id','username','email','display_name','first_name','last_name','cargo_rol','type_rol','phone','bio','location','profile_picture_url','curriculum_url']
            .filter(c => existing.has(c)).join(', ');
        const q = `UPDATE ${qualified} SET ${setClauses.join(', ')} WHERE ${where} RETURNING ${returnCols}`;
        const r = await pool.query(q, params);
        if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        return res.json({ user: r.rows[0] });
    } catch (err) {
        console.error('Error en PUT /api/profile:', err);
        return res.status(500).json({ error: 'Error actualizando perfil', details: process.env.NODE_ENV !== 'production' ? String(err.message || err) : undefined });
    }
});

// Endpoint para actualizar type_rol desde el cuestionario
app.post('/api/update-profile', async (req, res) => {
    try {
        const { user_id, username, email, type_rol } = req.body || {};
        
        // Validaciones básicas
        if (!type_rol) {
            return res.status(400).json({ error: 'type_rol es requerido' });
        }

        if (!user_id && !username && !email) {
            return res.status(400).json({ error: 'Se requiere user_id, username o email para identificar al usuario' });
        }

        console.log('🔄 Actualizando type_rol:', { user_id, username, email, type_rol });

        // Verificar si existe la columna type_rol
        let hasTypeRol = false;
        try {
            const cols = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'type_rol'
            `);
            hasTypeRol = cols.rows.length > 0;
        } catch (err) {
            console.warn('⚠️ Error verificando columna type_rol:', err.message);
        }

        if (!hasTypeRol) {
            return res.status(400).json({ error: 'La tabla users no tiene columna type_rol' });
        }

        // Construir query de actualización
        let query, params;
        if (user_id) {
            query = 'UPDATE users SET type_rol = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, type_rol, cargo_rol';
            params = [type_rol, user_id];
        } else if (username) {
            query = 'UPDATE users SET type_rol = $1, updated_at = NOW() WHERE username = $2 RETURNING id, username, email, type_rol, cargo_rol';
            params = [type_rol, username];
        } else if (email) {
            query = 'UPDATE users SET type_rol = $1, updated_at = NOW() WHERE email = $2 RETURNING id, username, email, type_rol, cargo_rol';
            params = [type_rol, email];
        }

        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log('✅ type_rol actualizado correctamente:', result.rows[0]);

        return res.json({ 
            ok: true, 
            message: 'type_rol actualizado correctamente',
            user: result.rows[0] 
        });

    } catch (error) {
        console.error('❌ Error actualizando type_rol:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para actualizar avatar de usuario
app.post('/api/update-avatar', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const { user_id, username, email, profile_picture_url } = req.body || {};
        
        // Validaciones
        if (!profile_picture_url) {
            return res.status(400).json({ error: 'profile_picture_url es requerido' });
        }

        if (!user_id && !username && !email) {
            return res.status(400).json({ error: 'Se requiere user_id, username o email para identificar al usuario' });
        }

        console.log('🖼️ Actualizando avatar:', { 
            user_id: user_id ? user_id.substring(0, 8) + '...' : null, 
            username, 
            email,
            profile_picture_type: profile_picture_url.startsWith('data:') ? 'base64' : 'url',
            profile_picture_size: profile_picture_url.length
        });

        // Verificar que existe la columna profile_picture_url
        let hasProfilePictureUrl = false;
        try {
            const cols = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'profile_picture_url'
            `);
            hasProfilePictureUrl = cols.rows.length > 0;
        } catch (e) {
            console.error('Error verificando columna profile_picture_url:', e);
        }

        if (!hasProfilePictureUrl) {
            // La columna no existe, necesitamos crearla
            try {
                await pool.query(`
                    ALTER TABLE users 
                    ADD COLUMN profile_picture_url TEXT
                `);
                console.log('✅ Columna profile_picture_url creada');
            } catch (alterError) {
                console.error('❌ Error creando columna profile_picture_url:', alterError);
                return res.status(500).json({ error: 'Error configurando base de datos para avatares' });
            }
        }

        // Construir query de actualización usando múltiples identificadores
        let query, params;
        if (user_id) {
            query = 'UPDATE users SET profile_picture_url = $1 WHERE id = $2 RETURNING id, username, email, profile_picture_url';
            params = [profile_picture_url, user_id];
        } else if (username) {
            query = 'UPDATE users SET profile_picture_url = $1 WHERE username = $2 RETURNING id, username, email, profile_picture_url';
            params = [profile_picture_url, username];
        } else if (email) {
            query = 'UPDATE users SET profile_picture_url = $1 WHERE email = $2 RETURNING id, username, email, profile_picture_url';
            params = [profile_picture_url, email];
        }

        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const updatedUser = result.rows[0];
        
        console.log('✅ Avatar actualizado correctamente:', {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            has_avatar: !!updatedUser.profile_picture_url,
            avatar_type: updatedUser.profile_picture_url?.startsWith('data:') ? 'base64' : 'url'
        });

        return res.status(200).json({ 
            ok: true, 
            message: 'Foto de perfil actualizada correctamente',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                profile_picture_url: updatedUser.profile_picture_url
            }
        });

    } catch (error) {
        console.error('❌ Error actualizando avatar:', error);
        return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
});

// Endpoint seguro para obtener los prompts actuales
app.get('/api/prompts', authenticateRequest, (req, res) => {
    try {
        const prompts = getPrompts();
        res.json(prompts);
    } catch (error) {
        console.error('Error obteniendo prompts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener noticias
app.get('/api/news', async (req, res) => {
    try {
        // Si Supabase no está disponible, devolver datos de prueba
        if (!supabase) {
            console.log('🔄 Usando datos de prueba (Supabase no disponible)');
            const mockNews = getMockNews();
            return res.json({
                success: true,
                news: mockNews,
                total: mockNews.length,
                message: 'Noticias de prueba obtenidas exitosamente'
            });
        }

        // Consultar noticias publicadas ordenadas por fecha desde Supabase
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        if (error) {
            console.error('Error consultando noticias desde Supabase:', error);
            return res.status(500).json({
                error: 'Error al consultar noticias',
                details: error.message
            });
        }

        // Utilidad para parseo seguro (por si las columnas están como texto)
        const safeParse = (value, fallback) => {
            if (value == null) return fallback;
            if (typeof value === 'object') return value;
            try { return JSON.parse(value); } catch (_) { return fallback; }
        };

        // Mapear datos de BD al formato esperado por el frontend
        const mappedNews = news.map(raw => {
            const tldr = safeParse(raw.tldr, Array.isArray(raw.tldr) ? raw.tldr : []);
            const sections = safeParse(raw.sections, Array.isArray(raw.sections) ? raw.sections : []);
            const links = safeParse(raw.links, Array.isArray(raw.links) ? raw.links : []);
            const cta = safeParse(raw.cta, raw.cta);

            // Extraer secciones por "kind" del arreglo
            const getItems = (kind) => {
                // Forma A: arreglo de objetos con { kind, items }
                if (Array.isArray(sections)) {
                    const found = sections.find(s => s.kind === kind);
                    if (found && Array.isArray(found.items)) return found.items;
                }
                // Forma B: objeto con claves directas { steps:[], risks:[], ... }
                if (sections && typeof sections === 'object') {
                    const byKey = sections[kind];
                    if (Array.isArray(byKey)) return byKey;
                }
                return [];
            };

            // El frontend usa un icono para "image"; si tenemos URL, mantener un icono por defecto
            const imageIcon = 'fas fa-newspaper';

            return {
                id: raw.id,
                title: raw.title,
                excerpt: raw.subtitle || raw.intro || '',
                category: 'tecnologia',
                categoryLabel: 'Tecnología',
                author: 'Sistema',
                date: raw.published_at,
                views: 0,
                comments: 0,
                image: imageIcon,
                featured: false,
                hasDetailedView: true,
                detailedData: {
                    tldr: Array.isArray(tldr) ? tldr : [],
                    suggestedSteps: getItems('steps'),
                    risks: getItems('risks'),
                    resources: Array.isArray(links) ? links.map(l => ({ url: l.url, label: l.label || l.name })) : [],
                    whyMatters: getItems('why'),
                    whatChanged: getItems('whats_new'),
                    impact: getItems('impact'),
                    cta: (cta && (cta.label || cta.text)) ? (cta.label || cta.text) : 'Leer más'
                }
            };
        });

        res.json({
            success: true,
            news: mappedNews,
            total: mappedNews.length
        });

    } catch (error) {
        console.error('Error obteniendo noticias:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Endpoint para obtener session_id del usuario
app.get('/api/user/session', async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        
        // Obtener user_id de los query parameters o headers
        const userId = req.query.user_id || req.headers['x-user-id'] || req.headers['authorization']?.replace('Bearer ', '');

        if (!userId) {
            return res.status(400).json({ 
                error: 'user_id requerido',
                message: 'Proporciona user_id como query parameter o en el header x-user-id'
            });
        }

        console.log(`🔍 Buscando session_id para usuario: ${userId}`);

        // Buscar la sesión de cuestionario más reciente del usuario
        const query = `
            SELECT 
                uqs.id as session_id,
                uqs.user_id,
                uqs.perfil,
                uqs.area,
                uqs.started_at,
                uqs.completed_at,
                COUNT(uqr.id) as responses_count
            FROM user_questionnaire_sessions uqs
            LEFT JOIN user_question_responses uqr ON uqs.id = uqr.session_id
            WHERE uqs.user_id = $1
            GROUP BY uqs.id, uqs.user_id, uqs.perfil, uqs.area, uqs.started_at, uqs.completed_at
            ORDER BY uqs.started_at DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'No se encontró cuestionario para este usuario',
                user_id: userId,
                suggestion: 'El usuario debe completar el cuestionario primero'
            });
        }

        const sessionData = result.rows[0];

        // Verificar si el cuestionario está completo
        const isCompleted = sessionData.completed_at !== null;
        const hasResponses = parseInt(sessionData.responses_count) > 0;

        console.log(`✅ Sesión encontrada: ${sessionData.session_id}`);
        console.log(`📊 Cuestionario completo: ${isCompleted ? 'Sí' : 'No'}`);
        console.log(`📝 Respuestas: ${sessionData.responses_count}`);

        return res.json({
            session_id: sessionData.session_id,
            user_id: sessionData.user_id,
            perfil: sessionData.perfil,
            area: sessionData.area,
            started_at: sessionData.started_at,
            completed_at: sessionData.completed_at,
            is_completed: isCompleted,
            responses_count: parseInt(sessionData.responses_count),
            has_data: hasResponses,

            debug: {
                query_executed: true,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('💥 Error obteniendo session_id:', error);
        
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Emitir userId único + token (sin BD). El token está ligado a fingerprint del dispositivo
app.post('/api/auth/issue', authenticateRequest, (req, res) => {
    try {
        const { username } = req.body || {};
        if (!username || typeof username !== 'string' || username.trim().length < 3) {
            return res.status(400).json({ error: 'Usuario inválido' });
        }
        const userId = uuidv4();
        const fp = getFingerprint(req);
        const payload = { sub: userId, username: username.trim(), fp };
        const token = jwt.sign(payload, USER_JWT_SECRET, { expiresIn: '30d' });
        sessions.set(userId, { username: username.trim(), fp, exp: Date.now() + SESSION_TTL_MS });
        res.json({ userId, token, expiresInDays: 30 });
    } catch (error) {
        console.error('Error emitiendo sesión:', error);
        res.status(500).json({ error: 'Error emitiendo sesión' });
    }
});

// Endpoint seguro para llamadas a OpenAI (RENOMBRADO para evitar conflicto)
app.post('/api/openai-secure', authenticateRequest, requireUserSession, async (req, res) => {
    try {
        const { prompt, context } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt requerido' });
        }

        // Validar que existe la API key de OpenAI
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY no configurada en variables de entorno');
            return res.status(500).json({ 
                error: 'Configuración de OpenAI faltante', 
                details: 'OPENAI_API_KEY no está configurada en el servidor' 
            });
        }

        const { combined, examples } = getPrompts();
        
        // System prompt robusto con fallback
        let systemContent = combined || `Eres un asistente educativo especializado en inteligencia artificial. 

Respondes preguntas sobre:
- Conceptos básicos de IA: prompt, LLM, token, fine-tuning, etc.
- Diferencias entre modelos (GPT, BERT, transformers)
- Ejemplos prácticos de IA
- Fundamentos de machine learning y deep learning

Siempre das respuestas educativas útiles, no genéricas. Si no tienes contexto específico, explicas el concepto básico y sugieres explorar el glosario o FAQ.`;

        // Añadir contexto si existe
        if (context && context.trim()) {
            systemContent += `\n\nContexto adicional de la base de datos:\n${context}`;
        }
        
        console.log('📝 System prompt length:', systemContent.length);
        console.log('🎯 User prompt:', prompt?.substring(0, 100) + '...');

        // Compatibilidad con Node < 18 (usar node-fetch si global.fetch no existe)
        let fetchImpl;
        if (typeof fetch !== 'undefined') {
            fetchImpl = fetch;
        } else {
            try {
                const nodeFetch = await import('node-fetch');
                fetchImpl = nodeFetch.default;
            } catch (error) {
                return res.status(500).json({ 
                    error: 'Fetch no disponible', 
                    details: 'Node.js < 18 requiere node-fetch instalado: npm install node-fetch' 
                });
            }
        }

        // Construcción de messages: system + examples (opcional) + user
        const messages = [
            {
                role: 'system',
                content: systemContent
            }
        ];

        // Añadir examples como system message adicional si existe
        if (examples && examples.trim()) {
            messages.push({
                role: 'system',
                content: `Ejemplos de estilo y formato:\n\n${examples.substring(0, 4000)}`
            });
        }

        // Mensaje del usuario (ya incluye [ÁMBITO] y contexto de BD)
        messages.push({
            role: 'user',
            content: prompt
        });

        const requestBody = {
            model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
            messages: messages,
            max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 900,
            temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.5,
            top_p: 0.9
        };

        console.log('🚀 OpenAI Request:', {
            model: requestBody.model,
            messages_count: messages.length,
            max_tokens: requestBody.max_tokens,
            temperature: requestBody.temperature
        });

        const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Error OpenAI API ${response.status}:`, errText);
            return res.status(500).json({ 
                error: 'Error en la API de OpenAI', 
                details: `Status ${response.status}: ${errText.substring(0, 200)}` 
            });
        }

        const data = await response.json();
        console.log('📨 OpenAI Response:', {
            choices_count: data?.choices?.length || 0,
            usage: data?.usage || 'no usage data',
            has_content: !!data?.choices?.[0]?.message?.content
        });

        const content = data?.choices?.[0]?.message?.content;
        
        if (!content || content.trim() === '') {
            console.error('⚠️ Respuesta vacía de OpenAI. Full response:', JSON.stringify(data, null, 2));
            
            // Fallback directo si OpenAI no responde
            const fallbackResponse = `Lo siento, hubo un problema técnico con la respuesta. 

Sin embargo, puedo ayudarte con conceptos básicos de IA. Por ejemplo:
- **Prompt**: Es la instrucción o pregunta que le das a un modelo de IA
- **LLM**: Large Language Model, como GPT, que entiende y genera texto
- **Token**: Unidad básica de texto que procesa el modelo

¿Te gustaría explorar algún tema específico del curso de IA?`;
            
            return res.json({ response: fallbackResponse });
        }

        console.log('✅ Respuesta exitosa, longitud:', content.length);
        res.json({ response: content.trim() });
    } catch (error) {
        console.error('Error llamando a OpenAI:', error);
        res.status(500).json({ 
            error: 'Error procesando la solicitud', 
            details: error.message || String(error) 
        });
    }
});

// Endpoint seguro para consultas a la base de datos
app.post('/api/database', authenticateRequest, requireUserSession, async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const { query, params } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query requerida' });
        }

        const result = await pool.query(query, params || []);
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Error consultando base de datos:', error);
        res.status(500).json({ error: 'Error consultando la base de datos' });
    }
});

// Endpoint para obtener contexto de la base de datos con consultas optimizadas
app.post('/api/context', authenticateRequest, requireUserSession, async (req, res) => {
    try {
        if (!pool) {
            return res.json({ data: [] });
        }

        const { userQuestion } = req.body;
        
        if (!userQuestion || typeof userQuestion !== 'string') {
            return res.status(400).json({ error: 'userQuestion requerido como string' });
        }

        // Normalizar la pregunta del usuario para búsqueda
        const searchTerm = `%${userQuestion.toLowerCase().trim()}%`;
        
        // Query combinada para obtener contexto relevante de múltiples tablas
        const contextQuery = `
            -- Términos del glosario (mantenido)
            SELECT 
                'glossary' as source,
                g.id::text,
                null as course_id,
                null as module_id,
                g.term,
                g.definition,
                null as question,
                null as answer,
                null as title,
                null as description,
                null as content,
                g.category,
                length(g.term) as relevance_score
            FROM public.glossary_term g
            WHERE LOWER(g.term) ILIKE $1 OR LOWER(g.definition) ILIKE $1
            
            UNION ALL
            
            -- FAQs específicas del chatbot (NUEVA TABLA)
            SELECT 
                'chatbot_faq' as source,
                cf.id::text,
                null as course_id,
                null as module_id,
                null as term,
                null as definition,
                cf.question,
                cf.answer,
                null as title,
                null as description,
                null as content,
                cf.category,
                (length(cf.question) + length(cf.answer)) * cf.priority as relevance_score
            FROM public.chatbot_faq cf
            WHERE LOWER(cf.question) ILIKE $1 OR LOWER(cf.answer) ILIKE $1
            
            UNION ALL
            
            -- Información de cursos (NUEVA TABLA)
            SELECT 
                'course' as source,
                ac.id_ai_courses::text,
                ac.id_ai_courses::text as course_id,
                null as module_id,
                null as term,
                null as definition,
                null as question,
                null as answer,
                ac.name as title,
                ac.long_description as description,
                ac.short_description as content,
                COALESCE(ac.modality, 'general') as category,
                length(ac.name) + length(ac.long_description) as relevance_score
            FROM public.ai_courses ac
            WHERE LOWER(ac.name) ILIKE $1 
               OR LOWER(ac.long_description) ILIKE $1 
               OR LOWER(ac.short_description) ILIKE $1
            
            UNION ALL
            
            -- Módulos del curso (NUEVA TABLA)
            SELECT 
                'module' as source,
                cm.id::text,
                cm.course_id::text as course_id,
                cm.id::text as module_id,
                null as term,
                null as definition,
                null as question,
                null as answer,
                cm.title,
                cm.description,
                cm.ai_feedback as content,
                'modulo' as category,
                length(cm.title) + COALESCE(length(cm.description), 0) as relevance_score
            FROM public.course_module cm
            JOIN public.ai_courses ac ON cm.course_id = ac.id_ai_courses
            WHERE LOWER(cm.title) ILIKE $1 
               OR LOWER(cm.description) ILIKE $1
               OR LOWER(cm.ai_feedback) ILIKE $1
            
            UNION ALL
            
            -- Actividades de módulos (NUEVA TABLA)
            SELECT 
                'activity' as source,
                ma.id::text,
                cm.course_id::text as course_id,
                ma.module_id::text as module_id,
                null as term,
                null as definition,
                null as question,
                null as answer,
                CONCAT(ma.type, ' - ', ma.content_type) as title,
                ma.resource_url as description,
                ma.ai_feedback as content,
                COALESCE(ma.type, 'actividad') as category,
                length(COALESCE(ma.ai_feedback, '')) + length(COALESCE(ma.resource_url, '')) as relevance_score
            FROM public.module_activity ma
            JOIN public.course_module cm ON ma.module_id = cm.id
            WHERE LOWER(ma.ai_feedback) ILIKE $1 
               OR LOWER(ma.resource_url) ILIKE $1
               OR LOWER(ma.type) ILIKE $1
               OR LOWER(ma.content_type) ILIKE $1
            
            ORDER BY relevance_score DESC, source
            LIMIT 12
        `;

        const result = await pool.query(contextQuery, [searchTerm]);
        
        // Formatear los resultados según el tipo
        const formattedData = result.rows.map(row => {
            const base = {
                source: row.source,
                id: row.id,
                course_id: row.course_id,
                module_id: row.module_id,
                category: row.category
            };

            switch (row.source) {
                case 'glossary':
                    return {
                        ...base,
                        term: row.term,
                        definition: row.definition
                    };
                case 'chatbot_faq':
                    return {
                        ...base,
                        question: row.question,
                        answer: row.answer
                    };
                case 'course':
                    return {
                        ...base,
                        title: row.title,
                        description: row.description,
                        content: row.content
                    };
                case 'module':
                    return {
                        ...base,
                        title: row.title,
                        description: row.description,
                        content: row.content
                    };
                case 'activity':
                    return {
                        ...base,
                        title: row.title,
                        description: row.description,
                        content: row.content
                    };
                default:
                    return base;
            }
        });

        res.json({ data: formattedData });
    } catch (error) {
        console.error('Error consultando contexto de BD:', error);
        res.status(500).json({ 
            error: 'Error consultando contexto', 
            details: error.message 
        });
    }
});

// Función para obtener prompts del sistema

// Middleware de manejo de errores
// ===== ENDPOINTS DEL PANEL DE ADMINISTRADOR =====

// Dashboard stats - datos reales de la base de datos
app.get('/api/admin/dashboard/stats', async (req, res) => {
    try {
        console.log('Endpoint de dashboard stats llamado');
        
        if (!pool) {
            console.log('Pool de base de datos no configurado, retornando estadísticas simuladas');
            // Retornar estadísticas simuladas cuando no hay base de datos
            const stats = {
                totalUsers: 3,
                totalAdmins: 1,
                totalCourses: 5,
                totalNews: 8,
                totalMessages: 156,
                userActivity: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    data: [12, 19, 8, 15, 22, 10, 7]
                },
                roleDistribution: {
                    'Administrador': 1,
                    'Usuario': 2,
                    'Sin rol asignado': 0
                },
                recentActivity: 2
            };
            return res.json(stats);
        }

        // Verificar si la tabla users existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Tabla users no existe, retornando estadísticas simuladas');
            const stats = {
                totalUsers: 3,
                totalAdmins: 1,
                totalCourses: 5,
                totalNews: 8,
                totalMessages: 156,
                userActivity: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    data: [12, 19, 8, 15, 22, 10, 7]
                },
                roleDistribution: {
                    'Administrador': 1,
                    'Usuario': 2,
                    'Sin rol asignado': 0
                },
                recentActivity: 2
            };
            return res.json(stats);
        }

        // Obtener estadísticas reales de la base de datos
        const stats = {};

        // Total de usuarios
        const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
        stats.totalUsers = parseInt(usersResult.rows[0].total);

        // Total de administradores
        const adminsResult = await pool.query("SELECT COUNT(*) as total FROM users WHERE cargo_rol = 'Administrador'");
        stats.totalAdmins = parseInt(adminsResult.rows[0].total);

        // Total de cursos (asumiendo tabla course_content)
        try {
            const coursesResult = await pool.query('SELECT COUNT(*) as total FROM course_content');
            stats.totalCourses = parseInt(coursesResult.rows[0].total);
        } catch (error) {
            stats.totalCourses = 5; // Valor por defecto si la tabla no existe
        }

        // Total de noticias (asumiendo tabla news o similar)
        try {
            const newsResult = await pool.query('SELECT COUNT(*) as total FROM news');
            stats.totalNews = parseInt(newsResult.rows[0].total);
        } catch (error) {
            stats.totalNews = 8; // Valor por defecto si la tabla no existe
        }

        // Total de mensajes (asumiendo tabla conversations)
        try {
            const messagesResult = await pool.query('SELECT COUNT(*) as total FROM conversations');
            stats.totalMessages = parseInt(messagesResult.rows[0].total);
        } catch (error) {
            stats.totalMessages = 156; // Valor por defecto si la tabla no existe
        }

        // Actividad de usuarios (últimos 7 días)
        try {
            const activityResult = await pool.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM users 
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(created_at)
                ORDER BY date
            `);
            
            const activityLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const activityData = [0, 0, 0, 0, 0, 0, 0];
            
            activityResult.rows.forEach(row => {
                const dayIndex = new Date(row.date).getDay();
                activityData[dayIndex] = parseInt(row.count);
            });

            stats.userActivity = {
                labels: activityLabels,
                data: activityData
            };
        } catch (error) {
            stats.userActivity = {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                data: [12, 19, 8, 15, 22, 10, 7]
            };
        }

        // Distribución de roles
        try {
            const rolesResult = await pool.query(`
                SELECT 
                    COALESCE(cargo_rol, 'Sin rol asignado') as role,
                    COUNT(*) as count
                FROM users 
                GROUP BY cargo_rol
            `);
            
            const roleDistribution = {};
            rolesResult.rows.forEach(row => {
                roleDistribution[row.role] = parseInt(row.count);
            });
            stats.roleDistribution = roleDistribution;
        } catch (error) {
            stats.roleDistribution = {
                'Administrador': 1,
                'Usuario': 2,
                'Sin rol asignado': 0
            };
        }

        // Actividad reciente (usuarios que se conectaron en las últimas 24 horas)
        try {
            const recentActivityResult = await pool.query(`
                SELECT COUNT(*) as total 
                FROM users 
                WHERE last_login_at >= NOW() - INTERVAL '24 hours'
            `);
            stats.recentActivity = parseInt(recentActivityResult.rows[0].total);
        } catch (error) {
            stats.recentActivity = 2;
        }

        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        // Retornar datos simulados en caso de error
        const stats = {
            totalUsers: 3,
            totalAdmins: 1,
            totalCourses: 5,
            totalNews: 8,
            totalMessages: 156,
            userActivity: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                data: [12, 19, 8, 15, 22, 10, 7]
            },
            roleDistribution: {
                'Administrador': 1,
                'Usuario': 2,
                'Sin rol asignado': 0
            },
            recentActivity: 2
        };
        res.json(stats);
    }
});

// Obtener lista de usuarios
app.get('/api/admin/users', async (req, res) => {
    console.log('Endpoint de usuarios llamado');
    
    try {
        if (!pool) {
            console.log('Pool de base de datos no configurado, retornando usuarios simulados');
            // Retornar usuarios simulados cuando no hay base de datos
            const mockUsers = [
                {
                    id: 1,
                    full_name: 'Juan Pérez',
                    username: 'juanperez',
                    email: 'juan@example.com',
                    cargo_rol: 'Usuario',
                    created_at: '2024-01-15T10:30:00Z',
                    updated_at: '2024-01-15T10:30:00Z',
                    last_login_at: '2024-01-15T10:30:00Z',
                    type_rol: 'Usuario'
                },
                {
                    id: 2,
                    full_name: 'María García',
                    username: 'mariagarcia',
                    email: 'maria@example.com',
                    cargo_rol: 'Administrador',
                    created_at: '2024-01-15T09:15:00Z',
                    updated_at: '2024-01-15T09:15:00Z',
                    last_login_at: '2024-01-15T09:15:00Z',
                    type_rol: 'Administrador'
                },
                {
                    id: 3,
                    full_name: 'Carlos López',
                    username: 'carloslopez',
                    email: 'carlos@example.com',
                    cargo_rol: 'Usuario',
                    created_at: '2024-01-10T14:20:00Z',
                    updated_at: '2024-01-10T14:20:00Z',
                    last_login_at: '2024-01-10T14:20:00Z',
                    type_rol: 'Usuario'
                }
            ];
            return res.json(mockUsers);
        }

        // Verificar si la tabla users existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Tabla users no existe, retornando usuarios simulados');
            const mockUsers = [
                {
                    id: 1,
                    full_name: 'Juan Pérez',
                    username: 'juanperez',
                    email: 'juan@example.com',
                    cargo_rol: 'Usuario',
                    created_at: '2024-01-15T10:30:00Z',
                    updated_at: '2024-01-15T10:30:00Z',
                    last_login_at: '2024-01-15T10:30:00Z',
                    type_rol: 'Usuario'
                },
                {
                    id: 2,
                    full_name: 'María García',
                    username: 'mariagarcia',
                    email: 'maria@example.com',
                    cargo_rol: 'Administrador',
                    created_at: '2024-01-15T09:15:00Z',
                    updated_at: '2024-01-15T09:15:00Z',
                    last_login_at: '2024-01-15T09:15:00Z',
                    type_rol: 'Administrador'
                }
            ];
            return res.json(mockUsers);
        }

        // Consultar usuarios reales de la base de datos
        const result = await pool.query(`
            SELECT 
                id,
                username,
                email,
                COALESCE(
                    NULLIF(TRIM(display_name), ''),
                    NULLIF(TRIM(first_name || ' ' || last_name), ' '),
                    NULLIF(TRIM(first_name), ''),
                    username,
                    'Sin nombre'
                ) as full_name,
                cargo_rol,
                type_rol,
                created_at,
                updated_at,
                last_login_at,
                phone,
                bio,
                location
            FROM users 
            ORDER BY created_at DESC
            LIMIT 100
        `);

        console.log(`Usuarios obtenidos de la base de datos: ${result.rows.length}`);
        
        // Formatear datos para el frontend
        const users = result.rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            cargo_rol: user.cargo_rol || 'Usuario',
            type_rol: user.type_rol || 'Usuario',
            created_at: user.created_at,
            updated_at: user.updated_at,
            last_login_at: user.last_login_at,
            phone: user.phone,
            bio: user.bio,
            location: user.location
        }));

        res.json(users);

    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        
        // En caso de error, retornar datos simulados
        const mockUsers = [
            {
                id: 1,
                full_name: 'Error - Datos simulados',
                username: 'error_user',
                email: 'error@example.com',
                cargo_rol: 'Usuario',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login_at: null,
                type_rol: 'Usuario'
            }
        ];
        
        res.status(500).json({
            error: 'Error al obtener usuarios de la base de datos',
            details: error.message,
            fallback_data: mockUsers
        });
    }
});

// Cambiar rol de usuario
app.put('/api/admin/users/:id/role', async (req, res) => {
    console.log('Endpoint de cambio de rol llamado');
    
    try {
        const userId = req.params.id;
        const { cargo_rol } = req.body;

        // Validar parámetros
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        if (!cargo_rol || !['usuario', 'administrador', 'tutor', 'Usuario', 'Administrador', 'Tutor'].includes(cargo_rol)) {
            return res.status(400).json({ error: 'Rol inválido. Debe ser: usuario, administrador o tutor' });
        }

        // Verificar autorización del usuario actual
        const authHeader = req.headers['authorization'];
        const userIdHeader = req.headers['x-user-id'];
        
        if (!pool) {
            console.log('Pool de base de datos no configurado, simulando cambio de rol');
            return res.json({ 
                success: true, 
                message: `Rol cambiado a ${cargo_rol} (simulado)`,
                user: {
                    id: userId,
                    cargo_rol: cargo_rol
                }
            });
        }

        // Verificar que la tabla users existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Tabla users no existe, simulando cambio de rol');
            return res.json({ 
                success: true, 
                message: `Rol cambiado a ${cargo_rol} (simulado)`,
                user: {
                    id: userId,
                    cargo_rol: cargo_rol
                }
            });
        }

        // Verificar que el usuario existe
        const userCheck = await pool.query('SELECT id, cargo_rol FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Prevenir que el usuario se quite privilegios de administrador a sí mismo
        if (userIdHeader && parseInt(userIdHeader) === userId && userCheck.rows[0].cargo_rol === 'Administrador' && cargo_rol !== 'Administrador') {
            return res.status(403).json({ error: 'No puedes quitar tus propios privilegios de administrador' });
        }

        // Actualizar el rol del usuario
        const updateResult = await pool.query(
            'UPDATE users SET cargo_rol = $1, type_rol = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, cargo_rol, display_name, email',
            [cargo_rol, userId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(500).json({ error: 'Error actualizando el rol del usuario' });
        }

        console.log(`Rol del usuario ${userId} cambiado a ${cargo_rol}`);
        
        res.json({
            success: true,
            message: `Rol cambiado a ${cargo_rol} exitosamente`,
            user: updateResult.rows[0]
        });

    } catch (error) {
        console.error('Error cambiando rol de usuario:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Eliminar usuario
app.delete('/api/admin/users/:id', async (req, res) => {
    console.log('Endpoint de eliminación de usuario llamado');
    
    try {
        const userId = req.params.id;

        // Validar parámetros
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        // Verificar autorización del usuario actual
        const authHeader = req.headers['authorization'];
        const userIdHeader = req.headers['x-user-id'];
        
        if (!pool) {
            console.log('Pool de base de datos no configurado, simulando eliminación');
            return res.json({ 
                success: true, 
                message: 'Usuario eliminado exitosamente (simulado)'
            });
        }

        // Verificar que la tabla users existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Tabla users no existe, simulando eliminación');
            return res.json({ 
                success: true, 
                message: 'Usuario eliminado exitosamente (simulado)'
            });
        }

        // Verificar que el usuario existe
        const userCheck = await pool.query('SELECT id, cargo_rol, display_name, email FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userToDelete = userCheck.rows[0];

        // Prevenir que el usuario se elimine a sí mismo
        if (userIdHeader && parseInt(userIdHeader) === userId) {
            return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        // Verificar si es el último administrador
        if (userToDelete.cargo_rol === 'Administrador') {
            const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE cargo_rol = 'Administrador'");
            if (parseInt(adminCount.rows[0].count) <= 1) {
                return res.status(403).json({ error: 'No se puede eliminar el último administrador del sistema' });
            }
        }

        // Eliminar el usuario
        const deleteResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

        if (deleteResult.rows.length === 0) {
            return res.status(500).json({ error: 'Error eliminando el usuario' });
        }

        console.log(`Usuario ${userId} (${userToDelete.display_name}) eliminado exitosamente`);
        
        res.json({
            success: true,
            message: `Usuario ${userToDelete.display_name || 'desconocido'} eliminado exitosamente`,
            deletedUser: {
                id: userId,
                display_name: userToDelete.display_name,
                email: userToDelete.email
            }
        });

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Obtener lista de talleres/cursos
app.get('/api/admin/courses', async (req, res) => {
    console.log('Endpoint de talleres llamado');
    
    try {
        if (!pool) {
            console.log('Pool de base de datos no configurado, retornando talleres simulados');
            // Retornar talleres simulados cuando no hay base de datos
            const mockCourses = [
                {
                    id: 1,
                    name: 'Introducción a la Inteligencia Artificial',
                    short_description: 'Conceptos fundamentales de IA',
                    long_description: 'Un curso completo sobre los fundamentos de la inteligencia artificial.',
                    status: 'published',
                    modality: 'online',
                    session_count: 8,
                    total_duration: 480,
                    price: '$99',
                    currency: 'USD',
                    created_at: '2024-01-10T09:00:00Z'
                },
                {
                    id: 2,
                    name: 'Machine Learning Avanzado',
                    short_description: 'Técnicas avanzadas de ML',
                    long_description: 'Profundiza en algoritmos avanzados de machine learning.',
                    status: 'draft',
                    modality: 'hybrid',
                    session_count: 12,
                    total_duration: 720,
                    price: '$149',
                    currency: 'USD',
                    created_at: '2024-01-05T14:30:00Z'
                }
            ];
            return res.json(mockCourses);
        }

        // Verificar si la tabla courses existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'courses'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Tabla courses no existe, retornando talleres simulados');
            const mockCourses = [
                {
                    id: 1,
                    name: 'Introducción a la Inteligencia Artificial',
                    short_description: 'Conceptos fundamentales de IA',
                    long_description: 'Un curso completo sobre los fundamentos de la inteligencia artificial.',
                    status: 'published',
                    modality: 'online',
                    session_count: 8,
                    total_duration: 480,
                    price: '$99',
                    currency: 'USD',
                    created_at: '2024-01-10T09:00:00Z'
                },
                {
                    id: 2,
                    name: 'Machine Learning Avanzado',
                    short_description: 'Técnicas avanzadas de ML',
                    long_description: 'Profundiza en algoritmos avanzados de machine learning.',
                    status: 'draft',
                    modality: 'hybrid',
                    session_count: 12,
                    total_duration: 720,
                    price: '$149',
                    currency: 'USD',
                    created_at: '2024-01-05T14:30:00Z'
                }
            ];
            return res.json(mockCourses);
        }

        // Consultar talleres reales de la base de datos
        const result = await pool.query(`
            SELECT 
                id,
                title,
                description,
                category,
                level,
                duration_total_minutes,
                thumbnail_url,
                slug,
                is_active,
                created_at,
                updated_at
            FROM courses 
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT 50
        `);

        console.log(`Talleres obtenidos de la base de datos: ${result.rows.length}`);
        
        // Formatear datos para el frontend
        const courses = result.rows.map(course => ({
            id: course.id,
            title: course.title || 'Taller sin nombre',
            description: course.description || 'Sin descripción',
            category: course.category || 'ia',
            level: course.level || 'beginner',
            duration_total_minutes: course.duration_total_minutes || 0,
            thumbnail_url: course.thumbnail_url,
            slug: course.slug || '',
            is_active: course.is_active,
            created_at: course.created_at,
            updated_at: course.updated_at || course.created_at
        }));

        res.json(courses);

    } catch (error) {
        console.error('Error obteniendo talleres:', error);
        
        // En caso de error, retornar datos simulados
        const mockCourses = [
            {
                id: 1,
                name: 'Error - Datos simulados',
                short_description: 'Error al cargar talleres',
                long_description: 'Error al cargar talleres de la base de datos',
                status: 'error',
                modality: 'unknown',
                session_count: 0,
                total_duration: 0,
                price: '$0',
                currency: 'USD',
                created_at: new Date().toISOString()
            }
        ];
        
        res.status(500).json({
            error: 'Error al obtener talleres de la base de datos',
            details: error.message,
            fallback_data: mockCourses
        });
    }
});

// Obtener información del administrador actual
app.get('/api/admin/auth/check', async (req, res) => {
    try {
        console.log('Endpoint de auth check llamado');
        
        // Intentar obtener información del usuario actual desde los headers
        const authHeader = req.headers['authorization'];
        const userIdHeader = req.headers['x-user-id'];
        
        if (!pool) {
            console.log('Pool de base de datos no configurado, retornando datos simulados del administrador');
            // Retornar datos simulados del administrador cuando no hay base de datos
            const admin = {
                id: 1,
                username: 'admin',
                fullName: 'María García',
                email: 'maria@example.com',
                role: 'Administrador'
            };
            return res.json(admin);
        }

        // Verificar si la tabla users existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Tabla users no existe, retornando datos simulados del administrador');
            const admin = {
                id: 1,
                username: 'admin',
                fullName: 'María García',
                email: 'maria@example.com',
                role: 'Administrador'
            };
            return res.json(admin);
        }

        let result;
        
        // Si hay información de autenticación, buscar el usuario específico
        if (userIdHeader) {
            console.log('Buscando usuario específico con ID:', userIdHeader);
            result = await pool.query(`
                SELECT 
                    id,
                    username,
                    email,
                    COALESCE(
                        NULLIF(TRIM(display_name), ''),
                        NULLIF(TRIM(first_name || ' ' || last_name), ' '),
                        NULLIF(TRIM(first_name), ''),
                        username,
                        'Usuario'
                    ) as full_name,
                    cargo_rol,
                    type_rol,
                    last_login_at,
                    created_at
                FROM users 
                WHERE id = $1 AND (cargo_rol = 'Administrador' OR cargo_rol = 'administrador')
                LIMIT 1
            `, [userIdHeader]);
        }
        
        // Si no se encontró el usuario específico o no hay ID, buscar cualquier administrador
        if (!result || result.rows.length === 0) {
            console.log('Buscando cualquier administrador en la base de datos');
            result = await pool.query(`
                SELECT 
                    id,
                    username,
                    email,
                    COALESCE(
                        NULLIF(TRIM(display_name), ''),
                        NULLIF(TRIM(first_name || ' ' || last_name), ' '),
                        NULLIF(TRIM(first_name), ''),
                        username,
                        'Administrador'
                    ) as full_name,
                    cargo_rol,
                    type_rol,
                    last_login_at,
                    created_at
                FROM users 
                WHERE cargo_rol = 'Administrador' OR cargo_rol = 'administrador'
                ORDER BY last_login_at DESC NULLS LAST, created_at DESC
                LIMIT 1
            `);
        }

        if (result.rows.length === 0) {
            console.log('No se encontró administrador en la base de datos, retornando datos simulados');
            const admin = {
                id: 1,
                username: 'admin',
                fullName: 'María García',
                email: 'maria@example.com',
                role: 'Administrador'
            };
            return res.json(admin);
        }

        const admin = result.rows[0];
        console.log('Administrador encontrado:', { username: admin.username, fullName: admin.full_name });
        
        res.json({
            id: admin.id,
            username: admin.username,
            fullName: admin.full_name,
            email: admin.email,
            role: admin.cargo_rol,
            type_rol: admin.type_rol,
            lastLogin: admin.last_login_at,
            createdAt: admin.created_at
        });
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        // Retornar datos simulados en caso de error
        const admin = {
            id: 1,
            username: 'admin',
            fullName: 'María García',
            email: 'maria@example.com',
            role: 'Administrador'
        };
        res.json(admin);
    }
});

// Logout sin confirmación
app.post('/api/admin/auth/logout', (req, res) => {
    try {
        // Simplemente retornar éxito - el frontend manejará la redirección
        res.json({ success: true, message: 'Sesión cerrada' });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: 'Error cerrando sesión' });
    }
});

// ====== ENDPOINTS PARA GESTIÓN DE SOLICITUDES DE COMUNIDAD ======

// Obtener todas las solicitudes de comunidad
app.get('/api/admin/community-requests', async (req, res) => {
    try {
        console.log('📋 Obteniendo solicitudes de comunidad...');

        if (!supabase) {
            console.warn('⚠️ Supabase no configurado, retornando datos de prueba');
            // Datos de prueba para desarrollo
            const mockRequests = [
                {
                    id: '1',
                    community_id: 'comm-1',
                    requester_id: 'user-1',
                    status: 'pending',
                    note: 'Me gustaría unirme para aprender más sobre IA',
                    created_at: new Date().toISOString(),
                    reviewed_at: null,
                    reviewed_by: null,
                    user_name: 'Juan Pérez',
                    user_email: 'juan@example.com',
                    community_name: 'Inteligencia Artificial',
                    reviewer_name: null
                },
                {
                    id: '2',
                    community_id: 'comm-2',
                    requester_id: 'user-2',
                    status: 'approved',
                    note: 'Tengo experiencia en machine learning',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: 'admin-1',
                    user_name: 'María González',
                    user_email: 'maria@example.com',
                    community_name: 'Machine Learning',
                    reviewer_name: 'Administrador'
                },
                {
                    id: '3',
                    community_id: 'comm-1',
                    requester_id: 'user-3',
                    status: 'rejected',
                    note: null,
                    created_at: new Date(Date.now() - 172800000).toISOString(),
                    reviewed_at: new Date(Date.now() - 86400000).toISOString(),
                    reviewed_by: 'admin-1',
                    user_name: 'Carlos López',
                    user_email: 'carlos@example.com',
                    community_name: 'Inteligencia Artificial',
                    reviewer_name: 'Administrador'
                }
            ];
            return res.json(mockRequests);
        }

        // Consulta real a Supabase con JOINs para obtener datos completos
        console.log('🔍 Obteniendo solicitudes con datos de usuarios y comunidades...');

        const { data: requests, error } = await supabase
            .from('community_access_requests')
            .select(`
                *,
                requester:users!community_access_requests_requester_id_fkey(
                    first_name,
                    last_name,
                    email,
                    display_name
                ),
                community:communities!community_access_requests_community_id_fkey(
                    name
                ),
                reviewer:users!community_access_requests_reviewed_by_fkey(
                    first_name,
                    last_name,
                    display_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error obteniendo solicitudes:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log(`✅ Consulta básica exitosa. ${requests?.length || 0} registros encontrados`);

        // Si no hay datos, retornar mock
        if (!requests || requests.length === 0) {
            console.log('📝 No hay datos reales, retornando datos de prueba');
            const mockRequests = [
                {
                    id: '1',
                    community_id: 'comm-1',
                    requester_id: 'user-1',
                    status: 'pending',
                    note: 'Me gustaría unirme para aprender más sobre IA',
                    created_at: new Date().toISOString(),
                    reviewed_at: null,
                    reviewed_by: null,
                    user_name: 'Juan Pérez (Datos de prueba)',
                    user_email: 'juan@example.com',
                    community_name: 'Inteligencia Artificial',
                    reviewer_name: null
                }
            ];
            return res.json(mockRequests);
        }

        // Procesar datos reales con JOINs
        console.log('🔄 Procesando datos reales con información completa...');
        const formattedRequests = requests.map(request => {
            // Construir nombre completo del usuario solicitante
            const userName = request.requester?.display_name ||
                            `${request.requester?.first_name || ''} ${request.requester?.last_name || ''}`.trim() ||
                            'Usuario sin nombre';

            // Construir nombre completo del revisor
            const reviewerName = request.reviewer?.display_name ||
                               `${request.reviewer?.first_name || ''} ${request.reviewer?.last_name || ''}`.trim() ||
                               null;

            return {
                id: request.id,
                community_id: request.community_id,
                requester_id: request.requester_id,
                status: request.status,
                note: request.note,
                created_at: request.created_at,
                reviewed_at: request.reviewed_at,
                reviewed_by: request.reviewed_by,
                user_name: userName,
                user_email: request.requester?.email || 'Email no disponible',
                community_name: request.community?.name || 'Comunidad no disponible',
                reviewer_name: reviewerName
            };
        });

        console.log(`✅ ${formattedRequests.length} solicitudes procesadas con datos reales`);
        res.json(formattedRequests);

    } catch (error) {
        console.error('❌ Error en endpoint community-requests:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Aprobar solicitud de comunidad
app.put('/api/admin/community-requests/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`✅ Aprobando solicitud: ${id}`);
        console.log(`🔍 User info:`, req.user);

        if (!supabase) {
            console.warn('⚠️ Supabase no configurado, simulando aprobación');
            return res.json({
                success: true,
                message: 'Solicitud aprobada exitosamente (modo desarrollo)'
            });
        }

        // Iniciar transacción
        console.log(`🔍 Buscando solicitud con ID: ${id}`);
        const { data: request, error: fetchError } = await supabase
            .from('community_access_requests')
            .select('*')
            .eq('id', id)
            .eq('status', 'pending')
            .single();

        console.log(`🔍 Resultado de búsqueda:`, { request, fetchError });

        if (fetchError || !request) {
            console.error(`❌ Solicitud no encontrada:`, fetchError);
            return res.status(404).json({
                error: 'Solicitud no encontrada o ya procesada'
            });
        }

        // 1. Aprobar la solicitud
        console.log(`🔍 Actualizando solicitud ${id} a estado 'approved'`);
        const { error: updateError } = await supabase
            .from('community_access_requests')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: req.user?.userId || req.user?.id || null // Usar ID del usuario autenticado
            })
            .eq('id', id);

        if (updateError) {
            console.error('❌ Error actualizando solicitud:', updateError);
            return res.status(500).json({ error: updateError.message });
        }
        console.log(`✅ Solicitud ${id} actualizada exitosamente`);

        // 2. Agregar usuario a la comunidad
        console.log(`🔍 Agregando usuario ${request.requester_id} a comunidad ${request.community_id}`);
        const { error: memberError } = await supabase
            .from('community_members')
            .upsert({
                community_id: request.community_id,
                user_id: request.requester_id,
                role: 'member',
                is_active: true,
                joined_at: new Date().toISOString()
            }, {
                onConflict: 'community_id,user_id'
            });

        if (memberError) {
            console.error('❌ Error agregando miembro:', memberError);
            // Revertir la aprobación si falla agregar el miembro
            await supabase
                .from('community_access_requests')
                .update({ status: 'pending', reviewed_at: null, reviewed_by: null })
                .eq('id', id);

            return res.status(500).json({
                error: 'Error agregando usuario a la comunidad'
            });
        }
        console.log(`✅ Usuario agregado a la comunidad exitosamente`);

        console.log(`✅ Solicitud ${id} aprobada exitosamente`);
        res.json({
            success: true,
            message: 'Solicitud aprobada y usuario agregado a la comunidad'
        });

    } catch (error) {
        console.error('❌ Error aprobando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rechazar solicitud de comunidad
app.put('/api/admin/community-requests/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        console.log(`❌ Rechazando solicitud: ${id}, Motivo: ${reason || 'Sin motivo'}`);

        if (!supabase) {
            console.warn('⚠️ Supabase no configurado, simulando rechazo');
            return res.json({
                success: true,
                message: 'Solicitud rechazada exitosamente (modo desarrollo)'
            });
        }

        // Actualizar solicitud como rechazada
        const { error } = await supabase
            .from('community_access_requests')
            .update({
                status: 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by: req.user?.userId || req.user?.id || null, // Usar ID del usuario autenticado
                note: reason ? `${req.body.note || ''} [Motivo del rechazo: ${reason}]` : req.body.note
            })
            .eq('id', id)
            .eq('status', 'pending');

        if (error) {
            console.error('❌ Error rechazando solicitud:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log(`❌ Solicitud ${id} rechazada exitosamente`);
        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error rechazando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener lista de comunidades para filtros
app.get('/api/admin/communities', async (req, res) => {
    try {
        console.log('🏘️ Obteniendo lista de comunidades...');

        if (!supabase) {
            console.warn('⚠️ Supabase no configurado, retornando comunidades de prueba');
            const mockCommunities = [
                { id: 'comm-1', name: 'Inteligencia Artificial' },
                { id: 'comm-2', name: 'Machine Learning' },
                { id: 'comm-3', name: 'Deep Learning' },
                { id: 'comm-4', name: 'Data Science' }
            ];
            return res.json(mockCommunities);
        }

        const { data: communities, error } = await supabase
            .from('communities')
            .select('id, name')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('❌ Error obteniendo comunidades:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log(`✅ ${communities.length} comunidades obtenidas`);
        res.json(communities);

    } catch (error) {
        console.error('❌ Error en endpoint communities:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ====== ENDPOINTS PARA RADAR CHARTS ======

// Endpoint para guardar respuestas del cuestionario
app.post('/api/save-responses', async (req, res) => {
    try {
        const { userId, responses } = req.body;
        
        if (!userId || !responses || !Array.isArray(responses)) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }
        
        console.log('💾 Guardando respuestas para usuario:', userId, 'Cantidad:', responses.length);
        
        // Insertar respuestas usando el cliente de Supabase del servidor
        const { error } = await supabase
            .from('respuestas')
            .insert(responses);
        
        if (error) {
            console.error('❌ Error guardando respuestas:', error);
            return res.status(500).json({ error: error.message });
        }
        
        console.log('✅ Respuestas guardadas exitosamente');
        res.json({ success: true, count: responses.length });
        
    } catch (error) {
        console.error('❌ Error en save-responses:', error);
        res.status(500).json({ error: error.message });
    }
});

// Nuevo endpoint para GenAI Radar (cuestionario GenAI MultiArea)
app.get('/api/genai-radar/:userId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }
        
        console.log(`🎯 Obteniendo datos GenAI radar para userId: ${userId}`);
        
        // Query para obtener los últimos datos del radar por usuario desde las nuevas tablas preguntas y respuestas
        const query = `
            WITH user_responses AS (
                SELECT 
                    r.user_id,
                    r.pregunta_id,
                    r.valor->>'answer' as answer,
                    r.respondido_en,
                    p.bloque,
                    p.scoring
                FROM respuestas r
                JOIN preguntas p ON p.id = r.pregunta_id
                WHERE r.user_id = $1 
                    AND p.section = 'Cuestionario'
                ORDER BY r.respondido_en DESC
            ),
            scores_calculados AS (
                SELECT 
                    user_id,
                    COUNT(*) as total_questions,
                    COUNT(CASE WHEN bloque = 'Adopción' THEN 1 END) as adoption_questions,
                    COUNT(CASE WHEN bloque = 'Conocimiento' THEN 1 END) as knowledge_questions,
                    AVG(CASE WHEN bloque = 'Adopción' THEN 
                        CASE 
                            WHEN answer = 'A' THEN 1
                            WHEN answer = 'B' THEN 2
                            WHEN answer = 'C' THEN 3
                            WHEN answer = 'D' THEN 4
                            WHEN answer = 'E' THEN 5
                            ELSE 0
                        END
                    END) as adoption_score,
                    AVG(CASE WHEN bloque = 'Conocimiento' THEN 
                        CASE 
                            WHEN answer = 'A' THEN 20
                            WHEN answer = 'B' THEN 40
                            WHEN answer = 'C' THEN 60
                            WHEN answer = 'D' THEN 80
                            WHEN answer = 'E' THEN 100
                            ELSE 0
                        END
                    END) as knowledge_score
                FROM user_responses
                GROUP BY user_id
            )
            SELECT 
                ur.user_id,
                u.username,
                u.email,
                sc.total_questions,
                sc.adoption_questions,
                sc.knowledge_questions,
                sc.adoption_score,
                sc.knowledge_score,
                (sc.adoption_score + sc.knowledge_score) / 2 as total_score,
                CASE 
                    WHEN (sc.adoption_score + sc.knowledge_score) / 2 >= 70 THEN 'Avanzado'
                    WHEN (sc.adoption_score + sc.knowledge_score) / 2 >= 40 THEN 'Intermedio'
                    ELSE 'Básico'
                END as classification,
                MAX(ur.respondido_en) as completed_at
            FROM user_responses ur
            JOIN scores_calculados sc ON sc.user_id = ur.user_id
            LEFT JOIN users u ON u.id = ur.user_id
            GROUP BY ur.user_id, u.username, u.email, sc.total_questions, sc.adoption_questions, 
                     sc.knowledge_questions, sc.adoption_score, sc.knowledge_score
            ORDER BY completed_at DESC
            LIMIT 1
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            console.log(`📭 No se encontraron datos GenAI para userId: ${userId}`);
            
            // Para desarrollo/testing, devolver datos de prueba
            if (userId.includes('dev-') || userId === 'test-user') {
                return res.json({
                    hasData: true,
                    session_id: 'test-session-' + Date.now(),
                    userId: userId,
                    username: 'usuario_prueba',
                    email: 'test@example.com',
                    genaiArea: 'CEO/Alta Dirección',
                    totalScore: 65,
                    adoptionScore: 70,
                    knowledgeScore: 60,
                    classification: 'Intermedio',
                    completedAt: new Date().toISOString(),
                    // Datos para radar chart
                    conocimiento: 60,
                    aplicacion: 70,
                    productividad: 68,
                    estrategia: 65,
                    inversion: 55,
                    dataSource: 'test_data'
                });
            }
            
            return res.json({
                hasData: false,
                message: 'No hay datos de cuestionario GenAI completado',
                userId: userId,
                dataSource: 'preguntas_respuestas'
            });
        }
        
        const row = result.rows[0];
        
        // Formatear datos para el radar chart
        const radarData = {
            hasData: true,
            session_id: 'session-' + row.user_id + '-' + Date.now(),
            userId: row.user_id,
            username: row.username,
            email: row.email,
            genaiArea: 'Operaciones', // Por defecto, se puede mejorar obteniendo el área real
            
            // Scores principales
            totalScore: parseFloat(row.total_score) || 0,
            adoptionScore: parseFloat(row.adoption_score) || 0,
            knowledgeScore: parseFloat(row.knowledge_score) || 0,
            classification: row.classification,
            completedAt: row.completed_at,
            
            // Datos para radar chart (5 dimensiones)
            // Mapear los 2 scores GenAI a 5 dimensiones del radar original
            conocimiento: parseFloat(row.knowledge_score) || 0,
            aplicacion: parseFloat(row.adoption_score) || 0,
            productividad: parseFloat(row.adoption_score) || 0, // Usar adopción como proxy
            estrategia: parseFloat(row.total_score) || 0, // Usar score total como estrategia
            inversion: Math.min(parseFloat(row.total_score) || 0, 80), // Cap a 80 para ser realista
            
            dataSource: 'preguntas_respuestas'
        };
        
        console.log('📊 Datos GenAI radar obtenidos:', {
            userId: radarData.userId,
            genaiArea: radarData.genaiArea,
            totalScore: radarData.totalScore,
            classification: radarData.classification
        });
        
        res.json(radarData);
        
    } catch (error) {
        console.error('❌ Error obteniendo datos GenAI radar:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message,
            hasData: false
        });
    }
});

// Obtener datos de radar del usuario (última sesión completada)
app.get('/api/radar/user/:userId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }
        
        // Primero verificar si las vistas existen
        const viewCheckQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.views 
                WHERE table_schema = 'public' 
                AND table_name = 'v_radar_latest_by_user'
            ) as view_exists
        `;
        
        const viewCheck = await pool.query(viewCheckQuery);
        
        if (!viewCheck.rows[0].view_exists) {
            console.warn('⚠️ Vista v_radar_latest_by_user no existe, usando datos de prueba');
            
            // Para testing, devolver datos de prueba si el userId es específico
            if (userId === 'test-user' || userId === 'dev-user-id' || userId === 'test-user-uuid' || userId === '9562a449-4ade-4d4b-a3e4-b66dddb7e6f0') {
                return res.json({
                    session_id: 'test-session-123',
                    user_id: userId,
                    conocimiento: 75,
                    aplicacion: 80,
                    productividad: 65,
                    estrategia: 70,
                    inversion: 85,
                    hasData: true,
                    dataSource: 'test'
                });
            }
            
            // Usuario sin datos
            return res.json({
                session_id: null,
                user_id: userId,
                conocimiento: 0,
                aplicacion: 0,
                productividad: 0,
                estrategia: 0,
                inversion: 0,
                hasData: false,
                dataSource: 'no_view'
            });
        }
        
        // Consultar la vista v_radar_latest_by_user
        const query = `
            SELECT 
                session_id,
                user_id,
                COALESCE(conocimiento, 0) as conocimiento,
                COALESCE(aplicacion, 0) as aplicacion,
                COALESCE(productividad, 0) as productividad,
                COALESCE(estrategia, 0) as estrategia,
                COALESCE(inversion, 0) as inversion
            FROM public.v_radar_latest_by_user 
            WHERE user_id = $1
            LIMIT 1
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            // No hay datos para este usuario
            return res.json({
                session_id: null,
                user_id: userId,
                conocimiento: 0,
                aplicacion: 0,
                productividad: 0,
                estrategia: 0,
                inversion: 0,
                hasData: false,
                dataSource: 'database'
            });
        }
        
        const radarData = result.rows[0];
        
        res.json({
            session_id: radarData.session_id,
            user_id: radarData.user_id,
            conocimiento: radarData.conocimiento,
            aplicacion: radarData.aplicacion,
            productividad: radarData.productividad,
            estrategia: radarData.estrategia,
            inversion: radarData.inversion,
            hasData: true,
            dataSource: 'database'
        });
        
    } catch (error) {
        console.error('Error obteniendo datos de radar por usuario:', error);
        
        // En caso de error, proporcionar datos de prueba para desarrollo
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔧 Modo desarrollo: proporcionando datos de prueba');
            return res.json({
                session_id: 'fallback-session',
                user_id: req.params.userId,
                conocimiento: 60,
                aplicacion: 70,
                productividad: 55,
                estrategia: 65,
                inversion: 75,
                hasData: true,
                dataSource: 'fallback'
            });
        }
        
        res.status(500).json({ 
            error: 'Error obteniendo datos de radar',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
});

// NOTA: Middleware catch-all movido al final del archivo

// Crear servidor HTTP y configurar Socket.IO
const server = createServer(app);
// Permitir orígenes específicos en producción para Socket.IO (tomados de ALLOWED_ORIGINS)
const allowedSocketOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: DEV_MODE ? "*" : (allowedSocketOrigins.length > 0 ? allowedSocketOrigins : function(origin, callback) {
            try {
                if (!origin) return callback(null, true);
                const host = new URL(origin).hostname;
                const ok = isHostAllowed(host);
                return callback(null, ok);
            } catch (_) {
                return callback(null, false);
            }
        }),
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ====== NUEVOS ENDPOINTS PARA LAS TABLAS ACTUALIZADAS ======

// Obtener todos los cursos disponibles
app.get('/api/courses', authenticateRequest, async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        
        const query = `
            SELECT 
                id_ai_courses as id,
                name,
                short_description,
                long_description,
                price,
                currency,
                session_count,
                total_duration,
                modality,
                status,
                roi,
                purchase_url,
                course_url,
                temario_url
            FROM public.ai_courses 
            WHERE status = 'activo' OR status IS NULL
            ORDER BY name
        `;
        
        const result = await pool.query(query);
        res.json({ courses: result.rows });
    } catch (error) {
        console.error('Error obteniendo cursos:', error);
        res.status(500).json({ error: 'Error obteniendo cursos' });
    }
});

// Obtener módulos de un curso específico
app.get('/api/courses/:courseId/modules', authenticateRequest, async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        
        const { courseId } = req.params;
        const query = `
            SELECT 
                cm.id,
                cm.title,
                cm.description,
                cm.session_id,
                cm.position,
                cm.ai_feedback,
                ac.name as course_name
            FROM public.course_module cm
            JOIN public.ai_courses ac ON cm.course_id = ac.id_ai_courses
            WHERE cm.course_id = $1
            ORDER BY cm.position, cm.session_id
        `;
        
        const result = await pool.query(query, [courseId]);
        res.json({ modules: result.rows });
    } catch (error) {
        console.error('Error obteniendo módulos:', error);
        res.status(500).json({ error: 'Error obteniendo módulos del curso' });
    }
});

// Obtener actividades de un módulo específico
app.get('/api/modules/:moduleId/activities', authenticateRequest, async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        
        const { moduleId } = req.params;
        const query = `
            SELECT 
                ma.*,
                cm.title as module_title,
                cm.course_id
            FROM public.module_activity ma
            JOIN public.course_module cm ON ma.module_id = cm.id
            WHERE ma.module_id = $1
            ORDER BY ma.created_at
        `;
        
        const result = await pool.query(query, [moduleId]);
        res.json({ activities: result.rows });
    } catch (error) {
        console.error('Error obteniendo actividades:', error);
        res.status(500).json({ error: 'Error obteniendo actividades del módulo' });
    }
});

// Obtener FAQs específicas del chatbot
app.get('/api/chatbot/faqs', authenticateRequest, async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        
        const { category } = req.query;
        let query = `
            SELECT id, question, answer, category, priority
            FROM public.chatbot_faq
            ORDER BY priority DESC, category, question
        `;
        let params = [];
        
        if (category) {
            query = `
                SELECT id, question, answer, category, priority
                FROM public.chatbot_faq
                WHERE category = $1
                ORDER BY priority DESC, question
            `;
            params = [category];
        }
        
        const result = await pool.query(query, params);
        res.json({ faqs: result.rows });
    } catch (error) {
        console.error('Error obteniendo FAQs del chatbot:', error);
        res.status(500).json({ error: 'Error obteniendo FAQs' });
    }
});

// Obtener progreso de un usuario en un curso
app.get('/api/users/:userId/progress', authenticateRequest, async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        
        const { userId } = req.params;
        const { courseId } = req.query;
        
        let query = `
            SELECT 
                pt.id,
                pt.progress_percent,
                pt.last_access,
                cm.title as module_title,
                cm.course_id,
                ac.name as course_name
            FROM public.progress_tracking pt
            JOIN public.course_module cm ON pt.module_id = cm.id
            JOIN public.ai_courses ac ON cm.course_id = ac.id_ai_courses
            WHERE pt.user_id = $1
        `;
        let params = [userId];
        
        if (courseId) {
            query += ' AND cm.course_id = $2';
            params.push(courseId);
        }
        
        query += ' ORDER BY pt.last_access DESC';
        
        const result = await pool.query(query, params);
        res.json({ progress: result.rows });
    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        res.status(500).json({ error: 'Error obteniendo progreso del usuario' });
    }
});

// Obtener inscripciones de un usuario
app.get('/api/users/:userId/enrollments', authenticateRequest, async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        
        const { userId } = req.params;
        const query = `
            SELECT 
                e.id,
                e.status,
                e.enrolled_at,
                ac.id_ai_courses as course_id,
                ac.name as course_name,
                ac.short_description,
                ac.modality,
                ac.session_count,
                ac.total_duration
            FROM public.enrollment e
            JOIN public.ai_courses ac ON e.course_id = ac.id_ai_courses
            WHERE e.user_id = $1
            ORDER BY e.enrolled_at DESC
        `;
        
        const result = await pool.query(query, [userId]);
        res.json({ enrollments: result.rows });
    } catch (error) {
        console.error('Error obteniendo inscripciones:', error);
        res.status(500).json({ error: 'Error obteniendo inscripciones del usuario' });
    }
});

// Obtener estructura de sesiones desde course_module
app.get('/api/course-sessions', async (req, res) => {
    try {
        if (!pool) {
            return res.json({ 
                sessions: {
                    '1': { title: 'Sesión 1: Descubriendo la IA para Profesionales' },
                    '2': { title: 'Sesión 2: Fundamentos de Machine Learning' },
                    '3': { title: 'Sesión 3: Deep Learning y Casos Prácticos' },
                    '4': { title: 'Sesión 4: Aplicaciones, Ética y Proyecto Final' }
                }
            });
        }
        
        const query = `
            SELECT 
                session_id,
                title,
                description
            FROM public.course_module 
            WHERE session_id IS NOT NULL
            ORDER BY session_id, position
        `;
        
        const result = await pool.query(query);
        const sessions = {};
        
        if (result.rows.length > 0) {
            result.rows.forEach(row => {
                const sessionId = String(row.session_id);
                if (!sessions[sessionId]) {
                    sessions[sessionId] = { title: row.title || `Sesión ${sessionId}` };
                }
            });
        } else {
            // Fallback si no hay datos
            sessions['1'] = { title: 'Sesión 1: Descubriendo la IA para Profesionales' };
            sessions['2'] = { title: 'Sesión 2: Dominando la Comunicación con IA (Agentes y Gemas)' };
            sessions['3'] = { title: 'Sesión 3: IMPULSO con ChatGPT para PYMES' };
            sessions['4'] = { title: 'Sesión 4: Estrategia y Proyecto Integrador' };
        }
        
        res.json({ sessions });
    } catch (error) {
        console.error('Error obteniendo sesiones:', error);
        res.json({ 
            sessions: {
                '1': { title: 'Sesión 1: Descubriendo la IA para Profesionales' },
                '2': { title: 'Sesión 2: Dominando la Comunicación con IA (Agentes y Gemas)' },
                '3': { title: 'Sesión 3: IMPULSO con ChatGPT para PYMES' },
                '4': { title: 'Sesión 4: Estrategia y Proyecto Integrador' }
            }
        });
    }
});

// Obtener temario completo de un curso
app.get('/api/courses/:courseId/syllabus', authenticateRequest, async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ error: 'Base de datos no configurada' });
        
        const { courseId } = req.params;
        
        // Información general del curso y URL del temario
        const courseQuery = `
            SELECT 
                id_ai_courses as id,
                name,
                long_description,
                short_description,
                temario_url,
                session_count,
                total_duration,
                modality
            FROM public.ai_courses 
            WHERE id_ai_courses = $1
        `;
        
        // Estructura modular del temario
        const modulesQuery = `
            SELECT 
                cm.id,
                cm.title,
                cm.description,
                cm.session_id,
                cm.position,
                cm.ai_feedback,
                COUNT(ma.id) as activities_count
            FROM public.course_module cm
            LEFT JOIN public.module_activity ma ON cm.id = ma.module_id
            WHERE cm.course_id = $1
            GROUP BY cm.id, cm.title, cm.description, cm.session_id, cm.position, cm.ai_feedback
            ORDER BY cm.position, cm.session_id
        `;
        
        // Actividades por módulo
        const activitiesQuery = `
            SELECT 
                ma.id,
                ma.module_id,
                ma.type,
                ma.content_type,
                ma.resource_url,
                ma.metadata,
                ma.ai_feedback,
                cm.title as module_title
            FROM public.module_activity ma
            JOIN public.course_module cm ON ma.module_id = cm.id
            WHERE cm.course_id = $1
            ORDER BY cm.position, ma.created_at
        `;
        
        const [courseResult, modulesResult, activitiesResult] = await Promise.all([
            pool.query(courseQuery, [courseId]),
            pool.query(modulesQuery, [courseId]),
            pool.query(activitiesQuery, [courseId])
        ]);
        
        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        const course = courseResult.rows[0];
        const modules = modulesResult.rows;
        const activities = activitiesResult.rows;
        
        // Organizar actividades por módulo
        const modulesWithActivities = modules.map(module => ({
            ...module,
            activities: activities.filter(activity => activity.module_id === module.id)
        }));
        
        const syllabus = {
            course: course,
            modules: modulesWithActivities,
            summary: {
                total_modules: modules.length,
                total_activities: activities.length,
                sessions: course.session_count,
                duration: course.total_duration
            }
        };
        
        res.json({ syllabus });
    } catch (error) {
        console.error('Error obteniendo temario:', error);
        res.status(500).json({ error: 'Error obteniendo temario del curso' });
    }
});



// Obtener datos de radar por sesión específica (opcional)
app.get('/api/radar/session/:sessionId', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId es requerido' });
        }
        
        // Consultar la vista v_radar_by_session
        const query = `
            SELECT 
                session_id,
                user_id,
                COALESCE(conocimiento, 0) as conocimiento,
                COALESCE(aplicacion, 0) as aplicacion,
                COALESCE(productividad, 0) as productividad,
                COALESCE(estrategia, 0) as estrategia,
                COALESCE(inversion, 0) as inversion
            FROM public.v_radar_by_session 
            WHERE session_id = $1
            LIMIT 1
        `;
        
        const result = await pool.query(query, [sessionId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'No se encontraron datos para esta sesión' 
            });
        }
        
        const radarData = result.rows[0];
        
        res.json({
            session_id: radarData.session_id,
            user_id: radarData.user_id,
            conocimiento: radarData.conocimiento,
            aplicacion: radarData.aplicacion,
            productividad: radarData.productividad,
            estrategia: radarData.estrategia,
            inversion: radarData.inversion,
            hasData: true
        });
        
    } catch (error) {
        console.error('Error obteniendo datos de radar por sesión:', error);
        res.status(500).json({ 
            error: 'Error obteniendo datos de radar',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// Endpoint para verificar datos de un usuario específico (debugging)
app.get('/api/radar/debug/:userId', authenticateRequest, async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }
        
        console.log('🔍 Debug - Verificando datos para userId:', userId);
        
        // Verificar si el usuario existe
        const userCheck = await pool.query('SELECT id, username, email FROM public.users WHERE id = $1', [userId]);
        
        // Verificar sesiones de cuestionario
        const sessionsCheck = await pool.query(`
            SELECT id, user_id, perfil, area, started_at, completed_at 
            FROM public.user_questionnaire_sessions 
            WHERE user_id = $1 
            ORDER BY completed_at DESC
        `, [userId]);
        
        // Verificar respuestas de cuestionario
        const responsesCheck = await pool.query(`
            SELECT COUNT(*) as total_responses
            FROM public.user_question_responses 
            WHERE user_id = $1
        `, [userId]);
        
        // Verificar si las vistas existen
        const viewCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.views 
                WHERE table_schema = 'public' 
                AND table_name = 'v_radar_latest_by_user'
            ) as view_exists
        `);
        
        // Si las vistas existen, verificar datos en la vista
        let radarData = null;
        if (viewCheck.rows[0].view_exists) {
            const radarCheck = await pool.query(`
                SELECT * FROM public.v_radar_latest_by_user 
                WHERE user_id = $1
            `, [userId]);
            
            if (radarCheck.rows.length > 0) {
                radarData = radarCheck.rows[0];
            }
        }
        
        res.json({
            userId: userId,
            userExists: userCheck.rows.length > 0,
            userData: userCheck.rows[0] || null,
            sessionsCount: sessionsCheck.rows.length,
            sessions: sessionsCheck.rows,
            responsesCount: responsesCheck.rows[0].total_responses,
            viewExists: viewCheck.rows[0].view_exists,
            radarData: radarData,
            hasCompletedSessions: sessionsCheck.rows.some(s => s.completed_at !== null)
        });
        
    } catch (error) {
        console.error('Error en debug endpoint:', error);
        res.status(500).json({ 
            error: 'Error en debug endpoint',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// Endpoint para crear las vistas de radar (solo desarrollo)
app.post('/api/radar/create-views', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'No disponible en producción' });
    }
    
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        
        // Leer el archivo SQL
        const fs = require('fs');
        const path = require('path');
        const sqlPath = path.join(__dirname, 'create_radar_views.sql');
        
        if (!fs.existsSync(sqlPath)) {
            return res.status(404).json({ error: 'Archivo create_radar_views.sql no encontrado' });
        }
        
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Ejecutar el SQL
        await pool.query(sqlContent);
        
        console.log('✅ Vistas de radar creadas exitosamente');
        
        res.json({
            success: true,
            message: 'Vistas de radar creadas exitosamente',
            views: ['v_radar_latest_by_user', 'v_radar_by_session']
        });
        
    } catch (error) {
        console.error('Error creando vistas de radar:', error);
        res.status(500).json({ 
            error: 'Error creando vistas de radar',
            details: error.message
        });
    }
});

        // Endpoint para verificar si existen datos de prueba y crearlos si es necesario
        app.post('/api/radar/create-test-data', async (req, res) => {
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({ error: 'No disponible en producción' });
            }
            
            try {
                if (!pool) {
                    return res.status(500).json({ error: 'Base de datos no configurada' });
                }
                
                // Crear usuario de prueba si no existe
                const testUserId = 'test-user-uuid';
                const sessionId = 'test-session-uuid';
                
                // Verificar si ya existe el usuario
                const userCheck = await pool.query('SELECT id FROM public.users WHERE id = $1', [testUserId]);
                
                if (userCheck.rows.length === 0) {
                    // Crear usuario de prueba
                    await pool.query(`
                        INSERT INTO public.users (id, username, email, password_hash, first_name, last_name)
                        VALUES ($1, 'testuser', 'test@example.com', 'hash123', 'Usuario', 'Prueba')
                        ON CONFLICT (id) DO NOTHING
                    `, [testUserId]);
                }
                
                // Crear sesión de cuestionario de prueba
                await pool.query(`
                    INSERT INTO public.user_questionnaire_sessions (id, user_id, perfil, area, completed_at)
                    VALUES ($1, $2, 'Gerente de Operaciones', 'Tecnología', NOW())
                    ON CONFLICT (id) DO NOTHING
                `, [sessionId, testUserId]);
                
                // Crear respuestas de cuestionario de prueba
                const testQuestions = await pool.query(`
                    SELECT id, code, dimension 
                    FROM public.questions_catalog 
                    WHERE perfil = 'Gerente de Operaciones' 
                    LIMIT 10
                `);
                
                for (const question of testQuestions.rows) {
                    let answerValue;
                    if (question.dimension === 'Conocimiento') {
                        answerValue = Math.floor(Math.random() * 7) + 1; // 1-7
                    } else if (question.dimension === 'Aplicación') {
                        answerValue = Math.floor(Math.random() * 7) + 1; // 1-7
                    } else if (question.dimension === 'Productividad') {
                        answerValue = Math.floor(Math.random() * 7) + 1; // 1-7
                    } else if (question.dimension === 'Estrategia') {
                        answerValue = Math.floor(Math.random() * 7) + 1; // 1-7
                    } else if (question.dimension === 'Inversión') {
                        answerValue = Math.floor(Math.random() * 7) + 1; // 1-7
                    }
                    
                    await pool.query(`
                        INSERT INTO public.user_question_responses (session_id, user_id, question_id, answer_likert)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT DO NOTHING
                    `, [sessionId, testUserId, question.id, answerValue]);
                }
                
                console.log('✅ Datos de prueba creados exitosamente');
                
                res.json({
                    success: true,
                    message: 'Datos de prueba creados exitosamente',
            testUserId: testUserId,
            sessionId: sessionId
        });
        
    } catch (error) {
        console.error('Error creando datos de prueba:', error);
        res.status(500).json({ 
            error: 'Error creando datos de prueba',
            details: error.message
        });
    }
});

// Endpoint para obtener información de sesión (para mostrar session_id corto)
app.get('/api/session-info', authenticateRequest, requireUserSession, async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        
        const { userId } = req.user;
        
        // Obtener la última sesión del usuario
        const query = `
            SELECT 
                session_id,
                user_id,
                created_at
            FROM public.v_radar_latest_by_user 
            WHERE user_id = $1
            LIMIT 1
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            return res.json({
                session_id: null,
                user_id: userId,
                hasSession: false
            });
        }
        
        const sessionInfo = result.rows[0];
        
        res.json({
            session_id: sessionInfo.session_id,
            user_id: sessionInfo.user_id,
            created_at: sessionInfo.created_at,
            hasSession: true
        });
        
    } catch (error) {
        console.error('Error obteniendo información de sesión:', error);
        res.status(500).json({ 
            error: 'Error obteniendo información de sesión',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// Almacenar usuarios conectados al chat del livestream
const livestreamUsers = new Map();

// Endpoint de prueba para verificar que la API funciona
app.get('/api/test', (req, res) => {
    console.log('[API TEST] 🧪 Endpoint de prueba llamado');
    res.json({ 
        status: 'ok', 
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        openaiConfigured: !!process.env.OPENAI_API_KEY
    });
});

// Endpoint para OpenAI API
app.post('/api/openai', async (req, res) => {
    console.log('[OPENAI API] 🚀 Nueva petición recibida');
    console.log('[OPENAI API] 📝 Headers:', req.headers);
    console.log('[OPENAI API] 📄 Body:', req.body);
    
    try {
        // Verificar autenticación
        const authHeader = req.headers.authorization;
        const userId = req.headers['x-user-id'];
        
        console.log('[OPENAI API] 🔐 Auth header:', !!authHeader);
        console.log('[OPENAI API] 👤 User ID:', userId);
        
        if (!authHeader || !userId) {
            console.log('[OPENAI API] ❌ Falta autenticación');
            return res.status(401).json({ error: 'Autenticación requerida' });
        }
        
        // Verificar que tenemos la API key de OpenAI
        if (!process.env.OPENAI_API_KEY) {
            console.log('[OPENAI API] ❌ No hay API key de OpenAI configurada');
            return res.status(500).json({ error: 'Configuración de OpenAI faltante' });
        }
        
        const { prompt, context } = req.body;
        
        if (!prompt) {
            console.log('[OPENAI API] ❌ No hay prompt en el body');
            return res.status(400).json({ error: 'Prompt requerido' });
        }
        
        console.log('[OPENAI API] 📝 Prompt recibido:', prompt);
        console.log('[OPENAI API] 📋 Contexto:', context);
        
        // Construir el mensaje del sistema
        const systemMessage = `Eres LIA (Learning Intelligence Assistant), un asistente de inteligencia artificial especializado en educación y capacitación en IA. 

Tu objetivo es ayudar a los usuarios a comprender y aplicar conceptos de inteligencia artificial de manera efectiva.

Personalidad:
- Amigable pero profesional
- Educativo y motivador
- Práctico con ejemplos concretos
- Adaptativo al nivel del usuario

Formato de respuestas:
- Usa emojis estratégicamente
- Estructura con viñetas y numeración
- Usa **negritas** para enfatizar
- Mantén un tono positivo y motivador

Contexto del usuario: ${context || 'No disponible'}`;

        const messages = [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
        ];
        
        console.log('[OPENAI API] 🤖 Enviando petición a OpenAI...');
        
        const startTime = Date.now();
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
                messages,
                max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS || '1000', 10),
                temperature: parseFloat(process.env.CHATBOT_TEMPERATURE || '0.5'),
                top_p: 0.9
            })
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log('[OPENAI API] ⏱️ Tiempo de respuesta:', responseTime + 'ms');
        console.log('[OPENAI API] 📡 Status de OpenAI:', openaiResponse.status);
        
        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.log('[OPENAI API] ❌ Error de OpenAI:', errorText);
            return res.status(500).json({ 
                error: 'Error en la API de OpenAI', 
                details: `Status ${openaiResponse.status}: ${errorText.substring(0, 200)}` 
            });
        }
        
        const data = await openaiResponse.json();
        console.log('[OPENAI API] ✅ Respuesta de OpenAI recibida');
        console.log('[OPENAI API] 📊 Usage:', data.usage);
        
        const content = data?.choices?.[0]?.message?.content;
        
        if (!content || !String(content).trim()) {
            console.log('[OPENAI API] ⚠️ Respuesta vacía de OpenAI');
            return res.status(200).json({ 
                response: 'Lo siento, hubo un problema técnico con la respuesta.' 
            });
        }
        
        // Calcular costo estimado (aproximado)
        const inputTokens = data.usage?.prompt_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        const model = process.env.CHATBOT_MODEL || 'gpt-4o-mini';
        
        let cost = 0;
        if (model === 'gpt-4o-mini') {
            cost = (inputTokens * 0.00015 + outputTokens * 0.0006) / 1000; // USD
        } else if (model === 'gpt-3.5-turbo') {
            cost = (inputTokens * 0.0015 + outputTokens * 0.002) / 1000; // USD
        }
        
        console.log('[OPENAI API] 💰 Costo estimado: $' + cost.toFixed(6));
        console.log('[OPENAI API] 🎯 Respuesta final:', content.substring(0, 100) + '...');
        
        res.json({
            response: String(content).trim(),
            usage: data.usage,
            cost: cost.toFixed(6),
            responseTime: responseTime
        });
        
    } catch (error) {
        console.error('[OPENAI API] 💥 Error:', error);
        res.status(500).json({ 
            error: 'Error procesando la solicitud',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// Configurar eventos de Socket.IO para el chat del livestream
io.on('connection', (socket) => {
    console.log(`👤 Usuario conectado al livestream: ${socket.id}`);
    
    // Usuario se une al chat del livestream
    socket.on('join-livestream-chat', (userData) => {
        const userInfo = {
            id: socket.id,
            username: userData.username || `Usuario_${Math.floor(Math.random() * 1000)}`,
            joinedAt: new Date().toISOString()
        };
        
        livestreamUsers.set(socket.id, userInfo);
        socket.join('livestream-chat');
        
        // Notificar a todos que un usuario se unió
        socket.to('livestream-chat').emit('user-joined', {
            message: `${userInfo.username} se unió al chat`,
            timestamp: new Date().toISOString(),
            type: 'system'
        });
        
        // Enviar lista de usuarios conectados a todos
        const connectedUsers = Array.from(livestreamUsers.values()).map(user => user.username);
        io.to('livestream-chat').emit('users-list', connectedUsers);
        
        console.log(`📺 ${userInfo.username} se unió al chat del livestream`);
    });
    
    // Recibir mensaje del chat del livestream
    socket.on('livestream-message', (messageData) => {
        const user = livestreamUsers.get(socket.id);
        if (!user) return;
        
        const message = {
            id: uuidv4(),
            username: user.username,
            message: messageData.message,
            timestamp: new Date().toISOString(),
            type: 'user',
            clientMessageId: messageData.clientMessageId || null
        };
        
        // Enviar mensaje a todos los usuarios en el chat del livestream
        io.to('livestream-chat').emit('new-livestream-message', message);
        
        console.log(`💬 Mensaje del livestream de ${user.username}: ${messageData.message}`);
    });
    
    // Usuario se desconecta
    socket.on('disconnect', () => {
        const user = livestreamUsers.get(socket.id);
        if (user) {
            livestreamUsers.delete(socket.id);
            socket.to('livestream-chat').emit('user-left', {
                message: `${user.username} abandonó el chat`,
                timestamp: new Date().toISOString(),
                type: 'system'
            });
            const connectedUsers = Array.from(livestreamUsers.values()).map(u => u.username);
            io.to('livestream-chat').emit('users-list', connectedUsers);
            console.log(`👋 ${user.username} se desconectó del livestream`);
        }
    });
});

// =====================================================
// SISTEMA DE CURSOS DINÁMICOS - ENDPOINTS
// =====================================================

// Importar funciones de cursos
const coursesApi = require('./api/courses');

// Rutas específicas para Module 1 Videos Loader
app.get('/api/courses/module1-info', async (req, res) => {
    try {
        console.log('📚 === OBTENER INFORMACIÓN MÓDULO 1 ===');
        
        // Verificar pool de base de datos
        if (!pool) {
            console.error('❌ Pool de base de datos no disponible');
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }

        // Buscar el módulo 1 en la base de datos usando PostgreSQL
        const result = await pool.query(`
            SELECT id, module_number, title, description, duration_minutes, order_index
            FROM course_modules 
            WHERE module_number = 1 
            AND is_required = true 
            ORDER BY order_index ASC 
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            console.warn('⚠️ Módulo 1 no encontrado en la base de datos');
            return res.status(404).json({
                success: false,
                error: 'Módulo 1 no encontrado'
            });
        }

        const moduleData = result.rows[0];
        console.log('✅ Información del módulo 1 obtenida:', moduleData);
        
        res.json({
            success: true,
            module_id: moduleData.id,
            module_number: moduleData.module_number,
            module_title: moduleData.title,
            description: moduleData.description,
            duration_minutes: moduleData.duration_minutes
        });

    } catch (error) {
        console.error('💥 Error en /api/courses/module1-info:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

app.get('/api/courses/module1-videos', async (req, res) => {
    try {
        console.log('🎬 === OBTENER VIDEOS MÓDULO 1 ===');
        
        // Verificar pool de base de datos
        if (!pool) {
            console.error('❌ Pool de base de datos no disponible');
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }

        // Buscar el módulo 1 primero
        const moduleResult = await pool.query(`
            SELECT id, title 
            FROM course_modules 
            WHERE module_number = 1 
            AND is_required = true 
            LIMIT 1
        `);

        if (moduleResult.rows.length === 0) {
            console.warn('⚠️ Módulo 1 no encontrado');
            return res.status(404).json({
                success: false,
                error: 'Módulo 1 no encontrado'
            });
        }

        const moduleData = moduleResult.rows[0];
        console.log('📚 Módulo encontrado:', moduleData);

        // Obtener videos del módulo 1 ordenados por video_order
        const videosResult = await pool.query(`
            SELECT 
                id,
                module_id,
                video_title,
                youtube_video_id,
                duration_seconds,
                description,
                thumbnail_url,
                transcript_text,
                video_order,
                created_at,
                updated_at,
                descripcion_actividad,
                prompts_actividad,
                resumen
            FROM module_videos 
            WHERE module_id = $1 
            ORDER BY video_order ASC
        `, [moduleData.id]);

        const videos = videosResult.rows;
        console.log(`✅ ${videos.length} videos obtenidos del módulo 1`);
        
        // Obtener actividad_detalle para todos los videos
        console.log('📋 Consultando actividad_detalle para los videos...');
        let actividadDetalleData = [];
        
        if (videos.length > 0) {
            const videoIds = videos.map(video => video.id);
            
            try {
                const actividadResult = await pool.query(`
                    SELECT id, actividad_id, seccion, orden, tipo, contenido 
                    FROM actividad_detalle 
                    WHERE actividad_id = ANY($1)
                    ORDER BY actividad_id, seccion, orden
                `, [videoIds]);
                
                actividadDetalleData = actividadResult.rows;
                console.log(`📊 ${actividadDetalleData.length} registros de actividad_detalle encontrados`);
            } catch (actividadError) {
                console.warn('⚠️ Error consultando actividad_detalle (continuando con legacy):', actividadError.message);
            }
        }
        
        // Agregar progreso simulado por defecto y actividad_detalle
        const videosWithProgress = videos.map((video, index) => {
            // Encontrar actividad_detalle para este video
            const videoActividades = actividadDetalleData.filter(detalle => detalle.actividad_id === video.id);
            
            return {
                ...video,
                user_progress: {
                    current_time_seconds: 0,
                    completion_percentage: 0,
                    is_completed: false
                },
                actividad_detalle: videoActividades
            };
        });

        res.json({
            success: true,
            videos: videosWithProgress,
            module_id: moduleData.id,
            module_title: moduleData.title,
            total_videos: videos.length
        });

    } catch (error) {
        console.error('💥 Error en /api/courses/module1-videos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// Obtener estructura completa del curso
app.get('/api/courses/:courseId/full-structure', async (req, res) => {
    await coursesApi.getCourseFullStructure(req, res);
});

// Obtener módulo actual del usuario
app.get('/api/courses/:courseId/current-module/:userId', async (req, res) => {
    await coursesApi.getCurrentModule(req, res);
});

// Obtener datos de video de un módulo
app.get('/api/modules/:moduleId/video-data', async (req, res) => {
    await coursesApi.getModuleVideoData(req, res);
});

// Obtener estructura completa del curso (ENDPOINT FALTANTE)
app.get('/api/courses/:courseId/full-structure', async (req, res) => {
    await coursesApi.getCourseFullStructure(req, res);
});

// Obtener progreso del usuario en un curso
app.get('/api/users/:userId/progress/:courseId', async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        // Validar si userId es un UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(userId)) {
            console.error(`❌ UUID inválido: "${userId}"`);
            return res.status(400).json({
                success: false,
                error: 'ID de usuario inválido'
            });
        }
        
        await coursesApi.getUserProgress(req, res);
    } catch (error) {
        console.error('💥 Error en endpoint progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando UUID de usuario',
            details: error.message
        });
    }
});

// Actualizar progreso de video
app.post('/api/users/:userId/video-progress', async (req, res) => {
    await coursesApi.updateVideoProgress(req, res);
});

// Cambiar módulo actual
app.post('/api/users/:userId/switch-module', async (req, res) => {
    await coursesApi.switchModule(req, res);
});

// Obtener todos los videos de un módulo específico
app.get('/api/modules/:moduleId/videos', async (req, res) => {
    await coursesApi.getModuleVideos(req, res);
});

// Cambiar video actual del usuario
app.post('/api/users/:userId/switch-video', async (req, res) => {
    await coursesApi.switchVideo(req, res);
});

// =====================================================
// FIN ENDPOINTS DE CURSOS
// =====================================================

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`🚀 Lia IA — servidor iniciado en puerto ${PORT}`);
    console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📺 Socket.IO habilitado para chat del livestream`);
    console.log(`📧 Servicio de email: ${emailService.isConfigured() ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`🔐 Verificación de email: ✅ Habilitada`);
    
    // Iniciar servicio de limpieza automática de OTPs
    otpCleanupService.startAutoCleanup(15); // Limpiar cada 15 minutos
});

// Endpoint temporal para verificar perfiles disponibles en questions_catalog
app.get('/api/debug/profiles', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }
        
        const result = await pool.query(`
            SELECT DISTINCT perfil, COUNT(*) as count
            FROM questions_catalog 
            WHERE active = true 
            GROUP BY perfil 
            ORDER BY perfil
        `);
        
        res.json({
            profiles: result.rows,
            total_profiles: result.rows.length
        });
        
    } catch (error) {
        console.error('Error obteniendo perfiles:', error);
        res.status(500).json({ 
            error: 'Error obteniendo perfiles',
            details: error.message
        });
    }
});

// ============================================================================
// VIDEO SDK ENDPOINTS - APR-31: Endpoints para iniciar/detener grabación
// ============================================================================

// Configuración del Video SDK
const VIDEO_SDK_API_KEY = process.env.VIDEO_SDK_API_KEY;
const VIDEO_SDK_SECRET_KEY = process.env.VIDEO_SDK_SECRET_KEY;
const VIDEO_SDK_BASE_URL = 'https://api.videosdk.live';

// Función para autenticar con Video SDK API
async function authenticateVideoSDK() {
    if (!VIDEO_SDK_API_KEY || !VIDEO_SDK_SECRET_KEY) {
        throw new Error('Video SDK credentials not configured');
    }
    
    // En un entorno real, aquí podrías implementar un sistema de tokens
    // Por ahora, usamos las credenciales directamente
    return {
        apiKey: VIDEO_SDK_API_KEY,
        secretKey: VIDEO_SDK_SECRET_KEY
    };
}

// Función para hacer requests a la API del Video SDK
async function makeVideoSDKRequest(endpoint, method = 'GET', body = null) {
    try {
        const credentials = await authenticateVideoSDK();
        const url = `${VIDEO_SDK_BASE_URL}${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${credentials.apiKey}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Video SDK API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en Video SDK request:', error);
        throw error;
    }
}

// Función para registrar logs de auditoría
async function logRecordingEvent(event, sessionId, userId, details = {}) {
    try {
        const logEntry = {
            event,
            sessionId,
            userId,
            timestamp: new Date().toISOString(),
            details,
            ip: req?.ip || 'unknown'
        };
        
        console.log(`📹 [VIDEO SDK] ${event}:`, logEntry);
        
        // Aquí podrías guardar en base de datos si es necesario
        // await pool.query('INSERT INTO recording_logs (event, session_id, user_id, details) VALUES ($1, $2, $3, $4)', 
        //     [event, sessionId, userId, JSON.stringify(details)]);
        
    } catch (error) {
        console.error('Error logging recording event:', error);
    }
}

// Endpoint para iniciar grabación
app.post('/api/videosdk/recording/start', authenticateRequest, async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ 
                error: 'sessionId es requerido',
                code: 'MISSING_SESSION_ID'
            });
        }
        
        // Validar que el usuario tiene permisos para iniciar grabación
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'UNAUTHORIZED'
            });
        }
        
        console.log(`🎬 Iniciando grabación para sesión: ${sessionId}, usuario: ${user.id}`);
        
        // Llamar a la API del Video SDK para iniciar grabación
        const recordingData = await makeVideoSDKRequest('/v2/recordings/start', 'POST', {
            sessionId: sessionId,
            // Otros parámetros según la documentación del Video SDK
        });
        
        // Registrar el evento
        await logRecordingEvent('recording_started', sessionId, user.id, {
            recordingId: recordingData.recordingId,
            status: recordingData.status
        });
        
        res.json({
            success: true,
            message: 'Grabación iniciada exitosamente',
            recordingId: recordingData.recordingId,
            status: recordingData.status,
            sessionId: sessionId
        });
        
    } catch (error) {
        console.error('Error iniciando grabación:', error);
        
        // Registrar el error
        await logRecordingEvent('recording_start_error', req.body.sessionId, req.user?.id, {
            error: error.message
        });
        
        res.status(500).json({
            error: 'Error al iniciar la grabación',
            details: error.message,
            code: 'RECORDING_START_ERROR'
        });
    }
});

// Endpoint para detener grabación
app.post('/api/videosdk/recording/stop', authenticateRequest, async (req, res) => {
    try {
        const { sessionId, recordingId, userId } = req.body;
        
        if (!sessionId || !recordingId) {
            return res.status(400).json({ 
                error: 'sessionId y recordingId son requeridos',
                code: 'MISSING_PARAMETERS'
            });
        }
        
        // Validar que el usuario tiene permisos para detener grabación
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'UNAUTHORIZED'
            });
        }
        
        console.log(`⏹️ Deteniendo grabación: ${recordingId}, sesión: ${sessionId}, usuario: ${user.id}`);
        
        // Llamar a la API del Video SDK para detener grabación
        const stopData = await makeVideoSDKRequest(`/v2/recordings/${recordingId}/stop`, 'POST', {
            sessionId: sessionId
        });
        
        // Registrar el evento
        await logRecordingEvent('recording_stopped', sessionId, user.id, {
            recordingId: recordingId,
            status: stopData.status,
            downloadUrl: stopData.downloadUrl
        });
        
        res.json({
            success: true,
            message: 'Grabación detenida exitosamente',
            recordingId: recordingId,
            status: stopData.status,
            downloadUrl: stopData.downloadUrl,
            sessionId: sessionId
        });
        
    } catch (error) {
        console.error('Error deteniendo grabación:', error);
        
        // Registrar el error
        await logRecordingEvent('recording_stop_error', req.body.sessionId, req.user?.id, {
            error: error.message,
            recordingId: req.body.recordingId
        });
        
        res.status(500).json({
            error: 'Error al detener la grabación',
            details: error.message,
            code: 'RECORDING_STOP_ERROR'
        });
    }
});

// Endpoint para obtener estado de grabación
app.get('/api/videosdk/recording/status/:recordingId', authenticateRequest, async (req, res) => {
    try {
        const { recordingId } = req.params;
        
        if (!recordingId) {
            return res.status(400).json({ 
                error: 'recordingId es requerido',
                code: 'MISSING_RECORDING_ID'
            });
        }
        
        // Validar autenticación
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'UNAUTHORIZED'
            });
        }
        
        console.log(`📊 Consultando estado de grabación: ${recordingId}`);
        
        // Llamar a la API del Video SDK para obtener estado
        const statusData = await makeVideoSDKRequest(`/v2/recordings/${recordingId}`);
        
        res.json({
            success: true,
            recordingId: recordingId,
            status: statusData.status,
            downloadUrl: statusData.downloadUrl,
            duration: statusData.duration,
            createdAt: statusData.createdAt,
            updatedAt: statusData.updatedAt
        });
        
    } catch (error) {
        console.error('Error obteniendo estado de grabación:', error);
        
        res.status(500).json({
            error: 'Error al obtener el estado de la grabación',
            details: error.message,
            code: 'RECORDING_STATUS_ERROR'
        });
    }
});

// Endpoint para listar grabaciones de una sesión
app.get('/api/videosdk/recordings/:sessionId', authenticateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ 
                error: 'sessionId es requerido',
                code: 'MISSING_SESSION_ID'
            });
        }
        
        // Validar autenticación
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'UNAUTHORIZED'
            });
        }
        
        console.log(`📋 Listando grabaciones para sesión: ${sessionId}`);
        
        // Llamar a la API del Video SDK para listar grabaciones
        const recordingsData = await makeVideoSDKRequest(`/v2/recordings?sessionId=${sessionId}`);
        
        res.json({
            success: true,
            sessionId: sessionId,
            recordings: recordingsData.recordings || [],
            total: recordingsData.total || 0
        });
        
    } catch (error) {
        console.error('Error listando grabaciones:', error);
        
        res.status(500).json({
            error: 'Error al listar las grabaciones',
            details: error.message,
            code: 'RECORDINGS_LIST_ERROR'
        });
    }
});

// Endpoint para listar todas las grabaciones con permisos
app.get('/api/videosdk/recordings', authenticateRequest, async (req, res) => {
    try {
        // Validar autenticación
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'UNAUTHORIZED'
            });
        }

        console.log(`📋 Listando todas las grabaciones para usuario: ${user.id}`);
        
        // Obtener el perfil del usuario para determinar permisos
        const userPermissions = await getUserRecordingPermissions(user.id);
        
        // Mock data con permisos aplicados - reemplazar con llamadas reales al Video SDK
        const allRecordings = await getRecordingsWithPermissions(user.id, userPermissions);
        
        res.json({
            success: true,
            recordings: allRecordings,
            total: allRecordings.length,
            permissions: userPermissions
        });
        
    } catch (error) {
        console.error('Error listando grabaciones:', error);
        
        res.status(500).json({
            error: 'Error al listar las grabaciones',
            details: error.message,
            code: 'RECORDINGS_LIST_ERROR'
        });
    }
});

// Endpoint para descargar grabación con verificación de permisos
app.get('/api/videosdk/recording/:recordingId/download', authenticateRequest, async (req, res) => {
    try {
        const { recordingId } = req.params;
        
        if (!recordingId) {
            return res.status(400).json({ 
                error: 'recordingId es requerido',
                code: 'MISSING_RECORDING_ID'
            });
        }

        // Validar autenticación
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'UNAUTHORIZED'
            });
        }

        console.log(`📥 Solicitud de descarga para grabación: ${recordingId}, usuario: ${user.id}`);
        
        // Verificar permisos de descarga
        const hasDownloadPermission = await checkDownloadPermission(user.id, recordingId);
        if (!hasDownloadPermission) {
            return res.status(403).json({ 
                error: 'No tienes permisos para descargar esta grabación',
                code: 'DOWNLOAD_PERMISSION_DENIED'
            });
        }

        // Obtener información de la grabación desde Video SDK
        const recordingData = await makeVideoSDKRequest(`/v2/recordings/${recordingId}`);
        
        if (!recordingData.downloadUrl) {
            return res.status(404).json({ 
                error: 'URL de descarga no disponible',
                code: 'DOWNLOAD_URL_NOT_AVAILABLE'
            });
        }

        // Log de descarga para auditoría
        await logRecordingEvent('recording_downloaded', recordingData.sessionId, user.id, {
            recordingId: recordingId,
            downloadUrl: recordingData.downloadUrl
        });

        res.json({
            success: true,
            recordingId: recordingId,
            downloadUrl: recordingData.downloadUrl,
            filename: `recording_${recordingId}.mp4`,
            message: 'Descarga autorizada'
        });
        
    } catch (error) {
        console.error('Error procesando descarga:', error);
        
        res.status(500).json({
            error: 'Error al procesar la descarga',
            details: error.message,
            code: 'DOWNLOAD_PROCESSING_ERROR'
        });
    }
});

// Función helper para obtener permisos de grabación del usuario
async function getUserRecordingPermissions(userId) {
    try {
        // Obtener perfil del usuario desde Supabase
        if (!supabase) return { canView: true, canDownload: false, role: 'student' };
        
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, permissions')
            .eq('user_id', userId)
            .single();
        
        const userRole = profile?.role || 'student';
        
        // Definir permisos basados en el rol
        const permissions = {
            canView: true, // Todos los usuarios autenticados pueden ver
            canDownload: ['admin', 'instructor', 'premium'].includes(userRole),
            role: userRole,
            canViewAll: ['admin', 'instructor'].includes(userRole) // Solo admin e instructor ven todas las grabaciones
        };
        
        return permissions;
    } catch (error) {
        console.error('Error obteniendo permisos de usuario:', error);
        // Permisos por defecto en caso de error
        return { canView: true, canDownload: false, role: 'student', canViewAll: false };
    }
}

// Función helper para obtener grabaciones con permisos aplicados
async function getRecordingsWithPermissions(userId, permissions) {
    try {
        // Mock data - en producción, llamar a Video SDK API
        const mockRecordings = [
            {
                recordingId: 'rec_001',
                sessionId: 'ses_chatbot_101',
                sessionName: 'Sesión Chatbot IA - Módulo 1',
                date: new Date('2024-01-15T14:30:00Z').toISOString(),
                duration: 3600,
                size: 245760000,
                status: 'available',
                downloadUrl: 'https://example.com/recordings/rec_001.mp4',
                thumbnailUrl: 'https://example.com/thumbnails/rec_001.jpg'
            },
            {
                recordingId: 'rec_002',
                sessionId: 'ses_genai_201',
                sessionName: 'GenAI Workshop - Avanzado',
                date: new Date('2024-01-14T10:00:00Z').toISOString(),
                duration: 5400,
                size: 367001600,
                status: 'available',
                downloadUrl: 'https://example.com/recordings/rec_002.mp4',
                thumbnailUrl: 'https://example.com/thumbnails/rec_002.jpg'
            },
            {
                recordingId: 'rec_003',
                sessionId: 'ses_workshop_301',
                sessionName: 'Taller Práctico IA',
                date: new Date('2024-01-13T16:15:00Z').toISOString(),
                duration: 2700,
                status: 'processing',
                size: 0,
                downloadUrl: null,
                thumbnailUrl: null
            }
        ];

        // Aplicar permisos a cada grabación
        return mockRecordings.map(recording => ({
            ...recording,
            canDownload: permissions.canDownload && recording.status === 'available' && recording.downloadUrl,
            canView: permissions.canView && recording.status === 'available'
        }));
    } catch (error) {
        console.error('Error obteniendo grabaciones:', error);
        return [];
    }
}

// Función helper para verificar permisos de descarga específicos
async function checkDownloadPermission(userId, recordingId) {
    try {
        // Obtener permisos del usuario
        const permissions = await getUserRecordingPermissions(userId);
        
        if (!permissions.canDownload) {
            return false;
        }

        // Verificar que la grabación existe y está disponible
        // En producción, verificar con Video SDK API
        const recordingData = { status: 'available', downloadUrl: 'https://example.com/recording.mp4' };
        
        return recordingData.status === 'available' && recordingData.downloadUrl;
    } catch (error) {
        console.error('Error verificando permisos de descarga:', error);
        return false;
    }
}

// ============================================================================
// VIDEO SDK JWT ENDPOINT - APR-28: Endpoint para generar JWT con role_type
// ============================================================================

// Endpoint para generar JWT de Video SDK
app.post('/api/videosdk/jwt', async (req, res) => {
    try {
        const { sessionName, userName, roleType = 0 } = req.body;
        
        // Validar parámetros requeridos
        if (!sessionName || !userName) {
            return res.status(400).json({ 
                error: 'sessionName y userName son requeridos',
                code: 'MISSING_PARAMETERS'
            });
        }
        
        // Validar que el usuario está autenticado
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'UNAUTHORIZED'
            });
        }
        
        // Validar roleType (0 = user, 1 = host)
        if (roleType !== 0 && roleType !== 1) {
            return res.status(400).json({ 
                error: 'roleType debe ser 0 (user) o 1 (host)',
                code: 'INVALID_ROLE_TYPE'
            });
        }
        
        // Verificar permisos para role_type:1 (host)
        if (roleType === 1) {
            // Aquí puedes agregar lógica para verificar si el usuario tiene permisos de host
            // Por ejemplo, verificar si es instructor, administrador, etc.
            const hasHostPermissions = await checkHostPermissions(user.id);
            if (!hasHostPermissions) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para ser host',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }
        }
        
        console.log(`🔐 Generando JWT para sesión: ${sessionName}, usuario: ${userName}, rol: ${roleType}`);
        
        // Generar passcode aleatorio para la sesión
        const sessionPasscode = generateSessionPasscode();
        
        // Crear payload del JWT según especificación del Video SDK
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            app_key: VIDEO_SDK_API_KEY,
            tpc: sessionName,
            role_type: roleType,
            iat: now,
            exp: now + 3600, // Expira en 1 hora
            version: 2
        };
        
        // Firmar el JWT con el secret key del Video SDK
        const jwtToken = jwt.sign(payload, VIDEO_SDK_SECRET_KEY, { 
            algorithm: 'HS256',
            expiresIn: '1h'
        });
        
        // Registrar el evento de generación de JWT
        console.log(`✅ JWT generado exitosamente para usuario: ${user.id}, sesión: ${sessionName}`);
        
        res.json({
            success: true,
            jwt: jwtToken,
            sessionName: sessionName,
            userName: userName,
            sessionPasscode: sessionPasscode,
            roleType: roleType,
            expiresAt: new Date((now + 3600) * 1000).toISOString()
        });
        
    } catch (error) {
        console.error('Error generando JWT de Video SDK:', error);
        
        res.status(500).json({
            error: 'Error al generar el JWT',
            details: error.message,
            code: 'JWT_GENERATION_ERROR'
        });
    }
});

// Función para verificar permisos de host
async function checkHostPermissions(userId) {
    try {
        // Verificar si el usuario tiene permisos de host en la base de datos
        if (!pool) {
            console.warn('⚠️ Base de datos no disponible, permitiendo host por defecto');
            return true; // En desarrollo, permitir por defecto
        }
        
        const result = await pool.query(`
            SELECT cargo_rol 
            FROM users 
            WHERE id = $1 AND active = true
        `, [userId]);
        
        if (result.rows.length === 0) {
            return false;
        }
        
        const userRole = result.rows[0].cargo_rol;
        
        // Permitir host a instructores y administradores
        const allowedRoles = ['instructor', 'administrador', 'admin'];
        return allowedRoles.includes(userRole?.toLowerCase());
        
    } catch (error) {
        console.error('Error verificando permisos de host:', error);
        return false;
    }
}

// Función para generar passcode de sesión
function generateSessionPasscode() {
    // Generar un passcode de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== ZOOM VIDEO SDK ENDPOINTS ===== 

// Obtener configuración de sesión de Zoom
app.get('/api/zoom/session-config', authenticateRequest, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Verificar rol de usuario para Zoom
        const userRole = await getUserZoomRole(user.id);
        
        // Por ahora, generar configuración mock para desarrollo
        // TODO: Implementar generación real de JWT signature para Zoom SDK
        const sessionConfig = {
            signature: generateZoomSignature('test-session', userRole === 'host' ? 1 : 0),
            meetingNumber: 'test-meeting-123',
            userName: user.username || user.display_name || 'Usuario',
            topic: 'Sesión de Coach LIA',
            passWord: '',
            userRole: userRole
        };

        console.log(`📹 Configuración de sesión Zoom generada para usuario: ${user.id}, rol: ${userRole}`);
        
        res.json(sessionConfig);
        
    } catch (error) {
        console.error('Error obteniendo configuración de sesión Zoom:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Verificar permisos de usuario para Zoom
app.get('/api/zoom/user-permissions/:userId', authenticateRequest, async (req, res) => {
    try {
        const { userId } = req.params;
        const requestingUser = req.user;
        
        // Verificar que el usuario puede acceder a esta información
        if (requestingUser.id !== parseInt(userId) && await getUserZoomRole(requestingUser.id) !== 'host') {
            return res.status(403).json({ error: 'No tienes permisos para acceder a esta información' });
        }

        const userRole = await getUserZoomRole(userId);
        const isHost = userRole === 'host';
        
        res.json({
            canRecord: isHost,
            canMuteOthers: isHost,
            canScreenShare: isHost,
            canManageParticipants: isHost,
            userRole: userRole
        });
        
    } catch (error) {
        console.error('Error verificando permisos de usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear nueva sesión de Zoom
app.post('/api/zoom/session', authenticateRequest, async (req, res) => {
    try {
        const { title, description, startTime } = req.body;
        const hostId = req.user.id;
        
        // Verificar que el usuario sea host
        const userRole = await getUserZoomRole(hostId);
        if (userRole !== 'host') {
            return res.status(403).json({ error: 'Solo los hosts pueden crear sesiones' });
        }
        
        const sessionId = `zoom_${Date.now()}`;
        
        // Si hay base de datos disponible, guardar la sesión
        if (pool) {
            try {
                const result = await pool.query(`
                    INSERT INTO zoom_sessions (session_id, host_id, title, description, start_time, status)
                    VALUES ($1, $2, $3, $4, $5, 'scheduled') RETURNING *
                `, [sessionId, hostId, title, description, startTime || new Date()]);
                
                console.log(`📹 Sesión de Zoom creada: ${sessionId} por usuario: ${hostId}`);
                res.json(result.rows[0]);
                
            } catch (dbError) {
                console.warn('⚠️ Error guardando sesión en BD, continuando sin persistencia:', dbError.message);
                // Continuar sin base de datos
                res.json({
                    session_id: sessionId,
                    host_id: hostId,
                    title: title,
                    description: description,
                    start_time: startTime || new Date(),
                    status: 'scheduled'
                });
            }
        } else {
            // Sin base de datos, devolver configuración temporal
            res.json({
                session_id: sessionId,
                host_id: hostId,
                title: title,
                description: description,
                start_time: startTime || new Date(),
                status: 'scheduled'
            });
        }
        
    } catch (error) {
        console.error('Error creando sesión de Zoom:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Unirse a sesión de Zoom
app.post('/api/zoom/join/:sessionId', authenticateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        // Verificar si la sesión existe (si hay BD disponible)
        if (pool) {
            try {
                const session = await pool.query('SELECT * FROM zoom_sessions WHERE session_id = $1', [sessionId]);
                if (session.rows.length === 0) {
                    return res.status(404).json({ error: 'Sesión no encontrada' });
                }
                
                // Registrar participación
                await pool.query(`
                    INSERT INTO zoom_participants (session_id, user_id, join_time)
                    VALUES ($1, $2, NOW()) ON CONFLICT (session_id, user_id) DO NOTHING
                `, [sessionId, userId]);
                
            } catch (dbError) {
                console.warn('⚠️ Error accediendo a BD para sesión, continuando:', dbError.message);
            }
        }
        
        console.log(`📹 Usuario ${userId} se unió a sesión: ${sessionId}`);
        res.json({ message: 'Unido a la sesión', sessionId });
        
    } catch (error) {
        console.error('Error uniéndose a sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Iniciar grabación (solo hosts)
app.post('/api/zoom/recording/start', authenticateRequest, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user.id;
        
        // Verificar permisos de host
        const userRole = await getUserZoomRole(userId);
        if (userRole !== 'host') {
            return res.status(403).json({ error: 'Solo los hosts pueden grabar' });
        }
        
        const recordingId = `rec_${sessionId}_${Date.now()}`;
        
        // Guardar en BD si está disponible
        if (pool) {
            try {
                await pool.query(`
                    INSERT INTO zoom_recordings (recording_id, session_id, host_id, start_time, status)
                    VALUES ($1, $2, $3, NOW(), 'recording')
                `, [recordingId, sessionId, userId]);
            } catch (dbError) {
                console.warn('⚠️ Error guardando grabación en BD:', dbError.message);
            }
        }
        
        console.log(`🎥 Grabación iniciada: ${recordingId} por usuario: ${userId}`);
        res.json({ recordingId, status: 'recording_started' });
        
    } catch (error) {
        console.error('Error iniciando grabación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Detener grabación
app.post('/api/zoom/recording/stop', authenticateRequest, async (req, res) => {
    try {
        const { recordingId } = req.body;
        const userId = req.user.id;
        
        // Verificar permisos
        const userRole = await getUserZoomRole(userId);
        if (userRole !== 'host') {
            return res.status(403).json({ error: 'Solo los hosts pueden controlar grabaciones' });
        }
        
        // Actualizar en BD si está disponible
        if (pool) {
            try {
                await pool.query(`
                    UPDATE zoom_recordings 
                    SET end_time = NOW(), status = 'completed' 
                    WHERE recording_id = $1 AND host_id = $2
                `, [recordingId, userId]);
            } catch (dbError) {
                console.warn('⚠️ Error actualizando grabación en BD:', dbError.message);
            }
        }
        
        console.log(`🎥 Grabación finalizada: ${recordingId}`);
        res.json({ recordingId, status: 'recording_stopped' });
        
    } catch (error) {
        console.error('Error deteniendo grabación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función para obtener rol de Zoom del usuario
async function getUserZoomRole(userId) {
    try {
        if (!pool) {
            console.warn('⚠️ BD no disponible, asignando rol participant por defecto');
            return 'participant'; // Por defecto en modo desarrollo
        }
        
        const result = await pool.query('SELECT role_zoom FROM users WHERE id = $1', [userId]);
        
        if (result.rows.length === 0) {
            return 'participant'; // Por defecto si no existe el usuario
        }
        
        return result.rows[0].role_zoom || 'participant';
        
    } catch (error) {
        console.error('Error obteniendo rol de Zoom:', error);
        return 'participant'; // Por defecto en caso de error
    }
}

// Función mock para generar signature de Zoom (temporal)
function generateZoomSignature(sessionName, roleType) {
    // Esta es una implementación temporal para desarrollo
    // En producción, necesitarás implementar la generación real del JWT signature
    // usando tu Zoom SDK Key y Secret
    
    const timestamp = Date.now();
    const mockSignature = `mock_signature_${timestamp}_${sessionName}_${roleType}`;
    
    console.log(`🔐 Generando signature mock de Zoom: ${mockSignature}`);
    return mockSignature;
}

// =====================================================
// RUTAS DE COMUNIDAD
// =====================================================

// GET /api/community/questions - Obtener preguntas de la comunidad
app.get('/api/community/questions', async (req, res) => {
    try {
        const { filter = 'all', sort = 'recent', course_id, module_id } = req.query;
        
        console.log(`📋 Obteniendo preguntas - Filtro: ${filter}, Orden: ${sort}`);
        
        if (!pool) {
            return res.status(500).json({ 
                success: false,
                error: 'Base de datos no disponible' 
            });
        }
        
        // Construir query base
        let query = `
            SELECT q.*, u.username, u.display_name, u.first_name, u.email,
                   u.profile_picture_url as avatar_url
            FROM community_questions q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        // Aplicar filtros
        if (course_id) {
            params.push(course_id);
            query += ` AND q.course_id = $${params.length}`;
        }
        if (module_id) {
            params.push(module_id);
            query += ` AND q.module_id = $${params.length}`;
        }
        
        if (filter === 'unanswered') {
            query += ` AND q.answers_count = 0`;
        } else if (filter === 'answered') {
            query += ` AND q.answers_count > 0`;
        } else if (filter === 'featured') {
            query += ` AND q.is_featured = true`;
        }
        
        // Aplicar ordenamiento
        if (sort === 'votes') {
            query += ` ORDER BY q.votes_count DESC`;
        } else if (sort === 'answers') {
            query += ` ORDER BY q.answers_count DESC`;
        } else if (sort === 'views') {
            query += ` ORDER BY q.views_count DESC`;
        } else { // recent
            query += ` ORDER BY q.created_at DESC`;
        }
        
        query += ` LIMIT 50`; // Límite de 50 preguntas
        
        const result = await pool.query(query, params);
        
        // Formatear respuesta para compatibilidad con el frontend
        const questions = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            tags: row.tags || [],
            votes_count: row.votes_count || 0,
            answers_count: row.answers_count || 0,
            views_count: row.views_count || 0,
            is_answered: row.is_answered || false,
            is_featured: row.is_featured || false,
            created_at: row.created_at,
            updated_at: row.updated_at,
            course_id: row.course_id,
            module_id: row.module_id,
            users: {
                id: row.user_id,
                name: row.display_name || row.first_name || row.username || 'Usuario',
                username: row.username,
                avatar_url: row.avatar_url || '/assets/images/default-avatar.svg'
            }
        }));
        
        console.log(`✅ ${questions.length} preguntas obtenidas`);
        res.json({
            success: true,
            data: questions
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo preguntas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// POST /api/community/questions - Crear nueva pregunta
app.post('/api/community/questions', async (req, res) => {
    try {
        console.log('📝 === INICIO CREACIÓN PREGUNTA ===');
        console.log('📋 Headers recibidos:', req.headers);
        console.log('📋 Body recibido:', req.body);
        
        const { title, content, tags, course_id, module_id, user_id } = req.body;
        
        console.log('📝 Datos extraídos:', { 
            title: title?.substring(0, 50) + '...', 
            content: content?.substring(0, 50) + '...', 
            tags, 
            course_id, 
            module_id, 
            user_id 
        });
        
        // Validar datos requeridos
        if (!title || !content || !user_id) {
            console.log('❌ Validación fallida - datos faltantes');
            return res.status(400).json({
                success: false,
                error: 'Datos requeridos faltantes',
                message: 'Título, contenido y usuario son requeridos',
                received: { 
                    title: !!title, 
                    content: !!content, 
                    user_id: !!user_id 
                }
            });
        }
        
        if (!pool) {
            console.log('❌ Error: Pool de base de datos no disponible');
            return res.status(500).json({ 
                success: false,
                error: 'Base de datos no disponible' 
            });
        }
        
        console.log('🗃️ Pool de base de datos disponible, procediendo con INSERT...');
        
        // Crear la pregunta
        const result = await pool.query(`
            INSERT INTO community_questions 
            (title, content, tags, course_id, module_id, user_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `, [title.trim(), content.trim(), tags || [], course_id, module_id, user_id]);
        
        console.log('📊 Resultado de INSERT:', {
            rowCount: result.rowCount,
            hasRows: result.rows.length > 0,
            questionId: result.rows[0]?.id
        });
        
        if (result.rows.length === 0) {
            throw new Error('No se pudo crear la pregunta');
        }
        
        const question = result.rows[0];
        
        // Obtener datos del usuario para la respuesta
        const userResult = await pool.query(`
            SELECT username, display_name, first_name, profile_picture_url 
            FROM users WHERE id = $1
        `, [user_id]);
        
        const userData = userResult.rows[0] || {};
        
        const responseData = {
            id: question.id,
            title: question.title,
            content: question.content,
            tags: question.tags || [],
            votes_count: 0,
            answers_count: 0,
            views_count: 0,
            created_at: question.created_at,
            users: {
                id: user_id,
                name: userData.display_name || userData.first_name || userData.username || 'Usuario',
                avatar_url: userData.profile_picture_url || '/assets/images/default-avatar.svg'
            }
        };
        
        console.log(`✅ Pregunta creada exitosamente: ${question.id}`);
        res.status(201).json({
            success: true,
            data: responseData,
            message: 'Pregunta creada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error creando pregunta:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando pregunta',
            details: error.message
        });
    }
});

// POST /api/community/answers - Crear nueva respuesta
app.post('/api/community/answers', async (req, res) => {
    try {
        console.log('📝 === INICIO CREACIÓN RESPUESTA ===');
        console.log('📋 Body recibido:', req.body);
        
        const { question_id, content, user_id } = req.body;
        
        // Validación de campos requeridos
        if (!question_id || !content || !user_id) {
            console.log('❌ Faltan campos obligatorios');
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: question_id, content, user_id'
            });
        }
        
        // Verificar que el pool esté disponible
        if (!pool) {
            console.log('❌ Pool de base de datos no disponible');
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        console.log('🗃️ Pool de base de datos disponible, procediendo con INSERT...');
        
        // Crear la respuesta
        const result = await pool.query(`
            INSERT INTO community_answers 
            (question_id, user_id, content, votes_count, created_at, updated_at)
            VALUES ($1, $2, $3, 0, NOW(), NOW())
            RETURNING *
        `, [question_id, user_id, content.trim()]);
        
        console.log('📊 Resultado de INSERT:', {
            rowCount: result.rowCount,
            hasRows: result.rows.length > 0,
            answerId: result.rows[0]?.id
        });
        
        if (result.rows.length === 0) {
            throw new Error('No se pudo crear la respuesta');
        }
        
        const answer = result.rows[0];
        
        // Obtener datos del usuario
        const userResult = await pool.query(`
            SELECT username, display_name, first_name, profile_picture_url 
            FROM users WHERE id = $1
        `, [user_id]);
        
        const userData = userResult.rows[0] || {};
        
        const responseData = {
            id: answer.id,
            question_id: answer.question_id,
            content: answer.content,
            votes_count: 0,
            created_at: answer.created_at,
            user: {
                id: user_id,
                name: userData.display_name || userData.first_name || userData.username || 'Usuario',
                avatar_url: userData.profile_picture_url || '/assets/images/default-avatar.svg'
            }
        };
        
        console.log(`✅ Respuesta creada exitosamente: ${answer.id}`);
        res.status(201).json({
            success: true,
            data: responseData,
            message: 'Respuesta creada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error creando respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando respuesta',
            details: error.message
        });
    }
});

// POST /api/community/comments - Crear nuevo comentario
app.post('/api/community/comments', async (req, res) => {
    try {
        console.log('💬 === INICIO CREACIÓN COMENTARIO ===');
        console.log('📋 Body recibido:', req.body);
        
        const { parent_type, parent_id, content, user_id } = req.body;
        
        // Validación de campos requeridos
        if (!parent_type || !parent_id || !content || !user_id) {
            console.log('❌ Faltan campos obligatorios');
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: parent_type, parent_id, content, user_id'
            });
        }
        
        // Verificar que el parent_type sea válido
        if (!['question', 'answer'].includes(parent_type)) {
            return res.status(400).json({
                success: false,
                error: 'parent_type debe ser "question" o "answer"'
            });
        }
        
        // Verificar que el pool esté disponible
        if (!pool) {
            console.log('❌ Pool de base de datos no disponible');
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        console.log('🗃️ Pool de base de datos disponible, procediendo con INSERT...');
        
        // Crear el comentario
        const result = await pool.query(`
            INSERT INTO community_comments 
            (parent_type, parent_id, user_id, content, votes_count, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 0, NOW(), NOW())
            RETURNING *
        `, [parent_type, parent_id, user_id, content.trim()]);
        
        console.log('📊 Resultado de INSERT:', {
            rowCount: result.rowCount,
            hasRows: result.rows.length > 0,
            commentId: result.rows[0]?.id
        });
        
        if (result.rows.length === 0) {
            throw new Error('No se pudo crear el comentario');
        }
        
        const comment = result.rows[0];
        
        // Obtener datos del usuario
        const userResult = await pool.query(`
            SELECT username, display_name, first_name, profile_picture_url 
            FROM users WHERE id = $1
        `, [user_id]);
        
        const userData = userResult.rows[0] || {};
        
        const responseData = {
            id: comment.id,
            parent_type: comment.parent_type,
            parent_id: comment.parent_id,
            content: comment.content,
            votes_count: 0,
            created_at: comment.created_at,
            user: {
                id: user_id,
                name: userData.display_name || userData.first_name || userData.username || 'Usuario',
                avatar_url: userData.profile_picture_url || '/assets/images/default-avatar.svg'
            }
        };
        
        console.log(`✅ Comentario creado exitosamente: ${comment.id}`);
        res.status(201).json({
            success: true,
            data: responseData,
            message: 'Comentario creado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error creando comentario:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando comentario',
            details: error.message
        });
    }
});

// Función auxiliar para actualizar contadores de votos
async function updateVoteCount(target_type, target_id) {
    try {
        // Recalcular votos reales desde la tabla community_votes
        const voteCountResult = await pool.query(`
            SELECT 
                COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
                COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes,
                COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - 
                COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as total_votes
            FROM community_votes 
            WHERE target_type = $1 AND target_id = $2
        `, [target_type, target_id]);
        
        const voteData = voteCountResult.rows[0];
        const totalVotes = parseInt(voteData.total_votes) || 0;
        
        console.log(`📊 Recalculando votos para ${target_type} ${target_id}:`, {
            upvotes: voteData.upvotes,
            downvotes: voteData.downvotes, 
            total: totalVotes
        });
        
        // Actualizar el contador en la tabla correspondiente
        if (target_type === 'question') {
            await pool.query(`
                UPDATE community_questions 
                SET votes_count = $1, updated_at = NOW()
                WHERE id = $2
            `, [totalVotes, target_id]);
            console.log(`✅ community_questions actualizada con votes_count = ${totalVotes}`);
        } else if (target_type === 'answer') {
            await pool.query(`
                UPDATE community_answers 
                SET votes_count = $1, updated_at = NOW()
                WHERE id = $2
            `, [totalVotes, target_id]);
            console.log(`✅ community_answers actualizada con votes_count = ${totalVotes}`);
        } else if (target_type === 'comment') {
            await pool.query(`
                UPDATE community_comments 
                SET votes_count = $1, updated_at = NOW()
                WHERE id = $2
            `, [totalVotes, target_id]);
            console.log(`✅ community_comments actualizada con votes_count = ${totalVotes}`);
        }
        
        return totalVotes;
    } catch (error) {
        console.error('❌ Error actualizando contador de votos:', error);
        throw error;
    }
}

// POST /api/community/votes - Crear o actualizar voto
app.post('/api/community/votes', async (req, res) => {
    try {
        console.log('🗳️ === INICIO PROCESAMIENTO VOTO ===');
        console.log('📋 Body recibido:', req.body);
        
        const { user_id, target_type, target_id, vote_type } = req.body;
        
        // Validación de campos requeridos
        if (!user_id || !target_type || !target_id || !vote_type) {
            console.log('❌ Faltan campos obligatorios');
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: user_id, target_type, target_id, vote_type'
            });
        }
        
        // Validar tipos permitidos
        if (!['question', 'answer', 'comment'].includes(target_type)) {
            return res.status(400).json({
                success: false,
                error: 'target_type debe ser "question", "answer" o "comment"'
            });
        }
        
        if (!['upvote', 'downvote'].includes(vote_type)) {
            return res.status(400).json({
                success: false,
                error: 'vote_type debe ser "upvote" o "downvote"'
            });
        }
        
        // Verificar que el pool esté disponible
        if (!pool) {
            console.log('❌ Pool de base de datos no disponible');
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        console.log('🗃️ Pool de base de datos disponible, procesando voto...');
        
        // Verificar si el usuario ya votó en este item
        const existingVoteResult = await pool.query(`
            SELECT * FROM community_votes 
            WHERE user_id = $1 AND target_type = $2 AND target_id = $3
        `, [user_id, target_type, target_id]);
        
        let action = '';
        let voteData = null;
        
        if (existingVoteResult.rows.length > 0) {
            const existingVote = existingVoteResult.rows[0];
            
            if (existingVote.vote_type === vote_type) {
                // El usuario está quitando su voto (toggle)
                await pool.query(`
                    DELETE FROM community_votes 
                    WHERE id = $1
                `, [existingVote.id]);
                
                action = 'removed';
                console.log(`🗳️ Voto removido: ${vote_type} en ${target_type} ${target_id}`);
            } else {
                // El usuario está cambiando su voto
                const updateResult = await pool.query(`
                    UPDATE community_votes 
                    SET vote_type = $1
                    WHERE id = $2
                    RETURNING *
                `, [vote_type, existingVote.id]);
                
                voteData = updateResult.rows[0];
                action = 'updated';
                console.log(`🗳️ Voto actualizado: ${vote_type} en ${target_type} ${target_id}`);
            }
        } else {
            // Crear nuevo voto
            const insertResult = await pool.query(`
                INSERT INTO community_votes 
                (user_id, target_type, target_id, vote_type, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING *
            `, [user_id, target_type, target_id, vote_type]);
            
            voteData = insertResult.rows[0];
            action = 'created';
            console.log(`🗳️ Nuevo voto creado: ${vote_type} en ${target_type} ${target_id}`);
        }
        
        // Actualizar contador de votos en la tabla correspondiente
        await updateVoteCount(target_type, target_id);
        
        const responseData = {
            action: action,
            vote_type: vote_type,
            target_type: target_type,
            target_id: target_id
        };
        
        if (voteData) {
            responseData.vote_id = voteData.id;
            responseData.created_at = voteData.created_at;
        }
        
        console.log(`✅ Voto procesado exitosamente: ${action}`);
        res.status(200).json({
            success: true,
            data: responseData,
            message: `Voto ${action === 'removed' ? 'removido' : action === 'updated' ? 'actualizado' : 'creado'} exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error procesando voto:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando voto',
            details: error.message
        });
    }
});

// POST /api/community/bookmarks - Toggle bookmark
app.post('/api/community/bookmarks', async (req, res) => {
    try {
        console.log('🔖 === INICIO PROCESAMIENTO BOOKMARK ===');
        console.log('📋 Body recibido:', req.body);
        
        const { user_id, question_id } = req.body;
        
        // Validación de campos requeridos
        if (!user_id || !question_id) {
            console.log('❌ Faltan campos obligatorios');
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: user_id, question_id'
            });
        }
        
        // Verificar que el pool esté disponible
        if (!pool) {
            console.log('❌ Pool de base de datos no disponible');
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        console.log('🗃️ Pool de base de datos disponible, procesando bookmark...');
        
        // Verificar si el bookmark ya existe
        const existingBookmarkResult = await pool.query(`
            SELECT * FROM community_bookmarks 
            WHERE user_id = $1 AND question_id = $2
        `, [user_id, question_id]);
        
        let action = '';
        let bookmarkData = null;
        
        if (existingBookmarkResult.rows.length > 0) {
            // Remover bookmark existente
            const existingBookmark = existingBookmarkResult.rows[0];
            await pool.query(`
                DELETE FROM community_bookmarks 
                WHERE id = $1
            `, [existingBookmark.id]);
            
            action = 'removed';
            console.log(`🔖 Bookmark removido para pregunta: ${question_id}`);
        } else {
            // Crear nuevo bookmark
            const insertResult = await pool.query(`
                INSERT INTO community_bookmarks 
                (user_id, question_id, created_at)
                VALUES ($1, $2, NOW())
                RETURNING *
            `, [user_id, question_id]);
            
            bookmarkData = insertResult.rows[0];
            action = 'created';
            console.log(`🔖 Nuevo bookmark creado para pregunta: ${question_id}`);
        }
        
        const responseData = {
            action: action,
            question_id: question_id,
            user_id: user_id
        };
        
        if (bookmarkData) {
            responseData.bookmark_id = bookmarkData.id;
            responseData.created_at = bookmarkData.created_at;
        }
        
        console.log(`✅ Bookmark procesado exitosamente: ${action}`);
        res.status(200).json({
            success: true,
            data: responseData,
            message: `Bookmark ${action === 'removed' ? 'removido' : 'creado'} exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error procesando bookmark:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando bookmark',
            details: error.message
        });
    }
});

// GET /api/community/questions/:questionId/answers - Obtener respuestas de una pregunta
app.get('/api/community/questions/:questionId/answers', async (req, res) => {
    try {
        console.log('📝 === OBTENIENDO RESPUESTAS ===');
        const { questionId } = req.params;
        const { sort = 'votes' } = req.query;
        
        console.log(`📋 Pregunta ID: ${questionId}, Orden: ${sort}`);
        
        // Verificar que el pool esté disponible
        if (!pool) {
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        // Construir query de ordenamiento
        let orderBy = 'a.created_at DESC';
        if (sort === 'votes') {
            orderBy = 'a.votes_count DESC, a.created_at DESC';
        } else if (sort === 'recent') {
            orderBy = 'a.created_at DESC';
        } else if (sort === 'oldest') {
            orderBy = 'a.created_at ASC';
        }
        
        // Obtener respuestas con datos del usuario
        const result = await pool.query(`
            SELECT a.*, 
                   u.username, u.display_name, u.first_name, u.profile_picture_url,
                   COALESCE(u.display_name, u.first_name, u.username, 'Usuario') as author_name
            FROM community_answers a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.question_id = $1
            ORDER BY ${orderBy}
        `, [questionId]);
        
        const answers = result.rows.map(answer => ({
            id: answer.id,
            question_id: answer.question_id,
            content: answer.content,
            votes_count: answer.votes_count || 0,
            is_accepted: answer.is_accepted || false,
            created_at: answer.created_at,
            author: {
                id: answer.user_id,
                name: answer.author_name,
                avatar_url: answer.profile_picture_url || '/assets/images/default-avatar.svg'
            }
        }));
        
        console.log(`✅ ${answers.length} respuestas encontradas`);
        res.json({
            success: true,
            data: answers,
            total: answers.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo respuestas:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo respuestas',
            details: error.message
        });
    }
});

// POST /api/community/questions/:questionId/answers - Crear respuesta para una pregunta específica
app.post('/api/community/questions/:questionId/answers', async (req, res) => {
    try {
        console.log('📝 === INICIO CREACIÓN RESPUESTA (NUEVA RUTA) ===');
        const { questionId } = req.params;
        const { content } = req.body;
        const userId = req.headers['x-user-id'] || req.body.user_id;

        console.log('📋 Body recibido:', req.body);
        console.log('📋 Question ID desde params:', questionId);
        console.log('📋 User ID desde headers/body:', userId);

        // Validación de campos requeridos
        if (!questionId || !content || !userId) {
            console.log('❌ Faltan campos obligatorios');
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: questionId (params), content, user_id (body o header)'
            });
        }
        
        // Verificar que el pool esté disponible
        if (!pool) {
            console.log('❌ Pool de base de datos no disponible');
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        console.log('🗃️ Pool de base de datos disponible, procediendo con validaciones...');
        
        // Verificar si el usuario existe o crearlo si es el usuario demo
        if (userId === '123e4567-e89b-12d3-a456-426614174000') {
            console.log('👤 Verificando/creando usuario demo...');
            const demoUserCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);

            if (demoUserCheck.rows.length === 0) {
                console.log('🔧 Creando usuario demo...');
                await pool.query(`
                    INSERT INTO users (id, username, display_name, email, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    ON CONFLICT (id) DO NOTHING
                `, [userId, 'usuario_demo', 'Usuario Demo', 'demo@example.com']);
                console.log('✅ Usuario demo creado');
            }
        } else {
            // Verificar que el usuario real existe
            const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
            if (userCheck.rows.length === 0) {
                console.log('❌ Usuario no encontrado:', userId);
                return res.status(400).json({
                    success: false,
                    error: 'Usuario no encontrado. Por favor inicia sesión nuevamente.'
                });
            }
        }
        
        // Verificar que la pregunta existe
        const questionCheck = await pool.query('SELECT id FROM community_questions WHERE id = $1', [questionId]);
        if (questionCheck.rows.length === 0) {
            console.log('❌ Pregunta no encontrada:', questionId);
            return res.status(400).json({
                success: false,
                error: 'Pregunta no encontrada'
            });
        }
        
        console.log('✅ Validaciones completadas, procediendo con INSERT...');
        
        // Crear la respuesta
        const result = await pool.query(`
            INSERT INTO community_answers
            (question_id, user_id, content, votes_count, created_at, updated_at)
            VALUES ($1, $2, $3, 0, NOW(), NOW())
            RETURNING *
        `, [questionId, userId, content.trim()]);
        
        console.log('📊 Resultado de INSERT:', {
            rowCount: result.rowCount,
            hasRows: result.rows.length > 0,
            answerId: result.rows[0]?.id
        });
        
        if (result.rowCount === 0) {
            throw new Error('No se pudo insertar la respuesta');
        }
        
        const answer = result.rows[0];
        
        // Obtener datos del usuario para la respuesta
        const userResult = await pool.query(`
            SELECT username, display_name, first_name, profile_picture_url
            FROM users
            WHERE id = $1
        `, [userId]);
        
        const userData = userResult.rows[0] || {};
        console.log('👤 Datos de usuario encontrados:', userData);
        
        // Preparar datos de respuesta
        const responseData = {
            id: answer.id,
            question_id: answer.question_id,
            content: answer.content,
            votes_count: answer.votes_count || 0,
            is_accepted: answer.is_accepted || false,
            created_at: answer.created_at,
            author: {
                id: answer.user_id,
                name: userData.display_name || userData.first_name || userData.username || 'Usuario',
                avatar_url: userData.profile_picture_url || '/assets/images/default-avatar.svg'
            }
        };
        
        console.log(`✅ Respuesta creada exitosamente: ${answer.id}`);
        res.status(201).json({
            success: true,
            data: responseData,
            message: 'Respuesta creada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error creando respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando respuesta',
            details: error.message
        });
    }
});

// GET /api/community/questions/:id - Obtener una pregunta específica
app.get('/api/community/questions/:id', async (req, res) => {
    try {
        console.log('📝 === OBTENIENDO PREGUNTA ESPECÍFICA ===');
        const { id } = req.params;
        
        if (!pool) {
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        const result = await pool.query(`
            SELECT q.*, u.username, u.display_name, u.first_name, u.profile_picture_url,
                   COALESCE(u.display_name, u.first_name, u.username, 'Usuario') as author_name
            FROM community_questions q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pregunta no encontrada'
            });
        }
        
        const question = result.rows[0];
        
        console.log(`✅ Pregunta obtenida: ${question.title}`);
        res.status(200).json({
            success: true,
            data: question
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo pregunta:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo pregunta',
            details: error.message
        });
    }
});

// GET /api/community/comments - Obtener comentarios por parent_type y parent_id
app.get('/api/community/comments', async (req, res) => {
    try {
        console.log('💬 === OBTENIENDO COMENTARIOS ===');
        const { parent_type, parent_id, sort = 'recent' } = req.query;
        
        console.log(`📋 Tipo: ${parent_type}, ID: ${parent_id}, Orden: ${sort}`);
        
        // Validar parámetros requeridos
        if (!parent_type || !parent_id) {
            return res.status(400).json({
                success: false,
                error: 'Faltan parámetros requeridos: parent_type, parent_id'
            });
        }
        
        // Verificar que el pool esté disponible
        if (!pool) {
            return res.status(500).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        // Construir query de ordenamiento
        let orderBy = 'c.created_at ASC'; // Comentarios generalmente van en orden cronológico
        if (sort === 'votes') {
            orderBy = 'c.votes_count DESC, c.created_at ASC';
        } else if (sort === 'recent') {
            orderBy = 'c.created_at DESC';
        }
        
        // Obtener comentarios con datos del usuario
        const result = await pool.query(`
            SELECT c.*, 
                   u.username, u.display_name, u.first_name, u.profile_picture_url,
                   COALESCE(u.display_name, u.first_name, u.username, 'Usuario') as author_name
            FROM community_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.parent_type = $1 AND c.parent_id = $2
            ORDER BY ${orderBy}
        `, [parent_type, parent_id]);
        
        const comments = result.rows.map(comment => ({
            id: comment.id,
            parent_type: comment.parent_type,
            parent_id: comment.parent_id,
            content: comment.content,
            votes_count: comment.votes_count || 0,
            created_at: comment.created_at,
            author: {
                id: comment.user_id,
                name: comment.author_name,
                avatar_url: comment.profile_picture_url || '/assets/images/default-avatar.svg'
            }
        }));
        
        console.log(`✅ ${comments.length} comentarios encontrados`);
        res.json({
            success: true,
            data: comments,
            total: comments.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo comentarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo comentarios',
            details: error.message
        });
    }
});

// =====================================================
// RUTAS DE PROGRESO DE CURSO
// Sistema integrado con course_progress y module_progress
// =====================================================

// =====================================================
// UNIFIED PROGRESS SYNC API - Endpoint centralizado
// =====================================================

// Validadores
class ProgressDataValidator {
    static validateUserId(userId) {
        if (!userId || typeof userId !== 'string') {
            return { valid: false, error: 'userId es requerido y debe ser string' };
        }
        if (userId.length < 3 || userId.length > 255) {
            return { valid: false, error: 'userId debe tener entre 3 y 255 caracteres' };
        }
        return { valid: true };
    }

    static validateCourseId(courseId) {
        if (!courseId || typeof courseId !== 'string') {
            return { valid: false, error: 'courseId es requerido y debe ser string' };
        }
        const validCourseIds = ['intro-to-ai', 'chatgpt-gemini'];
        if (!validCourseIds.includes(courseId)) {
            return { valid: false, error: `courseId debe ser uno de: ${validCourseIds.join(', ')}` };
        }
        return { valid: true };
    }

    static validateModuleData(moduleData) {
        if (!moduleData || typeof moduleData !== 'object') {
            return { valid: false, error: 'moduleData debe ser un objeto' };
        }
        const { module_number, video_progress_percentage } = moduleData;
        if (typeof module_number !== 'number' || module_number < 1 || module_number > 10) {
            return { valid: false, error: 'module_number debe ser un número entre 1 y 10' };
        }
        if (video_progress_percentage !== undefined) {
            if (typeof video_progress_percentage !== 'number' || video_progress_percentage < 0 || video_progress_percentage > 100) {
                return { valid: false, error: 'video_progress_percentage debe ser un número entre 0 y 100' };
            }
        }
        return { valid: true };
    }

    static validateProgressData(progressData) {
        if (!progressData || typeof progressData !== 'object') {
            return { valid: false, error: 'progressData debe ser un objeto' };
        }
        const errors = [];
        if (progressData.overall_progress_percentage !== undefined) {
            const val = progressData.overall_progress_percentage;
            if (typeof val !== 'number' || val < 0 || val > 100) {
                errors.push('overall_progress_percentage debe ser un número entre 0 y 100');
            }
        }
        if (progressData.modules !== undefined) {
            if (!Array.isArray(progressData.modules)) {
                errors.push('modules debe ser un array');
            } else {
                progressData.modules.forEach((module, index) => {
                    const validation = this.validateModuleData(module);
                    if (!validation.valid) {
                        errors.push(`Módulo ${index}: ${validation.error}`);
                    }
                });
            }
        }
        if (errors.length > 0) {
            return { valid: false, error: errors.join(', ') };
        }
        return { valid: true };
    }
}

// GET: Obtener progreso
app.get('/api/progress/sync', async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.headers['x-user-id'] || req.query.userId;
        const courseId = req.query.courseId || 'intro-to-ai';

        console.log(`📊 [Progress Sync] GET - Usuario: ${userId}, Curso: ${courseId}`);

        // Validar
        const userValidation = ProgressDataValidator.validateUserId(userId);
        if (!userValidation.valid) {
            return res.status(400).json({ success: false, error: userValidation.error });
        }

        const courseValidation = ProgressDataValidator.validateCourseId(courseId);
        if (!courseValidation.valid) {
            return res.status(400).json({ success: false, error: courseValidation.error });
        }

        await client.query('BEGIN');

        // Obtener el ID real del curso desde la tabla courses
        let actualCourseId = null;
        if (courseId === 'intro-to-ai' || courseId === 'chatgpt-gemini') {
            // Buscar curso por slug o título
            const courseQuery = await client.query(`
                SELECT id FROM courses 
                WHERE slug = 'introduccion-a-la-ia' OR title ILIKE '%introducción%' OR title ILIKE '%inteligencia artificial%'
                LIMIT 1
            `);
            if (courseQuery.rows.length > 0) {
                actualCourseId = courseQuery.rows[0].id;
                console.log(`✅ ID real del curso encontrado: ${actualCourseId}`);
            }
        } else if (courseId === 'intro-to-ai') {
            // Buscar curso por slug
            const courseQuery = await client.query(`
                SELECT id FROM courses 
                WHERE slug = 'introduccion-a-la-ia' OR title ILIKE '%introducción%'
                LIMIT 1
            `);
            if (courseQuery.rows.length > 0) {
                actualCourseId = courseQuery.rows[0].id;
                console.log(`✅ ID real del curso encontrado: ${actualCourseId}`);
            }
        }

        if (!actualCourseId) {
            console.log(`⚠️ No se encontró curso para identifier: ${courseId}`);
            return res.status(400).json({ success: false, error: 'Curso no encontrado' });
        }

        // Obtener o crear progreso
        let { rows } = await client.query(
            'SELECT * FROM course_progress WHERE user_id = $1 AND course_identifier = $2',
            [userId, courseId]
        );

        if (rows.length === 0) {
            console.log(`📝 Creando progreso inicial para ${userId}`);

            const { rows: newRows } = await client.query(`
                INSERT INTO course_progress (id, user_id, course_id, course_identifier, overall_progress_percentage, status, started_at, created_at, updated_at)
                VALUES ($1, $2, $3, $4, 0, 'not_started', NOW(), NOW(), NOW())
                RETURNING *
            `, [require('crypto').randomUUID(), userId, actualCourseId, courseId]);
            rows = newRows;
        }

        const courseProgressId = rows[0].id;

        // Obtener progreso completo con módulos
        const { rows: fullProgress } = await client.query(`
            SELECT
                cp.id as course_progress_id,
                cp.user_id,
                cp.course_identifier,
                cp.overall_progress_percentage,
                cp.status as course_status,
                cp.started_at as course_started_at,
                cp.completed_at as course_completed_at,
                cp.last_accessed_at,
                cp.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', mp.id,
                            'module_number', mp.module_number,
                            'module_identifier', mp.module_identifier,
                            'progress_percentage', mp.progress_percentage,
                            'video_progress_percentage', mp.video_progress_percentage,
                            'video_completed', mp.video_completed,
                            'last_video_position', mp.last_video_position,
                            'time_spent_minutes', mp.time_spent_minutes,
                            'status', mp.status,
                            'started_at', mp.started_at,
                            'completed_at', mp.completed_at,
                            'last_accessed_at', mp.last_accessed_at
                        ) ORDER BY mp.module_number
                    ) FILTER (WHERE mp.id IS NOT NULL),
                    '[]'::json
                ) as modules
            FROM course_progress cp
            LEFT JOIN module_progress mp ON mp.course_progress_id = cp.id AND mp.user_id = cp.user_id
            WHERE cp.user_id = $1 AND cp.course_identifier = $2
            GROUP BY cp.id
        `, [userId, courseId]);

        await client.query('COMMIT');

        console.log(`✅ Progreso obtenido exitosamente`);

        res.json({
            success: true,
            progress: fullProgress[0],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en GET /api/progress/sync:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo progreso',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// POST: Sincronizar progreso
app.post('/api/progress/sync', async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.headers['x-user-id'] || req.query.userId;
        const courseId = req.query.courseId || 'intro-to-ai';
        const progressData = req.body;

        console.log(`📤 [Progress Sync] POST - Usuario: ${userId}, Curso: ${courseId}`);

        // Validar
        const userValidation = ProgressDataValidator.validateUserId(userId);
        if (!userValidation.valid) {
            return res.status(400).json({ success: false, error: userValidation.error });
        }

        const courseValidation = ProgressDataValidator.validateCourseId(courseId);
        if (!courseValidation.valid) {
            return res.status(400).json({ success: false, error: courseValidation.error });
        }

        const dataValidation = ProgressDataValidator.validateProgressData(progressData);
        if (!dataValidation.valid) {
            return res.status(400).json({ success: false, error: 'Datos de progreso inválidos', details: dataValidation.error });
        }

        await client.query('BEGIN');

        // Obtener el ID real del curso desde la tabla courses
        let actualCourseId = null;
        if (courseId === 'intro-to-ai' || courseId === 'chatgpt-gemini') {
            // Buscar curso por slug o título
            const courseQuery = await client.query(`
                SELECT id FROM courses 
                WHERE slug = 'introduccion-a-la-ia' OR title ILIKE '%introducción%' OR title ILIKE '%inteligencia artificial%'
                LIMIT 1
            `);
            if (courseQuery.rows.length > 0) {
                actualCourseId = courseQuery.rows[0].id;
                console.log(`✅ ID real del curso encontrado: ${actualCourseId}`);
            }
        } else if (courseId === 'intro-to-ai') {
            // Buscar curso por slug
            const courseQuery = await client.query(`
                SELECT id FROM courses 
                WHERE slug = 'introduccion-a-la-ia' OR title ILIKE '%introducción%'
                LIMIT 1
            `);
            if (courseQuery.rows.length > 0) {
                actualCourseId = courseQuery.rows[0].id;
                console.log(`✅ ID real del curso encontrado: ${actualCourseId}`);
            }
        }

        if (!actualCourseId) {
            console.log(`⚠️ No se encontró curso para identifier: ${courseId}`);
            return res.status(400).json({ success: false, error: 'Curso no encontrado' });
        }

        // Obtener o crear progreso del curso
        let { rows } = await client.query(
            'SELECT * FROM course_progress WHERE user_id = $1 AND course_identifier = $2',
            [userId, courseId]
        );

        if (rows.length === 0) {

            const { rows: newRows } = await client.query(`
                INSERT INTO course_progress (id, user_id, course_id, course_identifier, overall_progress_percentage, status, started_at, created_at, updated_at)
                VALUES ($1, $2, $3, $4, 0, 'not_started', NOW(), NOW(), NOW())
                RETURNING *
            `, [require('crypto').randomUUID(), userId, actualCourseId, courseId]);
            rows = newRows;
        }

        const courseProgressId = rows[0].id;

        // Actualizar módulos si se proporcionaron
        if (progressData.modules && Array.isArray(progressData.modules)) {
            console.log(`📚 Procesando ${progressData.modules.length} módulos...`);
            
            for (const moduleData of progressData.modules) {
                console.log(`📖 Procesando módulo ${moduleData.module_number}:`, moduleData);
                
                // Verificar si el módulo ya existe
                const existingModule = await client.query(`
                    SELECT id FROM module_progress 
                    WHERE user_id = $1 AND course_progress_id = $2 AND module_number = $3
                `, [userId, courseProgressId, moduleData.module_number]);
                
                if (existingModule.rows.length === 0) {
                    // Crear nuevo módulo
                    console.log(`📝 Creando nuevo módulo ${moduleData.module_number}`);
                    
                    const newModuleId = require('crypto').randomUUID();
                    const moduleName = moduleData.module_name || `Módulo ${moduleData.module_number}`;
                    const moduleIdentifier = moduleData.module_identifier || `module-${moduleData.module_number}`;
                    
                    await client.query(`
                        INSERT INTO module_progress (
                            id, course_progress_id, user_id, module_number, module_name, module_identifier,
                            status, progress_percentage, video_progress_percentage, video_completed,
                            last_video_position, started_at, last_accessed_at, completed_at,
                            created_at, updated_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, NOW(), NOW()
                        )
                    `, [
                        newModuleId,
                        courseProgressId,
                        userId,
                        moduleData.module_number,
                        moduleName,
                        moduleIdentifier,
                        moduleData.status || 'not_started',
                        moduleData.progress_percentage || 0,
                        moduleData.video_progress_percentage || 0,
                        moduleData.video_completed || false,
                        moduleData.last_video_position || 0,
                        moduleData.status === 'in_progress' || moduleData.status === 'completed' ? 'NOW()' : null,
                        moduleData.status === 'completed' ? 'NOW()' : null
                    ]);
                    
                    console.log(`✅ Módulo ${moduleData.module_number} creado exitosamente`);
                } else {
                    // Actualizar módulo existente
                    console.log(`🔄 Actualizando módulo existente ${moduleData.module_number}`);
                    
                    const updates = [];
                    const values = [userId, courseProgressId, moduleData.module_number];
                    let paramCount = 3;

                    if (moduleData.video_progress_percentage !== undefined) {
                        updates.push(`video_progress_percentage = $${++paramCount}`);
                        values.push(moduleData.video_progress_percentage);
                    }
                    if (moduleData.progress_percentage !== undefined) {
                        updates.push(`progress_percentage = $${++paramCount}`);
                        values.push(moduleData.progress_percentage);
                    }
                    if (moduleData.last_video_position !== undefined) {
                        updates.push(`last_video_position = $${++paramCount}`);
                        values.push(moduleData.last_video_position);
                    }
                    if (moduleData.video_completed !== undefined) {
                        updates.push(`video_completed = $${++paramCount}`);
                        values.push(moduleData.video_completed);
                    }
                    if (moduleData.status !== undefined) {
                        updates.push(`status = $${++paramCount}`);
                        values.push(moduleData.status);
                    }

                    updates.push(`last_accessed_at = NOW()`, `updated_at = NOW()`);

                    if (moduleData.status === 'completed' || moduleData.video_completed === true) {
                        updates.push(`completed_at = COALESCE(completed_at, NOW())`);
                    }
                    if (moduleData.status === 'in_progress') {
                        updates.push(`started_at = COALESCE(started_at, NOW())`);
                    }

                    const query = `
                        UPDATE module_progress
                        SET ${updates.join(', ')}
                        WHERE user_id = $1 AND course_progress_id = $2 AND module_number = $3
                        RETURNING *
                    `;

                    await client.query(query, values);
                    console.log(`✅ Módulo ${moduleData.module_number} actualizado exitosamente`);
                }

                // Desbloquear siguiente módulo si completó
                if (moduleData.status === 'completed' || moduleData.video_completed === true) {
                    const nextModule = moduleData.module_number + 1;
                    await client.query(`
                        UPDATE module_progress
                        SET status = 'not_started', updated_at = NOW()
                        WHERE course_progress_id = $1 AND user_id = $2 AND module_number = $3 AND status = 'locked'
                    `, [courseProgressId, userId, nextModule]);
                }
            }
        }

        // Actualizar progreso general con el porcentaje enviado
        const overallProgress = progressData.overall_progress_percentage || 0;
        console.log(`📊 Progreso recibido: ${overallProgress}%`);
        console.log(`📊 Datos completos recibidos:`, JSON.stringify(progressData, null, 2));
        
        let newStatus = 'not_started';
        
        // Determinar status basado en el progreso
        if (overallProgress >= 100) {
            newStatus = 'completed';
        } else if (overallProgress > 0) {
            newStatus = 'in_progress';
        }
        
        console.log(`📊 Nuevo status calculado: ${newStatus}`);
        
        // Obtener status actual para no sobrescribir si ya está en 'in_progress'
        const currentStatusQuery = await client.query(
            'SELECT status FROM course_progress WHERE id = $1 AND user_id = $2',
            [courseProgressId, userId]
        );
        
        const currentStatus = currentStatusQuery.rows[0]?.status || 'not_started';
        console.log(`📊 Status actual en BD: ${currentStatus}`);
        
        // Solo actualizar status si es necesario
        let finalStatus = currentStatus;
        if (currentStatus === 'not_started' && newStatus === 'in_progress') {
            finalStatus = 'in_progress';
        } else if (newStatus === 'completed') {
            finalStatus = 'completed';
        }
        
        console.log(`📊 Status final a guardar: ${finalStatus}`);
        
        await client.query(`
            UPDATE course_progress 
            SET overall_progress_percentage = $3,
                status = $4,
                last_accessed_at = NOW(), 
                updated_at = NOW(),
                completed_at = CASE WHEN $4 = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END
            WHERE id = $1 AND user_id = $2
        `, [courseProgressId, userId, overallProgress, finalStatus]);
        
        console.log(`✅ Progreso actualizado en BD: ${overallProgress}% - Status: ${finalStatus}`);
        
        // Verificar que se guardó correctamente
        const verifyQuery = await client.query(
            'SELECT overall_progress_percentage, status FROM course_progress WHERE id = $1 AND user_id = $2',
            [courseProgressId, userId]
        );
        if (verifyQuery.rows.length > 0) {
            console.log(`✅ Verificación BD: ${verifyQuery.rows[0].overall_progress_percentage}% - ${verifyQuery.rows[0].status}`);
        }

        // Obtener progreso actualizado
        const { rows: fullProgress } = await client.query(`
            SELECT cp.id as course_progress_id, cp.user_id, cp.course_identifier, cp.overall_progress_percentage, cp.status as course_status,
                COALESCE(json_agg(json_build_object('module_number', mp.module_number, 'video_progress_percentage', mp.video_progress_percentage, 'status', mp.status) ORDER BY mp.module_number) FILTER (WHERE mp.id IS NOT NULL), '[]'::json) as modules
            FROM course_progress cp
            LEFT JOIN module_progress mp ON mp.course_progress_id = cp.id AND mp.user_id = cp.user_id
            WHERE cp.user_id = $1 AND cp.course_identifier = $2
            GROUP BY cp.id
        `, [userId, courseId]);

        await client.query('COMMIT');

        console.log(`✅ Progreso sincronizado exitosamente`);

        res.json({
            success: true,
            progress: fullProgress[0],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en POST /api/progress/sync:', error);
        res.status(500).json({
            success: false,
            error: 'Error sincronizando progreso',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// GET /api/users/:userId/course/:courseId/progress - Obtener progreso del usuario
app.get('/api/users/:userId/course/:courseId/progress', async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        console.log(`📊 Obteniendo progreso de usuario ${userId} en curso ${courseId}`);
        
        if (!pool) {
            return res.status(500).json({ 
                success: false,
                error: 'Base de datos no disponible' 
            });
        }
        
        // Usar la vista para obtener progreso completo
        const query = `
            SELECT * FROM user_course_progress_view 
            WHERE user_id = $1 AND course_identifier = $2
        `;
        
        const result = await pool.query(query, [userId, courseId]);
        
        if (result.rows.length === 0) {
            // Inicializar progreso si no existe con módulos del curso
            const courseModules = JSON.stringify([
                { "number": 1, "name": "¿Qué es la IA?", "identifier": "module-1-intro-ia", "video_id": "Yy_eZ65jzmo" },
                { "number": 2, "name": "Historia de la IA", "identifier": "module-2-history-ia", "video_id": "dhsy6epaJGs" },
                { "number": 3, "name": "Fundamentos del ML", "identifier": "module-3-ml-fundamentals", "video_id": "DvyOm9HeT-k" },
                { "number": 4, "name": "Redes Neuronales", "identifier": "module-4-neural-networks", "video_id": "oiKj0Z_Xnjc" },
                { "number": 5, "name": "Aplicaciones Prácticas", "identifier": "module-5-applications", "video_id": "HMoaRIbOaN0" }
            ]);
            
            const initResult = await pool.query(
                'SELECT initialize_course_progress($1, $2, $3::jsonb)',
                [userId, courseId, courseModules]
            );
            
            // Volver a obtener el progreso inicializado
            const newResult = await pool.query(query, [userId, courseId]);
            if (newResult.rows.length > 0) {
                console.log(`✅ Progreso inicializado para usuario ${userId}`);
                return res.json({
                    success: true,
                    data: newResult.rows[0]
                });
            }
        }
        
        console.log(`✅ Progreso obtenido para usuario ${userId}`);
        res.json({
            success: true,
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo progreso de usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// POST /api/users/:userId/course/:courseId/module/:moduleNumber/progress - Actualizar progreso de módulo
app.post('/api/users/:userId/course/:courseId/module/:moduleNumber/progress', async (req, res) => {
    try {
        const { userId, courseId, moduleNumber } = req.params;
        const { 
            video_progress_percentage, 
            last_video_position, 
            video_completed,
            time_watched_seconds,
            video_id 
        } = req.body;
        
        console.log(`📹 Actualizando progreso de video - Usuario: ${userId}, Módulo: ${moduleNumber}`, {
            video_progress_percentage,
            last_video_position,
            video_completed,
            video_id
        });
        
        if (!pool) {
            return res.status(500).json({ 
                success: false,
                error: 'Base de datos no disponible' 
            });
        }
        
        // Obtener o crear el course_progress_id
        let courseProgressQuery = `
            SELECT id FROM course_progress 
            WHERE user_id = $1 AND course_identifier = $2
        `;
        let courseProgressResult = await pool.query(courseProgressQuery, [userId, courseId]);
        
        let courseProgressId;
        if (courseProgressResult.rows.length === 0) {
            // Crear course_progress si no existe con módulos del curso
            const courseModules = JSON.stringify([
                { "number": 1, "name": "¿Qué es la IA?", "identifier": "module-1-intro-ia", "video_id": "Yy_eZ65jzmo" },
                { "number": 2, "name": "Historia de la IA", "identifier": "module-2-history-ia", "video_id": "dhsy6epaJGs" },
                { "number": 3, "name": "Fundamentos del ML", "identifier": "module-3-ml-fundamentals", "video_id": "DvyOm9HeT-k" },
                { "number": 4, "name": "Redes Neuronales", "identifier": "module-4-neural-networks", "video_id": "oiKj0Z_Xnjc" },
                { "number": 5, "name": "Aplicaciones Prácticas", "identifier": "module-5-applications", "video_id": "HMoaRIbOaN0" }
            ]);
            
            const initResult = await pool.query(
                'SELECT initialize_course_progress($1, $2, $3::jsonb) as id',
                [userId, courseId, courseModules]
            );
            courseProgressId = initResult.rows[0].id;
        } else {
            courseProgressId = courseProgressResult.rows[0].id;
        }
        
        // Actualizar o insertar module_progress
        const moduleProgressQuery = `
            INSERT INTO module_progress (
                course_progress_id, 
                user_id, 
                module_number, 
                module_name, 
                module_identifier,
                video_id,
                video_progress_percentage,
                last_video_position,
                video_completed,
                time_spent_minutes,
                progress_percentage,
                status,
                last_accessed_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            ON CONFLICT (user_id, course_progress_id, module_number) 
            DO UPDATE SET
                video_progress_percentage = EXCLUDED.video_progress_percentage,
                last_video_position = EXCLUDED.last_video_position,
                video_completed = EXCLUDED.video_completed,
                time_spent_minutes = COALESCE(module_progress.time_spent_minutes, 0) + COALESCE($10, 0),
                progress_percentage = EXCLUDED.progress_percentage,
                status = CASE 
                    WHEN EXCLUDED.video_completed = true THEN 'completed'
                    WHEN EXCLUDED.video_progress_percentage > 0 THEN 'in_progress'
                    ELSE module_progress.status
                END,
                last_accessed_at = NOW(),
                updated_at = NOW(),
                video_id = COALESCE(EXCLUDED.video_id, module_progress.video_id)
            RETURNING id, progress_percentage, status
        `;
        
        const progressPercentage = video_completed ? 100 : Math.max(video_progress_percentage || 0, 0);
        const timeWatchedMinutes = Math.ceil((time_watched_seconds || 0) / 60);
        
        const moduleProgressResult = await pool.query(moduleProgressQuery, [
            courseProgressId,
            userId,
            parseInt(moduleNumber),
            `Módulo ${moduleNumber}`,
            `module-${moduleNumber}`,
            video_id || null,
            video_progress_percentage || 0,
            last_video_position || 0,
            video_completed || false,
            timeWatchedMinutes,
            progressPercentage,
            video_completed ? 'completed' : (progressPercentage > 0 ? 'in_progress' : 'not_started')
        ]);
        
        console.log(`✅ Progreso de módulo actualizado:`, moduleProgressResult.rows[0]);
        
        res.json({
            success: true,
            data: {
                module_progress_id: moduleProgressResult.rows[0].id,
                progress_percentage: moduleProgressResult.rows[0].progress_percentage,
                status: moduleProgressResult.rows[0].status,
                video_progress_percentage,
                last_video_position,
                video_completed
            }
        });
        
    } catch (error) {
        console.error('❌ Error actualizando progreso de módulo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// GET /api/users/:userId/course/:courseId/modules/progress - Obtener progreso de todos los módulos
app.get('/api/users/:userId/course/:courseId/modules/progress', async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        console.log(`📊 Obteniendo progreso de todos los módulos - Usuario: ${userId}, Curso: ${courseId}`);
        
        if (!pool) {
            return res.status(500).json({ 
                success: false,
                error: 'Base de datos no disponible' 
            });
        }
        
        const query = `
            SELECT 
                mp.id,
                mp.module_number,
                mp.module_name,
                mp.module_identifier,
                mp.status,
                mp.progress_percentage,
                mp.video_id,
                mp.video_progress_percentage,
                mp.video_completed,
                mp.last_video_position,
                mp.time_spent_minutes,
                mp.started_at,
                mp.completed_at,
                mp.last_accessed_at
            FROM course_progress cp
            JOIN module_progress mp ON cp.id = mp.course_progress_id
            WHERE cp.user_id = $1 AND cp.course_identifier = $2
            ORDER BY mp.module_number ASC
        `;
        
        const result = await pool.query(query, [userId, courseId]);
        
        console.log(`✅ ${result.rows.length} módulos de progreso obtenidos`);
        
        res.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo progreso de módulos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// =====================================================
// ENDPOINTS DE COMUNIDAD
// =====================================================

// Obtener preguntas de la comunidad
app.get('/api/community/questions', async (req, res) => {
    try {
        const { 
            course_id, 
            module_id, 
            filter = 'all', 
            sort = 'recent', 
            page = 1, 
            limit = 20, 
            search 
        } = req.query;

        console.log(`📋 Obteniendo preguntas - Filtro: ${filter}, Orden: ${sort}`);

        if (!supabase) {
            // Datos demo si no hay Supabase configurado
            const demoQuestions = [
                {
                    id: 'demo-1',
                    user_id: 'user-1',
                    course_id: course_id || null,
                    module_id: module_id || null,
                    title: '¿Cuál es la diferencia entre Machine Learning y Deep Learning?',
                    content: 'Estoy viendo el curso de IA pero no me queda clara la diferencia entre estos conceptos...',
                    tags: ['machine-learning', 'deep-learning'],
                    votes_count: 15,
                    answers_count: 3,
                    views_count: 127,
                    is_answered: true,
                    is_featured: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    author: {
                        id: 'user-1',
                        username: 'carlos_estudiante',
                        display_name: 'Carlos Mendez',
                        avatar_url: null
                    }
                },
                {
                    id: 'demo-2',
                    user_id: 'user-2',
                    course_id: course_id || null,
                    module_id: module_id || null,
                    title: '¿Cómo funciona el procesamiento de lenguaje natural?',
                    content: 'Me gustaría entender mejor cómo las máquinas pueden entender texto...',
                    tags: ['nlp', 'procesamiento-lenguaje'],
                    votes_count: 8,
                    answers_count: 1,
                    views_count: 89,
                    is_answered: false,
                    is_featured: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    author: {
                        id: 'user-2',
                        username: 'ana_garcia',
                        display_name: 'Ana García',
                        avatar_url: null
                    }
                }
            ];

            return res.json({
                success: true,
                data: demoQuestions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: demoQuestions.length,
                    pages: 1
                }
            });
        }

        // Si hay Supabase configurado, usar la implementación real
        let query = supabase
            .from('community_questions')
            .select(`
                *,
                users:user_id (
                    id,
                    username,
                    display_name,
                    profile_picture_url
                )
            `);

        // Aplicar filtros
        if (course_id) query = query.eq('course_id', course_id);
        if (module_id) query = query.eq('module_id', module_id);
        if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

        // Aplicar filtros específicos
        switch (filter) {
            case 'unanswered':
                query = query.eq('is_answered', false);
                break;
            case 'answered':
                query = query.eq('is_answered', true);
                break;
            case 'featured':
                query = query.eq('is_featured', true);
                break;
        }

        // Aplicar ordenamiento
        switch (sort) {
            case 'votes':
                query = query.order('votes_count', { ascending: false });
                break;
            case 'answers':
                query = query.order('answers_count', { ascending: false });
                break;
            case 'views':
                query = query.order('views_count', { ascending: false });
                break;
            case 'recent':
            default:
                query = query.order('created_at', { ascending: false });
                break;
        }

        // Aplicar paginación
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: questions, error } = await query;

        if (error) {
            console.error('❌ Error obteniendo preguntas:', error);
            return res.status(500).json({ 
                error: 'Error obteniendo preguntas',
                details: error.message 
            });
        }

        // Obtener conteo total para paginación
        const { count } = await supabase
            .from('community_questions')
            .select('*', { count: 'exact', head: true });

        console.log(`✅ ${questions.length} preguntas obtenidas`);
        res.json({
            success: true,
            data: questions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('💥 Error en /api/community/questions:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Crear nueva pregunta en la comunidad
app.post('/api/community/questions', async (req, res) => {
    try {
        const { title, content, tags, course_id, module_id, user_id } = req.body;

        console.log(`📝 Creando nueva pregunta: "${title}"`);

        // Validar datos requeridos
        if (!title || !content || !user_id) {
            return res.status(400).json({ 
                error: 'Datos requeridos faltantes',
                message: 'Título, contenido y usuario son requeridos'
            });
        }

        if (!supabase) {
            // Respuesta demo si no hay Supabase
            const demoQuestion = {
                id: `demo-${Date.now()}`,
                title: title.trim(),
                content: content.trim(),
                tags: tags || [],
                course_id: course_id || null,
                module_id: module_id || null,
                user_id: user_id,
                votes_count: 0,
                answers_count: 0,
                views_count: 1,
                is_answered: false,
                is_featured: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                author: {
                    id: user_id,
                    username: 'usuario_demo',
                    display_name: 'Usuario Demo',
                    avatar_url: null
                }
            };

            console.log(`✅ Pregunta demo creada: ${demoQuestion.id}`);
            return res.status(201).json({
                success: true,
                data: demoQuestion,
                message: 'Pregunta creada exitosamente (modo demo)'
            });
        }

        // Crear la pregunta en Supabase
        const { data: question, error } = await supabase
            .from('community_questions')
            .insert({
                title: title.trim(),
                content: content.trim(),
                tags: tags || [],
                course_id: course_id || null,
                module_id: module_id || null,
                user_id: user_id
            })
            .select(`
                *,
                users:user_id (
                    id,
                    username,
                    display_name,
                    profile_picture_url
                )
            `)
            .single();

        if (error) {
            console.error('❌ Error creando pregunta:', error);
            return res.status(500).json({ 
                error: 'Error creando pregunta',
                details: error.message 
            });
        }

        console.log(`✅ Pregunta creada exitosamente: ${question.id}`);
        res.status(201).json({
            success: true,
            data: question,
            message: 'Pregunta creada exitosamente'
        });

    } catch (error) {
        console.error('💥 Error en POST /api/community/questions:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Obtener estadísticas de la comunidad
app.get('/api/community/stats', async (req, res) => {
    try {
        const { course_id, module_id } = req.query;

        console.log('📊 Obteniendo estadísticas de comunidad');

        if (!supabase) {
            // Estadísticas demo
            const demoStats = {
                total_questions: 15,
                answered_questions: 12,
                total_answers: 28,
                total_users: 8,
                most_active_users: [
                    {
                        user_id: 'user-1',
                        full_name: 'Ana García',
                        questions_count: 3,
                        answers_count: 8,
                        is_instructor: true
                    },
                    {
                        user_id: 'user-2',
                        full_name: 'Carlos Mendez',
                        questions_count: 5,
                        answers_count: 4,
                        is_instructor: false
                    }
                ],
                popular_tags: [
                    { tag: 'machine-learning', count: 8 },
                    { tag: 'deep-learning', count: 5 },
                    { tag: 'nlp', count: 3 }
                ]
            };

            return res.json({
                success: true,
                data: demoStats
            });
        }

        // Implementación real con Supabase aquí...
        res.json({
            success: true,
            data: {
                total_questions: 0,
                answered_questions: 0,
                total_answers: 0,
                total_users: 0,
                most_active_users: [],
                popular_tags: []
            }
        });

    } catch (error) {
        console.error('💥 Error en /api/community/stats:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// POST /api/community/questions/:id/vote - Votar en una pregunta específica
app.post('/api/community/questions/:id/vote', async (req, res) => {
    try {
        console.log('🗳️ === VOTO EN PREGUNTA ===');
        console.log('Question ID:', req.params.id);
        console.log('Body:', req.body);

        const questionId = req.params.id;
        const { vote_type } = req.body;
        const userId = req.headers['x-user-id'] || req.body.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        if (!vote_type || !['up', 'down', 'upvote', 'downvote'].includes(vote_type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de voto inválido. Usar: up, down, upvote, downvote'
            });
        }

        // Normalizar tipo de voto
        const normalizedVoteType = vote_type === 'upvote' ? 'up' :
                                 vote_type === 'downvote' ? 'down' : vote_type;

        // Verificar si ya existe un voto del usuario
        const existingVoteResult = await pool.query(`
            SELECT * FROM community_votes
            WHERE user_id = $1 AND target_type = 'question' AND target_id = $2
        `, [userId, questionId]);

        let voteAction = 'created';

        if (existingVoteResult.rows.length > 0) {
            const existingVote = existingVoteResult.rows[0];

            if (existingVote.vote_type === normalizedVoteType) {
                // Eliminar voto si es el mismo tipo
                await pool.query('DELETE FROM community_votes WHERE id = $1', [existingVote.id]);
                voteAction = 'removed';
            } else {
                // Actualizar tipo de voto
                await pool.query(
                    'UPDATE community_votes SET vote_type = $1 WHERE id = $2',
                    [normalizedVoteType, existingVote.id]
                );
                voteAction = 'updated';
            }
        } else {
            // Crear nuevo voto
            await pool.query(`
                INSERT INTO community_votes (user_id, target_type, target_id, vote_type, created_at)
                VALUES ($1, 'question', $2, $3, NOW())
            `, [userId, questionId, normalizedVoteType]);
        }

        // Actualizar contador de votos en la pregunta
        await updateVoteCount('question', questionId);

        // Contar votos actuales
        const upVotesResult = await pool.query(`
            SELECT COUNT(*) as count FROM community_votes
            WHERE target_type = 'question' AND target_id = $1 AND vote_type = 'up'
        `, [questionId]);

        const downVotesResult = await pool.query(`
            SELECT COUNT(*) as count FROM community_votes
            WHERE target_type = 'question' AND target_id = $1 AND vote_type = 'down'
        `, [questionId]);

        const upCount = parseInt(upVotesResult.rows[0].count);
        const downCount = parseInt(downVotesResult.rows[0].count);
        const totalVotes = upCount - downCount;

        res.status(200).json({
            success: true,
            data: {
                action: voteAction,
                vote_type: normalizedVoteType,
                total_votes: totalVotes,
                up_votes: upCount,
                down_votes: downCount
            },
            message: `Voto ${voteAction === 'removed' ? 'eliminado' : voteAction === 'updated' ? 'actualizado' : 'registrado'} exitosamente`
        });

    } catch (error) {
        console.error('❌ Error en voto de pregunta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// POST /api/community/answers/:id/vote - Votar en una respuesta específica
app.post('/api/community/answers/:id/vote', async (req, res) => {
    try {
        console.log('🗳️ === VOTO EN RESPUESTA ===');
        console.log('Answer ID:', req.params.id);
        console.log('Body:', req.body);

        const answerId = req.params.id;
        const { vote_type } = req.body;
        const userId = req.headers['x-user-id'] || req.body.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        if (!vote_type || !['up', 'down', 'upvote', 'downvote'].includes(vote_type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de voto inválido. Usar: up, down, upvote, downvote'
            });
        }

        // Normalizar tipo de voto
        const normalizedVoteType = vote_type === 'upvote' ? 'up' :
                                 vote_type === 'downvote' ? 'down' : vote_type;

        // Verificar si ya existe un voto del usuario
        const existingVoteResult = await pool.query(`
            SELECT * FROM community_votes
            WHERE user_id = $1 AND target_type = 'answer' AND target_id = $2
        `, [userId, answerId]);

        let voteAction = 'created';

        if (existingVoteResult.rows.length > 0) {
            const existingVote = existingVoteResult.rows[0];

            if (existingVote.vote_type === normalizedVoteType) {
                // Eliminar voto si es el mismo tipo
                await pool.query('DELETE FROM community_votes WHERE id = $1', [existingVote.id]);
                voteAction = 'removed';
            } else {
                // Actualizar tipo de voto
                await pool.query(
                    'UPDATE community_votes SET vote_type = $1 WHERE id = $2',
                    [normalizedVoteType, existingVote.id]
                );
                voteAction = 'updated';
            }
        } else {
            // Crear nuevo voto
            await pool.query(`
                INSERT INTO community_votes (user_id, target_type, target_id, vote_type, created_at)
                VALUES ($1, 'answer', $2, $3, NOW())
            `, [userId, answerId, normalizedVoteType]);
        }

        // Actualizar contador de votos en la respuesta
        await updateVoteCount('answer', answerId);

        // Contar votos actuales
        const upVotesResult = await pool.query(`
            SELECT COUNT(*) as count FROM community_votes
            WHERE target_type = 'answer' AND target_id = $1 AND vote_type = 'up'
        `, [answerId]);

        const downVotesResult = await pool.query(`
            SELECT COUNT(*) as count FROM community_votes
            WHERE target_type = 'answer' AND target_id = $1 AND vote_type = 'down'
        `, [answerId]);

        const upCount = parseInt(upVotesResult.rows[0].count);
        const downCount = parseInt(downVotesResult.rows[0].count);
        const totalVotes = upCount - downCount;

        res.status(200).json({
            success: true,
            data: {
                action: voteAction,
                vote_type: normalizedVoteType,
                total_votes: totalVotes,
                up_votes: upCount,
                down_votes: downCount
            },
            message: `Voto ${voteAction === 'removed' ? 'eliminado' : voteAction === 'updated' ? 'actualizado' : 'registrado'} exitosamente`
        });

    } catch (error) {
        console.error('❌ Error en voto de respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// Middleware para rutas no encontrada (DEBE IR AL FINAL)
app.use((req, res) => {
    console.log(`❌ Ruta no encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Función para generar datos de prueba cuando Supabase no está disponible
function getMockNews() {
    return [
        {
            id: '1',
            title: 'Nuevas funcionalidades de IA en Chat-Bot-LIA',
            subtitle: 'Descubre las últimas mejoras en inteligencia artificial para profesionales',
            excerpt: 'Chat-Bot-LIA ha implementado nuevas funcionalidades de IA que mejoran significativamente la experiencia del usuario.',
            category: 'ia',
            categoryLabel: 'Inteligencia Artificial',
            author: 'Chat-Bot-LIA',
            date: new Date().toISOString(),
            image: 'fas fa-brain',
            views: 1250,
            comments: 23,
            featured: true,
            hasDetailedView: true,
            detailedData: {
                tldr: [
                    'Nuevas funcionalidades de IA implementadas',
                    'Mejora en la precisión de respuestas',
                    'Interfaz más intuitiva'
                ],
                suggestedSteps: [
                    'Explorar las nuevas funciones en el dashboard',
                    'Probar las mejoras en el chat',
                    'Revisar la documentación actualizada'
                ],
                risks: [
                    'Posibles cambios en el flujo de trabajo',
                    'Necesidad de capacitación adicional'
                ],
                resources: [
                    { url: '#', label: 'Documentación de nuevas funciones' },
                    { url: '#', label: 'Tutorial en video' }
                ],
                whyMatters: [
                    'Mejora la productividad de los usuarios',
                    'Mantiene la competitividad del sistema'
                ],
                whatChanged: [
                    'Algoritmo de IA actualizado',
                    'Nueva interfaz de usuario',
                    'Mejores tiempos de respuesta'
                ],
                impact: [
                    'Aumento del 30% en la satisfacción del usuario',
                    'Reducción del 25% en el tiempo de respuesta'
                ],
                cta: 'Probar nuevas funciones'
            }
        },
        {
            id: '2',
            title: 'Actualización del sistema de cursos',
            subtitle: 'Nuevas mejoras en la plataforma educativa',
            excerpt: 'Hemos actualizado el sistema de cursos con nuevas funcionalidades y mejoras en la experiencia de aprendizaje.',
            category: 'educacion',
            categoryLabel: 'Educación',
            author: 'Chat-Bot-LIA',
            date: new Date(Date.now() - 86400000).toISOString(), // Ayer
            image: 'fas fa-graduation-cap',
            views: 890,
            comments: 15,
            featured: false,
            hasDetailedView: true,
            detailedData: {
                tldr: [
                    'Sistema de cursos actualizado',
                    'Nuevas herramientas de evaluación',
                    'Mejor seguimiento del progreso'
                ],
                suggestedSteps: [
                    'Revisar los cursos actualizados',
                    'Explorar las nuevas herramientas',
                    'Actualizar el perfil de aprendizaje'
                ],
                risks: [
                    'Posible necesidad de reconfigurar preferencias',
                    'Cambios en la interfaz pueden requerir adaptación'
                ],
                resources: [
                    { url: '#', label: 'Guía de nuevos cursos' },
                    { url: '#', label: 'FAQ actualizada' }
                ],
                whyMatters: [
                    'Mejora la experiencia de aprendizaje',
                    'Facilita el seguimiento del progreso'
                ],
                whatChanged: [
                    'Nueva interfaz de cursos',
                    'Sistema de evaluación mejorado',
                    'Mejor tracking de progreso'
                ],
                impact: [
                    'Aumento del 40% en la retención de estudiantes',
                    'Mejora del 35% en las calificaciones'
                ],
                cta: 'Explorar cursos'
            }
        },
        {
            id: '3',
            title: 'Evento: Conferencia de IA 2024',
            subtitle: 'Únete a la conferencia más importante del año sobre inteligencia artificial',
            excerpt: 'No te pierdas la conferencia anual de IA donde expertos compartirán las últimas tendencias y avances.',
            category: 'eventos',
            categoryLabel: 'Eventos',
            author: 'Chat-Bot-LIA',
            date: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
            image: 'fas fa-calendar-alt',
            views: 2100,
            comments: 45,
            featured: true,
            hasDetailedView: true,
            detailedData: {
                tldr: [
                    'Conferencia anual de IA 2024',
                    'Expertos internacionales',
                    'Networking y aprendizaje'
                ],
                suggestedSteps: [
                    'Registrarse en el evento',
                    'Revisar la agenda de ponencias',
                    'Preparar preguntas para los expertos'
                ],
                risks: [
                    'Cupo limitado',
                    'Posible cambio de fechas'
                ],
                resources: [
                    { url: '#', label: 'Registro al evento' },
                    { url: '#', label: 'Agenda completa' }
                ],
                whyMatters: [
                    'Oportunidad de networking',
                    'Acceso a conocimiento de vanguardia'
                ],
                whatChanged: [
                    'Nuevos ponentes confirmados',
                    'Agenda actualizada',
                    'Nuevas modalidades de participación'
                ],
                impact: [
                    'Más de 500 profesionales registrados',
                    '15 ponentes internacionales'
                ],
                cta: 'Registrarse ahora'
            }
        }
    ];
}

module.exports = app;
