# PRD 06 - Arquitectura Técnica - Chat-Bot-LIA

## 6. Arquitectura Técnica del Sistema

Este documento detalla la arquitectura técnica completa del sistema Chat-Bot-LIA, incluyendo stack tecnológico, arquitectura del sistema, base de datos, APIs, integraciones externas y estrategia de deployment.

---

## 6.1 Stack Tecnológico

### Frontend

#### Core Technologies
- **JavaScript**: Vanilla JS (ES6+)
- **HTML5**: Semántico y accesible
- **CSS3**: Custom properties, Flexbox, Grid
- **No Frameworks**: Arquitectura sin frameworks pesados para máximo rendimiento

#### Librerías y Herramientas
- **Font Awesome 6**: Iconografía
- **Google Fonts**: Montserrat, Inter
- **Markdown Renderer**: Para chat con IA
- **Socket.IO Client**: Comunicación en tiempo real
- **LocalStorage API**: Persistencia local

#### Build Tools
- **Webpack**: Bundling y optimización
- **Babel**: Transpilación ES6+
- **PostCSS**: Procesamiento de CSS
- **Prettier**: Formateo de código
- **ESLint**: Linting de JavaScript

### Backend

#### Runtime y Framework
- **Node.js**: v18+ (LTS)
- **Express.js**: v4.18+
- **Socket.IO**: v4.5+ para WebSockets

#### Seguridad
- **Helmet.js**: Security headers
- **express-rate-limit**: Rate limiting
- **bcrypt**: Hash de contraseñas (12+ rounds)
- **jsonwebtoken**: JWT authentication
- **cors**: CORS configuration

#### Base de Datos
- **PostgreSQL**: v14+ (primary database)
- **Supabase**: PostgreSQL managed + real-time features
- **pg**: Node.js PostgreSQL client
- **Connection Pooling**: pg Pool

#### Servicios Externos
- **OpenAI API**: GPT-4 para chat
- **SendGrid/Mailgun**: Email transaccional
- **Zoom API**: Sesiones virtuales
- **Google OAuth**: Autenticación social

### DevOps y Deployment

#### Hosting
- **Netlify**: Frontend y Netlify Functions
- **Heroku/Railway**: Backend Express (opcional)
- **Supabase**: Base de datos managed

#### CI/CD
- **GitHub Actions**: Automated testing y deployment
- **Netlify Deploy**: Automatic deployments
- **Environment Variables**: Gestión segura de secrets

#### Monitoreo
- **Grafana**: Dashboards de métricas
- **Sentry**: Error tracking (opcional)
- **Logs**: Structured logging con Winston

---

## 6.2 Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Netlify)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Landing   │  │   Chat UI    │  │   Courses    │       │
│  │   (index)   │  │ (chat-online)│  │  (cursos)    │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Community  │  │   Profile    │  │    Admin     │       │
│  │ (community) │  │  (profile)   │  │   (admin)    │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NETLIFY FUNCTIONS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   openai.js  │  │   login.js   │  │  progress-   │      │
│  │              │  │              │  │   sync.js    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  community-  │  │   update-    │  │   grafana-   │      │
│  │  questions   │  │   profile    │  │   metrics    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (server.js)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware: Helmet, CORS, Rate Limit, Body Parser  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth APIs   │  │  Course APIs │  │  Community   │      │
│  │              │  │              │  │    APIs      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Progress    │  │   Admin APIs │  │  Socket.IO   │      │
│  │    APIs      │  │              │  │   Server     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          PostgreSQL (Supabase)                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Users   │  │ Courses  │  │Community │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Progress │  │   Chat   │  │  Zoom    │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Supabase Storage (Avatars, Files)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  OpenAI API  │  │  SendGrid    │  │   Zoom API   │      │
│  │   (GPT-4)    │  │   (Email)    │  │  (Meetings)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Google OAuth │  │   Grafana    │  │    CDN       │      │
│  │              │  │  (Metrics)   │  │  (Assets)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

