import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
  Medal,
  Pin,
  MessageSquare,
  Filter,
  Reply,
  Eye,
} from 'lucide-react';

import { CommunityPostTag, CommunityPostAttachment } from '../types';
import NotificationBell from '../components/NotificationBell';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '../services/AuthContext';

// ============== CONSTANTS ==============

type CommunitySubTab = 'Community' | 'Leaderboards' | 'About';
const SUB_TABS: CommunitySubTab[] = ['Community', 'Leaderboards', 'About'];

const FILTER_CATEGORIES = [
  { key: 'All', label: 'All' },
  { key: 'General Discussion', label: 'General' },
  { key: 'PR', label: 'PR' },
  { key: 'Ask', label: 'Ask' },
  { key: 'Wins', label: 'Wins' },
  { key: 'Form Check', label: 'Form Check' },
  { key: 'Meal', label: 'Meal' },
] as const;

const POST_TAGS: Array<{ tag: CommunityPostTag; label: string; icon: React.ReactNode }> = [
  { tag: 'General Discussion', label: 'General', icon: <MessageSquare size={16} /> },
  { tag: 'PR', label: 'PR', icon: <Zap size={16} /> },
  { tag: 'Ask', label: 'Ask', icon: <QuestionIcon size={16} /> },
  { tag: 'Wins', label: 'Wins', icon: <CheckCircle2 size={16} /> },
  { tag: 'Form Check', label: 'Form Check', icon: <Eye size={16} /> },
  { tag: 'Meal', label: 'Meal', icon: <Apple size={16} /> },
];

// ============== HELPERS ==============

const timeAgoShort = (iso: string): string => {
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
  if (diffD < 30) return `${diffD}d`;
  return `${Math.floor(diffD / 30)}mo`;
};

const timeAgoFull = (iso: string): string => {
  const short = timeAgoShort(iso);
  if (short === 'now') return 'just now';
  return `${short} ago`;
};

const getLevelFromPostCount = (count: number): { level: number; label: string; color: string } => {
  if (count >= 50) return { level: 5, label: 'Elite', color: 'bg-purple-500' };
  if (count >= 25) return { level: 4, label: 'Veteran', color: 'bg-blue-500' };
  if (count >= 10) return { level: 3, label: 'Regular', color: 'bg-green-500' };
  if (count >= 3) return { level: 2, label: 'Active', color: 'bg-yellow-500' };
  return { level: 1, label: 'New', color: 'bg-zinc-500' };
};

// ============== PROFILE HELPERS ==============

type MemberProfile = {
  name: string;
  handle: string;
  joined: string;
  levelLabel: string;
  roleLabel?: string;
};

