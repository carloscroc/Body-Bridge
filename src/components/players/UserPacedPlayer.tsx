import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from '../VideoPlayer';
import { Play, Pause, CheckCircle, X, Maximize2, Minimize2, ChevronLeft, Info, AlertCircle } from 'lucide-react';
import { Workout } from '../../types';
import { resolveVideoSource } from '../../utils/videoSource';
import { motion, AnimatePresence } from 'framer-motion';

interface UserPacedPlayerProps {
  workout: Workout;
  onComplete: () => void;
  totalTimeElapsed: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onExit: () => void;
}

const UserPacedPlayer: React.FC<UserPacedPlayerProps> = ({ 
  workout, 
  onComplete,
  totalTimeElapsed,
  isTimerRunning,
  onToggleTimer,
  onExit
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isImmersive, setIsImmersive] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showTechnique, setShowTechnique] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Video control
  useEffect(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.play().catch(e => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVideoPlaying]);

  const currentExercise = workout.exercises[currentIndex];
  const videoUrl = currentExercise.videoUrl || '';

  const handleCheckmark = () => {
    setCompletedCount(prev => prev + 1);

    // Check if this was the last exercise
    if (currentIndex === workout.exercises.length - 1) {
      setTimeout(() => {
        onComplete();
      }, 300);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 bg-black">
        {videoUrl ? (
          <VideoPlayer
            source={videoUrl}
            poster={currentExercise.image}
            className="w-full h-full object-cover"
            autoPlay={isVideoPlaying}
            muted={isImmersive}
            playsInline
            ref={videoRef}
          />
        ) : currentExercise.image ? (
          <img 
            src={currentExercise.image} 
            alt={currentExercise.name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : null}
        <div className={`absolute inset-0 bg-gradient-to-b from-black/90 via-black/20 to-black/90 transition-opacity duration-1000 ${isImmersive ? 'opacity-40' : 'opacity-100'}`} />
      </div>

      {/* Header with Global Timer */}
      <div 
        className={`absolute top-0 left-0 right-0 z-20 pt-12 px-6 pb-4 bg-gradient-to-b from-black/90 to-transparent transition-all duration-1000 ${isImmersive ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}
      >
        {/* Top Row: Navigation & Controls */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors press-scale"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">FREESTYLE TRACK</span>
              </div>
              <div className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none">
                {formatTime(totalTimeElapsed)}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsImmersive(!isImmersive)}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors press-scale"
            >
              {isImmersive ? <Minimize2 size={20} className="text-white" /> : <Maximize2 size={20} className="text-white" />}
            </button>
            <button 
              type="button"
              onClick={() => setShowTechnique(true)}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors press-scale"
              title="Coach Cues"
            >
              <Info size={20} className="text-white" />
            </button>
            <button
              type="button"
              onClick={onToggleTimer}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors press-scale shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
          </div>
        </div>
        
        {/* Progress Indicators */}
        <div className="flex gap-1.5 w-full">
          {workout.exercises.map((ex, idx) => (
            <div 
              key={ex.id || idx} 
              className="h-1.5 flex-1 rounded-full bg-white/10 relative"
            >
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-500 ${
                  idx < currentIndex ? 'bg-white/60 w-full' : 
                  idx === currentIndex ? 'bg-blue-500 w-full shadow-[0_0_10px_#3b82f6]' : 'bg-transparent w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Checkmark Button */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-1000 ${isImmersive ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}
      >
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleCheckmark}
            className="flex items-center justify-center gap-3 w-full max-w-md h-16 rounded-full bg-white text-black hover:bg-gray-100 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.15)] press-scale"
          >
            <CheckCircle size={24} />
            <span className="font-black uppercase tracking-widest text-[14px]">
              {currentIndex === workout.exercises.length - 1 ? 'FINISH WORKOUT' : `COMPLETE ${completedCount} / ${workout.exercises.length}`}
            </span>
          </button>
        </div>
      </div>

      {/* Swipeable Carousel */}
      <div
        ref={scrollContainerRef}
        className={`relative z-10 flex items-center justify-center h-full pt-20 pb-24 px-4 transition-all duration-1000 ${isImmersive ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <div className="flex gap-6 items-center w-full max-w-md overflow-x-auto snap-x snap-mandatory custom-scrollbar pb-8">
          <AnimatePresence mode="popLayout">
            {/* Previous Exercise */}
            {currentIndex > 0 && (
              <motion.div
                key="prev"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 0.5 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                onKeyDown={(e) => e.key === 'Enter' && setCurrentIndex(prev => prev - 1)}
                role="button"
                tabIndex={0}
                className="flex-shrink-0 w-[85%] h-[60vh] max-h-[500px] rounded-[32px] bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors snap-center overflow-hidden"
              >
                <div className="w-full h-full flex flex-col">
                  {workout.exercises[currentIndex - 1].image && (
                    <img
                      src={workout.exercises[currentIndex - 1].image}
                      alt={workout.exercises[currentIndex - 1].name}
                      className="w-full h-1/2 object-cover"
                    />
                  )}
                  <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
                    <CheckCircle size={32} className="text-white/40 mb-4" />
                    <h3 className="text-2xl font-bold text-white truncate w-full" title={workout.exercises[currentIndex - 1].name}>{workout.exercises[currentIndex - 1].name}</h3>
                    <p className="text-sm text-white/60 mt-2 font-bold uppercase tracking-widest">Completed</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Current Exercise */}
            <motion.div
              key="current"
              initial={{ x: 0, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 0, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 w-[90%] h-[65vh] max-h-[550px] rounded-[32px] bg-white/10 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] snap-center overflow-hidden"
            >
              <div className="w-full h-full flex flex-col">
                {currentExercise.image && (
                  <div className="relative w-full h-[45%]">
                    <img
                      src={currentExercise.image}
                      alt={currentExercise.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                )}
                <div className="flex-1 p-6 flex flex-col bg-[#121212]">
                  <div className="mb-6">
                    <h3 className="text-3xl font-black text-white mb-2 tracking-tight leading-tight">{currentExercise.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest">{currentExercise.category}</span>
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest">{currentExercise.bodyRegion}</span>
                    </div>
                  </div>

                  <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                    {currentExercise.instructions?.map((instruction) => (
                      <div key={instruction} className="flex items-start gap-3 text-sm text-white/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{instruction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Next Exercise */}
            {currentIndex < workout.exercises.length - 1 && (
              <motion.div
                key="next"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 0.5 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                onKeyDown={(e) => e.key === 'Enter' && setCurrentIndex(prev => prev + 1)}
                role="button"
                tabIndex={0}
                className="flex-shrink-0 w-[85%] h-[60vh] max-h-[500px] rounded-[32px] bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors snap-center overflow-hidden"
              >
                <div className="w-full h-full flex flex-col">
                  {workout.exercises[currentIndex + 1].image && (
                    <img
                      src={workout.exercises[currentIndex + 1].image}
                      alt={workout.exercises[currentIndex + 1].name}
                      className="w-full h-1/2 object-cover"
                    />
                  )}
                  <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">NEXT UP</span>
                    <h3 className="text-2xl font-bold text-white truncate w-full" title={workout.exercises[currentIndex + 1].name}>{workout.exercises[currentIndex + 1].name}</h3>
                    <p className="text-sm text-white/60 mt-2 font-bold uppercase tracking-widest">Tap to view</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Swipe Instructions */}
      <div className={`absolute bottom-32 left-0 right-0 z-10 text-center transition-opacity duration-1000 ${isImmersive ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Swipe to view exercises</p>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center px-10">
          <button 
            type="button"
            className="absolute inset-0 w-full h-full bg-black/90 backdrop-blur-md cursor-default" 
            onClick={() => setShowExitModal(false)} 
            aria-label="Close modal"
          />
          <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[48px] p-10 text-center animate-silk-up">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Exit Workout?</h3>
            <p className="text-zinc-500 text-[14px] mb-10 leading-relaxed px-4">Your progress will be lost. Are you sure you want to exit?</p>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  onExit();
                }}
                className="w-full h-16 bg-red-600 text-white font-black uppercase tracking-widest text-[11px] rounded-full press-scale"
              >
                Exit
              </button>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="w-full h-16 bg-white/[0.05] text-white font-black uppercase tracking-widest text-[11px] rounded-full press-scale"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COACH CUES PANEL */}
      {showTechnique && (
        <div className="fixed inset-0 z-[350] flex items-end">
          <button 
            type="button"
            className="absolute inset-0 w-full h-full bg-black/70 backdrop-blur-sm cursor-default" 
            onClick={() => setShowTechnique(false)} 
            aria-label="Close modal"
          />
          <div className="relative w-full bg-[#050505] border-t border-white/10 rounded-t-[56px] p-12 animate-in slide-in-from-bottom duration-500 max-h-[80vh] overflow-y-auto custom-scrollbar shadow-[0_-20px_100px_rgba(0,0,0,0.8)]">
            <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-12" />
            <div className="flex justify-between items-start mb-10">
              <div>
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 block mb-2">Technical Insight</span>
                 <h3 className="text-[28px] font-black tracking-tighter text-white uppercase italic">Coach Cues</h3>
              </div>
              <button type="button" onClick={() => setShowTechnique(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 press-scale"><X size={20} /></button>
            </div>
            <div className="space-y-10 pb-16">
               {[
                 { id: 'alignment', title: 'Posture & Alignment', cue: 'Imagine a string pulling the crown of your head to the ceiling. Keep your ribcage tucked and glutes engaged throughout the entire range.' },
                 { id: 'tempo', title: 'Tempo Control', cue: 'The growth happens in the control. Slow down the eccentric (lowering) phase to exactly 3 seconds. Explode on the effort.' },
                 { id: 'mind-muscle', title: 'Mind-Muscle Connection', cue: 'Do not just move the weight. Visualize the muscle contracting and stretching. Every rep must be intentional.' }
               ].map((c, i) => (
                 <div key={c.id} className="flex gap-8 group">
                    <span className="text-[12px] font-black text-white/10 uppercase tracking-[0.6em] pt-1.5 group-hover:text-white/30 transition-colors">0{i+1}</span>
                    <div className="flex-1">
                      <h5 className="font-bold text-white mb-3 uppercase tracking-widest text-[11px]">{c.title}</h5>
                      <p className="text-zinc-500 text-[15px] leading-relaxed font-medium">{c.cue}</p>
                    </div>
                 </div>
               ))}
            </div>
            <button 
              type="button"
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

export default UserPacedPlayer;
