import React, { useState, useRef } from 'react';
import { AssistantMode, GeneratedQuiz, QuizQuestion, ReviewItem } from '../types';
import { useTheme } from '../utils/themeConfig';
import { MathRenderer } from './MathRenderer';
import { CipherLogo } from './CipherLogo';
import {
  GraduationCap,
  X,
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Plus,
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  BookOpen,
  Trophy,
  Sliders,
} from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantMode: AssistantMode;
  onSaveToReviewCenter?: (item: ReviewItem) => void;
}

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  fabm: [
    'Adjusting Entries: Accruals, Prepayments & Bad Debts',
    'Bank Reconciliation: Adjusted Balance Method',
    'Rules of Debit and Credit & Accounting Cycle',
    'Periodic vs Perpetual Merchandising & Cost of Sales',
    'Depreciation: Straight-Line & Book Value',
    'Financial Statements: SFP & SCI Analysis',
  ],
  business_math: [
    'Simple Interest vs Compound Interest ($I = Prt$)',
    'Markup on Cost vs Markup on Selling Price',
    'Trade Discounts & Series Discounts (e.g. 20/10/5)',
    'Break-Even Point in Units and Revenue Dollars',
    'Ordinary Annuity & Sinking Funds',
    'Payroll Computations, Gross Earnings & Deductions',
  ],
  general_math: [
    'Rational Functions, Equations & Asymptotes',
    'Exponential Growth and Decay Real-World Models',
    'Logarithmic Equations & Change of Base',
    'Propositional Logic, Conditionals & Truth Tables',
    'Business & Consumer Loan Amortization',
  ],
  mathematics: [
    'Calculus: Derivatives via Power & Chain Rules',
    'Calculus: Limits & Continuity Evaluation',
    'Indefinite and Definite Integration & Area Under Curves',
    'Quadratic Functions, Roots & Discriminant Analysis',
    'Trigonometric Identities & Sine/Cosine Laws',
  ],
  graphs: [
    'Linear Equations: Slope-Intercept & Point-Slope',
    'Quadratic Parabolas: Vertex, Roots & Symmetry',
    'Rational Curves: Vertical & Horizontal Asymptotes',
    'Systems of Equations: Graphical Intersections',
  ],
};

