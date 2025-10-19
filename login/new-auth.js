// Configuración del sistema de login
// Importante: Habilitamos Supabase para validación de roles
const ENABLE_SUPABASE_AUTH = true;

/**
 * FUNCIONES DE OFUSCACIÓN PARA CREDENCIALES RECORDADAS
 * NOTA: Esto NO es encriptación verdadera, solo ofuscación básica.
 * Las contraseñas aún pueden ser recuperadas por alguien con acceso al localStorage.
 */

// Clave simple para ofuscación (en producción debería ser más compleja)
const OBFUSCATION_KEY = 'AyA-2024-SecureKey-';

/**
 * Ofusca una cadena de texto usando Base64 y XOR simple
 */
function obfuscateString(str) {
    if (!str) return '';
    try {
        // XOR simple con la clave
        let xored = '';
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length);
            xored += String.fromCharCode(charCode);
        }
        // Convertir a Base64
        return btoa(xored);
    } catch (error) {
        console.error('Error ofuscando:', error);
        return '';
    }
}

/**
 * Desofusca una cadena de texto
 */
function deobfuscateString(str) {
    if (!str) return '';
    try {
        // Decodificar de Base64
        const xored = atob(str);
        // XOR inverso
        let original = '';
        for (let i = 0; i < xored.length; i++) {
            const charCode = xored.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length);
            original += String.fromCharCode(charCode);
        }
        return original;
    } catch (error) {
        console.error('Error desofuscando:', error);
        return '';
    }
}

/**
 * Función para asegurar que todos los datos de autenticación estén sincronizados
 * Llama a esta función después de cualquier login exitoso
 */
async function ensureAuthDataSync() {
    try {
        // Verificar si hay datos de usuario en cualquier formato
        const currentUser = localStorage.getItem('currentUser');
        const userData = localStorage.getItem('userData');
        const existingToken = localStorage.getItem('userToken') || localStorage.getItem('authToken');
        
        // Si hay currentUser pero no userData, sincronizar
        if (currentUser && !userData) {
            localStorage.setItem('userData', currentUser);
        }
        
        // Si hay userData pero no currentUser, sincronizar
        if (userData && !currentUser) {
            localStorage.setItem('currentUser', userData);
        }
        
        // Si no hay token, crear uno válido usando auth-issue
        if ((currentUser || userData) && !existingToken) {
            const user = JSON.parse(currentUser || userData);
            
            try {
                const tokenResponse = await fetch(`${API_BASE}/api/auth/issue`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'dev-api-key'
                    },
                    body: JSON.stringify({
                        username: user.username || user.email || 'user'
                    })
                });

                if (tokenResponse.ok) {
                    const { token, userId } = await tokenResponse.json();
                    localStorage.setItem('userToken', token);
                    localStorage.setItem('authToken', token);
                } else {
                    const errorText = await tokenResponse.text();
                    // console.error('Error en auth-issue:', tokenResponse.status, errorText);
                    throw new Error(`Error generando token válido: ${tokenResponse.status}`);
                }
            } catch (error) {
                // console.error('Excepción en auth-issue:', error);
                // Fallback a token mock solo para desarrollo local
                const mockToken = btoa(JSON.stringify({
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    user: user.email || user.username,
                    role: user.cargo_rol || user.role || 'user',
                    id: user.id
                }));
                localStorage.setItem('userToken', mockToken);
                localStorage.setItem('authToken', mockToken);
            }
        }
        
        // Si no hay sesión, crear una
        if ((currentUser || userData) && !localStorage.getItem('userSession')) {
            devLog('Creando sesión para usuario autenticado');
            const user = JSON.parse(currentUser || userData);
            const sessionData = {
                sessionId: 'session-' + Date.now(),
                created: new Date().toISOString(),
                userId: user.id || user.username || user.email
            };
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        }
        
        devLog('Sincronización de datos de autenticación completada');
        
    } catch (error) {
        // console.error('Error sincronizando datos de autenticación:', error);
    }
}
const API_BASE = (() => {
    try {
        if (window.API_BASE) return window.API_BASE;
        const loc = window.location;
        if (!loc.port || loc.port === '3000') return '';
        return `${loc.protocol}//localhost:3000`;
    } catch (_) { return ''; }
})();

// Logging útil solo en modo desarrollo (sin credenciales)
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const devLog = (...args) => {
    if (isDev) {
        // console.log('[AUTH DEV]', ...args);
    }
};

// Configuración de la aplicación
const AUTH_CONFIG = {
    redirectDelay: 1500,
    animationDelay: 300,
    passwordMinLength: 8, // Actualizado según Supabase y PROMPT_CLAUDE.md
    usernameMinLength: 3,
    maxAttempts: 3,
    lockoutDuration: 300000 // 5 minutos
};

// Estado de la aplicación
const authState = {
    currentTab: 'login',
    isLoading: false
};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ensureSupabaseConfigCached();
    initializeAuth();
    setupEventListeners();
    setupPasswordStrength();
    setupValidations();
    initializeParticleSystem();
    optimizePerformance();
    loadRememberedCredentials();
    applyQueryPrefill();
});

// Cargar credenciales recordadas y verificar bloqueos
function loadRememberedCredentials() {
    // Verificar si el usuario está bloqueado
    const lockoutEndTime = localStorage.getItem('lockoutEndTime');
    if (lockoutEndTime && Date.now() < parseInt(lockoutEndTime)) {
        lockUser(parseInt(lockoutEndTime));
        return;
    }
    
    // Cargar intentos anteriores
    const storedAttempts = localStorage.getItem('loginAttempts');
    if (storedAttempts) {
        authState.attempts = parseInt(storedAttempts);
    }
    
    // Cargar credenciales recordadas
    const remembered = localStorage.getItem('rememberedEmailOrUsername');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const rememberedTime = localStorage.getItem('rememberedTime');
    
    if (remembered && rememberedTime) {
        const timeDiff = Date.now() - parseInt(rememberedTime);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        
        // Si han pasado más de 30 días, limpiar datos
        if (daysDiff > 30) {
            clearRememberedCredentials();
        } else {
            const loginInput = document.getElementById('loginEmailOrUsername');
            const passwordInput = document.getElementById('loginPassword');
            const rememberCheckbox = document.getElementById('rememberMe');
            
            if (loginInput && rememberCheckbox) {
                // Cargar email/username
                loginInput.value = remembered;
                rememberCheckbox.checked = true;
                
                // Cargar contraseña si existe
                if (passwordInput && rememberedPassword) {
                    try {
                        const decodedPassword = deobfuscateString(rememberedPassword);
                        if (decodedPassword) {
                            passwordInput.value = decodedPassword;
                            devLog('Credenciales recordadas cargadas correctamente');
                        }
                    } catch (error) {
                        devLog('Error al cargar contraseña recordada:', error);
                        // Si hay error, limpiar la contraseña guardada
                        localStorage.removeItem('rememberedPassword');
                    }
                }
            }
        }
    }
}

/**
 * Limpia todas las credenciales recordadas del localStorage
 */
function clearRememberedCredentials() {
    localStorage.removeItem('rememberedEmailOrUsername');
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberedTime');
    devLog('Credenciales recordadas eliminadas');
}

// Inicialización de la interfaz
function initializeAuth() {
    // Configurar tabs iniciales
    setActiveTab('login');
    
    // Animar entrada de elementos
    animateElements();
}

// Garantiza que las credenciales de Supabase queden en localStorage para otras páginas
function ensureSupabaseConfigCached(){
    try {
        const metaUrl = document.querySelector('meta[name="supabase-url"]')?.content?.trim();
        const metaKey = document.querySelector('meta[name="supabase-key"]')?.content?.trim();
        if (metaUrl && metaKey) {
            localStorage.setItem('supabaseUrl', metaUrl);
            localStorage.setItem('supabaseAnonKey', metaKey);
        }
    } catch (_) {}
}

// Prefill desde parámetros de URL (para flujos de prueba como en las capturas)
function applyQueryPrefill() {
    try {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const emailOrUsername = params.get('emailOrUsername') || params.get('email') || params.get('user') || params.get('username');
        const password = params.get('password') || params.get('pass');

        // Cambiar de tab si viene indicado
        if (mode === 'register') {
            setActiveTab('register');
        } else {
            setActiveTab('login');
        }

        // Prefill para login
        const loginIdInput = document.getElementById('loginEmailOrUsername');
        const loginPassInput = document.getElementById('loginPassword');
        if (loginIdInput && emailOrUsername) loginIdInput.value = emailOrUsername.trim();
        if (loginPassInput && password) loginPassInput.value = password;

        // Si se completó por query, enfocar el botón de ingresar
        if ((emailOrUsername || password) && document.getElementById('loginSubmit')) {
            setTimeout(() => {
                document.getElementById('loginSubmit').focus();
            }, 50);
        }

        // SEGURIDAD: Limpiar parámetros sensibles de la URL después del prefill
        if (emailOrUsername || password) {
            const cleanUrl = new URL(window.location);
            cleanUrl.searchParams.delete('emailOrUsername');
            cleanUrl.searchParams.delete('email');
            cleanUrl.searchParams.delete('user');
            cleanUrl.searchParams.delete('username');
            cleanUrl.searchParams.delete('password');
            cleanUrl.searchParams.delete('pass');
            
            // Reemplazar la URL sin recargar la página
            window.history.replaceState({}, document.title, cleanUrl.toString());
            devLog('Parámetros sensibles eliminados de la URL por seguridad');
        }
    } catch (_) {
        // Ignorar errores silenciosamente
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Tabs
    setupTabNavigation();
    
    // Formularios
    setupFormSubmissions();
    
    // Toggle de contraseñas
    setupPasswordToggle();
    
    // Links de cambio de formulario
    setupFormSwitching();
    
    // Checkbox de recordarme
    setupRememberMeCheckbox();
}

/**
 * Configura el comportamiento del checkbox "Recordarme"
 * Limpia las credenciales guardadas cuando se desmarca
 */
function setupRememberMeCheckbox() {
    const rememberCheckbox = document.getElementById('rememberMe');
    
    if (rememberCheckbox) {
        rememberCheckbox.addEventListener('change', (e) => {
            if (!e.target.checked) {
                // Si se desmarca el checkbox, limpiar credenciales guardadas
                clearRememberedCredentials();
                devLog('Checkbox desmarcado - credenciales eliminadas');
            }
        });
        
        devLog('Listener del checkbox "Recordarme" configurado');
    }
}

// Navegación por tabs con efectos mejorados
function setupTabNavigation() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (loginTab) {
        loginTab.addEventListener('click', (e) => {
            e.preventDefault();
            if (!authState.isLoading) {
                createRippleEffect(e.currentTarget);
                setActiveTab('login');
            }
        });
        loginTab.setAttribute('tabindex', '0');
        loginTab.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !authState.isLoading) {
                e.preventDefault();
                setActiveTab('login');
            }
        });
    }
    
    if (registerTab) {
        registerTab.addEventListener('click', (e) => {
            e.preventDefault();
            if (!authState.isLoading) {
                createRippleEffect(e.currentTarget);
                setActiveTab('register');
            }
        });
        registerTab.setAttribute('tabindex', '0');
        registerTab.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !authState.isLoading) {
                e.preventDefault();
                setActiveTab('register');
            }
        });
    }

    // Deep-link: ?mode=register o hash #register
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || window.location.hash.replace('#','');
    if (mode === 'register') setActiveTab('register');
}

