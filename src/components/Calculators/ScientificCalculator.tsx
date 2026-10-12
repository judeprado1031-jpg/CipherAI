import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../utils/themeConfig';
import {
  Calculator,
  Copy,
  Check,
  RotateCcw,
  History,
  Delete,
  ArrowRight,
  Divide,
  Percent,
  Plus,
  Minus,
  X as Times,
  Equal,
} from 'lucide-react';

interface ScientificCalculatorProps {
  onSendToChat?: (prompt: string) => void;
}

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  onSendToChat,
}) => {
  const { themeConfig } = useTheme();

  // State
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [isSecondMode, setIsSecondMode] = useState(false);
  const [memory, setMemory] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);

  // Focus keeper
  const containerRef = useRef<HTMLDivElement>(null);

  // Factorial helper
  const factorial = (n: number): number => {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= Math.min(n, 170); i++) res *= i;
    return res;
  };

  // Safe Math Evaluator
  const evaluateExpression = (expr: string): number => {
    // Replace visual symbols with javascript math operations
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');

    // Replace scientific functions
    const isDeg = angleMode === 'DEG';

    // Handle factorial n!
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)!/g, (_, n) => `factorial(${n})`);

    // Handle trig functions according to DEG/RAD
    sanitized = sanitized.replace(/sin\(([^)]+)\)/g, (_, arg) =>
      isDeg ? `Math.sin((${arg}) * Math.PI / 180)` : `Math.sin(${arg})`
    );
    sanitized = sanitized.replace(/cos\(([^)]+)\)/g, (_, arg) =>
      isDeg ? `Math.cos((${arg}) * Math.PI / 180)` : `Math.cos(${arg})`
    );
    sanitized = sanitized.replace(/tan\(([^)]+)\)/g, (_, arg) =>
      isDeg ? `Math.tan((${arg}) * Math.PI / 180)` : `Math.tan(${arg})`
    );

    // Inverse trig
    sanitized = sanitized.replace(/asin\(([^)]+)\)/g, (_, arg) =>
      isDeg ? `(Math.asin(${arg}) * 180 / Math.PI)` : `Math.asin(${arg})`
    );
    sanitized = sanitized.replace(/acos\(([^)]+)\)/g, (_, arg) =>
      isDeg ? `(Math.acos(${arg}) * 180 / Math.PI)` : `Math.acos(${arg})`
    );
    sanitized = sanitized.replace(/atan\(([^)]+)\)/g, (_, arg) =>
      isDeg ? `(Math.atan(${arg}) * 180 / Math.PI)` : `Math.atan(${arg})`
    );

    // Powers & roots
    sanitized = sanitized.replace(/(\w+)\^(\w+)/g, 'Math.pow($1, $2)');
    sanitized = sanitized.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
    sanitized = sanitized.replace(/cbrt\(([^)]+)\)/g, 'Math.cbrt($1)');
    sanitized = sanitized.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
    sanitized = sanitized.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
    sanitized = sanitized.replace(/exp\(([^)]+)\)/g, 'Math.exp($1)');

    // Evaluate in sandboxed scope with Math & factorial
    const evalFunc = new Function('Math', 'factorial', `return (${sanitized});`);
    const val = evalFunc(Math, factorial);

    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error('Invalid calculation');
    }
    return val;
  };

  // Button Click Handlers
  const handleDigit = (digit: string) => {
    if (justCalculated) {
      setDisplay(digit);
      setExpression('');
      setJustCalculated(false);
      return;
    }

    if (display === '0' && digit !== '.') {
      setDisplay(digit);
    } else if (digit === '.' && display.includes('.')) {
      // Prevent multiple decimals
      return;
    } else {
      setDisplay((prev) => prev + digit);
    }
  };

  const handleOperator = (op: string) => {
    setJustCalculated(false);
    if (display !== '0' || expression === '') {
      setExpression((prev) => (prev ? `${prev} ${display} ${op}` : `${display} ${op}`));
      setDisplay('0');
    } else {
      // Change operator if already waiting
      setExpression((prev) => prev.slice(0, -1) + op);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setJustCalculated(false);
  };

  const handleBackspace = () => {
    if (justCalculated) {
      handleClear();
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleToggleSign = () => {
    if (display === '0') return;
    if (display.startsWith('-')) {
      setDisplay(display.substring(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handlePercent = () => {
    const num = parseFloat(display);
    if (!isNaN(num)) {
      const res = num / 100;
      setDisplay(String(res));
    }
  };

  // Scientific function direct trigger
  const handleScientificFunction = (fn: string) => {
    const num = parseFloat(display);
    if (isNaN(num)) return;

    let res: number | null = null;
    const isDeg = angleMode === 'DEG';

    switch (fn) {
      case 'sin':
        res = isDeg ? Math.sin((num * Math.PI) / 180) : Math.sin(num);
        break;
      case 'cos':
        res = isDeg ? Math.cos((num * Math.PI) / 180) : Math.cos(num);
        break;
      case 'tan':
        res = isDeg ? Math.tan((num * Math.PI) / 180) : Math.tan(num);
        break;
      case 'asin':
        res = isDeg ? (Math.asin(num) * 180) / Math.PI : Math.asin(num);
        break;
      case 'acos':
        res = isDeg ? (Math.acos(num) * 180) / Math.PI : Math.acos(num);
        break;
      case 'atan':
        res = isDeg ? (Math.atan(num) * 180) / Math.PI : Math.atan(num);
        break;
      case 'sq':
        res = Math.pow(num, 2);
        break;
      case 'cube':
        res = Math.pow(num, 3);
        break;
      case 'sqrt':
        res = num >= 0 ? Math.sqrt(num) : NaN;
        break;
      case 'cbrt':
        res = Math.cbrt(num);
        break;
      case 'ln':
        res = num > 0 ? Math.log(num) : NaN;
        break;
      case 'log':
        res = num > 0 ? Math.log10(num) : NaN;
        break;
      case 'exp':
        res = Math.exp(num);
        break;
      case '10x':
        res = Math.pow(10, num);
        break;
      case 'inv':
        res = num !== 0 ? 1 / num : NaN;
        break;
      case 'fact':
        res = factorial(num);
        break;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      default:
        break;
    }

    if (res !== null) {
      const formatted = formatNumber(res);
      setExpression(`${fn}(${display})`);
      setDisplay(formatted);
      setJustCalculated(true);

      // Add to history
      const newHistItem: HistoryItem = {
        id: 'hist_' + Date.now(),
        expression: `${fn}(${display})`,
        result: formatted,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newHistItem, ...prev.slice(0, 19)]);
    }
  };

  const handleEquals = () => {
    const fullExpr = expression ? `${expression} ${display}` : display;
    try {
      const val = evaluateExpression(fullExpr);
      const formatted = formatNumber(val);

      const newHistItem: HistoryItem = {
        id: 'hist_' + Date.now(),
        expression: fullExpr,
        result: formatted,
        timestamp: Date.now(),
      };

      setHistory((prev) => [newHistItem, ...prev.slice(0, 19)]);
      setDisplay(formatted);
      setExpression(fullExpr + ' =');
      setJustCalculated(true);
    } catch {
      setDisplay('Error');
      setJustCalculated(true);
    }
  };

  // Format number cleanly
  const formatNumber = (num: number): string => {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Infinity';
    if (Math.abs(num) < 1e-7 && num !== 0) return num.toExponential(4);
    if (Math.abs(num) >= 1e12) return num.toExponential(6);
    // Round to 8 decimal places if needed to avoid precision issues
    const rounded = Math.round(num * 1e8) / 1e8;
    return String(rounded);
  };

  // Memory Functions
  const handleMemory = (action: 'MC' | 'MR' | 'M+' | 'M-') => {
    const num = parseFloat(display);
    switch (action) {
      case 'MC':
        setMemory(null);
        break;
      case 'MR':
        if (memory !== null) {
          setDisplay(String(memory));
          setJustCalculated(true);
        }
        break;
      case 'M+':
        if (!isNaN(num)) {
          setMemory((prev) => (prev ?? 0) + num);
        }
        break;
      case 'M-':
        if (!isNaN(num)) {
          setMemory((prev) => (prev ?? 0) - num);
        }
        break;
    }
  };

  // Copy result
  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send expression to chat for AI solution
  const handleSolveInChat = () => {
    if (!onSendToChat) return;
    const prompt = expression
      ? `Solve and explain this calculation step-by-step: ${expression} ${display}`
      : `Calculate and explain step-by-step: ${display}`;
    onSendToChat(prompt);
  };

  return (
    <div
      ref={containerRef}
      className={`max-w-4xl mx-auto rounded-3xl border shadow-2xl p-4 sm:p-6 transition-colors duration-200 ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
    >
      {/* Top Header & Quick Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}
          >
            <Calculator className={`w-5 h-5 ${themeConfig.classes.accentText}`} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight leading-none">
              Scientific Calculator
            </h2>
            <div className="text-[11px] opacity-70 mt-1">
              Precision arithmetic, trigonometry, logarithms & powers
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* DEG / RAD Mode Switch */}
          <button
            type="button"
            onClick={() => setAngleMode((prev) => (prev === 'DEG' ? 'RAD' : 'DEG'))}
            className={`h-8 px-3 rounded-xl text-xs font-bold border transition-all shadow-xs ${
              angleMode === 'DEG'
                ? `${themeConfig.classes.accentBadge} border font-mono`
                : 'bg-slate-800/80 text-slate-300 border-slate-700 font-mono'
            }`}
            title="Toggle between Degrees and Radians"
          >
            {angleMode}
          </button>

          {/* 2nd Function Toggle */}
          <button
            type="button"
            onClick={() => setIsSecondMode(!isSecondMode)}
            className={`h-8 px-3 rounded-xl text-xs font-bold border transition-all shadow-xs ${
              isSecondMode
                ? `${themeConfig.classes.accentBtn}`
                : 'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}
            title="Toggle 2nd Inverse Scientific Functions"
          >
            2nd
          </button>

          {/* History Tape Toggle */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`h-8 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-xs ${
              showHistory
                ? `${themeConfig.classes.accentBadge}`
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="View calculation history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History ({history.length})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Calculator Screen and Keypad */}
        <div className={showHistory ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Dual-line Display Screen */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 text-right font-mono shadow-inner relative flex flex-col justify-between min-h-[105px] overflow-hidden ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}
          >
            {/* Top row: Status indicators & previous expression */}
            <div className="flex items-center justify-between text-xs opacity-60 mb-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10">
                  {angleMode}
                </span>
                {memory !== null && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    M: {memory}
                  </span>
                )}
                {isSecondMode && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    INV
                  </span>
                )}
              </div>
              <div className="truncate max-w-[280px] sm:max-w-md text-xs sm:text-sm">
                {expression || ''}
              </div>
            </div>

            {/* Main result number */}
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight truncate select-all py-1">
              {display}
            </div>

            {/* Quick action tools on display: Copy & Send to chat */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] opacity-75">
              <span className="text-[10px] font-sans">
                Cipher Scientific Engine
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="hover:opacity-100 flex items-center gap-1 text-[11px] font-sans"
                  title="Copy result to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {onSendToChat && (
                  <button
                    type="button"
                    onClick={handleSolveInChat}
                    className={`hover:opacity-100 flex items-center gap-1 text-[11px] font-bold font-sans ${themeConfig.classes.accentText}`}
                    title="Send this problem to Cipher AI chat for full pedagogical steps"
                  >
                    <span>Solve in Chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Memory Bar */}
          <div className="grid grid-cols-4 gap-2">
            {(['MC', 'MR', 'M+', 'M-'] as const).map((mKey) => (
              <button
                key={mKey}
                type="button"
                onClick={() => handleMemory(mKey)}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  themeConfig.classes.bgCard
                } ${themeConfig.classes.border} opacity-80 hover:opacity-100 hover:${
                  themeConfig.classes.bgCardHover
                }`}
              >
                {mKey}
              </button>
            ))}
          </div>

          {/* Scientific + Standard Keypad Matrix */}
          <div className="grid grid-cols-5 gap-2 sm:gap-2.5 select-none font-mono text-sm sm:text-base">
            {/* ROW 1 */}
            <button
              type="button"
              onClick={() => handleScientificFunction(isSecondMode ? 'asin' : 'sin')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              {isSecondMode ? 'sin⁻¹' : 'sin'}
            </button>
            <button
              type="button"
              onClick={() => handleScientificFunction(isSecondMode ? 'acos' : 'cos')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              {isSecondMode ? 'cos⁻¹' : 'cos'}
            </button>
            <button
              type="button"
              onClick={() => handleScientificFunction(isSecondMode ? 'atan' : 'tan')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              {isSecondMode ? 'tan⁻¹' : 'tan'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-3 rounded-2xl border font-bold text-xs sm:text-sm text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 transition-all"
            >
              AC
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="p-3 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center text-slate-300 bg-slate-800/80 border-slate-700 hover:bg-slate-700 transition-all"
              title="Backspace"
            >
              <Delete className="w-4 h-4" />
            </button>

            {/* ROW 2 */}
            <button
              type="button"
              onClick={() => handleScientificFunction(isSecondMode ? 'exp' : 'ln')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              {isSecondMode ? 'eˣ' : 'ln'}
            </button>
            <button
              type="button"
              onClick={() => handleScientificFunction(isSecondMode ? '10x' : 'log')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              {isSecondMode ? '10ˣ' : 'log'}
            </button>
            <button
              type="button"
              onClick={() => handleScientificFunction(isSecondMode ? 'sqrt' : 'sq')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              {isSecondMode ? '√x' : 'x²'}
            </button>
            <button
              type="button"
              onClick={() => handleOperator('^')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              xʸ
            </button>
            <button
              type="button"
              onClick={() => handleOperator('÷')}
              className={`p-3 rounded-2xl border font-bold text-base transition-all bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20 flex items-center justify-center`}
            >
              <Divide className="w-4 h-4" />
            </button>

            {/* ROW 3 */}
            <button
              type="button"
              onClick={() => handleScientificFunction('pi')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              π
            </button>
            <button
              type="button"
              onClick={() => handleDigit('7')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleDigit('8')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleDigit('9')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleOperator('×')}
              className={`p-3 rounded-2xl border font-bold text-base transition-all bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20 flex items-center justify-center`}
            >
              <Times className="w-4 h-4" />
            </button>

            {/* ROW 4 */}
            <button
              type="button"
              onClick={() => handleScientificFunction('e')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              e
            </button>
            <button
              type="button"
              onClick={() => handleDigit('4')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleDigit('5')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleDigit('6')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleOperator('−')}
              className={`p-3 rounded-2xl border font-bold text-base transition-all bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20 flex items-center justify-center`}
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* ROW 5 */}
            <button
              type="button"
              onClick={() => handleScientificFunction('fact')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              n!
            </button>
            <button
              type="button"
              onClick={() => handleDigit('1')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleDigit('2')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleDigit('3')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleOperator('+')}
              className={`p-3 rounded-2xl border font-bold text-base transition-all bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20 flex items-center justify-center`}
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* ROW 6 */}
            <button
              type="button"
              onClick={() => handleScientificFunction('inv')}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              1/x
            </button>
            <button
              type="button"
              onClick={handleToggleSign}
              className={`p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleDigit('.')}
              className={`p-3 rounded-2xl border font-bold transition-all ${themeConfig.classes.bgCard} ${themeConfig.classes.border} hover:${themeConfig.classes.bgCardHover}`}
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEquals}
              className={`p-3 rounded-2xl font-bold text-base shadow-lg transition-all flex items-center justify-center active:scale-95 ${themeConfig.classes.accentBtn}`}
            >
              <Equal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History Tape Drawer */}
        {showHistory && (
          <div
            className={`lg:col-span-4 rounded-2xl border p-4 flex flex-col justify-between max-h-[500px] overflow-hidden ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Calculation Tape</span>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Clear Tape
                  </button>
                )}
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[380px] scrollbar-thin pr-1">
                {history.length === 0 ? (
                  <div className="text-center py-10 opacity-60 text-xs">
                    No calculations recorded yet.
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setDisplay(item.result);
                        setExpression(item.expression + ' =');
                        setJustCalculated(true);
                      }}
                      className="p-2.5 rounded-xl border border-white/5 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors text-right font-mono"
                    >
                      <div className="text-[11px] opacity-70 truncate">
                        {item.expression}
                      </div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5 truncate">
                        = {item.result}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 text-[10px] opacity-50 text-center font-sans border-t border-white/10 mt-2">
              Click any past calculation to load it back onto display
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
