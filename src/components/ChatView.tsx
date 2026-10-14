import React, { useState, useRef, useEffect } from 'react';
import {
  ChatSession,
  Message,
  TeachingMode,
  AssistantMode,
  UserUsage,
  UserProfile,
} from '../types';
import { MathRenderer } from './MathRenderer';
import { TeachingModeSelector } from './TeachingModeSelector';
import { ASSISTANT_MODES, AssistantModeSelector } from './AssistantModeSelector';
import { CipherLogo } from './CipherLogo';
import { useTheme } from '../utils/themeConfig';
import {
  Send,
  Sparkles,
  Bookmark,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
  Lock,
  AlertTriangle,
  LogIn,
  Camera,
  Image as ImageIcon,
  X,
  Maximize2,
  UploadCloud,
  Eye,
  EyeOff,
  CheckCircle2,
  LineChart,
  Download,
} from 'lucide-react';
import { GraphModal } from './GraphModal';

interface ChatViewProps {
  session: ChatSession;
  teachingMode: TeachingMode;
  onTeachingModeChange: (mode: TeachingMode) => void;
  assistantMode: AssistantMode;
  onAssistantModeChange: (mode: AssistantMode) => void;
  onSendMessage: (text: string, image?: string, mimeType?: string) => Promise<void>;
  isLoading: boolean;
  usage: UserUsage;
  profile?: UserProfile;
  isGuest?: boolean;
  onOpenAuth?: () => void;
  onBookmarkMessage: (message: Message) => void;
  onOpenReviewCenterWithCalc?: () => void;
  onOpenSubscriptionModal: () => void;
  currency: string;
  onOpenQuiz?: () => void;
  onOpenGraphModal?: () => void;
}

const GREETING_QUESTIONS = [
  'are you ready?',
  'fire away!',
  "got a question? let's jump in.",
  'what numbers are we crunching today?',
  'ready to tackle your math problem?',
  "what formula can we crack together?",
  'hit me with your toughest calculation!',
  'ready to conquer accounting and math?',
];

