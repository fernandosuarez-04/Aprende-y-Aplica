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
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        className: 'bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/20 dark:border-[#10B981]/30',
      },
      completed: {
        label: 'Completado',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        className: 'bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 text-[#0A2540] dark:text-[#00D4B3] border border-[#0A2540]/20 dark:border-[#00D4B3]/30',
      },
      pending: {
        label: 'Pendiente',
        icon: <Clock className="w-3.5 h-3.5" />,
        className: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/20 dark:border-[#F59E0B]/30',
      },
      cancelled: {
        label: 'Cancelado',
        icon: <XCircle className="w-3.5 h-3.5" />,
        className: 'bg-red-500/10 dark:bg-red-500/20 text-red-500 border border-red-500/20 dark:border-red-500/30',
      },
      expired: {
        label: 'Expirado',
        icon: <XCircle className="w-3.5 h-3.5" />,
        className: 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20 text-[#6C757D] border border-[#6C757D]/20 dark:border-[#6C757D]/30',
      },
    };

    const statusInfo = statusMap[status.toLowerCase()] || {
      label: status,
      icon: <Clock className="w-3.5 h-3.5" />,
      className: 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20 text-[#6C757D] border border-[#6C757D]/20 dark:border-[#6C757D]/30',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}>
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
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg">
                <Receipt className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white">
                Historial de compras
              </h1>
            </div>
            <p className="text-xs text-[#6C757D] dark:text-gray-400 ml-12">
              Revisa todas tus compras y descargas
            </p>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-6">
            <motion.button
              onClick={() => setFilter('all')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-3 py-1.5 rounded-md font-medium transition-colors text-xs ${
                filter === 'all'
                  ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white'
                  : 'bg-[#E9ECEF]/50 dark:bg-[#0A2540]/5 text-[#0A2540] dark:text-[#00D4B3] hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/10 border border-[#E9ECEF] dark:border-[#6C757D]/30'
              }`}
            >
              Todos ({total})
            </motion.button>
            <motion.button
              onClick={() => setFilter('courses')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-3 py-1.5 rounded-md font-medium transition-colors text-xs flex items-center gap-1.5 ${
                filter === 'courses'
                  ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white'
                  : 'bg-[#E9ECEF]/50 dark:bg-[#0A2540]/5 text-[#0A2540] dark:text-[#00D4B3] hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/10 border border-[#E9ECEF] dark:border-[#6C757D]/30'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Cursos ({coursesCount})
            </motion.button>
            <motion.button
              onClick={() => setFilter('subscriptions')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-3 py-1.5 rounded-md font-medium transition-colors text-xs flex items-center gap-1.5 ${
                filter === 'subscriptions'
                  ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white'
                  : 'bg-[#E9ECEF]/50 dark:bg-[#0A2540]/5 text-[#0A2540] dark:text-[#00D4B3] hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/10 border border-[#E9ECEF] dark:border-[#6C757D]/30'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Suscripciones ({subscriptionsCount})
            </motion.button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white dark:bg-[#1E2329] rounded-xl p-10 text-center border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0A2540]/30 dark:border-[#00D4B3]/30 border-t-[#0A2540] dark:border-t-[#00D4B3] mx-auto mb-4"></div>
              <p className="text-sm text-[#6C757D] dark:text-gray-400">Cargando historial de compras...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Error al cargar el historial: {error}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredPurchases.length === 0 && (
            <div className="bg-white dark:bg-[#1E2329] rounded-xl p-10 text-center border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm">
              <div className="p-6 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/20 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Receipt className="w-12 h-12 text-[#6C757D] dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-2">
                No hay compras registradas
              </h2>
              <p className="text-sm text-[#6C757D] dark:text-gray-400">
                Cuando realices una compra, aparecerá aquí tu historial completo
              </p>
            </div>
          )}

          {/* Purchases List */}
          {!loading && !error && filteredPurchases.length > 0 && (
            <div className="space-y-3">
              {filteredPurchases.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-[#1E2329] rounded-xl p-4 hover:shadow-md transition-all border border-[#E9ECEF] dark:border-[#6C757D]/30"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === 'course' 
                          ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20' 
                          : 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                      }`}>
                        {item.type === 'course' ? (
                          <BookOpen className={`w-8 h-8 ${item.type === 'course' ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-[#00D4B3]'}`} />
                        ) : (
                          <CreditCard className="w-8 h-8 text-[#00D4B3]" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-[#0A2540] dark:text-white mb-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-[#6C757D] dark:text-gray-400 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 text-right flex flex-col items-end gap-1.5">
                          <p className="text-lg font-bold text-[#0A2540] dark:text-[#00D4B3]">
                            {formatCurrency(item.price, item.currency)}
                          </p>
                          {getStatusBadge(item.status, item)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-[#6C757D] dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Comprado {formatDate(item.purchased_at)}</span>
                        </div>
                        {item.type === 'subscription' && item.end_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {item.subscription_status === 'active'
                                ? `Vence ${formatDate(item.end_date)}`
                                : `Finalizó ${formatDate(item.end_date)}`}
                            </span>
                          </div>
                        )}
                        {item.type === 'course' && item.expires_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Expira {formatDate(item.expires_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {item.type === 'course' && item.slug && (
                          <button
                            onClick={() => handleViewCourse(item.slug)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white font-medium rounded-md transition-colors text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver curso
                          </button>
                        )}
                        {item.type === 'subscription' && (
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white font-medium rounded-md transition-colors text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver detalles
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E9ECEF] dark:bg-[#0A2540]/10 hover:bg-[#E9ECEF]/80 dark:hover:bg-[#0A2540]/20 text-[#0A2540] dark:text-white font-medium rounded-md transition-colors text-xs border border-[#E9ECEF] dark:border-[#6C757D]/30"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Ver recibo
                        </button>
                        {item.type === 'course' && (
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E9ECEF] dark:bg-[#0A2540]/10 hover:bg-[#E9ECEF]/80 dark:hover:bg-[#0A2540]/20 text-[#0A2540] dark:text-white font-medium rounded-md transition-colors text-xs border border-[#E9ECEF] dark:border-[#6C757D]/30">
                            <Download className="w-3.5 h-3.5" />
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
