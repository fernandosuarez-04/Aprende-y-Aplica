'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Users, 
  Newspaper, 
  Star, 
  Heart,
  User,
  LogOut,
  Settings,
  Bell,
  Loader2,
  Eye,
  ShoppingCart,
  CheckCircle,
  Play,
  Search,
  X
} from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCourses } from '../../features/courses/hooks/useCourses';
import { useFavorites } from '../../features/courses/hooks/useFavorites';
import { useCategories } from '../../features/courses/hooks/useCategories';
import { UserDropdown } from '../../core/components/UserDropdown';
import { useRouter } from 'next/navigation';
import { useShoppingCartStore } from '../../core/stores/shoppingCartStore';
import { formatRelativeTime } from '../../core/utils/date-utils';
import { StarRating } from '../../features/courses/components/StarRating';
import { useTranslation } from 'react-i18next';
import { CourseHoverPopover } from '../../core/components/CourseHoverPopover/CourseHoverPopover';
import { CourseWithInstructor } from '../../features/courses/services/course.service';

// Los talleres ahora se obtienen únicamente de la API

// Las categorías ahora se obtienen dinámicamente desde la base de datos

const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getCourseTranslationKey = (course: { slug?: string | null; id?: string; title?: string }) => {
  if (course.slug) return course.slug;
  if (course.id) return course.id;
  if (course.title) return normalizeKey(course.title);
  return undefined;
};

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState('workshops');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('dashboard');
  const { 
    courses, 
    loading: coursesLoading, 
    error: coursesError, 
    filteredCourses, 
    setFilter, 
    activeFilter,
    setFavorites
  } = useCourses();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { addItem } = useShoppingCartStore();
  
  // Estados para estadísticas y actividad reciente
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    favorites: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const cardRefs = React.useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ref para almacenar el valor anterior de favorites y evitar bucles infinitos
  const prevFavoritesRef = React.useRef<string[]>([]);

  // Sincronizar favoritos entre hooks
  React.useEffect(() => {
    // Comparar contenido del array, no la referencia
    const currentStr = JSON.stringify([...favorites].sort());
    const prevStr = JSON.stringify([...prevFavoritesRef.current].sort());
    
    // Solo actualizar si el contenido realmente cambió
    if (currentStr !== prevStr) {
      setFavorites(favorites);
      prevFavoritesRef.current = favorites;
    }
  }, [favorites, setFavorites]);

  // Obtener estadísticas y actividad reciente
  React.useEffect(() => {
    const fetchStatsAndActivity = async () => {
      if (!user?.id) return;

      try {
        setLoadingStats(true);

        // ✅ OPTIMIZACIÓN: Paralelizar fetches independientes con Promise.all()
        // ANTES: 2 fetches secuenciales (~1-2 segundos)
        // DESPUÉS: 2 fetches paralelos (~500-800ms)
        const [statsResponse, coursesResponse] = await Promise.all([
          fetch('/api/my-courses?stats_only=true'),
          fetch('/api/my-courses'),
        ]);

        // Procesar estadísticas
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats({
            completed: statsData.completed_courses || 0,
            inProgress: statsData.in_progress_courses || 0,
            favorites: favorites.length,
          });
        }

        // Procesar cursos para actividad reciente
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          // Ordenar por last_accessed_at o purchased_at (más reciente primero)
          const sortedCourses = (coursesData || [])
            .sort((a: any, b: any) => {
              const dateA = new Date(a.last_accessed_at || a.purchased_at || 0);
              const dateB = new Date(b.last_accessed_at || b.purchased_at || 0);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5); // Mostrar solo los 5 más recientes

          setRecentActivity(sortedCourses);
        }
      } catch (error) {
        // Error handled silently in production
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatsAndActivity();
  }, [user?.id, favorites.length]);


  const handleToggleFavorite = async (courseId: string) => {
    if (togglingFavorite === courseId) return; // Ya está procesando
    
    try {
      setTogglingFavorite(courseId);
      await toggleFavorite(courseId);
    } catch (error) {
      // Mostrar mensaje de error al usuario si es necesario
      if (error instanceof Error && error.message.includes('Variables de entorno')) {
        alert('Error: Supabase no está configurado. Por favor, configura las variables de entorno.');
      }
    } finally {
      setTogglingFavorite(null);
    }
  };

  const handleNavigation = (itemId: string) => {
    if (itemId === 'news') {
      router.push('/news');
    } else {
      setActiveNav(itemId);
    }
  };

  const getCategoryLabel = React.useCallback(
    (categoryId: string, fallbackName: string) => {
      if (categoryId === 'all') return t('filters.all');
      if (categoryId === 'favorites') return t('filters.favorites');
      return fallbackName;
    },
    [t]
  );

  const selectedCategoryName = React.useMemo(() => {
    const category = categories.find((cat) => cat.id === activeFilter);
    return getCategoryLabel(activeFilter, category?.name || activeFilter);
  }, [activeFilter, categories, getCategoryLabel]);

  const translateCourseTitle = useCallback(
    (key: string | undefined, fallback: string) => {
      if (!key) return fallback;
      return t(`courseTitles.${key}`, { defaultValue: fallback });
    },
    [t]
  );

  // ⚡ Memoizar transformación de workshops para evitar re-cálculos
  const workshops = React.useMemo(() => {
    let filtered = filteredCourses;
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(query) ||
        course.instructor_name?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      );
    }
    
    return filtered.map(course => ({
      id: course.id,
      title: course.title,
    translationKey: getCourseTranslationKey(course),
      instructor: course.instructor_name || 'Instructor',
      rating: course.rating || 0,
      price: course.price || 'MX$0',
      status: course.status || 'Disponible',
      image: course.thumbnail || null,
      category: course.category || 'General',
      isFavorite: isFavorite(course.id),
    }));
  }, [filteredCourses, isFavorite, favorites, searchQuery]);

  // Mostrar loading mientras se obtienen los datos del usuario
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 dark:text-white">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de Búsqueda - Primero */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cursos, instructores..."
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-normal text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters - Segundo */}
        <div className="mb-6">
          {/* Loading state for categories */}
          {categoriesLoading && (
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="px-4 py-2 rounded-full bg-gray-200 dark:bg-carbon-700 animate-pulse"
                >
                  <div className="w-16 h-4 bg-gray-300 dark:bg-carbon-600 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error state for categories */}
          {categoriesError && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <span className="text-yellow-400 text-sm">!</span>
                </div>
                <div>
                  <h3 className="text-yellow-600 dark:text-yellow-400 font-medium">{t('categories.errorTitle')}</h3>
                  <p className="text-yellow-700 dark:text-yellow-300/70 text-sm">{t('categories.errorMessage')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Categories - Rediseñados con Animaciones */}
          {!categoriesLoading && (
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                    activeFilter === category.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md'
                  }`}
                >
                  {getCategoryLabel(category.id, category.name)}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Títulos de Sección - Tercero */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">
            Qué aprender ahora
          </h1>
          <p className="text-sm font-normal text-gray-600 dark:text-slate-400">
            Recomendaciones para ti
          </p>
        </div>

        {/* Content Grid */}
        <div className="w-full max-w-7xl mx-auto">
          {/* Workshops Grid */}
          <div className="w-full">
            {/* Loading State - Mejorado */}
            {coursesLoading && (
              <motion.div 
                className="flex items-center justify-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400 tracking-tight">{t('courses.loading')}</p>
                </div>
              </motion.div>
            )}

            {/* Error State - Mejorado */}
            {coursesError && (
              <motion.div 
                className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-6 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 dark:text-red-400 text-sm font-semibold">!</span>
                  </div>
                  <div>
                    <h3 className="text-red-700 dark:text-red-400 font-semibold text-sm mb-1 tracking-tight">{t('courses.errorTitle')}</h3>
                    <p className="text-red-600 dark:text-red-300/70 text-sm font-normal leading-relaxed">{coursesError}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Courses Grid - Tamaño Considerable */}
            {!coursesLoading && !coursesError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workshops.map((workshop) => {
                  // Obtener el curso completo para el popover
                  const fullCourse = courses.find(c => c.id === workshop.id);
                  
                  // Crear ref si no existe
                  if (!cardRefs.current[workshop.id]) {
                    cardRefs.current[workshop.id] = React.createRef<HTMLDivElement>();
                  }
                  
                  const cardRef = cardRefs.current[workshop.id];
                  
                  return (
                  <React.Fragment key={workshop.id}>
                    <motion.div
                      ref={cardRef}
                      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 transition-all duration-300 shadow-sm hover:shadow-2xl h-full w-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -6 }}
                      onMouseEnter={() => {
                        if (fullCourse && !isMobile) {
                          setHoveredCourseId(workshop.id);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isMobile) {
                          // Delay para permitir mover el cursor al popover
                          setTimeout(() => {
                            // Solo cerrar si el cursor no está sobre el popover
                            const popover = document.querySelector('[data-popover-id]');
                            if (!popover || !popover.matches(':hover')) {
                              setHoveredCourseId(null);
                            }
                          }, 100);
                        }
                      }}
                    >
                  {/* Workshop Image - Menos Compacta */}
                  <div className="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                    {workshop.image ? (
                      <>
                        <img
                          src={workshop.image}
                          alt={workshop.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : null}
                    
                    {/* Placeholder mejorado */}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center ${
                        workshop.image ? 'hidden' : 'flex'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-14 h-14 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Brain className="w-7 h-7 text-primary/40 dark:text-primary/50" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-slate-600 tracking-wider uppercase">APRENDE Y APLICA</p>
                      </div>
                    </div>
                    
                    {/* Botón de favoritos - Minimalista */}
                    <motion.button
                      onClick={() => handleToggleFavorite(workshop.id)}
                      disabled={togglingFavorite === workshop.id}
                      className={`absolute top-2.5 right-2.5 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 z-10 shadow-lg ${
                        togglingFavorite === workshop.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 transition-all duration-300 ${
                          workshop.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-slate-500'
                        }`} 
                      />
                    </motion.button>
                  </div>

                  {/* Workshop Info - Texto Completo Visible */}
                  <div className="flex flex-col flex-1 p-5 bg-white dark:bg-slate-900">
                    {/* Título - Tamaño Reducido, Texto Completo Visible */}
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2.5 leading-snug tracking-tight line-clamp-2 min-h-[2.5rem]">
                      {translateCourseTitle(workshop.translationKey, workshop.title)}
                    </h3>
                    
                    {/* Instructor - Línea Separada */}
                    <p className="text-xs font-normal text-gray-600 dark:text-slate-400 mb-3 leading-relaxed min-h-[1rem]">
                      {workshop.instructor}
                    </p>
                    
                    {/* Rating y Precio - Misma Línea, Perfectamente Alineados */}
                    <div className="flex items-baseline justify-between mb-4">
                      <div className="flex items-baseline flex-shrink-0">
                        {workshop.rating > 0 ? (
                          <div className="flex items-baseline">
                            <StarRating
                              rating={workshop.rating}
                              size="sm"
                              showRatingNumber={true}
                            />
                          </div>
                        ) : (
                          <div className="text-xs font-normal text-gray-400 dark:text-slate-500 leading-none">
                            {t('courses.noRatings')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-baseline ml-auto">
                        <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-none">{workshop.price}</span>
                      </div>
                    </div>

                    {/* Botones - Tamaños Reducidos */}
                    <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800">
                      {workshop.status === 'Adquirido' ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const course = courses.find(c => c.id === workshop.id);
                            if (course?.slug) {
                              router.push(`/courses/${course.slug}/learn`);
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {t('courses.goToCourse')}
                        </motion.button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const course = courses.find(c => c.id === workshop.id);
                              if (course?.slug) {
                                router.push(`/courses/${course.slug}`);
                              }
                            }}
                            className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-slate-300 font-semibold text-xs py-2 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('courses.viewDetails')}</span>
                          </motion.button>
                          <motion.div
                            className="relative group/cart"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <motion.button
                              onClick={() => {
                                const course = courses.find(c => c.id === workshop.id);
                                if (course) {
                                  const priceString = workshop.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0';
                                  const price = parseFloat(priceString);
                                  
                                  addItem({
                                    id: `course-${course.id}`,
                                    itemType: 'course',
                                    itemId: course.id,
                                    title: workshop.title,
                                    price: price || 0,
                                    thumbnail: workshop.image || course.thumbnail || undefined,
                                  });
                                }
                              }}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                              title="Agregar al carrito"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </motion.button>
                            {/* Tooltip - Texto Completo, Mejorado */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover/cart:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-[60] min-w-max">
                              <span className="block">Agregar al carrito</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 dark:bg-slate-800 rotate-45" />
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                
                {/* Popover tipo Udemy - Solo en desktop */}
                {fullCourse && !isMobile && (
                  <CourseHoverPopover
                    course={fullCourse}
                    isVisible={hoveredCourseId === workshop.id}
                    cardRef={cardRef}
                    onMouseEnter={() => {
                      if (fullCourse) {
                        setHoveredCourseId(workshop.id);
                      }
                    }}
                    onMouseLeave={() => {
                      // Delay para permitir mover el cursor de vuelta a la tarjeta
                      setTimeout(() => {
                        const cardElement = cardRef.current;
                        if (!cardElement || !cardElement.matches(':hover')) {
                          setHoveredCourseId(null);
                        }
                      }, 150);
                    }}
                    onClose={() => {
                      setHoveredCourseId(null);
                    }}
                  />
                )}
                </React.Fragment>
                );
                })}
              </div>
            )}

            {/* Empty State - Mejorado */}
            {!coursesLoading && !coursesError && workshops.length === 0 && (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {t('courses.empty.title')}
                </h3>
                <p className="text-sm font-normal text-gray-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                  {activeFilter === 'favorites' 
                    ? t('courses.empty.favorites')
                    : activeFilter === 'all'
                    ? t('courses.empty.all')
                    : t('courses.empty.category', { category: selectedCategoryName || activeFilter })
                  }
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* AI Chat Agent - Ahora está en el layout principal (ConditionalAIChatAgent) para persistencia entre páginas */}
    </div>
  );
}
