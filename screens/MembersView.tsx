import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Trophy, 
  Flame, 
  Dumbbell, 
  MoreHorizontal, 
  MessageCircle, 
  UserPlus,
  Shield,
  Zap,
  Activity,
  X,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Member } from '../types';
import PremiumHeader from '../components/PremiumHeader';
import NotificationBell from '../components/NotificationBell';

interface MembersViewProps {
  onSelectMember?: (member: Member) => void;
}

const MemberStatsOverlay: React.FC<{ userId: any }> = ({ userId }) => {
  const stats = useQuery(api.stats.getUserStats, { userId });

  if (!stats) return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
          <Flame size={20} />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Streak</div>
          <div className="text-xl font-black text-white font-mono">{stats.streakDays}</div>
        </div>
      </div>
      <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Dumbbell size={20} />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Workouts</div>
          <div className="text-xl font-black text-white font-mono">{stats.workoutsCompleted}</div>
        </div>
      </div>
      <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
          <Trophy size={20} />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Volume</div>
          <div className="text-xl font-black text-white font-mono">{(stats.weightLiftedKg / 1000).toFixed(0)}k</div>
        </div>
      </div>
      <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <Shield size={20} />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Level</div>
          <div className="text-xl font-black text-white font-mono">{stats.level}</div>
        </div>
      </div>
    </div>
  );
};

const MembersView: React.FC<MembersViewProps> = ({ onSelectMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Coaches' | 'Online' | 'New'>('All');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const profiles = useQuery(api.profiles.listPublicProfiles, { limit: 200 });

  const allMembers = useMemo((): Member[] => {
    if (!profiles) return [];

    return profiles.map((p: any) => {
      const isCoach = p.authSource === 'trainer';

      return {
        id: p._id,
        name: p.fullName || (isCoach ? 'Coach' : 'Member'),
        avatar:
          p.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        role: isCoach ? 'Coach' : 'Member',
        joinedDate: new Date(p.createdAt).toISOString(),
        lastActive: new Date(p.updatedAt).toISOString(),
        status: 'online',
        bio: p.bio || 'Forging a better version of myself.',
        location: p.location || '',
        stats: { workoutsCompleted: 0, streakDays: 0, weightLiftedKg: 0 },
        goals: [],
        badges: isCoach ? ['Coach'] : ['Member'],
      };
    });
  }, [profiles]);

  const filteredMembers = useMemo(() => {
    return allMembers.filter(member => {
      const name = member.name || '';
      const bio = member.bio || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            bio.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilter === 'Coaches') return member.role === 'Coach';
      if (activeFilter === 'Online') return member.status === 'online' || member.status === 'training';
      if (activeFilter === 'New') {
        const joined = new Date(member.joinedDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joined.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays < 30; // Joined in last 30 days
      }
      return true;
    });
  }, [allMembers, searchQuery, activeFilter]);

  return (
    <div className="min-h-full bg-[#050505] pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <PremiumHeader 
          title="Unit Members"
          subtitle="Operative Directory v2.0"
          actions={
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 animate-pulse">
                <Activity size={18} className="text-blue-500" />
              </div>
              <NotificationBell />
            </div>
          }
        />
      </div>

      <div className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-6 py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="SEARCH OPERATIVES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono text-sm"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              <Filter size={16} className="text-zinc-500" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar -mx-6 px-6">
            {['All', 'Coaches', 'Online', 'New'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeFilter === filter 
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((member) => (
          <div 
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className="group relative bg-zinc-900/30 border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all duration-300 active:scale-[0.98] cursor-pointer overflow-hidden"
          >
            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:via-blue-500/5 transition-all duration-500" />

            <div className="flex items-start gap-4 relative z-10">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-colors">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                {member.status !== 'offline' && (
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#050505] flex items-center justify-center ${
                    member.status === 'training' ? 'bg-orange-500' : 'bg-green-500'
                  }`}>
                    {member.status === 'training' && <Zap size={8} className="text-black fill-current" />}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-bold truncate pr-2 group-hover:text-blue-400 transition-colors">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {member.role === 'Coach' && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase text-blue-400 tracking-wider">
                          Coach
                        </span>
                      )}
                      {member.location && (
                        <span className="flex items-center text-[10px] text-zinc-500 truncate">
                          <MapPin size={10} className="mr-1" />
                          {member.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="text-zinc-600 hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {/* Mini Stats (Simplified for list) */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
                    <div className="text-[8px] text-zinc-500 uppercase tracking-wider">Workouts</div>
                    <div className="text-xs font-mono font-bold text-white italic">---</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
                    <div className="text-[8px] text-zinc-500 uppercase tracking-wider">Streak</div>
                    <div className="text-xs font-mono font-bold text-orange-400">---</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
                    <div className="text-[8px] text-zinc-500 uppercase tracking-wider">Lifted</div>
                    <div className="text-xs font-mono font-bold text-blue-400">---</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Member Detail Overlay */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300"
            onClick={() => setSelectedMember(null)}
          />
          
          {/* Sheet */}
          <div className="relative w-full max-w-md bg-[#09090b] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] overflow-y-auto pointer-events-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
            {/* Drag Handle */}
            <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[#09090b]/90 backdrop-blur-md">
              <div className="w-12 h-1.5 rounded-full bg-zinc-800" />
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white z-20"
            >
              <X size={16} />
            </button>

            <div className="p-6 pt-0">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 p-1">
                    <img src={selectedMember.avatar} className="w-full h-full rounded-2xl object-cover" />
                  </div>
                  <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-[10px] font-black uppercase border-2 border-[#09090b] ${
                    selectedMember.status === 'online' ? 'bg-green-500 text-black' :
                    selectedMember.status === 'training' ? 'bg-orange-500 text-black' :
                    'bg-zinc-700 text-zinc-300'
                  }`}>
                    {selectedMember.status}
                  </div>
                </div>
                
                <h2 className="text-2xl font-black text-white tracking-tight mb-1">{selectedMember.name}</h2>
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                  <span className="font-mono text-[10px]">{selectedMember.id}</span>
                  <span>•</span>
                  <span>Joined {new Date(selectedMember.joinedDate).getFullYear()}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button className="h-10 px-6 bg-white text-black rounded-full text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                    <UserPlus size={16} strokeWidth={2.5} />
                    Connect
                  </button>
                  <button className="h-10 w-10 rounded-full border border-zinc-700 flex items-center justify-center text-white hover:bg-zinc-900 transition-colors">
                    <MessageCircle size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Real Stats Grid */}
              <MemberStatsOverlay userId={selectedMember.id} />

              {/* Bio Section */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Operative Bio</h3>
                <p className="text-zinc-300 leading-relaxed text-sm border-l-2 border-blue-500/50 pl-4 py-1">
                  {selectedMember.bio}
                </p>
              </div>

              {/* Achievements */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-900 border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                    <Trophy size={12} className="text-yellow-500" />
                    Unit Member
                  </div>
                  {selectedMember.role === 'Coach' && (
                    <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-900 to-zinc-900 border border-blue-500/20 text-xs font-bold text-white flex items-center gap-2">
                      <Shield size={12} className="text-blue-400" />
                      Verified Coach
                    </div>
                  )}
                </div>
              </div>
              
              <div className="h-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersView;
