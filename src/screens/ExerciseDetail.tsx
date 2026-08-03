
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Play, Info, Bookmark, ChevronDown, ChevronUp, Clock, Target, Dumbbell, CheckCircle2, X } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Exercise, Workout } from '../types';
import { getExerciseGuide } from '../services/geminiService';
import WorkoutBuilderWorkspace from '../components/WorkoutBuilderWorkspace';
import VideoPlayer from '../components/VideoPlayer';

interface ExerciseDetailProps {
  exercise: Exercise;
  onBack: () => void;
  onGoToWorkout?: (workoutId: string) => void;
  onStartWorkout?: (workout: Workout) => void;
  onGoToCalendar?: () => void;
}

interface GuideSection {
  header: string;
  items: string[];
}

interface Point {
  x: number;
  y: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const PRESET_GUIDES: Record<string, string> = {
  'Barbell Squat': `01 Setup
* Rest the bar across your upper traps. Grip as narrow as shoulder mobility allows to create a "muscular shelf."
* Step back with two deliberate steps. Feet just outside shoulder-width, toes slightly flared.
* Brace your core deeply.

02 Movement
* Sit your hips back and down simultaneously. Keep chest tall.
* Drive knees outward so they track over your toes.
* Squat until the hip crease is below the knee.
* Drive through mid-foot to stand.

03 Breathing & Bracing
* Inhale at the top. Hold through the descent.
* Exhale only after passing the "sticking point" on the ascent.
* Maintain intra-abdominal pressure.

04 Common Mistakes
* **Knees caving in.** Actively drive knees out to engage glutes.
* **Heels lifting.** Keep weight distributed across the mid-foot.
* **Rounding back.** Keep lats tight and chest proud.

05 Progressions
* High Bar Squat
* Low Bar Squat
* Front Squat`,
  'Dumbbell Press': `01 Setup
* Sit on bench edge with dumbbells on knees.
* Use knees to kick weights into position as you lay back.
* Retract shoulder blades firmly into the bench.

02 Movement
* Lower weights under control to chest level.
* Press up without clanking weights at the top.

03 Breathing & Bracing
* Inhale on the descent.
* Exhale on the press.
* Keep feet planted for a stable base.`
};

const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ 
  exercise, 
  onBack, 
  onGoToWorkout,
  onStartWorkout,
  onGoToCalendar
}) => {
  const [guideRaw, setGuideRaw] = useState<string | null>(PRESET_GUIDES[exercise.name] || null);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoOrigin, setVideoOrigin] = useState<Point | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [watchRipples, setWatchRipples] = useState<Ripple[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);


  const modalY = useMotionValue(0);
  const modalScale = useTransform(modalY, [0, 220], [1, 0.96]);
  const backdropOpacity = useTransform(modalY, [0, 220], [1, 0.35]);

  useEffect(() => {
    if (!PRESET_GUIDES[exercise.name]) {
      async function loadGuide() {
        try {
          const text = await getExerciseGuide(exercise.name);
          setGuideRaw(text);
        } catch (err) {
          console.error(err);
          setGuideRaw("Guide currently unavailable.");
        }
      }
      loadGuide();
    }
  }, [exercise.name]);

  useEffect(() => {
    if (isPlayingVideo) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isPlayingVideo]);

  const openVideo = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = {
      x: rect.left + rect.width * 0.2,
      y: rect.top + rect.height * 0.5,
    };

    // Local ripple (button-relative)
    const rx = e.clientX - rect.left;
    const ry = e.clientY - rect.top;
    const ripple: Ripple = { id: Date.now(), x: rx, y: ry };
    setWatchRipples(prev => [...prev, ripple]);
    window.setTimeout(() => {
      setWatchRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 650);

    setVideoReady(false);
    setVideoOrigin(origin);
    setIsPlayingVideo(true);
    modalY.set(0);
  }, [modalY]);

  const closeVideo = useCallback(() => {
    setIsPlayingVideo(false);
    modalY.set(0);
  }, [modalY]);

  const clipStart = videoOrigin
    ? `circle(0px at ${Math.round(videoOrigin.x)}px ${Math.round(videoOrigin.y)}px)`
    : 'circle(0px at 50% 45%)';
  const clipEnd = videoOrigin
    ? `circle(150vmax at ${Math.round(videoOrigin.x)}px ${Math.round(videoOrigin.y)}px)`
    : 'circle(150vmax at 50% 45%)';

  const sections = useMemo(() => {
    if (!guideRaw) return [];
    const lines = guideRaw.split('\n').filter(l => l.trim().length > 0);
    const result: GuideSection[] = [];
    let currentSection: GuideSection | null = null;

    lines.forEach(line => {
      if (line.match(/^\d{2}\s/) || line.startsWith('###') || line.startsWith('##')) {
        if (currentSection) result.push(currentSection);
        currentSection = {
          header: line.replace(/^\d{2}\s*/, '').replace(/^#{2,3}\s*/, '').trim(),
          items: []
        };
      } else if (currentSection) {
        currentSection.items.push(line.replace(/^[*•-]\s*/, ''));
      }
    });
    if (currentSection) result.push(currentSection);
    return result;
  }, [guideRaw]);

  const renderText = (text: string) => {
    let parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="relative h-screen w-full bg-black flex flex-col overflow-hidden">
      {/* 1. Immersive Hero Area */}
      <div className="h-[38%] w-full relative flex-shrink-0">
        <img src={exercise.image} className="w-full h-full object-cover" alt={exercise.name} />
        
        {/* Soft Radial Scrim for focus */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* Top Control */}
        <div className="absolute top-14 left-8 z-20">
          <button 
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-black/40 blur-surface flex items-center justify-center border border-white/10 press-scale"
          >
            <ArrowLeft size={22} className="text-white" />
          </button>
        </div>

        {/* Hero Content - Matching Screenshot Layout */}
        <div className="absolute bottom-12 left-10 right-10 z-10 flex flex-col items-start">
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 block animate-silk-up">
              {exercise.difficulty.toUpperCase()}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 block animate-silk-up">
              {exercise.category.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-end justify-between w-full">
            <h1 className="text-[52px] font-extrabold leading-[0.9] tracking-tighter text-white animate-silk-up whitespace-pre-line">
              {exercise.name.replace(' ', '\n')}
            </h1>
            
            {exercise.videoUrl && (
              <div className="animate-silk-up" style={{ animationDelay: '0.2s' }}>
                <motion.button
                  onClick={openVideo}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative flex items-center gap-1.5 py-1 text-white/60 hover:text-white transition-colors overflow-hidden"
                  aria-label="Watch exercise demo"
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <AnimatePresence>
                      {watchRipples.map(r => (
                        <motion.div
                          key={r.id}
                          initial={{ width: 0, height: 0, opacity: 0.55 }}
                          animate={{ width: 180, height: 180, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            position: 'absolute',
                            left: r.x,
                            top: r.y,
                            x: '-50%',
                            y: '-50%',
                            borderRadius: '9999px',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 35%, transparent 70%)'
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  <motion.span
                    className="inline-flex items-center justify-center"
                    animate={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.12))' }}
                  >
                    <Play fill="currentColor" size={10} strokeWidth={3} />
                  </motion.span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">WATCH DEMO</span>
                  <span className="text-[9px] text-white/20 ml-0.5">0:42</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Facts Grid */}
      <div className="flex-1 bg-black pt-12 overflow-y-auto custom-scrollbar pb-40">
        <div className="px-10 grid grid-cols-3 gap-2 mb-16 animate-silk-up" style={{ animationDelay: '0.3s' }}>
          {[
            { label: 'BODY AREA', value: exercise.bodyRegion, icon: <Target size={14} /> },
            { label: 'EQUIPMENT', value: exercise.equipment, icon: <Dumbbell size={14} /> },
            { label: 'LEVEL', value: exercise.difficulty, icon: <Clock size={14} /> }
          ].map((fact, i) => (
            <div key={i} className="flex flex-col gap-3">
              <span className="text-[9px] font-bold text-white/30 tracking-[0.1em]">{fact.label}</span>
              <div className="flex items-center gap-2">
                <div className="text-white/40">{fact.icon}</div>
                <span className="text-[14px] font-bold text-white tracking-tight">{fact.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Guide Sections */}
        <div className="px-10 animate-silk-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Info size={16} className="text-white/40" />
              <h3 className="text-[18px] font-bold text-white tracking-tight">Coach's Notes</h3>
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">{sections.length} STEPS</span>
          </div>

          <div className="space-y-0 border-t border-white/[0.08]">
            {sections.map((section, idx) => {
              const isOpen = expandedSection === idx;
              return (
                <div key={idx} className="border-b border-white/[0.08]">
                  <button 
                    onClick={() => setExpandedSection(isOpen ? null : idx)}
                    className="w-full py-7 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-5">
                      <span className="text-[11px] font-bold text-white/20 uppercase">{String(idx + 1).padStart(2, '0')}</span>
                      <h4 className={`text-[17px] font-bold tracking-tight transition-colors ${isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                        {section.header}
                      </h4>
                    </div>
                    {isOpen ? <ChevronUp size={18} className="text-white/20" /> : <ChevronDown size={18} className="text-white/20" />}
                  </button>
                  {isOpen && (
                    <div className="pb-8 pl-[42px] pr-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0" />
                          <p className="text-zinc-500 text-[15px] leading-relaxed">
                            {renderText(item)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Action Bar - Styled to Match Screenshot */}
      <div className="fixed bottom-0 left-0 right-0 h-36 px-10 flex items-center gap-4 z-[130] bg-gradient-to-t from-black via-black/90 to-transparent">
        <button 
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`w-14 h-14 rounded-full border border-white/10 flex items-center justify-center transition-all press-scale ${
            isBookmarked ? 'bg-white text-black' : 'bg-white/5 text-white/40'
          }`}
        >
          <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <button 
          onClick={() => setShowBuilder(true)}
          className="flex-1 h-14 rounded-full flex items-center justify-center font-bold uppercase tracking-[0.15em] text-[11px] transition-all active:scale-[0.97] bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)] press-scale"
        >
          ADD TO WORKOUT
        </button>
      </div>

      {/* 5. Video Player Overlay (Cinematic) */}
      <AnimatePresence>
        {isPlayingVideo && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col"
            initial={{ opacity: 1, clipPath: clipStart }}
            animate={{ opacity: 1, clipPath: clipEnd }}
            exit={{ opacity: 1, clipPath: clipStart }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ backgroundColor: 'rgba(0,0,0,1)' }}
            onClick={closeVideo}
          >
            {/* Backdrop layers */}
            <motion.div
              className="absolute inset-0"
              style={{ opacity: backdropOpacity }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.10),transparent_60%)]" />
            </motion.div>

            {/* Close button */}
            <div className="absolute top-12 left-8 z-[210]">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  closeVideo();
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-full bg-white/10 blur-surface flex items-center justify-center border border-white/10"
                aria-label="Close demo"
              >
                <X size={24} className="text-white" />
              </motion.button>
            </div>

            {/* Modal content (drag to dismiss) */}
            <div className="flex-1 flex items-center justify-center p-4">
              <motion.div
                onClick={(e) => e.stopPropagation()}
                drag="y"
                dragElastic={0.12}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  const shouldClose = info.offset.y > 140 || info.velocity.y > 900;
                  if (shouldClose) closeVideo();
                  else modalY.set(0);
                }}
                style={{ y: modalY, scale: modalScale }}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="relative w-full max-w-[760px]"
              >
                {/* Handle */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/20" />

                <div className="relative rounded-[32px] shadow-2xl border border-white/10 overflow-hidden">
                  {/* Loading veil */}
                  <AnimatePresence>
                    {!videoReady && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm"
                      >
                        <div className="absolute inset-0 animate-shimmer opacity-60" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-full border border-white/20 border-t-white/70 animate-spin" />
                          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Loading demo</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="w-full bg-black aspect-video max-h-[70vh]">
                    <VideoPlayer
                      videoUrl={exercise.videoUrl}
                      autoPlay
                      controls
                      playsInline
                      className="w-full h-full"
                      onLoadStart={() => {
                        console.log('[VIDEO DEBUG] onLoadStart');
                        setVideoReady(false);
                      }}
                      onReady={() => {
                        console.log('[VIDEO DEBUG] onReady');
                        setVideoReady(true);
                      }}
                    />
                  </div>

                  {/* Film edge highlights */}
                  <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_55%)]" />
                </div>
              </motion.div>
            </div>

            <motion.div
              className="p-10 pb-20 text-center space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.2, duration: 0.35 }}
            >
              <h2 className="text-2xl font-black text-white tracking-tighter">{exercise.name}</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Swipe down to dismiss</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Builder Workspace */}
      <WorkoutBuilderWorkspace
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        exercise={exercise}
        onStartWorkout={onStartWorkout}
        onGoToCalendar={onGoToCalendar}
      />
    </div>
  );
};

export default ExerciseDetail;