// Configurar envío de formularios
function setupFormSubmissions() {
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    const registerBtn = document.getElementById('registerSubmit');
    
    devLog('setupFormSubmissions called');
    devLog('loginForm found:', !!loginForm);
    devLog('registerForm found:', !!registerForm);
    devLog('registerBtn found:', !!registerBtn);
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        devLog('Login form submit listener added');
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        devLog('Register form submit listener added');
        
        // Fallback: si por alguna razón el submit del formulario no se dispara, forzamos el flujo
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                devLog('Register button clicked!');
                devLog('Auth state loading:', authState.isLoading);
                devLog('Form validity:', registerForm.checkValidity());
                
                // Evitar doble envío si ya está en loading
                if (authState.isLoading) {
                    devLog('Blocking: already loading');
                    return;
                }
                // Si el formulario es inválido, mostrar validación nativa
                if (!registerForm.checkValidity()) {
                    devLog('Form is invalid, showing validation');
                    // Para que el navegador muestre sus mensajes de validación
                    registerForm.reportValidity();
                    return;
                }
                e.preventDefault();
                devLog('Calling handleRegister directly');
                // Ejecutar el mismo flujo que el submit
                handleRegister({ preventDefault: () => {}, target: registerForm });
            });
            devLog('Register button click listener added');
        }
    }
}

// Toggle de visibilidad de contraseñas
function setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            togglePasswordVisibility(button);
        });
    });
}

// Links de cambio de formulario
function setupFormSwitching() {
    const linkButtons = document.querySelectorAll('.link-btn');
    
    linkButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = button.getAttribute('data-switch');
            if (targetTab) {
                setActiveTab(targetTab);
            }
        });
    });

    // Fallback por id si existieran enlaces directos
    const goSignup = document.getElementById('goSignup');
    if (goSignup) goSignup.addEventListener('click', (e) => { e.preventDefault(); setActiveTab('register'); });
    const goLogin = document.getElementById('goLogin');
    if (goLogin) goLogin.addEventListener('click', (e) => { e.preventDefault(); setActiveTab('login'); });
}

// Cambio de tabs con animaciones avanzadas
function setActiveTab(tabName) {
    const currentTab = authState.currentTab;
    authState.currentTab = tabName;
    
    // Actualizar indicador visual de tabs
    const tabsContainer = document.querySelector('.auth-tabs');
    tabsContainer.setAttribute('data-active', tabName);
    
    // Actualizar botones de tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        const isActive = tab.getAttribute('data-tab') === tabName;
        tab.classList.toggle('active', isActive);
    });
    
    // Transición avanzada entre formularios
    const currentForm = document.querySelector('.auth-form.active');
    const targetForm = document.getElementById(`${tabName}Form`);
    
    if (currentForm && targetForm && currentForm !== targetForm) {
        // Determinar dirección de la animación
        const isMovingRight = (currentTab === 'login' && tabName === 'register');
        
        // Animar salida del formulario actual
        currentForm.classList.remove('active');
        currentForm.classList.add(isMovingRight ? 'exit-left' : 'exit-right');
        
        // Preparar entrada del nuevo formulario
        targetForm.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
        targetForm.classList.add(isMovingRight ? 'enter-right' : 'enter-left');
        
        // Ejecutar transición con delay
        setTimeout(() => {
            // Limpiar clases de salida
            currentForm.classList.remove('exit-left', 'exit-right');
            
            // Activar nuevo formulario
            targetForm.classList.remove('enter-right', 'enter-left');
            targetForm.classList.add('active');
            
            // Animar entrada de elementos del formulario
            animateFormElements(targetForm);
        }, 100);
    } else if (targetForm) {
        // Primera carga o mismo formulario
        targetForm.classList.add('active');
        animateFormElements(targetForm);
    }
}

// Toggle de visibilidad de contraseña
function togglePasswordVisibility(button) {
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const showIcon = button.querySelector('.eye-icon.show');
    const hideIcon = button.querySelector('.eye-icon.hide');
    
    if (!input || !showIcon || !hideIcon) {
        // console.warn('Elementos de toggle de contraseña no encontrados:', { targetId, input: !!input, showIcon: !!showIcon, hideIcon: !!hideIcon });
        return;
    }
    
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    
    // Cambiar visibilidad de iconos con transición suave
    if (isPassword) {
        showIcon.style.display = 'none';
        hideIcon.style.display = 'block';
        button.setAttribute('aria-label', 'Ocultar contraseña');
    } else {
        showIcon.style.display = 'block';
        hideIcon.style.display = 'none';
        button.setAttribute('aria-label', 'Mostrar contraseña');
    }
    
    // Agregar efecto visual de feedback
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 200);
}

// Configurar medidor de fuerza de contraseña
function setupPasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!passwordInput || !strengthFill || !strengthText) return;
    
    passwordInput.addEventListener('input', (e) => {
        updatePasswordStrength(e.target.value, strengthFill, strengthText);
    });
}

// Actualizar medidor de fuerza
function updatePasswordStrength(password, fillElement, textElement) {
    const strength = calculatePasswordStrength(password);
    
    // Limpiar clases anteriores
    fillElement.className = 'strength-fill';
    
    if (password.length === 0) {
        textElement.textContent = 'Ingresa una contraseña';
        return;
    }
    
    switch (strength.level) {
        case 1:
            fillElement.classList.add('weak');
            textElement.textContent = 'Contraseña débil';
            break;
        case 2:
            fillElement.classList.add('medium');
            textElement.textContent = 'Contraseña media';
            break;
        case 3:
            fillElement.classList.add('strong');
            textElement.textContent = 'Contraseña fuerte';
            break;
        default:
            textElement.textContent = 'Muy débil';
    }
}

// Calcular fuerza de contraseña
function calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        symbols: /[^A-Za-z0-9]/.test(password)
    };
    
    if (checks.length) score++;
    if (checks.lowercase && checks.uppercase) score++;
    if (checks.numbers && checks.symbols) score++;
    
    return {
        level: Math.min(score, 3),
        checks
    };
}

// Validaciones de formulario
function setupValidations() {
    // Validación en tiempo real para email
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', () => validateEmail(input));
    });
    
    // Validación para email o username en login
    const loginEmailOrUsername = document.getElementById('loginEmailOrUsername');
    if (loginEmailOrUsername) {
        loginEmailOrUsername.addEventListener('blur', () => validateEmailOrUsername(loginEmailOrUsername));
        loginEmailOrUsername.addEventListener('input', () => {
            // Limpiar borde mientras escribe
            if (loginEmailOrUsername.value.length === 0) {
                loginEmailOrUsername.style.borderColor = '';
            }
        });
    }
    
    // Validación de coincidencia de contraseñas
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordInput = document.getElementById('registerPassword');
    
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('blur', () => {
            validatePasswordMatch(passwordInput.value, confirmPasswordInput.value, confirmPasswordInput);
        });
        
        passwordInput.addEventListener('input', () => {
            // Re-validar confirmación si ya se había escrito
            if (confirmPasswordInput.value.length > 0) {
                validatePasswordMatch(passwordInput.value, confirmPasswordInput.value, confirmPasswordInput);
            }
        });
    }
    
    // Validación de confirmación de correo
    const emailInput = document.getElementById('registerEmail');
    const confirmEmailInput = document.getElementById('confirmEmail');
    
    if (confirmEmailInput && emailInput) {
        confirmEmailInput.addEventListener('blur', () => {
            validateEmailMatch(emailInput.value, confirmEmailInput.value, confirmEmailInput);
        });
        
        emailInput.addEventListener('input', () => {
            // Re-validar confirmación si ya se había escrito
            if (confirmEmailInput.value.length > 0) {
                validateEmailMatch(emailInput.value, confirmEmailInput.value, confirmEmailInput);
            }
        });
    }
    
    // Manejo del selector de país para mostrar solo prefijo cuando está colapsado
    const phonePrefixSelect = document.getElementById('phonePrefix');
    if (phonePrefixSelect) {
        // Función para actualizar el texto mostrado
        function updateDisplayText() {
            const selectedOption = phonePrefixSelect.options[phonePrefixSelect.selectedIndex];
            const fullText = selectedOption.text;
            const prefix = selectedOption.value;
            
            // Cuando está colapsado, solo mostrar el prefijo
            phonePrefixSelect.setAttribute('data-display', prefix);
            
            // Actualizar el texto del option seleccionado para que solo muestre el prefijo
            selectedOption.text = prefix;
        }
        
        // Event listener para cuando cambia la selección
        phonePrefixSelect.addEventListener('change', function() {
            // Restaurar todos los textos originales primero
            const options = this.options;
            const originalTexts = [
                'México (+52)', 'España (+34)', 'Argentina (+54)', 'Chile (+56)', 
                'Colombia (+57)', 'Perú (+51)', 'Venezuela (+58)', 'Ecuador (+593)',
                'Paraguay (+595)', 'Uruguay (+598)', 'Bolivia (+591)', 'Nicaragua (+505)',
                'Costa Rica (+506)', 'Guatemala (+502)', 'El Salvador (+503)', 
                'Honduras (+504)', 'Panamá (+507)', 'Estados Unidos (+1)', 'Cuba (+53)'
            ];
            
            for (let i = 0; i < options.length; i++) {
                options[i].text = originalTexts[i];
            }
            
            // Actualizar el texto mostrado
            updateDisplayText();
        });
        
        // Inicializar con el prefijo de México
        updateDisplayText();
    }
    
}

