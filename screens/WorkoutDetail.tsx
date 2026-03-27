import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuth } from '../services/AuthContext';
import { 
  ChevronLeft, Clock, Zap, Flame, Share2, Bookmark, 
  CheckCircle2, ChevronRight,
  Loader2
} from 'lucide-react';
import { Workout, Exercise } from '../types';
import FollowAlongPlayer from '../components/players/FollowAlongPlayer';
import UserPacedPlayer from '../components/players/UserPacedPlayer';
import WorkoutFormatSelection from '../components/WorkoutFormatSelection';
import { useSessionTimer } from '../components/hooks/useSessionTimer';

interface WorkoutDetailProps {
  workout: Workout;
  onBack: () => void;
  onSelectExercise?: (exercise: Exercise) => void;
}

type SessionState = 'idle' | 'preparing' | 'playing' | 'resting' | 'summary';

// Hook for smooth scroll progress with spring physics
const useSmoothScroll = (ref: React.RefObject<HTMLElement | null>, damping: number = 0.1) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const targetProgress = useRef(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = element.scrollTop;
      const maxScroll = element.scrollHeight - element.clientHeight;
      targetProgress.current = maxScroll > 0 ? Math.min(scrollTop / 300, 1) : 0;
    };

    const animate = () => {
      const diff = targetProgress.current - scrollProgress;
      if (Math.abs(diff) > 0.001) {
        setScrollProgress(prev => prev + diff * damping);
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [ref, damping, scrollProgress]);

  return scrollProgress;
};


