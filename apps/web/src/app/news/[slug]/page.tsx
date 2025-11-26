'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Share2, 
  ExternalLink,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  Link as LinkIcon
} from 'lucide-react'
import { useNewsDetail } from '../../../features/news/hooks/useNews'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { useShareModalContext } from '../../../core/providers/ShareModalProvider'
import { getBaseUrl } from '../../../lib/env'

interface NewsDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const router = useRouter()
  const { openShareModal } = useShareModalContext()
  const resolvedParams = React.use(params)
  const { news, loading, error } = useNewsDetail(resolvedParams.slug)
  const [imageError, setImageError] = useState(false)

  // Scroll al top cuando se carga la página o cambia el slug
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [resolvedParams.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-carbon-950 dark:via-carbon-900 dark:to-carbon-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando noticia...</p>
        </div>
      </div>
    )
  }

  if (error || !news) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleBack = () => {
    router.back()
  }

  const handleShare = () => {
    if (!news) return
    
    const shareUrl = `${getBaseUrl()}/news/${resolvedParams.slug}`
    
    // Abrir modal de compartir global
    openShareModal({
      url: shareUrl,
      title: news.title,
      text: news.intro || news.subtitle || news.title,
      description: news.intro || news.subtitle,
    })
  }

  const renderTLDR = (tldr: any) => {
    if (!tldr) return null

    if (Array.isArray(tldr)) {
      return (
        <div className="space-y-2.5">
          {tldr.map((item, index) => (
            <div key={index} className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-900 dark:text-white leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      )
    }

    if (typeof tldr === 'object') {
      return (
        <div className="space-y-3">
          {Object.entries(tldr).map(([key, value]) => (
            <div key={key}>
              <h4 className="text-sm font-semibold text-primary mb-2">{key}</h4>
              <div className="space-y-2">
                {Array.isArray(value) ? (
                  value.map((item, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-xs text-gray-900 dark:text-white leading-relaxed">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-900 dark:text-white leading-relaxed">{String(value)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{String(tldr)}</p>
  }

  const renderSections = (sections: any) => {
    if (!sections) return { textSections: null, itemSections: null }

    const textSections: any[] = []
    const itemSections: any[] = []

    if (Array.isArray(sections)) {
      sections.forEach((section, index) => {
        if (section.items && section.items.length > 0) {
          itemSections.push({ ...section, originalIndex: index })
        } else {
          textSections.push({ ...section, originalIndex: index })
        }
      })
    } else if (typeof sections === 'object') {
      Object.entries(sections).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          itemSections.push({ title: key, items: value })
        } else {
          textSections.push({ title: key, content: String(value) })
        }
      })
    }

    return { textSections, itemSections }
  }

  const renderTextSections = (sections: any[]) => {
    if (!sections || sections.length === 0) return null

    return (
      <div className="space-y-5">
        {sections.map((section, index) => (
          <div key={index} className="space-y-3 pb-5 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
            {section.title && (
              <h3 className="text-lg sm:text-xl font-semibold text-primary">{section.title}</h3>
            )}
            {section.content && (
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-base text-gray-900 dark:text-white leading-relaxed text-justify">{section.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderItemSections = (sections: any[]) => {
    if (!sections || sections.length === 0) return null

    return (
      <div className="space-y-5">
        {sections.map((section, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            {section.title && (
              <h3 className="text-sm font-semibold text-primary mb-3">{section.title}</h3>
            )}
            {section.items && (
              <div className="space-y-2">
                {section.items.map((item: string, itemIndex: number) => (
                  <div key={itemIndex} className="flex items-start gap-2.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-900 dark:text-white leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString)
      return true
    } catch {
      return false
    }
  }

  const renderLinks = (links: any) => {
    if (!links) return null

    if (Array.isArray(links)) {
      const validLinks = links.filter(link => {
        const url = typeof link === 'string' ? link : link?.url
        return url && isValidUrl(url)
      })

      if (validLinks.length === 0) {
        return (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              No hay enlaces válidos disponibles en este momento.
            </p>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          {validLinks.map((link, index) => {
            const url = typeof link === 'string' ? link : link.url
            const title = typeof link === 'string' ? link : link.title || link.url

            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                onClick={(e) => {
                  // Verificar que el enlace funcione antes de abrirlo
                  if (!isValidUrl(url)) {
                    e.preventDefault()
                    alert('Este enlace no es válido o está roto')
                  }
                }}
              >
                <LinkIcon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                  {title}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 ml-auto flex-shrink-0" />
              </a>
            )
          })}
        </div>
      )
    }

    if (typeof links === 'object') {
      const validEntries = Object.entries(links).filter(([_, value]) => {
        const url = String(value)
        return isValidUrl(url)
      })

      if (validEntries.length === 0) {
        return (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              No hay enlaces válidos disponibles en este momento.
            </p>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          {validEntries.map(([key, value]) => (
            <a
              key={key}
              href={String(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2.5 bg-gray-100 dark:bg-carbon-800/50 rounded-lg hover:bg-gray-200 dark:hover:bg-carbon-700/50 transition-colors group"
            >
              <LinkIcon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">{key}</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 ml-auto flex-shrink-0" />
            </a>
          ))}
        </div>
      )
    }

    const linkUrl = String(links)
    if (!isValidUrl(linkUrl)) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            El enlace proporcionado no es válido.
          </p>
        </div>
      )
    }

    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 p-2.5 bg-gray-100 dark:bg-carbon-800/50 rounded-lg hover:bg-gray-200 dark:hover:bg-carbon-700/50 transition-colors group"
      >
        <LinkIcon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
        <span className="text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors">Enlace</span>
        <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 ml-auto flex-shrink-0" />
      </a>
    )
  }

  const renderCTA = (cta: any) => {
    if (!cta) return null

    if (typeof cta === 'object' && cta.text && cta.url) {
      return (
        <a
          href={cta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
        >
          <span>{cta.text}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      )
    }

    if (typeof cta === 'string') {
      return (
        <button className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
          {cta}
        </button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-carbon-950 dark:via-carbon-900 dark:to-carbon-800">
      {/* Header */}
      <motion.div 
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
          >
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-6 bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-lg">
              {/* Hero Image - Más compacta */}
              {news.hero_image_url && !imageError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="relative h-48 sm:h-64 lg:h-72 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 -mx-2 sm:-mx-4"
                >
                  <Image
                    src={news.hero_image_url}
                    alt={news.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                    onError={() => setImageError(true)}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 dark:from-carbon-900/60 to-transparent" />
                </motion.div>
              )}
              {imageError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative h-48 sm:h-64 lg:h-72 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center -mx-2 sm:-mx-4"
                >
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Imagen no disponible</p>
                  </div>
                </motion.div>
              )}

              {/* Article Header - Más compacto */}
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4 -mt-2"
              >
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full font-medium">
                    {news.language}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(news.published_at || news.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>{news.view_count || 0} vistas</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                  {news.title}
                </h1>

                {news.subtitle && (
                  <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                    {news.subtitle}
                  </p>
                )}
              </motion.header>

              {/* Introduction - Más compacta */}
              {news.intro && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="prose dark:prose-invert max-w-none"
                >
                  <p className="text-base sm:text-lg text-gray-900 dark:text-white leading-relaxed text-justify">
                    {news.intro}
                  </p>
                </motion.section>
              )}

              {/* Main Content Sections - Solo texto justificado */}
              {news.sections && (() => {
                const { textSections } = renderSections(news.sections)
                return textSections && textSections.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="space-y-6"
                  >
                    {renderTextSections(textSections)}
                  </motion.section>
                )
              })()}

              {/* Links Section - Más compacta */}
              {news.links && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="space-y-3"
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-primary flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Recursos y Enlaces
                  </h2>
                  {renderLinks(news.links)}
                </motion.section>
              )}

              {/* CTA Section */}
              {news.cta && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="pt-4"
                >
                  {renderCTA(news.cta)}
                </motion.section>
              )}
            </div>

            {/* Sidebar Column - TL;DR, información y pasos/ejemplos */}
            <aside className="lg:col-span-4 space-y-6">
              {/* TL;DR Section - Sticky en desktop */}
              {news.tldr && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="lg:sticky lg:top-24 space-y-6"
                >
                  <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      TL;DR
                    </h2>
                    <div className="text-sm">
                      {renderTLDR(news.tldr)}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      Información
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Idioma</span>
                        <span className="font-medium text-gray-900 dark:text-white">{news.language}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Publicado</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(news.published_at || news.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Visualizaciones</span>
                        <span className="font-medium text-gray-900 dark:text-white">{news.view_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pasos y Ejemplos - Movidos aquí desde el contenido principal */}
                  {news.sections && (() => {
                    const { itemSections } = renderSections(news.sections)
                    return itemSections && itemSections.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        {renderItemSections(itemSections)}
                      </motion.div>
                    )
                  })()}
                </motion.div>
              )}

              {/* Si no hay TL;DR, mostrar información y pasos sin sticky */}
              {!news.tldr && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      Información
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Idioma</span>
                        <span className="font-medium text-gray-900 dark:text-white">{news.language}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Publicado</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(news.published_at || news.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Visualizaciones</span>
                        <span className="font-medium text-gray-900 dark:text-white">{news.view_count || 0}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Pasos y Ejemplos */}
                  {news.sections && (() => {
                    const { itemSections } = renderSections(news.sections)
                    return itemSections && itemSections.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      >
                        {renderItemSections(itemSections)}
                      </motion.div>
                    )
                  })()}
                </>
              )}
            </aside>
          </motion.article>
        </div>
      </div>
    </div>
  )
}
