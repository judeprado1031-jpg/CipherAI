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
  Laptop,
  Smartphone,
  Palette,
  Lock,
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
}) => {
  if (!isOpen) return null;

  const themeConfig = getThemeConfig(currentTheme);
  const [name, setName] = useState(profile.name || 'Jude Prado');
  const [role, setRole] = useState(profile.role || 'Financial Analyst');
  const [currency, setCurrency] = useState(profile.currency || '$');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

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
          aria-label="Close modal"
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
              {name}
              {profile.isPro ? (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                  PRO
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  PERMANENT ACCOUNT
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              judeprado1031@gmail.com • {role}
            </p>
          </div>
        </div>

        {/* 1. SINGLE ACCOUNT STATUS & CLOUD SYNC */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  Single Account Locked & Active
                </div>
                <div className="text-[11px] text-slate-400">
                  Account switching disabled • Persistent cloud sync enabled
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
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" /> 1 Account Enforced
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

        {/* 3. PROFILE & PREFERENCES FORM */}
        <form onSubmit={handleSave} className="space-y-4 mb-2">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Profile & Currency Settings
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
                Email Address (Permanent)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value="judeprado1031@gmail.com"
                  disabled
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 pr-8 text-xs text-slate-400 cursor-not-allowed font-mono"
                />
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
              </div>
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
                <option value="Accountancy Scholar">Accountancy Scholar</option>
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

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Only 1 permanent account allowed per user.
            </span>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
