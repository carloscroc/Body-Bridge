import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { searchCities, CityEntry } from '../data/cities';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCitySelect: (city: string, isUS: boolean) => void;
  placeholder?: string;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  onCitySelect,
  placeholder = 'LONDON, UK',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<CityEntry[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hasValue = value && value.length > 0;
  const inputId = 'onboarding-location';

  const updateSuggestions = useCallback((query: string) => {
    const results = searchCities(query);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setHighlightedIndex(-1);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    updateSuggestions(newValue);
  };

  const selectCity = useCallback(
    (city: CityEntry) => {
      onChange(city.display);
      onCitySelect(city.display, city.isUS);
      setIsOpen(false);
      setSuggestions([]);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    },
    [onChange, onCitySelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectCity(suggestions[highlightedIndex]);
        } else if (value.trim()) {
          onCitySelect(value.trim(), false);
          setIsOpen(false);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-suggestion-item]');
      const target = items[highlightedIndex] as HTMLElement;
      if (target) {
        target.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative pt-6 group">
      <motion.label
        htmlFor={inputId}
        animate={{
          y: isFocused || hasValue ? -22 : 0,
          scale: isFocused || hasValue ? 0.8 : 1,
          opacity: isFocused ? 1 : 0.6,
          originX: 0,
        }}
        className={`absolute left-0 top-4 text-lg font-medium pointer-events-none ${
          isFocused ? 'text-white' : 'text-white/60'
        }`}
      >
        Location
      </motion.label>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`w-full bg-transparent border-b py-4 text-2xl font-medium outline-none transition-all duration-300 pr-10 ${
            isFocused ? 'border-white' : 'border-white/10'
          }`}
          placeholder={placeholder}
        />
        {(isFocused || hasValue) && (
          <MapPin
            size={20}
            className={`absolute right-0 top-1/2 -translate-y-1/2 transition-colors ${
              isFocused ? 'text-white' : 'text-white/30'
            }`}
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 max-h-[280px] overflow-y-auto"
          >
            {suggestions.map((city, index) => (
              <button
                key={city.display}
                data-suggestion-item
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCity(city);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors ${
                  index === highlightedIndex
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                } ${index !== suggestions.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <MapPin size={16} className="shrink-0 opacity-40" />
                <span className="text-base font-medium">{city.display}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CityAutocomplete;
