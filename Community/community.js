// ===== COMMUNITY PAGE JAVASCRIPT =====

class CommunityPage {
    constructor() {
        this.currentChat = null;
        this.currentUser = {
            id: 1,
            name: 'Usuario',
            role: 'Estudiante',
            avatar: 'fas fa-user'
        };
        this.db = null;
        this.inviteOnlySlugs = new Set(['openminder', 'sif-icap', 'ecos-de-liderazgo']);
        this.slugCategoryMap = {
            profesionales: 'general',
            openminder: 'negocios',
            'sif-icap': 'negocios',
            'ecos-de-liderazgo': 'negocios'
        };
        this.slugIconMap = {
            profesionales: 'fas fa-globe',
            openminder: 'fas fa-lightbulb'
        };
        this.slugBannerMap = {
            profesionales: './images/comunidad-general.png',
            openminder: './images/openminder.png'
        };
        // Datos de Discover
        this.communities = [];
        this.communityStats = { totalMembers: 0, totalPosts: 0 };
        this.posts = [];
        this.leaderboard = [];
        
        this.init();
    }

    async init() {
        try {
            console.log('[COMMUNITY] 🚀 Iniciando sistema de comunidades...');

            // NUEVO: Debug completo de autenticación
            await this.debugUserAuthentication();

            // Verificar que CommunityDatabase esté disponible
            if (typeof CommunityDatabase === 'undefined') {
                console.error('[COMMUNITY] ❌ CommunityDatabase no está definido');
                console.error('[COMMUNITY] 🔍 Verificar que community-database.js se cargue antes que community.js');
                throw new Error('CommunityDatabase no está disponible - Verificar orden de scripts');
            }

            // Verificar que main.js no tenga errores
            if (typeof window === 'undefined') {
                throw new Error('Entorno de JavaScript no disponible');
            }

            // Intentar inicializar Supabase UNA SOLA VEZ
            console.log('[COMMUNITY] 🔄 Verificando Supabase...');
            const supabaseOk = await this.ensureSupabaseClient();

            if (!supabaseOk) {
                console.error('[COMMUNITY] ❌ Supabase no disponible - Mostrando error al usuario');
                this.showSupabaseError();
                return;
            }

            // Verificar sesión de Supabase para operaciones protegidas
            console.log('[COMMUNITY] 🔍 Verificando sesión de Supabase...');
            this.hasValidSession = await window.hasCommunitySession();

            if (this.hasValidSession) {
                console.log('[COMMUNITY] ✅ Sesión válida - habilitando funciones protegidas');
            } else {
                console.log('[COMMUNITY] ⚠️ Sin sesión - modo solo lectura');
            }

            // Continuar con inicialización normal
            console.log('[COMMUNITY] 🔄 Inicializando CommunityDatabase...');
            this.db = new CommunityDatabase();
            await this.db.initialize();
            await this.loadCommunityData();

            console.log('[COMMUNITY] ✅ Sistema de comunidades inicializado');

        } catch (error) {
            console.error('[COMMUNITY] ❌ Error crítico en init:', error);

            // Mostrar error específico según el tipo
            if (error.message.includes('CommunityDatabase')) {
                this.showScriptError('CommunityDatabase no disponible', 'Verificar que community-database.js se cargue correctamente');
            } else {
                this.showSupabaseError();
            }
        }

        this.setupEventListeners();
        this.setupAnimations();
        this.fillUserHeader();
    }

