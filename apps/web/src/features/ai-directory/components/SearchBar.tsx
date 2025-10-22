'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Buscar...", 
  className = "",
  debounceMs = 300 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, onSearch, debounceMs]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`relative bg-gray-900/50 backdrop-blur-md border rounded-xl transition-all duration-300 ${
          isFocused 
            ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' 
            : 'border-gray-700 hover:border-gray-600'
        }`}
        whileFocus={{ scale: 1.02 }}
      >
        <div className="flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
          />
          
          {query && (
            <motion.button
              onClick={handleClear}
              className="ml-3 p-1 rounded-lg hover:bg-gray-800 transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </motion.button>
          )}
        </div>
        
        {/* Focus indicator */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-purple-500/50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </div>
  );
}