// Validar email - acepta input DOM o string
function validateEmail(input) {
    let email;
    let isInputElement = false;
    
    // Detectar si es un elemento DOM o un objeto con value
    if (typeof input === 'string') {
        email = input.trim();
    } else if (input && typeof input.value === 'string') {
        email = input.value.trim();
        isInputElement = input.style !== undefined; // Es un elemento DOM real
    } else {
        return false;
    }
    
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    // Solo modificar estilos si es un elemento DOM real
    if (isInputElement) {
        input.style.borderColor = email.length === 0 ? '' : (isValid ? '#44E5FF' : '#EF4444');
    }
    
    return isValid;
}

// Validar email o username para login
function validateEmailOrUsername(input) {
    const value = input.value.trim();
    if (value.length === 0) return true;
    
    // Si contiene @, validar como email
    if (value.includes('@')) {
        return validateEmail(input);
    }
    
    // Si no contiene @, validar como username según PROMPT_CLAUDE.md
    const isValidUsername = /^[a-zA-Z0-9_]{3,}$/.test(value);
    input.style.borderColor = isValidUsername ? '#44E5FF' : '#EF4444';
    return isValidUsername;
}

// Normalizar username según especificaciones
function normalizeUsername(username) {
    return username.toLowerCase().trim().replace(/\s+/g, '');
}

// Normaliza teléfono MX: conserva solo dígitos y recorta a 10
function normalizeMxPhone(input) {
    if (!input) return '';
    const digits = String(input).replace(/\D/g, '');
    // Quitar prefijos comunes: 52, +52, 521, 044, 045
    let cleaned = digits.replace(/^52(1)?/, '');
    cleaned = cleaned.replace(/^(044|045)/, '');
    if (cleaned.length > 10) cleaned = cleaned.slice(-10);
    return cleaned;
}

// Validar coincidencia de contraseñas
function validatePasswordMatch(password, confirmPassword, input) {
    const isMatch = password === confirmPassword && confirmPassword.length > 0;
    input.style.borderColor = confirmPassword.length === 0 ? '' : (isMatch ? '#44E5FF' : '#EF4444');
    return isMatch;
}

function validateEmailMatch(email, confirmEmail, input) {
    const isMatch = email === confirmEmail && confirmEmail.length > 0;
    input.style.borderColor = confirmEmail.length === 0 ? '' : (isMatch ? '#44E5FF' : '#EF4444');
    return isMatch;
}

// Manejo del login
async function handleLogin(e) {
    e.preventDefault();
    
    if (authState.isLoading) return;
    
    const formData = new FormData(e.target);
    const emailOrUsername = formData.get('emailOrUsername')?.trim();
    const password = formData.get('password');
    const remember = formData.get('remember') === 'on';
    
    // Validaciones básicas
    if (!emailOrUsername || !password) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (password.length < 3) {
        showNotification('La contraseña debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    setLoadingState(true, 'loginSubmit', 'Validando...');
    
    devLog('Iniciando proceso de login');
    devLog('ENABLE_SUPABASE_AUTH:', ENABLE_SUPABASE_AUTH);
    devLog('window.supabase exists:', !!window.supabase);
    devLog('emailOrUsername includes @:', emailOrUsername.includes('@'));
    
    try {
        // LIMPIEZA AUTOMÁTICA DE DATOS PREVIOS
        clearPreviousAccountData();
        
        // 1) Supabase: opcional, solo con email y si está habilitado
        if (ENABLE_SUPABASE_AUTH && window.supabase && emailOrUsername.includes('@')) {
            devLog('Login con Supabase usando email directo');
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: emailOrUsername,
                password
            });

            if (!error) {
            // Limpiar intentos fallidos
            authState.attempts = 0;
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lockoutEndTime');

            if (remember) {
                // Guardar credenciales con ofuscación
                localStorage.setItem('rememberedEmailOrUsername', emailOrUsername);
                localStorage.setItem('rememberedPassword', obfuscateString(password));
                localStorage.setItem('rememberedTime', Date.now().toString());
                devLog('Credenciales guardadas para recordar (Supabase)');
            } else {
                clearRememberedCredentials();
            }

            const { data: current } = await window.supabase.auth.getUser();
            if (current?.user) {
                // Obtener el token de Supabase
                const { data: session } = await window.supabase.auth.getSession();
                const token = session?.session?.access_token;
                
                // Guardar datos con las claves que espera auth-guard
                if (token) {
                    localStorage.setItem('userToken', token);
                    localStorage.setItem('authToken', token); // Mantener compatibilidad
                    devLog('Token de Supabase guardado:', token.substring(0, 20) + '...');
                }
                localStorage.setItem('userData', JSON.stringify(current.user));
                localStorage.setItem('currentUser', JSON.stringify(current.user)); // Mantener compatibilidad
                devLog('Datos de usuario guardados:', current.user);
                
                // Crear sesión activa
                const sessionData = {
                    sessionId: 'session-' + Date.now(),
                    created: new Date().toISOString(),
                    userId: current.user.id
                };
                localStorage.setItem('userSession', JSON.stringify(sessionData));
                devLog('Sesión creada:', sessionData);
                    // Intentar actualizar último acceso (ignorar errores por RLS)
                    try {
                await window.supabase
                    .from('users')
                    .update({ last_login_at: new Date().toISOString() })
                    .eq('id', current.user.id);
                    } catch (_) {}
            }

            // Asegurar sincronización de datos
            await ensureAuthDataSync();
            
            showNotification('¡Sesión iniciada correctamente!', 'success');
            await handleSuccessfulAuth(emailOrUsername, remember, false);
            return;
        }

            // Si falla con Supabase usando email, continuamos con backend
            devLog('Supabase login falló, intentando backend...', error?.message);
        }

        // 2) Backend propio (fetch) como ruta principal
        devLog('Intentando login con backend...');
        const loginData = { username: emailOrUsername, password };
        const response = await fetch('/api/login', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(loginData)
        });
        
        devLog('Respuesta del backend:', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
            if (response.status === 401) {
                showNotification('Credenciales incorrectas', 'error');
                await handleFailedLogin();
            } else if (response.status === 403) {
                showNotification('Error de configuración CORS. Reintenta en unos minutos.', 'error');
                console.error('CORS Error 403 - Domain not allowed:', window.location.origin);
            } else if (response.status === 429) {
                showNotification('Demasiados intentos. Espera un momento e inténtalo de nuevo', 'error');
            } else if (response.status >= 500) {
                showNotification('Error del servidor. Inténtalo más tarde', 'error');
            } else {
                showNotification('Error de conexión', 'error');
            }
            return;
        }
        
        const result = await response.json();
        
        // Verificar si el usuario necesita verificación de email
        if (result.requiresVerification) {
            // Guardar datos para verificación
            localStorage.setItem('pendingVerification', JSON.stringify({
                userId: result.userId,
                email: result.email
            }));
            
            showNotification('Debes verificar tu email antes de iniciar sesión', 'warning');
            
            // Redirigir a página de verificación
            setTimeout(() => {
                window.location.href = '../email-verification.html';
            }, 2000);
            return;
        }
        
        if (result && result.user) {
            // Limpiar intentos fallidos
            authState.attempts = 0;
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lockoutEndTime');
            
            // Guardar datos de autenticación con las claves que espera auth-guard
            if (result.token) {
                localStorage.setItem('userToken', result.token);
                localStorage.setItem('authToken', result.token); // Mantener compatibilidad
                devLog('Token guardado:', result.token.substring(0, 20) + '...');
            }
            
            // AGREGAR CONTRASEÑA A LOS DATOS DEL USUARIO PARA SUPABASE
            const userWithPassword = {
                ...result.user,
                password: password  // Guardar contraseña para autenticación en Supabase
            };
            
            localStorage.setItem('userData', JSON.stringify(userWithPassword));
            localStorage.setItem('currentUser', JSON.stringify(userWithPassword)); // Mantener compatibilidad
            devLog('Datos de usuario guardados (con contraseña para Supabase):', {
                ...result.user,
                password: '[GUARDADA]'
            });
            
            // Crear sesión activa
            const sessionData = {
                sessionId: 'session-' + Date.now(),
                created: new Date().toISOString(),
                userId: result.user.id || result.user.username
            };
            localStorage.setItem('userSession', JSON.stringify(sessionData));
            devLog('Sesión creada:', sessionData);
            
            if (remember) {
                // Guardar credenciales con ofuscación
                localStorage.setItem('rememberedEmailOrUsername', emailOrUsername);
                localStorage.setItem('rememberedPassword', obfuscateString(password));
                localStorage.setItem('rememberedTime', Date.now().toString());
                devLog('Credenciales guardadas para recordar (Backend)');
            } else {
                clearRememberedCredentials();
            }
            
            // Asegurar sincronización de datos
            await ensureAuthDataSync();
            
            showNotification('¡Sesión iniciada correctamente!', 'success');
            await handleSuccessfulAuth(emailOrUsername, remember, result.user.isNewUser);
        } else {
            const errorMessage = result.message || 'Credenciales incorrectas';
            showNotification(errorMessage, 'error');
            await handleFailedLogin();
        }
    } catch (error) {
        // console.error('Error en login:', error);
        
        // Si falla la conexión con el backend, usar modo desarrollo
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            devLog('Error de conexión detectado, usando modo desarrollo...');
            showNotification('Servidor no disponible. Usando modo desarrollo...', 'warning');
            const isValid = await validateCredentialsLocal(emailOrUsername, password);
            devLog('Validación local resultado:', isValid);
            if (isValid) {
                if (remember) {
                    // Guardar credenciales con ofuscación
                    localStorage.setItem('rememberedEmailOrUsername', emailOrUsername);
                    localStorage.setItem('rememberedPassword', obfuscateString(password));
                    localStorage.setItem('rememberedTime', Date.now().toString());
                    devLog('Credenciales guardadas para recordar (Modo desarrollo)');
                } else {
                    clearRememberedCredentials();
                }
                // Asegurar sincronización de datos
                await ensureAuthDataSync();
                
                showNotification('¡Sesión iniciada correctamente! (Modo desarrollo)', 'success');
                await handleSuccessfulAuth(emailOrUsername, remember, false);
            } else {
                await handleFailedLogin();
            }
        } else {
            showNotification('Error de conexión. Inténtalo de nuevo.', 'error');
        }
    } finally {
        setLoadingState(false, 'loginSubmit');
    }
}