    // NUEVA función para debug completo de autenticación
    async debugUserAuthentication() {
        console.log('🔍 === DEBUG AUTENTICACIÓN DE USUARIO (COMMUNITY) ===');

        // Usar el nuevo sistema de autenticación
        if (window.CommunityAuth) {
            console.log('✅ CommunityAuth disponible - ejecutando debug completo...');
            const debugResult = await window.CommunityAuth.debugAuthState();
            console.log('📊 Resultado debug CommunityAuth:', debugResult);
            return debugResult;
        } else {
            console.error('❌ CommunityAuth NO disponible - usando debug legacy...');
        }

        // Verificar localStorage (donde funciona el menú de perfil)
        console.log('📊 LocalStorage:');
        const localStorageKeys = ['currentUser', 'userData', 'user', 'authToken', 'userSession', 'profile'];
        localStorageKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value && value !== 'null' && value !== 'undefined') {
                console.log(`  ✅ ${key}: Presente (${value.length} chars)`, value.substring(0, 100) + '...');

                // Intentar parsear para ver contenido
                try {
                    const parsed = JSON.parse(value);
                    if (parsed && (parsed.email || parsed.id)) {
                        console.log(`    📧 Email: ${parsed.email || 'No definido'}`);
                        console.log(`    🆔 ID: ${parsed.id || parsed.user_id || 'No definido'}`);
                    }
                } catch (e) {
                    console.log(`    ⚠️ No es JSON válido`);
                }
            } else {
                console.log(`  ❌ ${key}: Ausente o null`);
            }
        });

        // Verificar sessionStorage
        console.log('📊 SessionStorage:');
        localStorageKeys.forEach(key => {
            const value = sessionStorage.getItem(key);
            if (value && value !== 'null') {
                console.log(`  ✅ ${key}: Presente (${value.length} chars)`);
            } else {
                console.log(`  ❌ ${key}: Ausente`);
            }
        });

        // Verificar variables globales
        console.log('📊 Variables globales:');
        console.log('  window.currentUser:', window.currentUser ? '✅ Presente' : '❌ Ausente');
        console.log('  window.user:', window.user ? '✅ Presente' : '❌ Ausente');
        console.log('  window.userData:', window.userData ? '✅ Presente' : '❌ Ausente');

        // Verificar AuthUtils
        console.log('📊 AuthUtils:');
        if (window.AuthUtils) {
            console.log('  ✅ AuthUtils disponible');
            // Usar AuthUtils para debug completo
            window.AuthUtils.debugAuthenticationState();
        } else {
            console.log('  ❌ AuthUtils NO disponible - Verificar carga de script');
        }

        // Verificar estado de Supabase
        console.log('📊 Estado Supabase:');
        console.log('  window.supabase:', window.supabase ? '✅ Disponible' : '❌ No disponible');
        console.log('  window.supabaseInitialized:', window.supabaseInitialized);

        if (window.supabase && window.supabase.auth) {
            console.log('  ✅ Supabase auth disponible - Verificando sesión...');
            window.supabase.auth.getSession().then(({ data: { session }, error }) => {
                console.log('  📊 Supabase session:', session ? '✅ Presente' : '❌ Ausente');
                console.log('  📊 Supabase session error:', error);
                if (session?.user) {
                    console.log('  📧 Supabase user email:', session.user.email);
                }
            }).catch(err => {
                console.log('  ❌ Error obteniendo sesión Supabase:', err);
            });
        } else {
            console.log('  ❌ Supabase auth NO disponible');
        }

        console.log('🔍 === FIN DEBUG AUTENTICACIÓN (COMMUNITY) ===');
    }

    async ensureSupabaseClient() {
        console.log('[COMMUNITY] 🔍 Verificando cliente Supabase...');

        // UNA SOLA VERIFICACIÓN - NO REINTENTOS
        if (window.supabase && window.supabaseInitialized) {
            console.log('[COMMUNITY] ✅ Supabase ya disponible');
            return true;
        }

        // UN SOLO INTENTO DE INICIALIZACIÓN
        try {
            console.log('[COMMUNITY] 🔄 Intentando inicializar Supabase (una sola vez)...');
            await initializeSupabaseClient();

            if (window.supabase && window.supabaseInitialized) {
                console.log('[COMMUNITY] ✅ Supabase inicializado exitosamente');
                return true;
            } else {
                console.error('[COMMUNITY] ❌ Supabase no se inicializó correctamente');
                return false;
            }
        } catch (error) {
            console.error('[COMMUNITY] ❌ Error inicializando Supabase:', error);
            return false;
        }
    }
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Navigation bar functionality
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            if(btn.dataset && btn.dataset.tab){
                btn.addEventListener('click', () => { this.handleTabClick(btn); });
            }
        });

        // Filtros Discover
        document.querySelectorAll('.discover-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.discover-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.renderDiscover(chip.dataset.category, (document.getElementById('discoverSearch')?.value || ''));
            });
        });

        // BÃºsqueda Discover
        const search = document.getElementById('discoverSearch');
        const clearBtn = document.getElementById('discoverClear');
        if(search){
            const trigger = () => {
                const active = document.querySelector('.discover-chip.active');
                const cat = active ? active.dataset.category : 'all';
                const q = search.value.trim();
                if(clearBtn){ clearBtn.style.display = q ? 'inline-flex' : 'none'; }
                this.renderDiscover(cat, q);
            };
            search.addEventListener('input', trigger);
            search.addEventListener('keypress', (e)=>{ if(e.key==='Enter'){ trigger(); }});
        }
        if(clearBtn){
            clearBtn.addEventListener('click', ()=>{
                const searchEl = document.getElementById('discoverSearch');
                if(searchEl){ searchEl.value=''; }
                clearBtn.style.display='none';
                const active = document.querySelector('.discover-chip.active');
                const cat = active ? active.dataset.category : 'all';
                this.renderDiscover(cat, '');
                searchEl?.focus();
            });
        }

        // (Feed removido)
    }

    fillUserHeader(){
        try{
            const raw = localStorage.getItem('currentUser');
            if(raw) {
                const user = JSON.parse(raw);
                const nameEl = document.getElementById('pmName');
                const emailEl = document.getElementById('pmEmail');
                if(nameEl && user.display_name) nameEl.textContent = user.display_name;
                if(emailEl) emailEl.textContent = user.email || user.user?.email || user.data?.email || '';
                // Usar ambos campos con fallback: profile_picture_url (nuevo) y avatar_url (legacy)
                const avatarUrl = user.profile_picture_url || user.avatar_url;
                if(avatarUrl){
                    document.querySelectorAll('.header-profile img, #profileMenu .pm-avatar img').forEach(img=>{img.src=avatarUrl;});
                }
            }
        }catch(e){
            console.log('Error loading user data:', e);
        }
        
        // Setup profile menu functionality
        this.setupProfileMenu();
    }

    setupProfileMenu() {
        const avatarBtn = document.querySelector('.header-profile');
        const menu = document.getElementById('profileMenu');
        if (!avatarBtn || !menu) {
            console.error('[PROFILE] âŒ Elementos del menÃº de perfil no encontrados');
            return;
        }
        console.log('[PROFILE] ✅ Menú de perfil configurado correctamente');
        
        avatarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menu.classList.toggle('show');
        });
        
        // Cerrar menÃº al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !avatarBtn.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
        
        // Llenar datos del usuario
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const nameEl = document.getElementById('pmName');
            const emailEl = document.getElementById('pmEmail');
            if (nameEl) nameEl.textContent = currentUser.display_name || currentUser.username || 'Usuario';
            if (emailEl) emailEl.textContent = currentUser.email || currentUser.user?.email || currentUser.data?.email || '';
            // avatar - usar ambos campos con fallback: profile_picture_url (nuevo) y avatar_url (legacy)
            const avatarUrl = currentUser.profile_picture_url || currentUser.avatar_url;
            if (avatarUrl) {
                document.querySelectorAll('.header-profile img, #profileMenu .pm-avatar img').forEach(img => {
                    img.src = avatarUrl;
                });
            }
        } catch (e) { /* noop */ }
    }

    // ===== NAVIGATION HANDLING =====
    handleTabClick(clickedBtn) {
        // Get the tab from data attribute
        const tab = clickedBtn.dataset.tab;
        
        // Handle different tabs
        switch(tab) {
            case 'mis-cursos':
                // Navegar a la versiÃ³n ES de cursos
                window.location.href = '../cursos.html';
                break;
            case 'noticias':
                // Navigate directly to news page without showing toast
                window.location.href = '../Notices/notices.html';
                break;
            case 'comunidad':
                // Reload the current page to restart the community page
                window.location.reload();
                break;
            default:
                this.showToast('SecciÃ³n no disponible', 'warning');
        }
    }

    // ===== DATA LOADING =====
    async loadCommunityData() {
        console.log('📊 ULTRATHINK: Cargando datos de comunidad con autenticación mejorada...');
        this.showLoading();

        try {
            if (!this.db) {
                console.warn('[COMMUNITY] Base de datos no inicializada');
                this.communities = [];
                this.communityStats = { totalMembers: 0, totalPosts: 0 };
                this.renderDiscover('all', '');
                this.updateStats();
                return;
            }

            // ULTRATHINK: Verificar estado de autenticación antes de cargar comunidades
            console.log('🔍 ULTRATHINK: Verificando autenticación antes de cargar comunidades...');
            const currentUser = await this.db.getCurrentUser();
            console.log('👤 ULTRATHINK: Estado de autenticación:', currentUser ? currentUser.email : 'No autenticado');

            // Obtener comunidades usando método ULTRATHINK híbrido
            console.log('🏘️ ULTRATHINK: Cargando comunidades con método híbrido...');
            this.communities = await this.db.getCommunities();
            console.log('🏘️ ULTRATHINK: Comunidades cargadas:', this.communities);
            console.log('📊 ULTRATHINK: Número de comunidades encontradas:', this.communities.length);

            if (this.communities.length === 0) {
                console.warn('⚠️ ULTRATHINK: No se encontraron comunidades - DIAGNÓSTICO COMPLETO:');
                console.warn('  1. 📊 Estado autenticación:', currentUser ? '✅ Usuario autenticado' : '❌ Sin autenticación');
                console.warn('  2. 🏗️ Datos en tabla communities');
                console.warn('  3. 🔍 Filtros aplicados (is_active, etc.)');
                console.warn('  4. 🔐 Permisos Row Level Security (RLS)');
                console.warn('  5. 🔑 Políticas de acceso en Supabase');
                console.warn('  📋 ACCIÓN: Revisar console log del método getCommunities() para detalles específicos');
            }

            const baseCommunities = this.communities;

            if (!Array.isArray(baseCommunities) || baseCommunities.length === 0) {
                this.communities = [];
                this.communityStats = { totalMembers: 0, totalPosts: 0 };
                this.renderDiscover('all', '');
                this.updateStats();
                return;
            }

            const hydrated = await Promise.all(baseCommunities.map(async (community) => {
                let memberCount = 0;
                let postCount = 0;

                try {
                    if (typeof this.db.countCommunityMembers === 'function') {
                        memberCount = await this.db.countCommunityMembers(community.id);
                    } else if (typeof this.db.getCommunityMembers === 'function') {
                        const members = await this.db.getCommunityMembers(community.id);
                        memberCount = Array.isArray(members) ? members.length : 0;
                    }
                } catch (memberError) {
                    console.warn('[COMMUNITY] Error obteniendo miembros:', memberError);
                }

                try {
                    if (typeof this.db.countCommunityPosts === 'function') {
                        postCount = await this.db.countCommunityPosts(community.id);
                    }
                } catch (postError) {
                    console.warn('[COMMUNITY] Error obteniendo publicaciones:', postError);
                }

                return this.mapCommunityRecord(community, memberCount, postCount);
            }));

            this.communities = hydrated;
            this.communityStats.totalMembers = hydrated.reduce((sum, item) => sum + (item.memberCount || 0), 0);
            this.communityStats.totalPosts = hydrated.reduce((sum, item) => sum + (item.postCount || 0), 0);

            // Obtener estadísticas
            console.log('📈 Estadísticas:', this.communityStats);

            const activeChip = document.querySelector('.discover-chip.active');
            const category = activeChip ? activeChip.dataset.category : 'all';
            const query = (document.getElementById('discoverSearch')?.value || '').trim();

            // Renderizar
            this.renderDiscover(category, query);
            this.updateStats();
        } catch (error) {
            console.error('[COMMUNITY] Error cargando comunidades:', error);
            this.communities = [];
            this.communityStats = { totalMembers: 0, totalPosts: 0 };
            this.renderDiscover('all', '');
            this.updateStats();
            this.showToast('No se pudieron cargar tus comunidades. Intenta nuevamente.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    mapCommunityRecord(record, memberCount = 0, postCount = 0) {
        const slug = record.slug || String(record.id);
        const category = this.getCategoryForCommunity(record);
        const icon = this.getIconForCommunity(record);

        // Priorizar imagen_url de la base de datos, luego otros campos, y finalmente fallback local
        const thumb = record.imagen_url || record.banner_url || record.cover_image_url || record.hero_image_url || record.image_url || this.defaultBannerForSlug(slug);
        const accessLabel = this.getAccessLabel(record, slug);

        return {
            id: record.id,
            slug,
            title: record.name || record.title || 'Comunidad',
            description: record.description || '',
            category,
            icon,
            thumb: thumb,
            memberCount,
            postCount,
            membersLabel: memberCount ? this.formatMemberCount(memberCount) + ' Members' : '0 Members',
            accessLabel,
            inviteOnly: this.inviteOnlySlugs.has(slug) || accessLabel.toLowerCase() !== 'free'
        };
    }

    formatMemberCount(value) {
        if (!value) return '0';
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(value);
    }

    defaultBannerForSlug(slug) {
        return this.slugBannerMap[slug] || '';
    }

    getIconForCommunity(record) {
        const slug = record.slug || '';
        if (this.slugIconMap[slug]) {
            return this.slugIconMap[slug];
        }
        return record.icon_class || record.icon || 'fas fa-users';
    }

    getCategoryForCommunity(record) {
        const slug = record.slug || '';
        if (record.category) {
            return String(record.category).toLowerCase();
        }
        if (this.slugCategoryMap[slug]) {
            return this.slugCategoryMap[slug];
        }
        return 'general';
    }

    getAccessLabel(record, slug) {
        if (record.access_label) {
            return record.access_label;
        }
        if (record.access_type === 'invite_only' || record.visibility === 'invite_only') {
            return 'Invitación';
        }
        if (this.inviteOnlySlugs.has(slug)) {
            return 'Invitación';
        }
        return 'Free';
    }

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ===== DISCOVER GRID =====
    async renderDiscover(category = 'all', query = '') {
        const grid = document.getElementById('discoverGrid');
        if (!grid) return;

        const normalizedCategory = category || 'all';
        const normalizedQuery = (query || '').toLowerCase();

        const filteredByCategory = normalizedCategory === 'all'
            ? this.communities
            : this.communities.filter(c => (c.category || 'general') === normalizedCategory);

        const list = normalizedQuery
            ? filteredByCategory.filter(c => `${c.title} ${c.description}`.toLowerCase().includes(normalizedQuery))
            : filteredByCategory;

        if (!list.length) {
            grid.innerHTML = `
                <div class="discover-empty">
                    <i class="fas fa-users-slash"></i>
                    <h3>No tienes comunidades disponibles</h3>
                    <p>Cuando recibas acceso a una comunidad aparecerá en este panel.</p>
                </div>
            `;
            return;
        }

        // Obtener estados de solicitudes para comunidades invite_only y membresía para comunidades gratuitas
        const hasSession = this.hasValidSession;
        const communitiesWithRequests = await Promise.all(list.map(async (c) => {
            let requestStatus = null;
            let isMember = false;

            if (hasSession) {
                if (c.inviteOnly) {
                    const lastRequest = await this.getLastRequest(c.id);
                    requestStatus = lastRequest ? lastRequest.status : null;
                } else {
                    // Para comunidades gratuitas, verificar si ya es miembro
                    isMember = await this.isMember(c.id);
                }
            }

            return { ...c, requestStatus, hasSession, isMember };
        }));

        grid.innerHTML = communitiesWithRequests.map(c => {
            const title = this.escapeHtml(c.title);
            const desc = this.escapeHtml(c.description) || 'Pronto tendrás más detalles.';
            const membersLabel = this.escapeHtml(c.membersLabel || '0 Members');

            // Determinar label de acceso dinámico y botón de acción
            let accessLabel = this.escapeHtml(c.accessLabel || 'Free');
            let accessClass = '';
            let actionButton = '';

            if (c.inviteOnly) {
                if (!c.hasSession) {
                    accessLabel = 'Inicia sesión';
                    accessClass = 'access-status login-required';
                } else if (c.requestStatus) {
                    switch (c.requestStatus) {
                        case 'pending':
                            accessLabel = 'Pendiente';
                            accessClass = 'access-status pending';
                            break;
                        case 'rejected':
                            accessLabel = 'Rechazada';
                            accessClass = 'access-status rejected';
                            break;
                        default:
                            accessLabel = 'Invitación';
                            accessClass = 'access-status invite-only';
                    }
                } else {
                    accessLabel = 'Invitación';
                    accessClass = 'access-status invite-only';
                }
            } else {
                // Es una comunidad gratuita - agregar botón de unirse si no es miembro
                if (c.hasSession && !c.isMember) {
                    actionButton = `<button class="join-community-btn" data-community-id="${c.id}" data-community-name="${this.escapeHtml(c.title)}">Unirse a la comunidad</button>`;
                } else if (c.hasSession && c.isMember) {
                    // Si ya es miembro, mostrar estado de miembro
                    accessLabel = 'Miembro';
                    accessClass = 'access-status member';
                }
            }

            const cardSlug = this.escapeHtml(c.slug);
            const iconClass = this.escapeHtml(c.icon || 'fas fa-users');

            return `
                <div class="discover-card" data-slug="${cardSlug}">
                    <div class="discover-thumb">
                        ${c.thumb ? `<img src="${c.thumb}" alt="${title}" class="discover-image">` : ''}
                    </div>
                    <div class="discover-body">
                        <div class="discover-icon"><i class="${iconClass}"></i></div>
                        <div class="discover-main">
                            <div class="discover-title">${title}</div>
                            <div class="discover-desc">${desc}</div>
                            <div class="discover-meta">
                                <span>${membersLabel}</span>
                                <span class="dot"></span>
                                <span class="${accessClass}">${accessLabel}</span>
                            </div>
                            ${actionButton ? `<div class="discover-actions">${actionButton}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.discover-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                // Si se hizo click en el botón de unirse, no procesar el click de la tarjeta
                if (e.target.closest('.join-community-btn')) {
                    return;
                }

                e.preventDefault();
                const slug = card.getAttribute('data-slug');
                if (!slug) return;

                // Buscar la comunidad en los datos
                const community = this.communities.find(c => c.slug === slug);
                if (!community) {
                    window.location.href = `./community-view.html?slug=${encodeURIComponent(slug)}`;
                    return;
                }

                // Si es invite_only, verificar sesión y membresía
                if (community.inviteOnly) {
                    // Verificar sesión primero
                    if (!(await window.hasCommunitySession())) {
                        await window.requireCommunitySession();
                        this.showToast('Inicia sesión para solicitar acceso', 'warning');
                        return;
                    }

                    const isMember = await this.isMember(community.id);
                    if (!isMember) {
                        // Mostrar modal de solicitud de acceso
                        await this.openAccessRequestModal(community);
                        return;
                    }
                }

                // Si es miembro o no es invite_only, navegar normalmente
                window.location.href = `./community-view.html?slug=${encodeURIComponent(slug)}`;
            });
        });

        // Agregar event listeners para botones de unirse a comunidad
        grid.querySelectorAll('.join-community-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const communityId = btn.getAttribute('data-community-id');
                const communityName = btn.getAttribute('data-community-name');

                if (!communityId) return;

                // Verificar sesión primero
                if (!(await window.hasCommunitySession())) {
                    await window.requireCommunitySession();
                    this.showToast('Inicia sesión para unirte a la comunidad', 'warning');
                    return;
                }

                // Verificar si ya es miembro
                const isMember = await this.isMember(communityId);
                if (isMember) {
                    this.showToast('Ya eres miembro de esta comunidad', 'info');
                    return;
                }

                // Deshabilitar el botón temporalmente
                btn.disabled = true;
                const originalText = btn.textContent;
                btn.textContent = 'Uniéndose...';

                try {
                    await this.joinCommunity(communityId, communityName);
                } finally {
                    // Restaurar el botón
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            });
        });
    }

    // (Se elimina el mÃ³dulo de feed)

    // ===== ACTIVITY FEED =====
    renderActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        
        activityFeed.innerHTML = this.activityData.map(activity => `
            <div class="activity-item">
                <div class="activity-avatar">
                    <i class="${activity.avatar}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>${activity.user}</strong> ${activity.action}
                    </div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    loadMoreActivity() {
        // Simulate loading more activity
        this.showToast('Cargando mÃ¡s actividad...', 'info');
        
        setTimeout(() => {
            // Add more mock activity
            const newActivity = [
                {
                    id: this.activityData.length + 1,
                    user: 'Laura FernÃ¡ndez',
                    avatar: 'fas fa-user',
                    action: 'completÃ³ el curso de ChatGPT',
                    time: 'Hace 3 horas'
                },
                {
                    id: this.activityData.length + 2,
                    user: 'Diego RamÃ­rez',
                    avatar: 'fas fa-user',
                    action: 'se uniÃ³ a la comunidad',
                    time: 'Hace 4 horas'
                }
            ];

            this.activityData.push(...newActivity);
            this.renderActivityFeed();
            this.showToast('Actividad actualizada', 'success');
        }, 1000);
    }

    // ===== STATISTICS =====
    updateStats() {
        // EstadÃ­sticas del hero
        const totalMembersElement = document.getElementById('totalMembers');
        const totalPostsElement = document.getElementById('totalPosts');
        if (totalMembersElement) this.animateNumber(totalMembersElement, 0, this.communityStats.totalMembers, 2000);
        if (totalPostsElement) this.animateNumber(totalPostsElement, 0, this.communityStats.totalPosts, 2000);
    }

    // (Se elimina updateChatStats)

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeOutCubic);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    // ===== ANIMATIONS =====
    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.guideline-card, .discover-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // ===== ACCESS REQUEST FUNCTIONS =====

    async getCurrentUserId() {
        try {
            // Usar el sistema robusto de autenticación
            if (window.CommunityAuth) {
                return await window.CommunityAuth.getCurrentUserId();
            }

            console.error('[ACCESS] ❌ CommunityAuth no está disponible');
            return null;
        } catch (error) {
            console.error('[ACCESS] ❌ Error obteniendo userId:', error);
            return null;
        }
    }

    async isMember(communityId) {
        try {
            // Verificar sesión de Supabase primero
            if (!(await window.hasCommunitySession())) {
                console.warn('[ACCESS] Sin sesión Supabase - no verificando membresía');
                return false;
            }

            // Obtener userId usando método robusto
            const userId = await this.getCurrentUserId();
            if (!userId) {
                console.warn('[ACCESS] Usuario no autenticado para verificar membresía');
                return false;
            }
            const { data, error } = await window.supabase
                .from('community_members')
                .select('user_id')
                .eq('community_id', communityId)
                .eq('user_id', userId)
                .eq('is_active', true)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.warn('[ACCESS] Error verificando membresía:', error);
                return false;
            }

            return !!data;
        } catch (error) {
            console.error('[ACCESS] Error en isMember:', error);
            return false;
        }
    }

    async getLastRequest(communityId) {
        try {
            // Verificar sesión de Supabase primero
            if (!(await window.hasCommunitySession())) {
                console.warn('[ACCESS] Sin sesión Supabase - no obteniendo solicitudes');
                return null;
            }

            // Obtener userId usando método robusto
            const userId = await this.getCurrentUserId();
            if (!userId) {
                console.warn('[ACCESS] Usuario no autenticado para obtener solicitudes');
                return null;
            }
            const { data, error } = await window.supabase
                .from('community_access_requests')
                .select('id,status,created_at')
                .eq('community_id', communityId)
                .eq('requester_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.warn('[ACCESS] Error obteniendo solicitud:', error);
                return null;
            }

            return (data && data[0]) || null;
        } catch (error) {
            console.error('[ACCESS] Error en getLastRequest:', error);
            return null;
        }
    }

    async requestAccess(communityId) {
        try {
            console.log('[ACCESS] 🚀 Solicitando acceso a comunidad:', communityId);

            // Verificar sesión de Supabase primero
            if (!(await window.hasCommunitySession())) {
                await window.requireCommunitySession();
                this.showToast('Inicia sesión para solicitar acceso', 'warning');
                return;
            }

            console.log('[ACCESS] 🚀 Solicitando acceso vía RPC...');

            const { error } = await window.executeRPCWithAuth('rpc_request_access', {
                p_community_id: communityId
            });

            if (error) {
                console.error('[ACCESS] ❌ Error en RPC Supabase:', error);
                throw error;
            }

            console.log('[ACCESS] ✅ Solicitud creada exitosamente via RPC');
            this.showToast('Solicitud enviada exitosamente', 'success');
            return true;
        } catch (error) {
            console.error('[ACCESS] ❌ Error solicitando acceso:', error);

            // Manejar errores específicos
            if (error?.status === 401 || error?.code === '401') {
                this.showToast('Tu sesión expiró. Inicia sesión e inténtalo de nuevo.', 'error');
            } else if (error?.code === '42501') {
                this.showToast('No tienes permisos para realizar esta acción.', 'error');
            } else {
                this.showToast('No se pudo enviar la solicitud. Inténtalo más tarde.', 'error');
            }

            throw error;
        }
    }

    async openAccessRequestModal(community) {
        console.log('[ACCESS] Abriendo modal para comunidad:', community.title);

        // Verificar sesión de Supabase primero
        if (!(await window.hasCommunitySession())) {
            await window.requireCommunitySession();
            this.showToast('Inicia sesión para solicitar acceso', 'warning');
            return;
        }

        // Verificar si ya existe una solicitud
        const lastRequest = await this.getLastRequest(community.id);

        const modalHtml = `
            <div id="accessRequestModal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Solicitar acceso a ${this.escapeHtml(community.title)}</h2>
                        <button class="modal-close" onclick="document.getElementById('accessRequestModal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${lastRequest && lastRequest.status === 'pending' ?
                            '<p class="request-status pending">Ya tienes una solicitud pendiente para esta comunidad.</p>' :
                            lastRequest && lastRequest.status === 'rejected' ?
                                '<p class="request-status rejected">Tu solicitud anterior fue rechazada. Puedes solicitar acceso nuevamente.</p>' :
                                '<p>¿Te gustaría solicitar acceso a esta comunidad?</p>'
                        }
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="document.getElementById('accessRequestModal').remove()">
                            Cancelar
                        </button>
                        <button id="sendRequestBtn" class="btn-primary"
                                ${lastRequest && lastRequest.status === 'pending' ? 'disabled' : ''}>
                            ${lastRequest && lastRequest.status === 'pending' ? 'Solicitud Pendiente' : 'Enviar Solicitud'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Event listener para enviar solicitud
        const sendBtn = document.getElementById('sendRequestBtn');
        if (sendBtn && (!lastRequest || lastRequest.status !== 'pending')) {
            sendBtn.addEventListener('click', async () => {
                sendBtn.disabled = true;
                sendBtn.textContent = 'Enviando...';

                try {
                    await this.requestAccess(community.id);
                    document.getElementById('accessRequestModal').remove();

                    // Actualizar la UI para mostrar estado pendiente
                    this.updateCommunityCardStatus(community.slug, 'pending');
                } catch (error) {
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Enviar Solicitud';
                }
            });
        }
    }

    updateCommunityCardStatus(slug, status) {
        const card = document.querySelector(`[data-slug="${slug}"]`);
        if (!card) return;

        const metaElement = card.querySelector('.discover-meta');
        if (!metaElement) return;

        const spans = metaElement.querySelectorAll('span');
        if (spans.length >= 3) {
            // Actualizar el texto del estado
            switch (status) {
                case 'pending':
                    spans[2].textContent = 'Pendiente';
                    spans[2].className = 'access-status pending';
                    break;
                case 'rejected':
                    spans[2].textContent = 'Rechazada';
                    spans[2].className = 'access-status rejected';
                    break;
                default:
                    spans[2].textContent = 'Invitación';
                    spans[2].className = 'access-status invite-only';
            }
        }
    }

    async joinCommunity(communityId, communityName) {
        try {
            console.log('[JOIN] 🚀 Intentando unirse a comunidad:', communityName);

            // Verificar que tenemos acceso a la base de datos
            if (!this.db) {
                console.error('[JOIN] ❌ Base de datos no inicializada');
                this.showToast('Error: Base de datos no disponible', 'error');
                return;
            }

            // Obtener el usuario actual
            const userId = await this.getCurrentUserId();
            if (!userId) {
                console.error('[JOIN] ❌ Usuario no autenticado');
                this.showToast('Error: Usuario no autenticado', 'error');
                return;
            }

            console.log('[JOIN] 🔍 Ejecutando joinCommunity con userId:', userId);

            // Actualizar usuario en la instancia de base de datos
            await this.db.getCurrentUserWithAuthUtils();

            // Ejecutar el JOIN usando la función directamente de CommunityDatabase
            const joinSuccess = await this.db.joinCommunity(communityId);

            if (joinSuccess) {
                console.log('[JOIN] ✅ Usuario unido exitosamente a la comunidad');

                // Mostrar notificación de éxito
                this.showToast(`¡Te has unido exitosamente a ${communityName}!`, 'success');

                // Actualizar contador de miembros y recargar datos
                await this.updateCommunityMemberCount(communityId);

                // Actualizar la UI para ocultar el botón de unirse
                this.updateCommunityCardForMember(communityId);

                // Recargar datos de la comunidad para reflejar cambios
                setTimeout(async () => {
                    await this.loadCommunityData();
                }, 1000);

            } else {
                console.error('[JOIN] ❌ Error uniéndose a la comunidad');
                this.showToast('No se pudo unir a la comunidad. Inténtalo más tarde.', 'error');
            }

        } catch (error) {
            console.error('[JOIN] ❌ Error en joinCommunity:', error);

            if (error?.code === '23505') {
                // Duplicated key - ya es miembro
                this.showToast('Ya eres miembro de esta comunidad', 'info');
            } else {
                this.showToast('Error al unirse a la comunidad. Inténtalo más tarde.', 'error');
            }
        }
    }

    async updateCommunityMemberCount(communityId) {
        try {
            console.log('[COUNT] 📊 Actualizando contador de miembros para comunidad:', communityId);

            // Obtener nuevo conteo usando CommunityDatabase
            const newCount = await this.db.countCommunityMembers(communityId);

            console.log('[COUNT] 📊 Nuevo conteo de miembros:', newCount);

            // Actualizar el contador en la tarjeta de comunidad
            const card = document.querySelector(`[data-community-id="${communityId}"]`)?.closest('.discover-card');
            if (card) {
                const memberSpan = card.querySelector('.discover-meta span:first-child');
                if (memberSpan) {
                    memberSpan.textContent = `${newCount} ${newCount === 1 ? 'Member' : 'Members'}`;
                    console.log('[COUNT] ✅ Contador actualizado en la UI');
                }
            }

            // Actualizar estadísticas globales
            this.communityStats.totalMembers = this.communities.reduce((sum, c) => {
                return sum + (c.id === communityId ? newCount : (c.memberCount || 0));
            }, 0);

            this.updateStats();

        } catch (error) {
            console.error('[COUNT] ❌ Error actualizando contador:', error);
        }
    }

    updateCommunityCardForMember(communityId) {
        // Encontrar la tarjeta de comunidad
        const joinButton = document.querySelector(`[data-community-id="${communityId}"]`);
        if (joinButton) {
            // Ocultar el botón de unirse
            const actionsDiv = joinButton.closest('.discover-actions');
            if (actionsDiv) {
                actionsDiv.remove();
            }

            console.log('[UI] ✅ Botón de unirse removido de la UI');
        }
    }

    // ===== UTILITIES =====
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    showSupabaseError() {
        console.log('[COMMUNITY] 📊 Mostrando error de Supabase al usuario...');
        this.communities = [];
        this.communityStats = { totalMembers: 0, totalPosts: 0 };
        this.renderDiscover('all', '');
        this.updateStats();
        this.showToast('No se pudieron cargar tus comunidades. Base de datos no disponible.', 'error');
        this.hideLoading();
    }

    showScriptError(title, message) {
        console.log('🚨 Mostrando error de script al usuario');

        const discoverGrid = document.getElementById('discoverGrid');
        if (discoverGrid) {
            discoverGrid.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <p>Revisar consola del navegador para más detalles.</p>
                    <button onclick="location.reload()" class="retry-button">Recargar Página</button>
                </div>
            `;
        }

        this.updateStatsWithError();
    }

    updateStatsWithError() {
        this.communities = [];
        this.communityStats = { totalMembers: 0, totalPosts: 0 };
        this.updateStats();
        this.hideLoading();
    }
}

// ===== THEME TOGGLE FUNCTIONS =====
window.toggleTheme = function() {
    console.log('ðŸŽ¨ Theme toggle called from community');

    // Agregar efecto de click al botÃ³n
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.classList.add('clicked');
        setTimeout(() => {
            themeToggle.classList.remove('clicked');
        }, 400);
    }

    // Obtener tema actual antes del cambio
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Usar la funciÃ³n global de cambio de tema
    if (window.toggleGlobalTheme) {
        window.toggleGlobalTheme();
        console.log('ðŸŽ¨ Theme toggled via global function to:', newTheme);
    } else {
        // Fallback manual si el script global no estÃ¡ disponible
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        console.log('ðŸŽ¨ Theme toggled via fallback to:', newTheme);
    }

    // Activar animaciÃ³n de transformaciÃ³n
    const iconContainer = document.querySelector('.theme-icon-container');
    if (iconContainer) {
        // Limpiar clases previas
        iconContainer.classList.remove('theme-transforming', 'theme-transforming-reverse');

        // Aplicar la animaciÃ³n correcta
        if (newTheme === 'light') {
            iconContainer.classList.add('theme-transforming');
        } else {
            iconContainer.classList.add('theme-transforming-reverse');
        }

        // Remover clase despuÃ©s de la animaciÃ³n
        setTimeout(() => {
            iconContainer.classList.remove('theme-transforming', 'theme-transforming-reverse');
        }, 800);
    }
};

window.updateThemeIcons = function(theme) {
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    const themeToggle = document.getElementById('themeToggle');
    const iconContainer = document.querySelector('.theme-icon-container');

    if (sunIcon && moonIcon && themeToggle && iconContainer) {
        // Agregar clases de animaciÃ³n
        themeToggle.classList.add('theme-changing');

        // Determinar la direcciÃ³n de la animaciÃ³n
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const isTransitioningToLight = theme === 'light' && currentTheme === 'dark';
        const isTransitioningToDark = theme === 'dark' && currentTheme === 'light';

        if (isTransitioningToLight) {
            // De oscuro a claro: sol se transforma en luna
            iconContainer.classList.add('theme-transforming');
            iconContainer.classList.remove('theme-transforming-reverse');
        } else if (isTransitioningToDark) {
            // De claro a oscuro: luna se transforma en sol
            iconContainer.classList.add('theme-transforming-reverse');
            iconContainer.classList.remove('theme-transforming');
        }

        // Remover clases de animaciÃ³n despuÃ©s de completar
        setTimeout(() => {
            themeToggle.classList.remove('theme-changing');
            iconContainer.classList.remove('theme-transforming', 'theme-transforming-reverse');
        }, 800);
    }
};

// ===== INITIALIZATION =====
let communityPage;

document.addEventListener('DOMContentLoaded', () => {
    communityPage = new CommunityPage();
});

// ===== GLOBAL FUNCTIONS =====
window.communityPage = communityPage;

// ===== GUIDELINES MODAL FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    const guidelinesModal = document.getElementById('guidelinesModal');
    const openGuidelinesBtn = document.getElementById('openGuidelinesBtn');
    const closeGuidelinesBtn = document.getElementById('closeGuidelinesBtn');
    const closeGuidelinesBtnFooter = document.getElementById('closeGuidelinesBtnFooter');
    const modalOverlay = document.querySelector('.guidelines-modal-overlay');

    // Función para abrir el modal
    function openGuidelinesModal() {
        if (guidelinesModal) {
            guidelinesModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevenir scroll del body
            
            // Animar las tarjetas con delay
            const cards = document.querySelectorAll('.guideline-modal-card');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
            });
        }
    }

    // Función para cerrar el modal
    function closeGuidelinesModal() {
        if (guidelinesModal) {
            guidelinesModal.classList.remove('show');
            document.body.style.overflow = ''; // Restaurar scroll del body
        }
    }

    // Event listeners
    if (openGuidelinesBtn) {
        openGuidelinesBtn.addEventListener('click', openGuidelinesModal);
    }

    if (closeGuidelinesBtn) {
        closeGuidelinesBtn.addEventListener('click', closeGuidelinesModal);
    }

    if (closeGuidelinesBtnFooter) {
        closeGuidelinesBtnFooter.addEventListener('click', closeGuidelinesModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeGuidelinesModal);
    }

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && guidelinesModal && guidelinesModal.classList.contains('show')) {
            closeGuidelinesModal();
        }
    });

    // Prevenir que el clic en el contenido del modal lo cierre
    if (guidelinesModal) {
        const modalContent = guidelinesModal.querySelector('.guidelines-modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', function(event) {
                event.stopPropagation();
            });
        }
    }
});


















