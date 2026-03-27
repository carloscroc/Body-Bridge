import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { WorkoutExercise } from '../types';
import { X, Plus, ChevronUp, ChevronDown, Trash2, Dumbbell, ImageIcon, Upload } from 'lucide-react';
import ExercisePicker from './ExercisePicker';
import UnsplashImagePicker from './UnsplashImagePicker';

interface ProgramBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onProgramCreated?: () => void;
}

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const;
type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];

const normalizeOrders = (list: WorkoutExercise[]): WorkoutExercise[] =>
  list.map((e, idx) => ({ ...e, order: idx }));

const ProgramBuilder: React.FC<ProgramBuilderProps> = ({ isOpen, onClose, onProgramCreated }) => {
  const createProgram = useMutation(api.programs.createProgram);

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDifficulty('Beginner');
      setExercises([]);
      setPickerOpen(false);
      setSaving(false);
      setCoverImage(null);
      setUnsplashOpen(false);
    }
  }, [isOpen]);

  const handleAddExercise = (ex: WorkoutExercise) => {
    setExercises(prev => normalizeOrders([...prev, { ...ex, order: prev.length }]));
    setPickerOpen(false);
  };

  const handleRemove = (index: number) => {
    setExercises(prev => normalizeOrders(prev.filter((_, i) => i !== index)));
  };

  const handleMove = (index: number, dir: -1 | 1) => {
    setExercises(prev => {
      const next = [...prev];
      const swapWith = index + dir;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return normalizeOrders(next);
    });
  };

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await createProgram({
        title: title.trim(),
        content: '',
        difficulty,
        tags: [],
        ...(coverImage ? { coverImage } : {}),
        exercises: exercises.map(e => ({
          exerciseId: e.exerciseId,
          name: e.name,
          image: e.image,
          muscleGroup: e.muscleGroup,
          order: e.order,
          ...(e.sets !== undefined ? { sets: e.sets } : {}),
          ...(e.reps !== undefined ? { reps: e.reps } : {}),
          ...(e.duration !== undefined ? { duration: e.duration } : {}),
          ...(e.restSeconds !== undefined ? { restSeconds: e.restSeconds } : {}),
          ...(e.videoUrl !== undefined ? { videoUrl: e.videoUrl } : {}),
        })),
      });
      onProgramCreated?.();
      onClose();
    } catch (err) {
      console.error('Failed to create program:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const canSave = title.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[300] bg-black animate-in fade-in duration-300">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-10 bg-gradient-to-b from-black via-black/80 to-transparent">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 blur-surface flex items-center justify-center border border-white/10 press-scale"
        >
          <X size={20} className="text-white" />
        </button>
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          New Program
        </span>
        <div className="w-11" />
      </div>

      {/* Body */}
      <div className="h-full overflow-y-auto custom-scrollbar pt-24 pb-32 px-6">
        {/* Title */}
        <div className="mb-8">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">
            Program Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Push / Pull / Legs"
            className="w-full h-16 bg-white/5 border border-white/10 rounded-3xl px-6 text-[20px] font-bold text-white placeholder:text-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
          />
        </div>

        {/* Difficulty */}
        <div className="mb-8">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">
            Difficulty
          </label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 h-10 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                  difficulty === d
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Cover Image */}
        <div className="mb-8">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">
            Cover Image
          </label>
          {coverImage ? (
            <div className="relative rounded-2xl overflow-hidden mb-3">
              <img src={coverImage} alt="Cover" className="w-full h-40 object-cover" />
              <button
                onClick={() => setCoverImage(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center press-scale"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-6 flex flex-col items-center gap-3">
              <ImageIcon size={24} className="text-white/20" />
              <p className="text-white/30 text-[11px]">No cover image selected</p>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 h-10 rounded-full bg-white/5 border border-white/10 press-scale hover:bg-white/10 transition-all"
            >
              <Upload size={14} className="text-white" />
              <span className="text-[11px] font-bold text-white">Upload Image</span>
            </button>
            <button
              onClick={() => setUnsplashOpen(true)}
              className="flex items-center gap-2 px-4 h-10 rounded-full bg-white/5 border border-white/10 press-scale hover:bg-white/10 transition-all"
            >
              <ImageIcon size={14} className="text-white" />
              <span className="text-[11px] font-bold text-white">Choose from Unsplash</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setCoverImage(reader.result as string);
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        {/* Exercises */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Exercises
              </span>
              <span className="text-[10px] text-white/20">({exercises.length})</span>
            </div>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 px-4 h-10 rounded-full bg-white/5 border border-white/10 press-scale hover:bg-white/10 transition-all"
            >
              <Plus size={16} className="text-white" />
              <span className="text-[11px] font-bold text-white">Add</span>
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <Dumbbell size={18} className="text-white/20" />
                <div>
                  <p className="text-white/50 text-[13px] font-semibold">No exercises yet</p>
                  <p className="text-white/20 text-[11px]">Tap Add to pick exercises from the library.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div
                  key={`${ex.exerciseId}-${idx}`}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 transition-all"
                >
                  <img
                    src={ex.image}
                    alt={ex.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-white truncate">{ex.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {ex.duration ? (
                        <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-lg">
                          {ex.duration}
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-lg">
                            {ex.sets || 3} sets
                          </span>
                          <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-lg">
                            {ex.reps || '12 reps'}
                          </span>
                        </>
                      )}
                      <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-lg">
                        Rest {ex.restSeconds ?? 60}s
                      </span>
                    </div>
                  </div>

                  {/* Reorder + Remove */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center press-scale disabled:opacity-20"
                    >
                      <ChevronUp size={14} className="text-white/60" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === exercises.length - 1}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center press-scale disabled:opacity-20"
                    >
                      <ChevronDown size={14} className="text-white/60" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(idx)}
                    className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center press-scale"
                  >
                    <Trash2 size={14} className="text-red-300" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-28 px-6 flex items-center gap-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`flex-1 h-14 rounded-full font-bold uppercase tracking-[0.15em] text-[12px] transition-all press-scale ${
            canSave && !saving
              ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]'
              : 'bg-white/10 text-white/30'
          }`}
        >
          {saving ? 'Saving...' : 'Save Program'}
        </button>
      </div>

      {/* Exercise Picker */}
      <ExercisePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onExerciseAdd={handleAddExercise}
      />

      {/* Unsplash Image Picker */}
      <UnsplashImagePicker
        isOpen={unsplashOpen}
        onClose={() => setUnsplashOpen(false)}
        onSelect={(url) => setCoverImage(url)}
      />
    </div>
  );
};

export default ProgramBuilder;