import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, Filter } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Exercise } from '../types';
import { resolveHighEndExerciseImage } from '../utils/imageResolver';
import PremiumHeader from '../components/PremiumHeader';
import PremiumSectionHeader from '../components/PremiumSectionHeader';
import LibraryActionMenu from '../components/LibraryActionMenu';
import { useAuth } from '../services/AuthContext';

const CATEGORIES = ['All', 'Strength', 'Yoga', 'HIIT', 'Cardio', 'Power'];
const INITIAL_LIMIT = 20;
const LOAD_MORE_LIMIT = 24;

interface ExercisesViewProps {
  onSelect: (ex: Exercise) => void;
}

const ExercisesView: React.FC<ExercisesViewProps> = ({ onSelect }) => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  type SortOption = 'popular' | 'difficulty' | 'alphabetical';
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const sortHydrated = useRef(false);

  // Profile query & mutation for persisting sort preference
  const profile = useQuery(api.profiles.getMe);
  const updateMeMutation = useMutation(api.profiles.updateMe);

  // Hydrate sortBy from profile once
  useEffect(() => {
    if (sortHydrated.current) return;
    if (profile?.sortPreference) {
      setSortBy(profile.sortPreference as SortOption);
      sortHydrated.current = true;
    }
  }, [profile]);

  const categoriesQuery = useQuery(api.exercises.getCategories, {});
  const categories = useMemo(() => {
    if (!categoriesQuery) return CATEGORIES;
    return ['All', ...categoriesQuery];
  }, [categoriesQuery]);

  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<Exercise[]>([]);
  const [paginationStatus, setPaginationStatus] = useState<'CanLoadMore' | 'Exhausted'>('CanLoadMore');
  const [currentLimit, setCurrentLimit] = useState<number>(INITIAL_LIMIT);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const resetPagination = useCallback(() => {
    setCursor(undefined);
    setAccumulated([]);
    setPaginationStatus('CanLoadMore');
    setCurrentLimit(INITIAL_LIMIT);
    setLoadingMore(false);
  }, []);

  const categoryFilter = activeCategory === 'All' ? undefined : activeCategory;
  const queryArg = searchQuery.trim().length > 0 ? searchQuery.trim() : undefined;
  const isSearching = searchQuery.trim().length > 0;
  
  const result = useQuery(
    api.exercises.advancedSearch,
    {
      query: queryArg,
      category: categoryFilter,
      sortBy: isSearching ? undefined : sortBy,
      limit: currentLimit,
      cursor: cursor,
    }
  );

  const mapExercise = (ex: any): Exercise => {
    const baseEx: Exercise = {
      id: ex._id,
      name: ex.name,
      image: ex.imageUrl || '',
      category: ex.category,
      muscleGroup: ex.muscleGroup,
      agonistMuscles: [
        ...(ex.primaryMuscles || []),
        ...(ex.secondaryMuscles || []),
      ],
      equipment: Array.isArray(ex.equipment) ? ex.equipment.join(', ') : String(ex.equipment || ''),
      difficulty: ex.difficulty,
      instructions: ex.instructions || [],
      duration: ex.duration || '0 min',
      reps: ex.reps || '10',
      videoUrl: ex.videoUrl,
    };
    baseEx.image = resolveHighEndExerciseImage(baseEx);
    return baseEx;
  };

  useEffect(() => {
    if (!result) return;
    const mapped = (result.exercises ?? []).map(mapExercise);

    if (!cursor) {
      setAccumulated(mapped);
    } else {
      setAccumulated((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newItems = mapped.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newItems];
      });
    }

    setPaginationStatus(
      result.status === 'Exhausted' ? 'Exhausted' : 'CanLoadMore'
    );
  }, [result, cursor]);

  const handleLoadMore = useCallback(() => {
    if (!result || paginationStatus === 'Exhausted' || loadingMore) return;
    setCursor(result.cursor ?? undefined);
    setCurrentLimit(LOAD_MORE_LIMIT);
    setLoadingMore(true);
  }, [result, paginationStatus, loadingMore]);

  useEffect(() => {
    if (loadingMore && result) {
      setLoadingMore(false);
    }
  }, [result, loadingMore]);

  const exercises: Exercise[] = accumulated;
  const isLoading = result === undefined;

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    resetPagination();
    void updateMeMutation({ sortPreference: newSort });
  };

  return (
    <div className="px-6 pt-10 pb-32">
      <PremiumHeader 
        title="Library"
        subtitle="Exercise Database"
        actions={
          <LibraryActionMenu
            currentSort={sortBy}
            onSortChange={handleSortChange}
            onFilterClick={() => {}} // Can link to advanced filter view later
            disabled={isSearching}
          />
        }
      />

      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetPagination();
            }}
            placeholder="Search movements..."
            className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl pl-10 pr-4 text-xs font-semibold focus:outline-none focus:bg-white/[0.08] transition-all placeholder:text-white/20 text-white"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar -mx-6 px-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                resetPagination();
              }}
              className={`px-4 h-8 rounded-full whitespace-nowrap text-[8px] font-black uppercase tracking-widest transition-all border ${
                activeCategory === cat ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-white/30 border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <PremiumSectionHeader title="Movements" className="mb-4" />

      {isLoading && exercises.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/30 text-sm">Loading exercises...</div>
        </div>
      ) : exercises.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/30 text-sm">No exercises found</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3.5 animate-slide-up">
            {exercises.map(ex => (
              <div
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="relative aspect-[4/5] rounded-[28px] overflow-hidden press-scale group shadow-xl border border-white/5"
              >
                <img 
                  src={ex.image} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt={ex.name} 
                />
                <div className="absolute inset-0 scrim-overlay opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-5 left-5 right-5">
                  <h3 className="text-xs font-bold leading-tight text-white">{ex.name}</h3>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1.5">{ex.muscleGroup}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center">
            {paginationStatus === 'CanLoadMore' ? (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="h-10 px-5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            ) : paginationStatus === 'Exhausted' && exercises.length > 0 ? (
              <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                All exercises loaded
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default ExercisesView;
