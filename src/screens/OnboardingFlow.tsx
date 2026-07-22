import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Target,
  Dumbbell,
  Calendar,
  Flame,
  Bell,
  Check,
  LayoutGrid,
  Clock,
  Sparkles,
  Activity,
  Zap,
  Cpu,
  Globe,
  Ruler
} from 'lucide-react';
import { Member, UserSettings, TrainingGoal, ExperienceLevel } from '../types';
import CityAutocomplete from '../components/CityAutocomplete';

const MagneticButton = ({ children, onClick, className, disabled }: any) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current!.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set(clientX - centerX);
    y.set(clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: mouseX, y: mouseY }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
};

const SelectionCard = ({ selected, onClick, children, icon: Icon }: any) => (
  <motion.button
    onClick={() => {
      if (typeof window !== 'undefined' && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
      onClick();
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    className={`w-full p-4 md:p-6 min-h-[72px] md:min-h-[96px] rounded-[22px] md:rounded-[26px] border transition-all flex items-center justify-between group relative z-20 ${
      selected
        ? 'bg-white text-black border-transparent shadow-[0_0_60px_-20px_rgba(255,255,255,0.4)]'
        : 'bg-[#111111] text-white/40 border-white/[0.03] hover:border-white/10'
    }`}
  >
    <div className="relative flex items-center gap-4 md:gap-8 z-10">
      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${selected ? 'bg-black text-white' : 'bg-white/[0.03] text-white/20'}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className={`text-sm md:text-lg font-bold uppercase tracking-widest ${selected ? 'text-black' : 'text-white'}`}>{children}</span>
      </div>
    </div>
    {selected && <Check size={20} className="text-black" strokeWidth={3} />}
  </motion.button>
);

const FloatingLabelInput = ({ label, value, onChange, placeholder, type = 'text' }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;
  const inputId = `onboarding-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className={`relative pt-6 group`}>
      <motion.label
        htmlFor={inputId}
        animate={{
          y: isFocused || hasValue ? -22 : 0,
          scale: isFocused || hasValue ? 0.8 : 1,
          opacity: isFocused ? 1 : 0.6,
          originX: 0
        }}
        className={`absolute left-0 top-4 text-lg font-medium pointer-events-none ${isFocused ? 'text-white' : 'text-white/60'}`}
      >
        {label}
      </motion.label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full bg-transparent border-b py-4 text-2xl font-medium outline-none transition-all duration-300 ${isFocused ? 'border-white' : 'border-white/10'}`}
        placeholder={placeholder}
      />
    </div>
  );
};

interface OnboardingFlowProps {
  onComplete: (data: Member) => void;
  initialData?: { name?: string; email?: string; };
}

type OnboardingStep = 'identity' | 'goals' | 'experience' | 'parameters' | 'complete';

const STEPS: OnboardingStep[] = ['identity', 'goals', 'experience', 'parameters', 'complete'];
const TRAINING_GOALS: TrainingGoal[] = ['Fat Loss', 'Strength', 'Hypertrophy', 'Performance', 'Mobility'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, initialData }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('identity');
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const stepIndex = STEPS.indexOf(currentStep);

  const [formData, setFormData] = useState<any>({
    name: initialData?.name || '',
    bio: '',
    location: '',
    settings: {
      units: { weight: 'kg', height: 'cm', distance: 'km' },
      training: { goal: 'Strength', experienceLevel: 'Beginner', trainingDaysPerWeek: 4, equipmentAccess: [] }
    }
  });

  const nextStep = () => { if (stepIndex < STEPS.length - 1) { setDirection(1); setCurrentStep(STEPS[stepIndex + 1]); } };
  const prevStep = () => { if (stepIndex > 0) { setDirection(-1); setCurrentStep(STEPS[stepIndex - 1]); } };

  // Await the completion promise. Previously this fired-and-forgot onComplete,
  // so any failure (auth session not ready → mutation returned null) became a
  // silent unhandled rejection and the user appeared "stuck" with no feedback.
  const handleComplete = async () => {
    if (isSubmitting) return; // guard against double-submit
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onComplete(formData as any);
      // onComplete advancing the view (via App state) ends the flow on success.
    } catch (err: any) {
      const message = err?.message || 'Could not save your profile. Please try again.';
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  const updateSettings = (updates: any) => {
    setFormData((prev: any) => ({ ...prev, settings: { ...prev.settings, training: { ...prev.settings.training, ...updates } } }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'identity':
        return (
          <div className="space-y-12">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white">Identity</h1>
            <div className="space-y-8">
              <FloatingLabelInput label="Full Name" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="ALEX STERLING" />
              <CityAutocomplete
                value={formData.location}
                onChange={(v: string) => setFormData({ ...formData, location: v })}
                onCitySelect={(city: string, isUS: boolean) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    location: city,
                    settings: {
                      ...prev.settings,
                      units: isUS
                        ? { weight: 'lb', height: 'ft', distance: 'mi' }
                        : { weight: 'kg', height: 'cm', distance: 'km' },
                    },
                  }));
                }}
                placeholder="LONDON, UK"
              />
              <FloatingLabelInput label="Bio" value={formData.bio} onChange={(e: any) => setFormData({ ...formData, bio: e.target.value })} placeholder="MISSION STATEMENT" />
            </div>
          </div>
        );
      case 'goals':
        return (
          <div className="space-y-10">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white">Objective</h1>
            <div className="space-y-4">
              {TRAINING_GOALS.map(goal => (
                <SelectionCard key={goal} selected={formData.settings.training.goal === goal} onClick={() => updateSettings({ goal })} icon={Target}>{goal}</SelectionCard>
              ))}
            </div>
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-10">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white">Tier</h1>
            <div className="space-y-4">
              {EXPERIENCE_LEVELS.map(level => (
                <SelectionCard key={level} selected={formData.settings.training.experienceLevel === level} onClick={() => updateSettings({ experienceLevel: level })} icon={Zap}>{level}</SelectionCard>
              ))}
            </div>
          </div>
        );
      case 'parameters':
        return (
          <div className="space-y-10">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white">Frequency</h1>
            <div className="grid grid-cols-4 gap-4">
              {[3, 4, 5, 6].map(day => (
                <button type="button" key={day} onClick={() => updateSettings({ trainingDaysPerWeek: day })} className={`h-20 rounded-2xl font-black text-2xl border transition-all ${formData.settings.training.trainingDaysPerWeek === day ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>{day}</button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Ruler size={16} className="text-white/30" />
              <span className="text-sm font-medium text-white/30">
                Units: {formData.settings.units.weight.toUpperCase()} / {formData.settings.units.distance.toUpperCase()}
              </span>
              <span className="text-xs text-white/20 italic">— set by your location</span>
            </div>
          </div>
        );
      case 'complete':
        return (
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="w-40 h-40 rounded-full bg-white/5 border-2 border-white/20 flex items-center justify-center shadow-2xl"><Check size={80} strokeWidth={3} /></div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white">Verified</h1>
            <p className="text-white/40 text-xl italic font-serif">"Systems online. Welcome to the elite tier."</p>
            {submitError && (
              <div className="w-full space-y-3 mt-2">
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-left">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400">Could not finish</p>
                  <p className="mt-1 text-sm text-white/80">{submitError}</p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleComplete}
                  className="rounded-full bg-white/10 px-6 py-3 text-xs font-black uppercase tracking-widest text-white border border-white/10 disabled:opacity-40"
                >
                  {isSubmitting ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col p-8 md:p-20 overflow-y-auto">
      <div className="flex-1 max-w-2xl mx-auto w-full pt-10 pb-40">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: direction * 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -direction * 50 }} transition={{ duration: 0.4 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 md:p-12 flex justify-between items-center bg-gradient-to-t from-black to-transparent pointer-events-none">
        {stepIndex > 0 ? (
          <button type="button" onClick={prevStep} disabled={isSubmitting} className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 pointer-events-auto disabled:opacity-40"><ChevronLeft /></button>
        ) : <div />}
        <MagneticButton onClick={currentStep === 'complete' ? handleComplete : nextStep} disabled={isSubmitting} className="h-16 px-10 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl pointer-events-auto disabled:opacity-60">
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {currentStep === 'complete' ? 'Initialize' : 'Next Phase'} <ChevronRight size={18} />
            </>
          )}
        </MagneticButton>
      </div>
    </div>
  );
};

export default OnboardingFlow;
