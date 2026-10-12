import React, { useState } from 'react';
import { UserProfile } from '../types';
import { CipherLogo } from './CipherLogo';
import { useTheme } from '../utils/themeConfig';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  AlertTriangle,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginWithGoogle: (email?: string, name?: string) => void;
  onLoginWithEmail: (email: string, name: string) => void;
  onContinueAsGuest: () => void;
  currentProfile: UserProfile;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginWithGoogle,
  onLoginWithEmail,
  onContinueAsGuest,
  currentProfile,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [customGmail, setCustomGmail] = useState('judeprado1031@gmail.com');
  const [showCustomGmailInput, setShowCustomGmailInput] = useState(false);
  const { themeConfig } = useTheme();

  if (!isOpen) return null;

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const displayName = name.trim() || email.split('@')[0];
    onLoginWithEmail(email, displayName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-main)',
        }}
      >
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex p-3 rounded-2xl border mb-3 shadow-lg items-center justify-center ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}>
            <CipherLogo className={`w-10 h-10 ${themeConfig.classes.accentText}`} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Cipher AI
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Personal AI assistant for business math, corporate finance & quantitative calculations.
          </p>
        </div>

        {/* 1. Sign In With Gmail (Google) Primary CTA */}
        <div className="space-y-3 mb-5">
          <button
            onClick={() => onLoginWithGoogle(customGmail, customGmail.split('@')[0])}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md shadow-white/10 active:scale-[0.99]"
          >
            {/* Google Multi-colored SVG Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Continue with Gmail ({customGmail.split('@')[0]})</span>
          </button>

          {/* Quick link to customize Gmail address */}
          <div className="text-center">
            <button
              onClick={() => setShowCustomGmailInput(!showCustomGmailInput)}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
            >
              {showCustomGmailInput
                ? 'Use standard account'
                : 'Use a different Gmail address?'}
            </button>
          </div>

          {showCustomGmailInput && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 animate-fadeIn">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Your Gmail Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customGmail}
                  onChange={(e) => setCustomGmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  onClick={() => onLoginWithGoogle(customGmail, customGmail.split('@')[0])}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-slate-900 px-3 text-slate-500 font-semibold">
              Or email login
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'signup'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Standard Email Form */}
        <form onSubmit={handleStandardSubmit} className="space-y-3 mb-6">
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white focus:border-sky-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20"
          >
            {tab === 'login' ? 'Log In to Account' : 'Create Free Account'}
          </button>
        </form>

        {/* 2. CONTINUE AS GUEST OPTION (With required disclaimer that conversations are not saved) */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-300">
                Continue as Guest
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                Continuing as guest allows you to solve math problems immediately,{' '}
                <strong className="text-amber-100 font-semibold underline decoration-amber-400">
                  however it will not save your previous conversations with Cipher AI
                </strong>
                .
              </p>
            </div>
          </div>

          <button
            onClick={onContinueAsGuest}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-amber-500/30 text-xs font-bold text-amber-300 hover:text-white flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Proceed in Guest Mode (Unsaved)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
