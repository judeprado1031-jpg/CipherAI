export type TeachingMode = 'teach' | 'direct';

export type AssistantMode =
  | 'fabm'
  | 'business_math'
  | 'general_math'
  | 'mathematics'
  | 'graphs'
  | 'cfo'
  | 'quant'
  | 'operations';

export type ColorTheme =
  | 'navy'
  | 'obsidian'
  | 'emerald'
  | 'gold'
  | 'cyber'
  | 'light'
  | 'white_black'
  | 'white_pink'
  | 'black_purple'
  | 'green_black'
  | 'crimson_black'
  | 'white_cyan'
  | 'midnight_mint'
  | 'royal_gold'
  | 'custom';

export interface CustomThemeData {
  name: string;
  bgColor: string;
  cardColor: string;
  accentColor: string;
  isLight: boolean;
}

export interface ThemeConfig {
  id: ColorTheme;
  name: string;
  badge: string;
  primaryColor: string;
  accentColor: string;
  bgDark: string;
  isLight?: boolean;
  isCustom?: boolean;
  classes: {
    bgApp: string;
    bgSidebar: string;
    bgHeader: string;
    bgCard: string;
    bgCardHover: string;
    bgInput: string;
    border: string;
    accentBtn: string;
    accentText: string;
    accentBadge: string;
    textMain: string;
    textMuted: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  teachingMode?: TeachingMode;
  assistantMode?: AssistantMode;
  timestamp: number;
  imageUrl?: string;
  imageMimeType?: string;
  bookmarked?: boolean;
  topic?: string;
  financialMetrics?: {
    label: string;
    value: string;
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  assistantMode: AssistantMode;
  defaultTeachingMode: TeachingMode;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface ReviewItem {
  id: string;
  title: string;
  category:
    | 'FABM Accounting'
    | 'Business Mathematics'
    | 'General Mathematics'
    | 'Mathematics'
    | 'Graphs & Plotting'
    | 'Math Tutor'
    | 'Corporate Finance'
    | 'Pricing & Ops'
    | 'Quantitative'
    | 'General Math'
    | 'Accounting (FABM)';
  problem: string;
  solution: string;
  formula: string;
  tags: string[];
  savedAt: number;
  notes?: string;
}

export interface UserUsage {
  isPro: boolean;
  remainingUses: number;
  totalLimit: number;
  usedInLast24h: number;
  resetInMs: number;
  nextResetTime: number | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  currency: string;
  isPro: boolean;
  isGuest?: boolean;
  theme?: ColorTheme;
  authProvider?: 'google' | 'email' | 'guest';
  avatarUrl?: string;
  lastSyncedAt?: number;
}

export interface QuizQuestion {
  id?: string;
  title: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  problemStatement: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  formulaUsed: string;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  topic: string;
  sourceType: 'topic' | 'pdf';
  fileName?: string;
  questionCount: number;
  difficulty: string;
  questions: QuizQuestion[];
  createdAt: number;
}
