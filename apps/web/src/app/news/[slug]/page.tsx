'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  MessageCircle, 
  Share2, 
  Bookmark,
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

interface NewsDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const { news, loading, error } = useNewsDetail(resolvedParams.slug)
  const [isSaved, setIsSaved] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isCheckingSaved, setIsCheckingSaved] = React.useState(true)

  // Verificar si la noticia está guardada al cargar
  React.useEffect(() => {
    const checkSaved = async () => {
      if (!resolvedParams.slug) return

      try {
        const response = await fetch(`/api/news/${resolvedParams.slug}/save`)
        if (response.ok) {
          const data = await response.json()
          setIsSaved(data.saved)
        }
      } catch (error) {
        console.error('Error checking saved status:', error)
      } finally {
        setIsCheckingSaved(false)
      }
    }

    checkSaved()
  }, [resolvedParams.slug])

  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/news/${resolvedParams.slug}/save`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setIsSaved(data.saved)

        // Mostrar notificación de éxito (opcional, puedes usar un toast library)
        console.log(data.message)
      } else {
        console.error('Error saving news')
      }
    } catch (error) {
      console.error('Error saving news:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-carbon-950 via-carbon-900 to-carbon-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Cargando noticia...</p>
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.intro || '',
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const renderTLDR = (tldr: any) => {
    if (!tldr) return null

    if (Array.isArray(tldr)) {
      return (
        <div className="space-y-2">
          {tldr.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-text-primary">{item}</span>
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
              <h4 className="font-semibold text-primary mb-2">{key}</h4>
              <div className="space-y-2">
                {Array.isArray(value) ? (
                  value.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-text-primary text-sm">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-text-primary text-sm">{String(value)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return <p className="text-text-primary">{String(tldr)}</p>
  }

  const renderSections = (sections: any) => {
    if (!sections) return null

    if (Array.isArray(sections)) {
      return (
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="space-y-4">
              {section.title && (
                <h3 className="text-xl font-semibold text-primary">{section.title}</h3>
              )}
              {section.content && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-primary leading-relaxed">{section.content}</p>
                </div>
              )}
              {section.items && (
                <div className="space-y-2">
                  {section.items.map((item: string, itemIndex: number) => (
                    <div key={itemIndex} className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-text-primary">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    if (typeof sections === 'object') {
      return (
        <div className="space-y-6">
          {Object.entries(sections).map(([key, value]) => (
            <div key={key} className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">{key}</h3>
              <div className="space-y-2">
                {Array.isArray(value) ? (
                  value.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-text-primary">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-text-primary leading-relaxed">{String(value)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return <p className="text-text-primary leading-relaxed">{String(sections)}</p>
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
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400">
              No hay enlaces válidos disponibles en este momento.
            </p>
          </div>
        )
      }

      return (
        <div className="space-y-3">
          {validLinks.map((link, index) => {
            const url = typeof link === 'string' ? link : link.url
            const title = typeof link === 'string' ? link : link.title || link.url

            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-carbon-800/50 rounded-lg hover:bg-carbon-700/50 transition-colors group"
                onClick={(e) => {
                  // Verificar que el enlace funcione antes de abrirlo
                  if (!isValidUrl(url)) {
                    e.preventDefault()
                    alert('Este enlace no es válido o está roto')
                  }
                }}
              >
                <LinkIcon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-text-primary group-hover:text-primary transition-colors truncate">
                  {title}
                </span>
                <ExternalLink className="w-4 h-4 text-text-tertiary ml-auto flex-shrink-0" />
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
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400">
              No hay enlaces válidos disponibles en este momento.
            </p>
          </div>
        )
      }

      return (
        <div className="space-y-3">
          {validEntries.map(([key, value]) => (
            <a
              key={key}
              href={String(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-carbon-800/50 rounded-lg hover:bg-carbon-700/50 transition-colors group"
            >
              <LinkIcon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-text-primary group-hover:text-primary transition-colors truncate">{key}</span>
              <ExternalLink className="w-4 h-4 text-text-tertiary ml-auto flex-shrink-0" />
            </a>
          ))}
        </div>
      )
    }

    const linkUrl = String(links)
    if (!isValidUrl(linkUrl)) {
      return (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">
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
        className="flex items-center gap-3 p-3 bg-carbon-800/50 rounded-lg hover:bg-carbon-700/50 transition-colors group"
      >
        <LinkIcon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-text-primary group-hover:text-primary transition-colors">Enlace</span>
        <ExternalLink className="w-4 h-4 text-text-tertiary ml-auto" />
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
    <div className="min-h-screen bg-gradient-to-br from-carbon-950 via-carbon-900 to-carbon-800">
      {/* Header */}
      <motion.div 
        className="sticky top-0 z-50 bg-carbon-900/80 backdrop-blur-sm border-b border-carbon-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isCheckingSaved}
                className={`p-2 transition-colors ${
                  isSaved
                    ? 'text-primary hover:text-primary/80'
                    : 'text-text-secondary hover:text-text-primary'
                } disabled:opacity-50`}
                title={isSaved ? 'Quitar de guardados' : 'Guardar noticia'}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Hero Image */}
            {news.hero_image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative h-64 lg:h-96 rounded-2xl overflow-hidden"
              >
                <img
                  src={news.hero_image_url}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/60 to-transparent" />
              </motion.div>
            )}

            {/* Article Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full">
                  {news.language}
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(news.published_at || news.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{news.view_count || 0} vistas</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{news.comment_count || 0} comentarios</span>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary leading-tight">
                {news.title}
              </h1>

              {news.subtitle && (
                <p className="text-xl text-text-secondary leading-relaxed">
                  {news.subtitle}
                </p>
              )}
            </motion.header>

            {/* TL;DR Section */}
            {news.tldr && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-primary/10 border border-primary/20 rounded-2xl p-6"
              >
                <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  TL;DR
                </h2>
                {renderTLDR(news.tldr)}
              </motion.section>
            )}

            {/* Introduction */}
            {news.intro && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="prose prose-invert max-w-none"
              >
                <p className="text-lg text-text-primary leading-relaxed">
                  {news.intro}
                </p>
              </motion.section>
            )}

            {/* Main Content Sections */}
            {news.sections && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="space-y-8"
              >
                {renderSections(news.sections)}
              </motion.section>
            )}

            {/* Links Section */}
            {news.links && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
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
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-center py-8"
              >
                {renderCTA(news.cta)}
              </motion.section>
            )}
          </motion.article>
        </div>
      </div>
    </div>
  )
}
