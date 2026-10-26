import React, { useState } from 'react';
import { ReviewItem } from '../types';
import { ScientificCalculator } from './Calculators/ScientificCalculator';
import { FinancialCalculators } from './Calculators/FinancialCalculators';
import { MathRenderer } from './MathRenderer';
import { useTheme } from '../utils/themeConfig';
import {
  Bookmark,
  Calculator,
  FileSpreadsheet,
  Search,
  Sparkles,
  Trash2,
  Tag,
  ArrowRight,
  ExternalLink,
  BookOpen,
  DollarSign,
} from 'lucide-react';

interface ReviewCenterProps {
  items: ReviewItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItemNotes: (id: string, notes: string) => void;
  currency: string;
  onOpenChatWithProblem: (prompt: string) => void;
}

export const ReviewCenter: React.FC<ReviewCenterProps> = ({
  items,
  onRemoveItem,
  onUpdateItemNotes,
  currency,
  onOpenChatWithProblem,
}) => {
  const { themeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState<'saved' | 'calculator' | 'financial' | 'cheatsheet'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter saved items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Review Center Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold mb-2 ${themeConfig.classes.accentBadge}`}>
            <Bookmark className="w-3.5 h-3.5" />
            Knowledge & Calculator Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Review Center & Scientific Toolkit
          </h1>
          <p className="text-xs sm:text-sm mt-1 opacity-80">
            Revisit bookmarked solutions, perform high-precision scientific calculations, and explore formulas.
          </p>
        </div>

        {/* Navigation Tabs (Practice & Quiz removed as requested) */}
        <div className={`flex flex-wrap gap-1 p-1 rounded-2xl border shrink-0 ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'saved'
                ? themeConfig.classes.accentBtn
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved Problems ({items.length})
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'calculator'
                ? themeConfig.classes.accentBtn
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Scientific Calculator
          </button>

          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'cheatsheet'
                ? themeConfig.classes.accentBtn
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Formula Cheatsheet
          </button>
        </div>
      </div>

      {/* TAB 1: SAVED PROBLEMS & SOLUTIONS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search saved problems, tags, formulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl py-2 pl-9 pr-4 text-xs placeholder-slate-500 focus:outline-none ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}
              />
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['all', 'FABM Accounting', 'Business Mathematics', 'General Mathematics', 'Corporate Finance'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border ${
                      selectedCategory === cat
                        ? `${themeConfig.classes.accentBadge} font-bold`
                        : `${themeConfig.classes.bgCard} ${themeConfig.classes.border} opacity-75 hover:opacity-100`
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                )
              )}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className={`text-center py-16 border rounded-3xl p-8 ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}>
              <Bookmark className="w-12 h-12 opacity-30 mx-auto mb-3" />
              <h3 className="text-base font-bold">No saved problems found</h3>
              <p className="text-xs opacity-70 mt-1 max-w-sm mx-auto">
                While chatting with Cipher, click the bookmark icon on any message to save problems and solutions here for review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-3xl p-5 sm:p-6 transition-all shadow-sm flex flex-col justify-between ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${themeConfig.classes.accentBadge}`}>
                        {item.category}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 opacity-60 hover:opacity-100 hover:text-rose-400 transition-colors"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold tracking-tight">
                      {item.title}
                    </h3>

                    <div className={`p-3.5 rounded-2xl border text-xs opacity-90 line-clamp-3 ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}>
                      {item.problem}
                    </div>

                    {item.solution && (
                      <div className="pt-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                          Saved Solution:
                        </div>
                        <div className="text-xs">
                          <MathRenderer content={item.solution} />
                        </div>
                      </div>
                    )}

                    {item.formula && (
                      <div className={`p-2.5 rounded-xl border text-center font-mono text-xs overflow-x-auto ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}>
                        <MathRenderer content={item.formula} />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] opacity-70 px-2 py-0.5 rounded-md border"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] opacity-60">
                      Saved {new Date(item.savedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() =>
                        onOpenChatWithProblem(
                          `Review this problem in detail: ${item.title}. Scenario: ${item.problem}`
                        )
                      }
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${themeConfig.classes.accentText}`}
                    >
                      Open in Chat <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCIENTIFIC CALCULATOR */}
      {activeTab === 'calculator' && (
        <ScientificCalculator onSendToChat={onOpenChatWithProblem} />
      )}

      {/* TAB 3: BUSINESS & FINANCIAL CALCULATORS */}
      {activeTab === 'financial' && (
        <FinancialCalculators currency={currency} onSendToChat={onOpenChatWithProblem} />
      )}

      {/* TAB 4: FORMULA CHEATSHEET */}
      {activeTab === 'cheatsheet' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className={`w-5 h-5 ${themeConfig.classes.accentText}`} />
              Corporate Finance & Business Math Cheat Sheet
            </h3>
            <p className="text-xs opacity-75 mt-1">
              Curated mathematical formulas for capital budgeting, valuation, quantitative risk, pricing, and operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Net Present Value (NPV)',
                desc: 'Capital budgeting discounting all future project cash flows to time zero.',
                formula: '$$ \\text{NPV} = \\sum_{t=1}^{n} \\frac{CF_t}{(1 + r)^t} - C_0 $$',
                notes: 'Accept if NPV > 0. Hurdle rate r is usually the firm’s WACC.',
              },
              {
                title: 'Weighted Average Cost of Capital (WACC)',
                desc: 'Blended hurdle rate accounting for equity and tax-deductible interest on debt.',
                formula:
                  '$$ \\text{WACC} = \\left(\\frac{E}{V} \\times R_e\\right) + \\left(\\frac{D}{V} \\times R_d \\times (1 - T_c)\\right) $$',
                notes: 'Cost of equity $R_e$ computed via CAPM: $R_f + \\beta(R_m - R_f)$.',
              },
              {
                title: 'Capital Asset Pricing Model (CAPM)',
                desc: 'Determines theoretical required return based on systematic risk beta.',
                formula: '$$ E(R_i) = R_f + \\beta_i \\left[ E(R_m) - R_f \\right] $$',
                notes: '$[E(R_m) - R_f]$ is the equity risk premium.',
              },
              {
                title: 'Break-Even Units & Revenue',
                desc: 'Sales volume where total revenue equals total variable and fixed operating costs.',
                formula:
                  '$$ Q_{BE} = \\frac{FC}{P - VC}, \\quad \\text{Revenue}_{BE} = \\frac{FC}{\\frac{P - VC}{P}} $$',
                notes: 'Contribution margin ratio is $(P - VC) / P$.',
              },
              {
                title: 'Economic Order Quantity (EOQ)',
                desc: 'Ideal inventory order size minimizing ordering and holding costs.',
                formula: '$$ \\text{EOQ} = \\sqrt{\\frac{2 D S}{H}} $$',
                notes: '$D$: annual demand, $S$: cost per order, $H$: annual holding cost per unit.',
              },
              {
                title: 'Black-Scholes-Merton Call Option',
                desc: 'Non-arbitrage analytical valuation model for European equity options.',
                formula:
                  '$$ C = S \\cdot N(d_1) - K e^{-rT} N(d_2), \\quad d_1 = \\frac{\\ln(S/K) + (r + \\sigma^2/2)T}{\\sigma\\sqrt{T}} $$',
                notes: 'Put option price follows put-call parity: $P = C + K e^{-rT} - S$.',
              },
              {
                title: 'Loan Amortization Payment',
                desc: 'Constant periodic annuity payment to pay off principal and compounding interest.',
                formula: '$$ PMT = P \\times \\frac{r(1 + r)^n}{(1 + r)^n - 1} $$',
                notes: '$r$: periodic rate (APR / 12 for monthly), $n$: total number of monthly payments.',
              },
              {
                title: 'DuPont 3-Step ROE Analysis',
                desc: 'Deconstructs Return on Equity into margin, asset turnover, and financial leverage.',
                formula:
                  '$$ \\text{ROE} = \\frac{\\text{Net Income}}{\\text{Sales}} \\times \\frac{\\text{Sales}}{\\text{Assets}} \\times \\frac{\\text{Assets}}{\\text{Equity}} $$',
                notes: 'Separates operational efficiency from financial leverage risk.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`border rounded-2xl p-5 space-y-3 ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">{f.title}</h4>
                </div>
                <p className="text-xs opacity-80">{f.desc}</p>
                <div className={`p-3 rounded-xl border text-center font-mono text-xs overflow-x-auto ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}>
                  <MathRenderer content={f.formula} />
                </div>
                <div className={`text-[11px] p-2 rounded-lg border ${themeConfig.classes.bgInput} ${themeConfig.classes.border} opacity-80`}>
                  <span className="font-semibold">Rule of Thumb:</span> {f.notes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
