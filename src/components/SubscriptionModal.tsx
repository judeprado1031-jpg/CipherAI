import React, { useEffect } from 'react';
import { UserUsage } from '../types';
import { Sparkles, Check, Clock, Zap, X } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage: UserUsage;
  onTogglePro: (isPro: boolean) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  usage,
  onTogglePro,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format countdown string
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return 'Available now';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-main)',
        }}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 opacity-70 hover:opacity-100 p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-md mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Cipher Plan & Limits
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Supercharge Your Study Intelligence
          </h2>
          <p className="text-xs sm:text-sm mt-2 opacity-75">
            Cipher includes 15 free calculations every 24 hours. Upgrade to Pro for unlimited guided learning & verification.
          </p>
        </div>

        {/* Current Usage Status Banner */}
        <div
          className="mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/25">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium opacity-70">Your 24-Hour Usage Window</div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>{usage.isPro ? 'Unlimited (Pro Active)' : `${usage.remainingUses} of 15 free uses left`}</span>
              </div>
            </div>
          </div>
          {!usage.isPro && (
            <div className="text-right">
              <div className="text-[11px] font-medium opacity-60">Reset Countdown</div>
              <div className="text-xs font-mono font-bold text-amber-500">
                {formatCountdown(usage.resetInMs)}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Free Tier */}
          <div
            className={`p-5 rounded-2xl border transition-all ${usage.isPro ? 'opacity-75' : ''}`}
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: !usage.isPro ? 'var(--color-primary)' : 'var(--border-subtle)',
            }}
          >
            <div className="text-xs font-bold uppercase tracking-wider opacity-70">
              Standard (Free)
            </div>
            <div className="text-2xl font-black mt-1">
              $0 <span className="text-xs font-normal opacity-60">/ forever</span>
            </div>
            <p className="text-xs mt-2 opacity-75">
              Ideal for daily Grade 12 ABM study and arithmetic checks.
            </p>

            <ul className="mt-4 space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                15 calculations every 24 hours
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                "Teach Me" & "Direct Answer" modes
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                Interactive AI Quizzes & Graph Plotter
              </li>
            </ul>

            {usage.isPro && (
              <button
                type="button"
                onClick={() => onTogglePro(false)}
                className="w-full mt-5 py-2 px-3 rounded-xl text-xs font-semibold border transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                Switch to Free Tier (Test Limits)
              </button>
            )}
          </div>

          {/* Pro Tier */}
          <div
            className="relative p-5 rounded-2xl border transition-all"
            style={{
              backgroundColor: 'var(--badge-bg)',
              borderColor: usage.isPro ? 'var(--color-primary)' : 'var(--badge-border)',
            }}
          >
            <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Recommended
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
              Cipher Pro
            </div>
            <div className="text-2xl font-black mt-1">
              $19 <span className="text-xs font-normal opacity-70">/ month</span>
            </div>
            <p className="text-xs mt-2 opacity-80">
              Unlimited step-by-step tutoring, journal verification, and exam prep.
            </p>

            <ul className="mt-4 space-y-2 text-xs">
              <li className="flex items-center gap-2 font-medium text-emerald-500">
                <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                Unlimited 24/7 calculations & queries
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                Complete FABM Journal & Statement Breakdowns
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                Full Photo Worksheet & PDF Quiz Analysis
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                Continuous Cloud Device Sync
              </li>
            </ul>

            <button
              type="button"
              onClick={() => onTogglePro(!usage.isPro)}
              className="w-full mt-5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              {usage.isPro ? (
                <>
                  <Check className="w-4 h-4" /> Pro Active (Click to Toggle)
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Activate Cipher Pro Instant
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] opacity-60">
          Secure encryption • Seamless cross-device synchronization • Cancel anytime
        </div>
      </div>
    </div>
  );
};
