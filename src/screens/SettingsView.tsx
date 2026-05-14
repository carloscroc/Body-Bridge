import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '../services/AuthContext';
import PremiumStreakCounter from '../components/PremiumStreakCounter';
import {
  ArrowLeft, Camera, Bell, Shield,
  CreditCard, Moon, Ruler, LogOut,
  Check, ChevronRight, RefreshCw, Zap, Utensils,
  Dumbbell, Target, Activity, Heart, Globe,
  Smartphone, Info, Trash2, Lock, Calendar, Clock,
  MessageSquare, X, Upload
} from 'lucide-react';
import { UserSettings, Subscription, TrainingGoal, ExperienceLevel } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  onLogout?: () => void;
}

const CoachSection = () => {
  const [coachEmail, setCoachEmail] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const joinCoach = useMutation(api.coach.joinCoachByEmail);
  const myCoach = useQuery(api.coach.getMyCoach);

  const handleJoin = async () => {
    if (!coachEmail.trim()) return;
    setIsJoining(true);
    setMessage(null);
    try {
      await joinCoach({ coachEmail });
      setMessage({ type: 'success', text: 'Request sent! Your coach must approve it.' });
      setCoachEmail('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Coach not found.' });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Section title="Coach Settings">
      {myCoach ? (
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden bg-zinc-900">
            <img src={myCoach.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} className="w-full h-full object-cover" alt="" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-white block">{myCoach.fullName || 'Active Coach'}</span>
            <span className="text-[10px] font-medium text-green-400 uppercase tracking-widest block mt-0.5">Synced & Active</span>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <p className="text-white/40 text-[12px]">Connect with a trainer to receive professional workout programs.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              value={coachEmail}
              onChange={(e) => setCoachEmail(e.target.value)}
              placeholder="Trainer's Email"
              className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-[14px] text-white focus:outline-none focus:bg-white/[0.08]"
            />
            <button 
              onClick={handleJoin}
              disabled={isJoining || !coachEmail.includes('@')}
              className="h-12 px-6 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-widest press-scale disabled:opacity-30"
            >
              {isJoining ? 'Sending...' : 'Join'}
            </button>
          </div>
          {message && (
            <p className={`text-[10px] font-bold uppercase tracking-wider ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}
        </div>
      )}
    </Section>
  );
};

const Section = ({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) => (
  <div className={`space-y-4 ${className}`}>
    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/60 ml-5">{title}</h3>
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[38px] overflow-hidden text-left text-white">
      {children}
    </div>
  </div>
);

const ToggleItem = ({ label, sublabel, value, onChange, icon: Icon }: { label: string, sublabel?: string, value: boolean, onChange: (v: boolean) => void, icon?: any }) => (
  <button 
    onClick={() => onChange(!value)}
    className="w-full flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
  >
    <div className="flex items-center gap-4 text-left">
      {Icon && <Icon size={20} className="text-white/40 group-hover:text-white transition-colors" />}
      <div>
        <span className="text-[15px] font-bold text-white group-hover:text-white transition-colors block">{label}</span>
        {sublabel && <span className="text-[10px] font-medium text-white/30 block mt-0.5">{sublabel}</span>}
      </div>
    </div>
    <div className={`w-12 h-7 rounded-full relative transition-all duration-300 ${value ? 'bg-white' : 'bg-white/10'}`}>
      <div className={`absolute top-1 bottom-1 w-5 rounded-full transition-all duration-300 shadow-sm ${value ? 'left-6 bg-black' : 'left-1 bg-white/40'}`} />
    </div>
  </button>
);

const ActionItem = ({ label, onClick, icon: Icon, value, destructive = false, sublabel, badge }: { label: string, onClick: () => void, icon?: any, value?: string, destructive?: boolean, sublabel?: string, badge?: string }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
  >
    <div className="flex items-center gap-4 text-left">
      {Icon && <Icon size={20} className={`${destructive ? 'text-red-500' : 'text-white/40 group-hover:text-white'} transition-colors`} />}
      <div>
        <div className="flex items-center gap-2">
          <span className={`text-[15px] font-bold ${destructive ? 'text-red-500' : 'text-white group-hover:text-white'} transition-colors block text-left`}>{label}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase text-blue-400 tracking-wider">
              {badge}
            </span>
          )}
        </div>
        {sublabel && <span className="text-[10px] font-medium text-white/30 block mt-0.5">{sublabel}</span>}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-[13px] font-bold text-white/40">{value}</span>}
      <ChevronRight size={18} className="text-white/20 group-hover:text-white/40 transition-colors" />
    </div>
  </button>
);

const InputItem = ({ label, value, onChange, placeholder, multiline = false }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, multiline?: boolean }) => (
  <div className="p-6 border-b border-white/5 last:border-0 text-left">
    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2.5 ml-1">
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[16px] font-bold text-white placeholder-white/20 focus:outline-none focus:placeholder-white/10 transition-all resize-none leading-relaxed"
        placeholder={placeholder}
        rows={3}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[16px] font-bold text-white placeholder-white/20 focus:outline-none focus:placeholder-white/10 transition-all"
        placeholder={placeholder}
      />
    )}
  </div>
);

const SegmentedItem = ({ label, options, value, onChange, icon: Icon }: { label: string, options: { label: string, value: any }[], value: any, onChange: (v: any) => void, icon?: any }) => (
  <div className="p-6 border-b border-white/5 last:border-0 text-left">
    <div className="flex items-center gap-4 mb-4">
      {Icon && <Icon size={20} className="text-white/40" />}
      <span className="text-[15px] font-bold text-white">{label}</span>
    </div>
    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            value === opt.value 
              ? 'bg-white text-black shadow-lg' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

type SubView = 'main' | 'identity' | 'training' | 'system' | 'notifications' | 'privacy' | 'membership' | 'integrations' | 'support' | 'legal';

const SettingsSheet = ({ 
  isOpen, 
  title, 
  onClose, 
  children 
}: { 
  isOpen: boolean, 
  title: string, 
  onClose: () => void, 
  children: React.ReactNode 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-12 bg-[#050505] rounded-t-[48px] border-t border-white/10 flex flex-col animate-in slide-in-from-bottom duration-500 shadow-3xl">
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 press-scale">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white italic">{title}</h2>
          <div className="w-10" />
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
          <div className="max-w-xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onLogout }) => {
  const profileData = useQuery(api.profiles.getMe);
  const updateProfileMutation = useMutation(api.profiles.updateMe);
  const deleteAccount = useMutation(api.account.deleteAccount);
  const seedExercises = useMutation(api.exercises.seed);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Streak data
  const streakData = useQuery(api.userPlans.getStreak);
  const streakDataValue = streakData || { currentStreak: 0, longestStreak: 0 };
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [initialState, setInitialState] = useState<string>('');

  useEffect(() => {
    if (!profileData) return;
    
    const displayName = profileData.fullName || '';
    setName(displayName);
    setBio(profileData.bio || '');
    setLocation(profileData.location || '');
    setAvatar(profileData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200');
    
    const fullSettings: UserSettings = {
      theme: 'system',
      units: { weight: 'kg', height: 'cm', distance: 'km', ...profileData.units },
      notifications: {
        workoutReminders: true,
        workoutReminderTime: '08:00',
        mealPrepAlerts: true,
        communityUpdates: false,
        coachMessages: true
      },
      privacy: {
        visibility: 'Public',
        shareStats: true,
        showOnlineStatus: true
      },
      training: {
        goal: (profileData.goal as TrainingGoal) || 'Strength',
        experienceLevel: (profileData.experienceLevel as ExperienceLevel) || 'Intermediate',
        trainingDaysPerWeek: profileData.trainingDaysPerWeek || 5,
        equipmentAccess: profileData.equipmentAccess || ['Full Gym'],
        injuries: '',
        preferredWorkoutTime: '07:00'
      },
      integrations: {
        appleHealth: true,
        googleFit: false,
        calendarSync: true
      },
    };
    
    setSettings(fullSettings);
    
    const sub: Subscription = (profileData.subscription as Subscription) || {
      plan: 'Pro',
      status: 'active',
      renewalDate: '2026-03-11'
    };
    setSubscription(sub);

    setInitialState(JSON.stringify({
      name: displayName,
      bio: profileData.bio || '',
      location: profileData.location || '',
      avatar: profileData.avatarUrl || avatar,
      settings: fullSettings,
      subscription: sub
    }));
  }, [profileData]);

  const currentState = useMemo(() => {
    if (!settings || !subscription) return '';
    return JSON.stringify({
      name,
      bio,
      location,
      avatar,
      settings,
      subscription
    });
  }, [name, bio, location, avatar, settings, subscription]);

  const isDirty = useMemo(() => {
    if (!initialState || !currentState) return false;
    return initialState !== currentState;
  }, [initialState, currentState]);

  const handleSave = async () => {
    if (!settings || !subscription) return;
    
    setIsSaving(true);
    try {
      await updateProfileMutation({
        fullName: name,
        bio,
        location,
        avatarUrl: avatar,
        goal: settings.training.goal,
        experienceLevel: settings.training.experienceLevel,
        trainingDaysPerWeek: settings.training.trainingDaysPerWeek,
        equipmentAccess: settings.training.equipmentAccess,
        units: settings.units,
      });
      setInitialState(currentState);
      setToast({ message: 'Profile Updated Successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update profile', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateNested = (category: keyof UserSettings, updates: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [category]: { ...settings[category], ...updates }
    });
  };

  const handleDeleteAccount = async () => {
    if (confirm('This will permanently erase all data. Proceed?')) {
      try {
        await deleteAccount();
        onLogout?.();
      } catch (err) {
        setToast({ message: 'Failed to delete account.', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  // If backend data isn't available yet (dev/proxy down or slow), show
  // a resilient loading skeleton and actionable controls instead of a
  // blank glass spinner. This improves UX when navigating Settings while
  // the profile API is unavailable.
  if (!profileData || !settings || !subscription) return (
    <div className="min-h-full bg-[#050505] p-6 text-white">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-6 flex justify-between items-center text-left">
            <div className="w-10" />
            <h1 className="text-sm font-black uppercase tracking-[0.25em] text-white">Settings</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
            <div className="h-6 bg-white/6 rounded w-48 mb-4 animate-pulse" />
            <div className="h-4 bg-white/4 rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-white/4 rounded w-40 animate-pulse" />
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
            <div className="h-6 bg-white/6 rounded w-36 mb-4 animate-pulse" />
            <div className="h-4 bg-white/4 rounded w-56 mb-2 animate-pulse" />
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
            <div className="h-6 bg-white/6 rounded w-44 mb-4 animate-pulse" />
            <div className="h-4 bg-white/4 rounded w-48 mb-2 animate-pulse" />
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-2xl bg-white text-black font-bold"
            >
              Retry
            </button>
            <button
              onClick={() => {
                try { localStorage.setItem('body-bridge_logged_out', '1'); } catch (e) {}
                try { window.location.reload(); } catch (e) {}
              }}
              className="px-4 py-2 rounded-2xl border border-white/10 text-white"
            >
              Back to Sign-in
            </button>
            <div className="text-white/50 text-sm">Loading profile data…</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-[#050505] pb-40 animate-in fade-in duration-700 font-sans selection:bg-white/20 text-white text-left">
      
      <div className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-6 py-6 flex justify-between items-center text-left">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 press-scale"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-black uppercase tracking-[0.25em] text-white">Settings</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-6 space-y-10 max-w-2xl mx-auto relative z-10">

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[48px] p-10 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

          <div className="relative mb-8">
            <div className="w-36 h-36 rounded-full border-4 border-white/5 overflow-hidden shadow-2xl relative group-hover:scale-105 transition-transform duration-500 bg-zinc-900">
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setIsChangingAvatar(true)}
              className="absolute bottom-1 right-1 w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform press-scale border-4 border-black/20"
            >
              <Camera size={18} />
            </button>
          </div>

           <div className="space-y-3 w-full">
             <h2 className="text-4xl font-black text-white text-center w-full italic uppercase tracking-tighter">
               {name || 'ANONYMOUS'}
             </h2>
             <div className="flex items-center justify-center mt-4">
               <PremiumStreakCounter
                 currentStreak={streakDataValue?.currentStreak || 0}
                 longestStreak={streakDataValue?.longestStreak || 0}
                 className="mx-4"
               />
             </div>
             <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.25em] text-center">
               {subscription.plan} Member • {location || 'BASE UNDEFINED'}
             </p>
           </div>

          <button
            onClick={() => setActiveSubView('identity')}
            className="mt-8 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            Edit Profile Identity
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <CoachSection />
          <Section title="Hub Controls">
            <ActionItem
              label="Training Plan"
              sublabel="Goals, experience, and limits"
              onClick={() => setActiveSubView('training')}
              icon={Dumbbell}
              value={settings.training.goal}
            />
            <ActionItem
              label="Membership Hub"
              sublabel="Manage plan and billing"
              onClick={() => setActiveSubView('membership')}
              icon={CreditCard}
              value={subscription.plan}
            />
          </Section>

          <Section title="Preferences">
            <ActionItem
              label="System Settings"
              sublabel="Theme, units, and appearance"
              onClick={() => setActiveSubView('system')}
              icon={Smartphone}
            />
            <ActionItem
              label="Communications"
              sublabel="Notifications and reminders"
              onClick={() => setActiveSubView('notifications')}
              icon={Bell}
            />
            <ActionItem
              label="Privacy & Security"
              sublabel="Visibility and data sharing"
              onClick={() => setActiveSubView('privacy')}
              icon={Shield}
            />
            <ActionItem
              label="Integrations"
              sublabel="Apple Health, Calendar"
              onClick={() => setActiveSubView('integrations')}
              icon={Globe}
            />
          </Section>

          <Section title="Support">
            <ActionItem
              label="Help & Resources"
              onClick={() => setActiveSubView('support')}
              icon={MessageSquare}
            />
            <ActionItem
              label="Legal & Privacy"
              onClick={() => setActiveSubView('legal')}
              icon={Lock}
            />
            <ActionItem
              label="Sign Out"
              onClick={() => {
                if (confirm('Are you sure you want to sign out?')) {
                  onLogout?.();
                }
              }}
              icon={LogOut}
              destructive
            />
          </Section>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 py-8 opacity-20 text-center">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Forge Engine v4.2.1-stable<br/>Terminal ID: B0-7A-5A-D2</span>
          </div>
        </div>

      </div>

      {/* SUB-VIEWS */}
      <SettingsSheet 
        isOpen={activeSubView === 'identity'} 
        title="Profile Identity" 
        onClose={() => setActiveSubView('main')}
      >
        <Section title="Personal Data">
          <InputItem label="Display Name" value={name} onChange={setName} placeholder="How should we call you?" />
          <InputItem label="Mission Statement" value={bio} onChange={setBio} placeholder="What is your training ethos?" multiline />
          <InputItem label="Base Location" value={location} onChange={setLocation} placeholder="Where do you train?" />
        </Section>
      </SettingsSheet>

      <SettingsSheet 
        isOpen={activeSubView === 'training'} 
        title="Training Plan" 
        onClose={() => setActiveSubView('main')}
      >
        <Section title="Strategy">
          <SegmentedItem 
            label="Primary Goal"
            icon={Target}
            value={settings.training.goal}
            onChange={(v) => updateNested('training', { goal: v })}
            options={[
              { label: 'Loss', value: 'Fat Loss' },
              { label: 'Strength', value: 'Strength' },
              { label: 'Mass', value: 'Hypertrophy' },
              { label: 'Perf', value: 'Performance' },
            ]}
          />
          <SegmentedItem 
            label="Experience"
            icon={Activity}
            value={settings.training.experienceLevel}
            onChange={(v) => updateNested('training', { experienceLevel: v })}
            options={[
              { label: 'Beg', value: 'Beginner' },
              { label: 'Int', value: 'Intermediate' },
              { label: 'Adv', value: 'Advanced' },
              { label: 'Elite', value: 'Elite' },
            ]}
          />
        </Section>
        <Section title="Logistics">
          <SegmentedItem 
            label="Frequency"
            icon={Calendar}
            value={settings.training.trainingDaysPerWeek}
            onChange={(v) => updateNested('training', { trainingDaysPerWeek: v })}
            options={[
              { label: '3 Days', value: 3 },
              { label: '4 Days', value: 4 },
              { label: '5 Days', value: 5 },
              { label: '6 Days', value: 6 },
            ]}
          />
          <InputItem 
            label="Injuries & Limitations" 
            value={settings.training.injuries} 
            onChange={(v) => updateNested('training', { injuries: v })} 
            placeholder="List any physical constraints..." 
            multiline
          />
        </Section>
      </SettingsSheet>

      <SettingsSheet 
        isOpen={activeSubView === 'system'} 
        title="System Settings" 
        onClose={() => setActiveSubView('main')}
      >
        <Section title="Visuals">
          <SegmentedItem 
            label="Appearance"
            icon={Moon}
            value={settings.theme}
            // theme is a top-level field on settings; update directly to avoid
            // treating 'system' as a nested key that doesn't exist on UserSettings
            onChange={(v) => setSettings(prev => prev ? ({ ...prev, theme: v }) : prev)}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'System', value: 'system' },
            ]}
          />
        </Section>
        <Section title="Measurements">
          <SegmentedItem 
            label="Weight Units"
            icon={Ruler}
            value={settings.units.weight}
            onChange={(v) => updateNested('units', { weight: v })}
            options={[
              { label: 'Kilograms', value: 'kg' },
              { label: 'Pounds', value: 'lb' },
            ]}
          />
          <SegmentedItem 
            label="Distance Units"
            icon={Globe}
            value={settings.units.distance}
            onChange={(v) => updateNested('units', { distance: v })}
            options={[
              { label: 'Kilometers', value: 'km' },
              { label: 'Miles', value: 'mi' },
            ]}
          />
        </Section>
        <Section title="Developer Tools">
          <ActionItem 
            label="Seed Exercises" 
            sublabel="Populate library with real data"
            onClick={async () => {
              try {
                const result = await seedExercises({ clearExisting: true });
                setToast({ message: `Seeded ${result.seededCount} exercises`, type: 'success' });
              } catch (e) {
                setToast({ message: 'Seeding failed', type: 'error' });
              }
            }} 
            icon={RefreshCw} 
          />
        </Section>
      </SettingsSheet>

      <SettingsSheet 
        isOpen={activeSubView === 'notifications'} 
        title="Communications" 
        onClose={() => setActiveSubView('main')}
      >
        <Section title="Alert Settings">
          <ToggleItem 
            label="Workout Reminders" 
            sublabel="Nudges for planned sessions"
            value={settings.notifications.workoutReminders} 
            onChange={(v) => updateNested('notifications', { workoutReminders: v })} 
            icon={Bell}
          />
          {settings.notifications.workoutReminders && (
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Clock size={20} className="text-white/40" />
                <span className="text-[15px] font-bold text-white">Daily Reminder Time</span>
              </div>
              <input 
                type="time" 
                value={settings.notifications.workoutReminderTime}
                onChange={(e) => updateNested('notifications', { workoutReminderTime: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:bg-white/10"
              />
            </div>
          )}
          <ToggleItem 
            label="Coach Messages" 
            sublabel="Real-time check-ins and motivation"
            value={settings.notifications.coachMessages} 
            onChange={(v) => updateNested('notifications', { coachMessages: v })} 
            icon={MessageSquare}
          />
          <ToggleItem 
            label="Meal Alerts" 
            sublabel="Reminders for prep and nutrition"
            value={settings.notifications.mealPrepAlerts} 
            onChange={(v) => updateNested('notifications', { mealPrepAlerts: v })} 
            icon={Utensils}
          />
        </Section>
      </SettingsSheet>

      <SettingsSheet 
        isOpen={activeSubView === 'privacy'} 
        title="Privacy & Data" 
        onClose={() => setActiveSubView('main')}
      >
        <Section title="Visibility">
          <SegmentedItem 
            label="Profile Mode"
            icon={Globe}
            value={settings.privacy.visibility}
            onChange={(v) => updateNested('privacy', { visibility: v })}
            options={[
              { label: 'Private', value: 'Private' },
              { label: 'Members', value: 'Members' },
              { label: 'Public', value: 'Public' },
            ]}
          />
        </Section>
        <Section title="Data Sharing">
          <ToggleItem 
            label="Share Statistics" 
            sublabel="Allow friends to see your wins"
            value={settings.privacy.shareStats} 
            onChange={(v) => updateNested('privacy', { shareStats: v })} 
            icon={Activity}
          />
          <ToggleItem 
            label="Online Status" 
            sublabel="Show when you're training"
            value={settings.privacy.showOnlineStatus} 
            onChange={(v) => updateNested('privacy', { showOnlineStatus: v })} 
            icon={Zap}
          />
        </Section>
        <Section title="Dangerous Waters">
          <ActionItem 
            label="Delete Account" 
            onClick={handleDeleteAccount} 
            icon={Trash2}
            destructive
          />
        </Section>
      </SettingsSheet>

      <SettingsSheet 
        isOpen={activeSubView === 'membership'} 
        title="Membership Hub" 
        onClose={() => setActiveSubView('main')}
      >
        <div className="bg-white/[0.05] rounded-[40px] p-8 border border-white/10 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Current Status</p>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                {subscription.plan} Plan
              </h3>
            </div>
            <div className={`px-4 py-1.5 rounded-full border ${
              subscription.status === 'active' 
                ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {subscription.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/40 font-bold uppercase tracking-wider text-[11px]">
            <CreditCard size={16} />
            <span>Renewal: {new Date(subscription.renewalDate).toLocaleDateString()}</span>
          </div>
        </div>

        <Section title="Plan Management">
          <ActionItem label="Upgrade to Elite Access" onClick={() => window.open('https://body-bridge.fitness/pricing', '_blank')} icon={Zap} badge="NEW" />
          <ActionItem label="Change Payment Method" onClick={() => window.open('https://billing.stripe.com/p/session/test_123', '_blank')} icon={Smartphone} sublabel="Opens Stripe Portal" />
          <ActionItem label="Restore Purchases" onClick={() => {
            setToast({ message: 'Purchases restored successfully.', type: 'success' });
            setTimeout(() => setToast(null), 3000);
          }} icon={RefreshCw} />
        </Section>

        <div className="mt-8">
          {subscription.status === 'active' ? (
            <button 
              onClick={() => confirm('Cancel your subscription?') && setSubscription({ ...subscription, status: 'cancelled' })}
              className="w-full py-6 rounded-[32px] border border-red-500/20 text-red-500 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-500/5 transition-all"
            >
              Terminate Membership
            </button>
          ) : (
            <button 
              onClick={() => setSubscription({ ...subscription, status: 'active' })}
              className="w-full py-6 rounded-[32px] bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] press-scale"
            >
              Reactivate Plan
            </button>
          )}
        </div>
      </SettingsSheet>

      <SettingsSheet 
        isOpen={activeSubView === 'integrations'} 
        title="Integrations" 
        onClose={() => setActiveSubView('main')}
      >
        <Section title="Health Ecosystem">
          <ToggleItem 
            label="Apple Health" 
            sublabel="Sync workouts and vitals"
            value={settings.integrations.appleHealth} 
            onChange={(v) => updateNested('integrations', { appleHealth: v })} 
            icon={Heart}
          />
          <ToggleItem 
            label="Google Fit" 
            sublabel="Connect your Android stats"
            value={settings.integrations.googleFit} 
            onChange={(v) => updateNested('integrations', { googleFit: v })} 
            icon={Activity}
          />
          <ToggleItem 
            label="Calendar Sync" 
            sublabel="Add training to your agenda"
            value={settings.integrations.calendarSync} 
            onChange={(v) => updateNested('integrations', { calendarSync: v })} 
            icon={Calendar}
          />
        </Section>
      </SettingsSheet>

      <SettingsSheet 
        isOpen={activeSubView === 'support'} 
        title="Help & Support" 
        onClose={() => setActiveSubView('main')}
      >
        <Section title="Resources">
          <ActionItem label="Contact Support" onClick={() => window.open('mailto:support@body-bridge.fitness', '_blank')} icon={MessageSquare} />
          <ActionItem label="Knowledge Base" onClick={() => window.open('https://docs.body-bridge.fitness', '_blank')} icon={Info} />
          <ActionItem label="Feature Request" onClick={() => window.open('https://roadmap.body-bridge.fitness', '_blank')} icon={Zap} />
        </Section>
        <div className="p-10 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Forge Fitness Operating System</p>
          <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest leading-loose max-w-xs mx-auto text-center">
            Design and engineering by Antigravity Core. All rights reserved. Terminal encryption active. 
          </p>
        </div>
      </SettingsSheet>

      <SettingsSheet 
        isOpen={activeSubView === 'legal'} 
        title="Legal & Privacy" 
        onClose={() => setActiveSubView('main')}
      >
        <Section title="Documents">
          <ActionItem label="Privacy Policy" onClick={() => window.open('https://body-bridge.fitness/privacy', '_blank')} icon={Shield} />
          <ActionItem label="Terms of Service" onClick={() => window.open('https://body-bridge.fitness/terms', '_blank')} icon={Info} />
          <ActionItem label="Cookie Policy" onClick={() => window.open('https://body-bridge.fitness/cookies', '_blank')} icon={Globe} />
        </Section>
        <div className="p-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Version 4.2.1-stable</p>
        </div>
      </SettingsSheet>

      {/* AVATAR PICKER MODAL */}
      {isChangingAvatar && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-300 flex items-center justify-center p-6 text-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsChangingAvatar(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[56px] p-10 shadow-3xl animate-in zoom-in-95 duration-500">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-center mb-8 italic">Update Profile Photo</h3>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-4 hover:bg-white/10 transition-all group press-scale"
              >
                <Camera size={24} className="text-white/60 group-hover:text-white transition-colors" />
                <span className="text-[13px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Take Photo</span>
              </button>

              <label className="w-full py-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-4 hover:bg-white/10 transition-all group press-scale cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatar(reader.result as string);
                        setIsChangingAvatar(false);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Upload size={24} className="text-white/60 group-hover:text-white transition-colors" />
                <span className="text-[13px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Upload Photo</span>
              </label>

              <button
                onClick={() => setIsChangingAvatar(false)}
                className="w-full py-4 rounded-full bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setAvatar(reader.result as string);
              setIsChangingAvatar(false);
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      {/* Conditional Sticky Save Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-8 z-50 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform ${
        isDirty ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-20 rounded-[40px] font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 transition-all duration-500 press-scale shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 ${
              isSaving 
                ? 'bg-zinc-800 text-white/30 cursor-wait' 
                : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                <span>Saving changes...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-12 duration-700 ease-out">
          <div className={`${toast.type === 'success' ? 'bg-white text-black' : 'bg-red-500 text-white'} px-10 py-4 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center gap-4 border border-white/20`}>
            <div className={`w-5 h-5 rounded-full ${toast.type === 'success' ? 'bg-black' : 'bg-white'} flex items-center justify-center`}>
              {toast.type === 'success' ? <Check size={12} className="text-white" /> : <X size={12} className="text-red-500" />}
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsView;
