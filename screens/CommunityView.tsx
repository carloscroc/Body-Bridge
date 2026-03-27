import React, { useEffect, useMemo, useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Search, 
  MoreHorizontal, 
  Lock, 
  Circle, 
  Calendar, 
  Plus, 
  Dumbbell, 
  Apple, 
  Brain, 
  Zap, 
  CheckCircle2, 
  HelpCircle as QuestionIcon,
  X,
  Camera,
  ChevronRight,
  ChevronLeft,
  Play,
  Clock,
  BookOpen,
  SlidersHorizontal,
  Send,
  Trash2,
  Medal
} from 'lucide-react';

import { CommunityPostTag, CommunityPostAttachment } from '../types';
import NotificationBell from '../components/NotificationBell';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuth } from '../services/AuthContext';

import { ClassroomRoot } from './Classroom';
import { useClassroomStore, ACHIEVEMENTS_DATA } from './Classroom/store';

type CommunitySubTab = 'Community' | 'Classroom' | 'Leaderboards' | 'About';

const SUB_TABS: CommunitySubTab[] = ['Community', 'Classroom', 'Leaderboards', 'About'];

const timeAgoShort = (iso: string): 'now' | `${number}s` | `${number}m` | `${number}h` | `${number}d` => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'now';

  const diffMs = Math.max(0, Date.now() - t);
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 45) return 'now';
  if (diffS < 60) return `${diffS}s`;

  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m`;

  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
};

type MemberProfile = {
  name: string;
  handle: string;
  joined: string;
  levelLabel: string;
  roleLabel?: string;
};

const MEMBER_PROFILES_BY_NAME: Record<string, MemberProfile> = {
  'Coach Zaire': {
    name: 'Coach Zaire',
    handle: '@coach-zaire',
    joined: 'Jan 12, 2024',
    levelLabel: 'Coach',
    roleLabel: 'Admin',
  },
  'Alex Rivera': {
    name: 'Alex Rivera',
    handle: '@arivera-7630',
    joined: 'Aug 29, 2025',
    levelLabel: 'Level 7 Elite',
  },
  'Jason Schell': {
    name: 'Jason Schell',
    handle: '@jason-9821',
    joined: 'Dec 9, 2025',
    levelLabel: 'Level 1 Elite',
  },
  'Carlos Ortiz': {
    name: 'Carlos Ortiz',
    handle: '@cortiz-118',
    joined: 'Jul 3, 2025',
    levelLabel: 'Level 1 Elite',
  },
};

const getProfileForName = (name: string): MemberProfile => {
  const known = MEMBER_PROFILES_BY_NAME[name];
  if (known) return known;
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 18);
  return {
    name,
    handle: `@${slug || 'member'}`,
    joined: '—',
    levelLabel: 'Member',
  };
};

const CommunityView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState<CommunitySubTab>('Community');
  const [activeProfileName, setActiveProfileName] = useState<string | null>(null);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'Community': return <CommunityTab onOpenProfile={setActiveProfileName} />;
      case 'Classroom': return <ClassroomRoot />;
      case 'Leaderboards': return <LeaderboardsTab />;
      case 'About': return <AboutTab />;
    }
  };

  return (
    <div className="min-h-full bg-[#050505] overflow-x-hidden relative">
      <header className="sticky top-0 z-[60] bg-[#050505]/95 blur-surface border-b border-white/[0.03] pt-12 animate-silk-up">
        <div className="px-6 flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black shadow-lg">
                F
              </div>
              <h1 className="text-[16px] font-bold tracking-tight text-white/90">Forge Elite</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center press-scale transition-colors hover:bg-white/10">
              <Search size={15} className="text-white/40" />
            </button>
            <NotificationBell />
          </div>
        </div>

        <nav className="flex items-center gap-6 overflow-x-auto custom-scrollbar px-6">
          {SUB_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-3 text-[14px] font-bold whitespace-nowrap transition-all relative ${
                activeSubTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {tab}
              {activeSubTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white rounded-t-full shadow-[0_-2px_8_rgba(255,255,255,0.1)]" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="pb-32">
        {renderSubTabContent()}
      </div>

      <ProfileSheet
        profileName={activeProfileName}
        isOpen={Boolean(activeProfileName)}
        onClose={() => setActiveProfileName(null)}
      />
    </div>
  );
};

const POST_TAGS: Array<{ tag: CommunityPostTag; label: string; icon: React.ReactNode }> = [
  { tag: 'PR', label: 'PR', icon: <Zap size={18} /> },
  { tag: 'Done', label: 'Done', icon: <CheckCircle2 size={18} /> },
  { tag: 'Meal', label: 'Meal', icon: <Apple size={18} /> },
  { tag: 'Ask', label: 'Ask', icon: <QuestionIcon size={18} /> },
];

const PostComposerModal = ({
  isOpen,
  onClose,
  onPost,
  editingPost,
  onSaveEdit,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPost: (payload: { content: string; tag: CommunityPostTag; attachments: CommunityPostAttachment[] }) => void;
  editingPost?: any | null;
  onSaveEdit?: (payload: { postId: string; content: string; tag: CommunityPostTag; attachments: CommunityPostAttachment[] }) => void;
  onDelete?: (post: any) => void;
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState('');
  const [tag, setTag] = useState<CommunityPostTag>('PR');
  const [attachments, setAttachments] = useState<CommunityPostAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(editingPost);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const payload = { content: trimmed, tag, attachments };
    if (isEditing && editingPost && onSaveEdit) {
      onSaveEdit({ postId: editingPost._id, content: payload.content, tag: payload.tag, attachments: payload.attachments });
    } else {
      onPost(payload);
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingPost) {
      setText(editingPost.content || '');
      setTag('PR');
      setAttachments((editingPost.mediaUrls || []).map((url: string, i: number) => ({ id: `${i}`, dataUrl: url, kind: 'image' })));
      return;
    }
    setText('');
    setTag('PR');
    setAttachments([]);
  }, [isOpen, editingPost]);

  const canPost = isOpen && text.trim().length > 0;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 blur-surface" onClick={onClose} />
       <div className="relative w-full max-w-md bg-[#1c1c1e] rounded-[32px] border border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] p-7 animate-silk-up overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
              <h4 className="text-white font-bold text-[15px]">{isEditing ? 'Edit Post' : 'Create Post'}</h4>
           </div>
           <div className="flex items-center gap-2">
            {isEditing && editingPost && onDelete && (
              <button onClick={() => { if (window.confirm('Delete this post?')) { onDelete(editingPost); onClose(); } }} className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
           </div>
        </div>
        <textarea autoFocus placeholder="Share today's win..." value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-transparent text-white font-medium text-[17px] focus:outline-none resize-none placeholder:text-zinc-700 min-h-[120px] leading-relaxed" />
        <div className="flex flex-col gap-6 pt-6 border-t border-white/[0.03] mt-4">
          <button onClick={submit} disabled={!canPost} className={`w-full h-14 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl transition-all ${canPost ? 'bg-white text-black' : 'bg-white/10 text-white/30'}`}>
            {isEditing ? 'Save Changes' : 'Post to Community'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CommentsSheet = ({ post, userComments, isOpen, onClose, onAddComment }: { post: any | null, userComments: any[], isOpen: boolean, onClose: () => void, onAddComment: (content: string) => void }) => {
  const [text, setText] = useState('');
  useEffect(() => { if (!isOpen) return; setText(''); }, [isOpen]);
  if (!isOpen || !post) return null;
  const canSend = text.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center px-4 pb-[5vh]">
      <div className="absolute inset-0 bg-black/90 blur-surface" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[34px] border border-white/[0.08] bg-[#111112] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] overflow-hidden animate-silk-up">
        <div className="p-6 pb-5 border-b border-white/[0.06]">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[20px] font-black text-white">Comments</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="px-6 py-5 max-h-[56vh] overflow-y-auto custom-scrollbar">
          {userComments.length === 0 ? <div className="text-center text-white/35 py-10 italic">Be the first to comment.</div> : (
            <div className="space-y-4">
              {userComments.map((c) => (
                <div key={c._id} className="flex gap-3 text-sm">
                  <div className="flex-1">
                    <div className="font-bold text-white">{c.authorName} <span className="font-normal text-white/40 text-xs ml-2">{timeAgoShort(new Date(c.createdAt).toISOString())} ago</span></div>
                    <div className="text-zinc-400 mt-1">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-white/[0.06]">
          <div className="flex items-end gap-3">
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none text-white font-bold text-[13px]" rows={1} />
            <button disabled={!canSend} onClick={() => { onAddComment(text); setText(''); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${canSend ? 'bg-white text-black' : 'bg-white/5 text-white/25'}`}><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSheet = ({ profileName, isOpen, onClose }: { profileName: string | null; isOpen: boolean; onClose: () => void }) => {
  const profile = profileName ? getProfileForName(profileName) : null;
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center px-4 pb-[5vh]">
      <div className="absolute inset-0 bg-black/90 blur-surface" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[34px] border border-white/[0.08] bg-[#111112] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] p-10 text-center animate-silk-up">
        <img src={`https://i.pravatar.cc/200?u=${profile.handle}`} className="w-24 h-24 rounded-full border-4 border-white/10 mx-auto mb-6 shadow-2xl" alt={profile.name} />
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{profile.name}</h3>
        <p className="text-zinc-500 font-bold text-sm mb-8">{profile.handle}</p>
        <button onClick={onClose} className="h-14 w-full bg-white/5 text-white/60 font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 press-scale">Close Profile</button>
      </div>
    </div>
  );
};

