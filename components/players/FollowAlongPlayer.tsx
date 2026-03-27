import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from '../VideoPlayer';
import {
  X, Play, Pause, Info, SkipForward, SkipBack,
  ChevronRight, Maximize2, AlertCircle
} from 'lucide-react';
import { Workout } from '../../types';
import { resolveVideoSource } from '../../utils/videoSource';

// Immersive fitness video pool for variety
const WORKOUT_VIDEOS = [
  "https://player.vimeo.com/external/394336021.hd.mp4?s=7b9449f99e4367f33965d1d36d4a0f44f5358d7c&profile_id=175&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/494252666.hd.mp4?s=7221d0a13317c800840c83a99264426c6d32c525&profile_id=175&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/482898744.hd.mp4?s=4e43f1146747d79f046a3623f95f41053f12467b&profile_id=175&oauth2_token_id=57447761"
];

interface FollowAlongPlayerProps {
  workout: Workout;
  currentIdx: number;
  onSelectNext: (nextIdx: number) => void;
  onSessionComplete: () => void;
}

type PlaybackState = 'playing' | 'resting';

const FollowAlongPlayer: React.FC<FollowAlongPlayerProps> = ({ workout, currentIdx, onSelectNext, onSessionComplete }) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('playing');
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isImmersive, setIsImmersive] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showTechnique, setShowTechnique] = useState(false);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(currentIdx);

  const videoRef = useRef<HTMLVideoElement>(null);

  const currentExercise = workout.exercises[currentExerciseIdx];
  const nextExercise = workout.exercises[currentExerciseIdx + 1];

  const parseTime = (durationStr: string) => {
    if (!durationStr) return 45;
    if (durationStr.includes(':')) {
      const [m, s] = durationStr.split(':').map(Number);
      return (m * 60) + s;
    }
    const num = parseInt(durationStr);
    return isNaN(num) ? 45 : num;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize timer on mount and when exercise changes
  useEffect(() => {
    if (playbackState === 'playing') {
      setTimer(parseTime(currentExercise.duration || currentExercise.reps || "0:45"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseIdx]);

  // Set initial timer on first mount
  useEffect(() => {
    setTimer(parseTime(currentExercise.duration || currentExercise.reps || "0:45"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer countdown logic
  useEffect(() => {
    let interval: any;
    if ((playbackState === 'playing' || playbackState === 'resting') && !isPaused && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && (playbackState === 'playing' || playbackState === 'resting')) {
      if (playbackState === 'playing') {
        if (nextExercise) {
          setPlaybackState('resting');
          setTimer(15); // Standard 15s rest
        } else {
          onSessionComplete();
        }
      } else if (playbackState === 'resting') {
        const newIdx = currentExerciseIdx + 1;
        setCurrentExerciseIdx(newIdx);
        setPlaybackState('playing');
        setTimer(parseTime(workout.exercises[newIdx].duration || workout.exercises[newIdx].reps || "0:45"));
        onSelectNext(newIdx);
      }
    }
    return () => clearInterval(interval);
  }, [playbackState, isPaused, timer, currentExerciseIdx, nextExercise, workout.exercises, onSelectNext, onSessionComplete]);

  // Video Management - Responds to pause/play state changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => {});
      }
    }
  }, [isPaused, playbackState, currentExerciseIdx]);

  const resolvedExerciseVideo = resolveVideoSource(currentExercise.videoUrl);
  const isDirectFile = resolvedExerciseVideo?.kind === 'file' || resolvedExerciseVideo?.kind === 'unknown';
  const videoUrl = (isDirectFile ? resolvedExerciseVideo?.url : null) || WORKOUT_VIDEOS[currentExerciseIdx % WORKOUT_VIDEOS.length];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden animate-in fade-in duration-500 cursor-pointer" onClick={() => setIsImmersive(!isImmersive)}>
      
      {/* FULL-BLEED VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-black">
        <VideoPlayer
          source={videoUrl}
          poster={currentExercise.image}
          className={`w-full h-full object-cover transition-all duration-[2000ms] ease-out ${playbackState === 'resting' ? 'opacity-40 grayscale blur-md scale-110' : 'opacity-100'} ${isImmersive ? 'scale-110' : 'scale-100'}`}
          muted
          playsInline
          autoPlay={!isPaused}
        />
        {/* DYNAMIC SCRIM OVERLAYS */}
        <div className={`absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none transition-opacity duration-1000 ${isImmersive ? 'opacity-20' : 'opacity-100'}`} />
        {playbackState === 'resting' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-px bg-white/5" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-orange-500/5 to-transparent pointer-events-none" />
          </>
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-px bg-white/5" />
        </div>
      </div>

      {/* IMMERSIVE HUD (Only visible when UI is hidden) */}
      <div className={`absolute inset-0 z-20 pointer-events-none transition-all duration-1000 ${isImmersive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 scale-105'}`}>
        <div className="absolute top-20 right-10 flex flex-col items-end">
           <div className="bg-white/5 blur-surface border border-white/10 rounded-[24px] px-6 py-4 flex flex-col items-end shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">REMAINING</span>
              <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                {formatTime(timer)}
              </div>
           </div>
        </div>
        <div className="absolute bottom-20 left-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/60">{currentExercise.name}</span>
            </div>
            <div className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">TAP TO RESTORE CONTROLS</div>
          </div>
        </div>
      </div>

      {/* TOP INTERFACE: STORY PROGRESS & NAVIGATION */}
      <div className={`relative z-30 pt-16 px-8 transition-all duration-700 ${isImmersive ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`} onClick={e => e.stopPropagation()}>
        {/* Segmented Progress Bar (Instagram style) */}
        <div className="flex gap-2 mb-10">
          {workout.exercises.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-white transition-all duration-500 ${
                  idx < currentExerciseIdx ? 'w-full' : 
                  idx === currentExerciseIdx ? (playbackState === 'resting' ? 'w-full opacity-50' : 'w-1/2 shadow-[0_0_10px_white]') : 
                  'w-0'
                }`} 
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowExitModal(true)}
            className="w-12 h-12 rounded-full bg-black/20 blur-surface border border-white/10 flex items-center justify-center press-scale"
          >
            <X size={22} className="text-white/60" />
          </button>
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/60 block">SYNCED COACHING SESSION</span>
            </div>
            <span className="text-[12px] font-bold text-white uppercase tracking-tighter max-w-[180px] truncate">{workout.coach} • {workout.title}</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsImmersive(true)}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center press-scale shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              title="Enter Focus Mode"
            >
              <Maximize2 size={20} />
            </button>
            <button 
              onClick={() => setShowTechnique(true)}
              className="w-12 h-12 rounded-full bg-black/20 blur-surface border border-white/10 flex items-center justify-center press-scale"
              title="Coach Cues"
            >
              <Info size={20} className="text-white/40" />
            </button>
          </div>
        </div>
      </div>

      {/* CENTER CONTENT: MASSIVE TIMER & HIERARCHY */}
      <div className={`relative z-30 flex-1 flex flex-col items-center justify-center text-center px-10 transition-all duration-1000 ${isImmersive ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`} onClick={e => e.stopPropagation()}>
        <div className="animate-silk-up transition-all duration-700 transform">
          <h2 className="text-[32px] font-black tracking-tighter text-white mb-6 uppercase italic leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] truncate" title={currentExercise.name}>
            {playbackState === 'resting' ? 'RECOVERY' : currentExercise.name}
          </h2>
          
          {/* ULTRA-BOLD TIMER */}
          <div className="text-[160px] font-black tracking-tighter text-white tabular-nums leading-[0.8] drop-shadow-[0_10px_60px_rgba(0,0,0,1)]" role="timer" aria-live="polite" aria-atomic="true" aria-label={`${formatTime(timer)} remaining`}>
            {formatTime(timer)}
          </div>

          <div className="mt-12 flex items-center gap-4 justify-center">
            <div className="h-px w-8 bg-white/10" />
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30 whitespace-nowrap">
              {playbackState === 'resting' ? 'NEXT ROUND PREP' : `ROUND ${currentExerciseIdx + 1} OF ${workout.exercises.length}`}
            </p>
            <div className="h-px w-8 bg-white/10" />
          </div>
        </div>
      </div>

      {/* PLAYER CONTROLS: MINIMAL & FLOATING */}
      <div className={`relative z-30 h-40 flex items-center justify-center gap-12 px-10 transition-all duration-700 ${isImmersive ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`} onClick={e => e.stopPropagation()}>
        <button 
          onClick={() => setCurrentExerciseIdx(prev => Math.max(0, prev - 1))}
          className="w-14 h-14 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-white/20 press-scale"
        >
          <SkipBack size={24} fill="currentColor" />
        </button>

        <div className="relative">
          <div className={`absolute inset-0 bg-white/15 blur-[80px] rounded-full scale-150 transition-opacity duration-1000 ${isPaused ? 'opacity-0' : 'opacity-100'}`} />
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="relative w-24 h-24 bg-white text-black rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.5)] press-scale z-10"
          >
            {isPaused ? <Play size={44} fill="currentColor" className="ml-2" /> : <Pause size={44} fill="currentColor" />}
          </button>
        </div>

        <button 
          onClick={() => {
            if (nextExercise) {
              setPlaybackState('resting');
              setTimer(15);
            } else {
              onSessionComplete();
            }
          }}
          className="w-14 h-14 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-white/20 press-scale"
        >
          <SkipForward size={24} fill="currentColor" />
        </button>
        
        
      </div>

      {/* FOOTER: PREMIUM NEXT UP STRIP */}
      <div className={`relative z-30 h-28 px-8 mb-16 flex items-center bg-white/[0.04] blur-surface border border-white/[0.1] gap-6 mx-8 rounded-[40px] shadow-2xl overflow-hidden group transition-all duration-700 ${isImmersive ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100 translate-y-0'}`} onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 overflow-hidden border border-white/10 flex-shrink-0 shadow-lg">
          <img 
            src={nextExercise ? nextExercise.image : workout.image} 
            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" 
            alt="Next"
          />
        </div>
        
        <div className="flex-1 min-w-0">
           <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/30 mb-1.5 block">
             {playbackState === 'resting' ? 'STARTING SOON' : 'NEXT UP'}
           </span>
           <h4 className="text-[14px] font-bold text-white truncate tracking-tight uppercase italic">
             {nextExercise ? nextExercise.name : 'FINISH LINE'}
           </h4>
           <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">
             {nextExercise ? (nextExercise.duration || nextExercise.reps) : 'COMPLETING CIRCUIT'}
           </p>
        </div>

        <div className="flex-shrink-0">
          {playbackState === 'resting' ? (
            <button 
              onClick={() => setTimer(0)}
              className="px-8 h-11 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest press-scale shadow-lg"
            >
              GO NOW
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
               <ChevronRight size={18} className="text-white/10" />
            </div>
          )}
        </div>
      </div>

      {/* MODAL: EXIT CONFIRMATION */}
      {showExitModal && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center px-10">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowExitModal(false)} />
          <div className="relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-[48px] p-10 text-center animate-silk-up">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Pause Training?</h3>
            <p className="text-zinc-500 text-[14px] mb-10 leading-relaxed px-4">Your current progress for this circuit will not be logged if you leave now.</p>
            <div className="flex flex-col gap-4">
              <button onClick={() => onSessionComplete()} className="w-full h-16 bg-red-600 text-white font-black uppercase tracking-widest text-[11px] rounded-full press-scale">Quit Workout</button>
              <button onClick={() => setShowExitModal(false)} className="w-full h-16 bg-white/[0.05] text-white font-black uppercase tracking-widest text-[11px] rounded-full press-scale">Resume Session</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COACH CUES PANEL */}
      {showTechnique && (
        <div className="fixed inset-0 z-[350] flex items-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTechnique(false)} />
          <div className="relative w-full bg-[#050505] border-t border-white/10 rounded-t-[56px] p-12 animate-in slide-in-from-bottom duration-500 max-h-[80vh] overflow-y-auto custom-scrollbar shadow-[0_-20px_100px_rgba(0,0,0,0.8)]">
            <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-12" />
            <div className="flex justify-between items-start mb-10">
              <div>
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 block mb-2">Technical Insight</span>
                 <h3 className="text-[28px] font-black tracking-tighter text-white uppercase italic">Coach Cues</h3>
              </div>
              <button onClick={() => setShowTechnique(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 press-scale"><X size={20} /></button>
            </div>
            <div className="space-y-10 pb-16">
               {[
                 { title: 'Posture & Alignment', cue: 'Imagine a string pulling the crown of your head to the ceiling. Keep your ribcage tucked and glutes engaged throughout the entire range.' },
                 { title: 'Tempo Control', cue: 'The growth happens in the control. Slow down the eccentric (lowering) phase to exactly 3 seconds. Explode on the effort.' },
                 { title: 'Mind-Muscle Connection', cue: 'Do not just move the weight. Visualize the muscle contracting and stretching. Every rep must be intentional.' }
               ].map((c, i) => (
                 <div key={i} className="flex gap-8 group">
                    <span className="text-[12px] font-black text-white/10 uppercase tracking-[0.6em] pt-1.5 group-hover:text-white/30 transition-colors">0{i+1}</span>
                    <div className="flex-1">
                      <h5 className="font-bold text-white mb-3 uppercase tracking-widest text-[11px]">{c.title}</h5>
                      <p className="text-zinc-500 text-[15px] leading-relaxed font-medium">{c.cue}</p>
                    </div>
                 </div>
               ))}
            </div>
            <button 
              onClick={() => setShowTechnique(false)}
              className="w-full h-16 bg-white text-black font-black uppercase tracking-widest text-[12px] rounded-full shadow-2xl press-scale"
            >
              Back to Action
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowAlongPlayer;