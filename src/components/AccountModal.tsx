import React, { useState, useEffect } from 'react';
import { UserProfile, UserUsage, ColorTheme } from '../types';
import { CipherLogo } from './CipherLogo';
import { ThemeSelector } from './ThemeSelector';
import { getThemeConfig } from '../utils/themeConfig';
import {
  RefreshCw,
  CheckCircle2,
  X,
  Laptop,
  Smartphone,
  Palette,
  Lock,
  Info,
  ArrowLeft,
  BookOpen,
  Zap,
  ShieldCheck,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  usage: UserUsage;
  currentTheme: ColorTheme;
  onThemeChange: (theme: ColorTheme) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
  onTogglePro: (isPro: boolean) => void;
}

const CORE_FEATURES = [
  {
    index: '01',
    icon: BookOpen,
    title: 'Teach Me Mode (Unlimited Access)',
    description:
      'Your personal step-by-step tutor. Break down complex accounting journal entries, financial statements, and math formulas into clear, easy-to-understand explanations without running out of prompts.',
  },
  {
    index: '02',
    icon: Zap,
    title: 'Direct Answer Mode (15-Prompt Daily Cap)',
    description:
      'Fast answer verification for quick reference, guarded by a 15-prompt daily limit per 24-hour window to keep your self-study disciplined and focused.',
  },
  {
    index: '03',
    icon: ShieldCheck,
    title: 'Google OAuth Sign-In',
    description:
      'Secure, seamless authentication that remembers your study session and manages your daily usage quota automatically.',
  },
  {
    index: '04',
    icon: Layers,
    title: 'Subject-Specific Learning Tabs',
    description:
      'Easily toggle between FABM, General Math, and Business Math modules to get targeted formula references, interactive problem sets, and practice quizzes.',
  },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentTheme,
  onThemeChange,
  onUpdateProfile,
  onTriggerSync,
  isSyncing,
}) => {
  const [name, setName] = useState(profile.name || 'Jude Prado');
  const [role, setRole] = useState(profile.role || 'Financial Analyst');
  const [currency, setCurrency] = useState(profile.currency || '$');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [showAboutUs, setShowAboutUs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(profile.name || 'Jude Prado');
      setRole(profile.role || 'Financial Analyst');
      setCurrency(profile.currency || '$');
      setShowAboutUs(false);
      setSyncStatusMsg(null);
    }
  }, [isOpen, profile.name, profile.role, profile.currency]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themeConfig = getThemeConfig(currentTheme);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: name.trim() || 'Jude Prado',
      email: 'judeprado1031@gmail.com',
      role,
      currency,
      isGuest: false,
    });
    setSyncStatusMsg('Profile preferences updated!');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleManualSync = async () => {
    await onTriggerSync();
    setSyncStatusMsg('Data securely synchronized with cloud!');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full ${
          showAboutUs ? 'max-w-3xl' : 'max-w-xl'
        } border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto transition-all duration-200`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-main)',
        }}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 opacity-70 hover:opacity-100 p-2 rounded-xl transition-opacity focus-visible:outline-none focus-visible:ring-2"
          style={{ color: 'var(--text-main)' }}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {showAboutUs ? (
          /* ================= ABOUT US SHOWCASE VIEW ================= */
          <div className="animate-fadeIn space-y-7">
            {/* Top Back Control */}
            <div className="flex items-center justify-between pr-10">
              <button
                type="button"
                onClick={() => setShowAboutUs(false)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Profile</span>
              </button>
            </div>

            {/* Hero Editorial Header */}
            <section
              className="relative rounded-2xl border p-6 sm:p-8 overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-15 blur-3xl"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                <div
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-md"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <CipherLogo className={`w-10 h-10 ${themeConfig.classes.accentText}`} />
                </div>

                <div className="space-y-1.5">
                  <div
                    className="flex flex-wrap items-center gap-2 text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span>Senior High School</span>
                    <span aria-hidden="true">·</span>
                    <span>ABM Strand Platform</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-balance">
                    About Cipher AI
                  </h2>
                  <p
                    className="text-sm sm:text-base font-semibold tracking-tight"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Guided Learning Over Instant Answers
                  </p>
                </div>
              </div>

              <div
                className="relative mt-6 pt-6 border-t space-y-4 text-sm sm:text-[15px] leading-relaxed"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}
              >
                <p>
                  Welcome to Cipher AI, an intelligent self-study web platform built specifically for
                  Senior High School students in the Accountancy, Business, and Management (ABM)
                  strand.
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  Navigating quantitative subjects like Fundamentals of Accountancy, Business, and
                  Management (FABM), General Mathematics, and Business Mathematics can be
                  challenging—especially when studying independently outside class hours. Most online
                  AI tools give quick, unguided direct answers that lead to passive learning. Cipher
                  AI was created to change that by providing structured, step-by-step guidance that
                  helps you actually master your lessons.
                </p>
              </div>
            </section>

            {/* Core Platform Features Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  Core Platform Features
                </h3>
                <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  04 Modules
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CORE_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.index}
                      className="rounded-2xl border p-5 transition-colors duration-200 flex flex-col gap-3"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-9 h-9 rounded-xl border flex items-center justify-center"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className="text-xs font-mono font-semibold tabular-nums"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {feature.index}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold leading-snug">{feature.title}</h4>
                        <p
                          className="text-xs sm:text-[13px] leading-relaxed"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* The Project Attribution Section */}
            <section
              className="rounded-2xl border p-6 space-y-3"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap
                  className="w-5 h-5 shrink-0"
                  style={{ color: 'var(--color-accent)' }}
                />
                <h3 className="text-base sm:text-lg font-bold tracking-tight">The Project</h3>
              </div>

              <div
                className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                <span>Jude Vincent Prado</span>
                <span aria-hidden="true">·</span>
                <span>Grade 12 ABM</span>
                <span aria-hidden="true">·</span>
                <span>Tagaytay City Science National High School – Integrated Senior High School</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">SY 2026–2027</span>
              </div>

              <p
                className="text-xs sm:text-sm leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Cipher AI was created and developed by Jude Vincent Prado, a Grade 12 ABM student at
                Tagaytay City Science National High School – Integrated Senior High School (SY
                2026–2027). The platform serves as a developmental research prototype designed to
                demonstrate how artificial intelligence can be responsibly integrated into high
                school education—supporting academic integrity, building problem-solving confidence,
                and empowering independent learners.
              </p>
            </section>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-between pt-2 border-t"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <button
                type="button"
                onClick={() => setShowAboutUs(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold transition-opacity hover:opacity-85 whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                Account Settings
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md whitespace-nowrap shrink-0 ${themeConfig.classes.accentBtn}`}
              >
                Continue Studying
              </button>
            </div>
          </div>
        ) : (
          /* ================= PROFILE & SETTINGS VIEW ================= */
          <div className="animate-fadeIn">
            {/* User Identity Header + About Us Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pr-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
                >
                  <CipherLogo className={`w-8 h-8 ${themeConfig.classes.accentText}`} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 truncate">
                    <span className="truncate">{name}</span>
                    {profile.isPro && (
                      <span
                        className="px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0"
                        style={{
                          backgroundColor: 'var(--badge-bg)',
                          borderColor: 'var(--badge-border)',
                          color: 'var(--badge-text)',
                        }}
                      >
                        PRO
                      </span>
                    )}
                  </h2>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    judeprado1031@gmail.com · {role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAboutUs(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all hover:opacity-90 whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: 'var(--badge-bg)',
                  borderColor: 'var(--badge-border)',
                  color: 'var(--badge-text)',
                }}
              >
                <Info className="w-3.5 h-3.5" />
                <span>About Us</span>
              </button>
            </div>

            {/* 1. ACCOUNT STATUS & CLOUD SYNC */}
            <div
              className="p-4 rounded-2xl border mb-6"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      Account Sync Active
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                      Persistent cloud sync enabled
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 whitespace-nowrap shrink-0 hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              <div
                className="mt-3 pt-3 border-t flex items-center justify-between text-[11px]"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Laptop className="w-3 h-3" /> Desktop
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Mobile
                  </span>
                </div>
                <span className="text-[11px] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> Google OAuth Secured
                </span>
              </div>

              {syncStatusMsg && (
                <div className="mt-2 text-xs text-emerald-400 font-medium animate-fadeIn">
                  ✓ {syncStatusMsg}
                </div>
              )}
            </div>

            {/* 2. COLOR THEME SELECTION */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs uppercase font-bold tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Palette className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                  Website Color Theme
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Instant Live Preview
                </span>
              </div>
              <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />
            </div>

            {/* 3. PROFILE & PREFERENCES FORM */}
            <form onSubmit={handleSave} className="space-y-4 mb-2">
              <div
                className="text-xs uppercase font-bold tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Profile & Currency Settings
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value="judeprado1031@gmail.com"
                      disabled
                      className="w-full border rounded-xl py-2 px-3 pr-8 text-xs cursor-not-allowed font-mono opacity-75"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    />
                    <Lock
                      className="w-3.5 h-3.5 absolute right-2.5 top-2.5 opacity-60"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Academic / Financial Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <option value="Grade 12 ABM Student">Grade 12 ABM Student</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                    <option value="CFO & Controller">CFO & Controller</option>
                    <option value="Quantitative Trader">Quantitative Trader</option>
                    <option value="Business Student">Business Student</option>
                    <option value="Accountancy Scholar">Accountancy Scholar</option>
                    <option value="Entrepreneur">Entrepreneur / Founder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Base Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none font-mono"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <option value="₱">₱ PHP (Philippine Peso)</option>
                    <option value="$">$ USD (United States Dollar)</option>
                    <option value="€">€ EUR (Euro)</option>
                    <option value="£">£ GBP (British Pound)</option>
                    <option value="¥">¥ JPY (Japanese Yen)</option>
                    <option value="C$">C$ CAD (Canadian Dollar)</option>
                    <option value="A$">A$ AUD (Australian Dollar)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md whitespace-nowrap shrink-0 ${themeConfig.classes.accentBtn}`}
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