export const ChatView: React.FC<ChatViewProps> = ({
  session,
  teachingMode,
  onTeachingModeChange,
  assistantMode,
  onAssistantModeChange,
  onSendMessage,
  isLoading,
  usage,
  profile,
  isGuest = false,
  onOpenAuth,
  onBookmarkMessage,
  onOpenSubscriptionModal,
  currency,
  onOpenQuiz,
  onOpenGraphModal,
}) => {
  const { themeConfig } = useTheme();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [greetingIdx, setGreetingIdx] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Per-message reveal state for "Teach Me" mode
  const [revealedMessageIds, setRevealedMessageIds] = useState<Record<string, boolean>>({});

  // Homework Image attachment states
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedMimeType, setAttachedMimeType] = useState<string>('image/jpeg');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);

  const handleOpenGraphModal = () => {
    if (onOpenGraphModal) {
      onOpenGraphModal();
    } else {
      setIsGraphModalOpen(true);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Rotate greeting text every minute with a graceful fade-out and fade-in animation
  useEffect(() => {
    const timer = setInterval(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setGreetingIdx((prev) => (prev + 1) % GREETING_QUESTIONS.length);
        setIsFadingOut(false);
      }, 900); // 900ms fade transition
    }, 60000); // 60,000ms = 1 minute

    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isLoading]);

  // Extract user first name based on profile name (same as what displays on login button)
  const rawName = (profile?.isGuest ? 'Guest' : profile?.name) || 'Guest';
  const userFirstName = rawName.trim().split(/\s+/)[0] || 'Friend';

  const toggleReveal = (id: string) => {
    setRevealedMessageIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to split "Teach Me" content into method steps vs hidden final answer
  const parseTeachMeContent = (rawContent: string) => {
    const revealMatch = rawContent.match(/\[REVEAL_ANSWER\]([\s\S]*?)\[\/REVEAL_ANSWER\]/);
    if (revealMatch) {
      const steps = rawContent.replace(/\[REVEAL_ANSWER\][\s\S]*?\[\/REVEAL_ANSWER\]/, '').trim();
      const answer = revealMatch[1].trim();
      return { steps, answer };
    }

    // Secondary heuristic parsing for common headers
    const patterns = [
      /\n(?=### (?:4\.\s*)?Final (?:Answer|Conclusion))/i,
      /\n(?=#### (?:4\.\s*)?Final (?:Answer|Conclusion))/i,
      /\n(?=\*\*Final Answer:\*\*)/i,
      /\n(?=\$\$\\mathbf{\\text{Adjusted)/i,
    ];

    for (const pat of patterns) {
      const split = rawContent.split(pat);
      if (split.length > 1) {
        return {
          steps: split[0].trim(),
          answer: split.slice(1).join('\n').trim(),
        };
      }
    }

    return { steps: rawContent, answer: null };
  };

  // Handle Image File conversion to base64
  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file (e.g. photo of your homework worksheet).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAttachedImage(result);
      setAttachedMimeType(file.type || 'image/jpeg');
      setAttachedFileName(file.name || 'homework_photo.jpg');
    };
    reader.readAsDataURL(file);
  };

  // Paste Event on Input: Detects pasted image from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          setAttachedFileName('Pasted Homework Image');
        }
        break;
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;

    if (!usage.isPro && usage.remainingUses <= 0) {
      onOpenSubscriptionModal();
      return;
    }

    const msg = input.trim();
    const img = attachedImage || undefined;
    const mime = attachedMimeType || undefined;

    // Clear inputs
    setInput('');
    setAttachedImage(null);
    setAttachedFileName(null);

    onSendMessage(msg, img, mime);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    // Strip hidden tags when copying
    const clean = text.replace(/\[\/?REVEAL_ANSWER\]/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-To-Speech reader
  const handleToggleSpeech = (id: string, text: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\[\/?REVEAL_ANSWER\]/g, ' ')
      .replace(/\$\$[\s\S]*?\$\$/g, ' formula omitted for audio ')
      .replace(/\$[^\$]+?\$/g, ' ')
      .replace(/[*#|_-]/g, ' ')
      .substring(0, 800);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const isLimitReached = !usage.isPro && usage.remainingUses <= 0;

  return (
    <div
      className={`flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full px-3 sm:px-6 transition-colors duration-200 ${themeConfig.classes.textMain}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Session Title Bar (top teach me and direct answer buttons removed as requested) */}
      <div
        className={`py-3 border-b flex items-center justify-between gap-2 shrink-0 ${themeConfig.classes.border}`}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{session.title}</span>
            {isGuest && (
              <span className="shrink-0 text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Unsaved Guest
              </span>
            )}
          </h2>
          <div className="text-[11px] flex items-center gap-2 mt-0.5 opacity-80">
            <span>Specialization: {ASSISTANT_MODES.find((m) => m.id === assistantMode)?.label}</span>
          </div>
        </div>
      </div>

      {/* Guest Mode Notification Banner */}
      {isGuest && (
        <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Guest Mode:</strong> Conversations are not saved. Sign in with Gmail to save your calculation history.
            </span>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-[11px] flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <LogIn className="w-3 h-3 text-sky-600" />
              Sign in with Gmail
            </button>
          )}
        </div>
      )}

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-x-4 top-20 bottom-24 z-40 rounded-3xl border-2 border-dashed border-sky-400 bg-sky-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-white animate-fadeIn pointer-events-none">
          <UploadCloud className="w-12 h-12 text-sky-400 mb-2 animate-bounce" />
          <h3 className="text-lg font-bold">Drop Your Homework Photo Here</h3>
          <p className="text-xs text-slate-300">
            Cipher AI will extract the equations and solve it step-by-step
          </p>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-5 space-y-6 scrollbar-thin">
        {session.messages.length === 0 ? (
          /* HOME UI: Minimal, clean, animated personalized greeting that fades every minute */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-xl mx-auto select-none">
            <div
              className={`w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-xl transition-all animate-fadeInSlow ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
            >
              <CipherLogo className={`w-10 h-10 ${themeConfig.classes.accentText}`} />
            </div>

            <div
              className={`space-y-3.5 text-center transition-all duration-1000 ease-in-out ${
                isFadingOut
                  ? 'opacity-0 translate-y-2'
                  : 'opacity-100 translate-y-0 animate-fadeInSlow'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Welcome, {userFirstName}!</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-snug">
                Hey {userFirstName}, {GREETING_QUESTIONS[greetingIdx]}
              </h3>

              <p className="text-xs sm:text-sm leading-relaxed opacity-80 max-w-md mx-auto">
                Cipher AI is ready for your {ASSISTANT_MODES.find((m) => m.id === assistantMode)?.label || 'Math & Accounting'} problems. Snap a photo of your homework worksheet, paste an image, or type your equations below!
              </p>
            </div>
          </div>
        ) : (
          session.messages.map((message) => {
            const isUser = message.role === 'user';
            const isDirectAnswer = message.teachingMode === 'direct';
            const { steps, answer } = parseTeachMeContent(message.content);
            const isRevealed = !!revealedMessageIds[message.id];

            return (
              <div
                key={message.id}
                className={`flex gap-3 sm:gap-4 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-1 shadow-sm ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
                  >
                    <CipherLogo className={`w-5 h-5 ${themeConfig.classes.accentText}`} />
                  </div>
                )}

                <div
                  className={`relative rounded-3xl p-4 sm:p-5 max-w-[92%] sm:max-w-[85%] ${
                    isUser
                      ? `${themeConfig.classes.accentBtn} rounded-tr-sm shadow-md`
                      : `${themeConfig.classes.bgCard} border ${themeConfig.classes.border} rounded-tl-sm shadow-lg`
                  }`}
                >
                  {/* Assistant response badges */}
                  {!isUser && (
                    <div
                      className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3 ${themeConfig.classes.border}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${themeConfig.classes.accentBadge}`}
                        >
                          {message.assistantMode?.toUpperCase() || 'MATH'}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                            isDirectAnswer
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          }`}
                        >
                          {isDirectAnswer ? '⚡ Direct Answer' : '🎓 Teach Me'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleSpeech(message.id, message.content)}
                          className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                          title={speakingId === message.id ? 'Stop Audio' : 'Read Aloud'}
                        >
                          {speakingId === message.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(message.id, message.content)}
                          className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                          title="Copy Markdown"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => onBookmarkMessage(message)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            message.bookmarked
                              ? 'text-amber-400 bg-amber-400/10'
                              : 'opacity-70 hover:opacity-100 hover:text-amber-300'
                          }`}
                          title="Save to Review Center"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Homework Image OR Generated Graph Image Preview inside bubble */}
                  {message.imageUrl && (
                    <div className="mb-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-90 flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 ${isUser ? 'opacity-80' : 'text-amber-400'}`}>
                          {isUser ? <Camera className="w-3.5 h-3.5" /> : <LineChart className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{isUser ? 'Attached Homework Problem' : 'Generated Coordinate Graph'}</span>
                        </span>
                        {!isUser && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = message.imageUrl!;
                                link.download = `cipher_graph_${message.id}.svg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                              title="Download Graph Image"
                            >
                              <Download className="w-3 h-3 text-amber-400" />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={() => setZoomImage(message.imageUrl!)}
                              className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                              title="Enlarge Graph"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>Zoom</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={`relative group rounded-2xl overflow-hidden border ${isUser ? 'max-w-sm border-white/20 bg-black/40' : 'border-amber-500/30 bg-slate-950 shadow-lg'}`}>
                        <img
                          src={message.imageUrl}
                          alt={isUser ? 'Homework Problem' : 'Generated Coordinate Graph'}
                          className={`w-full ${isUser ? 'max-h-56' : 'max-h-80'} object-contain rounded-xl cursor-pointer`}
                          onClick={() => setZoomImage(message.imageUrl!)}
                        />
                        {isUser && (
                          <button
                            onClick={() => setZoomImage(message.imageUrl!)}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Enlarge Image"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Content: Direct Answer vs Teach Me with Reveal Button */}
                  {isUser ? (
                    <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                  ) : isDirectAnswer ? (
                    /* DIRECT ANSWER MODE: Shows answer only, nothing more nothing less */
                    <div className="text-base sm:text-lg font-bold font-mono tracking-wide py-1">
                      <MathRenderer content={message.content} />
                    </div>
                  ) : (
                    /* TEACH ME MODE: Shows how it is done, with Reveal Button to show the answer */
                    <div className="space-y-4">
                      {/* Step-by-step breakdown (how it is done) */}
                      <MathRenderer content={steps} />

                      {/* Reveal Answer component */}
                      {answer && (
                        <div className="mt-4 pt-3 border-t border-dashed border-white/20">
                          {!isRevealed ? (
                            <div
                              className={`p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${themeConfig.classes.bgInput} ${themeConfig.classes.border} border`}
                            >
                              <div className="flex items-center gap-2.5 text-xs opacity-90">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                                  <EyeOff className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold">Final Answer Hidden</div>
                                  <div className="text-[11px] opacity-75">
                                    Work through the steps above, then reveal to verify your calculation!
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleReveal(message.id)}
                                className={`h-8 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0 ${themeConfig.classes.accentBtn}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Reveal Answer</span>
                              </button>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-inner animate-fadeIn">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Final Answer</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleReveal(message.id)}
                                  className="text-[11px] opacity-70 hover:opacity-100 flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                                  title="Hide answer again"
                                >
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hide</span>
                                </button>
                              </div>
                              <MathRenderer content={answer} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] mt-2 text-right opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isUser && (
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
                  >
                    {isGuest ? 'G' : userFirstName.charAt(0)}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 justify-start">
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-1 shadow-sm ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
            >
              <CipherLogo className={`w-5 h-5 ${themeConfig.classes.accentText} animate-spin`} />
            </div>
            <div
              className={`rounded-3xl p-4 sm:p-5 rounded-tl-sm flex items-center gap-3 border shadow-md ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
            >
              <RefreshCw className={`w-4 h-4 ${themeConfig.classes.accentText} animate-spin`} />
              <span className="text-xs sm:text-sm font-medium">
                Cipher is computing {teachingMode === 'direct' ? 'direct answer' : 'step-by-step breakdown'}...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 pb-4 pt-2">
        {/* Daily limit reached banner */}
        {isLimitReached ? (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold">
                  24-Hour Free Usage Limit Reached (15/15)
                </div>
                <div className="text-xs opacity-70">
                  You have used all 15 free calculations for this 24-hour cycle. Resets in {Math.floor(usage.resetInMs / 3600000)}h {Math.floor((usage.resetInMs % 3600000) / 60000)}m.
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSubscriptionModal}
              className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all shrink-0 ${themeConfig.classes.accentBtn}`}
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade to Pro (Unlimited)
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`relative border rounded-3xl p-3 sm:p-4 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-sky-500/40 ${themeConfig.classes.bgCard} ${themeConfig.classes.border}`}
          >
            {/* Hidden file inputs for Camera and Photo Browse */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processImageFile(e.target.files[0]);
                }
              }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processImageFile(e.target.files[0]);
                }
              }}
            />

            {/* Attached Homework Image Preview above input */}
            {attachedImage && (
              <div
                className={`mb-3 p-2.5 rounded-2xl border flex items-center justify-between gap-3 animate-fadeIn ${themeConfig.classes.bgInput} ${themeConfig.classes.border}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black">
                    <img
                      src={attachedImage}
                      alt="Homework"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      <span>{attachedFileName || 'Homework Photo Attached'}</span>
                    </div>
                    <div className="text-[10px] opacity-70">
                      Cipher will extract and solve the math problem from this image
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedImage(null);
                    setAttachedFileName(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors shrink-0"
                  title="Remove attached photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Aligned Output Controls: Mode selector on left, Teach Me / Direct Answer on right */}
            <div
              className={`flex flex-wrap items-center justify-between gap-2.5 border-b pb-2 mb-2 ${themeConfig.classes.border}`}
            >
              <div className="flex items-center gap-2 overflow-x-auto min-w-0">
                <AssistantModeSelector
                  currentMode={assistantMode}
                  onChange={(mode) => {
                    onAssistantModeChange(mode);
                    if (mode === 'graphs') {
                      handleOpenGraphModal();
                    }
                  }}
                  onOpenGraphModal={handleOpenGraphModal}
                  compact
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] opacity-60 font-medium">Output:</span>
                <TeachingModeSelector
                  mode={teachingMode}
                  onChange={onTeachingModeChange}
                  compact
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Type your math problem, or paste an image of your homework (Ctrl+V / Cmd+V)..."
                rows={2}
                disabled={isLoading}
                className="w-full bg-transparent text-sm placeholder-slate-500 focus:outline-none resize-none max-h-32"
              />

              {/* Cleanly aligned Action Buttons: Graph, Camera, Photo Upload & Submit */}
              <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                <button
                  type="button"
                  onClick={handleOpenGraphModal}
                  className="h-9 px-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-amber-400 transition-colors border border-transparent hover:border-slate-700 flex items-center justify-center gap-1.5 shrink-0"
                  title="Generate a Graph Image (Option)"
                >
                  <LineChart className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold hidden sm:inline text-amber-300">Graph</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-sky-400 transition-colors border border-transparent hover:border-slate-700 flex items-center justify-center shrink-0"
                  title="Take photo of homework (Camera)"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-sky-400 transition-colors border border-transparent hover:border-slate-700 flex items-center justify-center shrink-0"
                  title="Upload homework image / worksheet"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={(!input.trim() && !attachedImage) || isLoading}
                  className={`h-9 px-3.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-40 ${themeConfig.classes.accentBtn}`}
                  aria-label="Send query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className={`flex items-center justify-between mt-2 pt-2 border-t text-[10px] opacity-60 font-mono ${themeConfig.classes.border}`}
            >
              <span className="hidden sm:inline">
                Enter to calculate • Paste image (Ctrl+V) or click camera to snap homework
              </span>
              <span className="sm:hidden">Enter to solve • Paste/snap image</span>

              <div className="flex items-center gap-2">
                <span>{usage.isPro ? 'Pro Unlimited' : `${usage.remainingUses} / 15 free uses left`}</span>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Lightbox Zoom Modal for Homework Images */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/70 text-white hover:bg-black transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage}
              alt="Enlarged Homework Problem"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}

      {/* Graph Option Modal (local fallback if no parent modal handler) */}
      {!onOpenGraphModal && (
        <GraphModal
          isOpen={isGraphModalOpen}
          onClose={() => setIsGraphModalOpen(false)}
          onSendToChat={(prompt, graphImageUrl) => {
            onSendMessage(prompt, graphImageUrl, 'image/svg+xml');
          }}
        />
      )}
    </div>
  );
};
