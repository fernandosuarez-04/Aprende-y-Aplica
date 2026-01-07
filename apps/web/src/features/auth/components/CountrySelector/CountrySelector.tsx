'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { COUNTRIES } from './CountrySelector.data';
import { motion, AnimatePresence } from 'framer-motion';

interface CountrySelectorStyles {
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
}

interface CountrySelectorProps {
  selectedCountryCode: string;
  dialCode: string;
  onCountryChange: (code: string, dialCode: string) => void;
  customStyles?: CountrySelectorStyles;
}

export function CountrySelector({
  selectedCountryCode,
  dialCode,
  onCountryChange,
  customStyles,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCountryCode) || COUNTRIES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: typeof COUNTRIES[0]) => {
    onCountryChange(country.code, country.dialCode);
    setIsOpen(false);
  };

  // Default color fallbacks (if no custom styles provided)
  const buttonClassName = customStyles 
    ? "flex items-center gap-2 h-[46px] px-3 rounded-xl transition-all outline-none min-w-[100px] border" 
    : "flex items-center gap-2 h-[46px] px-3 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl hover:border-[#00D4B3] hover:ring-1 hover:ring-[#00D4B3]/20 transition-all outline-none min-w-[100px]";

  const dropdownClassName = customStyles
    ? "absolute top-full left-0 z-50 mt-1 w-64 max-h-60 overflow-y-auto rounded-xl shadow-xl scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 border backdrop-blur-xl"
    : "absolute top-full left-0 z-50 mt-1 w-64 max-h-60 overflow-y-auto bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-xl scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName}
        style={customStyles ? {
          backgroundColor: customStyles.bgColor,
          borderColor: customStyles.borderColor,
          color: customStyles.textColor,
        } : undefined}
      >
        <span className="text-xl">{selectedCountry.flag}</span>
        <span className="text-sm font-medium" style={customStyles ? { color: customStyles.textColor } : undefined}>
          {selectedCountry.dialCode}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          style={customStyles ? { color: `${customStyles.textColor}80` } : undefined}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={dropdownClassName}
            style={customStyles ? {
                // For dropdown, we want a solid or semi-solid background to ensure readability
                // If the input bg is very transparent, this might need an adjustment, but let's try consistency first.
                // We'll use the same bg color but maybe ensure it's not totally transparent if passed that way?
                // Actually, for consistency with the form "glass" look, we can reuse it, but high transparency might make list hard to read over other content.
                // Let's assume standard 'card' behavior: if custom color is passed, use it.
                backgroundColor: customStyles.bgColor?.includes('0.05') ? '#1a1a2e' : customStyles.bgColor, // Fallback for very transparent inputs if needed, or just use solid
                // Wait, if we use the same 'inputBgColor' it has 0.05 opacity. That's too transparent for a dropdown menu over other text.
                // We should probably default to the "Card" background color or a solid version of it. 
                // However, without a separate prop, we'll try to use a more opaque version if possible.
                // For now, let's blindly trust the prop but set a backdrop-filter in className.
                // Re-reading user issue: "white background".
                // Let's try to use the passed bgColor but maybe enforce a higher opacity if we could parse it, but that's complex.
                // Simplest fix: Use the passed bgColor, which works for the inputs on the card.
                // NOTE: The inputs sit ON the card. The dropdown floats OVER everything.
                // If we use the input background (which matches the card background roughly or is transparent), it might blend too much.
                // Let's manually set a high-opacity background for the dropdown.
                backgroundColor: '#1E2329', // Fallback to a safe dark color if we can't easily resolve a solid custom one. 
                // actually the user wants it to look like the rest.
                // Let's us the customStyles.bgColor BUT make it opaque? No, we don't know the color value easily to manipulate it here without logic.
                // Let's revert to a safe dark background if we detect custom theme is dark-ish?
                // We can accept a `dropdownBgColor` in customStyles too?
                // For now, let's use the `bgColor` but with `backdrop-filter: blur(20px)` (added in classname) to help readability.
                // And explicitly set border color.
                backgroundColor: customStyles.bgColor, 
                borderColor: customStyles.borderColor,
            } : undefined}
          >
            <div className="p-1">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    country.code === selectedCountryCode
                      ? 'bg-[#00D4B3]/10 text-[#00D4B3]'
                      : customStyles 
                        ? 'hover:bg-white/5' 
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-[#0A2540] dark:text-gray-300'
                  }`}
                  style={customStyles && country.code !== selectedCountryCode ? { color: customStyles.textColor } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                  </div>
                  {country.code === selectedCountryCode && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
