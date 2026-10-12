import React, { useState, useRef, useEffect } from 'react';
import { ColorTheme, CustomThemeData } from '../types';
import {
  PRESET_THEMES,
  loadCustomThemeData,
  saveCustomThemeData,
  isColorDark,
  applyThemeToDocument,
  useTheme,
} from '../utils/themeConfig';
import {
  Palette,
  Check,
  Sparkles,
  Sliders,
  Paintbrush,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: ColorTheme;
  onThemeChange: (theme: ColorTheme) => void;
  compact?: boolean;
}

const BG_PRESETS = [
  { label: 'Crisp White', value: '#ffffff', isLight: true },
  { label: 'Pastel Blush', value: '#fff5f8', isLight: true },
  { label: 'Mint Mist', value: '#f0fdfa', isLight: true },
  { label: 'Warm Cream', value: '#faf7f2', isLight: true },
  { label: 'Pitch Black', value: '#000000', isLight: false },
  { label: 'Dark Charcoal', value: '#090d16', isLight: false },
  { label: 'Night Violet', value: '#080310', isLight: false },
  { label: 'Deep Terminal', value: '#020a05', isLight: false },
  { label: 'Ruby Velvet', value: '#0a0305', isLight: false },
];

const ACCENT_PRESETS = [
  { label: 'Pure Black', value: '#09090b' },
  { label: 'Light Pink', value: '#ec4899' },
  { label: 'Neon Purple', value: '#a855f7' },
  { label: 'Matrix Green', value: '#22c55e' },
  { label: 'Electric Sky', value: '#38bdf8' },
  { label: 'Sunset Coral', value: '#f97316' },
  { label: 'Crimson Red', value: '#ef4444' },
  { label: 'Royal Gold', value: '#eab308' },
  { label: 'Mint Teal', value: '#14b8a6' },
  { label: 'Pure White', value: '#ffffff' },
];

