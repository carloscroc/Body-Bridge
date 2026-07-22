import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Plus, Target, Check, Sparkles, Dumbbell } from 'lucide-react';
import { Exercise } from '../types';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400';

interface RipplePoint {
  id: number;
  x: number;
  y: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
}

interface PremiumExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  onSelect: () => void;
  onAdd: () => void;
  index?: number;
}

// Spring configuration for premium feel
const springConfig = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1
};

const elasticSpring = {
  type: "spring",
  stiffness: 300,
  damping: 20,
  mass: 0.8
};

const PremiumExerciseCard: React.FC<PremiumExerciseCardProps> = ({
  exercise,
  isSelected,
  onSelect,
  onAdd,
  index = 0
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<RipplePoint[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [showSuccessBurst, setShowSuccessBurst] = useState(false);
  
  // Magnetic effect values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  
  // 3D rotation based on mouse position (only when hovered)
  const rotateX = useTransform(springY, [-150, 150], [8, -8]);
  const rotateY = useTransform(springX, [-150, 150], [-8, 8]);
  
  // Glow intensity
  const glowOpacity = useTransform(
    springX,
    [-150, 0, 150],
    [0.3, 0.6, 0.3]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isSelected) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  }, [mouseX, mouseY, isSelected]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple: RipplePoint = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 800);
  }, []);

  const createParticles = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const colors = ['#ffffff', '#a1a1aa', '#71717a', '#d4d4d8'];
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: centerX,
      y: centerY,
      angle: (i / 12) * Math.PI * 2 + Math.random() * 0.5,
      distance: 60 + Math.random() * 40,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    
    setParticles(newParticles);
    
    setTimeout(() => {
      setParticles([]);
    }, 1000);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    createRipple(e);
    onSelect();
  }, [createRipple, onSelect]);

  const handleAddClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    createParticles(e);
    setShowSuccessBurst(true);
    
    setTimeout(() => {
      setShowSuccessBurst(false);
      onAdd();
    }, 600);
  }, [createParticles, onAdd]);

  return (
    <motion.div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: isSelected ? 1.02 : 1,
      }}
      transition={{
        ...elasticSpring,
        delay: index * 0.05
      }}
      whileTap={{ scale: 0.96 }}
      style={{
        rotateX: isSelected ? 0 : rotateX,
        rotateY: isSelected ? 0 : rotateY,
        transformPerspective: 1000,
      }}
      className={`
        relative aspect-[4/5] rounded-[28px] overflow-hidden 
        transition-all duration-500 ease-out
        ${isSelected 
          ? 'ring-2 ring-white shadow-[0_0_60px_rgba(255,255,255,0.15)] z-10' 
          : 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]'
        }
      `}
    >
      {/* Animated gradient border glow */}
      <motion.div
        className="absolute inset-0 rounded-[28px] pointer-events-none z-20"
        style={{
          background: isSelected 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
          opacity: isSelected ? 1 : glowOpacity,
        }}
        animate={{
          background: isSelected
            ? [
                'linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                'linear-gradient(270deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                'linear-gradient(360deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
              ]
            : undefined
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Ripple effects container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.div
              key={ripple.id}
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{ 
                width: 400, 
                height: 400, 
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                position: 'absolute',
                left: ripple.x,
                top: ripple.y,
                x: '-50%',
                y: '-50%',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.5)',
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Particle burst container */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: particle.x, 
              y: particle.y, 
              scale: 0,
              opacity: 1 
            }}
            animate={{ 
              x: particle.x + Math.cos(particle.angle) * particle.distance,
              y: particle.y + Math.sin(particle.angle) * particle.distance,
              scale: 1,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              zIndex: 50,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Success burst effect */}
      <AnimatePresence>
        {showSuccessBurst && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="w-32 h-32 rounded-full bg-white/30 blur-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main image with scale effect */}
      <motion.div 
        className="absolute inset-0 bg-zinc-900"
        animate={{
          scale: isHovered && !isSelected ? 1.08 : isSelected ? 1.05 : 1,
        }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {exercise.image && exercise.image !== '' ? (
          <img 
            src={exercise.image} 
            alt={exercise.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Dumbbell size={40} className="text-white/10" />
          </div>
        )}
      </motion.div>

      {/* Dark overlay with animated gradient */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: isSelected
            ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)'
            : isHovered
              ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)'
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Shimmer effect on hover/selected */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ 
          x: isHovered || isSelected ? '100%' : '-100%',
        }}
        transition={{ 
          duration: 1.2, 
          ease: "easeInOut",
          repeat: isHovered || isSelected ? Infinity : 0,
          repeatDelay: 2
        }}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        }}
      />

      {/* Content container */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
        {/* Top section - Difficulty badge */}
        <motion.div 
          className="flex justify-between items-start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        >
          <motion.span 
            className={`
              px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest
              backdrop-blur-md border
              ${isSelected 
                ? 'bg-white text-black border-white' 
                : 'bg-black/30 text-white/70 border-white/10'
              }
            `}
            animate={{
              scale: isSelected ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 0.3,
              delay: 0.2
            }}
          >
            {exercise.difficulty}
          </motion.span>
          
          {/* Sparkle icon when selected */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Sparkles size={16} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom section - Title and metadata */}
        <div className="space-y-3">
          <motion.h4 
            className="text-[14px] font-bold text-white leading-tight"
            animate={{
              y: isSelected ? -4 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            {exercise.name}
          </motion.h4>
          
          <motion.div 
            className="flex items-center gap-2"
            animate={{
              opacity: isSelected ? 1 : 0.7,
            }}
          >
            <Target size={11} className="text-white/60" />
            <span className="text-[10px] text-white/60 truncate">{exercise.bodyRegion}</span>
            <span className="text-[10px] text-white/30">•</span>
            <span className="text-[10px] text-white/60">{exercise.category}</span>
          </motion.div>
        </div>
      </div>

      {/* Magnetic Add Button - Only shown when selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 500,
              damping: 25,
              delay: 0.1
            }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            {/* Background blur circle */}
            <motion.div
              className="absolute w-24 h-24 rounded-full bg-black/40 backdrop-blur-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
            
            {/* Magnetic add button */}
            <motion.button
              onClick={handleAddClick}
              className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_10px_40px_rgba(255,255,255,0.3)]"
              whileHover={{ 
                scale: 1.15,
                boxShadow: '0 15px 50px rgba(255,255,255,0.5)'
              }}
              whileTap={{ scale: 0.9 }}
              transition={springConfig}
            >
              <AnimatePresence mode="wait">
                {showSuccessBurst ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <Check size={28} className="text-black" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="plus"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Plus size={28} className="text-black" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Button glow pulse */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white pointer-events-none"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.button>

            {/* Radial lines indicating selection */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-3 bg-white/30 rounded-full pointer-events-none"
                style={{
                  transformOrigin: 'center',
                  transform: `rotate(${i * 45}deg) translateY(-50px)`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.03, type: "spring" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection indicator ring animation */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-[28px] pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.1)',
          }}
        />
      )}
    </motion.div>
  );
};

// Staggered container for multiple cards
interface PremiumExerciseGridProps {
  exercises: Exercise[];
  selectedId: string | null;
  onSelect: (exercise: Exercise) => void;
  onAdd: (exercise: Exercise) => void;
}

export const PremiumExerciseGrid: React.FC<PremiumExerciseGridProps> = ({
  exercises,
  selectedId,
  onSelect,
  onAdd
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 pb-4">
      {exercises.map((exercise, index) => (
        <PremiumExerciseCard
          key={exercise.id}
          exercise={exercise}
          isSelected={selectedId === exercise.id}
          onSelect={() => onSelect(exercise)}
          onAdd={() => onAdd(exercise)}
          index={index}
        />
      ))}
    </div>
  );
};

