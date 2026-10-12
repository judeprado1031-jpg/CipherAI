import React, { createContext, useContext } from 'react';
import { ColorTheme, ThemeConfig, CustomThemeData } from '../types';

export const STORAGE_CUSTOM_THEME_KEY = 'cipher_custom_theme_config_v1';

export const DEFAULT_CUSTOM_THEME: CustomThemeData = {
  name: 'Custom Palette',
  bgColor: '#070a12',
  cardColor: '#101626',
  accentColor: '#ec4899', // vibrant pink
  isLight: false,
};

// Color manipulation helpers
export function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return true;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return `rgba(15, 23, 42, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function loadCustomThemeData(): CustomThemeData {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_THEME_KEY);
    if (!raw) return DEFAULT_CUSTOM_THEME;
    const parsed = JSON.parse(raw);
    const bg = parsed.bgColor || DEFAULT_CUSTOM_THEME.bgColor;
    return {
      name: parsed.name || DEFAULT_CUSTOM_THEME.name,
      bgColor: bg,
      cardColor: parsed.cardColor || (isColorDark(bg) ? '#101626' : '#ffffff'),
      accentColor: parsed.accentColor || DEFAULT_CUSTOM_THEME.accentColor,
      isLight: typeof parsed.isLight === 'boolean' ? parsed.isLight : !isColorDark(bg),
    };
  } catch {
    return DEFAULT_CUSTOM_THEME;
  }
}

export function saveCustomThemeData(data: CustomThemeData): void {
  try {
    localStorage.setItem(STORAGE_CUSTOM_THEME_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving custom theme:', e);
  }
}

export interface ThemeTokens {
  bgApp: string;
  bgSidebar: string;
  bgHeader: string;
  bgCard: string;
  bgCardHover: string;
  bgCardActive: string;
  bgInput: string;
  borderSubtle: string;
  borderFocus: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryText: string;
  colorAccent: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  textMain: string;
  textMuted: string;
}

export const PRESET_THEMES: (ThemeConfig & { tokens: ThemeTokens })[] = [
  // 1. White + Black (Clean Minimalist Monochrome)
  {
    id: 'white_black',
    name: 'White + Black',
    badge: 'Monochrome',
    primaryColor: '#09090b',
    accentColor: '#18181b',
    bgDark: '#ffffff',
    isLight: true,
    tokens: {
      bgApp: '#ffffff',
      bgSidebar: '#f8fafc',
      bgHeader: 'rgba(255, 255, 255, 0.95)',
      bgCard: '#ffffff',
      bgCardHover: '#f1f5f9',
      bgCardActive: '#e2e8f0',
      bgInput: '#f8fafc',
      borderSubtle: '#cbd5e1',
      borderFocus: '#09090b',
      colorPrimary: '#09090b',
      colorPrimaryHover: '#27272a',
      colorPrimaryText: '#ffffff',
      colorAccent: '#09090b',
      badgeBg: 'rgba(9, 9, 11, 0.08)',
      badgeBorder: 'rgba(9, 9, 11, 0.25)',
      badgeText: '#09090b',
      textMain: '#09090b',
      textMuted: '#475569',
    },
    classes: {
      bgApp: 'bg-white',
      bgSidebar: 'bg-slate-50',
      bgHeader: 'bg-white/95 border-slate-200',
      bgCard: 'bg-white',
      bgCardHover: 'hover:bg-slate-100',
      bgInput: 'bg-slate-50',
      border: 'border-slate-300',
      accentBtn: 'bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20',
      accentText: 'text-black font-extrabold',
      accentBadge: 'bg-slate-100 text-slate-900 border-slate-300',
      textMain: 'text-zinc-950',
      textMuted: 'text-slate-600',
    },
  },

  // 2. White + Light Pink (Pastel Rose Elegance)
  {
    id: 'white_pink',
    name: 'White + Light Pink',
    badge: 'Pastel Rose',
    primaryColor: '#ec4899',
    accentColor: '#f43f5e',
    bgDark: '#fff5f8',
    isLight: true,
    tokens: {
      bgApp: '#fff5f8',
      bgSidebar: '#ffffff',
      bgHeader: 'rgba(255, 255, 255, 0.95)',
      bgCard: '#ffffff',
      bgCardHover: 'rgba(253, 242, 248, 0.9)',
      bgCardActive: 'rgba(252, 231, 243, 0.9)',
      bgInput: '#fff0f5',
      borderSubtle: '#fbcfe8',
      borderFocus: '#ec4899',
      colorPrimary: '#ec4899',
      colorPrimaryHover: '#db2777',
      colorPrimaryText: '#ffffff',
      colorAccent: '#ec4899',
      badgeBg: 'rgba(236, 72, 153, 0.12)',
      badgeBorder: 'rgba(236, 72, 153, 0.3)',
      badgeText: '#db2777',
      textMain: '#0f172a',
      textMuted: '#64748b',
    },
    classes: {
      bgApp: 'bg-[#fff5f8]',
      bgSidebar: 'bg-white',
      bgHeader: 'bg-white/95 border-pink-200',
      bgCard: 'bg-white',
      bgCardHover: 'hover:bg-pink-50',
      bgInput: 'bg-pink-50/60',
      border: 'border-pink-200',
      accentBtn: 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-500/25',
      accentText: 'text-pink-600 font-bold',
      accentBadge: 'bg-pink-50 text-pink-700 border-pink-300',
      textMain: 'text-slate-900',
      textMuted: 'text-slate-600',
    },
  },

  // 3. Black + Purple (Neon Violet Cyber)
  {
    id: 'black_purple',
    name: 'Black + Purple',
    badge: 'Neon Violet',
    primaryColor: '#a855f7',
    accentColor: '#c084fc',
    bgDark: '#080310',
    isLight: false,
    tokens: {
      bgApp: '#080310',
      bgSidebar: '#040108',
      bgHeader: 'rgba(8, 3, 16, 0.9)',
      bgCard: '#130924',
      bgCardHover: '#1f0f3a',
      bgCardActive: '#2d1654',
      bgInput: '#040108',
      borderSubtle: 'rgba(168, 85, 247, 0.35)',
      borderFocus: '#c084fc',
      colorPrimary: '#a855f7',
      colorPrimaryHover: '#9333ea',
      colorPrimaryText: '#ffffff',
      colorAccent: '#c084fc',
      badgeBg: 'rgba(168, 85, 247, 0.18)',
      badgeBorder: 'rgba(192, 132, 252, 0.35)',
      badgeText: '#d8b4fe',
      textMain: '#faf5ff',
      textMuted: '#c084fc',
    },
    classes: {
      bgApp: 'bg-[#080310]',
      bgSidebar: 'bg-[#040108]',
      bgHeader: 'bg-[#080310]/90 border-purple-900/50',
      bgCard: 'bg-[#130924]',
      bgCardHover: 'hover:bg-[#1f0f3a]',
      bgInput: 'bg-[#040108]',
      border: 'border-purple-900/50',
      accentBtn: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/35',
      accentText: 'text-purple-400 font-bold',
      accentBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
      textMain: 'text-purple-50',
      textMuted: 'text-purple-300/80',
    },
  },

  // 4. Green + Black (Terminal Matrix)
  {
    id: 'green_black',
    name: 'Green + Black',
    badge: 'Terminal Matrix',
    primaryColor: '#22c55e',
    accentColor: '#4ade80',
    bgDark: '#020a05',
    isLight: false,
    tokens: {
      bgApp: '#020a05',
      bgSidebar: '#010502',
      bgHeader: 'rgba(2, 10, 5, 0.9)',
      bgCard: '#051c0e',
      bgCardHover: '#082a15',
      bgCardActive: '#0d3d1e',
      bgInput: '#000401',
      borderSubtle: 'rgba(34, 197, 94, 0.35)',
      borderFocus: '#22c55e',
      colorPrimary: '#22c55e',
      colorPrimaryHover: '#16a34a',
      colorPrimaryText: '#020a05',
      colorAccent: '#4ade80',
      badgeBg: 'rgba(34, 197, 94, 0.18)',
      badgeBorder: 'rgba(74, 222, 128, 0.35)',
      badgeText: '#86efac',
      textMain: '#f0fdf4',
      textMuted: '#4ade80',
    },
    classes: {
      bgApp: 'bg-[#020a05]',
      bgSidebar: 'bg-[#010502]',
      bgHeader: 'bg-[#020a05]/90 border-emerald-900/60',
      bgCard: 'bg-[#051c0e]',
      bgCardHover: 'hover:bg-[#092e17]',
      bgInput: 'bg-[#000401]',
      border: 'border-emerald-900/60',
      accentBtn: 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-emerald-500/35',
      accentText: 'text-emerald-400 font-bold',
      accentBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
      textMain: 'text-emerald-50',
      textMuted: 'text-emerald-300/80',
    },
  },

  // 5. Financial Navy (Brand Official)
  {
    id: 'navy',
    name: 'Financial Navy',
    badge: 'Brand Official',
    primaryColor: '#0a355c',
    accentColor: '#38bdf8',
    bgDark: '#071527',
    isLight: false,
    tokens: {
      bgApp: '#071527',
      bgSidebar: '#040e1b',
      bgHeader: 'rgba(7, 21, 39, 0.9)',
      bgCard: '#0b223d',
      bgCardHover: '#0f2c4f',
      bgCardActive: '#133762',
      bgInput: '#030b14',
      borderSubtle: '#17375e',
      borderFocus: '#38bdf8',
      colorPrimary: '#0284c7',
      colorPrimaryHover: '#0369a1',
      colorPrimaryText: '#ffffff',
      colorAccent: '#38bdf8',
      badgeBg: 'rgba(2, 132, 199, 0.15)',
      badgeBorder: 'rgba(56, 189, 248, 0.3)',
      badgeText: '#7dd3fc',
      textMain: '#f1f5f9',
      textMuted: '#94a3b8',
    },
    classes: {
      bgApp: 'bg-[#071527]',
      bgSidebar: 'bg-[#040e1b]',
      bgHeader: 'bg-[#071527]/90 border-[#17375e]',
      bgCard: 'bg-[#0b223d]',
      bgCardHover: 'hover:bg-[#0f2c4f]',
      bgInput: 'bg-[#030b14]',
      border: 'border-[#17375e]',
      accentBtn: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30',
      accentText: 'text-sky-400 font-bold',
      accentBadge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      textMain: 'text-slate-100',
      textMuted: 'text-slate-400',
    },
  },

  // 6. Black + Crimson Red (Ruby Velvet)
  {
    id: 'crimson_black',
    name: 'Black + Crimson',
    badge: 'Ruby Velvet',
    primaryColor: '#f43f5e',
    accentColor: '#fb7185',
    bgDark: '#0a0305',
    isLight: false,
    tokens: {
      bgApp: '#0a0305',
      bgSidebar: '#050102',
      bgHeader: 'rgba(10, 3, 5, 0.9)',
      bgCard: '#1c070c',
      bgCardHover: '#290b12',
      bgCardActive: '#3b0f1a',
      bgInput: '#040102',
      borderSubtle: 'rgba(244, 63, 94, 0.35)',
      borderFocus: '#f43f5e',
      colorPrimary: '#f43f5e',
      colorPrimaryHover: '#e11d48',
      colorPrimaryText: '#ffffff',
      colorAccent: '#fb7185',
      badgeBg: 'rgba(244, 63, 94, 0.18)',
      badgeBorder: 'rgba(251, 113, 133, 0.35)',
      badgeText: '#fecdd3',
      textMain: '#fff1f2',
      textMuted: '#fda4af',
    },
    classes: {
      bgApp: 'bg-[#0a0305]',
      bgSidebar: 'bg-[#050102]',
      bgHeader: 'bg-[#0a0305]/90 border-rose-950',
      bgCard: 'bg-[#1c070c]',
      bgCardHover: 'hover:bg-[#2e0b14]',
      bgInput: 'bg-[#040102]',
      border: 'border-rose-900/50',
      accentBtn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
      accentText: 'text-rose-400 font-bold',
      accentBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      textMain: 'text-rose-50',
      textMuted: 'text-rose-300/80',
    },
  },

  // 7. White + Cyan Sky
  {
    id: 'white_cyan',
    name: 'White + Cyan Sky',
    badge: 'Daylight Azure',
    primaryColor: '#0d9488',
    accentColor: '#0f766e',
    bgDark: '#f0fdfa',
    isLight: true,
    tokens: {
      bgApp: '#f0fdfa',
      bgSidebar: '#ffffff',
      bgHeader: 'rgba(255, 255, 255, 0.95)',
      bgCard: '#ffffff',
      bgCardHover: '#f0fdf4',
      bgCardActive: '#ccfbf1',
      bgInput: '#f0fdfa',
      borderSubtle: '#99f6e4',
      borderFocus: '#0d9488',
      colorPrimary: '#0d9488',
      colorPrimaryHover: '#0f766e',
      colorPrimaryText: '#ffffff',
      colorAccent: '#0f766e',
      badgeBg: 'rgba(13, 148, 136, 0.12)',
      badgeBorder: 'rgba(13, 148, 136, 0.3)',
      badgeText: '#0f766e',
      textMain: '#134e4a',
      textMuted: '#2dd4bf',
    },
    classes: {
      bgApp: 'bg-[#f0fdfa]',
      bgSidebar: 'bg-white',
      bgHeader: 'bg-white/95 border-teal-100',
      bgCard: 'bg-white',
      bgCardHover: 'hover:bg-teal-50/60',
      bgInput: 'bg-teal-50/40',
      border: 'border-teal-200',
      accentBtn: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/25',
      accentText: 'text-teal-600 font-bold',
      accentBadge: 'bg-teal-50 text-teal-700 border-teal-200',
      textMain: 'text-slate-900',
      textMuted: 'text-teal-900/60',
    },
  },

  // 8. Midnight + Mint
  {
    id: 'midnight_mint',
    name: 'Midnight + Mint',
    badge: 'Pastel Mint',
    primaryColor: '#14b8a6',
    accentColor: '#2dd4bf',
    bgDark: '#030e12',
    isLight: false,
    tokens: {
      bgApp: '#030e12',
      bgSidebar: '#010609',
      bgHeader: 'rgba(3, 14, 18, 0.9)',
      bgCard: '#081e26',
      bgCardHover: '#0c2c38',
      bgCardActive: '#103a4a',
      bgInput: '#010507',
      borderSubtle: 'rgba(20, 184, 166, 0.35)',
      borderFocus: '#2dd4bf',
      colorPrimary: '#14b8a6',
      colorPrimaryHover: '#0d9488',
      colorPrimaryText: '#030e12',
      colorAccent: '#2dd4bf',
      badgeBg: 'rgba(20, 184, 166, 0.18)',
      badgeBorder: 'rgba(45, 212, 191, 0.35)',
      badgeText: '#99f6e4',
      textMain: '#f0fdfa',
      textMuted: '#2dd4bf',
    },
    classes: {
      bgApp: 'bg-[#030e12]',
      bgSidebar: 'bg-[#010609]',
      bgHeader: 'bg-[#030e12]/90 border-teal-950',
      bgCard: 'bg-[#081e26]',
      bgCardHover: 'hover:bg-[#0c2c38]',
      bgInput: 'bg-[#010507]',
      border: 'border-teal-900/50',
      accentBtn: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-teal-500/30',
      accentText: 'text-teal-400 font-bold',
      accentBadge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      textMain: 'text-teal-50',
      textMuted: 'text-teal-300/80',
    },
  },

  // 9. Black + Royal Gold
  {
    id: 'royal_gold',
    name: 'Black + Royal Gold',
    badge: 'Imperial Amber',
    primaryColor: '#eab308',
    accentColor: '#facc15',
    bgDark: '#0a0905',
    isLight: false,
    tokens: {
      bgApp: '#0a0905',
      bgSidebar: '#050402',
      bgHeader: 'rgba(10, 9, 5, 0.9)',
      bgCard: '#1a170c',
      bgCardHover: '#262212',
      bgCardActive: '#36301a',
      bgInput: '#040301',
      borderSubtle: 'rgba(234, 179, 8, 0.35)',
      borderFocus: '#facc15',
      colorPrimary: '#eab308',
      colorPrimaryHover: '#ca8a04',
      colorPrimaryText: '#0a0905',
      colorAccent: '#facc15',
      badgeBg: 'rgba(234, 179, 8, 0.18)',
      badgeBorder: 'rgba(250, 204, 21, 0.35)',
      badgeText: '#fef08a',
      textMain: '#fefce8',
      textMuted: '#facc15',
    },
    classes: {
      bgApp: 'bg-[#0a0905]',
      bgSidebar: 'bg-[#050402]',
      bgHeader: 'bg-[#0a0905]/90 border-amber-950',
      bgCard: 'bg-[#1a170c]',
      bgCardHover: 'hover:bg-[#262212]',
      bgInput: 'bg-[#040301]',
      border: 'border-amber-900/50',
      accentBtn: 'bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-amber-500/30',
      accentText: 'text-amber-400 font-bold',
      accentBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      textMain: 'text-amber-50',
      textMuted: 'text-amber-300/80',
    },
  },

  // 10. Obsidian Onyx
  {
    id: 'obsidian',
    name: 'Obsidian Onyx',
    badge: 'Midnight Slate',
    primaryColor: '#6366f1',
    accentColor: '#a5b4fc',
    bgDark: '#090d16',
    isLight: false,
    tokens: {
      bgApp: '#090d16',
      bgSidebar: '#06080e',
      bgHeader: 'rgba(9, 13, 22, 0.9)',
      bgCard: '#111827',
      bgCardHover: '#1f2937',
      bgCardActive: '#2d3748',
      bgInput: '#04060a',
      borderSubtle: 'rgba(51, 65, 85, 0.55)',
      borderFocus: '#6366f1',
      colorPrimary: '#6366f1',
      colorPrimaryHover: '#4f46e5',
      colorPrimaryText: '#ffffff',
      colorAccent: '#a5b4fc',
      badgeBg: 'rgba(99, 102, 241, 0.15)',
      badgeBorder: 'rgba(165, 180, 252, 0.3)',
      badgeText: '#c7d2fe',
      textMain: '#f1f5f9',
      textMuted: '#94a3b8',
    },
    classes: {
      bgApp: 'bg-[#090d16]',
      bgSidebar: 'bg-[#06080e]',
      bgHeader: 'bg-[#090d16]/90 border-slate-800',
      bgCard: 'bg-[#111827]',
      bgCardHover: 'hover:bg-[#1f2937]',
      bgInput: 'bg-[#04060a]',
      border: 'border-slate-800',
      accentBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30',
      accentText: 'text-indigo-400 font-bold',
      accentBadge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      textMain: 'text-slate-100',
      textMuted: 'text-slate-400',
    },
  },

  // 11. Emerald Ledger
  {
    id: 'emerald',
    name: 'Emerald Ledger',
    badge: 'Forest Mint',
    primaryColor: '#059669',
    accentColor: '#34d399',
    bgDark: '#051814',
    isLight: false,
    tokens: {
      bgApp: '#051814',
      bgSidebar: '#03100d',
      bgHeader: 'rgba(5, 24, 20, 0.9)',
      bgCard: '#09261e',
      bgCardHover: '#0f362b',
      bgCardActive: '#144638',
      bgInput: '#020d0a',
      borderSubtle: 'rgba(19, 78, 63, 0.65)',
      borderFocus: '#10b981',
      colorPrimary: '#059669',
      colorPrimaryHover: '#047857',
      colorPrimaryText: '#ffffff',
      colorAccent: '#34d399',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(52, 211, 153, 0.3)',
      badgeText: '#6ee7b7',
      textMain: '#f0fdf4',
      textMuted: '#86efac',
    },
    classes: {
      bgApp: 'bg-[#051814]',
      bgSidebar: 'bg-[#03100d]',
      bgHeader: 'bg-[#051814]/90 border-emerald-900',
      bgCard: 'bg-[#09261e]',
      bgCardHover: 'hover:bg-[#0f362b]',
      bgInput: 'bg-[#020d0a]',
      border: 'border-emerald-900',
      accentBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      accentText: 'text-emerald-400 font-bold',
      accentBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      textMain: 'text-emerald-50',
      textMuted: 'text-emerald-400',
    },
  },

  // 12. Gold Bullion
  {
    id: 'gold',
    name: 'Gold Bullion',
    badge: 'Wealth & Asset',
    primaryColor: '#d97706',
    accentColor: '#fbbf24',
    bgDark: '#14110b',
    isLight: false,
    tokens: {
      bgApp: '#14110b',
      bgSidebar: '#0d0b07',
      bgHeader: 'rgba(20, 17, 11, 0.9)',
      bgCard: '#241d12',
      bgCardHover: '#332918',
      bgCardActive: '#42351e',
      bgInput: '#0a0805',
      borderSubtle: 'rgba(69, 51, 22, 0.65)',
      borderFocus: '#f59e0b',
      colorPrimary: '#d97706',
      colorPrimaryHover: '#b45309',
      colorPrimaryText: '#ffffff',
      colorAccent: '#fbbf24',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(251, 191, 36, 0.3)',
      badgeText: '#fde68a',
      textMain: '#fffbeb',
      textMuted: '#d97706',
    },
    classes: {
      bgApp: 'bg-[#14110b]',
      bgSidebar: 'bg-[#0d0b07]',
      bgHeader: 'bg-[#14110b]/90 border-amber-900/60',
      bgCard: 'bg-[#241d12]',
      bgCardHover: 'hover:bg-[#332918]',
      bgInput: 'bg-[#0a0805]',
      border: 'border-amber-900/60',
      accentBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
      accentText: 'text-amber-400 font-bold',
      accentBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      textMain: 'text-amber-50',
      textMuted: 'text-amber-400',
    },
  },

  // 13. Amber Terminal (Cyber)
  {
    id: 'cyber',
    name: 'Amber Terminal',
    badge: 'Retro Phosphor',
    primaryColor: '#ea580c',
    accentColor: '#fb923c',
    bgDark: '#0a0a0a',
    isLight: false,
    tokens: {
      bgApp: '#0a0a0a',
      bgSidebar: '#050505',
      bgHeader: 'rgba(10, 10, 10, 0.9)',
      bgCard: '#1a1a1a',
      bgCardHover: '#262626',
      bgCardActive: '#323232',
      bgInput: '#000000',
      borderSubtle: 'rgba(55, 40, 20, 0.75)',
      borderFocus: '#f97316',
      colorPrimary: '#ea580c',
      colorPrimaryHover: '#c2410c',
      colorPrimaryText: '#ffffff',
      colorAccent: '#fb923c',
      badgeBg: 'rgba(249, 115, 22, 0.15)',
      badgeBorder: 'rgba(251, 146, 60, 0.3)',
      badgeText: '#fed7aa',
      textMain: '#fafaf9',
      textMuted: '#a8a29e',
    },
    classes: {
      bgApp: 'bg-[#0a0a0a]',
      bgSidebar: 'bg-[#050505]',
      bgHeader: 'bg-[#0a0a0a]/90 border-orange-950',
      bgCard: 'bg-[#1a1a1a]',
      bgCardHover: 'hover:bg-[#262626]',
      bgInput: 'bg-[#000000]',
      border: 'border-orange-950',
      accentBtn: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30',
      accentText: 'text-orange-400 font-bold',
      accentBadge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      textMain: 'text-orange-50',
      textMuted: 'text-orange-300/80',
    },
  },

  // 14. Executive Light
  {
    id: 'light',
    name: 'Executive Light',
    badge: 'Daylight Boardroom',
    primaryColor: '#0a355c',
    accentColor: '#0284c7',
    bgDark: '#f8fafc',
    isLight: true,
    tokens: {
      bgApp: '#f8fafc',
      bgSidebar: '#ffffff',
      bgHeader: 'rgba(255, 255, 255, 0.95)',
      bgCard: '#ffffff',
      bgCardHover: '#f1f5f9',
      bgCardActive: '#e2e8f0',
      bgInput: '#f1f5f9',
      borderSubtle: '#e2e8f0',
      borderFocus: '#0284c7',
      colorPrimary: '#0284c7',
      colorPrimaryHover: '#0369a1',
      colorPrimaryText: '#ffffff',
      colorAccent: '#0369a1',
      badgeBg: 'rgba(2, 132, 199, 0.1)',
      badgeBorder: 'rgba(2, 132, 199, 0.25)',
      badgeText: '#0369a1',
      textMain: '#0f172a',
      textMuted: '#64748b',
    },
    classes: {
      bgApp: 'bg-[#f8fafc]',
      bgSidebar: 'bg-[#ffffff]',
      bgHeader: 'bg-[#ffffff]/95 border-slate-200',
      bgCard: 'bg-[#ffffff]',
      bgCardHover: 'hover:bg-[#f1f5f9]',
      bgInput: 'bg-[#f1f5f9]',
      border: 'border-slate-200',
      accentBtn: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20',
      accentText: 'text-sky-600 font-bold',
      accentBadge: 'bg-sky-50 text-sky-700 border-sky-200',
      textMain: 'text-slate-900',
      textMuted: 'text-slate-500',
    },
  },
];

export function buildCustomThemeConfig(data: CustomThemeData): ThemeConfig & { tokens: ThemeTokens } {
  const isLight = data.isLight;
  const bg = data.bgColor;
  const accent = data.accentColor;
  const card = data.cardColor || (isLight ? '#ffffff' : hexToRgba(bg, 0.85));

  const tokens: ThemeTokens = {
    bgApp: bg,
    bgSidebar: isLight ? '#f8fafc' : hexToRgba(bg, 0.95),
    bgHeader: hexToRgba(bg, 0.95),
    bgCard: card,
    bgCardHover: isLight ? '#f1f5f9' : hexToRgba(card, 0.9),
    bgCardActive: isLight ? '#e2e8f0' : hexToRgba(card, 0.95),
    bgInput: isLight ? '#f8fafc' : hexToRgba(bg, 0.6),
    borderSubtle: isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.15)',
    borderFocus: accent,
    colorPrimary: accent,
    colorPrimaryHover: accent,
    colorPrimaryText: isColorDark(accent) ? '#ffffff' : '#000000',
    colorAccent: accent,
    badgeBg: hexToRgba(accent, 0.16),
    badgeBorder: hexToRgba(accent, 0.35),
    badgeText: accent,
    textMain: isLight ? '#0f172a' : '#f8fafc',
    textMuted: isLight ? '#64748b' : '#94a3b8',
  };

  return {
    id: 'custom',
    name: data.name || 'Custom Color Palette',
    badge: 'User Customized',
    primaryColor: accent,
    accentColor: accent,
    bgDark: bg,
    isLight,
    isCustom: true,
    tokens,
    classes: {
      bgApp: 'theme-bg-app',
      bgSidebar: 'theme-bg-sidebar',
      bgHeader: 'theme-bg-header',
      bgCard: 'theme-bg-card',
      bgCardHover: 'hover:opacity-95',
      bgInput: 'theme-bg-input',
      border: 'theme-border',
      accentBtn: 'theme-btn-primary',
      accentText: 'theme-text-accent font-semibold',
      accentBadge: 'theme-badge',
      textMain: isLight ? 'text-slate-900' : 'text-slate-100',
      textMuted: isLight ? 'text-slate-600' : 'text-slate-400',
    },
  };
}

export function getThemeConfig(themeId: ColorTheme): ThemeConfig & { tokens: ThemeTokens } {
  if (themeId === 'custom') {
    const customData = loadCustomThemeData();
    return buildCustomThemeConfig(customData);
  }
  const found = PRESET_THEMES.find((t) => t.id === themeId);
  return found || PRESET_THEMES[0];
}

export const THEMES: (ThemeConfig & { tokens: ThemeTokens })[] = [
  ...PRESET_THEMES,
  buildCustomThemeConfig(DEFAULT_CUSTOM_THEME),
];

export function applyThemeToDocument(theme: ColorTheme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const cfg = getThemeConfig(theme);
  const t = cfg.tokens;

  // Apply all CSS variables directly onto document root for 100% precision and instant rendering
  root.style.setProperty('--bg-app', t.bgApp);
  root.style.setProperty('--bg-sidebar', t.bgSidebar);
  root.style.setProperty('--bg-header', t.bgHeader);
  root.style.setProperty('--bg-card', t.bgCard);
  root.style.setProperty('--bg-card-hover', t.bgCardHover);
  root.style.setProperty('--bg-card-active', t.bgCardActive);
  root.style.setProperty('--bg-input', t.bgInput);
  root.style.setProperty('--border-subtle', t.borderSubtle);
  root.style.setProperty('--border-focus', t.borderFocus);
  root.style.setProperty('--color-primary', t.colorPrimary);
  root.style.setProperty('--color-primary-hover', t.colorPrimaryHover);
  root.style.setProperty('--color-primary-text', t.colorPrimaryText);
  root.style.setProperty('--color-accent', t.colorAccent);
  root.style.setProperty('--logo-stroke', t.colorAccent);
  root.style.setProperty('--badge-bg', t.badgeBg);
  root.style.setProperty('--badge-border', t.badgeBorder);
  root.style.setProperty('--badge-text', t.badgeText);
  root.style.setProperty('--text-main', t.textMain);
  root.style.setProperty('--text-muted', t.textMuted);

  // Set dark/light class on root element
  if (cfg.isLight) {
    root.classList.remove('dark');
    root.classList.add('light');
    document.body.style.backgroundColor = t.bgApp;
    document.body.style.color = t.textMain;
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    document.body.style.backgroundColor = t.bgApp;
    document.body.style.color = t.textMain;
  }
}

// React Context for easy theme access anywhere in the tree
export interface ThemeContextType {
  theme: ColorTheme;
  themeConfig: ThemeConfig;
  setTheme: (t: ColorTheme) => void;
  customData: CustomThemeData;
  updateCustomTheme: (data: CustomThemeData) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'navy',
  themeConfig: PRESET_THEMES[0],
  setTheme: () => {},
  customData: DEFAULT_CUSTOM_THEME,
  updateCustomTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
