import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X, Plus, Dumbbell, Flame, Clock, ChevronDown, ChevronUp, Sparkles, Copy, Check, ImageIcon, Upload, Trash2 } from 'lucide-react';
import { UserWorkout, WorkoutExercise } from '../types';
import ExercisePicker from './ExercisePicker';
import EditWorkoutExerciseModal from './EditWorkoutExerciseModal';
import UnsplashImagePicker from './UnsplashImagePicker';

type Section = 'warmup' | 'main' | 'cooldown';

interface TrainingArchitectProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (training: any) => void;
  existingTraining?: any | null;
  calendarDateStr?: string | null;
  onCalendarAdded?: () => void;
}

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const FOCUS_OPTIONS = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Core', 'Upper Body', 'Lower Body', 'Full Body'];

const normalizeOrders = (list: WorkoutExercise[]) => list.map((e, idx) => ({ ...e, order: idx }));

const parseMinutes = (ex: WorkoutExercise): number => {
  if (ex.duration) {
    const s = ex.duration.trim().toLowerCase();
    if (s.includes(':')) {
      const [mStr, sStr] = s.split(':');
      const m = parseInt(mStr || '0', 10) || 0;
      const sec = parseInt(sStr || '0', 10) || 0;
      return m + sec / 60;
    }
    if (s.includes('min')) {
      return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    }
    const sec = parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    return (sec || 45) / 60;
  }
  const sets = ex.sets || 3;
  return sets * 0.75;
};