// Manejo del registro
async function handleRegister(e) {
    devLog('handleRegister called');
    e.preventDefault();
    
    if (authState.isLoading) {
        devLog('Already loading, returning');
        return;
    }
    
    // LIMPIEZA AUTOMÁTICA DE DATOS PREVIOS PARA NUEVO REGISTRO
    clearPreviousAccountData();
    
    devLog('Creating FormData from target:', e.target);
    const formData = new FormData(e.target);
    
    // Debug: mostrar todos los datos del formulario
    for (let [key, value] of formData.entries()) {
        devLog(`FormData - ${key}:`, value);
    }
    
    const userData = {
        first_name: formData.get('first_name')?.trim(),
        last_name: formData.get('last_name')?.trim(),
        username: normalizeUsername(formData.get('username')?.trim() || ''),
        phone: normalizeMxPhone(formData.get('phone')?.trim()),
        phone_prefix: formData.get('phone_prefix'),
        email: formData.get('email')?.trim(),
        confirm_email: formData.get('confirm_email')?.trim(),
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
        accept_terms: formData.get('accept_all_terms') === 'on'
    };
    
    devLog('Parsed userData:', userData);
    
    // Validaciones
    if (!validateRegisterForm(userData)) return;
    
    setLoadingState(true, 'registerSubmit', 'Creando cuenta...');
    showNotification('Creando cuenta en la base de datos...', 'info');
    
    try {
        // Registro solo por backend para evitar 401 por RLS en Supabase
        devLog('Registro por backend /api/register');
        const registerData = { 
            first_name: userData.first_name,
            last_name: userData.last_name,
            full_name: `${userData.first_name} ${userData.last_name}`.trim(), 
            username: userData.username, 
            email: userData.email, 
            password: userData.password 
        };
        
        devLog('Payload normalizado listo para enviar');
        const response = await fetch('/api/register', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(registerData) 
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                showNotification('El email o usuario ya está registrado', 'error');
            } else if (response.status === 400) {
                showNotification('Datos de registro inválidos', 'error');
            } else if (response.status >= 500) {
                showNotification('Error del servidor. Inténtalo más tarde', 'error');
            } else {
                showNotification('Error al crear la cuenta', 'error');
            }
            return;
        }
        
        const result = await response.json();
        if (result && result.user) {
            // Verificar si requiere verificación de email
            if (result.requiresVerification) {
                showNotification('¡Cuenta creada! Revisa tu email para verificar tu cuenta.', 'success');
                
                // Guardar datos para verificación
                localStorage.setItem('pendingVerification', JSON.stringify({
                    userId: result.user.id,
                    email: result.user.email
                }));
                
                // Redirigir a página de verificación
                setTimeout(() => {
                    window.location.href = '../email-verification.html';
                }, 2000);
            } else {
                showNotification('¡Cuenta creada exitosamente!', 'success');
                setTimeout(() => { 
                    setActiveTab('login'); 
                    const el = document.getElementById('loginEmailOrUsername'); 
                    if (el) { 
                        el.value = userData.email; 
                        el.focus(); 
                    } 
                }, 1500);
            }
        } else {
            const errorMessage = result.message || 'Error al crear la cuenta';
            showNotification(errorMessage, 'error');
        }
        
    } catch (error) {
        // console.error('Error en registro:', error);
        
        // Si falla la conexión con el backend, usar modo desarrollo
        devLog('Error in registration:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            devLog('Using local development mode for registration');
            showNotification('Servidor no disponible. Usando modo desarrollo...', 'warning');
            try {
                await registerUserLocal(userData);
                showNotification('¡Cuenta creada exitosamente! (Modo desarrollo)', 'success');
                
                setTimeout(() => {
                    setActiveTab('login');
                    const loginEmailOrUsername = document.getElementById('loginEmailOrUsername');
                    if (loginEmailOrUsername) {
                        loginEmailOrUsername.value = userData.email;
                        loginEmailOrUsername.focus();
                    }
                }, 1500);
            } catch (localError) {
                const errorMessage = localError.message || 'Error al crear la cuenta';
                showNotification(errorMessage, 'error');
            }
        } else {
            showNotification('Error de conexión. Inténtalo de nuevo.', 'error');
        }
    } finally {
        setLoadingState(false, 'registerSubmit');
    }
}

// Validar formulario de registro según PROMPT_CLAUDE.md
function validateRegisterForm(userData) {
    devLog('validateRegisterForm called with:', userData);
    const { first_name, last_name, username, email, confirm_email, password, confirm_password, accept_terms } = userData;
    
    if (!first_name || !last_name || !username || !email || !confirm_email || !password) {
        devLog('Missing required fields:', {
            first_name: !!first_name,
            last_name: !!last_name, 
            username: !!username,
            email: !!email,
            confirm_email: !!confirm_email,
            password: !!password
        });
        showNotification('Por favor completa todos los campos obligatorios', 'error');
        return false;
    }
    
    // Validar nombre y apellido (solo letras y espacios)
    if (!/^[a-zA-ZÀ-ſ\s]+$/.test(first_name) || !/^[a-zA-ZÀ-ſ\s]+$/.test(last_name)) {
        showNotification('El nombre y apellido solo pueden contener letras', 'error');
        return false;
    }
    
    // Validar username según especificaciones: minúsculas, sin espacios, regex exacto
    const normalizedUsername = normalizeUsername(username);
    if (!/^[a-zA-Z0-9_]{3,}$/.test(normalizedUsername)) {
        showNotification('El usuario debe tener al menos 3 caracteres y solo letras, números y guiones bajos', 'error');
        return false;
    }
    
    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return false;
    }

    // Validación teléfono MX (10 dígitos opcional)
    const phoneRaw = document.getElementById('phone')?.value || '';
    if (phoneRaw) {
        const normalized = normalizeMxPhone(phoneRaw);
        if (!/^[0-9]{10}$/.test(normalized)) {
            showNotification('El teléfono debe tener 10 dígitos (México).', 'error');
            return false;
        }
    }
    
    // Validación de contraseña según Supabase (mínimo 8 caracteres)
    if (password.length < 8) {
        showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
        return false;
    }
    
    // Validación de fuerza de contraseña
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    
    if (!hasLowerCase || !hasNumbers) {
        showNotification('La contraseña debe contener al menos una letra minúscula y un número', 'error');
        return false;
    }
    
    if (email !== confirm_email) {
        showNotification('Los correos electrónicos no coinciden', 'error');
        return false;
    }
    
    if (password !== confirm_password) {
        showNotification('Las contraseñas no coinciden', 'error');
        return false;
    }
    
    if (!accept_terms) {
        showNotification('Debes aceptar los Términos y Condiciones', 'error');
        return false;
    }
    
    return true;
}