#### Autenticación
```
Usuario → Login Form → Netlify Function (login.js) → PostgreSQL
                                ↓
                          JWT Token + Fingerprint
                                ↓
                          LocalStorage + Cookie
                                ↓
                    Requests con Authorization Header
```

#### Chat con IA
```
Usuario → Chat Input → Socket.IO → Express Server → OpenAI API
                                                         ↓
                                                    GPT Response
                                                         ↓
                                    PostgreSQL (historial) ← Socket.IO
                                                         ↓
                                                    Chat UI Update
```

#### Progreso de Curso
```
Video Player → Progress Update → HybridProgressManager
                                        ↓
                            LocalStorage (cache)
                                        ↓
                            SyncQueue (pending)
                                        ↓
                        API /progress/sync → PostgreSQL
                                        ↓
                            Triggers (aggregation)
                                        ↓
                            Updated Progress
```

---

## 6.3 Base de Datos

### Esquema de Base de Datos

#### Tabla: `users`
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'student',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### Tabla: `courses`
```sql
CREATE TABLE courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES users(user_id),
    thumbnail_url TEXT,
    duration_hours INTEGER,
    difficulty_level VARCHAR(20),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
```

#### Tabla: `course_modules`
```sql
CREATE TABLE course_modules (
    module_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    module_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, module_number)
);

CREATE INDEX idx_modules_course ON course_modules(course_id);
```

#### Tabla: `module_videos`
```sql
CREATE TABLE module_videos (
    video_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES course_modules(module_id) ON DELETE CASCADE,
    video_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, video_number)
);

CREATE INDEX idx_videos_module ON module_videos(module_id);
```

#### Tabla: `course_progress`
```sql
CREATE TABLE course_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    overall_progress_percentage DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'not_started',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_progress_user ON course_progress(user_id);
CREATE INDEX idx_progress_course ON course_progress(course_id);
```

#### Tabla: `module_progress`
```sql
CREATE TABLE module_progress (
    module_progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    module_number INTEGER NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'locked',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id, module_number)
);

CREATE INDEX idx_module_progress_user ON module_progress(user_id);
CREATE INDEX idx_module_progress_course_module ON module_progress(course_id, module_number);
```

#### Tabla: `video_progress`
```sql
CREATE TABLE video_progress (
    video_progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    video_id UUID REFERENCES module_videos(video_id) ON DELETE CASCADE,
    current_time_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    watch_count INTEGER DEFAULT 0,
    last_watched TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

CREATE INDEX idx_video_progress_user ON video_progress(user_id);
CREATE INDEX idx_video_progress_video ON video_progress(video_id);
```

#### Tabla: `community_questions`
```sql
CREATE TABLE community_questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    vote_count INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_answered BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_user ON community_questions(user_id);
CREATE INDEX idx_questions_course ON community_questions(course_id);
CREATE INDEX idx_questions_tags ON community_questions USING GIN(tags);
```

#### Tabla: `community_answers`
```sql
CREATE TABLE community_answers (
    answer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES community_questions(question_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_answers_question ON community_answers(question_id);
CREATE INDEX idx_answers_user ON community_answers(user_id);
```

#### Tabla: `community_votes`
```sql
CREATE TABLE community_votes (
    vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    votable_type VARCHAR(20) NOT NULL, -- 'question' or 'answer'
    votable_id UUID NOT NULL,
    vote_value INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, votable_type, votable_id)
);

CREATE INDEX idx_votes_user ON community_votes(user_id);
CREATE INDEX idx_votes_votable ON community_votes(votable_type, votable_id);
```

#### Tabla: `chat_history`
```sql
CREATE TABLE chat_history (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    conversation_id UUID,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    context_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON chat_history(user_id);
CREATE INDEX idx_chat_conversation ON chat_history(conversation_id);
```

#### Tabla: `zoom_sessions`
```sql
CREATE TABLE zoom_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id),
    host_id UUID REFERENCES users(user_id),
    zoom_meeting_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    join_url TEXT,
    recording_url TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zoom_course ON zoom_sessions(course_id);
CREATE INDEX idx_zoom_host ON zoom_sessions(host_id);
```

