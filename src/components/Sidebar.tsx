import React, { useState } from 'react';
import { ChatSession, UserUsage } from '../types';
import { ASSISTANT_MODES } from './AssistantModeSelector';
import { CipherLogo } from './CipherLogo';
import { useTheme } from '../utils/themeConfig';
import {
  MessageSquare,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Bookmark,
  Calculator,
  Search,
  Zap,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  LogIn,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  isGuest: boolean;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onPinSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenReviewCenter: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenAuth: () => void;
  usage: UserUsage;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenQuiz?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  isGuest,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onPinSession,
  onRenameSession,
  onOpenReviewCenter,
  onOpenSubscriptionModal,
  onOpenAuth,
  usage,
  isOpenMobile,
  onCloseMobile,
  onOpenQuiz,
}) => {
  const { themeConfig } = useTheme();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedSessions = filtered.filter((s) => s.isPinned);
  const recentSessions = filtered.filter((s) => !s.isPinned);

  const startRename = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return 'Ready';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getModeIcon = (modeId: string) => {
    const found = ASSISTANT_MODES.find((m) => m.id === modeId);
    if (!found) return null;
    const Icon = found.icon;
    return <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 ${themeConfig.classes.bgSidebar} border-r ${themeConfig.classes.border} flex flex-col justify-between transition-colors duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & New Session Button */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
              >
                <CipherLogo className={`w-6 h-6 ${themeConfig.classes.accentText}`} />
              </div>
              <div className="flex flex-col justify-center select-none">
                <span className="font-black text-base tracking-tight leading-none">
                  Cipher
                </span>
                <span className={`text-[10px] font-bold tracking-wider uppercase leading-none mt-1 ${themeConfig.classes.accentText}`}>
                  Decode the numbers
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>

          <button
            onClick={() => {
              onNewSession();
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${themeConfig.classes.accentBtn}`}
          >
            <Plus className="w-4 h-4" />
            New Math Problem
          </button>

          {/* AI Practice Quiz Button */}
          {onOpenQuiz && (
            <button
              onClick={() => {
                onOpenQuiz();
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border shadow-xs ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:opacity-90`}
            >
              <GraduationCap className={`w-4 h-4 ${themeConfig.classes.accentText}`} />
              <span>AI Quiz</span>
            </button>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 opacity-50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search calculations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full border rounded-xl py-1.5 pl-8 pr-3 text-xs placeholder-slate-500 focus:outline-none ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}
            />
          </div>
        </div>

        {/* Sessions list OR Guest Mode Notice */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4 text-xs scrollbar-thin">
          {/* Guest Mode Callout in Sidebar */}
          {isGuest && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    Guest Mode Active
                  </div>
                  <div className="text-[11px] text-amber-200/80 leading-snug mt-0.5">
                    Conversations are <span className="font-semibold text-amber-100 underline">not saved</span> upon closing or refreshing.
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onOpenAuth();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with Gmail to Save
              </button>
            </div>
          )}

          {/* Pinned Sessions */}
          {pinnedSessions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Pin className="w-3 h-3 text-sky-400" />
                Pinned Calculations
              </div>
              <div className="space-y-1 mt-1">
                {pinnedSessions.map((s) => renderSessionItem(s))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isGuest ? 'Current Session' : `Saved Calculations (${recentSessions.length})`}
            </div>
            <div className="space-y-1 mt-1">
              {recentSessions.length === 0 ? (
                <div className="px-2 py-3 text-slate-600 text-center text-[11px]">
                  {isGuest ? 'No active guest calculations yet' : 'No sessions match your search'}
                </div>
              ) : (
                recentSessions.map((s) => renderSessionItem(s))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Quick Tools & 15/15 Usage Limit Card */}
        <div className={`p-3 border-t space-y-2 ${themeConfig.classes.border}`}>
          {/* 15 Free Uses Every 24 Hours Indicator Box */}
          <div className={`p-3 rounded-2xl border space-y-2 ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                24h Free Uses
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  usage.isPro
                    ? 'text-emerald-400'
                    : usage.remainingUses === 0
                    ? 'text-rose-400'
                    : themeConfig.classes.accentText
                }`}
              >
                {usage.isPro ? 'Unlimited (PRO)' : `${usage.remainingUses} / 15 left`}
              </span>
            </div>

            {/* Progress Bar for the 15 free uses */}
            {!usage.isPro && (
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    usage.remainingUses <= 3
                      ? 'bg-rose-500'
                      : usage.remainingUses <= 7
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, (usage.remainingUses / 15) * 100))}%`,
                  }}
                />
              </div>
            )}

            {!usage.isPro && (
              <div className="flex items-center justify-between text-[10px] opacity-60 pt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Cycle Reset:
                </span>
                <span className="font-mono">
                  {formatCountdown(usage.resetInMs)}
                </span>
              </div>
            )}

            <button
              onClick={() => {
                onOpenSubscriptionModal();
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${themeConfig.classes.accentBadge}`}
            >
              <Sparkles className="w-3 h-3" />
              {usage.isPro ? 'Manage Pro Plan' : 'Get Unlimited Uses (Pro)'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  function renderSessionItem(s: ChatSession) {
    const isActive = s.id === activeSessionId;
    return (
      <div
        key={s.id}
        onClick={() => {
          onSelectSession(s.id);
          if (isOpenMobile) onCloseMobile();
        }}
        className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
          isActive
            ? `${themeConfig.classes.accentBadge} border font-bold shadow-xs`
            : `opacity-75 hover:opacity-100 hover:${themeConfig.classes.bgCardHover} border border-transparent`
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          {getModeIcon(s.assistantMode)}
          {editingId === s.id ? (
            <input
              type="text"
              value={editTitle}
              autoFocus
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => saveRename(s.id)}
              onKeyDown={(e) => e.key === 'Enter' && saveRename(s.id)}
              className={`border rounded px-1.5 py-0.5 text-xs w-full ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}
            />
          ) : (
            <span className="truncate text-xs">{s.title}</span>
          )}
        </div>

        {/* Action icons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinSession(s.id);
            }}
            className="p-1 rounded hover:opacity-80"
            title={s.isPinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => startRename(s, e)}
            className="p-1 rounded hover:opacity-80"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSession(s.id);
            }}
            className="p-1 rounded hover:opacity-80 text-rose-400"
            title="Delete session"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
