'use client';

import React, { useState, lazy, Suspense, useCallback } from 'react';
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
  Play
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

// 🚀 Lazy Loading - AIChatAgent pesado
const AIChatAgent = lazy(() => import('../../core/components/AIChatAgent/AIChatAgent').then(m => ({ default: m.AIChatAgent })));

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
    return filteredCourses.map(course => ({
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
  }, [filteredCourses, isFavorite, favorites]);

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
        {/* Category Filters */}
        <div className="mb-8">
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

          {/* Categories */}
          {!categoriesLoading && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === category.id
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-slate-600'
                  }`}
                >
                  {getCategoryLabel(category.id, category.name)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workshops Grid */}
          <div className="lg:col-span-2">
            {/* Loading State */}
            {coursesLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-text-secondary">{t('courses.loading')}</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {coursesError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 text-sm">!</span>
                  </div>
                  <div>
                    <h3 className="text-red-600 dark:text-red-400 font-medium">{t('courses.errorTitle')}</h3>
                    <p className="text-red-700 dark:text-red-300/70 text-sm">{coursesError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Grid */}
            {!coursesLoading && !coursesError && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workshops.map((workshop) => (
                <motion.div
                  key={workshop.id}
                  className="flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-colors shadow-lg dark:shadow-none h-full"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Workshop Image */}
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    {workshop.image ? (
                      <img
                        src={workshop.image}
                        alt={workshop.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Si la imagen falla al cargar, mostrar el placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Placeholder cuando no hay imagen o falla al cargar */}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center ${
                        workshop.image ? 'hidden' : 'flex'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Brain className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-text-secondary">APRENDE Y APLICA IA®</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleFavorite(workshop.id)}
                      disabled={togglingFavorite === workshop.id}
                      className={`absolute top-3 right-3 p-2 bg-white/80 dark:bg-carbon-800/80 rounded-full hover:bg-gray-100 dark:hover:bg-carbon-700 transition-colors z-10 ${
                        togglingFavorite === workshop.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          workshop.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600 dark:text-text-secondary'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Workshop Info */}
                  <div className="flex flex-col flex-1 p-6 bg-white dark:bg-slate-800">
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 min-h-[3.5rem] line-clamp-2">
                        {translateCourseTitle(workshop.translationKey, workshop.title)}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 min-h-[1.5rem]">
                        {workshop.instructor}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4 h-6">
                        {workshop.rating > 0 ? (
                          <div className="flex items-center space-x-1">
                            <StarRating
                              rating={workshop.rating}
                              size="sm"
                              showRatingNumber={true}
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t('courses.noRatings')}
                          </div>
                        )}
                        <span className="text-lg font-bold text-primary">{workshop.price}</span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-auto">
                      {workshop.status === 'Adquirido' ? (
                        // Si el curso está comprado: solo mostrar botón "Ir al curso"
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const course = courses.find(c => c.id === workshop.id);
                            if (course?.slug) {
                              router.push(`/courses/${course.slug}/learn`);
                            }
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {t('courses.goToCourse')}
                        </Button>
                      ) : (
                        // Si el curso NO está comprado: mostrar "Ver detalles" y "Agregar al carrito"
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const course = courses.find(c => c.id === workshop.id);
                              if (course?.slug) {
                                router.push(`/courses/${course.slug}`);
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t('courses.viewDetails')}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const course = courses.find(c => c.id === workshop.id);
                              if (course) {
                                // Extraer precio numérico del string (ej: "MX$1500" -> 1500)
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
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {t('courses.addToCart')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!coursesLoading && !coursesError && workshops.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-carbon-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-600 dark:text-text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-text-primary mb-2">
                  {t('courses.empty.title')}
                </h3>
                <p className="text-gray-600 dark:text-text-secondary">
                  {activeFilter === 'favorites' 
                    ? t('courses.empty.favorites')
                    : activeFilter === 'all'
                    ? t('courses.empty.all')
                    : t('courses.empty.category', { category: selectedCategoryName || activeFilter })
                  }
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('stats.title')}
              </h3>
              {loadingStats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{t('stats.completed')}</span>
                    <div className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{t('stats.inProgress')}</span>
                    <div className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{t('stats.favorites')}</span>
                    <div className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{t('stats.completed')}</span>
                    <span className="text-primary font-semibold">
                      {stats.completed}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{t('stats.inProgress')}</span>
                    <span className="text-primary font-semibold">
                      {stats.inProgress}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{t('stats.favorites')}</span>
                    <span className="text-primary font-semibold">
                      {stats.favorites}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('activity.title')}
              </h3>
              {loadingStats ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const activityDate = activity.last_accessed_at || activity.purchased_at;
                    const date = activityDate ? new Date(activityDate) : new Date();
                    const timeAgo = formatRelativeTime(activityDate || new Date().toISOString());
                    
                    return (
                      <div 
                        key={activity.purchase_id || activity.course_id} 
                        className="flex items-start gap-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                        onClick={() => {
                          if (activity.course_slug) {
                            router.push(`/courses/${activity.course_slug}`);
                          }
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {activity.progress_percentage >= 100 ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : activity.progress_percentage > 0 ? (
                            <Play className="w-5 h-5 text-blue-500" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white font-medium line-clamp-1">
                            {activity.progress_percentage >= 100 
                              ? t('activity.completed', { course: activity.course_title })
                              : activity.progress_percentage > 0
                              ? t('activity.inProgress', { course: activity.course_title })
                              : t('activity.purchased', { course: activity.course_title })
                            }
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {timeAgo}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p>{t('activity.emptyTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('activity.emptySubtitle')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* AI Chat Agent - Lazy loaded */}
      <Suspense fallback={null}>
        <AIChatAgent
          assistantName="Lia"
          initialMessage={t('assistant.initialMessage')}
          promptPlaceholder={t('assistant.placeholder')}
          context="workshops"
        />
      </Suspense>
    </div>
  );
}
