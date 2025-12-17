'use client'

import { useMemo, useState } from 'react'
import {
  BuildingOffice2Icon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PauseCircleIcon,
  BoltIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { useAdminCompanies } from '../hooks/useAdminCompanies'
import { AdminCompany } from '../services/adminCompanies.service'

const PLAN_LABELS: Record<string, string> = {
  team: 'Team',
  business: 'Business',
  enterprise: 'Enterprise'
}

function formatPlan(plan?: string | null) {
  if (!plan) return 'Sin plan'
  const normalized = plan.toLowerCase()
  return PLAN_LABELS[normalized] || plan
}

function formatStatus(company: AdminCompany) {
  if (!company.is_active) {
    return {
      label: 'Pausada',
      className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
    }
  }

  if (company.subscription_status?.toLowerCase() === 'trial') {
    return {
      label: 'Trial',
      className: 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
    }
  }

  if (company.subscription_status?.toLowerCase() === 'expired') {
    return {
      label: 'Expirada',
      className: 'bg-red-500/10 text-red-300 border border-red-500/30'
    }
  }

  return {
    label: 'Activa',
    className: 'bg-green-500/10 text-green-300 border border-green-500/30'
  }
}

function SeatUsage({ company }: { company: AdminCompany }) {
  const max = company.max_users || 0
  const used = company.active_users
  const percentage = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{used} usuarios activos</span>
        <span>{max > 0 ? `${percentage}%` : 'Sin límite'}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500"
          style={{ width: max === 0 ? '0%' : `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function AdminCompaniesPage() {
  const { companies, stats, isLoading, error, refetch, updatingId, updateCompany, actionError } = useAdminCompanies()
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null)

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const normalizedSearch = searchTerm.toLowerCase()
      const matchesSearch =
        company.name.toLowerCase().includes(normalizedSearch) ||
        (company.slug ? company.slug.toLowerCase().includes(normalizedSearch) : false) ||
        (company.contact_email ? company.contact_email.toLowerCase().includes(normalizedSearch) : false)

      const matchesPlan =
        planFilter === 'all' ||
        (company.subscription_plan && company.subscription_plan.toLowerCase() === planFilter)

      const normalizedStatus = company.subscription_status?.toLowerCase()
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && company.is_active && normalizedStatus !== 'trial') ||
        (statusFilter === 'trial' && normalizedStatus === 'trial') ||
        (statusFilter === 'paused' && !company.is_active) ||
        (statusFilter === 'expired' && normalizedStatus === 'expired')

      return matchesSearch && matchesPlan && matchesStatus
    })
  }, [companies, planFilter, searchTerm, statusFilter])

  const handleToggleCompany = async (company: AdminCompany) => {
    await updateCompany(company.id, { is_active: !company.is_active })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-200">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <div>
              <p className="font-semibold">Error al cargar empresas</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={refetch}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-blue-500 font-semibold uppercase tracking-wide">Empresas</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Administración de Empresas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Supervisa el estado de las organizaciones, su uso de licencias y planes activos.
          </p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Actualizar
        </button>
      </header>

      {actionError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-1" />
          <div>
            <p className="text-sm text-amber-800 dark:text-amber-100 font-medium">Acción no completada</p>
            <p className="text-sm text-amber-700 dark:text-amber-200">{actionError}</p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Empresas activas</p>
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {stats?.activeCompanies ?? 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            de {stats?.totalCompanies ?? 0} registradas
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Empresas en trial</p>
            <BoltIcon className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {stats?.trialCompanies ?? 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Conversiones prioritarias</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Empresas pausadas</p>
            <PauseCircleIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {stats?.pausedCompanies ?? 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Revisar facturación</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Uso promedio</p>
            <UserGroupIcon className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {stats ? `${stats.averageUtilization}%` : '0%'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats ? `${stats.usedSeats} / ${stats.totalSeats || 0} licencias` : 'Sin datos'}
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex-1 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, slug o correo..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los planes</option>
                <option value="team">Team</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="trial">En trial</option>
                <option value="paused">Pausadas</option>
                <option value="expired">Expiradas</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            {filteredCompanies.length} empresas mostradas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Usuarios</th>
                <th className="px-4 py-3">Uso de licencias</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron empresas con los filtros seleccionados.
                  </td>
                </tr>
              )}
              {filteredCompanies.map(company => {
                const statusInfo = formatStatus(company)
                return (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition cursor-pointer"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="h-10 w-10 rounded-lg object-cover"
                              onError={(event) => {
                                (event.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <BuildingOffice2Icon className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{company.slug || 'Sin slug'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{formatPlan(company.subscription_plan)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                      {company.active_users}/{company.total_users} activos
                    </td>
                    <td className="px-4 py-4">
                      <SeatUsage company={company} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedCompany(company)
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          Ver detalles
                        </button>
                        <button
                          onClick={async (event) => {
                            event.stopPropagation()
                            try {
                              await handleToggleCompany(company)
                            } catch (err) {
                              console.error(err)
                            }
                          }}
                          disabled={updatingId === company.id}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full transition flex items-center gap-1 ${
                            company.is_active
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                              : 'bg-green-600 text-white hover:bg-green-500'
                          } ${updatingId === company.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {updatingId === company.id ? (
                            <>
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              Guardando
                            </>
                          ) : company.is_active ? (
                            <>
                              <PauseCircleIcon className="h-4 w-4" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-4 w-4" />
                              Activar
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCompany && (
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-blue-500 font-semibold uppercase tracking-wide">Detalle</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCompany.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedCompany.slug || 'Sin slug asignado'}</p>
            </div>
            <button
              onClick={() => setSelectedCompany(null)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Información de contacto
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span className="font-medium">Correo:</span>{' '}
                  {selectedCompany.contact_email || 'No definido'}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span>{' '}
                  {selectedCompany.contact_phone || 'No definido'}
                </p>
                <p>
                  <span className="font-medium">Sitio:</span>{' '}
                  {selectedCompany.website_url || 'No definido'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Plan y estado
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span className="font-medium">Plan:</span> {formatPlan(selectedCompany.subscription_plan)}
                </p>
                <p>
                  <span className="font-medium">Estado de suscripción:</span>{' '}
                  {selectedCompany.subscription_status || 'Sin estado'}
                </p>
                <p>
                  <span className="font-medium">Estado del panel:</span>{' '}
                  {selectedCompany.is_active ? 'Habilitado' : 'Pausado'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Usuarios
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span className="font-medium">Activos:</span> {selectedCompany.active_users}
                </p>
                <p>
                  <span className="font-medium">Invitados:</span> {selectedCompany.invited_users}
                </p>
                <p>
                  <span className="font-medium">Suspendidos:</span> {selectedCompany.suspended_users}
                </p>
                <p>
                  <span className="font-medium">Máximo permitido:</span> {selectedCompany.max_users ?? 'Ilimitado'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