// Validación local de credenciales (modo desarrollo)
async function validateCredentialsLocal(emailOrUsername, password) {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Credenciales de prueba con type_rol para testing del nuevo flujo
    const testCredentials = [
        // Usuarios con type_rol NULL (deben ir a perfil-cuestionario)
        { email: 'nuevo@test.com', username: 'nuevo', password: 'nuevo123', name: 'Usuario Nuevo', cargo_rol: 'Usuario', type_rol: null },
        { email: 'demo@demo.com', username: 'demo', password: '123456', name: 'Usuario Demo', cargo_rol: 'Usuario', type_rol: null },
        
        // Usuarios con type_rol definido (deben ir a cursos)
        { email: 'admin@test.com', username: 'admin', password: 'admin123', name: 'Administrador', cargo_rol: 'Administrador', type_rol: 'administrador' },
        { email: 'instructor@test.com', username: 'instructor', password: 'instructor123', name: 'Instructor Test', cargo_rol: 'Instructor', type_rol: 'instructor' },
        { email: 'user@test.com', username: 'usuario', password: 'user123', name: 'Usuario Test', cargo_rol: 'Usuario', type_rol: 'estudiante' },
        { email: 'student@test.com', username: 'estudiante', password: 'student123', name: 'Estudiante Test', cargo_rol: 'Estudiante', type_rol: 'estudiante' },
        { email: 'test@test.com', username: 'test', password: 'test123', name: 'Test User', cargo_rol: 'Usuario', type_rol: 'usuario' }
    ];
    
    const foundUser = testCredentials.find(cred => {
        const inputLower = emailOrUsername.toLowerCase();
        const emailMatch = cred.email.toLowerCase() === inputLower;
        const usernameMatch = cred.username.toLowerCase() === inputLower;
        const passwordMatch = cred.password === password;
        
        return (emailMatch || usernameMatch) && passwordMatch;
    });
    
    if (foundUser) {
        // Guardar datos del usuario para uso posterior (incluye type_rol para redirección)
        const userData = {
            email: foundUser.email,
            username: foundUser.username,
            name: foundUser.name,
            cargo_rol: foundUser.cargo_rol,
            type_rol: foundUser.type_rol, // CRUCIAL: incluir type_rol para la lógica de redirección
            password: password, // AGREGAR CONTRASEÑA PARA SUPABASE
            loginTime: new Date().toISOString()
        };
        
        // Guardar con las claves que espera auth-guard
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData)); // Mantener compatibilidad
        
        // Generar token compatible directamente para usuarios de prueba
        // En lugar de depender del endpoint auth-issue que requiere BD
        try {
            // Generar un token JWT compatible con el formato que espera Netlify Functions
            const payload = {
                sub: foundUser.username, // userId
                username: foundUser.username,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
            };
            
            // Crear un token JWT simulado (sin firma real, pero con formato correcto)
            const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
            const payloadEncoded = btoa(JSON.stringify(payload));
            const signature = 'fake-signature-for-dev-testing-only';
            const jwtToken = `${header}.${payloadEncoded}.${signature}`;
            
            localStorage.setItem('userToken', jwtToken);
            
            const sessionData = {
                sessionId: 'session-' + Date.now(),
                created: new Date().toISOString(),
                userId: foundUser.username
            };
            localStorage.setItem('userSession', JSON.stringify(sessionData));
            
        } catch (error) {
            // console.error('Error generando token JWT:', error);
            // Último fallback: token base64 simple
            const mockToken = btoa(JSON.stringify({
                exp: Math.floor(Date.now() / 1000) + 3600,
                user: foundUser.email,
                role: foundUser.cargo_rol
            }));
            localStorage.setItem('userToken', mockToken);
            
            const sessionData = {
                sessionId: 'session-' + Date.now(),
                created: new Date().toISOString(),
                userId: foundUser.username
            };
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        }
        return true;
    }
    
    return false;
}

// Registro local de usuario (modo desarrollo)
async function registerUserLocal(userData) {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Verificar si el usuario ya existe
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    const userExists = existingUsers.some(user => 
        user.email.toLowerCase() === userData.email.toLowerCase() || 
        user.username.toLowerCase() === userData.username.toLowerCase()
    );
    
    if (userExists) {
        throw new Error('El email o usuario ya está registrado');
    }
    
    // Crear nuevo usuario
    const newUser = {
        id: Date.now(),
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        email: userData.email,
        phone: userData.phone || '',
        registeredAt: new Date().toISOString(),
        isActive: true
    };
    
    // Agregar a la lista de usuarios
    existingUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
    
    // console.log('Usuario registrado exitosamente:', newUser);
    return newUser;
}

// Función para determinar la página de destino según type_rol y cargo_rol del usuario
function getRedirectPageByTypeRol(userData) {
    const typeRol = userData.type_rol;
    const cargoRol = userData.cargo_rol;
    const isNewUser = userData.isNewUser;
    
    devLog('Determinando redirección basada en type_rol:', typeRol);
    devLog('Determinando redirección basada en cargo_rol:', cargoRol);
    devLog('Usuario es nuevo:', isNewUser);
    devLog('Datos completos del usuario:', userData);
    
    // REGLA PRIORITARIA: Si cargo_rol es 'Instructor' -> instructor-dashboard.html
    if (cargoRol === 'Instructor' || cargoRol === 'instructor') {
        devLog('cargo_rol es Instructor, redirigiendo al panel de instructores');
        return '../instructors/instructor-dashboard.html';
    }
    
    // REGLA PRINCIPAL: Si type_rol es NULL -> perfil-cuestionario.html
    if (typeRol === null || typeRol === undefined) {
        devLog('type_rol es NULL, redirigiendo al perfil-cuestionario');
        return '../perfil-cuestionario.html';
    }
    
    // REGLA SECUNDARIA: Si type_rol tiene algún valor -> cursos.html
    devLog('type_rol tiene valor:', typeRol, ', redirigiendo a cursos');
    return '../cursos.html';
    
    // NOTA: La lógica anterior basada en cargo_rol se mantiene comentada para referencia
    // pero ahora la decisión se basa únicamente en type_rol según el requerimiento
}

// Manejo de autenticación exitosa
async function handleSuccessfulAuth(emailOrUsername, remember, isNewUser = false) {
    devLog('Manejando autenticación exitosa');
    
    // Asegurar sincronización como respaldo
    await ensureAuthDataSync();
    
    // Animar éxito
    await animateSuccess();
    
    // Obtener información del usuario desde localStorage
    let targetPage = '../cursos.html'; // Fallback por defecto
    
    try {
        // Verificar todos los datos de autenticación guardados
        const userDataStr = localStorage.getItem('userData') || localStorage.getItem('currentUser');
        const userToken = localStorage.getItem('userToken');
        const userSession = localStorage.getItem('userSession');
        
        devLog('Verificando datos guardados:', {
            userData: !!userDataStr,
            userToken: !!userToken,
            userSession: !!userSession,
            isNewUser: isNewUser
        });
        
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            devLog('Datos de usuario encontrados:', userData);
            
            // NUEVA LÓGICA: Determinar página basándose únicamente en type_rol
            targetPage = getRedirectPageByTypeRol(userData);
            devLog('Página de destino determinada:', targetPage);
        } else {
            devLog('No se encontraron datos de usuario, usando página por defecto');
        }
    } catch (error) {
        devLog('Error al procesar datos de usuario:', error);
        // En caso de error, mantener el fallback
    }
    
    devLog('Redirigiendo a:', targetPage);
    
    setTimeout(() => {
        window.location.href = targetPage;
    }, AUTH_CONFIG.redirectDelay);
}

// Estado de carga con texto opcional
function setLoadingState(loading, buttonId, loadingText = null) {
    authState.isLoading = loading;
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    // Guardar el texto original si no existe
    if (!button.dataset.originalText && btnText) {
        button.dataset.originalText = btnText.textContent;
    }
    
    if (loading) {
        // Deshabilitar el botón y agregar clase de loading
        button.disabled = true;
        button.classList.add('loading');
        button.style.cursor = 'not-allowed';
        
        // Cambiar el texto del botón y mostrar el spinner
        if (btnText) {
            btnText.textContent = loadingText || 'Cargando...';
            btnText.style.opacity = '1';
            btnText.style.paddingRight = '30px'; // Espacio para el spinner
        }
        
        if (btnLoader) {
            btnLoader.style.display = 'flex';
            btnLoader.style.alignItems = 'center';
            btnLoader.style.justifyContent = 'center';
            btnLoader.style.position = 'absolute';
            btnLoader.style.right = '20px';
            btnLoader.style.top = '50%';
            btnLoader.style.transform = 'translateY(-50%)';
            btnLoader.style.width = '20px';
            btnLoader.style.height = '20px';
            btnLoader.style.zIndex = '100';
            // Pequeño delay para asegurar que el spinner se vea
            setTimeout(() => {
                if (btnLoader) {
                    btnLoader.style.opacity = '1';
                    btnLoader.style.visibility = 'visible';
                }
            }, 100);
        }
        
        devLog('Estado de carga activado para botón:', buttonId);
    } else {
        // Habilitar el botón y quitar clase de loading
        button.disabled = false;
        button.classList.remove('loading');
        button.style.cursor = 'pointer';
        
        // Restaurar texto original y ocultar loader
        if (btnText && button.dataset.originalText) {
            btnText.textContent = button.dataset.originalText;
            btnText.style.paddingRight = '0';
        }
        
        if (btnLoader) {
            btnLoader.style.opacity = '0';
            btnLoader.style.visibility = 'hidden';
            setTimeout(() => {
                if (btnLoader) {
                    btnLoader.style.display = 'none';
                }
            }, 300);
        }
        
        devLog('Estado de carga desactivado para botón:', buttonId);
    }
}

