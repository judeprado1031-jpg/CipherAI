import React from 'react';
import { AssistantMode } from '../types';
import { useTheme } from '../utils/themeConfig';
import {
  Scale,
  Briefcase,
  Layers,
  Divide,
  LineChart,
} from 'lucide-react';

interface AssistantModeSelectorProps {
  currentMode: AssistantMode;
  onChange: (mode: AssistantMode) => void;
  compact?: boolean;
}

export const ASSISTANT_MODES: {
  id: AssistantMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    id: 'fabm',
    label: 'FABM Accounting',
    shortLabel: 'FABM Accounting',
    description: 'General journals, ledger, adjusting entries, bank reconciliation, trial balance, SFP & SCI (FABM 1 & 2)',
    icon: Scale,
    color: 'text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'business_math',
    label: 'Business Mathematics',
    shortLabel: 'Business Math',
    description: 'Markup vs margin, discounts, simple & compound interest, break-even, payroll & annuities',
    icon: Briefcase,
    color: 'text-blue-400 border-blue-500/30',
  },
  {
    id: 'general_math',
    label: 'General Mathematics',
    shortLabel: 'General Math',
    description: 'Functions, rational & exponential equations, business vs consumer loans & propositional logic',
    icon: Layers,
    color: 'text-teal-400 border-teal-500/30',
  },
  {
    id: 'mathematics',
    label: 'Mathematics',
    shortLabel: 'Mathematics',
    description: 'Algebra, calculus, geometry, trigonometry, probability, statistics & matrix equations',
    icon: Divide,
    color: 'text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'graphs',
    label: 'Graphs & Plotting',
    shortLabel: 'Graphs',
    description: 'Coordinate planes, function curves ($y=mx+b$, parabolas), roots, asymptotes & visual graphs',
    icon: LineChart,
    color: 'text-amber-400 border-amber-500/30',
  },
];

export const AssistantModeSelector: React.FC<AssistantModeSelectorProps> = ({
  currentMode,
  onChange,
  compact = false,
}) => {
  const { themeConfig } = useTheme();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
      {ASSISTANT_MODES.map((item) => {
        const Icon = item.icon;
        const isActive = currentMode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
            } ${
              isActive
                ? `${themeConfig.classes.accentBadge} border font-bold shadow-sm`
                : `${themeConfig.classes.bgCard} opacity-75 hover:opacity-100 hover:${themeConfig.classes.bgCardHover} border border-transparent`
            }`}
            title={item.description}
          >
            <Icon
              className={`w-3.5 h-3.5 ${
                isActive ? themeConfig.classes.accentText : 'opacity-70'
              }`}
            />
            <span>{compact ? item.shortLabel : item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
