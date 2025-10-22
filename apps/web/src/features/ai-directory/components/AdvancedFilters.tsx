'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface AdvancedFiltersProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: string) => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
}

const sortOptions = [
  { value: 'created_at', label: 'Fecha de Creación' },
  { value: 'updated_at', label: 'Última Actualización' },
  { value: 'title', label: 'Título' },
  { value: 'rating', label: 'Calificación' },
  { value: 'view_count', label: 'Visualizaciones' },
  { value: 'like_count', label: 'Likes' },
  { value: 'download_count', label: 'Descargas' }
];

export function AdvancedFilters({ 
  sortBy, 
  sortOrder, 
  onSortByChange, 
  onSortOrderChange 
}: AdvancedFiltersProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="text-md font-semibold text-white">Filtros Avanzados</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Ordenar por</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Orden</label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => onSortOrderChange('asc')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                sortOrder === 'asc'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm">Ascendente</span>
            </motion.button>
            
            <motion.button
              onClick={() => onSortOrderChange('desc')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                sortOrder === 'desc'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowDown className="w-4 h-4" />
              <span className="text-sm">Descendente</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
