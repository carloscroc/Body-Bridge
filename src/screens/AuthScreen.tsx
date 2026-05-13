
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
   Mail, 
   Lock, 
   User, 
   ArrowRight,
   ChevronLeft,
   Sparkles
 } from 'lucide-react';
import { useUserValidation } from '../hooks/useUserValidation';

export type AuthMode = 'landing' | 'login' | 'signup';

interface AuthScreenProps {
  onAuth: (data: { name?: string; email: string; password: string; method: 'login' | 'signup' }) => void | Promise<void>;
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth, initialMode = 'landing', onModeChange }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    // Clear fields when mode changes
    setEmail('');
    setPassword('');
    setName('');
    setAuthError(null);
  }, [initialMode]);

  const updateMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  const { validateCredentials, validateRegistration, errors } = useUserValidation();

  // Run validation whenever email, password, name, or mode changes
  React.useEffect(() => {
    if (mode === 'login') {
      validateCredentials(email, password);
    } else {
      validateRegistration(name, email, password);
    }
  }, [email, password, name, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    
    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      setAuthError('Please fix the errors above');
      setIsLoading(false);
      return;
    }
    
    try {
      await onAuth({ name, email, password, method: mode as 'login' | 'signup' });
    } catch (err: any) {
      console.error('Auth submit error:', err);
      // Display user-friendly error messages
      const errorMessage = err?.message || 'Authentication failed. Please try again.';
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLanding = () => (
    <motion.div 
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col justify-between p-8 text-center"
    >
      {/* Hero Header */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center relative bg-white/[0.02]"
        >
          <span className="editorial-title text-7xl text-white italic">F</span>
          <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse" />
        </motion.div>

        <div className="space-y-2">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="editorial-title text-7xl md:text-8xl text-white italic uppercase tracking-tighter"
          >
            FORGE
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-fraunces italic text-xl text-white/40"
          >
            Industrial Grade Fitness
          </motion.p>
        </div>
      </div>

      {/* Trust Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-12"
      >
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/10 blur-surface bg-white/[0.03]">
          <Sparkles size={14} className="text-[#FFB800]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">AI COACH ACTIVE</span>
        </div>
      </motion.div>

      {/* DEV: Quick access to Settings when forceSettings=1 is provided in URL */}
      {typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('forceSettings') === '1' && (
        <div style={{position: 'fixed', top: 12, right: 12, zIndex: 9999}}>
          <button
            type="button"
            onClick={() => {
              try { window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/settings' } })); } catch (e) {}
            }}
            className="h-10 px-3 rounded-full bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest"
            aria-label="Dev open settings"
            title="Dev: Open Settings"
          >
            Open Settings (dev)
          </button>
        </div>
      )}

      {/* Primary Actions */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="flex flex-col gap-4 max-w-sm mx-auto w-full pb-8"
      >
        <button
          type="button"
          onClick={() => updateMode('signup')}
          className="h-16 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-[0.2em] press-scale shadow-2xl"
        >
          Start Training
        </button>
        
        <button
          type="button"
          onClick={() => updateMode('login')}
          className="h-16 rounded-2xl border border-white/10 text-white text-xs font-black uppercase tracking-[0.2em] press-scale bg-white/[0.02]"
        >
          Sign In
        </button>
      </motion.div>
    </motion.div>
  );

  const renderForm = () => (
    <motion.div 
      key="form"
      initial={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
      className="h-full flex flex-col justify-center p-6"
    >
      <button 
        type="button"
        onClick={() => updateMode('landing')}
        className="absolute top-8 left-6 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/60 press-scale blur-surface bg-white/[0.03] z-50"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="w-full max-w-md mx-auto space-y-10">
        <div className="text-left space-y-2">
          <h2 className="editorial-title text-6xl text-white italic uppercase tracking-tighter">
            {mode === 'login' ? 'LOGIN' : 'JOIN'}
          </h2>
          <p className="font-fraunces italic text-lg text-white/40">
            {mode === 'login' ? 'Resume your mission' : 'Set up your plan'}
          </p>
        </div>

        {authError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium"
          >
            {authError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {mode === 'signup' && (
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFB800] transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="FULL NAME"
                  autoComplete="off"
                  required
                  className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl pl-16 pr-6 text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-[#FFB800]/50 transition-all placeholder:text-white/10"
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFB800] transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                autoComplete="new-email"
                required
                className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl pl-16 pr-6 text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-[#FFB800]/50 transition-all placeholder:text-white/10"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFB800] transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SECURE PASSWORD"
                autoComplete="new-password"
                required
                className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl pl-16 pr-6 text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-[#FFB800]/50 transition-all placeholder:text-white/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-16 bg-white text-black rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] press-scale shadow-2xl relative overflow-hidden"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Profile'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setAuthError(null);
              setEmail('');
              setPassword('');
              setName('');
              updateMode(mode === 'login' ? 'signup' : 'login');
            }}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
          >
            {mode === 'login' ? "New Recruit? Sign Up" : "Member? Log In"}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 w-full h-full bg-[#050505] text-white z-[9999] overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === 'landing' ? renderLanding() : renderForm()}
      </AnimatePresence>

      <style>{`
        .blur-surface {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .press-scale:active {
          transform: scale(0.97);
        }
        .editorial-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 0.9;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