const QUICK_COMBOS = [
  { name: 'White + Black', bg: '#ffffff', card: '#ffffff', accent: '#09090b', isLight: true },
  { name: 'White + Light Pink', bg: '#fff5f8', card: '#ffffff', accent: '#ec4899', isLight: true },
  { name: 'Black + Purple', bg: '#080310', card: '#130924', accent: '#a855f7', isLight: false },
  { name: 'Green + Black', bg: '#020a05', card: '#051c0e', accent: '#22c55e', isLight: false },
  { name: 'Black + Crimson', bg: '#0a0305', card: '#1c070c', accent: '#f43f5e', isLight: false },
  { name: 'Midnight + Mint', bg: '#030e12', card: '#081e26', accent: '#2dd4bf', isLight: false },
  { name: 'White + Cyan Sky', bg: '#f0fdfa', card: '#ffffff', accent: '#0d9488', isLight: true },
  { name: 'Black + Royal Gold', bg: '#0a0905', card: '#1a170c', accent: '#eab308', isLight: false },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  compact = false,
}) => {
  const { themeConfig, updateCustomTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [viewTab, setViewTab] = useState<'presets' | 'custom'>('presets');
  const containerRef = useRef<HTMLDivElement>(null);

  const [customData, setCustomData] = useState<CustomThemeData>(loadCustomThemeData);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeThemeObj =
    PRESET_THEMES.find((t) => t.id === currentTheme) || {
      name: 'Custom Theme',
      primaryColor: customData.accentColor,
      accentColor: customData.accentColor,
      badge: 'Customized',
    };

  const handleUpdateCustomBg = (bgColor: string) => {
    const isLight = !isColorDark(bgColor);
    const cardColor = isLight ? '#ffffff' : '#131926';
    const updated: CustomThemeData = {
      ...customData,
      bgColor,
      cardColor,
      isLight,
    };
    setCustomData(updated);
    saveCustomThemeData(updated);
    updateCustomTheme(updated);
    onThemeChange('custom');
    applyThemeToDocument('custom');
  };

  const handleUpdateCustomAccent = (accentColor: string) => {
    const updated: CustomThemeData = {
      ...customData,
      accentColor,
    };
    setCustomData(updated);
    saveCustomThemeData(updated);
    updateCustomTheme(updated);
    onThemeChange('custom');
    applyThemeToDocument('custom');
  };

  const handleApplyQuickCombo = (combo: typeof QUICK_COMBOS[0]) => {
    const updated: CustomThemeData = {
      name: combo.name,
      bgColor: combo.bg,
      cardColor: combo.card,
      accentColor: combo.accent,
      isLight: combo.isLight,
    };
    setCustomData(updated);
    saveCustomThemeData(updated);
    updateCustomTheme(updated);
    onThemeChange('custom');
    applyThemeToDocument('custom');
  };

  // Custom Color Studio Renderer
  const renderCustomStudio = () => (
    <div className="space-y-4 text-xs animate-fadeIn">
      {/* 1. Quick One-Click Recipes */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2 opacity-75">
          <span>Popular Color Combinations</span>
          <Sparkles className="w-3 h-3 text-pink-400" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_COMBOS.map((combo) => (
            <button
              key={combo.name}
              type="button"
              onClick={() => handleApplyQuickCombo(combo)}
              className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between group shadow-sm ${
                currentTheme === 'custom' && customData.name === combo.name
                  ? 'border-pink-500 font-bold'
                  : 'hover:border-slate-400'
              }`}
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full border shrink-0 shadow-sm"
                  style={{ backgroundColor: combo.bg, borderColor: 'var(--border-subtle)' }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: combo.accent }}
                />
                <span className="truncate text-[11px]">{combo.name}</span>
              </div>
              {currentTheme === 'custom' && customData.name === combo.name && (
                <Check className="w-3 h-3 text-pink-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Background Color Picker */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2 opacity-75">
          <span>1. Pick Background Tone</span>
          <span className="text-[10px] font-mono">{customData.bgColor}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {BG_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleUpdateCustomBg(preset.value)}
              className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 flex items-center justify-center ${
                customData.bgColor.toLowerCase() === preset.value.toLowerCase()
                  ? 'ring-2 ring-pink-500 scale-105'
                  : ''
              }`}
              style={{
                backgroundColor: preset.value,
                borderColor: 'var(--border-subtle)',
              }}
              title={preset.label}
            >
              {customData.bgColor.toLowerCase() === preset.value.toLowerCase() && (
                <Check
                  className={`w-3 h-3 ${preset.isLight ? 'text-black' : 'text-white'}`}
                />
              )}
            </button>
          ))}

          {/* Custom Background Color Picker Input */}
          <label
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-dashed cursor-pointer text-[11px] transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <input
              type="color"
              value={customData.bgColor}
              onChange={(e) => handleUpdateCustomBg(e.target.value)}
              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <span>Custom Tone</span>
          </label>
        </div>
      </div>

      {/* 3. Accent & Button Color Picker */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2 opacity-75">
          <span>2. Pick Accent & Button Color</span>
          <span className="text-[10px] font-mono">{customData.accentColor}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleUpdateCustomAccent(preset.value)}
              className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 flex items-center justify-center ${
                customData.accentColor.toLowerCase() === preset.value.toLowerCase()
                  ? 'ring-2 ring-white scale-105'
                  : ''
              }`}
              style={{
                backgroundColor: preset.value,
                borderColor: 'var(--border-subtle)',
              }}
              title={preset.label}
            >
              {customData.accentColor.toLowerCase() === preset.value.toLowerCase() && (
                <Check
                  className={`w-3 h-3 ${
                    isColorDark(preset.value) ? 'text-white' : 'text-black'
                  }`}
                />
              )}
            </button>
          ))}

          {/* Custom Accent Color Picker Input */}
          <label
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-dashed cursor-pointer text-[11px] transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <input
              type="color"
              value={customData.accentColor}
              onChange={(e) => handleUpdateCustomAccent(e.target.value)}
              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <span>Custom Accent</span>
          </label>
        </div>
      </div>

      {/* 4. Live Mini Preview Card */}
      <div
        className="p-3.5 rounded-2xl border transition-all overflow-hidden shadow-md"
        style={{
          backgroundColor: customData.bgColor,
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-2"
          style={{ color: customData.isLight ? '#0f172a' : '#f8fafc' }}
        >
          Live Color Combination Preview
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md"
            style={{
              backgroundColor: customData.accentColor,
              color: isColorDark(customData.accentColor) ? '#ffffff' : '#000000',
            }}
          >
            Sample Button
          </button>
          <span
            className="px-2 py-1 rounded-lg text-[10px] font-bold border"
            style={{
              borderColor: customData.accentColor,
              color: customData.accentColor,
            }}
          >
            Badge Accent
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: customData.isLight ? '#334155' : '#cbd5e1' }}
          >
            {customData.isLight ? 'Light Background' : 'Dark Background'}
          </span>
        </div>
      </div>
    </div>
  );

  // Full Grid View (Inside Account/Settings Modal)
  if (!compact) {
    return (
      <div className="space-y-4">
        {/* Tab switch between presets & customizer */}
        <div
          className="flex items-center gap-2 p-1 rounded-2xl border w-full sm:w-auto"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setViewTab('presets')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewTab === 'presets'
                ? `${themeConfig.classes.accentBtn} shadow-sm`
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Preset Color Themes ({PRESET_THEMES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('custom')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewTab === 'custom'
                ? `${themeConfig.classes.accentBtn} shadow-sm`
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom Color Studio</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300">
              Pick Colors
            </span>
          </button>
        </div>

        {viewTab === 'presets' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {PRESET_THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onThemeChange(theme.id);
                    applyThemeToDocument(theme.id);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between shadow-sm ${
                    isSelected
                      ? 'ring-2 ring-sky-500 border-sky-400'
                      : 'hover:border-slate-400'
                  }`}
                  style={{
                    backgroundColor: theme.tokens.bgCard,
                    borderColor: isSelected ? theme.primaryColor : 'var(--border-subtle)',
                    color: theme.tokens.textMain,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border shrink-0 shadow-sm"
                        style={{
                          backgroundColor: theme.tokens.bgApp,
                          borderColor: 'var(--border-subtle)',
                        }}
                      />
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                  </div>

                  <div>
                    <div className="text-xs font-bold tracking-tight">{theme.name}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{theme.badge}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          renderCustomStudio()
        )}
      </div>
    );
  }

  // Compact Popover Dropdown for Navbar
  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs shadow-sm ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
        title="Change UI Color Theme & Combinations"
      >
        <span
          className="w-3 h-3 rounded-full border shrink-0 shadow-sm"
          style={{
            backgroundColor: activeThemeObj.primaryColor,
            borderColor: 'var(--border-subtle)',
          }}
        />
        <Palette className="w-3.5 h-3.5 opacity-70" />
        <span className="hidden xl:inline text-xs font-semibold truncate max-w-[110px]">
          {activeThemeObj.name.split(' ')[0]}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl p-3.5 shadow-2xl z-50 animate-fadeIn max-h-[85vh] overflow-y-auto border ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-main)',
          }}
        >
          {/* Header & Mode Switcher */}
          <div
            className="flex items-center justify-between pb-2.5 mb-2.5 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Palette className="w-4 h-4 text-pink-400" />
              <span>Color Themes</span>
            </div>
            <div
              className="flex items-center gap-1 p-0.5 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewTab('presets')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  viewTab === 'presets'
                    ? `${themeConfig.classes.accentBtn} shadow-sm`
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Presets ({PRESET_THEMES.length})
              </button>
              <button
                type="button"
                onClick={() => setViewTab('custom')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  viewTab === 'custom'
                    ? `${themeConfig.classes.accentBtn} shadow-sm`
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Pick Colors
              </button>
            </div>
          </div>

          {viewTab === 'presets' ? (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 flex items-center justify-between opacity-75">
                <span>Color Combinations</span>
                <Sparkles className="w-3 h-3 text-pink-400" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {PRESET_THEMES.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onThemeChange(theme.id);
                        applyThemeToDocument(theme.id);
                        setIsOpen(false);
                      }}
                      className={`text-left p-2.5 rounded-xl text-xs flex flex-col justify-between transition-all border ${
                        isSelected ? 'ring-2 ring-sky-500 font-bold' : 'hover:border-slate-400'
                      }`}
                      style={{
                        backgroundColor: theme.tokens.bgCard,
                        borderColor: isSelected ? theme.primaryColor : 'var(--border-subtle)',
                        color: theme.tokens.textMain,
                      }}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border shadow-sm"
                            style={{
                              backgroundColor: theme.tokens.bgApp,
                              borderColor: 'var(--border-subtle)',
                            }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      </div>
                      <span className="truncate text-[11px] font-bold">{theme.name}</span>
                      <span className="text-[9px] opacity-75">{theme.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Shortcut to Custom Studio */}
              <button
                type="button"
                onClick={() => setViewTab('custom')}
                className="w-full mt-2 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <Sliders className="w-3.5 h-3.5 text-pink-400" />
                <span>Pick Custom Background & Accent Colors</span>
              </button>
            </div>
          ) : (
            renderCustomStudio()
          )}
        </div>
      )}
    </div>
  );
};