const WorkoutDetail: React.FC<WorkoutDetailProps> = ({ workout, onBack, onSelectExercise }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<'follow_along' | 'user_paced'>('follow_along');
  const [visibleExercises, setVisibleExercises] = useState<Set<number>>(new Set());

  // Shared session timer
  const { elapsedTime: totalTimeElapsed, isRunning: isTimerRunning, start: startTimer, pause: pauseTimer, reset: resetTimer } = useSessionTimer(false);

  // Auth & API mutation integration
  const { user } = useAuth();
  const createWorkoutLog = useMutation(api.progress.createWorkoutLog);

  // Finishing state for FINISH SESSION flow
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const exerciseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollProgress = useSmoothScroll(scrollContainerRef, 0.12);
  // Intersection Observer for exercise items reveal animation
  useEffect(() => {
    if (sessionState !== 'idle') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-idx'));
          if (entry.isIntersecting) {
            setVisibleExercises((prev) => new Set([...prev, idx]));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    exerciseRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [sessionState, workout.exercises.length]);

  // Manage timer based on session state
  useEffect(() => {
    if (sessionState === 'playing') {
      startTimer();
    } else {
      pauseTimer();
    }
  }, [sessionState, startTimer, pauseTimer]);

  const handleStart = () => {
    setSessionState('preparing');
  };

  const handleFormatSelect = (format: 'follow_along' | 'user_paced') => {
    setSelectedFormat(format);
    setSessionState('playing');
    resetTimer();
    startTimer();
    setCurrentExerciseIdx(0);
  };

  // --- RENDERS ---

  // Finish handler for FINISH SESSION button
  const handleFinish = async () => {
    // Debounce multiple submissions
    if (isFinishing) return;
    // If a previous error exists, allow user to exit regardless
    if (finishError) {
      onBack();
      return;
    }
    // If user not authenticated, exit gracefully
    if (!user?._id) {
      onBack();
      return;
    }

    setIsFinishing(true);
    setFinishError(null);

    try {
      await createWorkoutLog({
        userId: user._id,
        date: Date.now(),
        exercises: workout.exercises,
        duration: totalTimeElapsed,
        notes: workout.title,
      } as any);
      onBack();
    } catch (err) {
      setFinishError('Unable to save your workout log. Please try again or exit.');
      setIsFinishing(false);
    }
  };

  if (sessionState === 'summary') {
    return (
      <div className="fixed inset-0 z-[250] bg-[#050505] flex flex-col items-center justify-center px-10 animate-in fade-in duration-700">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <h1 className="text-[48px] font-black tracking-tighter text-white leading-[0.9] mb-4 text-center">SESSION<br />COMPLETE</h1>
        <p className="text-white/40 text-[13px] font-bold tracking-widest uppercase mb-12 text-center">Elite performance tracked</p>
        
        <div className="grid grid-cols-3 w-full gap-4 mb-20 bg-white/[0.03] p-8 rounded-[40px] border border-white/[0.05]">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Time</span>
            <span className="text-xl font-bold text-white">{Math.floor(totalTimeElapsed / 60)}m</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Burn</span>
            <span className="text-xl font-bold text-white">{workout.kcal}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Effort</span>
            <span className="text-xl font-bold text-white">94%</span>
          </div>
        </div>

        <div className="w-full">
          {finishError && (
            <div className="mb-2 text-xs text-red-400 font-bold">{finishError}</div>
          )}
          <button 
            onClick={handleFinish} 
            disabled={isFinishing}
            className={`w-full h-18 bg-white rounded-full flex flex-col items-center justify-center py-2.5 gap-y-1 shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-all active:scale-[0.96] text-black ${isFinishing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span className="font-black uppercase tracking-[0.14em] text-[16px] leading-none">FINISH SESSION</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/35 leading-none">PERFORMANCE LOGGED</span>
          </button>
        </div>
      </div>
    );
  }

  if (sessionState === 'playing' || sessionState === 'resting') {
    return (
      <>
        {selectedFormat === 'follow_along' && (
          <FollowAlongPlayer
            workout={workout}
            currentIdx={currentExerciseIdx}
            onSelectNext={(nextIdx) => setCurrentExerciseIdx(nextIdx)}
            onSessionComplete={() => setSessionState('summary')}
          />
        )}
        {selectedFormat === 'user_paced' && (
          <UserPacedPlayer
            workout={workout}
            onComplete={() => setSessionState('summary')}
            totalTimeElapsed={totalTimeElapsed}
            isTimerRunning={isTimerRunning}
            onToggleTimer={() => isTimerRunning ? pauseTimer() : startTimer()}
            onExit={() => setSessionState('idle')}
          />
        )}
      </>
    );
  }

  if (sessionState === 'preparing') {
    return (
      <div className="fixed inset-0 z-[250] bg-[#050505] flex flex-col items-center px-8 overflow-y-auto pt-16 pb-32 custom-scrollbar">
        <button
          onClick={() => setSessionState('idle')}
          className="fixed top-8 left-8 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center press-scale z-[300]"
        >
          <ChevronLeft size={24} className="text-white/60" />
        </button>

        <WorkoutFormatSelection workout={workout} onSelect={handleFormatSelect} />
      </div>
    );
  }

  // --- IDLE STATE (WORKOUT OVERVIEW) ---
  // Calculate scroll-based transforms for cinematic header fade effect
  const headerOpacity = Math.max(0, 1 - scrollProgress * 1.8);
  const headerBlur = scrollProgress * 15;
  const headerScale = 1 + scrollProgress * 0.1;
  const headerTranslateY = scrollProgress * 80; // Subtle parallax
  const imageScale = 1.1 + scrollProgress * 0.2;
  const navOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.6) * 4));
  
  return (
    <div className="relative h-screen w-full bg-[#050505] overflow-hidden">
      {/* FIXED STICKY TOP BAR (Reveals on scroll) */}
      <div 
        className="fixed top-0 left-0 right-0 z-[150] h-20 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.05] px-8 flex items-center justify-between transition-all duration-500"
        style={{
          opacity: navOpacity,
          transform: `translateY(${navOpacity > 0 ? 0 : -20}px)`,
          pointerEvents: navOpacity > 0.5 ? 'auto' : 'none',
        }}
      >
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ChevronLeft size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>
        <h2 className="text-[12px] font-black text-white uppercase italic tracking-tighter truncate max-w-[200px]">{workout.title}</h2>
        <div className="flex gap-4">
          <Share2 size={16} className="text-white/40" />
          <Bookmark size={16} fill={isBookmarked ? 'white' : 'none'} className={isBookmarked ? 'text-white' : 'text-white/40'} />
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto custom-scrollbar no-scrollbar"
      >
        {/* Cinematic Hero Section (Now part of the scroll flow) */}
        <div className="relative w-full h-[70vh] flex-shrink-0 overflow-hidden">
          {/* Parallax Image Layer */}
          <div 
            className="absolute inset-0 will-change-transform"
            style={{
              transform: `scale(${imageScale}) translateY(${headerTranslateY * 0.5}px)`,
              opacity: headerOpacity,
              filter: `blur(${headerBlur}px)`,
            }}
          >
            <img 
              src={workout.image} 
              className="w-full h-full object-cover" 
              alt={workout.title}
            />
          </div>
          
          {/* Dynamic Scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/40" />
          <div 
            className="absolute inset-0 bg-[#050505]"
            style={{ opacity: scrollProgress * 0.8 }}
          />
          
          {/* Header Controls (Relative to Hero) */}
          <div 
            className="absolute top-12 left-8 right-8 flex justify-between z-20"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 2),
              transform: `translateY(${scrollProgress * -30}px)`,
            }}
          >
            <button onClick={onBack} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 press-scale">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div className="flex gap-3">
               <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 press-scale">
                 <Share2 size={18} className="text-white/70" />
               </button>
               <button onClick={() => setIsBookmarked(!isBookmarked)} className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border border-white/10 press-scale transition-all ${isBookmarked ? 'bg-white text-black' : 'bg-black/40 text-white'}`}>
                 <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
               </button>
            </div>
          </div>

          {/* Title Area */}
          <div 
            className="absolute bottom-12 left-8 right-8 z-10"
            style={{
              opacity: headerOpacity,
              transform: `translateY(${scrollProgress * -50}px)`,
            }}
          >
            <div className="flex items-center gap-2 mb-3 animate-silk-up">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">LEAD COACH: {workout.coach.toUpperCase()}</p>
            </div>
            <h1 className="text-[48px] font-black leading-[0.95] tracking-tight text-white mb-4 animate-silk-up drop-shadow-2xl" style={{ animationDelay: '0.1s' }}>{workout.title}</h1>
            <p className="text-white/40 text-[14px] font-medium leading-relaxed line-clamp-2 animate-silk-up max-w-[85%]" style={{ animationDelay: '0.2s' }}>{workout.description}</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 pb-56 -mt-6 relative z-20">
          <div 
            className="grid grid-cols-3 bg-[#121212]/60 border border-white/[0.05] rounded-[40px] p-8 mb-12 shadow-2xl backdrop-blur-xl"
            style={{
              transform: `translateY(${Math.max(0, 40 - scrollProgress * 60)}px)`,
              opacity: Math.min(1, 0.4 + scrollProgress * 1.5),
            }}
          >
             <div className="flex flex-col items-center group cursor-default">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 group-hover:text-white/40 transition-colors">Time</span>
                <div className="flex items-center gap-2 text-white group-hover:scale-105 transition-transform duration-300">
                  <Clock size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
                  <span className="text-[15px] font-bold">{workout.duration}</span>
                </div>
             </div>
             <div className="flex flex-col items-center border-x border-white/5 px-2 group cursor-default">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 group-hover:text-white/40 transition-colors">Level</span>
                <div className="flex items-center gap-2 text-white group-hover:scale-105 transition-transform duration-300">
                  <Zap size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
                  <span className="text-[15px] font-bold">{workout.intensity}</span>
                </div>
             </div>
             <div className="flex flex-col items-center group cursor-default">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 group-hover:text-white/40 transition-colors">Burn</span>
                <div className="flex items-center gap-2 text-white group-hover:scale-105 transition-transform duration-300">
                  <Flame size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
                  <span className="text-[15px] font-bold">{workout.kcal}</span>
                </div>
             </div>
          </div>

          <div className="animate-silk-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">CIRCUIT SEQUENCE</h3>
              <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">{workout.exercises.length} MOVEMENTS</span>
            </div>
            <div className="space-y-3">
              {workout.exercises.map((ex, idx) => {
                const isVisible = visibleExercises.has(idx);
                const delay = idx * 80;
                
                return (
                  <div 
                    key={idx} 
                    ref={(el) => { exerciseRefs.current[idx] = el; }}
                    data-idx={idx}
                    onClick={() => onSelectExercise && onSelectExercise(ex)} 
                    className="flex items-center gap-6 p-5 rounded-[32px] bg-white/[0.03] border border-white/[0.06] press-scale cursor-pointer group hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-500"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible 
                        ? 'translateY(0) scale(1)' 
                        : 'translateY(30px) scale(0.95)',
                      transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
                    }}
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-lg relative"
                      style={{
                        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                        opacity: isVisible ? 1 : 0,
                        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay + 100}ms`,
                      }}
                    >
                      <img 
                        src={ex.image} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        alt={ex.name}
                        style={{
                          filter: isVisible ? 'blur(0px)' : 'blur(8px)',
                          transition: `filter 0.6s ease ${delay + 200}ms`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div 
                      className="flex-1 min-w-0"
                      style={{
                        transform: isVisible ? 'translateX(0)' : 'translateX(-15px)',
                        opacity: isVisible ? 1 : 0,
                        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay + 150}ms`,
                      }}
                    >
                      <h4 className="text-[15px] font-bold text-white tracking-tight mb-1 truncate uppercase italic group-hover:text-white/90 transition-colors">{ex.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/25 group-hover:text-white/40 transition-colors">
                        {ex.duration || ex.reps} • {ex.muscleGroup.toUpperCase()}
                      </p>
                    </div>
                    <div
                      style={{
                        transform: isVisible ? 'translateX(0) rotate(0deg)' : 'translateX(10px) rotate(-90deg)',
                        opacity: isVisible ? 1 : 0,
                        transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${delay + 200}ms`,
                      }}
                    >
                      <ChevronRight size={18} className="text-white/10 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-40 px-8 flex items-end pb-10 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent z-[130] pointer-events-none">
        <div className="w-full pointer-events-auto">
          <button onClick={handleStart} className="w-full h-18 sm:h-18 md:h-18 bg-white rounded-full flex flex-col items-center justify-center py-2.5 gap-y-1 shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-all active:scale-[0.96] text-black">
            <span className="font-black uppercase tracking-[0.14em] text-[16px] sm:text-[17px] leading-none">START CIRCUIT</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/35 leading-none">FORGE ELITE PLAN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetail;
