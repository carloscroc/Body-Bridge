// screens/Classroom/components/LiveSchedule.tsx
import React from 'react';
import { Calendar, Clock, User, CheckCircle2 } from 'lucide-react';
import { LiveSession } from '../types';

interface LiveScheduleProps {
  sessions: LiveSession[];
  rsvpSessionIds: Record<string, boolean>;
  onToggleRSVP: (sessionId: string) => void;
}

export const LiveSessions: React.FC<LiveScheduleProps> = ({ 
  sessions, 
  rsvpSessionIds, 
  onToggleRSVP 
}) => {
  return (
    <div className="space-y-6 animate-silk-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Live Sessions</h2>
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          {sessions.length} Upcoming Sessions
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map(session => {
          const isAttending = rsvpSessionIds[session.id];
          const date = new Date(session.startTime);
          
          return (
            <div key={session.id} className="bg-[#1c1c1e] rounded-[24px] p-6 border border-white/5 relative overflow-hidden group">
              {isAttending && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20">
                    <CheckCircle2 size={12} /> Attending
                  </div>
                </div>
              )}

              <div className="flex gap-5">
                {/* Date Block */}
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col items-center justify-center text-center flex-shrink-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-0.5">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-2xl font-black text-white leading-none">
                    {date.getDate()}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    {session.topic}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 truncate pr-20">
                    {session.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-400 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-zinc-600" />
                      {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • {session.durationMin}m
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-zinc-600" />
                      {session.instructor}
                    </div>
                  </div>

                  <button 
                    onClick={() => onToggleRSVP(session.id)}
                    className={`w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      isAttending 
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 border border-transparent' 
                        : 'bg-white text-black shadow-lg hover:bg-zinc-200'
                    }`}
                  >
                    {isAttending ? 'Cancel RSVP' : 'RSVP Now'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
           <div className="p-10 text-center rounded-[24px] border border-white/5 bg-[#1c1c1e]/50">
              <Calendar size={48} className="mx-auto text-zinc-700 mb-4" />
              <h3 className="text-white font-bold mb-2">No upcoming sessions</h3>
              <p className="text-zinc-500 text-sm">Check back later for new clinics and Q&As.</p>
           </div>
        )}
      </div>
    </div>
  );
};
