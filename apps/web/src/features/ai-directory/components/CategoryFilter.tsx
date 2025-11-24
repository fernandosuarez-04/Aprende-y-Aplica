'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Category {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categorías</h3>
      
      <div className="flex flex-wrap gap-3">
        {/* All Categories Button */}
        <motion.button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 rounded-lg border transition-all ${
            selectedCategory === null
              ? 'bg-blue-500/20 dark:bg-blue-500/20 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm font-medium">Todas</span>
        </motion.button>

        {/* Category Buttons */}
        {categories.map((category) => (
          <motion.button
            key={category.category_id}
            onClick={() => onCategoryChange(category.category_id)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedCategory === category.category_id
                ? 'border-opacity-50'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            style={{
              backgroundColor: selectedCategory === category.category_id 
                ? `${category.color}20` 
                : undefined,
              borderColor: selectedCategory === category.category_id 
                ? category.color 
                : undefined,
              color: selectedCategory === category.category_id 
                ? category.color 
                : undefined
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm font-medium">{category.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