const getProfileForName = (name: string): MemberProfile => {
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

// ============== MAIN VIEW ==============

const CommunityView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState<CommunitySubTab>('Community');
  const [activeProfileName, setActiveProfileName] = useState<string | null>(null);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'Community': return <CommunityTab onOpenProfile={setActiveProfileName} />;
      case 'Leaderboards': return <LeaderboardsTab />;
      case 'About': return <AboutTab />;
    }
  };

  return (
    <div className="min-h-full bg-[#050505] overflow-x-hidden relative">
      <header className="sticky top-0 z-[60] bg-[#050505]/95 backdrop-blur-xl border-b border-white/[0.03] pt-12">
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

// ============== POST COMPOSER MODAL ==============

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
  onPost: (payload: { title?: string; content: string; category: string; tag: CommunityPostTag; attachments: CommunityPostAttachment[] }) => void;
  editingPost?: any | null;
  onSaveEdit?: (payload: { postId: string; content: string; category: string; tag: CommunityPostTag; attachments: CommunityPostAttachment[] }) => void;
  onDelete?: (post: any) => void;
}) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('General Discussion');
  const [attachments, setAttachments] = useState<CommunityPostAttachment[]>([]);
  const isEditing = Boolean(editingPost);

  useEffect(() => {
    if (!isOpen) return;
    if (editingPost) {
      setText(editingPost.content || '');
      setTitle(editingPost.title || '');
      setCategory(editingPost.category || 'General Discussion');
      setAttachments((editingPost.mediaUrls || []).map((url: string, i: number) => ({ id: `${i}`, dataUrl: url, kind: 'image' as const })));
      return;
    }
    setText('');
    setTitle('');
    setCategory('General Discussion');
    setAttachments([]);
  }, [isOpen, editingPost]);

  const canPost = isOpen && text.trim().length > 0;

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const payload = { title: title.trim() || undefined, content: trimmed, category, tag: category as CommunityPostTag, attachments };
    if (isEditing && editingPost && onSaveEdit) {
      onSaveEdit({ postId: editingPost._id, ...payload });
    } else {
      onPost(payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} />
      <div className="relative w-full max-w-md bg-[#1c1c1e] rounded-t-[32px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] p-7 animate-silk-up max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-white font-bold text-[15px]">{isEditing ? 'Edit Post' : 'Create Post'}</h4>
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

        {/* Title */}
        <input
          autoFocus={!isEditing}
          placeholder="Add a title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-white font-bold text-[18px] focus:outline-none placeholder:text-zinc-700 mb-3"
        />

        {/* Content */}
        <textarea
          placeholder="Share today's win..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent text-white font-medium text-[15px] focus:outline-none resize-none placeholder:text-zinc-700 min-h-[100px] leading-relaxed"
        />

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 mt-4 mb-6">
          {POST_TAGS.map(({ tag, label, icon }) => (
            <button
              key={tag}
              onClick={() => setCategory(tag)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                category === tag
                  ? 'bg-white text-black'
                  : 'bg-white/[0.05] text-zinc-500 border border-white/10 hover:bg-white/10'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Media attach button */}
        <div className="flex items-center gap-3 mb-6">
          <button className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
            <Camera size={18} />
          </button>
          {attachments.length > 0 && (
            <span className="text-zinc-500 text-[12px] font-bold">{attachments.length} attachment{attachments.length > 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="border-t border-white/[0.03] pt-4">
          <button onClick={submit} disabled={!canPost} className={`w-full h-14 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl transition-all ${canPost ? 'bg-white text-black' : 'bg-white/10 text-white/30'}`}>
            {isEditing ? 'Save Changes' : 'Post to Community'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== COMMENTS SHEET (Threaded) ==============

const CommentsSheet = ({
  post,
  userComments,
  isOpen,
  onClose,
  onAddComment,
  onToggleLike,
  userId,
}: {
  post: any | null;
  userComments: any[];
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (content: string, parentCommentId?: string) => void;
  onToggleLike: (commentId: string) => void;
  userId?: string;
}) => {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!isOpen) { setText(''); setReplyTo(null); }
  }, [isOpen]);

  if (!isOpen || !post) return null;
  const canSend = text.trim().length > 0;

  // Build threaded structure
  const topLevel = userComments.filter((c: any) => !c.parentCommentId);
  const repliesMap = new Map<string, any[]>();
  userComments.forEach((c: any) => {
    if (c.parentCommentId) {
      const arr = repliesMap.get(c.parentCommentId) || [];
      arr.push(c);
      repliesMap.set(c.parentCommentId, arr);
    }
  });

  const handleSubmit = () => {
    if (!canSend) return;
    onAddComment(text.trim(), replyTo?.id);
    setText('');
    setReplyTo(null);
  };

  const renderComment = (c: any, isReply = false) => (
    <div key={c._id} className={`${isReply ? 'ml-8 border-l-2 border-white/[0.06] pl-4' : ''}`}>
      <div className="flex gap-3 py-2">
        <img
          src={c.authorAvatar || `https://i.pravatar.cc/100?u=${c.authorName}`}
          className={`rounded-full border border-white/10 ${isReply ? 'w-6 h-6' : 'w-8 h-8'}`}
          alt=""
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-white ${isReply ? 'text-[12px]' : 'text-[13px]'}`}>{c.authorName}</span>
            <span className="text-white/30 text-[10px]">{timeAgoFull(new Date(c.createdAt).toISOString())}</span>
          </div>
          <div className="text-zinc-400 text-[13px] mt-0.5 leading-relaxed">{c.content}</div>
          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={() => onToggleLike(c._id)}
              className="flex items-center gap-1 text-zinc-600 hover:text-white transition-colors"
            >
              <Heart size={12} />
              {c.likeCount > 0 && <span className="text-[10px] font-bold">{c.likeCount}</span>}
            </button>
            {!isReply && (
              <button
                onClick={() => setReplyTo({ id: c._id, name: c.authorName })}
                className="flex items-center gap-1 text-zinc-600 hover:text-white transition-colors"
              >
                <Reply size={12} />
                <span className="text-[10px] font-bold">Reply</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Nested replies */}
      {repliesMap.get(c._id)?.map((r: any) => renderComment(r, true))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} />
      <div className="relative w-full max-w-md rounded-t-[34px] sm:rounded-[34px] border border-white/[0.08] bg-[#111112] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] overflow-hidden animate-silk-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-black text-white">Comments</h2>
              <p className="text-zinc-600 text-[11px] font-bold mt-0.5">{post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
          {userComments.length === 0 ? (
            <div className="text-center text-white/35 py-12 italic text-[14px]">Be the first to comment.</div>
          ) : (
            <div className="space-y-1">
              {topLevel.map((c: any) => renderComment(c))}
            </div>
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="px-6 pt-3 flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-bold">
              Replying to <span className="text-white">{replyTo.name}</span>
            </span>
            <button onClick={() => setReplyTo(null)} className="text-zinc-600 hover:text-white">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-5 border-t border-white/[0.06] shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Write a comment…'}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none text-white font-bold text-[13px] resize-none"
              rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            />
            <button
              disabled={!canSend}
              onClick={handleSubmit}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                canSend ? 'bg-white text-black' : 'bg-white/5 text-white/25'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== PROFILE SHEET ==============

const ProfileSheet = ({ profileName, isOpen, onClose }: { profileName: string | null; isOpen: boolean; onClose: () => void }) => {
  const profile = profileName ? getProfileForName(profileName) : null;
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center px-4 pb-[5vh]">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} />
      <div className="relative w-full max-w-md rounded-[34px] border border-white/[0.08] bg-[#111112] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] p-10 text-center animate-silk-up">
        <img src={`https://i.pravatar.cc/200?u=${profile.handle}`} className="w-24 h-24 rounded-full border-4 border-white/10 mx-auto mb-6 shadow-2xl" alt={profile.name} />
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{profile.name}</h3>
        <p className="text-zinc-500 font-bold text-sm mb-8">{profile.handle}</p>
        <button onClick={onClose} className="h-14 w-full bg-white/5 text-white/60 font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 press-scale">Close Profile</button>
      </div>
    </div>
  );
};

// ============== COMMUNITY TAB (Main Feed) ==============

const CommunityTab = ({ onOpenProfile }: { onOpenProfile: (name: string) => void }) => {
  const { user } = useAuth();

  // State
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Queries
  const postsData = useQuery(
    api.social.getPostsByCategory,
    { category: activeCategory, paginationOpts: { numItems: 20, cursor: null } }
  );

  const activePost = activeCommentsPostId
    ? (postsData?.page || []).find((p: any) => p._id === activeCommentsPostId) ?? null
    : null;

  const activePostComments = useQuery(
    api.social.getCommentsByPost,
    activeCommentsPostId
      ? { postId: activeCommentsPostId as any, paginationOpts: { numItems: 50, cursor: null } }
      : "skip"
  );

  // Mutations
  const createPostMutation = useMutation(api.social.createPost);
  const toggleLikeMutation = useMutation(api.social.toggleLike);
  const createCommentMutation = useMutation(api.social.createComment);
  const deletePostMutation = useMutation(api.social.deletePost);
  const pinPostMutation = useMutation(api.social.pinPost);

  const posts = useMemo(() => {
    let all = postsData?.page || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      all = all.filter((p: any) =>
        p.content?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q)
      );
    }
    return all;
  }, [postsData, searchQuery]);

  // Handlers
  const handleCreatePost = async ({ title, content, category, attachments }: { title?: string; content: string; category: string; tag: CommunityPostTag; attachments: CommunityPostAttachment[] }) => {
    if (!user) return;
    await createPostMutation({
      authorId: user.profileId as any,
      authorName: user.fullName || 'Member',
      authorAvatar: user.avatarUrl,
      authorRole: user.authSource as any,
      title,
      content,
      category,
      mediaUrls: attachments.map(a => a.dataUrl),
    });
  };

  const handleDeletePost = async (post: any) => {
    await deletePostMutation({ postId: post._id });
    setEditingPost(null);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    await toggleLikeMutation({ postId: postId as any, userId: user.profileId as any });
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) return;
    await toggleLikeMutation({ commentId: commentId as any, userId: user.profileId as any });
  };

  const addComment = async (content: string, parentCommentId?: string) => {
    if (!user || !activeCommentsPostId) return;
    await createCommentMutation({
      postId: activeCommentsPostId as any,
      authorId: user.profileId as any,
      authorName: user.fullName || 'Member',
      authorAvatar: user.avatarUrl,
      authorRole: user.authSource as any,
      content,
      parentCommentId: parentCommentId as any,
    });
  };

  const handleShare = async (post: any) => {
    const text = post.title
      ? `${post.title}\n\n${post.content}`
      : post.content;
    const shareData = {
      title: 'Forge Community Post',
      text: text.slice(0, 200),
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(text.slice(0, 200));
      }
    } catch {
      // User cancelled or clipboard denied
    }
  };

  // Freshness helper
  const getFreshnessText = (post: any): string | null => {
    if (!post.lastCommentAt) return null;
    const diff = Date.now() - post.lastCommentAt;
    if (diff > 24 * 60 * 60 * 1000) return null; // older than 24h
    return `New comment ${timeAgoShort(new Date(post.lastCommentAt).toISOString())} ago`;
  };

  return (
    <div className="space-y-0 pt-4">
      {/* Composer Launcher Card */}
      <div className="px-5 mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#1c1c1e] rounded-[20px] h-[54px] px-5 flex items-center gap-4 border border-white/[0.05] transition-all hover:bg-white/[0.04]"
        >
          <img
            src={user?.avatarUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100"}
            className="w-9 h-9 rounded-full border border-white/10"
            alt=""
          />
          <span className="text-zinc-600 font-medium text-[14px]">Write something...</span>
        </button>
      </div>

      {/* Search bar (toggleable) */}
      {showSearch && (
        <div className="px-5 mb-3 animate-silk-up">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full bg-[#1c1c1e] rounded-full h-11 pl-11 pr-10 text-white text-[14px] font-medium outline-none border border-white/[0.05] placeholder:text-zinc-700"
            />
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Filter Chips Row */}
      <div className="flex items-center gap-2 px-5 mb-5 overflow-x-auto custom-scrollbar scrollbar-none">
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.key
                ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                : 'bg-white/[0.03] text-zinc-500 border border-white/10 hover:bg-white/[0.06]'
            }`}
          >
            {cat.label}
          </button>
        ))}
        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-all ${
            showSearch
              ? 'bg-white text-black border-white'
              : 'bg-white/[0.03] text-zinc-500 border-white/10 hover:bg-white/[0.06]'
          }`}
        >
          <Search size={14} />
        </button>
      </div>

      {/* Feed */}
      <div className="px-5 space-y-0">
        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-600 font-bold text-[14px]">No posts yet</p>
            <p className="text-zinc-700 text-[12px] mt-1">Be the first to share something!</p>
          </div>
        )}

        {posts.map((post: any, index: number) => {
          const freshness = getFreshnessText(post);
          const isOwn = user && post.authorId === user.profileId;
          const categoryTag = post.category || 'General';
          const categoryIcon = POST_TAGS.find(t => t.tag === categoryTag)?.icon;

          return (
            <div key={post._id}>
              {/* Thin warm divider */}
              {index > 0 && <div className="h-px bg-amber-900/20 mx-2 my-1" />}

              <div className="py-4">
                {/* 3-lane layout */}
                <div className="flex gap-3">
                  {/* Left gutter - activity dot */}
                  <div className="flex flex-col items-center pt-2">
                    <div className={`w-2 h-2 rounded-full ${post.isPinned ? 'bg-amber-400' : freshness ? 'bg-blue-400' : 'bg-transparent'}`} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Author header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onOpenProfile(post.authorName)}
                          className="w-9 h-9 rounded-full border border-white/10 shrink-0 overflow-hidden"
                          aria-label={`View ${post.authorName}'s profile`}
                        >
                          <img
                            src={post.authorAvatar || `https://i.pravatar.cc/100?u=${post.authorName}`}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button type="button" className="text-[14px] font-bold text-white truncate bg-transparent border-0 p-0 cursor-pointer" onClick={() => onOpenProfile(post.authorName)}>
                              {post.authorName}
                            </button>
                            {/* Level badge */}
                            <span className="w-5 h-5 rounded-full bg-blue-500/80 flex items-center justify-center text-[8px] font-black text-white shrink-0">
                              {post.authorRole === 'trainer' ? 'C' : '1'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-bold">
                            <span>{timeAgoShort(new Date(post.createdAt).toISOString())}</span>
                            <span className="text-zinc-800">·</span>
                            <span className="flex items-center gap-0.5">{categoryIcon}{categoryTag}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pinned indicator + overflow */}
                      <div className="flex items-center gap-2 shrink-0">
                        {post.isPinned && (
                          <span className="flex items-center gap-1 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                            <Pin size={12} /> Pinned
                          </span>
                        )}
                        {isOwn && (
                          <button
                            onClick={() => { setEditingPost(post); setIsModalOpen(true); }}
                            className="text-zinc-700 hover:text-white transition-colors p-1"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post title */}
                    {post.title && (
                      <h3 className="text-[15px] font-bold text-white mt-3 leading-snug">
                        {post.title}
                      </h3>
                    )}

                    {/* Post body */}
                    <p className="text-[13px] text-zinc-400 mt-1.5 leading-relaxed line-clamp-3">
                      {post.content}
                    </p>

                    {/* Action bar */}
                    <div className="flex items-center gap-6 mt-3">
                      <button
                        onClick={() => toggleLike(post._id)}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        <Heart size={15} />
                        {post.likeCount > 0 && <span>{post.likeCount}</span>}
                      </button>
                      <button
                        onClick={() => setActiveCommentsPostId(post._id)}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        <MessageCircle size={15} />
                        {post.commentCount > 0 && <span>{post.commentCount}</span>}
                      </button>
                      <button
                        onClick={() => handleShare(post)}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        <Share2 size={15} />
                      </button>
                    </div>

                    {/* Freshness indicator */}
                    {freshness && (
                      <p className="text-[11px] font-bold text-blue-400 mt-2">{freshness}</p>
                    )}
                  </div>

                  {/* Right media thumbnail */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 mt-1 relative">
                      <img
                        src={post.mediaUrls[0]}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                      {/* Play overlay for video */}
                      {post.mediaUrls[0]?.includes('video') && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play size={20} fill="white" className="text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More indicator */}
      {postsData && !postsData.isDone && posts.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Modals */}
      <PostComposerModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPost(null); }}
        onPost={handleCreatePost}
        editingPost={editingPost}
        onSaveEdit={() => { setEditingPost(null); }}
        onDelete={handleDeletePost}
      />

      <CommentsSheet
        post={activePost}
        userComments={activePostComments?.page || []}
        isOpen={Boolean(activeCommentsPostId)}
        onClose={() => setActiveCommentsPostId(null)}
        onAddComment={addComment}
        onToggleLike={toggleCommentLike}
        userId={user?.profileId as any}
      />
    </div>
  );
};

// ============== LEADERBOARDS TAB ==============

const LeaderboardsTab = () => {
  const progress = { level: 1 };
  const unlockedBadges: any[] = [];

  return (
    <div className="p-6 pt-12 pb-32 flex flex-col items-center">
      <div className="relative mb-6">
        <div className="w-36 h-36 rounded-full border-[6px] border-zinc-900 p-1">
          <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200" className="w-full h-full rounded-full object-cover shadow-2xl" alt="" />
        </div>
        <div className="absolute bottom-2 right-2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-black border-[4px] border-[#050505] text-white">
          {progress.level}
        </div>
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

// ============== ABOUT TAB ==============

const AboutTab = () => (
  <div className="p-10 pt-20 text-center">
    <div className="w-20 h-20 rounded-2xl bg-white text-black flex items-center justify-center font-black text-4xl mx-auto mb-10 shadow-2xl rotate-3">F</div>
    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Forge Elite</h2>
    <p className="text-zinc-500 leading-relaxed max-w-xs mx-auto">Proprietary methodologies for power and hypertrophy. Designed for those who refuse to settle for average.</p>
  </div>
);

export default CommunityView;
