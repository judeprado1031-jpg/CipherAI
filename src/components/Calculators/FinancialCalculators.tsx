import React, { useState } from 'react';
import {
  calculateNPV,
  calculateIRR,
  calculateAmortization,
  calculateBreakEven,
  calculateWACC,
  calculateBlackScholes,
  formatCurrency,
} from '../../utils/mathHelpers';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Activity,
  Layers,
  BarChart3,
  Calendar,
  Sparkles,
  Scale,
  LineChart,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import katex from 'katex';

interface FinancialCalculatorsProps {
  currency: string;
  onSendToChat?: (prompt: string) => void;
}

export const FinancialCalculators: React.FC<FinancialCalculatorsProps> = ({
  currency,
  onSendToChat,
}) => {
  const [activeCalc, setActiveCalc] = useState<
    'npv' | 'amortization' | 'breakeven' | 'wacc' | 'blackscholes' | 'fabm' | 'graphs'
  >('fabm');

  // 1. NPV & IRR State
  const [npvInitial, setNpvInitial] = useState<number>(200000);
  const [npvRate, setNpvRate] = useState<number>(10);
  const [npvCashFlows, setNpvCashFlows] = useState<number[]>([
    60000, 70000, 80000, 75000, 65000,
  ]);

  // 2. Amortization State
  const [amortPrincipal, setAmortPrincipal] = useState<number>(350000);
  const [amortRate, setAmortRate] = useState<number>(6.5);
  const [amortYears, setAmortYears] = useState<number>(30);

  // 3. Break-Even State
  const [beFixedCost, setBeFixedCost] = useState<number>(120000);
  const [beVarCost, setBeVarCost] = useState<number>(45);
  const [bePrice, setBePrice] = useState<number>(105);
  const [beTargetProfit, setBeTargetProfit] = useState<number>(50000);

  // 4. WACC State
  const [waccEquity, setWaccEquity] = useState<number>(600000);
  const [waccDebt, setWaccDebt] = useState<number>(400000);
  const [waccCostEquity, setWaccCostEquity] = useState<number>(12);
  const [waccCostDebt, setWaccCostDebt] = useState<number>(6.5);
  const [waccTaxRate, setWaccTaxRate] = useState<number>(25);

  // 5. Black-Scholes State
  const [bsStock, setBsStock] = useState<number>(150);
  const [bsStrike, setBsStrike] = useState<number>(155);
  const [bsTime, setBsTime] = useState<number>(0.5); // 6 months
  const [bsRiskFree, setBsRiskFree] = useState<number>(4.5);
  const [bsVol, setBsVol] = useState<number>(28);

  // 6. FABM Accounting & Bank Reconciliation State
  const [fabmSubTab, setFabmSubTab] = useState<'bankrec' | 'depreciation'>('bankrec');
  const [glBookBal, setGlBookBal] = useState<number>(84500);
  const [bookAddCreditMemo, setBookAddCreditMemo] = useState<number>(12180);
  const [bookLessDebitMemo, setBookLessDebitMemo] = useState<number>(3530);
  const [bankStmtBal, setBankStmtBal] = useState<number>(92300);
  const [bankAddDIT, setBankAddDIT] = useState<number>(8400);
  const [bankLessOutstanding, setBankLessOutstanding] = useState<number>(7550);

  const [deprCost, setDeprCost] = useState<number>(50000);
  const [deprSalvage, setDeprSalvage] = useState<number>(5000);
  const [deprLife, setDeprLife] = useState<number>(5);

  // 7. Graphs & Coordinate Plotter State
  const [graphA, setGraphA] = useState<number>(1);
  const [graphB, setGraphB] = useState<number>(-4);
  const [graphC, setGraphC] = useState<number>(3);
  const [graphLinearM, setGraphLinearM] = useState<number>(2);
  const [graphLinearB, setGraphLinearB] = useState<number>(-1);
  const [graphMode, setGraphMode] = useState<'quadratic' | 'linear'>('quadratic');

  // Render LaTeX math safely
  const renderFormula = (tex: string) => {
    try {
      const html = katex.renderToString(tex, { throwOnError: false });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span>{tex}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveCalc('npv')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeCalc === 'npv'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          NPV & IRR Project Evaluator
        </button>

        <button
          onClick={() => setActiveCalc('amortization')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeCalc === 'amortization'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Loan & Mortgage Amortization
        </button>

        <button
          onClick={() => setActiveCalc('breakeven')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeCalc === 'breakeven'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Break-Even & Margin Analyzer
        </button>

        <button
          onClick={() => setActiveCalc('wacc')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeCalc === 'wacc'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          WACC & Cost of Capital
        </button>

        <button
          onClick={() => setActiveCalc('blackscholes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeCalc === 'blackscholes'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          Black-Scholes Option Pricing
        </button>

        <button
          onClick={() => setActiveCalc('fabm')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeCalc === 'fabm'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-emerald-400/90 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Scale className="w-4 h-4" />
          Accounting (FABM 1 & 2)
        </button>

        <button
          onClick={() => setActiveCalc('graphs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeCalc === 'graphs'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-amber-400/90 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LineChart className="w-4 h-4" />
          Graphs & Coordinate Plotter
        </button>
      </div>

      {/* 1. NPV & IRR CALCULATOR */}
      {activeCalc === 'npv' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="lg:col-span-6 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Capital Budgeting: NPV & IRR
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Evaluate long-term capital investments, project return viability, and hurdle rates.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Investment Outlay ($C_0$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={npvInitial}
                    onChange={(e) => setNpvInitial(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-8 pr-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Annual Discount Rate / WACC ($r$) %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={npvRate}
                    onChange={(e) => setNpvRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    %
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Annual Net Cash Flows ($CF_t$)
                  </label>
                  <button
                    onClick={() => setNpvCashFlows([...npvCashFlows, 60000])}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    + Add Year
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {npvCashFlows.map((cf, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono w-16">
                        Year {idx + 1}:
                      </span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">
                          {currency}
                        </span>
                        <input
                          type="number"
                          value={cf}
                          onChange={(e) => {
                            const updated = [...npvCashFlows];
                            updated[idx] = Number(e.target.value);
                            setNpvCashFlows(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-7 pr-3 text-white text-xs font-mono focus:border-indigo-500"
                        />
                      </div>
                      {npvCashFlows.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = npvCashFlows.filter((_, i) => i !== idx);
                            setNpvCashFlows(updated);
                          }}
                          className="text-slate-500 hover:text-rose-400 text-xs px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {onSendToChat && (
              <button
                onClick={() =>
                  onSendToChat(
                    `Analyze this capital project: Initial cost ${currency}${npvInitial.toLocaleString()}, discount rate ${npvRate}%, annual cash flows: ${npvCashFlows
                      .map((cf, i) => `Y${i + 1}: ${currency}${cf.toLocaleString()}`)
                      .join(', ')}. Provide full DCF schedule and sensitivity analysis.`
                  )
                }
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Cipher to Deep-Dive & Explain This Project
              </button>
            )}
          </div>

          {/* Results panel */}
          <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            {(() => {
              const npv = calculateNPV(npvInitial, npvCashFlows, npvRate);
              const irr = calculateIRR(npvInitial, npvCashFlows);
              const isPositive = npv > 0;
              const totalInflows = npvCashFlows.reduce((a, b) => a + b, 0);
              const profitabilityIndex =
                npvInitial > 0 ? (npv + npvInitial) / npvInitial : 0;

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Calculated Decision
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isPositive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isPositive ? 'Accept Project (NPV > 0)' : 'Reject Project (NPV < 0)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Net Present Value</div>
                      <div
                        className={`text-2xl font-black font-mono tracking-tight ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(npv, currency)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {isPositive ? 'Shareholder wealth created' : 'Value destroyed'}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Internal Rate of Return</div>
                      <div className="text-2xl font-black font-mono text-indigo-400 tracking-tight">
                        {irr !== null ? `${irr.toFixed(2)}%` : 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {irr !== null && irr > npvRate
                          ? `Spread: +${(irr - npvRate).toFixed(2)}% over WACC`
                          : 'Below hurdle rate'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-300">
                      <span className="text-slate-400">Total Nominal Inflows:</span>
                      <span>{formatCurrency(totalInflows, currency)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-300">
                      <span className="text-slate-400">Profitability Index (PI):</span>
                      <span className="font-bold">{profitabilityIndex.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-slate-300">
                      <span className="text-slate-400">NPV Formula:</span>
                      <span className="text-indigo-300 font-sans">
                        {renderFormula(
                          '\\text{NPV} = \\sum \\frac{CF_t}{(1+r)^t} - C_0'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Visual Cash Flow Bar Preview */}
                  <div className="pt-2">
                    <div className="text-xs text-slate-400 mb-2">Cash Flow Timeline Preview</div>
                    <div className="flex items-end gap-1.5 h-20 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full bg-rose-500/80 rounded-t"
                          style={{
                            height: `${Math.min(
                              100,
                              Math.max(20, (npvInitial / (totalInflows || 1)) * 70)
                            )}%`,
                          }}
                        />
                        <span className="text-[9px] text-rose-400 mt-1 font-mono">-$C_0</span>
                      </div>
                      {npvCashFlows.map((cf, idx) => (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center h-full justify-end"
                        >
                          <div
                            className="w-full bg-indigo-500/80 rounded-t"
                            style={{
                              height: `${Math.min(
                                100,
                                Math.max(15, (cf / (Math.max(...npvCashFlows) || 1)) * 90)
                              )}%`,
                            }}
                          />
                          <span className="text-[9px] text-slate-400 mt-1 font-mono">
                            Y{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. AMORTIZATION CALCULATOR */}
      {activeCalc === 'amortization' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="lg:col-span-5 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Loan & Mortgage Amortization
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Compute monthly payment, total interest cost, and principal reduction schedule.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Loan Principal ($P$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={amortPrincipal}
                    onChange={(e) => setAmortPrincipal(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-8 pr-4 text-white font-mono text-sm focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Annual Interest Rate (APR) %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    value={amortRate}
                    onChange={(e) => setAmortRate(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-4 text-white font-mono text-sm focus:border-indigo-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Loan Term (Years)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 15, 20, 30].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setAmortYears(yr)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border ${
                        amortYears === yr
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {yr} yrs
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amortYears}
                  onChange={(e) => setAmortYears(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2 px-4 text-white font-mono text-sm focus:border-indigo-500"
                />
              </div>
            </div>

            {onSendToChat && (
              <button
                onClick={() =>
                  onSendToChat(
                    `Teach me how the amortization payment formula works for a ${currency}${amortPrincipal.toLocaleString()} loan at ${amortRate}% APR for ${amortYears} years. Explain how principal vs interest shifts over time.`
                  )
                }
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Explain Mathematical Derivation with Cipher
              </button>
            )}
          </div>

          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            {(() => {
              const res = calculateAmortization(amortPrincipal, amortRate, amortYears, 'monthly');
              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Monthly Payment</div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
                        {formatCurrency(res.periodicPayment, currency)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">per month</div>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Total Interest Paid</div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1">
                        {formatCurrency(res.totalInterest, currency)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {((res.totalInterest / (amortPrincipal || 1)) * 100).toFixed(1)}% of
                        principal
                      </div>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Total Repayment</div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-slate-200 mt-1">
                        {formatCurrency(res.totalPayment, currency)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {amortYears * 12} payments
                      </div>
                    </div>
                  </div>

                  {/* Amortization Table sample */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Annual Schedule Milestone Overview
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Month</th>
                            <th className="py-2 px-3">Payment</th>
                            <th className="py-2 px-3">Principal</th>
                            <th className="py-2 px-3">Interest</th>
                            <th className="py-2 px-3">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {res.schedule.slice(0, 12).map((row) => (
                            <tr key={row.period} className="hover:bg-slate-900/40">
                              <td className="py-1.5 px-3 text-slate-400">M{row.period}</td>
                              <td className="py-1.5 px-3 text-slate-300">
                                {formatCurrency(row.payment, currency)}
                              </td>
                              <td className="py-1.5 px-3 text-emerald-400">
                                {formatCurrency(row.principal, currency)}
                              </td>
                              <td className="py-1.5 px-3 text-amber-400">
                                {formatCurrency(row.interest, currency)}
                              </td>
                              <td className="py-1.5 px-3 text-slate-300">
                                {formatCurrency(row.remainingBalance, currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 3. BREAK-EVEN & MARGIN ANALYZER */}
      {activeCalc === 'breakeven' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="lg:col-span-5 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Break-Even & Margin Analyzer
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Determine unit sales and revenue required to cover fixed overhead and hit target profit.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Total Fixed Overhead Costs ($FC$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={beFixedCost}
                    onChange={(e) => setBeFixedCost(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-8 pr-4 text-white font-mono text-sm focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Unit Selling Price ($P$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                      {currency}
                    </span>
                    <input
                      type="number"
                      value={bePrice}
                      onChange={(e) => setBePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-8 pr-3 text-white font-mono text-sm focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Unit Variable Cost ($VC$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                      {currency}
                    </span>
                    <input
                      type="number"
                      value={beVarCost}
                      onChange={(e) => setBeVarCost(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-8 pr-3 text-white font-mono text-sm focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Operating Profit Goal
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={beTargetProfit}
                    onChange={(e) => setBeTargetProfit(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-8 pr-4 text-white font-mono text-sm focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {onSendToChat && (
              <button
                onClick={() =>
                  onSendToChat(
                    `Our business has fixed costs of ${currency}${beFixedCost.toLocaleString()}, selling price of ${currency}${bePrice}, and variable cost of ${currency}${beVarCost}. Teach me how to calculate contribution margin, break-even units, and target profit of ${currency}${beTargetProfit.toLocaleString()}.`
                  )
                }
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Cipher for Complete Sensitivity Analysis
              </button>
            )}
          </div>

          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            {(() => {
              const res = calculateBreakEven(beFixedCost, beVarCost, bePrice, beTargetProfit);
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Break-Even Units</div>
                      <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
                        {Math.ceil(res.breakEvenUnits).toLocaleString()} units
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Revenue: {formatCurrency(res.breakEvenRevenue, currency)}
                      </div>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Unit Contribution Margin</div>
                      <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                        {formatCurrency(res.unitContributionMargin, currency)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        CM Ratio: {res.contributionMarginRatio.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Units for Target Profit:</span>
                      <span className="font-bold text-indigo-300">
                        {Math.ceil(res.targetUnits).toLocaleString()} units
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Revenue for Target Profit:</span>
                      <span className="font-bold text-indigo-300">
                        {formatCurrency(res.targetRevenue, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Markup on Variable Cost:</span>
                      <span>
                        {beVarCost > 0
                          ? (((bePrice - beVarCost) / beVarCost) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                    <strong className="text-slate-200">Managerial Formula:</strong>
                    <div className="mt-1 font-mono text-indigo-300">
                      $$ Q_&#123;\text&#123;BE&#125;&#125; = \frac&#123;\text&#123;Fixed Costs&#125;&#125;&#123;P - VC&#125; = \frac&#123;{beFixedCost.toLocaleString()}&#125;&#123;{bePrice} - {beVarCost}&#125; = {Math.ceil(res.breakEvenUnits).toLocaleString()} \text&#123; units&#125; $$
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 4. WACC CALCULATOR */}
      {activeCalc === 'wacc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                WACC & Hurdle Rate
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Weighted Average Cost of Capital blending equity and tax-shielded debt financing.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Market Value Equity ($E$)
                </label>
                <input
                  type="number"
                  value={waccEquity}
                  onChange={(e) => setWaccEquity(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono text-sm focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Market Value Debt ($D$)
                </label>
                <input
                  type="number"
                  value={waccDebt}
                  onChange={(e) => setWaccDebt(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono text-sm focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Cost Equity ($R_e$)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waccCostEquity}
                  onChange={(e) => setWaccCostEquity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-white font-mono text-xs focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Cost Debt ($R_d$)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waccCostDebt}
                  onChange={(e) => setWaccCostDebt(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-white font-mono text-xs focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Corp Tax ($T_c$)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={waccTaxRate}
                  onChange={(e) => setWaccTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-white font-mono text-xs focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            {(() => {
              const res = calculateWACC(
                waccEquity,
                waccDebt,
                waccCostEquity,
                waccCostDebt,
                waccTaxRate
              );
              return (
                <div className="space-y-5">
                  <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-center">
                    <div className="text-xs uppercase font-bold text-slate-400">
                      Calculated WACC Hurdle Rate
                    </div>
                    <div className="text-4xl font-black font-mono text-indigo-400 mt-2">
                      {res.wacc.toFixed(2)}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Required return on new corporate investments
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Equity Weight ($W_e$):</span>
                      <div className="text-base font-bold text-slate-200 mt-0.5">
                        {res.weightEquity.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-slate-400">After-Tax Debt Cost:</span>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">
                        {res.afterTaxCostOfDebt.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 5. BLACK-SCHOLES OPTION PRICING */}
      {activeCalc === 'blackscholes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Black-Scholes-Merton Derivatives
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Value European call and put options and calculate Greek risk parameters ($d_1, d_2, \Delta$).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Spot Price ($S$)
                </label>
                <input
                  type="number"
                  value={bsStock}
                  onChange={(e) => setBsStock(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono text-sm focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Strike Price ($K$)
                </label>
                <input
                  type="number"
                  value={bsStrike}
                  onChange={(e) => setBsStrike(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono text-sm focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Time ($T$ yrs)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={bsTime}
                  onChange={(e) => setBsTime(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-white font-mono text-xs focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Risk-Free ($r$ %)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bsRiskFree}
                  onChange={(e) => setBsRiskFree(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-white font-mono text-xs focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Volatility ($\sigma$ %)
                </label>
                <input
                  type="number"
                  step="1"
                  value={bsVol}
                  onChange={(e) => setBsVol(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-white font-mono text-xs focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            {(() => {
              const res = calculateBlackScholes(bsStock, bsStrike, bsTime, bsRiskFree, bsVol);
              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">European Call Option</div>
                      <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                        {formatCurrency(res.callPrice, currency)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Delta ($\Delta$): +{res.deltaCall.toFixed(3)}
                      </div>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">European Put Option</div>
                      <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
                        {formatCurrency(res.putPrice, currency)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Delta ($\Delta$): {res.deltaPut.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400">$d_1$:</span>{' '}
                      <span className="text-white font-bold">{res.d1.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">$d_2$:</span>{' '}
                      <span className="text-white font-bold">{res.d2.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 6. FABM ACCOUNTING & BANK RECONCILIATION CALCULATOR */}
      {activeCalc === 'fabm' && (
        <div className="space-y-6">
          {/* Sub-selector for FABM tools */}
          <div className="flex gap-2 p-1 bg-slate-900/60 rounded-2xl border border-slate-800 w-fit">
            <button
              onClick={() => setFabmSubTab('bankrec')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                fabmSubTab === 'bankrec'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bank Reconciliation (FABM 2)
            </button>
            <button
              onClick={() => setFabmSubTab('depreciation')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                fabmSubTab === 'depreciation'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Depreciation Schedules (FABM 1)
            </button>
          </div>

          {fabmSubTab === 'bankrec' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
              {/* Bank Rec Inputs */}
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    Bank Reconciliation (Adjusted Balance Method)
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Reconcile differences between the general ledger Cash account and the monthly bank statement.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Book Section Inputs */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                      <span>Book Section (Company Ledger)</span>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        Unadjusted Cash Balance per Books (GL):
                      </label>
                      <input
                        type="number"
                        value={glBookBal}
                        onChange={(e) => setGlBookBal(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Add: Credit Memos (Notes, Interest):
                        </label>
                        <input
                          type="number"
                          value={bookAddCreditMemo}
                          onChange={(e) => setBookAddCreditMemo(Number(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Less: Debit Memos (NSF, Fees):
                        </label>
                        <input
                          type="number"
                          value={bookLessDebitMemo}
                          onChange={(e) => setBookLessDebitMemo(Number(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Section Inputs */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      Bank Section (Bank Statement)
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        Unadjusted Balance per Bank Statement:
                      </label>
                      <input
                        type="number"
                        value={bankStmtBal}
                        onChange={(e) => setBankStmtBal(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Add: Deposits in Transit (DIT):
                        </label>
                        <input
                          type="number"
                          value={bankAddDIT}
                          onChange={(e) => setBankAddDIT(Number(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Less: Outstanding Checks (OC):
                        </label>
                        <input
                          type="number"
                          value={bankLessOutstanding}
                          onChange={(e) => setBankLessOutstanding(Number(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {onSendToChat && (
                  <button
                    onClick={() =>
                      onSendToChat(
                        `Please prepare a formal Bank Reconciliation Statement and adjusting journal entries with: Unadjusted Book Balance ${currency}${glBookBal}, Credit Memos ${currency}${bookAddCreditMemo}, Debit Memos ${currency}${bookLessDebitMemo}, Bank Statement Balance ${currency}${bankStmtBal}, Deposits in Transit ${currency}${bankAddDIT}, and Outstanding Checks ${currency}${bankLessOutstanding}.`
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Explain in Cipher Chat (with Journal Entries)</span>
                  </button>
                )}
              </div>

              {/* Bank Rec Output Statement */}
              <div className="lg:col-span-6 space-y-4">
                {(() => {
                  const adjustedBook = glBookBal + bookAddCreditMemo - bookLessDebitMemo;
                  const adjustedBank = bankStmtBal + bankAddDIT - bankLessOutstanding;
                  const isReconciled = Math.abs(adjustedBook - adjustedBank) < 0.01;
                  const discrepancy = Math.abs(adjustedBook - adjustedBank);

                  return (
                    <div className="space-y-4">
                      {/* Reconciliation Status Badge */}
                      <div
                        className={`p-4 rounded-2xl border flex items-center gap-3 ${
                          isReconciled
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        {isReconciled ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-bold">
                            {isReconciled
                              ? 'RECONCILED: Books and Bank match perfectly!'
                              : `DISCREPANCY: Discrepancy of ${formatCurrency(discrepancy, currency)}`}
                          </div>
                          <div className="text-[11px] opacity-80">
                            {isReconciled
                              ? `True Cash Balance: ${formatCurrency(adjustedBook, currency)}`
                              : 'Check for unrecorded transactions, transposition errors, or bank charges.'}
                          </div>
                        </div>
                      </div>

                      {/* Statement Table */}
                      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden text-xs">
                        <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-white text-center">
                          Bank Reconciliation Statement (Adjusted Balance)
                        </div>

                        <div className="p-3 space-y-2">
                          <div className="text-emerald-400 font-bold border-b border-slate-800/60 pb-1">
                            Book Balance Section
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Balance per General Ledger:</span>
                            <span className="font-mono">{formatCurrency(glBookBal, currency)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400/90 pl-3">
                            <span>Add: Credit Memos:</span>
                            <span className="font-mono">+{formatCurrency(bookAddCreditMemo, currency)}</span>
                          </div>
                          <div className="flex justify-between text-rose-400/90 pl-3">
                            <span>Less: Debit Memos:</span>
                            <span className="font-mono">-{formatCurrency(bookLessDebitMemo, currency)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-1">
                            <span>Adjusted Book Balance:</span>
                            <span className="font-mono text-emerald-400">
                              {formatCurrency(adjustedBook, currency)}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 border-t border-slate-800 space-y-2">
                          <div className="text-sky-400 font-bold border-b border-slate-800/60 pb-1">
                            Bank Statement Section
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Balance per Bank Statement:</span>
                            <span className="font-mono">{formatCurrency(bankStmtBal, currency)}</span>
                          </div>
                          <div className="flex justify-between text-sky-400/90 pl-3">
                            <span>Add: Deposits in Transit:</span>
                            <span className="font-mono">+{formatCurrency(bankAddDIT, currency)}</span>
                          </div>
                          <div className="flex justify-between text-rose-400/90 pl-3">
                            <span>Less: Outstanding Checks:</span>
                            <span className="font-mono">-{formatCurrency(bankLessOutstanding, currency)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-1">
                            <span>Adjusted Bank Balance:</span>
                            <span className="font-mono text-sky-400">
                              {formatCurrency(adjustedBank, currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Required Adjusting Journal Entries Note */}
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="font-bold text-slate-200">
                          FABM Rule on Adjusting Journal Entries:
                        </div>
                        <p>
                          Only items in the <strong>Book Section</strong> require adjusting journal entries in the company general journal (e.g., Cash debit for credit memos, Cash credit for debit memos). The bank's records are independent.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* Depreciation Schedule Calculator */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    Asset Depreciation Schedules (FABM 1)
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Compare Straight-Line (SL) and Double Declining Balance (DDB) depreciation methods.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">
                      Historical Cost of Asset:
                    </label>
                    <input
                      type="number"
                      value={deprCost}
                      onChange={(e) => setDeprCost(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        Salvage / Residual Value:
                      </label>
                      <input
                        type="number"
                        value={deprSalvage}
                        onChange={(e) => setDeprSalvage(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        Useful Life (Years):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={deprLife}
                        onChange={(e) => setDeprLife(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>

                {(() => {
                  const depreciableCost = Math.max(0, deprCost - deprSalvage);
                  const annualSL = depreciableCost / deprLife;
                  const ddbRate = (2 / deprLife) * 100;

                  return (
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <div className="text-emerald-400 font-bold">Key Depreciation Metrics:</div>
                      <div className="flex justify-between text-slate-300">
                        <span>Depreciable Cost:</span>
                        <span className="font-mono font-bold">{formatCurrency(depreciableCost, currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Annual Straight-Line Depr:</span>
                        <span className="font-mono font-bold text-white">{formatCurrency(annualSL, currency)}/yr</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>DDB Acceleration Rate:</span>
                        <span className="font-mono font-bold text-sky-400">{ddbRate.toFixed(1)}% / yr</span>
                      </div>
                    </div>
                  );
                })()}

                {onSendToChat && (
                  <button
                    onClick={() =>
                      onSendToChat(
                        `Provide the full adjusting entry and depreciation schedule for an asset costing ${currency}${deprCost} with ${currency}${deprSalvage} salvage value and ${deprLife}-year useful life under both Straight-Line and Double Declining Balance methods.`
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Journal Entries in Chat</span>
                  </button>
                )}
              </div>

              {/* Depreciation Schedule Table */}
              <div className="lg:col-span-7 space-y-3">
                <div className="text-xs font-bold text-slate-300">
                  Straight-Line Annual Depreciation Schedule
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5">Depreciation Expense</th>
                        <th className="p-2.5">Accumulated Depr</th>
                        <th className="p-2.5">Ending Book Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                      {Array.from({ length: Math.min(10, deprLife) }).map((_, idx) => {
                        const yr = idx + 1;
                        const annual = (deprCost - deprSalvage) / deprLife;
                        const accum = annual * yr;
                        const bookVal = deprCost - accum;
                        return (
                          <tr key={yr} className="hover:bg-slate-800/30">
                            <td className="p-2.5 text-white font-bold">Year {yr}</td>
                            <td className="p-2.5 text-emerald-400">{formatCurrency(annual, currency)}</td>
                            <td className="p-2.5 text-slate-300">{formatCurrency(accum, currency)}</td>
                            <td className="p-2.5 text-white font-bold">{formatCurrency(bookVal, currency)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  <strong>Journal Entry (Dec 31):</strong> Debit: Depreciation Expense | Credit: Accumulated Depreciation. Accumulated Depreciation is reported on the Statement of Financial Position (SFP) as a contra-asset deduction from Property, Plant & Equipment.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. GRAPHS & COORDINATE PLOTTER CALCULATOR */}
      {activeCalc === 'graphs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="lg:col-span-5 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-amber-400" />
                Graphs & Function Curve Plotter
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Plot quadratic parabolas and linear equations, calculate vertices, roots, intercepts, and coordinate tables.
              </p>
            </div>

            {/* Mode toggle: Quadratic vs Linear */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setGraphMode('quadratic')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  graphMode === 'quadratic'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Parabola: $y = ax^2 + bx + c$
              </button>
              <button
                type="button"
                onClick={() => setGraphMode('linear')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  graphMode === 'linear'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Line: $y = mx + b$
              </button>
            </div>

            {graphMode === 'quadratic' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      $a$ (Leading)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={graphA}
                      onChange={(e) => setGraphA(Number(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      $b$ (Linear)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={graphB}
                      onChange={(e) => setGraphB(Number(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      $c$ (Constant)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={graphC}
                      onChange={(e) => setGraphC(Number(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Function equation card */}
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                    Function Equation
                  </div>
                  <div className="text-base sm:text-lg font-mono text-amber-300">
                    {renderFormula(`f(x) = ${graphA === 1 ? '' : graphA === -1 ? '-' : graphA}x^2 ${graphB >= 0 ? `+ ${graphB}` : `- ${Math.abs(graphB)}`}x ${graphC >= 0 ? `+ ${graphC}` : `- ${Math.abs(graphC)}`}`)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      $m$ (Slope)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={graphLinearM}
                      onChange={(e) => setGraphLinearM(Number(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      $b$ (Y-Intercept)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={graphLinearB}
                      onChange={(e) => setGraphLinearB(Number(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                    Linear Equation
                  </div>
                  <div className="text-base sm:text-lg font-mono text-amber-300">
                    {renderFormula(`y = ${graphLinearM}x ${graphLinearB >= 0 ? `+ ${graphLinearB}` : `- ${Math.abs(graphLinearB)}`}`)}
                  </div>
                </div>
              </div>
            )}

            {/* Quick action button to send to chat */}
            {onSendToChat && (
              <button
                onClick={() => {
                  if (graphMode === 'quadratic') {
                    onSendToChat(
                      `Graph and analyze the quadratic parabola f(x) = ${graphA}x^2 + (${graphB})x + (${graphC}). Find the vertex (h, k), axis of symmetry, x-intercepts (roots), y-intercept, and coordinate points table.`
                    );
                  } else {
                    onSendToChat(
                      `Graph the linear equation y = ${graphLinearM}x + (${graphLinearB}). Find slope, x-intercept, y-intercept, and coordinate points table.`
                    );
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Cipher AI to Plot & Solve This Curve
              </button>
            )}
          </div>

          {/* Right column: Interactive Visual SVG Coordinate Graph & Analysis */}
          <div className="lg:col-span-7 space-y-4">
            {(() => {
              if (graphMode === 'quadratic') {
                const a = graphA || 1;
                const b = graphB || 0;
                const c = graphC || 0;
                const h = -b / (2 * a);
                const k = a * h * h + b * h + c;
                const disc = b * b - 4 * a * c;
                const roots =
                  disc >= 0
                    ? [
                        (-b - Math.sqrt(disc)) / (2 * a),
                        (-b + Math.sqrt(disc)) / (2 * a),
                      ]
                    : [];

                // Coordinate points from x = -3 to x = 5
                const xPoints = [-2, -1, 0, 1, 2, 3, 4, 5];
                const coords = xPoints.map((x) => ({
                  x,
                  y: a * x * x + b * x + c,
                }));

                // SVG coordinate mapping
                // Map x in [-4, 6] to svgX in [30, 390], y in [-6, 12] to svgY in [240, 20]
                const svgW = 420;
                const svgH = 260;
                const toSvgX = (x: number) => 30 + ((x - (-3)) / (6 - (-3))) * (svgW - 60);
                const toSvgY = (y: number) => 230 - ((y - (-4)) / (12 - (-4))) * (svgH - 50);

                // Build path points
                const pathD = Array.from({ length: 60 }).map((_, i) => {
                  const x = -3 + (i / 59) * 9;
                  const y = a * x * x + b * x + c;
                  const clampedY = Math.max(-5, Math.min(14, y));
                  const sx = toSvgX(x);
                  const sy = toSvgY(clampedY);
                  return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
                }).join(' ');

                return (
                  <div className="space-y-4">
                    {/* Visual SVG Coordinate Plane */}
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-1.5 px-2">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <LineChart className="w-3.5 h-3.5" />
                          Interactive Coordinate Plane
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Vertex: ({h.toFixed(2)}, {k.toFixed(2)})
                        </span>
                      </div>

                      <svg
                        viewBox={`0 0 ${svgW} ${svgH}`}
                        className="w-full h-56 bg-slate-900/60 rounded-xl"
                      >
                        {/* Grid lines */}
                        {[-2, 0, 2, 4].map((gx) => (
                          <line
                            key={`gx-${gx}`}
                            x1={toSvgX(gx)}
                            y1={15}
                            x2={toSvgX(gx)}
                            y2={svgH - 15}
                            stroke="#334155"
                            strokeWidth="0.8"
                            strokeDasharray="2,2"
                          />
                        ))}
                        {[-2, 0, 4, 8].map((gy) => (
                          <line
                            key={`gy-${gy}`}
                            x1={20}
                            y1={toSvgY(gy)}
                            x2={svgW - 20}
                            y2={toSvgY(gy)}
                            stroke="#334155"
                            strokeWidth="0.8"
                            strokeDasharray="2,2"
                          />
                        ))}

                        {/* X-Axis */}
                        <line
                          x1={20}
                          y1={toSvgY(0)}
                          x2={svgW - 20}
                          y2={toSvgY(0)}
                          stroke="#64748b"
                          strokeWidth="1.5"
                        />
                        {/* Y-Axis */}
                        <line
                          x1={toSvgX(0)}
                          y1={15}
                          x2={toSvgX(0)}
                          y2={svgH - 15}
                          stroke="#64748b"
                          strokeWidth="1.5"
                        />

                        {/* Axis Labels */}
                        <text
                          x={svgW - 30}
                          y={toSvgY(0) - 5}
                          fill="#94a3b8"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          x
                        </text>
                        <text
                          x={toSvgX(0) + 6}
                          y={25}
                          fill="#94a3b8"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          y
                        </text>

                        {/* Parabola Curve */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                        />

                        {/* Vertex Point */}
                        {h >= -3 && h <= 6 && k >= -4 && k <= 12 && (
                          <g>
                            <circle
                              cx={toSvgX(h)}
                              cy={toSvgY(k)}
                              r="5"
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                            <text
                              x={toSvgX(h) + 6}
                              y={toSvgY(k) - 6}
                              fill="#fef08a"
                              fontSize="9"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              V({h.toFixed(1)}, {k.toFixed(1)})
                            </text>
                          </g>
                        )}

                        {/* Roots (X-Intercepts) */}
                        {roots.map((r, i) => (
                          <g key={`root-${i}`}>
                            <circle
                              cx={toSvgX(r)}
                              cy={toSvgY(0)}
                              r="4"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="1"
                            />
                            <text
                              x={toSvgX(r) - 10}
                              y={toSvgY(0) + 14}
                              fill="#6ee7b7"
                              fontSize="8.5"
                              fontFamily="monospace"
                            >
                              x={r.toFixed(1)}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    {/* Features breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Vertex</span>
                        <span className="text-amber-400 font-bold">({h.toFixed(2)}, {k.toFixed(2)})</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Axis of Symmetry</span>
                        <span className="text-white font-bold">x = {h.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Roots (Zeros)</span>
                        <span className="text-emerald-400 font-bold">
                          {roots.length === 2
                            ? `${roots[0].toFixed(2)}, ${roots[1].toFixed(2)}`
                            : roots.length === 1
                            ? roots[0].toFixed(2)
                            : 'No Real Roots'}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Y-Intercept</span>
                        <span className="text-white font-bold">(0, {c.toFixed(1)})</span>
                      </div>
                    </div>

                    {/* Coordinate table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 font-mono">
                          <tr>
                            <th className="p-2 border-b border-slate-800">x</th>
                            {coords.map((c) => (
                              <th key={c.x} className="p-2 border-b border-slate-800 text-center font-bold">
                                {c.x}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-slate-900/60 font-mono text-amber-300">
                          <tr>
                            <td className="p-2 font-bold text-slate-400">f(x)</td>
                            {coords.map((c) => (
                              <td
                                key={c.x}
                                className={`p-2 text-center ${
                                  c.y === 0
                                    ? 'text-emerald-400 font-black bg-emerald-500/10'
                                    : c.x === h
                                    ? 'text-amber-300 font-black bg-amber-500/10'
                                    : ''
                                }`}
                              >
                                {c.y}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              } else {
                const m = graphLinearM || 1;
                const b = graphLinearB || 0;
                const xIntercept = m !== 0 ? -b / m : null;
                const xPoints = [-3, -2, -1, 0, 1, 2, 3, 4];
                const coords = xPoints.map((x) => ({ x, y: m * x + b }));

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Slope ($m$)</span>
                        <span className="text-amber-400 font-bold">{m}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Y-Intercept</span>
                        <span className="text-white font-bold">(0, {b})</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">X-Intercept</span>
                        <span className="text-emerald-400 font-bold">
                          {xIntercept !== null ? `(${xIntercept.toFixed(2)}, 0)` : 'None'}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 font-mono">
                          <tr>
                            <th className="p-2 border-b border-slate-800">x</th>
                            {coords.map((c) => (
                              <th key={c.x} className="p-2 border-b border-slate-800 text-center font-bold">
                                {c.x}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-slate-900/60 font-mono text-amber-300">
                          <tr>
                            <td className="p-2 font-bold text-slate-400">y</td>
                            {coords.map((c) => (
                              <td key={c.x} className="p-2 text-center">
                                {c.y}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
