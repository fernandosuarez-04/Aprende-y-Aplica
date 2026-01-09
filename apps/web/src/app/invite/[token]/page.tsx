'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, Users, Shield, Calendar, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface InviteData {
  id: string
  name: string | null
  role: string
  remainingUses: number
  expiresAt: string
}

interface OrganizationData {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
}

interface ValidateResponse {
  success: boolean
  valid: boolean
  error?: string
  reason?: string
  invite?: InviteData
  organization?: OrganizationData
}

export default function BulkInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorReason, setErrorReason] = useState<string | null>(null)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [organization, setOrganization] = useState<OrganizationData | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no proporcionado')
      setIsLoading(false)
      return
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/invite/${token}`)
        const data: ValidateResponse = await response.json()

        if (!data.success || !data.valid) {
          setError(data.error || 'Enlace de invitación inválido')
          setErrorReason(data.reason || null)
          setIsLoading(false)
          return
        }

        setInvite(data.invite || null)
        setOrganization(data.organization || null)
        setIsLoading(false)
      } catch (err) {
        setError('Error al validar el enlace de invitación')
        setIsLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleContinue = () => {
    if (organization?.slug) {
      // Redirect to the organization's registration page with the bulk invite token
      router.push(`/auth/${organization.slug}/register?bulk_token=${token}`)
    }
  }

  const primaryColor = organization?.primaryColor || '#0A2540'
  const accentColor = organization?.accentColor || '#00D4B3'

  const roleLabels: Record<string, string> = {
    member: 'Miembro',
    admin: 'Administrador',
    owner: 'Propietario'
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-white/60" />
          </motion.div>
          <p className="text-white/60 text-sm font-medium">Validando enlace de invitación...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <AlertCircle className="w-10 h-10 text-red-400" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2">
              {errorReason === 'expired' && 'Enlace Expirado'}
              {errorReason === 'exhausted' && 'Límite Alcanzado'}
              {errorReason === 'paused' && 'Enlace Pausado'}
              {errorReason === 'not_found' && 'Enlace No Encontrado'}
              {!errorReason && 'Error de Invitación'}
            </h1>

            <p className="text-white/60 mb-8">
              {error}
            </p>

            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Valid invite state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          {/* Header with Organization Logo */}
          <div
            className="p-8 text-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}40, ${accentColor}20)` }}
          >
            {organization?.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="w-20 h-20 rounded-2xl mx-auto mb-4 object-contain bg-white/10 p-2"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}30` }}
              >
                <Building2 className="w-10 h-10 text-white" />
              </div>
            )}

            <h1 className="text-2xl font-bold text-white mb-2">
              {organization?.name || 'Organización'}
            </h1>
            <p className="text-white/60">
              Te han invitado a unirte a esta organización
            </p>
          </div>

          {/* Invite Details */}
          <div className="p-6 space-y-4">
            {invite?.name && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-white/50 mb-1">Invitación</p>
                <p className="text-white font-medium">{invite.name}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <Shield className="w-5 h-5 mx-auto mb-2" style={{ color: accentColor }} />
                <p className="text-sm text-white font-medium capitalize">
                  {roleLabels[invite?.role || 'member'] || invite?.role}
                </p>
                <p className="text-xs text-white/40">Rol</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <Users className="w-5 h-5 mx-auto mb-2" style={{ color: accentColor }} />
                <p className="text-sm text-white font-medium">
                  {invite?.remainingUses || 0}
                </p>
                <p className="text-xs text-white/40">Lugares</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <Calendar className="w-5 h-5 mx-auto mb-2" style={{ color: accentColor }} />
                <p className="text-sm text-white font-medium">
                  {invite?.expiresAt
                    ? new Date(invite.expiresAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })
                    : '-'}
                </p>
                <p className="text-xs text-white/40">Expira</p>
              </div>
            </div>

            {/* Continue Button */}
            <motion.button
              onClick={handleContinue}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                boxShadow: `0 8px 30px ${primaryColor}40`
              }}
            >
              Continuar con el registro
            </motion.button>

            <p className="text-center text-white/40 text-sm">
              Ya tienes cuenta?{' '}
              <Link
                href={organization?.slug ? `/auth/${organization.slug}` : '/auth'}
                className="text-white hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
