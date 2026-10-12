import React from 'react';
import { TeachingMode } from '../types';
import { useTheme } from '../utils/themeConfig';
import { GraduationCap, Zap } from 'lucide-react';

interface TeachingModeSelectorProps {
  mode: TeachingMode;
  onChange: (mode: TeachingMode) => void;
  compact?: boolean;
}

export const TeachingModeSelector: React.FC<TeachingModeSelectorProps> = ({
  mode,
  onChange,
  compact = false,
}) => {
  const { themeConfig } = useTheme();

  return (
    <div
      className={`inline-flex p-1 rounded-2xl border shadow-inner transition-colors ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
    >
      <button
        type="button"
        onClick={() => onChange('teach')}
        className={`flex items-center gap-2 rounded-xl font-medium transition-all ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
        } ${
          mode === 'teach'
            ? `${themeConfig.classes.accentBtn} font-bold shadow-md`
            : `opacity-75 hover:opacity-100 ${themeConfig.classes.bgCardHover}`
        }`}
        title="Step-by-step breakdown: Explains how it happened, economic intuition, formulas, intermediate algebra, and common pitfalls"
      >
        <GraduationCap className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>{compact ? 'Teach Me' : 'Teach Me (How It Works)'}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('direct')}
        className={`flex items-center gap-2 rounded-xl font-medium transition-all ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
        } ${
          mode === 'direct'
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30'
            : `opacity-75 hover:opacity-100 ${themeConfig.classes.bgCardHover}`
        }`}
        title="Direct Answer: Instant executive bottom-line answer, key metrics table, and concise formula statement"
      >
        <Zap className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Direct Answer</span>
      </button>
    </div>
  );
};