const QUESTION_COUNT_OPTIONS = [
  { count: 3, label: '3 Questions', desc: 'Quick Check (2 mins)' },
  { count: 5, label: '5 Questions', desc: 'Standard Practice (Recommended)' },
  { count: 10, label: '10 Questions', desc: 'Comprehensive Test (15 mins)' },
  { count: 15, label: '15 Questions', desc: 'Deep Exam Prep (25 mins)' },
  { count: 20, label: '20 Questions', desc: 'Full Mock Exam (40 mins)' },
];

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  assistantMode,
  onSaveToReviewCenter,
}) => {
  const { themeConfig } = useTheme();

  // Mode: setup | taking | results
  const [phase, setPhase] = useState<'setup' | 'taking' | 'results'>('setup');

  // Setup Form states
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Quiz states
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [savedReviewIndices, setSavedReviewIndices] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle PDF file selection
  const handlePdfSelected = (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please select a valid PDF file.');
      return;
    }
    setErrorMsg(null);
    setPdfFile(file);
    setPdfFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPdfDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate Quiz API call
  const handleGenerateQuiz = async () => {
    const activeTopic = topic.trim() || (pdfFileName ? `PDF: ${pdfFileName}` : 'Accounting & Mathematics');
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic,
          pdfData: pdfDataUrl || undefined,
          pdfFileName: pdfFileName || undefined,
          questionCount,
          difficulty,
          assistantMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const data: GeneratedQuiz = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions generated. Please try again.');
      }

      setQuiz(data);
      setCurrentIdx(0);
      setUserAnswers({});
      setSavedReviewIndices({});
      setPhase('taking');
    } catch (err: any) {
      console.error('Quiz creation failure:', err);
      setErrorMsg(err.message || 'Failed to create quiz. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Answer selection handler
  const handleSelectAnswer = (optionIdx: number) => {
    if (userAnswers[currentIdx] !== undefined) return; // already answered
    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIdx,
    }));
  };

  // Bookmark / save question to review center
  const handleBookmarkQuestion = (q: QuizQuestion, index: number) => {
    if (!onSaveToReviewCenter) return;
    const item: ReviewItem = {
      id: 'quiz_rev_' + Date.now() + '_' + index,
      title: q.title || `Quiz Problem #${index + 1}`,
      category: 'FABM Accounting',
      problem: q.problemStatement,
      solution: q.explanation,
      formula: q.formulaUsed || '',
      tags: [q.topic || 'Quiz Practice', difficulty],
      savedAt: Date.now(),
      notes: `Generated from Quiz (${q.difficulty}). Correct option: ${q.options[q.correctIndex]}`,
    };
    onSaveToReviewCenter(item);
    setSavedReviewIndices((prev) => ({ ...prev, [index]: true }));
  };

  // Score calculation
  const totalQuestions = quiz?.questions.length || 0;
  const correctCount = quiz
    ? quiz.questions.reduce((acc, q, i) => (userAnswers[i] === q.correctIndex ? acc + 1 : acc), 0)
    : 0;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const currentQ = quiz?.questions[currentIdx];
  const hasAnsweredCurrent = userAnswers[currentIdx] !== undefined;

  const suggestions = TOPIC_SUGGESTIONS[assistantMode] || TOPIC_SUGGESTIONS.fabm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-main)',
        }}
      >
        {/* Top Header Bar */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-header)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-md ${themeConfig.classes.bgInput}`}
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <CipherLogo className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>Cipher AI Quiz</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Interactive Practice
                </span>
              </div>
              <div className="text-[11px] opacity-75">
                Practice topic concepts or test yourself on an uploaded PDF document
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {/* ===================== PHASE 1: SETUP FORM ===================== */}
          {phase === 'setup' && (
            <div className="space-y-6">
              {/* Option A: Type Topic */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>1. Type Your Topic (or pick a suggestion below)</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. FABM Accounting Adjusting Entries, Simple & Compound Interest, Derivatives, Rational Functions..."
                  className="w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none transition-all shadow-inner"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                />

                {/* Quick Topic Chips */}
                <div className="pt-1.5">
                  <div className="text-[11px] font-semibold opacity-70 mb-1.5">
                    Recommended topics for {assistantMode.toUpperCase()}:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTopic(sug)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all text-left shadow-xs ${
                          topic === sug
                            ? `${themeConfig.classes.accentBtn} font-bold border-transparent`
                            : 'opacity-75 hover:opacity-100 hover:border-slate-400'
                        }`}
                        style={{
                          backgroundColor: topic === sug ? undefined : 'var(--bg-input)',
                          borderColor: topic === sug ? undefined : 'var(--border-subtle)',
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option B: Insert / Upload PDF File */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>2. Or Insert a PDF File About The Topic</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePdfSelected(e.target.files[0]);
                    }
                  }}
                />

                {pdfFile ? (
                  <div
                    className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-sm animate-fadeIn"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate">{pdfFileName}</div>
                        <div className="text-[10px] opacity-70">
                          {(pdfFile.size / 1024).toFixed(1)} KB • PDF Document Attached
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        setPdfDataUrl(null);
                        setPdfFileName(null);
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors shrink-0"
                      title="Remove PDF"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer hover:border-purple-400 transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-input)',
                    }}
                  >
                    <UploadCloud className="w-7 h-7 text-purple-400" />
                    <div className="text-xs font-bold">
                      Click to upload syllabus, reviewer, or lecture PDF
                    </div>
                    <div className="text-[11px] opacity-70">
                      Cipher AI will read the formulas, problems, and concepts directly from your file
                    </div>
                  </div>
                )}
              </div>

              {/* Number of Questions Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>3. How Many Questions Do You Want?</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {QUESTION_COUNT_OPTIONS.map((opt) => (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setQuestionCount(opt.count)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 shadow-sm ${
                        questionCount === opt.count
                          ? `${themeConfig.classes.accentBtn} font-bold border-transparent`
                          : 'opacity-75 hover:opacity-100 hover:border-slate-400'
                      }`}
                      style={{
                        backgroundColor: questionCount === opt.count ? undefined : 'var(--bg-input)',
                        borderColor: questionCount === opt.count ? undefined : 'var(--border-subtle)',
                      }}
                    >
                      <div className="text-sm font-extrabold">{opt.count} Questions</div>
                      <div className="text-[9px] opacity-75">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80">
                  4. Difficulty Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Foundational', 'Intermediate', 'Advanced', 'Mixed Exam'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        difficulty === diff
                          ? `${themeConfig.classes.accentBadge} font-bold border`
                          : 'opacity-75 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: difficulty === diff ? undefined : 'var(--border-subtle)',
                        backgroundColor: difficulty === diff ? undefined : 'var(--bg-input)',
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Callout */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              {/* Submit / Generate Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || (!topic.trim() && !pdfFile)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.99] disabled:opacity-40 ${themeConfig.classes.accentBtn}`}
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>
                    {isGenerating
                      ? 'Cipher AI is Analyzing & Generating Questions...'
                      : `Start Quiz (${questionCount} Questions)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== PHASE 2: TAKING THE QUIZ ===================== */}
          {phase === 'taking' && quiz && currentQ && (
            <div className="space-y-5 animate-fadeIn">
              {/* Progress Bar & Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: 'var(--badge-bg)',
                        borderColor: 'var(--badge-border)',
                        color: 'var(--badge-text)',
                      }}
                    >
                      Question {currentIdx + 1} of {totalQuestions}
                    </span>
                    <span className="opacity-75 text-[11px] truncate max-w-[200px] sm:max-w-xs">
                      {currentQ.topic || quiz.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="opacity-70">Answered:</span>
                    <span className="font-mono font-bold">
                      {Object.keys(userAnswers).length} / {totalQuestions}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--border-subtle)' }}
                >
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Problem Title & Statement */}
              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-3 shadow-md"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="text-base sm:text-lg font-bold tracking-tight">
                  {currentQ.title}
                </div>

                <div className="text-sm leading-relaxed">
                  <MathRenderer content={currentQ.problemStatement} />
                </div>
              </div>

              {/* 4 Interactive Option Cards */}
              <div className="space-y-2.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                  Select the best answer:
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = userAnswers[currentIdx] === optIdx;
                    const isCorrect = hasAnsweredCurrent && optIdx === currentQ.correctIndex;
                    const isWrong = isSelected && !isCorrect;

                    let cardBorder = 'var(--border-subtle)';
                    let cardBg = 'var(--bg-card)';
                    let cardColor = 'var(--text-main)';

                    if (isCorrect) {
                      cardBorder = '#22c55e';
                      cardBg = 'rgba(34, 197, 94, 0.12)';
                      cardColor = '#86efac';
                    } else if (isWrong) {
                      cardBorder = '#ef4444';
                      cardBg = 'rgba(239, 68, 68, 0.12)';
                      cardColor = '#fca5a5';
                    } else if (isSelected) {
                      cardBorder = 'var(--color-primary)';
                      cardBg = 'var(--badge-bg)';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectAnswer(optIdx)}
                        disabled={hasAnsweredCurrent}
                        className="p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between group shadow-sm disabled:cursor-default"
                        style={{
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                          color: cardColor,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 font-bold text-xs"
                            style={{
                              borderColor: isSelected || isCorrect ? cardBorder : 'var(--border-subtle)',
                              backgroundColor: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : undefined,
                              color: isCorrect || isWrong ? '#ffffff' : undefined,
                            }}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug pt-0.5">{opt}</span>
                        </div>

                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                        {isWrong && <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instant Step-by-Step Pedagogical Explanation */}
              {hasAnsweredCurrent && (
                <div
                  className="p-4 sm:p-5 rounded-2xl border space-y-3 animate-fadeIn shadow-lg"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>Cipher Step-by-Step Solution & Rule</span>
                    </div>

                    {onSaveToReviewCenter && (
                      <button
                        type="button"
                        onClick={() => handleBookmarkQuestion(currentQ, currentIdx)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                          savedReviewIndices[currentIdx]
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'hover:border-slate-400'
                        }`}
                        style={{
                          backgroundColor: savedReviewIndices[currentIdx] ? undefined : 'var(--bg-card)',
                          borderColor: savedReviewIndices[currentIdx] ? undefined : 'var(--border-subtle)',
                        }}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>
                          {savedReviewIndices[currentIdx] ? 'Saved to Review Center' : 'Save for Review'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm leading-relaxed">
                    <MathRenderer content={currentQ.explanation} />
                  </div>

                  {currentQ.formulaUsed && (
                    <div
                      className="pt-2 border-t text-xs font-mono"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <MathRenderer content={currentQ.formulaUsed} />
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Controls */}
              <div
                className="pt-3 border-t flex items-center justify-between gap-3"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold disabled:opacity-30 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {currentIdx < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx((prev) => prev + 1)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${themeConfig.classes.accentBtn}`}
                    >
                      <span>Next Problem</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPhase('results')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all shadow-emerald-600/30"
                    >
                      <span>Finish & View Score</span>
                      <Trophy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===================== PHASE 3: QUIZ RESULTS ===================== */}
          {phase === 'results' && quiz && (
            <div className="space-y-6 animate-fadeIn">
              {/* Score Summary Box */}
              <div
                className="p-6 rounded-3xl border text-center space-y-3 shadow-xl"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                  <Trophy className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-black tracking-tight">Quiz Complete!</h3>
                  <p className="text-xs opacity-75 mt-0.5">{quiz.title}</p>
                </div>

                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="text-center">
                    <div className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>
                      {correctCount} / {totalQuestions}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                      Score ({scorePercent}%)
                    </div>
                  </div>

                  <div className="h-10 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />

                  <div className="text-center">
                    <div className="text-sm font-bold">
                      {scorePercent >= 80 ? 'Outstanding! 🌟' : scorePercent >= 60 ? 'Good Effort! 👍' : 'Review Needed 📚'}
                    </div>
                    <div className="text-[10px] opacity-70">
                      {scorePercent >= 80
                        ? 'Mastery demonstrated'
                        : 'Review step-by-step breakdown below'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown of Every Question */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                  Detailed Question Review:
                </div>

                <div className="space-y-3">
                  {quiz.questions.map((q, idx) => {
                    const picked = userAnswers[idx];
                    const isCorrect = picked === q.correctIndex;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border space-y-2 shadow-xs"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: isCorrect ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                        }}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span>Question {idx + 1}: {q.title}</span>
                          </div>

                          {onSaveToReviewCenter && (
                            <button
                              type="button"
                              onClick={() => handleBookmarkQuestion(q, idx)}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 transition-colors ${
                                savedReviewIndices[idx]
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'hover:border-slate-400'
                              }`}
                              style={{
                                backgroundColor: savedReviewIndices[idx] ? undefined : 'var(--bg-input)',
                                borderColor: savedReviewIndices[idx] ? undefined : 'var(--border-subtle)',
                              }}
                            >
                              <Bookmark className="w-3 h-3" />
                              <span>{savedReviewIndices[idx] ? 'Saved' : 'Save'}</span>
                            </button>
                          )}
                        </div>

                        <div className="text-xs leading-relaxed opacity-90">
                          <MathRenderer content={q.problemStatement} />
                        </div>

                        <div
                          className="p-2.5 rounded-xl border text-xs space-y-1"
                          style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="opacity-70">Your Answer:</span>
                            <span
                              className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}
                            >
                              {picked !== undefined ? q.options[picked] : 'Unanswered'}
                            </span>
                          </div>

                          {!isCorrect && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-400 font-bold">
                              <span>Correct Answer:</span>
                              <span>{q.options[q.correctIndex]}</span>
                            </div>
                          )}

                          <div className="pt-1.5 mt-1 border-t text-[11px] leading-relaxed opacity-85" style={{ borderColor: 'var(--border-subtle)' }}>
                            <MathRenderer content={q.explanation} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserAnswers({});
                    setCurrentIdx(0);
                    setPhase('taking');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake This Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPhase('setup');
                    setUserAnswers({});
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${themeConfig.classes.accentBtn}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Quiz</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