### Triggers de Base de Datos

#### Trigger: Actualización Automática de Progreso de Curso
```sql
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE course_progress
    SET 
        overall_progress_percentage = (
            SELECT AVG(progress_percentage)
            FROM module_progress
            WHERE user_id = NEW.user_id
            AND course_id = NEW.course_id
        ),
        status = CASE
            WHEN (SELECT AVG(progress_percentage) FROM module_progress 
                  WHERE user_id = NEW.user_id AND course_id = NEW.course_id) >= 100 
            THEN 'completed'
            WHEN (SELECT AVG(progress_percentage) FROM module_progress 
                  WHERE user_id = NEW.user_id AND course_id = NEW.course_id) > 0 
            THEN 'in_progress'
            ELSE 'not_started'
        END,
        updated_at = NOW()
    WHERE user_id = NEW.user_id
    AND course_id = NEW.course_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_progress
AFTER INSERT OR UPDATE ON module_progress
FOR EACH ROW
EXECUTE FUNCTION update_course_progress();
```

#### Trigger: Desbloqueo Automático de Módulos
```sql
CREATE OR REPLACE FUNCTION unlock_next_module()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.progress_percentage >= 100 AND NEW.status = 'completed' THEN
        UPDATE module_progress
        SET status = 'not_started'
        WHERE user_id = NEW.user_id
        AND course_id = NEW.course_id
        AND module_number = NEW.module_number + 1
        AND status = 'locked';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unlock_next_module
AFTER UPDATE ON module_progress
FOR EACH ROW
EXECUTE FUNCTION unlock_next_module();
```

#### Trigger: Actualización de Contador de Votos
```sql
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.votable_type = 'question' THEN
            UPDATE community_questions
            SET vote_count = vote_count + NEW.vote_value
            WHERE question_id = NEW.votable_id;
        ELSIF NEW.votable_type = 'answer' THEN
            UPDATE community_answers
            SET vote_count = vote_count + NEW.vote_value
            WHERE answer_id = NEW.votable_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.votable_type = 'question' THEN
            UPDATE community_questions
            SET vote_count = vote_count + (NEW.vote_value - OLD.vote_value)
            WHERE question_id = NEW.votable_id;
        ELSIF NEW.votable_type = 'answer' THEN
            UPDATE community_answers
            SET vote_count = vote_count + (NEW.vote_value - OLD.vote_value)
            WHERE answer_id = NEW.votable_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.votable_type = 'question' THEN
            UPDATE community_questions
            SET vote_count = vote_count - OLD.vote_value
            WHERE question_id = OLD.votable_id;
        ELSIF OLD.votable_type = 'answer' THEN
            UPDATE community_answers
            SET vote_count = vote_count - OLD.vote_value
            WHERE answer_id = OLD.votable_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_count
AFTER INSERT OR UPDATE OR DELETE ON community_votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_count();
```

### Row Level Security (RLS)

#### Políticas para `users`
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver su propio perfil
CREATE POLICY users_select_own
ON users FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY users_update_own
ON users FOR UPDATE
USING (auth.uid() = user_id);

-- Los administradores pueden ver todos los perfiles
CREATE POLICY users_select_admin
ON users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);
```

#### Políticas para `course_progress`
```sql
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver su propio progreso
CREATE POLICY progress_select_own
ON course_progress FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar su propio progreso
CREATE POLICY progress_update_own
ON course_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Los instructores pueden ver el progreso de sus estudiantes
CREATE POLICY progress_select_instructor
ON course_progress FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_progress.course_id
        AND courses.instructor_id = auth.uid()
    )
);
```

---

## 6.4 APIs y Endpoints

### Arquitectura de APIs

El sistema utiliza una arquitectura dual:
1. **Netlify Functions**: Para operaciones serverless
2. **Express Server**: Para operaciones con estado y WebSockets

### Netlify Functions

#### `/api/openai` - Chat con IA
```javascript
// POST /api/openai
// Body: { message, context, conversationId }
// Response: { response, conversationId, timestamp }