// Mostrar notificaciones
function showNotification(message, type = 'success') {
    // Remover notificación anterior si existe
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        removeNotification(existingNotification);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">×</button>
        </div>
    `;
    
    // Colores para diferentes tipos
    const colors = {
        success: '#0066CC', // Color azul principal del proyecto
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    // Estilos
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: colors[type] || colors.success,
        color: '#FFFFFF',
        padding: '18px 24px',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '400px',
        fontSize: '1rem',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '600',
        border: '2px solid rgba(255, 255, 255, 0.2)'
    });
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos (8 segundos para info)
    const duration = type === 'info' ? 8000 : 5000;
    const autoRemove = setTimeout(() => {
        removeNotification(notification);
    }, duration);
    
    // Botón de cerrar
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            removeNotification(notification);
        });
    }
}

// Remover notificación con animación
function removeNotification(notification) {
    notification.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Animar elementos al cargar
function animateElements() {
    const elementsToAnimate = [
        { element: document.querySelector('.auth-card'), delay: 100 }
    ];
    
    elementsToAnimate.forEach(({ element, delay }) => {
        if (element) {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) scale(1)';
            }, delay);
        }
    });
}

// Animar elementos del formulario individualmente
function animateFormElements(form) {
    if (!form) return;
    
    const elements = [
        form.querySelector('h2'),
        form.querySelector('.form-subtitle'),
        ...form.querySelectorAll('.form-group'),
        ...form.querySelectorAll('.form-grid'),
        form.querySelector('.form-options'),
        form.querySelector('.password-strength'),
        form.querySelector('.form-checkboxes'),
        form.querySelector('.btn-primary'),
        form.querySelector('.switch-form')
    ].filter(Boolean);
    
    elements.forEach((element, index) => {
        if (element) {
            // Reset inicial
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Animar con delay escalonado
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 150 + (index * 50));
        }
    });
}

// Efecto de ondas al cambiar tabs
function createRippleEffect(button) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${rect.width / 2 - size / 2}px;
        top: ${rect.height / 2 - size / 2}px;
        background: radial-gradient(circle, rgba(68, 229, 255, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        animation: rippleEffect 0.6s ease-out;
        z-index: 0;
    `;
    
    button.style.position = 'relative';
    button.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// Animación de éxito
async function animateSuccess() {
    const card = document.querySelector('.auth-card');
    if (card) {
        card.style.animation = 'successPulse 0.6s ease-in-out';
        await new Promise(resolve => setTimeout(resolve, 600));
        card.style.animation = '';
    }
}

// Sistema de partículas avanzado con Canvas
function initializeParticleSystem() {
    const canvas = document.getElementById('bgParticles');
    const particleContainer = document.querySelector('.particles-container');
    
    if (canvas) {
        initCanvasParticles(canvas);
    }
    
    if (particleContainer) {
        initDOMParticles(particleContainer);
    }
}

// Partículas optimizadas con Canvas
function initCanvasParticles(canvas) {
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Configuración
    const config = {
        particleCount: window.innerWidth < 768 ? 30 : 80,
        connectionDistance: 150,
        mouseInfluence: 120
    };
    
    let particles = [];
    let mouse = { x: 0, y: 0 };
    
    // Redimensionar canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Clase Partícula
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.size = Math.random() * 3 + 1;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.color = this.getRandomColor();
            this.originalSize = this.size;
        }
        
        getRandomColor() {
            const colors = [
                'rgba(68, 229, 255, ',
                'rgba(0, 119, 166, ',
                'rgba(138, 43, 226, '
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        update() {
            // Movimiento
            this.x += this.vx;
            this.y += this.vy;
            
            // Rebote en bordes
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            
            // Interacción con mouse
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < config.mouseInfluence) {
                const force = (config.mouseInfluence - distance) / config.mouseInfluence;
                this.x -= dx * force * 0.02;
                this.y -= dy * force * 0.02;
                this.size = this.originalSize * (1 + force * 0.5);
                this.opacity = Math.min(1, this.opacity + force * 0.3);
            } else {
                this.size = this.originalSize;
                this.opacity *= 0.99;
                if (this.opacity < 0.1) this.opacity = Math.random() * 0.6 + 0.2;
            }
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color + this.opacity + ')';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Efecto de resplandor
            if (this.size > this.originalSize) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color + '0.8)';
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    // Inicializar partículas
    function createParticles() {
        particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    // Dibujar conexiones
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < config.connectionDistance) {
                    const opacity = (1 - distance / config.connectionDistance) * 0.3;
                    const connectionColors = [
                        `rgba(68, 229, 255, ${opacity})`,
                        `rgba(138, 43, 226, ${opacity * 0.8})`
                    ];
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.strokeStyle = connectionColors[Math.floor(Math.random() * connectionColors.length)];
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }
    
    // Bucle de animación
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Actualizar y dibujar partículas
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Dibujar conexiones
        drawConnections();
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Event listeners
    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
    
    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    
    // Pausar cuando no esté visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });
    
    // Inicializar
    resizeCanvas();
    createParticles();
    animate();
}

// Partículas DOM adicionales para respaldo
function initDOMParticles(container) {
    const config = {
        particleCount: window.innerWidth < 768 ? 15 : 25,
        colors: ['#44E5FF', '#0077A6', '#8A2BE2']
    };
    
    // Crear partículas DOM flotantes
    for (let i = 0; i < config.particleCount; i++) {
        createFloatingParticle(container, config);
    }
}

function createFloatingParticle(container, config) {
    const particle = document.createElement('div');
    particle.className = 'particle floating-particle';
    
    const size = Math.random() * 6 + 2;
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 10;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        opacity: ${Math.random() * 0.4 + 0.1};
        animation: orbitalMotion ${duration}s linear infinite, quantumFlicker ${Math.random() * 3 + 2}s ease-in-out infinite;
        animation-delay: ${delay}s, ${Math.random() * 2}s;
        pointer-events: none;
        box-shadow: 0 0 ${size * 2}px ${color};
        will-change: transform, opacity;
    `;
    
    container.appendChild(particle);
    
    // Remover después de la animación para evitar acumulación
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
            // Crear nueva partícula para mantener el efecto continuo
            createFloatingParticle(container, config);
        }
    }, (duration + delay) * 1000);
}

// Agregar estilos de animación dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes successPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        line-height: 1;
    }
    
    .particle {
        transition: transform 0.3s ease, opacity 0.3s ease;
    }
    
    .floating-particle {
        will-change: transform, opacity;
        backface-visibility: hidden;
    }
    
    #bgParticles {
        mix-blend-mode: screen;
    }
    
    @keyframes rippleEffect {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(1);
            opacity: 0;
        }
    }
    
    .form-group {
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .auth-form.active .form-group {
        transform: translateY(0);
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Optimización de rendimiento
function optimizePerformance() {
    // Reducir partículas en dispositivos de baja potencia
    const isLowPerformance = window.navigator.hardwareConcurrency < 4 || 
                            window.innerWidth < 768 || 
                            /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isLowPerformance) {
        // Reducir efectos visuales en dispositivos móviles o de bajo rendimiento
        document.documentElement.style.setProperty('--animation-speed', '0.5');
        const bgGlow = document.querySelector('.bg-glow');
        if (bgGlow) {
            bgGlow.style.filter = 'blur(30px)';
            bgGlow.style.opacity = '0.4';
        }
    }
}

// Ejecutar optimización al cargar
document.addEventListener('DOMContentLoaded', optimizePerformance);

// Funciones de manejo de errores y bloqueo del sistema original
async function handleFailedLogin() {
    authState.attempts++;
    localStorage.setItem('loginAttempts', authState.attempts.toString());

    if (authState.attempts >= AUTH_CONFIG.maxAttempts) {
        await lockUser();
        showNotification(`Demasiados intentos fallidos. Cuenta bloqueada por ${AUTH_CONFIG.lockoutDuration / 60000} minutos.`, 'error');
    } else {
        const remainingAttempts = AUTH_CONFIG.maxAttempts - authState.attempts;
        showNotification(`Credenciales incorrectas. Intentos restantes: ${remainingAttempts}`, 'error');
        await animateError();
    }
}

function lockUser(endTime = null) {
    authState.isLocked = true;
    const lockoutEndTime = endTime || Date.now() + AUTH_CONFIG.lockoutDuration;
    authState.lockoutEndTime = lockoutEndTime;
    
    localStorage.setItem('lockoutEndTime', lockoutEndTime.toString());
    
    const loginButton = document.getElementById('loginSubmit');
    const registerButton = document.getElementById('registerSubmit');
    const loginInput = document.getElementById('loginEmailOrUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    if (loginButton) loginButton.disabled = true;
    if (registerButton) registerButton.disabled = true;
    if (loginInput) loginInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    
    showLockoutCountdown();
}

function showLockoutCountdown() {
    const countdown = setInterval(() => {
        const remaining = Math.max(0, authState.lockoutEndTime - Date.now());
        
        if (remaining <= 0) {
            clearInterval(countdown);
            unlockUser();
        } else {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            const loginButton = document.getElementById('loginSubmit');
            const btnText = loginButton?.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = `Bloqueado (${minutes}:${seconds.toString().padStart(2, '0')})`;
            }
        }
    }, 1000);
}

function unlockUser() {
    authState.isLocked = false;
    authState.attempts = 0;
    authState.lockoutEndTime = null;
    
    localStorage.removeItem('lockoutEndTime');
    localStorage.removeItem('loginAttempts');
    
    const loginButton = document.getElementById('loginSubmit');
    const registerButton = document.getElementById('registerSubmit');
    const loginInput = document.getElementById('loginEmailOrUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    if (loginButton) loginButton.disabled = false;
    if (registerButton) registerButton.disabled = false;
    if (loginInput) loginInput.disabled = false;
    if (passwordInput) passwordInput.disabled = false;
    
    const btnText = loginButton?.querySelector('.btn-text');
    if (btnText) {
        btnText.textContent = 'Ingresar';
    }
}

async function animateError() {
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.style.animation = 'errorShake 0.6s ease-in-out';
        await new Promise(resolve => setTimeout(resolve, 600));
        authCard.style.animation = '';
    }
}

// ===== FUNCIONES PARA LA TARJETA INFORMATIVA DE TÉRMINOS Y CONDICIONES =====

/**
 * Abre la tarjeta informativa de términos y condiciones
 * @param {string} tab - La pestaña a mostrar ('terms', 'privacy', o 'conduct')
 */
function openTermsCard(tab = 'terms') {
    const termsCard = document.getElementById('termsCard');
    if (termsCard) {
        termsCard.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Mostrar la pestaña especificada
        showTermsTab(tab);
    }
}

/**
 * Cierra la tarjeta informativa
 */
function closeTermsCard() {
    const termsCard = document.getElementById('termsCard');
    if (termsCard) {
        termsCard.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Cambia entre las pestañas de términos y privacidad
 * @param {string} tabName - Nombre de la pestaña ('terms' o 'privacy')
 */
function showTermsTab(tabName) {
    // Ocultar todos los contenidos
    const contents = document.querySelectorAll('.terms-content');
    contents.forEach(content => {
        content.classList.remove('active');
        content.style.animation = 'none';
    });

    // Remover clase active de todos los tabs
    const tabs = document.querySelectorAll('.terms-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Mostrar contenido seleccionado
    const selectedContent = document.getElementById(tabName + 'Content');
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.animation = 'fadeIn 0.3s ease';
    }

    // Agregar clase active al tab clickeado
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

/**
 * Acepta los términos y cierra la tarjeta
 */
function acceptTermsAndClose() {
    // Marcar el checkbox único como aceptado
    const acceptAllTermsCheckbox = document.getElementById('acceptAllTerms');

    if (acceptAllTermsCheckbox) {
        acceptAllTermsCheckbox.checked = true;
        // Disparar evento para que se valide el formulario
        acceptAllTermsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Guardar la aceptación en localStorage
    localStorage.setItem('termsAccepted', 'true');
    localStorage.setItem('termsAcceptedDate', new Date().toISOString());
    
    // Cerrar la tarjeta
    closeTermsCard();
    
    // Mostrar mensaje de confirmación
    showNotification('Documentos legales aceptados correctamente', 'success');
}

/**
 * Muestra una notificación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Agregar estilos si no existen
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--glass-strong);
                border: 1px solid var(--border-light);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .notification-success {
                border-color: rgba(40, 167, 69, 0.3);
                background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05));
            }
            
            .notification-error {
                border-color: rgba(220, 53, 69, 0.3);
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(220, 53, 69, 0.05));
            }
            
            .notification-info {
                border-color: rgba(68, 229, 255, 0.3);
                background: linear-gradient(135deg, rgba(68, 229, 255, 0.1), rgba(68, 229, 255, 0.05));
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            
            .notification-message {
                color: var(--text-on-dark);
                font-size: var(--font-size-sm);
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-on-dark);
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Remover automáticamente después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Configurar event listeners para los enlaces de términos
document.addEventListener('DOMContentLoaded', function() {
    // Enlaces de términos y condiciones
    const termsLinks = document.querySelectorAll('a[href="#"]');
    termsLinks.forEach(link => {
        if (link.textContent.includes('Términos y Condiciones')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                openTermsCard('terms');
            });
        } else if (link.textContent.includes('Políticas de Privacidad')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                openTermsCard('privacy');
            });
        } else if (link.textContent.includes('Olvidaste tu contraseña') || link.classList.contains('forgot-link')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                openForgotPasswordModal();
            });
        }
    });

    // También configurar específicamente el enlace de recuperación por clase
    const forgotPasswordLink = document.querySelector('.forgot-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            openForgotPasswordModal();
        });
    }
    
    // Cerrar tarjeta al hacer clic fuera de ella
    const termsCardOverlay = document.getElementById('termsCard');
    if (termsCardOverlay) {
        termsCardOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeTermsCard();
            }
        });
    }

    // Cerrar modal de recuperación al hacer clic fuera
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeForgotPasswordModal();
            }
        });
    }

    // Cerrar modales con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTermsCard();
            closeForgotPasswordModal();
        }
    });
    
    // Verificar si ya se aceptaron los términos al cargar la página
    const termsAccepted = localStorage.getItem('termsAccepted');
    if (termsAccepted) {
        const acceptAllTermsCheckbox = document.getElementById('acceptAllTerms');
        
        if (acceptAllTermsCheckbox) {
            acceptAllTermsCheckbox.checked = true;
        }
    }
});

// Función para limpiar datos de cuenta anterior
function clearPreviousAccountData() {
    const keysToRemove = [
        'currentUser',
        'userData', 
        'userSession',
        'userToken',
        'authToken',
        'userId',
        'user_profile_local'
    ];
    
    // Remover claves específicas
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    
    // Buscar y remover claves de perfil específicas del usuario
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('profile_') || key.startsWith('avatar_') || key.startsWith('cv_'))) {
            localStorage.removeItem(key);
        }
    }
    
    // console.log('✅ Datos de cuenta anterior limpiados');
}

// Función mejorada para login que limpia datos previos
async function loginWithCleanup(emailOrUsername, password, remember = false) {
    try {
        // PASO 1: Limpiar datos de cuenta anterior
        clearPreviousAccountData();
        
        // PASO 2: Proceder con login normal
        let result;
        if (isLocalMode()) {
            result = await validateCredentialsLocal(emailOrUsername, password);
        } else {
            result = await validateCredentialsRemote(emailOrUsername, password);
        }
        
        if (result.success) {
            // PASO 3: Manejar autenticación exitosa
            await handleSuccessfulAuth(emailOrUsername, remember, result.isNewUser);
            return { success: true, isNewUser: result.isNewUser };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error) {
        // console.error('Error en loginWithCleanup:', error);
        return { success: false, error: 'Error interno de login' };
    }
}

// ===== FUNCIONES PARA RECUPERACIÓN DE CONTRASEÑA =====

/**
 * Abre el modal de recuperación de contraseña
 */
function openForgotPasswordModal() {
    console.log('🔐 Abriendo modal de recuperación de contraseña');
    const modal = document.getElementById('forgotPasswordModal');
    console.log('Modal encontrado:', modal);

    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Modal activado con clases:', modal.className);

        // Forzar estilos del input para asegurar visibilidad
        const emailInput = document.getElementById('forgotPasswordEmail');
        console.log('Input de email encontrado:', emailInput);
        if (emailInput) {
            // ESTILOS FINALES CORRECTOS
            emailInput.style.cssText = `
                display: block !important;
                width: 100% !important;
                height: 46px !important;
                background: rgba(255, 255, 255, 0.1) !important;
                color: #FFFFFF !important;
                border: none !important;
                outline: none !important;
                font-size: 0.95rem !important;
                font-family: var(--font-body) !important;
                padding: 12px 50px 12px 16px !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                opacity: 1 !important;
                visibility: visible !important;
                caret-color: #FFFFFF !important;
                line-height: 1.5 !important;
                z-index: 10000 !important;
                position: relative !important;
            `;

            // Forzar estilos del wrapper
            const inputWrapper = emailInput.closest('.input-wrapper');
            if (inputWrapper) {
                inputWrapper.style.cssText = `
                    position: relative !important;
                    display: flex !important;
                    align-items: center !important;
                    background: rgba(255, 255, 255, 0.08) !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    border-radius: 25px !important;
                    min-height: 50px !important;
                    width: 100% !important;
                    margin: 10px 0 25px 0 !important;
                    padding: 0 !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    z-index: 9999 !important;
                `;
                console.log('✅ Wrapper encontrado y estilizado:', inputWrapper);
            } else {
                console.error('❌ No se encontró el wrapper .input-wrapper');
            }

            // Forzar estilos del form-group también
            const formGroup = emailInput.closest('.form-group');
            if (formGroup) {
                formGroup.style.cssText = `
                    display: block !important;
                    margin-bottom: 20px !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    z-index: 9998 !important;
                `;
                console.log('✅ Form-group encontrado y estilizado:', formGroup);
            }

            // Forzar estilos del contenido del modal
            const modalContent = emailInput.closest('.forgot-password-content');
            if (modalContent) {
                modalContent.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    z-index: 9997 !important;
                `;
                console.log('✅ Modal content encontrado y estilizado:', modalContent);
            }

            // Forzar estilos del icono
            const inputIcon = emailInput.parentElement.querySelector('.input-icon');
            if (inputIcon) {
                inputIcon.style.cssText = `
                    position: absolute !important;
                    right: 16px !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                    color: #666666 !important;
                    width: 20px !important;
                    height: 20px !important;
                    z-index: 10001 !important;
                `;
            }

            setTimeout(() => {
                emailInput.focus();
                emailInput.select(); // Seleccionar el texto si hay alguno
                
                // Forzar estilos una vez más después del focus
                emailInput.style.cssText = `
                    display: block !important;
                    width: 100% !important;
                    height: 46px !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    color: #FFFFFF !important;
                    border: none !important;
                    outline: none !important;
                    font-size: 0.95rem !important;
                    font-family: var(--font-body) !important;
                    padding: 12px 50px 12px 16px !important;
                    margin: 0 !important;
                    box-sizing: border-box !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    caret-color: #FFFFFF !important;
                    line-height: 1.5 !important;
                    z-index: 10000 !important;
                    position: relative !important;
                `;
                
                console.log('✅ Estilos aplicados al input:', emailInput.style.cssText);
                
                // Verificar si el input es realmente visible
                const rect = emailInput.getBoundingClientRect();
                console.log('📏 Dimensiones del input:', {
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    left: rect.left,
                    visible: rect.width > 0 && rect.height > 0
                });
                
                // Si no es visible, crear un input de emergencia
                if (rect.width === 0 || rect.height === 0) {
                    console.log('🚨 Input no visible, creando input de emergencia...');
                    createEmergencyInput();
                }
            }, 300); // Esperar a que termine la animación
        }
    } else {
        console.error('❌ No se encontró el modal forgotPasswordModal');
    }
}

