/**
 * Sistema de Identificación de Comunidades
 * Maneja la identificación confiable de la comunidad actual
 */

class CommunityIdentifier {
    constructor() {
        this.currentCommunity = null;
        this.communityMap = new Map();
        this.fallbackCommunities = [
            {
                id: '7886aa14-35b9-41da-b099-29ff1ad3516b',
                name: 'Profesionales',
                slug: 'profesionales',
                description: 'Espacio abierto para perfiles sin cursos activos'
            },
            {
                id: 'aa5a4c4c-ce64-4a12-b1ef-365aa0d320c8',
                name: 'SIF ICAP',
                slug: 'sif-icap',
                description: 'Comunidad cerrada por invitación.'
            },
            {
                id: 'b3b154e1-110e-4aa7-8998-ef208482a159',
                name: 'Openminder',
                slug: 'openminder',
                description: 'Comunidad cerrada por invitación.'
            },
            {
                id: 'd2dbebb1-5b57-4da7-9fc6-8b40c732b548',
                name: 'Ecos de Liderazgo',
                slug: 'ecos-de-liderazgo',
                description: 'Comunidad cerrada por invitación.'
            }
        ];
    }

    /**
     * Inicializar el identificador de comunidades
     */
    async initialize() {
        console.log('🏘️ Inicializando CommunityIdentifier...');

        // Cargar comunidades desde múltiples fuentes
        await this.loadCommunities();

        // Identificar comunidad actual
        await this.identifyCurrentCommunity();

        console.log('✅ CommunityIdentifier inicializado');
    }

    /**
     * Cargar comunidades desde base de datos y localStorage
     */
    async loadCommunities() {
        console.log('📊 Cargando comunidades...');

        try {
            // MÉTODO 1: Desde localStorage (más rápido)
            const savedCommunities = localStorage.getItem('savedCommunities');
            if (savedCommunities) {
                const communities = JSON.parse(savedCommunities);
                communities.forEach(community => {
                    this.communityMap.set(community.slug, community);
                });
                console.log(`✅ ${communities.length} comunidades cargadas desde localStorage`);
            }

            // MÉTODO 2: Desde base de datos (más actualizado)
            if (window.CommunityDatabase) {
                try {
                    const db = new window.CommunityDatabase();
                    await db.initialize();
                    const dbCommunities = await db.getCommunities();

                    dbCommunities.forEach(community => {
                        this.communityMap.set(community.slug, community);
                    });
                    console.log(`✅ ${dbCommunities.length} comunidades cargadas desde base de datos`);
                } catch (dbError) {
                    console.warn('⚠️ Error cargando desde BD, usando localStorage:', dbError);
                }
            }

            // MÉTODO 3: Fallback hardcodeado
            if (this.communityMap.size === 0) {
                console.log('🔄 Usando comunidades fallback hardcodeadas...');
                this.fallbackCommunities.forEach(community => {
                    this.communityMap.set(community.slug, community);
                });
            }

            console.log(`📊 Total comunidades disponibles: ${this.communityMap.size}`);

        } catch (error) {
            console.error('❌ Error cargando comunidades:', error);

            // Usar fallback en caso de error
            this.fallbackCommunities.forEach(community => {
                this.communityMap.set(community.slug, community);
            });
        }
    }

    /**
     * Identificar la comunidad actual desde la URL
     */
    async identifyCurrentCommunity() {
        console.log('🔍 Identificando comunidad actual...');

        try {
            // Obtener slug de la URL
            const urlParams = new URLSearchParams(window.location.search);
            const slug = urlParams.get('slug') || 'profesionales';

            console.log(`🔍 Slug detectado en URL: ${slug}`);

            // Buscar la comunidad
            const community = this.communityMap.get(slug);

            if (community) {
                this.currentCommunity = community;
                console.log(`✅ Comunidad identificada: ${community.name} (ID: ${community.id})`);

                // Guardar en localStorage para uso posterior
                localStorage.setItem('currentCommunity', JSON.stringify(community));

                return community;
            } else {
                console.warn(`⚠️ No se encontró comunidad para slug: ${slug}`);

                // Fallback a profesionales
                const fallback = this.communityMap.get('profesionales');
                if (fallback) {
                    this.currentCommunity = fallback;
                    console.log(`🔄 Usando fallback: ${fallback.name}`);
                    return fallback;
                }

                throw new Error(`No se pudo identificar la comunidad: ${slug}`);
            }

        } catch (error) {
            console.error('❌ Error identificando comunidad:', error);
            throw error;
        }
    }

    /**
     * Obtener la comunidad actual
     */
    getCurrentCommunity() {
        if (!this.currentCommunity) {
            console.warn('⚠️ No hay comunidad actual identificada');
            return null;
        }

        return this.currentCommunity;
    }

    /**
     * Obtener el ID de la comunidad actual
     */
    getCurrentCommunityId() {
        const community = this.getCurrentCommunity();
        return community ? community.id : null;
    }

    /**
     * Obtener el slug de la comunidad actual
     */
    getCurrentCommunitySlug() {
        const community = this.getCurrentCommunity();
        return community ? community.slug : null;
    }

    /**
     * Verificar si una comunidad existe
     */
    communityExists(slug) {
        return this.communityMap.has(slug);
    }

    /**
     * Obtener comunidad por slug
     */
    getCommunityBySlug(slug) {
        return this.communityMap.get(slug) || null;
    }

    /**
     * Obtener todas las comunidades
     */
    getAllCommunities() {
        return Array.from(this.communityMap.values());
    }

    /**
     * Refrescar identificación (útil si cambia la URL)
     */
    async refresh() {
        console.log('🔄 Refrescando identificación de comunidad...');
        await this.identifyCurrentCommunity();
        return this.currentCommunity;
    }

    /**
     * Debug: mostrar información de la comunidad actual
     */
    debug() {
        console.log('🔍 === DEBUG COMMUNITY IDENTIFIER ===');
        console.log('📍 URL actual:', window.location.href);
        console.log('🏷️ URL params:', window.location.search);
        console.log('🏘️ Comunidades disponibles:', this.communityMap.size);
        console.log('📍 Comunidad actual:', this.currentCommunity);
        console.log('🆔 Community ID:', this.getCurrentCommunityId());
        console.log('🏷️ Community Slug:', this.getCurrentCommunitySlug());

        if (this.communityMap.size > 0) {
            console.log('📋 Lista de comunidades:');
            this.communityMap.forEach((community, slug) => {
                console.log(`  - ${slug}: ${community.name} (${community.id})`);
            });
        }

        console.log('🔍 === FIN DEBUG ===');

        return {
            currentCommunity: this.currentCommunity,
            communityId: this.getCurrentCommunityId(),
            communitySlug: this.getCurrentCommunitySlug(),
            totalCommunities: this.communityMap.size,
            url: window.location.href
        };
    }
}

// Crear instancia global
window.CommunityIdentifier = CommunityIdentifier;

// Crear instancia lista para usar
window.communityIdentifier = new CommunityIdentifier();

console.log('✅ CommunityIdentifier cargado y disponible globalmente');