exports.handler = async (event) => {
    const { message, context } = JSON.parse(event.body);
    
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
        ]
    });
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            response: completion.choices[0].message.content
        })
    };
};
```

#### `/api/login` - Autenticación
```javascript
// POST /api/login
// Body: { email, password, fingerprint }
// Response: { token, user, expiresIn }

exports.handler = async (event) => {
    const { email, password, fingerprint } = JSON.parse(event.body);
    
    // Validar credenciales
    const user = await validateCredentials(email, password);
    
    // Generar JWT
    const token = jwt.sign(
        { userId: user.id, fp: fingerprint },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    return {
        statusCode: 200,
        body: JSON.stringify({ token, user })
    };
};
```

#### `/api/progress/sync` - Sincronización de Progreso
```javascript
// POST /api/progress/sync
// Body: { userId, courseId, moduleNumber, videoNumber, progress }
// Response: { success, updatedProgress }

exports.handler = async (event) => {
    const progressData = JSON.parse(event.body);
    
    await client.query('BEGIN');
    
    try {
        // Actualizar progreso de video
        await updateVideoProgress(progressData);
        
        // Actualizar progreso de módulo
        await updateModuleProgress(progressData);
        
        // El trigger actualiza automáticamente el progreso del curso
        
        await client.query('COMMIT');
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
};
```

### Express Server Endpoints

#### Autenticación y Usuarios

```javascript
// POST /api/auth/register
// Registro de nuevo usuario
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    // Validar datos
    // Hash de contraseña con bcrypt
    // Insertar en BD
    // Enviar email de verificación
    
    res.json({ success: true, userId });
});

// POST /api/auth/verify-email
// Verificación de email con OTP
app.post('/api/auth/verify-email', async (req, res) => {
    const { email, otp } = req.body;
    
    // Validar OTP
    // Actualizar email_verified = true
    
    res.json({ success: true });
});

// POST /api/auth/forgot-password
// Solicitud de recuperación de contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    // Generar token de recuperación
    // Enviar email con enlace
    
    res.json({ success: true });
});

// GET /api/users/:userId/profile
// Obtener perfil de usuario
app.get('/api/users/:userId/profile', requireAuth, async (req, res) => {
    const profile = await getUserProfile(req.params.userId);
    res.json(profile);
});

// PUT /api/users/:userId/profile
// Actualizar perfil de usuario
app.put('/api/users/:userId/profile', requireAuth, async (req, res) => {
    const updatedProfile = await updateUserProfile(
        req.params.userId,
        req.body
    );
    res.json(updatedProfile);
});
```

#### Cursos y Progreso

```javascript
// GET /api/courses
// Listar todos los cursos publicados
app.get('/api/courses', async (req, res) => {
    const courses = await getCourses({ isPublished: true });
    res.json(courses);
});

// GET /api/courses/:courseId
// Obtener detalles de un curso
app.get('/api/courses/:courseId', async (req, res) => {
    const course = await getCourseDetails(req.params.courseId);
    res.json(course);
});

// GET /api/users/:userId/courses/:courseId/progress
// Obtener progreso de usuario en un curso
app.get('/api/users/:userId/courses/:courseId/progress', 
    requireAuth, 
    async (req, res) => {
        const progress = await getCourseProgress(
            req.params.userId,
            req.params.courseId
        );
        res.json(progress);
    }
);

// POST /api/users/:userId/courses/:courseId/enroll
// Inscribir usuario en un curso
app.post('/api/users/:userId/courses/:courseId/enroll',
    requireAuth,
    async (req, res) => {
        await enrollUserInCourse(
            req.params.userId,
            req.params.courseId
        );
        res.json({ success: true });
    }
);
```

#### Comunidad

```javascript
// GET /api/community/questions
// Listar preguntas con paginación
app.get('/api/community/questions', async (req, res) => {
    const { page = 1, limit = 20, courseId, tags } = req.query;
    
    const questions = await getQuestions({
        page,
        limit,
        courseId,
        tags
    });
    
    res.json(questions);
});