/**
 * Crea un input de emergencia si el original no es visible
 */
function createEmergencyInput() {
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) return;
    
    // Buscar el contenedor del formulario
    const form = modal.querySelector('#forgotPasswordForm');
    if (!form) return;
    
    // Crear un nuevo input completamente independiente
    const emergencyInput = document.createElement('input');
    emergencyInput.type = 'email';
    emergencyInput.id = 'emergencyEmailInput';
    emergencyInput.placeholder = 'tu@email.com';
    emergencyInput.required = true;
    
    // Aplicar estilos ultra agresivos
    emergencyInput.style.cssText = `
        display: block !important;
        width: 100% !important;
        height: 50px !important;
        background: #FFFFFF !important;
        color: #000000 !important;
        border: 3px solid #FF0000 !important;
        outline: none !important;
        font-size: 18px !important;
        font-family: Arial, sans-serif !important;
        padding: 15px !important;
        margin: 20px 0 !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        caret-color: #000000 !important;
        line-height: 1.5 !important;
        z-index: 99999 !important;
        position: relative !important;
        border-radius: 10px !important;
    `;
    
    // Crear un contenedor para el input de emergencia
    const emergencyContainer = document.createElement('div');
    emergencyContainer.style.cssText = `
        position: relative !important;
        width: 100% !important;
        margin: 20px 0 !important;
        z-index: 99999 !important;
    `;
    
    // Crear label
    const emergencyLabel = document.createElement('label');
    emergencyLabel.textContent = 'Correo electrónico (Input de emergencia)';
    emergencyLabel.style.cssText = `
        display: block !important;
        color: #FFFFFF !important;
        font-size: 16px !important;
        font-weight: bold !important;
        margin-bottom: 10px !important;
    `;
    
    emergencyContainer.appendChild(emergencyLabel);
    emergencyContainer.appendChild(emergencyInput);
    
    // Insertar antes del botón
    const submitButton = form.querySelector('#forgotPasswordSubmit');
    if (submitButton) {
        form.insertBefore(emergencyContainer, submitButton);
    } else {
        form.appendChild(emergencyContainer);
    }
    
    // Focus en el input de emergencia
    setTimeout(() => {
        emergencyInput.focus();
    }, 100);
    
    console.log('🚨 Input de emergencia creado:', emergencyInput);
}