const TrainingArchitect: React.FC<TrainingArchitectProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  existingTraining, 
  calendarDateStr, 
  onCalendarAdded 
}) => {
  const createProgramMutation = useMutation(api.programs.createProgram);
  const addToPlanMutation = useMutation(api.userPlans.addToPlan);
  const exercisesQuery = useQuery(api.exercises.advancedSearch, {});
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  const [warmup, setWarmup] = useState<WorkoutExercise[]>([]);
  const [main, setMain] = useState<WorkoutExercise[]>([]);
  const [cooldown, setCooldown] = useState<WorkoutExercise[]>([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSection, setPickerSection] = useState<Section>('main');
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [editState, setEditState] = useState<{ section: Section; index: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmAnimation, setShowConfirmAnimation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (existingTraining) {
      setTitle(existingTraining.title || '');
      setDescription(existingTraining.description || existingTraining.content || '');
      setDifficulty(existingTraining.difficulty || 'Intermediate');
      setCoverImage(existingTraining.coverImage || existingTraining.image || null);
      setSelectedFocus(existingTraining.focus || []);
      setWarmup(normalizeOrders(existingTraining.warmupExercises || []));
      setMain(normalizeOrders(existingTraining.exercises || []));
      setCooldown(normalizeOrders(existingTraining.cooldownExercises || []));
    } else {
      setTitle('');
      setDescription('');
      setDifficulty('Intermediate');
      setCoverImage(null);
      setSelectedFocus([]);
      setWarmup([]);
      setMain([]);
      setCooldown([]);
    }
    setCurrentStep(1);
    setSaving(false);
    setShowConfirmAnimation(false);
  }, [isOpen, existingTraining]);

  const allExercises = useMemo(() => [...warmup, ...main, ...cooldown], [warmup, main, cooldown]);

  const totalDuration = useMemo(() => {
    const minutes = allExercises.reduce((acc, ex) => acc + parseMinutes(ex), 0);
    return `${Math.max(5, Math.round(minutes))} min`;
  }, [allExercises]);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);

    try {
      // 1. Save as a reusable Program Blueprint
      const programId = await createProgramMutation({
        title: title.trim(),
        content: description,
        difficulty,
        tags: selectedFocus,
        coverImage: coverImage || undefined,
        exercises: allExercises, // In unified builder, we send all exercises
        // We'll also store the section info in the exercise metadata if needed, 
        // but for now let's keep it simple.
      });

      const savedBlueprint = {
        id: programId,
        title,
        description,
        difficulty,
        image: coverImage,
        exercises: allExercises,
        totalDuration,
        isCustom: true
      };

      // 2. If scheduling, add to plan immediately
      if (calendarDateStr) {
        setShowConfirmAnimation(true);
        setTimeout(async () => {
          await addToPlanMutation({
            item: savedBlueprint as any,
            type: 'workout',
            scheduledDate: calendarDateStr,
            mealType: 'morning', // default slot
          });
          onCalendarAdded?.();
          onComplete(savedBlueprint);
          onClose();
        }, 800);
        return;
      }

      onComplete(savedBlueprint);
      onClose();
    } catch (err) {
      console.error('Failed to save training:', err);
    } finally {
      setSaving(false);
    }
  };

  const openPicker = (section: Section) => {
    setPickerSection(section);
    setPickerOpen(true);
  };

  const addToSection = (section: Section, ex: WorkoutExercise) => {
    const withOrder = (list: WorkoutExercise[]) => normalizeOrders([...list, { ...ex, order: list.length }]);
    if (section === 'warmup') setWarmup(prev => withOrder(prev));
    else if (section === 'cooldown') setCooldown(prev => withOrder(prev));
    else setMain(prev => withOrder(prev));
  };

  const removeFromSection = (section: Section, index: number) => {
    const mutate = (list: WorkoutExercise[]) => normalizeOrders(list.filter((_, i) => i !== index));
    if (section === 'warmup') setWarmup(prev => mutate(prev));
    else if (section === 'cooldown') setCooldown(prev => mutate(prev));
    else setMain(prev => mutate(prev));
  };

  const renderSection = (section: Section, label: string, list: WorkoutExercise[]) => {
    const hasAny = list.length > 0;
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</span>
            <span className="text-[10px] text-white/20">({list.length})</span>
          </div>
          <button
            onClick={() => openPicker(section)}
            className="flex items-center gap-2 px-4 h-10 rounded-full bg-white/5 border border-white/10 press-scale hover:bg-white/10 transition-all"
          >
            <Plus size={16} className="text-white" />
            <span className="text-[11px] font-bold text-white">Add</span>
          </button>
        </div>

        {!hasAny ? (
          <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center">
            <Dumbbell size={24} className="text-white/10 mb-3" />
            <p className="text-white/30 text-[13px] font-medium leading-relaxed max-w-[160px]">Tap Add to pick exercises for this phase.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((ex, idx) => (
              <div
                key={`${section}-${ex.exerciseId}-${idx}`}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 group"
              >
                <img src={ex.image} alt={ex.name} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold text-white truncate">{ex.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-white/40 bg-white/5 px-2 py-0.5 rounded-md font-medium">
                      {ex.duration || `${ex.sets || 3} × ${ex.reps || '12'}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromSection(section, idx)}
                  className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity press-scale"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  if (showConfirmAnimation) {
    return (
      <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-silk-up">
            <Check size={40} className="text-green-400" />
          </div>
          <h3 className="text-[24px] font-black text-white mb-2 animate-silk-up" style={{ animationDelay: '0.1s' }}>Blueprint Saved!</h3>
          <p className="text-white/40 text-[14px] animate-silk-up" style={{ animationDelay: '0.2s' }}>Added to your library and plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] bg-black animate-in fade-in duration-300 flex flex-col">
      {/* Header */}
      <div className="h-20 px-6 flex items-center justify-between z-10 bg-gradient-to-b from-black to-transparent">
        <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/10 blur-surface flex items-center justify-center border border-white/10 press-scale">
          <X size={20} className="text-white" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Training Architect</span>
          <div className="flex items-center gap-1.5 mt-1">
            {[1, 2].map(step => (
              <div key={step} className={`w-1.5 h-1.5 rounded-full transition-all ${currentStep === step ? 'bg-white w-4' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
        <div className="w-11" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-4 pb-32">
        {currentStep === 1 ? (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-left">
              <h2 className="text-3xl font-extrabold text-white tracking-tight italic editorial-title leading-tight mb-2">Identify your session</h2>
              <p className="text-white/40 text-[15px]">Give your training blueprint a name and visual identity.</p>
            </div>

            {/* Name Input */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Blueprint Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Afternoon Power Builder"
                className="w-full h-16 bg-white/5 border border-white/10 rounded-3xl px-6 text-[20px] font-bold text-white placeholder:text-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
              />
            </div>

            {/* Difficulty/Intensity */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Challenge Level</label>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                      difficulty === d ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Focus Areas</label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map(focus => (
                  <button
                    key={focus}
                    onClick={() => setSelectedFocus(prev => prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus])}
                    className={`px-4 h-10 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                      selectedFocus.includes(focus) ? 'bg-white/20 text-white border-white/40' : 'bg-white/5 text-white/30 border-white/10'
                    }`}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Visual Identity</label>
              {coverImage ? (
                <div className="relative rounded-3xl overflow-hidden mb-4 border border-white/10 aspect-video">
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button onClick={() => setCoverImage(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 blur-surface flex items-center justify-center border border-white/20 press-scale">
                    <X size={18} className="text-white" />
                  </button>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-10 flex flex-col items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <ImageIcon size={32} className="text-white/20" />
                  </div>
                  <p className="text-white/30 text-[14px] font-medium">No cover image selected</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 press-scale hover:bg-white/10 transition-all font-bold text-[12px] uppercase tracking-widest text-white/60">
                  <Upload size={16} /> Upload
                </button>
                <button onClick={() => setUnsplashOpen(true)} className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 press-scale hover:bg-white/10 transition-all font-bold text-[12px] uppercase tracking-widest text-white/60">
                  <Sparkles size={16} /> Unsplash
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setCoverImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-left">
              <h2 className="text-3xl font-extrabold text-white tracking-tight italic editorial-title leading-tight mb-2">Build the blueprint</h2>
              <p className="text-white/40 text-[15px]">Sequence your session from warm-up to cool-down.</p>
            </div>

            {renderSection('warmup', 'Warm-up Phase', warmup)}
            {renderSection('main', 'Main Training', main)}
            {renderSection('cooldown', 'Cool-down Phase', cooldown)}

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-5">Training Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-white/40" />
                    <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Duration</span>
                  </div>
                  <span className="text-xl font-bold text-white">{totalDuration}</span>
                </div>
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell size={14} className="text-white/40" />
                    <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Total Volume</span>
                  </div>
                  <span className="text-xl font-bold text-white">{allExercises.length} Movements</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
        <div className="max-w-md mx-auto flex gap-4">
          {currentStep === 2 && (
            <button 
              onClick={() => setCurrentStep(1)} 
              className="h-14 px-10 rounded-[24px] bg-white/5 border border-white/10 text-white font-black text-[12px] uppercase tracking-[0.2em] press-scale"
            >
              Back
            </button>
          )}
          <button
            onClick={currentStep === 1 ? () => setCurrentStep(2) : handleSave}
            disabled={!title.trim() || saving}
            className={`flex-1 h-14 rounded-[24px] font-black uppercase tracking-[0.2em] text-[12px] transition-all press-scale flex items-center justify-center gap-3 ${
              title.trim() && !saving ? 'bg-white text-black shadow-[0_20px_50px_rgba(255,255,255,0.15)]' : 'bg-white/5 text-white/20 border border-white/5'
            }`}
          >
            {saving ? 'Synchronizing...' : currentStep === 1 ? 'Design Blueprint' : 'Release Training'}
            {currentStep === 1 && <ChevronDown size={18} className="-rotate-90" />}
          </button>
        </div>
      </div>

      <ExercisePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onExerciseAdd={(ex) => {
          addToSection(pickerSection, ex);
          setPickerOpen(false);
        }}
      />

      <UnsplashImagePicker
        isOpen={unsplashOpen}
        onClose={() => setUnsplashOpen(false)}
        onSelect={(url) => setCoverImage(url)}
      />
      
      {/* Exercise Edit Modal would go here if needed, or we keep it simple for now */}
    </div>
  );
};

export default TrainingArchitect;