// POST /api/community/questions
// Crear nueva pregunta
app.post('/api/community/questions', requireAuth, async (req, res) => {
    const { title, content, courseId, tags } = req.body;
    
    const question = await createQuestion({
        userId: req.user.id,
        title,
        content,
        courseId,
        tags
    });
    
    res.json(question);
});

// POST /api/community/questions/:questionId/answers
// Responder a una pregunta
app.post('/api/community/questions/:questionId/answers',
    requireAuth,
    async (req, res) => {
        const answer = await createAnswer({
            questionId: req.params.questionId,
            userId: req.user.id,
            content: req.body.content
        });
        
        res.json(answer);
    }
);

// POST /api/community/vote
// Votar en pregunta o respuesta
app.post('/api/community/vote', requireAuth, async (req, res) => {
    const { votableType, votableId, voteValue } = req.body;
    
    await upsertVote({
        userId: req.user.id,
        votableType,
        votableId,
        voteValue
    });
    
    res.json({ success: true });
});
```

#### Administración

```javascript
// GET /api/admin/users
// Listar todos los usuarios (solo admin)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    const users = await getAllUsers();
    res.json(users);
});

// PUT /api/admin/users/:userId/role
// Cambiar rol de usuario (solo admin)
app.put('/api/admin/users/:userId/role', 
    requireAdmin, 
    async (req, res) => {
        await updateUserRole(
            req.params.userId,
            req.body.role
        );
        res.json({ success: true });
    }
);

