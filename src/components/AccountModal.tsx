import React, { useState } from 'react';
import { UserProfile, UserUsage, ColorTheme } from '../types';
import { CipherLogo } from './CipherLogo';
import { ThemeSelector } from './ThemeSelector';
import { getThemeConfig } from '../utils/themeConfig';
import {
  User,
  Mail,
  Shield,
  RefreshCw,
  CheckCircle2,
  X,
  Sparkles,
  Download,
  Laptop,
  Smartphone,
  LogOut,
  Palette,
  AlertTriangle,
  ArrowRight,
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
  onOpenAuthModal: () => void;
  onSwitchToGuest: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  usage,
  currentTheme,
  onThemeChange,
  onUpdateProfile,
  onTriggerSync,
  isSyncing,
  onTogglePro,
  onOpenAuthModal,
  onSwitchToGuest,
}) => {
  if (!isOpen) return null;

  const themeConfig = getThemeConfig(currentTheme);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState(profile.role);
  const [currency, setCurrency] = useState(profile.currency);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name,
      email,
      role,
      currency,
    });
    setSyncStatusMsg('Profile preferences updated!');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleManualSync = async () => {
    if (profile.isGuest) {
      setSyncStatusMsg('Guest mode does not sync data. Sign in with Gmail to save.');
      setTimeout(() => setSyncStatusMsg(null), 3000);
      return;
    }
    await onTriggerSync();
    setSyncStatusMsg('Data securely synchronized with cloud!');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const demoAccounts = [
    {
      name: 'Jude Prado',
      email: 'judeprado1031@gmail.com',
      role: 'Financial Analyst',
      isPro: false,
      authProvider: 'google' as const,
    },
    {
      name: 'Sarah Lin',
      email: 'sarah.lin@corporate-cfo.com',
      role: 'CFO & VP of Finance',
      isPro: true,
      authProvider: 'google' as const,
    },
    {
      name: 'Marcus Sterling',
      email: 'marcus@hedgefund-quant.io',
      role: 'Quantitative Derivatives Trader',
      isPro: true,
      authProvider: 'email' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-main)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 opacity-70 hover:opacity-100 p-2 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Identity Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}>
            <CipherLogo className={`w-8 h-8 ${themeConfig.classes.accentText}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              {profile.isGuest ? 'Guest User' : profile.name}
              {profile.isPro && (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                  PRO
                </span>
              )}
              {profile.isGuest && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  GUEST (UNSAVED)
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {profile.isGuest
                ? 'Temporary session • Conversations will not be saved'
                : `${profile.email} • ${profile.role}`}
            </p>
          </div>
        </div>

        {/* GUEST MODE BANNER OR GMAIL SIGN IN */}
        {profile.isGuest ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 mb-6 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300">
                  Guest Mode Active
                </div>
                <div className="text-[11px] text-amber-200/80 mt-0.5">
                  Your calculations and chat history are temporary and{' '}
                  <strong>will not be saved upon closing</strong>. Sign in with your Gmail account to enable persistent history & cloud sync.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-white/10"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Gmail to Save History</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Secure Account Sync Active
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Signed in with {profile.authProvider === 'google' ? 'Gmail' : 'Account'} • Chat history saved
                  </div>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-slate-400" /> Desktop
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-slate-400" /> Mobile
                </span>
              </div>
              <button
                onClick={onSwitchToGuest}
                className="text-[11px] text-amber-400/90 hover:text-amber-300 underline"
              >
                Switch to Guest Mode
              </button>
            </div>

            {syncStatusMsg && (
              <div className="mt-2 text-xs text-emerald-400 font-medium animate-fadeIn">
                ✓ {syncStatusMsg}
              </div>
            )}
          </div>
        )}

        {/* 2. COLOR THEME SELECTION (Required by user!) */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-sky-400" />
              Website Color Theme
            </span>
            <span className="text-[11px] text-slate-500">Instant Live Preview</span>
          </div>
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
          />
        </div>

        {/* 3. PROFILE & MATH PREFERENCES */}
        {!profile.isGuest && (
          <form onSubmit={handleSave} className="space-y-4 mb-6">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Profile & Currency
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Financial Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:border-sky-500"
                >
                  <option value="Financial Analyst">Financial Analyst</option>
                  <option value="CFO & Controller">CFO & Controller</option>
                  <option value="Quantitative Trader">Quantitative Trader</option>
                  <option value="Business Student">Business Student</option>
                  <option value="Entrepreneur">Entrepreneur / Founder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Base Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:border-sky-500 font-mono"
                >
                  <option value="$">$ USD (United States Dollar)</option>
                  <option value="€">€ EUR (Euro)</option>
                  <option value="£">£ GBP (British Pound)</option>
                  <option value="¥">¥ JPY (Japanese Yen)</option>
                  <option value="₱">₱ PHP (Philippine Peso)</option>
                  <option value="C$">C$ CAD (Canadian Dollar)</option>
                  <option value="A$">A$ AUD (Australian Dollar)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20"
              >
                Save Preferences
              </button>
            </div>
          </form>
        )}

        {/* 4. SWITCH TEST ACCOUNT */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
            Switch Account / Sign In Options
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => {
                  setName(acc.name);
                  setEmail(acc.email);
                  setRole(acc.role);
                  onUpdateProfile({
                    ...profile,
                    name: acc.name,
                    email: acc.email,
                    role: acc.role,
                    isPro: acc.isPro,
                    isGuest: false,
                    authProvider: acc.authProvider,
                  });
                  onTogglePro(acc.isPro);
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  profile.email === acc.email && !profile.isGuest
                    ? 'border-sky-500/80 bg-sky-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-white truncate">{acc.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{acc.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
