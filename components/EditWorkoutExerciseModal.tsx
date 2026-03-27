import React, { useEffect, useMemo, useState } from 'react';
import { X, Clock, Dumbbell, Timer, Repeat } from 'lucide-react';
import { WorkoutExercise } from '../types';

interface EditWorkoutExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: WorkoutExercise | null;
  onSave: (updated: WorkoutExercise) => void;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const parseSeconds = (duration?: string): number => {
  if (!duration) return 45;
  const s = duration.trim().toLowerCase();
  if (s.includes(':')) {
    const [mStr, sStr] = s.split(':');
    const m = parseInt(mStr || '0', 10) || 0;
    const sec = parseInt(sStr || '0', 10) || 0;
    return clamp(m * 60 + sec, 10, 600);
  }
  if (s.includes('min')) {
    const m = parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    return clamp(m * 60, 10, 600);
  }
  const sec = parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
  return clamp(sec || 45, 10, 600);
};

const formatSeconds = (sec: number) => {
  const s = clamp(sec, 10, 600);
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r === 0 ? `${m} min` : `${m}:${String(r).padStart(2, '0')}`;
  }
  return `${s}s`;
};

const EditWorkoutExerciseModal: React.FC<EditWorkoutExerciseModalProps> = ({
  isOpen,
  onClose,
  exercise,
  onSave,
}) => {
  const [mode, setMode] = useState<'sets' | 'duration'>('sets');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [seconds, setSeconds] = useState(45);
  const [restSeconds, setRestSeconds] = useState(60);

  useEffect(() => {
    if (!isOpen || !exercise) return;

    const hasDuration = !!exercise.duration;
    setMode(hasDuration ? 'duration' : 'sets');
    setSets(exercise.sets || 3);
    const repsNum = parseInt((exercise.reps || '').replace(/[^0-9]/g, ''), 10);
    setReps(repsNum || 12);
    setSeconds(parseSeconds(exercise.duration));
    setRestSeconds(exercise.restSeconds ?? 60);
  }, [isOpen, exercise]);

  const canSave = !!exercise;

  if (!isOpen || !exercise) return null;

  return (
    <div className="fixed inset-0 z-[320] bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-10 bg-gradient-to-b from-black via-black/80 to-transparent">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 blur-surface flex items-center justify-center border border-white/10 press-scale"
        >
          <X size={20} className="text-white" />
        </button>
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Edit Exercise</span>
        <div className="w-11" />
      </div>

      <div className="h-full overflow-y-auto custom-scrollbar pt-24 pb-32 px-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-6 flex items-center gap-4">
          <img src={exercise.image} alt={exercise.name} className="w-16 h-16 rounded-2xl object-cover" />
          <div className="min-w-0">
            <h3 className="text-[18px] font-bold text-white truncate">{exercise.name}</h3>
            <p className="text-[12px] text-white/40 truncate">{exercise.muscleGroup}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Target</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('sets')}
              className={
                'flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-wider border transition-all ' +
                (mode === 'sets' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10')
              }
            >
              Sets x Reps
            </button>
            <button
              onClick={() => setMode('duration')}
              className={
                'flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-wider border transition-all ' +
                (mode === 'duration' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10')
              }
            >
              Duration
            </button>
          </div>
        </div>

        {mode === 'sets' ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Repeat size={16} className="text-white/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sets</span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSets(s => clamp(s - 1, 1, 10))}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[16px] font-bold press-scale"
                >
                  -
                </button>
                <span className="text-[28px] font-black text-white">{sets}</span>
                <button
                  onClick={() => setSets(s => clamp(s + 1, 1, 10))}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[16px] font-bold press-scale"
                >
                  +
                </button>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell size={16} className="text-white/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Reps</span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setReps(r => clamp(r - 1, 1, 50))}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[16px] font-bold press-scale"
                >
                  -
                </button>
                <span className="text-[28px] font-black text-white">{reps}</span>
                <button
                  onClick={() => setReps(r => clamp(r + 1, 1, 50))}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[16px] font-bold press-scale"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Timer size={16} className="text-white/30" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Duration</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSeconds(s => clamp(s - 5, 10, 600))}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-[18px] font-bold press-scale"
              >
                -
              </button>
              <span className="text-[32px] font-black text-white">{formatSeconds(seconds)}</span>
              <button
                onClick={() => setSeconds(s => clamp(s + 5, 10, 600))}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-[18px] font-bold press-scale"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-white/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Rest (seconds)</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setRestSeconds(s => clamp(s - 15, 0, 300))}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-[18px] font-bold press-scale"
            >
              -
            </button>
            <span className="text-[32px] font-black text-white">{restSeconds}s</span>
            <button
              onClick={() => setRestSeconds(s => clamp(s + 15, 0, 300))}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-[18px] font-bold press-scale"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 px-6 flex items-center bg-gradient-to-t from-black via-black/95 to-transparent">
        <button
          disabled={!canSave}
          onClick={() => {
            const updated: WorkoutExercise = {
              ...exercise,
              sets: mode === 'sets' ? sets : undefined,
              reps: mode === 'sets' ? `${reps} reps` : undefined,
              duration: mode === 'duration' ? formatSeconds(seconds) : undefined,
              restSeconds,
            };
            onSave(updated);
            onClose();
          }}
          className="w-full h-14 rounded-full bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)] font-bold uppercase tracking-[0.15em] text-[12px] press-scale"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default EditWorkoutExerciseModal;
