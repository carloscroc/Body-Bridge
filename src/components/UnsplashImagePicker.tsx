import React, { useEffect, useMemo, useState, useCallback } from 'react';

type UnsplashPhoto = {
  id: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
  };
  alt_description?: string;
  description?: string;
};

interface UnsplashImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const UnsplashImagePicker: React.FC<UnsplashImagePickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      if (searchQuery.trim().length === 0) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }
      fetchResults(searchQuery.trim());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isOpen]);

  const fetchResults = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/unsplash-search?query=${encodeURIComponent(query)}`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const items: UnsplashPhoto[] = Array.isArray(data?.results) ? data.results : [];
      setResults(items);
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error while searching images');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // When a user selects an image
  const handleClickImage = (photo: UnsplashPhoto) => {
    const url = photo?.urls?.regular ?? photo?.urls?.small ?? photo?.urls?.thumb ?? '';
    if (url) {
      setSelectedUrl(url);
      onSelect(url);
      onClose();
    }
  };

  // Reset internal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setResults([]);
      setError(null);
      setSelectedUrl(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" role="dialog" aria-label="Unsplash image picker">
      <div className="bg-black/90 border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-black/60 to-black/40">
          <div className="text-white font-semibold">Unsplash Image Picker</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="mb-3">
            <input
              autoFocus
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {loading && (
            <div className="text-white/60 text-sm py-2">Loading...</div>
          )}
          {error && (
            <div className="text-red-400 text-sm py-2">{error} <button className="underline ml-2" onClick={() => fetchResults(searchQuery)}>Retry</button></div>
          )}
          <div className="flex-1 overflow-auto grid grid-cols-3 md:grid-cols-4 gap-2">
            {results.map((photo) => (
              <button key={photo.id} className="aspect-w-1 aspect-h-1" onClick={() => handleClickImage(photo)} aria-label={`Select image ${photo.id}`}>
                <img src={photo.urls.thumb} alt={photo.alt_description ?? 'unsplash image'} className="object-cover w-full h-full rounded-md" />
              </button>
            ))}
          </div>
          {results.length === 0 && !loading && !error && (
            <div className="text-white/60 text-sm mt-2">No results. Try a different search term.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end space-x-2 bg-gradient-to-t from-black/40 to-black/60">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default UnsplashImagePicker;
