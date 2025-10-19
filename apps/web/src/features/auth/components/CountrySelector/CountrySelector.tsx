'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Country } from '../../types/auth.types';
import { COUNTRIES } from './CountrySelector.data';

interface CountrySelectorProps {
  value: string;
  onChange: (countryCode: string, dialCode: string) => void;
  error?: string;
}

export function CountrySelector({ value, onChange, error }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];
  
  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.dialCode.includes(search)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`auth-input flex items-center justify-between gap-2 ${
          error ? 'border-error' : ''
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className="font-medium">{selectedCountry.dialCode}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full mt-2 left-0 auth-dropdown country-dropdown max-h-64 z-50 overflow-hidden rounded-lg"
          >
            {/* Barra de búsqueda */}
            <div className="sticky top-0 bg-inherit border-b border-glass-light">
              <input
                type="text"
                placeholder="Buscar país..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 bg-transparent text-color-contrast placeholder-text-tertiary focus:outline-none focus:bg-glass/20 transition-colors"
                autoFocus
              />
            </div>

            {/* Lista de países */}
            <div className="py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-glass-light scrollbar-track-transparent">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onChange(country.code, country.dialCode);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-150 text-left hover:bg-primary/10 ${
                      country.code === selectedCountry.code ? 'bg-primary/20' : ''
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 w-8">{country.flag}</span>
                    <span className="flex-1 font-medium text-color-contrast text-sm leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{country.name}</span>
                    <span className="text-text-secondary text-sm flex-shrink-0 ml-2">{country.dialCode}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-text-tertiary">
                  No se encontraron países
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
