import React, { useState, useRef, useEffect } from 'react';
import { AssistantMode, UserUsage, UserProfile, ColorTheme } from '../types';
import { ASSISTANT_MODES } from './AssistantModeSelector';
import { CipherLogo } from './CipherLogo';
import { useTheme } from '../utils/themeConfig';
import {
  Menu,
  Zap,
  BarChart2,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  assistantMode: AssistantMode;
  onAssistantModeChange: (mode: AssistantMode) => void;
  usage: UserUsage;
  profile: UserProfile;
  currentTheme: ColorTheme;
  onThemeChange: (theme: ColorTheme) => void;
  isSyncing: boolean;
  onOpenAccount: () => void;
  onOpenAuth?: () => void;
  onOpenSubscription: () => void;
  onOpenReviewCenter: () => void;
  isReviewCenterOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenQuiz?: () => void;
  onOpenGraphModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  assistantMode,
  onAssistantModeChange,
  usage,
  profile,
  onOpenAccount,
  onOpenSubscription,
  onToggleMobileMenu,
  onOpenQuiz,
  onOpenGraphModal,
}) => {
  const { themeConfig } = useTheme();
  const [isModeOpen, setIsModeOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  const currentModeObj = ASSISTANT_MODES.find((m) => m.id === assistantMode);
  const ModeIcon = currentModeObj?.icon || BarChart2;

  useEffect(() => {
    if (!isModeOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setIsModeOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModeOpen]);

  return (
    <header
      className={`sticky top-0 z-30 h-16 ${themeConfig.classes.bgHeader} backdrop-blur-md border-b ${themeConfig.classes.border} px-3 sm:px-6 flex items-center justify-between transition-colors duration-200`}
    >
      {/* Left section: mobile hamburger & brand / mode dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className={`lg:hidden h-9 w-9 flex items-center justify-center rounded-xl border opacity-75 hover:opacity-100 ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Brand Logo in Navbar - Aligned & Themed */}
        <div className="flex items-center gap-2.5 mr-1 shrink-0">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-colors ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
          >
            <CipherLogo className={`w-5 h-5 ${themeConfig.classes.accentText}`} />
          </div>
          <div className="flex flex-col justify-center select-none hidden sm:flex">
            <span
              className={`font-black text-sm tracking-tight leading-none ${themeConfig.classes.textMain}`}
            >
              Cipher
            </span>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase leading-none mt-1 ${themeConfig.classes.accentText}`}
            >
              Decode the numbers
            </span>
          </div>
        </div>

        {/* Assistant Mode Dropdown */}
        <div className="relative" ref={modeMenuRef}>
          <button
            type="button"
            onClick={() => setIsModeOpen((prev) => !prev)}
            aria-expanded={isModeOpen}
            aria-haspopup="listbox"
            className={`h-9 flex items-center gap-2 px-3 rounded-xl border transition-all text-xs font-semibold shadow-xs ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:opacity-90`}
          >
            <ModeIcon className={`w-4 h-4 shrink-0 ${themeConfig.classes.accentText}`} />
            <span className="hidden md:inline">{currentModeObj?.label || 'Select Mode'}</span>
            <span className="md:hidden">{currentModeObj?.shortLabel || 'Mode'}</span>
            <span className={`text-[10px] opacity-60 transition-transform ${isModeOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {/* Mode Dropdown Menu */}
          {isModeOpen && (
            <div
              role="listbox"
              className={`absolute left-0 mt-1.5 w-72 border rounded-2xl p-1.5 shadow-2xl transition-all z-50 animate-fadeIn ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                Select Assistant Mode
              </div>
              {ASSISTANT_MODES.map((m) => {
                const Icon = m.icon;
                const isSelected = m.id === assistantMode;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onAssistantModeChange(m.id);
                      setIsModeOpen(false);
                      if (m.id === 'graphs' && onOpenGraphModal) {
                        onOpenGraphModal();
                      }
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? `${themeConfig.classes.accentBadge} font-bold border`
                        : 'opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${m.color.split(' ')[0]}`} />
                    <div className="overflow-hidden">
                      <div className="truncate font-semibold">{m.label}</div>
                      <div className="text-[10px] opacity-70 truncate">{m.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Cleanly aligned buttons (Review Center button removed) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Prominent Quiz Button */}
        {onOpenQuiz && (
          <button
            type="button"
            onClick={onOpenQuiz}
            className={`h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${themeConfig.classes.accentBtn}`}
            title="Take an interactive Quiz by typing a topic or inserting a PDF file"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Quiz</span>
          </button>
        )}

        {/* 15 Free Uses Badge */}
        <button
          type="button"
          onClick={onOpenSubscription}
          className={`h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl border transition-all text-xs shadow-xs ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
          title={
            usage.isPro
              ? 'Pro Subscription Active'
              : `${usage.remainingUses} free uses remaining today (15 max / 24h)`
          }
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono font-bold text-xs">
            {usage.isPro ? 'PRO' : `${usage.remainingUses}/15`}
          </span>
          <span className="hidden xl:inline text-[11px] opacity-70">
            {usage.isPro ? 'Unlimited' : 'Uses'}
          </span>
        </button>

        {/* User Account / Avatar button */}
        <button
          type="button"
          onClick={onOpenAccount}
          className={`h-9 flex items-center gap-2 p-1 pl-2.5 rounded-xl border transition-all shadow-xs ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
          title="Account Settings"
        >
          <span className="hidden md:inline text-xs font-semibold max-w-[100px] truncate">
            {profile.isGuest ? 'Guest' : profile.name}
          </span>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {profile.isGuest ? '?' : profile.name.charAt(0)}
          </div>
        </button>
      </div>
    </header>
  );
};
