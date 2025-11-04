'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Download, Eye, BookOpen, CreditCard, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { usePurchaseHistory, PurchaseHistoryItem } from '../../features/purchases/hooks/usePurchaseHistory';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PurchaseHistoryPage() {
  const { purchases, loading, error, total, coursesCount, subscriptionsCount } = usePurchaseHistory();
  const [filter, setFilter] = useState<'all' | 'courses' | 'subscriptions'>('all');
  const router = useRouter();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount));
  };

  const getStatusBadge = (status: string, item: PurchaseHistoryItem) => {
    const statusMap: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      active: {
        label: 'Activo',
        icon: <CheckCircle className="w-4 h-4" />,
        className: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
      },
      completed: {
        label: 'Completado',
        icon: <CheckCircle className="w-4 h-4" />,
        className: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
      },
      pending: {
        label: 'Pendiente',
        icon: <Clock className="w-4 h-4" />,
        className: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
      },
      cancelled: {
        label: 'Cancelado',
        icon: <XCircle className="w-4 h-4" />,
        className: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
      },
      expired: {
        label: 'Expirado',
        icon: <XCircle className="w-4 h-4" />,
        className: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400',
      },
    };

    const statusInfo = statusMap[status.toLowerCase()] || {
      label: status,
      icon: <Clock className="w-4 h-4" />,
      className: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </span>
    );
  };

  const filteredPurchases = purchases.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'courses') return item.type === 'course';
    if (filter === 'subscriptions') return item.type === 'subscription';
    return true;
  });

  const handleViewCourse = (slug?: string) => {
    if (slug) {
      router.push(`/courses/${slug}`);
    }
  };

  const handleViewDetails = (item: PurchaseHistoryItem) => {
    if (item.type === 'course' && item.slug) {
      router.push(`/courses/${item.slug}`);
    } else if (item.type === 'subscription') {
      router.push('/subscriptions');
    }
  };

  return (
    <div className="min-h-screen bg-carbon dark:bg-carbon-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Historial de compras
            </h1>
            <p className="text-text-tertiary">
              Revisa todas tus compras y descargas
            </p>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Todos ({total})
            </button>
            <button
              onClick={() => setFilter('courses')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'courses'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Cursos ({coursesCount})
            </button>
            <button
              onClick={() => setFilter('subscriptions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'subscriptions'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Suscripciones ({subscriptionsCount})
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-text-tertiary">Cargando historial de compras...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-6">
              <p className="text-red-700 dark:text-red-400 font-medium">
                Error al cargar el historial: {error}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredPurchases.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <Receipt className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-text-primary mb-2">
                No hay compras registradas
              </h2>
              <p className="text-text-tertiary mb-6">
                Cuando realices una compra, aparecerá aquí tu historial completo
              </p>
            </div>
          )}

          {/* Purchases List */}
          {!loading && !error && filteredPurchases.length > 0 && (
            <div className="space-y-4">
              {filteredPurchases.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                        {item.type === 'course' ? (
                          <BookOpen className="w-10 h-10 text-white" />
                        ) : (
                          <CreditCard className="w-10 h-10 text-white" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-text-primary mb-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-text-tertiary line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-xl font-bold text-primary mb-1">
                            {formatCurrency(item.price, item.currency)}
                          </p>
                          {getStatusBadge(item.status, item)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 text-sm text-text-tertiary">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Comprado {formatDate(item.purchased_at)}</span>
                        </div>
                        {item.type === 'subscription' && item.end_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {item.subscription_status === 'active'
                                ? `Vence ${formatDate(item.end_date)}`
                                : `Finalizó ${formatDate(item.end_date)}`}
                            </span>
                          </div>
                        )}
                        {item.type === 'course' && item.expires_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Expira {formatDate(item.expires_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4">
                        {item.type === 'course' && item.slug && (
                          <button
                            onClick={() => handleViewCourse(item.slug)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Ver curso
                          </button>
                        )}
                        {item.type === 'subscription' && (
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Ver detalles
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-text-primary font-medium rounded-lg transition-colors text-sm"
                        >
                          <Receipt className="w-4 h-4" />
                          Ver recibo
                        </button>
                        {item.type === 'course' && (
                          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-text-primary font-medium rounded-lg transition-colors text-sm">
                            <Download className="w-4 h-4" />
                            Descargar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
