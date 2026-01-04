'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState
} from '@tanstack/react-table'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

interface ReportTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  className?: string
}

export function ReportTable<T>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  className = ''
}: ReportTableProps<T>) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = `${cardBg}CC`

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Búsqueda global */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border font-body focus:outline-none focus:ring-1 transition-all bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-slate-700/30">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2.5 text-left font-heading font-medium text-xs uppercase tracking-wider cursor-pointer select-none hover:opacity-80 transition-opacity bg-gray-50 dark:bg-[#0F1419]/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700/30"
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="flex flex-col">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="w-3 h-3" style={{ color: primaryColor }} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="w-3 h-3" style={{ color: primaryColor }} />
                            ) : (
                              <div className="flex flex-col -space-y-1">
                                <ChevronUp className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                                <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                              </div>
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center font-body text-gray-500 dark:text-gray-400"
                  >
                    No hay datos para mostrar
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-b border-gray-100 dark:border-slate-700/30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors
                      ${row.index % 2 === 0 ? 'bg-transparent' : 'bg-gray-50/50 dark:bg-white/[0.02]'}
                    `}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2.5 font-body text-sm text-gray-700 dark:text-gray-300"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {table.getPageCount() > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 dark:bg-[#0F1419]/80 border-gray-200 dark:border-slate-700/30"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-body text-gray-600 dark:text-gray-400">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
              <span className="text-sm font-body text-gray-400 dark:text-gray-500">
                ({table.getFilteredRowModel().rows.length} resultados)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border font-body text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30 text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border font-body text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30 text-gray-700 dark:text-gray-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