// GET /api/admin/analytics
// Obtener analytics del sistema (solo admin)
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    const analytics = await getSystemAnalytics();
    res.json(analytics);
});
```

### Middleware de Autenticación

```javascript
// Middleware para requerir autenticación
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = req.headers['x-user-id'];
    const fingerprint = generateFingerprint(req);
    
    if (!token || !userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        
        // Verificar fingerprint
        if (payload.fp && payload.fp !== fingerprint) {
            return res.status(401).json({ error: 'Sesión inválida' });
        }
        
        req.user = { id: userId };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// Middleware para requerir rol de administrador
function requireAdmin(req, res, next) {
    requireAuth(req, res, async () => {
        const user = await getUserById(req.user.id);
        
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        next();
    });
}
```

---

## 6.5 Integraciones Externas

### OpenAI API

#### Configuración
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
```

#### Uso en Chat
```javascript
async function getChatResponse(message, context) {
    const systemPrompt = `
        Eres LIA, un asistente de IA educativo especializado en 
        inteligencia artificial y machine learning.
        
        Contexto del curso: ${context.courseName}
        Módulo actual: ${context.moduleName}
    `;
    
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: systemPrompt },
            ...context.history,
            { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
    });
    
    return completion.choices[0].message.content;
}
```

### SendGrid/Mailgun (Email)

#### Configuración
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

#### Envío de OTP
```javascript
async function sendOTPEmail(email, otp) {
    const msg = {
        to: email,
        from: 'noreply@chatbotlia.com',
        subject: 'Verificación de Email - Chat-Bot-LIA',
        html: `
            <h1>Código de Verificación</h1>
            <p>Tu código OTP es: <strong>${otp}</strong></p>
            <p>Este código expira en 15 minutos.</p>
        `
    };
    
    await sgMail.send(msg);
}
```

### Zoom API

#### Configuración
```javascript
const { ZoomClient } = require('zoom-api-js');

const zoomClient = new ZoomClient({
    accountId: process.env.ZOOM_ACCOUNT_ID,
    clientId: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET
});
```

#### Crear Sesión
```javascript
async function createZoomMeeting(sessionData) {
    const meeting = await zoomClient.meetings.createMeeting({
        userId: sessionData.hostId,
        body: {
            topic: sessionData.title,
            type: 2, // Scheduled meeting
            start_time: sessionData.scheduledAt,
            duration: sessionData.durationMinutes,
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                auto_recording: 'cloud'
            }
        }
    });
    
    return {
        zoomMeetingId: meeting.id,
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url
    };
}
```

### Google OAuth

#### Configuración
```javascript
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
```

#### Autenticación
```javascript
async function verifyGoogleToken(token) {
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified
    };
}
```

---

## 6.6 Deployment y DevOps

### Configuración de Netlify

#### `netlify.toml`
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "src"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/openai"
  to = "/.netlify/functions/openai"
  status = 200

[[redirects]]
  from = "/api/login"
  to = "/.netlify/functions/login"
  status = 200

[[redirects]]
  from = "/api/progress/*"
  to = "/.netlify/functions/progress-sync"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.youtube.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com wss://*.supabase.co; frame-src 'self' https://www.youtube.com;"
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

### Variables de Entorno

#### Desarrollo (`.env.local`)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chatbotlia
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Authentication
JWT_SECRET=your-jwt-secret-key
USER_JWT_SECRET=your-user-jwt-secret

# OpenAI
OPENAI_API_KEY=sk-xxx

# Email
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@chatbotlia.com

# Zoom
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Environment
NODE_ENV=development
PORT=3000
```

#### Producción (Netlify Environment Variables)
- Mismas variables pero con valores de producción
- Configuradas en Netlify Dashboard
- Accesibles en Netlify Functions

### CI/CD Pipeline

#### GitHub Actions (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main, Deploy-produccion]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/Deploy-produccion'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Monitoreo y Logs

#### Structured Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Uso
logger.info('User logged in', { userId, timestamp });
logger.error('Database connection failed', { error: err.message });
```

#### Health Check Endpoint
```javascript
app.get('/health', async (req, res) => {
    const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        status: 'OK',
        checks: {
            database: 'checking',
            openai: 'checking',
            supabase: 'checking'
        }
    };
    
    try {
        // Check database
        await pool.query('SELECT 1');
        health.checks.database = 'OK';
        
        // Check OpenAI (opcional, puede ser costoso)
        // health.checks.openai = 'OK';
        
        // Check Supabase
        const { data, error } = await supabase.from('users').select('count');
        health.checks.supabase = error ? 'ERROR' : 'OK';
        
        res.json(health);
    } catch (error) {
        health.status = 'ERROR';
        res.status(503).json(health);
    }
});
```

---

## 6.7 Seguridad

### Content Security Policy (CSP)

```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://cdn.jsdelivr.net",
                "https://www.youtube.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:"
            ],
            connectSrc: [
                "'self'",
                "https://api.openai.com",
                "wss://*.supabase.co"
            ],
            frameSrc: [
                "'self'",
                "https://www.youtube.com"
            ]
        }
    }
}));
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Rate limit general
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde'
});

// Rate limit para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos'
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
```

### CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://chatbotlia.netlify.app']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## Resumen de Arquitectura

### Stack Completo
- **Frontend**: Vanilla JS, HTML5, CSS3
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: PostgreSQL (Supabase)
- **Serverless**: Netlify Functions
- **AI**: OpenAI GPT-4
- **Email**: SendGrid/Mailgun
- **Video Conferencing**: Zoom API
- **Auth**: JWT + Google OAuth

### Patrones Arquitectónicos
- **MPA**: Multi-Page Application
- **RESTful APIs**: Endpoints consistentes
- **Serverless**: Netlify Functions
- **Real-time**: Socket.IO WebSockets
- **Hybrid Progress**: LocalStorage + Database

### Deployment
- **Frontend**: Netlify
- **Backend**: Heroku/Railway (opcional)
- **Database**: Supabase
- **CI/CD**: GitHub Actions + Netlify

---

**Documento:** PRD 06 - Arquitectura Técnica  
**Versión:** 1.0  
**Fecha:** Enero 2025  
**Autor:** Equipo de Desarrollo Chat-Bot-LIA