/**
 * Cierra el modal de recuperación de contraseña
 */
function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Limpiar el formulario
        const form = document.getElementById('forgotPasswordForm');
        if (form) {
            form.reset();
        }

        // Limpiar cualquier mensaje de error en el input
        const emailInput = document.getElementById('forgotPasswordEmail');
        if (emailInput) {
            emailInput.style.borderColor = '';
        }

        // Restaurar estado del botón
        setForgotPasswordLoadingState(false);
    }
}

/**
 * Maneja el envío del formulario de recuperación de contraseña
 */
async function handleForgotPassword(e) {
    e.preventDefault();

    // Intentar obtener el email del input original o del de emergencia
    let emailInput = document.getElementById('forgotPasswordEmail');
    let email = emailInput ? emailInput.value.trim() : '';
    
    // Si no hay email del input original, intentar con el de emergencia
    if (!email) {
        const emergencyInput = document.getElementById('emergencyEmailInput');
        if (emergencyInput) {
            email = emergencyInput.value.trim();
            console.log('📧 Usando input de emergencia:', email);
        }
    }

    if (!email) {
        showNotification('Por favor ingresa tu correo electrónico', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un correo electrónico válido', 'error');
        return;
    }

    setForgotPasswordLoadingState(true);

    try {
        // Intentar con Supabase si está disponible
        if (ENABLE_SUPABASE_AUTH && window.supabase) {
            try {
                console.log('🔄 Verificando usuario en Supabase para:', email);

                // Primero verificar si el usuario existe en Supabase
                const { data: userData, error: userError } = await window.supabase
                    .from('users')
                    .select('id, email')
                    .eq('email', email.toLowerCase())
                    .single();

                console.log('👤 Datos del usuario:', { userData, userError });

                if (userError && userError.code !== 'PGRST116') {
                    console.error('❌ Error verificando usuario:', userError);
                } else if (!userData) {
                    console.log('⚠️ Usuario no encontrado en Supabase, usando servidor propio...');
                } else {
                    console.log('✅ Usuario encontrado, enviando email de recuperación...');

                    // URL de redirección más simple
                    const redirectUrl = `${window.location.protocol}//${window.location.host}/src/login/new-auth.html`;
                    console.log('🔗 URL de redirección:', redirectUrl);

                    const { data, error } = await window.supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: redirectUrl
                    });

                    console.log('📄 Respuesta Supabase:', { data, error });

                    if (!error) {
                        showNotification('Se ha enviado un enlace de recuperación a tu correo electrónico', 'success');
                        closeForgotPasswordModal();
                        return;
                    } else {
                        // Detectar si el error es porque Email logins está deshabilitado
                        const isEmailLoginsDisabled = error.message && (
                            error.message.includes('Email logins are disabled') ||
                            error.message.includes('Email login is disabled') ||
                            error.message.includes('email provider is disabled')
                        );

                        if (isEmailLoginsDisabled) {
                            // Este es un caso esperado - Email provider no está habilitado en Supabase
                            // Continuar silenciosamente con el servidor propio
                            console.log('ℹ️ Supabase Email Provider no habilitado, usando servidor propio...');
                        } else {
                            // Otros errores se registran como errores reales
                            console.error('❌ Error de Supabase:', error);

                            // Mostrar error específico si es útil para el usuario
                            if (error.message.includes('SMTP') || error.message.includes('mail server')) {
                                showNotification('Error: El servicio de email no está configurado. Contacta al administrador.', 'error');
                                return;
                            }
                        }
                    }
                }
            } catch (supabaseError) {
                // Solo registrar como error si no es el error esperado de Email logins disabled
                const isExpectedError = supabaseError.message && (
                    supabaseError.message.includes('Email logins are disabled') ||
                    supabaseError.message.includes('Email login is disabled') ||
                    supabaseError.message.includes('email provider is disabled')
                );

                if (isExpectedError) {
                    console.log('ℹ️ Supabase Email Provider no configurado, usando servidor propio...');
                } else {
                    console.error('❌ Excepción de Supabase:', supabaseError);
                    console.log('⚠️ Supabase no funcionó, continuando con servidor propio...');
                }
            }
        } else {
            console.log('ℹ️ Supabase no está disponible o no está habilitado');
        }

        // Detectar entorno y usar endpoint apropiado
        const isNetlify = window.location.hostname.includes('netlify') || window.location.hostname.includes('.app');
        const endpoint = isNetlify ? '/.netlify/functions/forgot-password' : '/api/forgot-password';

        console.log(`🌐 Entorno detectado: ${isNetlify ? 'Netlify' : 'Local'}, usando endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        console.log('📡 Respuesta del servidor:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Respuesta exitosa:', result);
            showNotification('Se ha enviado un enlace de recuperación a tu correo electrónico', 'success');
            closeForgotPasswordModal();
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            console.error('❌ Error del servidor:', response.status, errorData);

            if (response.status === 404) {
                showNotification('No se encontró una cuenta con ese correo electrónico', 'error');
            } else if (response.status === 429) {
                showNotification('Demasiadas solicitudes. Inténtalo más tarde', 'error');
            } else if (response.status === 400) {
                showNotification(errorData.error || 'Datos inválidos', 'error');
            } else {
                showNotification('Error al enviar el correo de recuperación. Inténtalo más tarde', 'error');
            }
        }

    } catch (error) {
        console.error('Error en recuperación de contraseña:', error);

        // Modo desarrollo: simular envío exitoso
        if (isDev) {
            showNotification('Se ha enviado un enlace de recuperación a tu correo electrónico (Modo desarrollo)', 'success');
            closeForgotPasswordModal();
        } else {
            showNotification('Error de conexión. Inténtalo más tarde', 'error');
        }
    } finally {
        setForgotPasswordLoadingState(false);
    }
}

/**
 * Establece el estado de carga del botón de recuperación
 */
function setForgotPasswordLoadingState(loading) {
    const button = document.getElementById('forgotPasswordSubmit');
    if (!button) return;

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (loading) {
        button.disabled = true;
        if (btnText) btnText.style.opacity = '0';
        if (btnLoader) btnLoader.style.display = 'block';
    } else {
        button.disabled = false;
        if (btnText) btnText.style.opacity = '1';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Valida el formato del email en el modal de recuperación
 */
function validateForgotPasswordEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        input.style.borderColor = '';
        return false;
    }
    
    if (!emailRegex.test(email)) {
        input.style.borderColor = '#ef4444';
        return false;
    }
    
    input.style.borderColor = 'var(--color-primary)';
    return true;
}

/**
 * Configura los event listeners para el modal de recuperación
 */
function setupForgotPasswordEventListeners() {
    // Event listener para cerrar el modal al hacer clic fuera
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('forgotPasswordModal');
        if (modal && e.target === modal) {
            closeForgotPasswordModal();
        }
    });

    // Event listener para cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('forgotPasswordModal');
            if (modal && modal.classList.contains('active')) {
                closeForgotPasswordModal();
            }
        }
    });

    // Event listener para validación en tiempo real del email
    const emailInput = document.getElementById('forgotPasswordEmail');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateForgotPasswordEmail(this);
        });

        emailInput.addEventListener('blur', function() {
            validateForgotPasswordEmail(this);
        });
    }
}

// Configurar event listeners cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupForgotPasswordEventListeners);
} else {
    setupForgotPasswordEventListeners();
}

// Función específica para abrir la tarjeta desde los enlaces del HTML
function showTermsCard() {
    openTermsCard('terms');
}

// Exportar funciones para uso global
window.showTermsCard = showTermsCard;
window.openTermsCard = openTermsCard;
window.closeTermsCard = closeTermsCard;
window.showTermsTab = showTermsTab;
window.acceptTermsAndClose = acceptTermsAndClose;
window.clearPreviousAccountData = clearPreviousAccountData;
window.loginWithCleanup = loginWithCleanup;
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.handleForgotPassword = handleForgotPassword;