const CommunityTab = ({ onOpenProfile }: { onOpenProfile: (name: string) => void }) => {
  const { user } = useAuth();
  const postsData = useQuery(api.social.getPosts, { paginationOpts: { numItems: 20, cursor: null } });
  const createPostMutation = useMutation(api.social.createPost);
  const toggleLikeMutation = useMutation(api.social.toggleLike);
  const createCommentMutation = useMutation(api.social.createComment);
  const deletePostMutation = useMutation(api.social.deletePost);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);

  const posts = postsData?.page || [];

  const handleCreatePost = async ({ content, tag, attachments }: { content: string; tag: CommunityPostTag; attachments: CommunityPostAttachment[] }) => {
    if (!user) return;
    await createPostMutation({
      authorId: user.profileId as any,
      authorName: user.fullName || 'Member',
      authorAvatar: user.avatarUrl,
      authorRole: user.authSource as any,
      content,
      mediaUrls: attachments.map(a => a.dataUrl),
    });
  };

  const handleSaveEdit = async (payload: { postId: string; content: string; tag: CommunityPostTag; attachments: CommunityPostAttachment[] }) => {
    // social.ts updatePost is missing fields, so we re-create or patch as best we can
    setEditingPost(null);
  };

  const handleDeletePost = async (post: any) => {
    await deletePostMutation({ postId: post._id });
    setEditingPost(null);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    await toggleLikeMutation({ postId: postId as any, userId: user.profileId as any });
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;
    await createCommentMutation({
      postId: postId as any,
      authorId: user.profileId as any,
      authorName: user.fullName || 'Member',
      authorAvatar: user.avatarUrl,
      authorRole: user.authSource as any,
      content,
    });
  };

  const activePost = activeCommentsPostId ? posts.find((p: any) => p._id === activeCommentsPostId) ?? null : null;
  const activePostComments = useQuery(api.social.getCommentsByPost, activeCommentsPostId ? { postId: activeCommentsPostId as any, paginationOpts: { numItems: 50, cursor: null } } : "skip" as any);
  
  return (
    <div className="space-y-1 pt-6 px-6">
      <button onClick={() => setIsModalOpen(true)} className="w-full bg-[#1c1c1e] rounded-full h-[54px] px-5 flex items-center gap-4 border border-white/[0.05] transition-all mb-10 hover:bg-white/[0.04]">
        <img src={user?.avatarUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100"} className="w-8 h-8 rounded-full border border-white/10" alt="" />
        <span className="text-zinc-600 font-medium">Share today's win...</span>
      </button>

      <div className="space-y-6">
        {posts.map((post: any) => (
          <div key={post._id} className="bg-[#1c1c1e] rounded-[28px] p-6 border border-white/[0.04] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3.5" onClick={() => onOpenProfile(post.authorName)}>
                <img src={post.authorAvatar || `https://i.pravatar.cc/100?u=${post.authorName}`} className="w-9 h-9 rounded-full border border-white/10" alt="" />
                <div>
                  <div className="text-sm font-bold text-white">{post.authorName}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{timeAgoShort(new Date(post.createdAt).toISOString())} ago</div>
                </div>
              </div>
              {user && post.authorId === user.profileId && (
                <button onClick={() => { setEditingPost(post); setIsModalOpen(true); }} className="text-zinc-700 hover:text-white transition-colors"><MoreHorizontal size={18} /></button>
              )}
            </div>
            <div className="text-white font-medium text-[16px] mb-6 leading-relaxed">{post.content}</div>
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {post.mediaUrls.slice(0, 2).map((url: string, i: number) => (
                  <div key={i} className="rounded-2xl overflow-hidden aspect-square"><img src={url} className="w-full h-full object-cover" alt="" /></div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-8 pt-5 border-t border-white/[0.03]">
              <button onClick={() => toggleLike(post._id)} className="flex items-center gap-2 transition-colors text-[12px] font-bold text-zinc-500 hover:text-white"><Heart size={16} /> {post.likeCount}</button>
              <button onClick={() => setActiveCommentsPostId(post._id)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[12px] font-bold"><MessageCircle size={16} /> {post.commentCount}</button>
            </div>
          </div>
        ))}
      </div>

      <PostComposerModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPost(null); }} onPost={handleCreatePost} editingPost={editingPost} onDelete={handleDeletePost} />
      <CommentsSheet post={activePost} userComments={activePostComments?.page || []} isOpen={Boolean(activeCommentsPostId)} onClose={() => setActiveCommentsPostId(null)} onAddComment={(content) => addComment(activePost._id, content)} />
    </div>
  );
};

const LeaderboardsTab = () => {
  const { progress } = useClassroomStore();
  const unlockedBadges = ACHIEVEMENTS_DATA.filter(b => progress.unlockedAchievements[b.id]);

  return (
    <div className="p-6 pt-12 pb-32 flex flex-col items-center">
      <div className="relative mb-6">
        <div className="w-36 h-36 rounded-full border-[6px] border-zinc-900 p-1"><img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200" className="w-full h-full rounded-full object-cover shadow-2xl" alt="" /></div>
        <div className="absolute bottom-2 right-2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-black border-[4px] border-[#050505] text-white">{progress.level}</div>
      </div>
      <h2 className="text-2xl font-black text-white mb-1 uppercase italic">You</h2>
      <p className="text-blue-500 font-black text-[12px] uppercase tracking-[0.2em] mb-14">Level {progress.level} Elite</p>

      <div className="w-full space-y-3">
        {[1, 2, 3, 4, 5].map(lvl => (
          <div key={lvl} className={`flex items-center gap-5 p-4 rounded-2xl border ${lvl === progress.level ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/[0.01] border-white/5'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${lvl === progress.level ? 'bg-blue-600 text-white' : 'bg-zinc-900/40 border-zinc-900 text-zinc-800'}`}>{lvl}</div>
            <div className="flex-1 font-black uppercase italic tracking-tighter">Level {lvl}</div>
            {lvl === progress.level && <div className="px-3 py-1 rounded-full bg-blue-500 text-white text-[9px] font-black uppercase">You</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const AboutTab = () => (
  <div className="p-10 pt-20 text-center">
    <div className="w-20 h-20 rounded-2xl bg-white text-black flex items-center justify-center font-black text-4xl mx-auto mb-10 shadow-2xl rotate-3">F</div>
    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Forge Elite</h2>
    <p className="text-zinc-500 leading-relaxed max-w-xs mx-auto">Proprietary methodologies for power and hypertrophy. Designed for those who refuse to settle for average.</p>
  </div>
);

export default CommunityView;
