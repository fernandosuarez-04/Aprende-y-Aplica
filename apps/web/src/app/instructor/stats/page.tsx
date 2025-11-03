'use client'

import { useState, useEffect } from 'react'
import { useInstructorStats } from '@/features/instructor/hooks/useInstructorStats'
import {
  ChoroplethChart,
  CalendarChart,
  LineChart,
  PieChart,
  BarChart,
} from '@/features/instructor/components/InstructorStatsCharts'
import {
  UsersIcon,
  BookOpenIcon,
  UserGroupIcon,
  NewspaperIcon,
  PlayIcon,
  ChartBarIcon,
  CalendarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

export default function InstructorStatsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('1month')
  const { stats, loading, error, refetch } = useInstructorStats(selectedPeriod)

  useEffect(() => {
    if (selectedPeriod) {
      refetch(selectedPeriod)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod])

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">No hay datos disponibles</p>
        </div>
      </div>
    )
  }

  // Transformar datos para las gráficas
  const hrUsersByCountry = stats.hr.usersByCountry.map(item => ({
    country: item.country,
    count: item.count,
  }))

  const hrRegistrationsByDate = stats.hr.registrationsByDate.map(item => ({
    date: item.date,
    count: item.count,
  }))

  const demographicsByRole = Object.entries(stats.hr.demographics.byRole).map(([name, value]) => ({
    id: name,
    value,
    label: name,
  }))

  const demographicsByLevel = Object.entries(stats.hr.demographics.byLevel).map(([name, value]) => ({
    id: name,
    value,
    label: name,
  }))

  const demographicsByArea = Object.entries(stats.hr.demographics.byArea).map(([name, value]) => ({
    id: name,
    value,
    label: name,
  }))

  const demographicsBySector = Object.entries(stats.hr.demographics.bySector).map(([name, value]) => ({
    id: name,
    value,
    label: name,
  }))

  const demographicsByCompanySize = Object.entries(stats.hr.demographics.byCompanySize).map(([name, value]) => ({
    id: name,
    value,
    label: name,
  }))

  const demographicsByRelation = Object.entries(stats.hr.demographics.byRelation).map(([name, value]) => ({
    id: name,
    value,
    label: name,
  }))

  const coursesStudentsByCourse = stats.courses.studentsByCourse.map(course => ({
    id: course.courseTitle,
    value: course.studentCount,
    label: course.courseTitle,
  }))

  const coursesProgressByCourse = stats.courses.progressByCourse.map(course => ({
    id: course.courseTitle,
    value: course.averageProgress,
    label: course.courseTitle,
  }))

  const coursesCompletionByCourse = stats.courses.completionByCourse.map(course => ({
    id: course.courseTitle,
    value: course.completionRate,
    label: course.courseTitle,
  }))

  const coursesRatingsByCourse = stats.courses.ratingsByCourse.map(course => ({
    id: course.courseTitle,
    value: course.averageRating,
    label: course.courseTitle,
  }))

  const coursesRevenueByCourse = stats.courses.revenueByCourse.map(course => ({
    id: course.courseTitle,
    value: course.revenue,
    label: course.courseTitle,
  }))

  const coursesEnrollmentsByDate = Object.entries(stats.courses.enrollmentsByDate).map(([date, count]) => ({
    x: date,
    y: count,
  }))

  const communitiesMembersByCommunity = stats.communities.membersByCommunity.map(comm => ({
    id: comm.communityName,
    value: comm.memberCount,
    label: comm.communityName,
  }))

  const communitiesPostsByCommunity = stats.communities.postsByCommunity.map(comm => ({
    id: comm.communityName,
    value: comm.postCount,
    label: comm.communityName,
  }))

  const communitiesCommentsByCommunity = stats.communities.commentsByCommunity.map(comm => ({
    id: comm.communityName,
    value: comm.commentCount,
    label: comm.communityName,
  }))

  const communitiesPointsByCommunity = stats.communities.pointsByCommunity.map(comm => ({
    id: comm.communityName,
    value: comm.totalPoints,
    label: comm.communityName,
  }))

  const communitiesActivityByDate = Object.entries(stats.communities.activityByDate).map(([date, activity]) => ({
    x: date,
    y: activity.posts + activity.comments,
  }))

  const newsViewsByDate = Object.entries(stats.news.viewsByDate).map(([date, views]) => ({
    x: date,
    y: views,
  }))

  const newsCommentsByDate = Object.entries(stats.news.commentsByDate).map(([date, comments]) => ({
    x: date,
    y: comments,
  }))

  const newsEngagementByNews = stats.news.engagementByNews.map(news => ({
    id: news.newsTitle,
    value: news.engagementRate,
    label: news.newsTitle,
  }))

  const newsTopNews = stats.news.topNews.map(news => ({
    id: news.newsTitle,
    value: news.views,
    label: news.newsTitle,
  }))

  const reelsViewsByDate = Object.entries(stats.reels.viewsByDate).map(([date, views]) => ({
    x: date,
    y: views,
  }))

  const reelsLikesByDate = Object.entries(stats.reels.likesByDate).map(([date, likes]) => ({
    x: date,
    y: likes,
  }))

  const reelsEngagementByReel = stats.reels.engagementByReel.map(reel => ({
    id: reel.reelTitle,
    value: reel.engagementRate,
    label: reel.reelTitle,
  }))

  const reelsTopReels = stats.reels.topReels.map(reel => ({
    id: reel.reelTitle,
    value: reel.views,
    label: reel.reelTitle,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-purple-400" />
                Estadísticas del Instructor
              </h1>
              <p className="text-gray-400">
                Visualiza métricas de RRHH, cursos, comunidades, noticias y reels
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="1month">Último mes</option>
                <option value="3months">Últimos 3 meses</option>
                <option value="6months">Últimos 6 meses</option>
                <option value="1year">Último año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección RRHH */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-purple-400" />
            Recursos Humanos
          </h2>

          {/* Mapa de Países - Arriba */}
          <div className="mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <ChoroplethChart
                data={hrUsersByCountry}
                height={500}
                title="Usuarios por País"
              />
            </div>
          </div>

          {/* Calendario de Registros - Abajo */}
          <div className="mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <CalendarChart
                data={hrRegistrationsByDate}
                height={500}
                title="Distribución de Registros"
              />
            </div>
          </div>

          {/* Demografía */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demographicsByRole.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <PieChart data={demographicsByRole} height={300} title="Distribución por Roles" />
              </div>
            )}
            {demographicsByLevel.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <PieChart data={demographicsByLevel} height={300} title="Distribución por Niveles" />
              </div>
            )}
            {demographicsByArea.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <PieChart data={demographicsByArea} height={300} title="Distribución por Áreas" />
              </div>
            )}
            {demographicsBySector.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={demographicsBySector} height={300} title="Distribución por Sectores" />
              </div>
            )}
            {demographicsByCompanySize.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={demographicsByCompanySize} height={300} title="Distribución por Tamaño de Empresa" />
              </div>
            )}
            {demographicsByRelation.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={demographicsByRelation} height={300} title="Distribución por Relación" />
              </div>
            )}
          </div>

          {/* Tarjeta de resumen RRHH */}
          <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <GlobeAltIcon className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Países con usuarios</p>
                  <p className="text-white text-2xl font-bold">{stats.hr.usersByCountry.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UsersIcon className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Usuarios verificados</p>
                  <p className="text-white text-2xl font-bold">{stats.hr.demographics.verifiedUsers}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección Cursos */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <BookOpenIcon className="h-6 w-6 text-purple-400" />
            Cursos
          </h2>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Cursos</p>
              <p className="text-white text-3xl font-bold">{stats.courses.totalCourses}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Estudiantes</p>
              <p className="text-white text-3xl font-bold">{stats.courses.totalStudents}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Calificación Promedio</p>
              <p className="text-white text-3xl font-bold">{stats.courses.averageRating.toFixed(1)}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Ingresos Totales</p>
              <p className="text-white text-3xl font-bold">${stats.courses.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Gráficas de cursos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {coursesStudentsByCourse.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={coursesStudentsByCourse} height={300} title="Estudiantes por Curso" />
              </div>
            )}
            {coursesProgressByCourse.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={coursesProgressByCourse} height={300} title="Progreso Promedio por Curso" yLabel="Progreso (%)" />
              </div>
            )}
            {coursesCompletionByCourse.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <PieChart data={coursesCompletionByCourse.map(c => ({ id: c.id, value: c.value, label: c.label }))} height={300} title="Tasa de Completación por Curso" />
              </div>
            )}
            {coursesRatingsByCourse.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={coursesRatingsByCourse} height={300} title="Calificaciones por Curso" yLabel="Calificación" />
              </div>
            )}
            {coursesRevenueByCourse.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={coursesRevenueByCourse} height={300} title="Ingresos por Curso" yLabel="Ingresos ($)" />
              </div>
            )}
            {coursesEnrollmentsByDate.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <LineChart data={coursesEnrollmentsByDate} height={300} title="Inscripciones por Fecha" xLabel="Fecha" yLabel="Inscripciones" />
              </div>
            )}
          </div>

          {/* Calendario de inscripciones */}
          {Object.keys(stats.courses.enrollmentsByDate).length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <CalendarChart
                data={stats.courses.enrollmentsByDate ? Object.entries(stats.courses.enrollmentsByDate).map(([date, count]) => ({ date, count })) : []}
                height={400}
                title="Inscripciones por Fecha (Calendario)"
              />
            </div>
          )}
        </section>

        {/* Sección Comunidades */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6 text-purple-400" />
            Comunidades
          </h2>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Comunidades</p>
              <p className="text-white text-3xl font-bold">{stats.communities.totalCommunities}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Miembros</p>
              <p className="text-white text-3xl font-bold">{stats.communities.totalMembers}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Posts</p>
              <p className="text-white text-3xl font-bold">{stats.communities.totalPosts}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Comentarios</p>
              <p className="text-white text-3xl font-bold">{stats.communities.totalComments}</p>
            </div>
          </div>

          {/* Gráficas de comunidades */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {communitiesMembersByCommunity.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={communitiesMembersByCommunity} height={300} title="Miembros por Comunidad" />
              </div>
            )}
            {communitiesPostsByCommunity.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={communitiesPostsByCommunity} height={300} title="Posts por Comunidad" />
              </div>
            )}
            {communitiesCommentsByCommunity.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={communitiesCommentsByCommunity} height={300} title="Comentarios por Comunidad" />
              </div>
            )}
            {communitiesPointsByCommunity.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={communitiesPointsByCommunity} height={300} title="Puntos por Comunidad" />
              </div>
            )}
            {communitiesActivityByDate.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <LineChart data={communitiesActivityByDate} height={300} title="Actividad por Fecha" xLabel="Fecha" yLabel="Actividad" />
              </div>
            )}
          </div>
        </section>

        {/* Sección Noticias */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <NewspaperIcon className="h-6 w-6 text-purple-400" />
            Noticias
          </h2>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Noticias</p>
              <p className="text-white text-3xl font-bold">{stats.news.totalNews}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Publicadas</p>
              <p className="text-white text-3xl font-bold">{stats.news.publishedNews}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Vistas</p>
              <p className="text-white text-3xl font-bold">{stats.news.totalViews}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Comentarios</p>
              <p className="text-white text-3xl font-bold">{stats.news.totalComments}</p>
            </div>
          </div>

          {/* Gráficas de noticias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {newsViewsByDate.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <LineChart data={newsViewsByDate} height={300} title="Vistas por Fecha" xLabel="Fecha" yLabel="Vistas" />
              </div>
            )}
            {newsCommentsByDate.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <LineChart data={newsCommentsByDate} height={300} title="Comentarios por Fecha" xLabel="Fecha" yLabel="Comentarios" />
              </div>
            )}
            {newsEngagementByNews.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={newsEngagementByNews} height={300} title="Engagement por Noticia" yLabel="Engagement (%)" />
              </div>
            )}
            {newsTopNews.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={newsTopNews} height={300} title="Top 5 Noticias Más Vistas" yLabel="Vistas" />
              </div>
            )}
          </div>
        </section>

        {/* Sección Reels */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <PlayIcon className="h-6 w-6 text-purple-400" />
            Reels
          </h2>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Reels</p>
              <p className="text-white text-3xl font-bold">{stats.reels.totalReels}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Activos</p>
              <p className="text-white text-3xl font-bold">{stats.reels.activeReels}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Vistas</p>
              <p className="text-white text-3xl font-bold">{stats.reels.totalViews}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Likes</p>
              <p className="text-white text-3xl font-bold">{stats.reels.totalLikes}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Shares</p>
              <p className="text-white text-3xl font-bold">{stats.reels.totalShares}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Total Comentarios</p>
              <p className="text-white text-3xl font-bold">{stats.reels.totalComments}</p>
            </div>
          </div>

          {/* Gráficas de reels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {reelsViewsByDate.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <LineChart data={reelsViewsByDate} height={300} title="Vistas por Fecha" xLabel="Fecha" yLabel="Vistas" />
              </div>
            )}
            {reelsLikesByDate.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <LineChart data={reelsLikesByDate} height={300} title="Likes por Fecha" xLabel="Fecha" yLabel="Likes" />
              </div>
            )}
            {reelsEngagementByReel.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={reelsEngagementByReel} height={300} title="Engagement por Reel" yLabel="Engagement (%)" />
              </div>
            )}
            {reelsTopReels.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <BarChart data={reelsTopReels} height={300} title="Top 5 Reels Más Vistos" yLabel="Vistas" />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

