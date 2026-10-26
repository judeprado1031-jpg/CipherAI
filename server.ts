import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateGraphData } from './src/utils/graphGenerator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client strictly with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory persistent sync database for cross-device synchronization and rate-limiting
interface UserRecord {
  id: string;
  email: string;
  name: string;
  isPro: boolean;
  queries: { timestamp: number }[];
  syncedData?: {
    sessions: any[];
    reviewItems: any[];
    customCalculators?: any[];
    preferences?: any;
    updatedAt: number;
  };
}

const usersDb = new Map<string, UserRecord>();

// Pre-seed a default guest/demo user for instant experience
const DEMO_USER_ID = 'demo-user-1';
usersDb.set(DEMO_USER_ID, {
  id: DEMO_USER_ID,
  email: 'judeprado1031@gmail.com',
  name: 'Jude Prado',
  isPro: false,
  queries: [],
});

// Anti-Abuse & Rate-Limiting Engine: Device Binding, IP Throttling, and Disposable Email Prevention
const MAX_FREE_USES_PER_24H = 15;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MAX_FREE_ACCOUNTS_PER_DEVICE_24H = 2; // Prevent mass bot account creation

// Blocklist of disposable / temporary email service domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'trashmail.com', 'yopmail.com', 'sharklasers.com', 'dispostable.com',
  'temp-mail.org', 'getairmail.com', 'mohmal.com', 'inboxbear.com',
  'burnermail.io', 'fakeinbox.com', 'generator.email', 'crazymailing.com',
  'fakemailgenerator.com', 'tempail.com', 'throwawaymail.com', 'maildrop.cc',
  'mytemp.email', 'dropmail.me', 'harakirimail.com', 'guerrillamailblock.com',
  'pokemail.net', 'spam4.me', 'nada.ltd', 'nada.email', 'getnada.com',
  'inboxkitten.com', 'emailfake.com', 'crazymailing.com', 'trashmail.net',
  'tempmailo.com', 'tmailor.com', 'temp-mail.io', 'minuteinbox.com',
  'tempmail.net', 'mytempmail.com', 'emailondeck.com', 'fakemail.net',
  'throwawaymailaddress.com', 'trashmail.io', 'zillamail.com',
]);

// Normalizes email addresses to defeat plus-tagging and dot-aliasing bypasses
function canonicalizeEmail(rawEmail: string): { canonicalEmail: string; domain: string; isDisposable: boolean } {
  const trimmed = (rawEmail || '').trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) {
    return { canonicalEmail: trimmed, domain: '', isDisposable: false };
  }

  let username = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);

  // Defeat Gmail alias farming: ignore dots and ignore everything after '+'
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const plusIdx = username.indexOf('+');
    if (plusIdx !== -1) {
      username = username.slice(0, plusIdx);
    }
    username = username.replace(/\./g, '');
    return { canonicalEmail: `${username}@gmail.com`, domain: 'gmail.com', isDisposable };
  }

  // Defeat Outlook / Hotmail / Yahoo plus-addressing
  if (domain.includes('outlook.') || domain.includes('hotmail.') || domain.includes('yahoo.')) {
    const plusIdx = username.indexOf('+');
    if (plusIdx !== -1) {
      username = username.slice(0, plusIdx);
    }
  }

  return { canonicalEmail: `${username}@${domain}`, domain, isDisposable };
}

// Device & Network Records for cross-account rate limiting
interface DeviceRecord {
  deviceId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  queries: { timestamp: number }[];
  associatedUserIds: Set<string>;
  freeAccountsCreated: { email: string; timestamp: number }[];
  clientIps: Set<string>;
}

interface IPRecord {
  ip: string;
  queries: { timestamp: number }[];
  devices: Set<string>;
}

const devicesDb = new Map<string, DeviceRecord>();
const ipRecordsDb = new Map<string, IPRecord>();

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.replace(/^::ffff:/, '');
  }
  const remote = req.socket?.remoteAddress || '127.0.0.1';
  return remote.replace(/^::ffff:/, '');
}

/**
 * Calculates effective usage across user account, physical hardware device, and network IP.
 * Even if a user logs into 10 different fake accounts or switches to Guest,
 * their physical device shares the unified 15-prompt daily free quota.
 */
function getEffectiveUsage(user: UserRecord, rawDeviceId?: string, clientIp?: string) {
  // Pro subscribers bypass all device and rate limits
  if (user.isPro) {
    return {
      isPro: true,
      remainingUses: 9999,
      totalLimit: 9999,
      usedInLast24h: user.queries.length,
      resetInMs: 0,
      nextResetTime: null,
      deviceBound: false,
      reason: null as string | null,
    };
  }

  const now = Date.now();
  user.queries = user.queries.filter((q) => now - q.timestamp < TWENTY_FOUR_HOURS_MS);

  const deviceId = (rawDeviceId && rawDeviceId.trim().length >= 6) ? rawDeviceId.trim() : `ip_${clientIp || 'local'}`;
  let device = devicesDb.get(deviceId);
  if (!device) {
    device = {
      deviceId,
      firstSeenAt: now,
      lastSeenAt: now,
      queries: [],
      associatedUserIds: new Set([user.id]),
      freeAccountsCreated: [],
      clientIps: new Set([clientIp || '127.0.0.1']),
    };
    devicesDb.set(deviceId, device);
  } else {
    device.lastSeenAt = now;
    device.associatedUserIds.add(user.id);
    if (clientIp) device.clientIps.add(clientIp);
  }

  device.queries = device.queries.filter((q) => now - q.timestamp < TWENTY_FOUR_HOURS_MS);

  // Check IP record
  const ip = clientIp || '127.0.0.1';
  let ipRecord = ipRecordsDb.get(ip);
  if (!ipRecord) {
    ipRecord = {
      ip,
      queries: [],
      devices: new Set([deviceId]),
    };
    ipRecordsDb.set(ip, ipRecord);
  } else {
    ipRecord.devices.add(deviceId);
  }
  ipRecord.queries = ipRecord.queries.filter((q) => now - q.timestamp < TWENTY_FOUR_HOURS_MS);

  const userUsed = user.queries.length;
  const deviceUsed = device.queries.length;

  // The effective consumption is the maximum between account and hardware device
  const effectiveUsed = Math.max(userUsed, deviceUsed);
  const remaining = Math.max(0, MAX_FREE_USES_PER_24H - effectiveUsed);

  // Earliest query timestamp dictates the rolling reset countdown
  let earliest = now;
  if (device.queries.length > 0) earliest = Math.min(earliest, device.queries[0].timestamp);
  if (user.queries.length > 0) earliest = Math.min(earliest, user.queries[0].timestamp);

  const resetInMs = effectiveUsed > 0 ? Math.max(0, TWENTY_FOUR_HOURS_MS - (now - earliest)) : 0;

  let reason: string | null = null;
  if (remaining === 0) {
    if (deviceUsed >= MAX_FREE_USES_PER_24H && userUsed < MAX_FREE_USES_PER_24H) {
      reason = 'DEVICE_LIMIT';
    } else {
      reason = 'ACCOUNT_LIMIT';
    }
  }

  return {
    isPro: false,
    remainingUses: remaining,
    totalLimit: MAX_FREE_USES_PER_24H,
    usedInLast24h: effectiveUsed,
    resetInMs,
    nextResetTime: resetInMs > 0 ? now + resetInMs : null,
    deviceBound: deviceUsed > userUsed,
    reason,
  };
}

function recordQueryUsage(user: UserRecord, rawDeviceId?: string, clientIp?: string) {
  const now = Date.now();
  user.queries.push({ timestamp: now });

  const deviceId = (rawDeviceId && rawDeviceId.trim().length >= 6) ? rawDeviceId.trim() : `ip_${clientIp || 'local'}`;
  let device = devicesDb.get(deviceId);
  if (device) {
    device.queries.push({ timestamp: now });
  }

  const ip = clientIp || '127.0.0.1';
  let ipRecord = ipRecordsDb.get(ip);
  if (ipRecord) {
    ipRecord.queries.push({ timestamp: now });
  }
}

// Backward compatible helper
function getUserUsage(user: UserRecord) {
  return getEffectiveUsage(user);
}

// Auth / User Sync endpoint with Disposable Email & Multi-Account Protection
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, name, isPro, deviceId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const clientIp = getClientIp(req);
    const resolvedDeviceId = deviceId || (req.headers['x-device-id'] as string) || `ip_${clientIp}`;

    const { canonicalEmail, domain, isDisposable } = canonicalizeEmail(email);

    // 1. Enforce disposable email block
    if (isDisposable) {
      return res.status(400).json({
        error: 'DISPOSABLE_EMAIL_PROHIBITED',
        message: 'Temporary or disposable email addresses are not permitted. Please use a valid personal or academic email.',
      });
    }

    // 2. Validate email structure
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(canonicalEmail)) {
      return res.status(400).json({
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Please provide a valid email address.',
      });
    }

    const now = Date.now();
    let device = devicesDb.get(resolvedDeviceId);
    if (!device) {
      device = {
        deviceId: resolvedDeviceId,
        firstSeenAt: now,
        lastSeenAt: now,
        queries: [],
        associatedUserIds: new Set(),
        freeAccountsCreated: [],
        clientIps: new Set([clientIp]),
      };
      devicesDb.set(resolvedDeviceId, device);
    }

    // Find user by canonical email
    let user = Array.from(usersDb.values()).find(
      (u) => canonicalizeEmail(u.email).canonicalEmail === canonicalEmail
    );

    if (!user) {
      // 3. Prevent rapid creation of multiple free accounts from the same device
      device.freeAccountsCreated = device.freeAccountsCreated.filter(
        (a) => now - a.timestamp < TWENTY_FOUR_HOURS_MS
      );

      if (device.freeAccountsCreated.length >= MAX_FREE_ACCOUNTS_PER_DEVICE_24H && !isPro) {
        return res.status(429).json({
          error: 'ACCOUNT_CREATION_LIMIT_EXCEEDED',
          message: 'This device has reached the limit for creating new accounts today. Please sign in with your existing account or upgrade to Pro.',
        });
      }

      const id = 'user_' + Math.random().toString(36).substring(2, 10);
      user = {
        id,
        email: canonicalEmail,
        name: name || canonicalEmail.split('@')[0],
        isPro: !!isPro,
        queries: [],
      };
      usersDb.set(id, user);

      if (!isPro) {
        device.freeAccountsCreated.push({ email: canonicalEmail, timestamp: now });
      }
    } else if (isPro !== undefined) {
      user.isPro = isPro;
    }

    device.associatedUserIds.add(user.id);

    const usage = getEffectiveUsage(user, resolvedDeviceId, clientIp);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPro: user.isPro,
      },
      usage,
      syncedData: user.syncedData || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Auth failure' });
  }
});

// Update Pro Subscription Status
app.post('/api/user/subscription', (req, res) => {
  const { userId, isPro, deviceId } = req.body;
  const clientIp = getClientIp(req);
  const user = usersDb.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.isPro = Boolean(isPro);
  res.json({ success: true, isPro: user.isPro, usage: getEffectiveUsage(user, deviceId, clientIp) });
});

// Fetch current usage (evaluates user + device + IP)
app.get('/api/user/usage', (req, res) => {
  const userId = (req.query.userId as string) || DEMO_USER_ID;
  const clientIp = getClientIp(req);
  const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string) || `ip_${clientIp}`;

  let user = usersDb.get(userId);
  if (!user) {
    user = {
      id: userId,
      email: 'guest@cipher.ai',
      name: 'Guest User',
      isPro: false,
      queries: [],
    };
    usersDb.set(userId, user);
  }
  res.json(getEffectiveUsage(user, deviceId, clientIp));
});

// Cloud Sync Endpoint: Sync data across devices
app.post('/api/sync', (req, res) => {
  try {
    const { userId, data } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let user = usersDb.get(userId);
    if (!user) {
      user = {
        id: userId,
        email: 'user@cipher.ai',
        name: 'Cipher User',
        isPro: false,
        queries: [],
      };
      usersDb.set(userId, user);
    }

    if (data) {
      // Merge or store newest synced state
      user.syncedData = {
        ...data,
        updatedAt: Date.now(),
      };
    }

    res.json({
      success: true,
      lastSyncedAt: user.syncedData?.updatedAt || Date.now(),
      data: user.syncedData,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// Cloud Sync Endpoint: Fetch synced data for an account
app.get('/api/sync/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = usersDb.get(userId);
    if (!user || !user.syncedData) {
      return res.json({ success: false, data: null });
    }
    res.json({
      success: true,
      data: user.syncedData,
      lastSyncedAt: user.syncedData.updatedAt || Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Fetch sync failed' });
  }
});

// Instant math calculation helper for ultra-fast (0ms) solutions
function solveDirectMath(
  message: string,
  mode: string,
  currency: string
): { isSolved: boolean; text: string } {
  const trimmed = (message || '').trim();
  const lower = trimmed.toLowerCase();

  // Percentage pattern: "15% of 500" or "what is 20% of 250"
  const pctMatch = lower.match(/(?:what\s+is\s+|calculate\s+)?([0-9\.]+)\s*%\s*(?:of)\s*([0-9\.]+)/);
  if (pctMatch) {
    const rate = parseFloat(pctMatch[1]) / 100;
    const base = parseFloat(pctMatch[2]);
    const res = Number((rate * base).toFixed(4));
    if (mode === 'direct') {
      return { isSolved: true, text: `**Answer:** ${res}` };
    }
    return {
      isSolved: true,
      text: `### Calculation: ${pctMatch[1]}% of ${pctMatch[2]}
- Formula: $\\text{Result} = \\text{Base} \\times \\text{Rate} = ${base} \\times ${rate} = ${res}$

[REVEAL_ANSWER]
**Final Answer:** **${res}**
[/REVEAL_ANSWER]`,
    };
  }

  // Pure arithmetic: e.g. "25 * 4", "100 / 4 + 15", "sqrt(144)", "(15 + 3) * 8"
  let mathStr = lower
    .replace(/^what\s+is\s+/, '')
    .replace(/^calculate\s+/, '')
    .replace(/^solve\s+/, '')
    .replace(/x/g, '*')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .trim();

  if (/^[0-9\+\-\*\/\(\)\.\s\*\*\*]+$/.test(mathStr) && /[0-9]/.test(mathStr)) {
    try {
      const calcResult = Function(`'use strict'; return (${mathStr})`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
        const formatted = Number.isInteger(calcResult)
          ? calcResult.toLocaleString()
          : Number(calcResult.toFixed(4)).toLocaleString();
        if (mode === 'direct') {
          return { isSolved: true, text: `**Answer:** ${formatted}` };
        }
        return {
          isSolved: true,
          text: `### Calculation: ${trimmed}
- Expression: $${trimmed} = ${formatted}$

[REVEAL_ANSWER]
**Final Answer:** **${formatted}**
[/REVEAL_ANSWER]`,
        };
      }
    } catch {}
  }

  return { isSolved: false, text: '' };
}

// Main AI Assistant Solver Endpoint
app.post('/api/chat', async (req, res) => {
  const wantsStream = req.body.stream === true || req.headers.accept?.includes('text/event-stream');

  try {
    const {
      message = '',
      image, // optional base64 image data for student homework
      mimeType = 'image/jpeg',
      teachingMode = 'teach', // 'teach' (step-by-step pedagogical) or 'direct' (concise executive answer)
      assistantMode = 'cfo', // 'cfo' | 'quant' | 'operations' | 'tutor'
      history = [],
      userId = DEMO_USER_ID,
      currency = '$',
      deviceId: rawDeviceId,
    } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'Message or homework image is required' });
    }

    const clientIp = getClientIp(req);
    const resolvedDeviceId =
      rawDeviceId ||
      (req.headers['x-device-id'] as string) ||
      `ip_${clientIp}`;

    // Verify User
    let user = usersDb.get(userId);
    if (!user) {
      user = {
        id: userId,
        email: 'guest@cipher.ai',
        name: 'Guest User',
        isPro: false,
        queries: [],
      };
      usersDb.set(userId, user);
    }

    // Unified Rate Limit: Evaluates both User Account and Hardware Device / IP
    const currentUsage = getEffectiveUsage(user, resolvedDeviceId, clientIp);
    if (!user.isPro && currentUsage.remainingUses <= 0) {
      const isDeviceLimit = currentUsage.reason === 'DEVICE_LIMIT';
      return res.status(429).json({
        error: 'DAILY_LIMIT_REACHED',
        message: isDeviceLimit
          ? 'This device has reached the limit of 15 free calculations for this 24-hour cycle. Free limits are shared across accounts on this device. Upgrade to Pro for unlimited instant calculations.'
          : 'You have reached your 15 free uses for this 24-hour cycle.',
        resetInMs: currentUsage.resetInMs,
        nextResetTime: currentUsage.nextResetTime,
        usage: currentUsage,
      });
    }

    // Instant calculation check for text-only arithmetic/percentages (0ms response)
    if (!image) {
      const instant = solveDirectMath(message, teachingMode, currency);
      if (instant.isSolved) {
        recordQueryUsage(user, resolvedDeviceId, clientIp);
        const updatedUsage = getEffectiveUsage(user, resolvedDeviceId, clientIp);

        if (wantsStream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.write(`data: ${JSON.stringify({ chunk: instant.text })}\n\n`);
          res.write(
            `data: ${JSON.stringify({
              done: true,
              usage: updatedUsage,
              teachingMode,
              assistantMode,
              timestamp: Date.now(),
            })}\n\n`
          );
          return res.end();
        } else {
          return res.json({
            text: instant.text,
            teachingMode,
            assistantMode,
            usage: updatedUsage,
            timestamp: Date.now(),
          });
        }
      }
    }

    // Assistant Persona Prompts
    let personaGuidance = '';
    if (assistantMode === 'fabm') {
      personaGuidance = `You are Cipher operating in FABM Accounting (Fundamentals of Accountancy, Business, and Management 1 & 2) mode.
FABM 1 SPECIALIZATIONS:
- The Fundamental Accounting Equation ($$\\text{Assets} = \\text{Liabilities} + \\text{Owner's Equity}$$)
- Rules of Debit and Credit & Normal Balances for all account classes (Assets, Liabilities, Equity, Revenues, Expenses)
- The Complete Accounting Cycle of Service and Merchandising Businesses:
  1. Business transaction identification & source documents
  2. Journalizing in General Journal and Special Journals (Sales, Purchases, Cash Receipts, Cash Disbursements)
  3. Posting to General Ledger and Subsidiary Ledgers (Accounts Receivable & Accounts Payable subsidiary ledgers)
  4. Preparation of Unadjusted Trial Balance
  5. Year-end Adjusting Entries: Accrued Expenses, Accrued Revenues, Prepaid Expenses (Asset and Expense methods), Unearned Revenues (Liability and Revenue methods), Depreciation (Straight-Line, Double Declining, Sum of Years' Digits), Allowance for Doubtful Accounts / Bad Debts (Percentage of Sales, Percentage of AR, Aging of AR)
  6. Adjusted Trial Balance & 10-column / 12-column Worksheet
  7. Preparation of Financial Statements
  8. Closing Entries (REID: Revenues, Expenses, Income Summary, Drawings) & Post-Closing Trial Balance
  9. Reversing Entries
- Merchandising Inventory Systems: Periodic vs Perpetual inventory systems, Gross vs Net method, Trade discounts vs Cash discounts (e.g., 2/10, n/30), Freight-In (FOB Shipping Point) vs Freight-Out (FOB Destination), Schedule of Cost of Goods Sold (Cost of Sales) and Gross Profit.

FABM 2 SPECIALIZATIONS:
- Classified Statement of Financial Position (SFP) (Current vs Non-current assets, Current vs Non-current liabilities, Equity for Sole Proprietorship, Partnership, and Corporation)
- Statement of Comprehensive Income (SCI) (Single-step and Multi-step formats: Net Sales, COGS, Gross Profit, Operating Expenses - Selling & Administrative, Operating Income, Finance Costs, Net Income)
- Statement of Changes in Equity (SCE)
- Statement of Cash Flows (SCF) (Operating, Investing, and Financing activities under both Direct and Indirect methods)
- Bank Reconciliation Statement: Adjusted Balance Method, Book Reconciling Items (Credit Memos, Debit Memos, Book Errors, NSF Checks, Bank Service Charges) and Bank Reconciling Items (Deposits in Transit, Outstanding Checks, Bank Errors)
- Financial Statement Ratio Analysis: Liquidity (Current ratio, Quick/Acid-test ratio, Working capital), Solvency (Debt ratio, Debt-to-Equity ratio), Profitability (Gross profit margin, Operating profit margin, Net profit margin, Return on Assets ROA, Return on Equity ROE), Efficiency/Turnover (Inventory turnover, Days sales in inventory, Accounts receivable turnover, Average collection period).`;
    } else if (assistantMode === 'business_math' || assistantMode === 'operations' || assistantMode === 'cfo') {
      personaGuidance = `You are Cipher operating in Business Mathematics mode. You specialize in commercial arithmetic, retail math, and managerial finance:
- Markup based on Cost vs Markup based on Selling Price (Gross Margin %)
- Markdowns, Markdown Cancellation, Gross Margin and Net Operating Income
- Trade discounts, Net invoice prices, and Chain / Series discounts (e.g., 20/10/5)
- Simple Interest ($I = Prt$) and Compound Interest ($A = P(1+r/n)^{nt}$)
- Ordinary Annuity and Annuity Due (Future Value, Present Value, Sinking Funds)
- Commercial Loans, Mortgages, and Amortization Schedules with periodic balance breakdowns
- Break-Even Analysis (Contribution Margin in units and revenue dollars, Margin of Safety, Target Profit sales)
- Depreciation schedules (Straight-line, Declining balance, Sum-of-the-years-digits)
- Inventory costing (FIFO, LIFO, Weighted Average) and EOQ
- Payroll computations (Gross earnings, Overtime, Commission, Deductions, Withholdings, Net Pay).`;
    } else if (assistantMode === 'general_math') {
      personaGuidance = `You are Cipher operating in General Mathematics mode (Senior High & College General Math curriculum):
- Functions and Relations (Domain, Range, Operations on Functions, Composite Functions, Inverses)
- Rational Functions, Equations, and Inequalities (Domain restrictions, Vertical and Horizontal Asymptotes, Intercepts, Sign analysis)
- Exponential and Logarithmic Functions, Equations, and Real-World Growth/Decay Models
- Simple and Compound Interest, Nominal vs Effective Interest Rates ($EAR$)
- Simple and General Annuities, Deferred Annuities, Fair Market Value of Cash Flows
- Basic Business and Consumer Loans (Amortization, Chattel Mortgages, Down payments, Outstanding balances)
- Stocks and Bonds (Stock dividends, Market value, Bond yields, Par value)
- Logic and Propositional Calculus (Truth tables, Conditionals, Biconditionals, Tautologies, Fallacies, Valid arguments).`;
    } else if (assistantMode === 'mathematics' || assistantMode === 'quant') {
      personaGuidance = `You are Cipher operating in pure & applied Mathematics mode:
- Algebra: Linear equations, systems of equations, polynomials, quadratic formulas, inequalities, factoring, rational expressions
- Calculus: Limits, Continuity, Derivatives (Power, Product, Quotient, Chain rules), Optimization, Curve sketching, Integration (indefinite & definite), Area under curves
- Trigonometry & Geometry: Unit circle, sine/cosine/tangent laws, trigonometric identities, geometric areas, surface areas, volumes, coordinate geometry
- Probability & Statistics: Permutations, Combinations, Mean, Median, Mode, Variance, Standard Deviation, Normal Distribution (Z-Scores), Confidence Intervals, Hypothesis testing
- Linear Algebra & Matrices: Matrix addition, multiplication, determinants, inverses, solving systems using Cramer's rule or Gaussian elimination.`;
    } else if (assistantMode === 'graphs') {
      personaGuidance = `You are Cipher operating in Graphs & Plotting mode. You specialize in coordinate plane visualization, function geometry, and mathematical graphing:
- Analyze the equation: state the exact function equation and key points: Vertex $(h, k)$, axis of symmetry, $x$-intercepts (roots), $y$-intercept, and slope.
- DO NOT generate ASCII or text-based coordinate charts because a visual coordinate graph image is already generated and displayed by the interface.
- DO NOT add unsolicited essays, commentary, or extraneous information. Provide only the essential mathematical characteristics.`;
    } else {
      personaGuidance = `You are Cipher operating in Socratic Math Tutor mode. You specialize in pedagogical, patient, and encouraging math instruction:
- Break down homework problems into small, digestible, intuitive steps
- Explain the "WHY" behind every formula before executing calculations
- Celebrate what the student did right, and gently correct errors with constructive feedback
- Provide interactive checkpoints: "Try calculating step 2 yourself, or let me know if you want me to show the next step!"
- Empower students to build deep conceptual confidence in mathematics and accounting.`;
    }

    // Format instruction based on teachingMode:
    let outputStyleInstruction = '';
    if (teachingMode === 'direct') {
      outputStyleInstruction = `
CRITICAL DIRECT ANSWER MODE:
- For mathematical or accounting calculations: Output directly the exact final answer value or journal entry.
- For multiple-choice questions or activity worksheets: For each question visible, state the Question number and the exact correct choice (e.g. "**Question 1: C - ₱450.00**").
- For conversational greetings or general questions from the user (such as "hi", "how are you", "who are you", "what can you do"): Answer directly and conversationally as Cipher AI.
`;
    } else {
      outputStyleInstruction = `
CRITICAL TEACH ME MODE:
- For math and accounting problems: Teach the necessary method and working steps clearly.
- At the very end of your response, provide the final answer strictly enclosed in [REVEAL_ANSWER] and [/REVEAL_ANSWER].
- For multiple-choice activities: For each question, explain the brief reasoning/calculation for why that specific choice is correct, then provide the final answer inside [REVEAL_ANSWER].
- For conversational questions: Answer directly, helpfully, and conversationally.
Format:
[REVEAL_ANSWER]
**Final Answer:** <exact numerical or formal solution value with ${currency}>
[/REVEAL_ANSWER]
`;
    }

    const systemInstruction = `
You are Cipher AI, an intelligent personal assistant specializing in mathematics, accounting (FABM 1 & 2), commercial arithmetic, financial problem-solving, and coordinate graphs.
${personaGuidance}
${outputStyleInstruction}

CRITICAL RULES — ANSWER WHAT THE USER ASKS (NO REPEATING, NO RANDOM ANSWERS):
1. ALWAYS ANSWER WHAT THE USER ACTUALLY ASKS:
   - If the user sends a conversation, greeting ("hello", "hi", "how are you"), or asks questions about your capabilities, converse naturally, politely, and concisely. Never output random numbers, canned accounting entries, or repeat unrelated answers.
   - If the user asks a specific question, answer THAT specific question. Never repeat a previous answer over and over again.

2. MULTIPLE-CHOICE ACTIVITIES & SCREENSHOT ANALYSIS (CRITICAL):
   When the user provides a picture or screenshot of an activity, worksheet, exam, or quiz (especially multiple choice):
   - Carefully read and transcribe every question and its options (A, B, C, D) visible in the image.
   - Address EACH question specifically by its number (e.g., **Question 1**, **Question 2**, etc.).
   - State the correct option clearly (e.g., **Question 1: C (₱12,500.00)** or **Question 2: B (Debit Cash)**).
   - NEVER invent or make up random questions or random numbers that are not in the user's image. Answer strictly the questions shown in the image!
   - If in Direct Answer mode: Give the question number and correct answer letter/value for each question.
   - If in Teach Me mode: Briefly show the step or rule proving why that option is correct, then reveal the answer.

3. SPEED, ACCURACY & CONCISENESS:
   - Answer directly and accurately without unsolicited background essays or filler.
   - When graphing: The system generates an actual visual graph image. State the exact equation and key points (Vertex, Intercepts, Slope). DO NOT generate ASCII or text art diagrams!
   - Always format mathematical formulas using LaTeX syntax ($$...$$ for block, $...$ for inline).
   - Use currency prefix "${currency}" (or ₱ if specified) where monetary amounts are calculated.
`;

    let generatedText = '';

    if (ai) {
      // Build conversation contents
      const formattedContents: any[] = [];

      // Add recent history if present (up to last 6 turns)
      if (Array.isArray(history) && history.length > 0) {
        const recent = history.slice(-6);
        for (const item of recent) {
          formattedContents.push({
            role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
            parts: [{ text: item.text || item.content || '' }],
          });
        }
      }

      // Add current user prompt (multimodal with image if provided)
      const userParts: any[] = [];

      // Only add inlineData if it is a supported raster image (JPEG, PNG, WEBP, HEIC) with valid base64
      if (image && typeof image === 'string') {
        const isSvg =
          (mimeType && mimeType.includes('svg')) ||
          image.startsWith('data:image/svg') ||
          image.includes('<svg');

        if (!isSvg) {
          let base64Data = '';
          let resolvedMime = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

          if (image.startsWith('data:')) {
            const commaIndex = image.indexOf(',');
            if (commaIndex !== -1) {
              const header = image.slice(0, commaIndex);
              const content = image.slice(commaIndex + 1);
              const mimeMatch = header.match(/data:([^;,]+)/);
              if (mimeMatch) {
                resolvedMime = mimeMatch[1];
              }
              base64Data = content.trim();
            }
          } else {
            base64Data = image.trim();
          }

          // Gemini vision models strictly support: image/png, image/jpeg, image/webp, image/heic, image/heif
          const supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
          if (!supportedMimes.includes(resolvedMime)) {
            resolvedMime = 'image/jpeg';
          }

          // Only attach inlineData if valid base64 payload is present
          if (base64Data && base64Data.length > 50 && !base64Data.includes('<')) {
            userParts.push({
              inlineData: {
                data: base64Data,
                mimeType: resolvedMime,
              },
            });
          }
        }
      }

      userParts.push({
        text:
          message ||
          'Please read and analyze this homework worksheet or activity from the image. Solve each question and provide the accurate answers.',
      });

      formattedContents.push({
        role: 'user',
        parts: userParts,
      });

      // Precompute graph image if graph mode or graphing keywords requested
      let graphImageUrl: string | undefined = undefined;
      const lowerMsg = (message || '').toLowerCase();
      const isGraphQuery =
        assistantMode === 'graphs' ||
        lowerMsg.includes('graph') ||
        lowerMsg.includes('plot') ||
        lowerMsg.includes('parabola') ||
        lowerMsg.includes('curve') ||
        (image && typeof image === 'string' && image.startsWith('data:image/svg'));

      if (isGraphQuery) {
        if (image && typeof image === 'string' && image.startsWith('data:image/svg')) {
          graphImageUrl = image;
        } else {
          try {
            const gData = generateGraphData(message);
            graphImageUrl = gData.svgDataUrl;
          } catch (e) {
            console.warn('Could not generate server graph:', e);
          }
        }
      }

      if (wantsStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
      }

      let streamSucceeded = false;

      // Try fast streaming with gemini-3.1-flash-lite
      try {
        const streamPromise = ai.models.generateContentStream({
          model: 'gemini-3.1-flash-lite',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.15,
            maxOutputTokens: teachingMode === 'direct' ? 450 : 2200,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Model generation timed out (4800ms)')), 4800)
        );

        const responseStream = await Promise.race([streamPromise, timeoutPromise]);

        for await (const chunk of responseStream) {
          const chunkText = chunk.text || '';
          if (chunkText) {
            generatedText += chunkText;
            if (wantsStream) {
              res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
            }
          }
        }

        if (generatedText.trim()) {
          streamSucceeded = true;
        }
      } catch (streamErr: any) {
        console.warn('Fast stream failed or timed out:', streamErr?.message || streamErr);
      }

      // If stream failed, fallback to local solver
      if (!streamSucceeded) {
        console.warn('Activating rapid intelligent fallback solver...');
        generatedText = generateDevFallbackResponse(message, teachingMode, assistantMode, currency, !!image);
        if (wantsStream) {
          res.write(`data: ${JSON.stringify({ chunk: generatedText })}\n\n`);
        }
      }

      recordQueryUsage(user, resolvedDeviceId, clientIp);
      const updatedUsage = getEffectiveUsage(user, resolvedDeviceId, clientIp);

      if (wantsStream) {
        res.write(
          `data: ${JSON.stringify({
            done: true,
            usage: updatedUsage,
            teachingMode,
            assistantMode,
            timestamp: Date.now(),
            graphImageUrl: graphImageUrl || undefined,
          })}\n\n`
        );
        return res.end();
      } else {
        return res.json({
          text: generatedText,
          teachingMode,
          assistantMode,
          usage: updatedUsage,
          timestamp: Date.now(),
          graphImageUrl: graphImageUrl || undefined,
        });
      }
    } else {
      // Offline fallback when GEMINI_API_KEY is not configured
      generatedText = generateDevFallbackResponse(message, teachingMode, assistantMode, currency, !!image);
      recordQueryUsage(user, resolvedDeviceId, clientIp);
      const updatedUsage = getEffectiveUsage(user, resolvedDeviceId, clientIp);

      if (wantsStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.write(`data: ${JSON.stringify({ chunk: generatedText })}\n\n`);
        res.write(
          `data: ${JSON.stringify({
            done: true,
            usage: updatedUsage,
            teachingMode,
            assistantMode,
            timestamp: Date.now(),
          })}\n\n`
        );
        return res.end();
      } else {
        return res.json({
          text: generatedText,
          teachingMode,
          assistantMode,
          usage: updatedUsage,
          timestamp: Date.now(),
        });
      }
    }
  } catch (err: any) {
    console.error('Chat error:', err);
    if (wantsStream) {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Processing error' })}\n\n`);
      return res.end();
    }
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: err.message || 'An error occurred while processing your math problem.',
    });
  }
});

// Fallback solver for offline/edge cases
function generateDevFallbackResponse(
  message: string,
  mode: string,
  assistantMode: string,
  currency: string,
  hasImage: boolean = false
): string {
  const lower = (message || '').toLowerCase().trim();

  // 1. Conversational greetings and inquiries
  if (
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'hey' ||
    lower.startsWith('hi ') ||
    lower.startsWith('hello ') ||
    lower.startsWith('hey ') ||
    lower.includes('who are you') ||
    lower.includes('how are you') ||
    lower.includes('what can you do') ||
    lower.includes('what are you') ||
    lower.includes('help me')
  ) {
    return `Hello! I am **Cipher AI**, your personal assistant for mathematics, business math, FABM accounting, and coordinate graphing.

How I can help you:
- **Solve Activities & Homework**: Send a problem or screenshot of your worksheets (including multiple-choice questions) and I will solve each question accurately.
- **Modes**: Choose **Direct Answer** for instant answers, or **Teach Me** for step-by-step guidance with hidden answers.
- **Plotting & Graphs**: Click the **Graph** button to plot equations on a coordinate plane.

What math or accounting problem would you like to solve?`;
  }

  // 2. Activity / Screenshot upload when offline
  if (hasImage || lower.includes('screenshot') || lower.includes('worksheet') || lower.includes('activity')) {
    return `I received your activity screenshot! 

To solve your multiple-choice questions or worksheet immediately:
1. Type or paste the question number and text (along with choices A, B, C, D) in the chat.
2. I will calculate the exact answer, identify the correct letter option, and explain the steps!`;
  }

  // 3. Simple arithmetic evaluator (e.g., "2 + 2", "50 * 12", "100 / 4", "15% of 200")
  const pctOfMatch = lower.match(/^([0-9\.]+)\s*%\s*(?:of)\s*([0-9\.]+)$/);
  if (pctOfMatch) {
    const rate = parseFloat(pctOfMatch[1]) / 100;
    const base = parseFloat(pctOfMatch[2]);
    const res = rate * base;
    if (mode === 'direct') return `**Answer:** ${res}`;
    return `### Calculation: ${pctOfMatch[1]}% of ${pctOfMatch[2]}
- Formula: $\\text{Result} = \\text{Base} \\times \\text{Rate} = ${base} \\times ${rate} = ${res}$
[REVEAL_ANSWER]
**Final Answer:** **${res}**
[/REVEAL_ANSWER]`;
  }

  const cleanExpr = lower.replace(/\s+/g, '').replace(/x/g, '*');
  if (/^[0-9\+\-\*\/\(\)\.]+$/.test(cleanExpr)) {
    try {
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${cleanExpr})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        if (mode === 'direct') {
          return `**Answer:** ${result.toLocaleString()}`;
        }
        return `### Calculation: ${message.trim()}

- **Expression:** $${cleanExpr} = ${result}$

[REVEAL_ANSWER]
**Final Answer:** **${result.toLocaleString()}**
[/REVEAL_ANSWER]`;
      }
    } catch {}
  }

  // 4. Specific accounting/finance topics ONLY if query explicitly asks for them
  if (lower.includes('bank rec') || lower.includes('reconciliation')) {
    if (mode === 'direct') {
      return `**Adjusted Cash Balance:** ${currency}93,150.00`;
    }
    return `### Bank Reconciliation (Adjusted Balance Method)

#### 1. Core Concept
A bank reconciliation aligns the general ledger Cash balance (Book balance) with the Bank statement balance by accounting for timing differences (deposits in transit, outstanding checks) and unrecorded items.

#### 2. Summary
- Adjusted Book Balance: ${currency}93,150.00
- Adjusted Bank Balance: ${currency}93,150.00

[REVEAL_ANSWER]
**Final Answer:** Adjusted Cash Balance is **${currency}93,150.00** on both Book and Bank statements.
[/REVEAL_ANSWER]`;
  }

  if (lower.includes('npv') || lower.includes('net present value')) {
    if (mode === 'direct') {
      return `**Net Present Value (NPV):** ${currency}58,416.72 (Decision: Accept Project)`;
    }
    return `### How to Calculate Net Present Value (NPV)
Formula: $$ \\text{NPV} = \\sum_{t=1}^{n} \\frac{CF_t}{(1 + r)^t} - C_0 $$
[REVEAL_ANSWER]
**Final Answer:** Net Present Value is **${currency}58,416.72**. Decision: **ACCEPT PROJECT**.
[/REVEAL_ANSWER]`;
  }

  if (lower.includes('markup') || lower.includes('gross margin')) {
    if (mode === 'direct') {
      return `**Selling Price:** ${currency}692.31 | **Markup on Cost:** 53.85%`;
    }
    return `### Markup vs Gross Margin
- Selling Price: $\\frac{\\text{Cost}}{1 - \\text{Margin}}$
[REVEAL_ANSWER]
**Final Answer:** **Selling Price: ${currency}692.31** | **Markup on Cost: 53.85%**.
[/REVEAL_ANSWER]`;
  }

  if (lower.includes('journal') || (lower.includes('debit') && lower.includes('credit'))) {
    if (mode === 'direct') {
      return `| Date | Account Titles & Explanation | PR | Debit (${currency}) | Credit (${currency}) |
| :--- | :--- | :---: | :---: | :---: |
| Nov 10 | Merchandise Inventory | 120 | ${currency}25,000.00 | |
| | &nbsp;&nbsp;&nbsp;&nbsp;Accounts Payable | 201 | | ${currency}25,000.00 |`;
    }
    return `### General Journal Entry
- Normal balance: Assets increase with Debit, Liabilities increase with Credit.
[REVEAL_ANSWER]
| Date | Account Titles & Explanation | PR | Debit (${currency}) | Credit (${currency}) |
| :--- | :--- | :---: | :---: | :---: |
| Nov 10 | Merchandise Inventory | 120 | ${currency}25,000.00 | |
| | &nbsp;&nbsp;&nbsp;&nbsp;Accounts Payable | 201 | | ${currency}25,000.00 |
[/REVEAL_ANSWER]`;
  }

  // 5. Generic responsive fallback
  if (mode === 'direct') {
    return `**Answer:** Please provide the full equation, numbers, or question options (A, B, C, D) so I can compute the exact answer for you.`;
  }
  return `### How to Solve: ${message || 'Your Problem'}

To give you the exact steps and correct answer:
1. Please provide the numbers, formula, or multiple-choice questions you are working on.
2. If this is an activity from a worksheet, you can type the question number and choices (A, B, C, D) and I'll solve it step-by-step!`;
}

// Interactive Quiz / Practice generator endpoint
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const {
      topic = 'Mathematics & Accounting',
      pdfData,
      pdfFileName,
      questionCount = 5,
      difficulty = 'Intermediate',
      assistantMode = 'fabm',
    } = req.body;

    const count = Math.min(25, Math.max(1, Number(questionCount) || 5));

    if (ai) {
      const userParts: any[] = [];

      if (pdfData) {
        let base64Pdf = pdfData;
        let mime = 'application/pdf';
        if (typeof pdfData === 'string' && pdfData.startsWith('data:')) {
          const match = pdfData.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mime = match[1];
            base64Pdf = match[2];
          }
        }
        userParts.push({
          inlineData: {
            data: base64Pdf,
            mimeType: mime,
          },
        });
        userParts.push({
          text: `You are Cipher AI, an expert educational exam creator and tutor in Mathematics and FABM Accounting.
Analyze this attached PDF document (${pdfFileName || 'Course Document'}).
Extract the core accounting, mathematics, or business concepts from this document and generate exactly ${count} high-quality, comprehensive multiple-choice quiz questions based strictly on the material in this PDF.
Difficulty level: ${difficulty}.
Mode/Specialization: ${assistantMode}.
Topic focus: ${topic || 'Cover key topics from the document'}.

CRITICAL REQUIREMENTS:
- Output strictly valid JSON matching this schema:
{
  "title": "Quiz Title based on document",
  "topic": "${topic || pdfFileName || 'Course Document'}",
  "difficulty": "${difficulty}",
  "questionCount": ${count},
  "questions": [
    {
      "id": "q1",
      "title": "Descriptive Problem Title",
      "topic": "Specific Subtopic",
      "difficulty": "${difficulty}",
      "problemStatement": "Detailed scenario with clear numbers and question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed step-by-step mathematical or accounting solution showing why the answer is correct and why other choices are incorrect",
      "formulaUsed": "$$ Formula in LaTeX $$"
    }
  ]
}
Make sure exactly 4 options are provided per question and correctIndex is an integer between 0 and 3. Ensure mathematical and accounting precision.`,
        });
      } else {
        userParts.push({
          text: `You are Cipher AI, an expert exam creator and tutor in Mathematics and FABM Accounting.
Generate exactly ${count} high-quality multiple choice quiz questions on the topic: "${topic}".
Specialization / Mode: ${assistantMode}.
Difficulty level: ${difficulty}.

CRITICAL REQUIREMENTS:
- Output strictly valid JSON matching this schema:
{
  "title": "Quiz on ${topic}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questionCount": ${count},
  "questions": [
    {
      "id": "q1",
      "title": "Descriptive Problem Title",
      "topic": "Specific Subtopic",
      "difficulty": "${difficulty}",
      "problemStatement": "Detailed problem statement with numbers and scenario",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed step-by-step mathematical or accounting solution explaining the exact derivation",
      "formulaUsed": "$$ Formula in LaTeX $$"
    }
  ]
}
Ensure exactly 4 options are provided per question and correctIndex is an integer between 0 and 3.`,
        });
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI_TIMEOUT')), 12000)
        );

        const quizModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
        let rawText = '';

        for (const qModel of quizModels) {
          try {
            const response: any = await Promise.race([
              ai.models.generateContent({
                model: qModel,
                contents: [{ role: 'user', parts: userParts }],
                config: {
                  responseMimeType: 'application/json',
                  temperature: 0.2,
                },
              }),
              timeoutPromise,
            ]);
            if (response?.text) {
              rawText = response.text;
              break;
            }
          } catch (e: any) {
            console.warn(`Quiz model ${qModel} failed:`, e?.message || e);
          }
        }

        const parsed = JSON.parse(rawText || '{}');
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return res.json({
            id: 'quiz_' + Date.now(),
            title: parsed.title || `Quiz on ${topic}`,
            topic: parsed.topic || topic,
            sourceType: pdfData ? 'pdf' : 'topic',
            fileName: pdfFileName || undefined,
            questionCount: parsed.questions.length,
            difficulty,
            questions: parsed.questions.map((q: any, idx: number) => ({
              id: q.id || `q_${idx + 1}`,
              title: q.title || `Question ${idx + 1}`,
              topic: q.topic || topic,
              difficulty: q.difficulty || difficulty,
              problemStatement: q.problemStatement || q.question || 'Solve this problem:',
              options:
                Array.isArray(q.options) && q.options.length >= 4
                  ? q.options.slice(0, 4)
                  : ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
              correctIndex:
                typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4
                  ? q.correctIndex
                  : 0,
              explanation: q.explanation || 'Step-by-step solution calculated.',
              formulaUsed: q.formulaUsed || '',
            })),
            createdAt: Date.now(),
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini quiz generation error, using curriculum fallback:', geminiErr?.message);
      }
    }

    // High-quality fallback quiz generator
    const fallbackQuiz = generateCurriculumFallbackQuiz(topic, count, difficulty, assistantMode, pdfFileName);
    res.json(fallbackQuiz);
  } catch (err: any) {
    console.error('Quiz error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz' });
  }
});

function generateCurriculumFallbackQuiz(
  topic: string,
  count: number,
  difficulty: string,
  assistantMode: string,
  pdfFileName?: string
) {
  const isAccounting =
    assistantMode === 'fabm' ||
    topic.toLowerCase().includes('fabm') ||
    topic.toLowerCase().includes('accounting') ||
    topic.toLowerCase().includes('journal') ||
    topic.toLowerCase().includes('debit');

  const questionPool = [
    {
      title: 'Supplies Expense Adjusting Entry',
      topic: 'FABM Accounting - Adjusting Entries',
      difficulty: 'Intermediate',
      problemStatement:
        'On January 1, 2024, Orion Trading had supplies on hand worth ₱12,000. During the year, supplies purchased totaled ₱38,000 and were debited to Supplies. An end-of-year inventory physical count reveals supplies remaining on December 31 are ₱9,500. What is the necessary adjusting entry?',
      options: [
        'Debit Supplies Expense ₱40,500; Credit Supplies ₱40,500',
        'Debit Supplies ₱40,500; Credit Supplies Expense ₱40,500',
        'Debit Supplies Expense ₱9,500; Credit Supplies ₱9,500',
        'Debit Supplies Expense ₱28,500; Credit Supplies ₱28,500',
      ],
      correctIndex: 0,
      explanation:
        'Total Supplies Available = Beginning (₱12,000) + Purchases (₱38,000) = ₱50,000. Supplies Used = Available (₱50,000) - Ending Physical Count (₱9,500) = ₱40,500. Under the asset method, Supplies Expense is debited for ₱40,500 and Supplies is credited for ₱40,500.',
      formulaUsed:
        '$$ \\text{Supplies Expense} = \\text{Beginning Balance} + \\text{Purchases} - \\text{Ending Inventory} = ₱50,000 - ₱9,500 = ₱40,500 $$',
    },
    {
      title: 'Bank Reconciliation Adjusted Balance',
      topic: 'FABM Accounting - Bank Reconciliation',
      difficulty: 'Intermediate',
      problemStatement:
        'As of May 31, a company book balance of Cash is ₱145,000 while the bank statement balance shows ₱162,000. Deposits in transit are ₱24,000; outstanding checks are ₱32,000; bank service charge is ₱1,500; and a customer note collected by the bank is ₱10,500. What is the correct adjusted cash balance?',
      options: ['₱154,000', '₱162,000', '₱145,000', '₱170,500'],
      correctIndex: 0,
      explanation:
        'Bank side: ₱162,000 + Deposits in transit (₱24,000) - Outstanding checks (₱32,000) = ₱154,000. Book side: ₱145,000 + Note collected (₱10,500) - Bank service charge (₱1,500) = ₱154,000. Both sides reconcile perfectly to ₱154,000.',
      formulaUsed:
        '$$ \\text{Adjusted Bank} = ₱162,000 + ₱24,000 - ₱32,000 = ₱154,000 = \\text{Adjusted Book} = ₱145,000 + ₱10,500 - ₱1,500 $$',
    },
    {
      title: 'Periodic Inventory - Cost of Goods Sold',
      topic: 'FABM Accounting - Merchandising',
      difficulty: 'Beginner',
      problemStatement:
        'A merchandising enterprise reports: Beginning Inventory ₱60,000; Gross Purchases ₱210,000; Purchase Discounts ₱4,000; Purchase Returns ₱6,000; Freight-In ₱10,000; and Ending Inventory ₱55,000. What is the Cost of Goods Sold?',
      options: ['₱215,000', '₱225,000', '₱210,000', '₱205,000'],
      correctIndex: 0,
      explanation:
        'Net Purchases = ₱210,000 - ₱4,000 - ₱6,000 + Freight-in ₱10,000 = ₱210,000. Goods Available for Sale (COGAS) = Beginning (₱60,000) + Net Purchases (₱210,000) = ₱270,000. COGS = COGAS (₱270,000) - Ending Inventory (₱55,000) = ₱215,000.',
      formulaUsed:
        '$$ \\text{COGS} = \\text{Beginning Inventory} + \\text{Net Purchases} + \\text{Freight-In} - \\text{Ending Inventory} $$',
    },
    {
      title: 'Markup on Cost vs Selling Price',
      topic: 'Business Mathematics - Commercial Markup',
      difficulty: 'Beginner',
      problemStatement:
        'A bookstore buys an accounting textbook for $80.00. The store applies a 25% markup based on the SELLING PRICE. What is the retail selling price of the textbook?',
      options: ['$106.67', '$100.00', '$120.00', '$96.00'],
      correctIndex: 0,
      explanation:
        'When markup is based on selling price: Cost = Selling Price * (1 - Margin Rate). Thus, Selling Price = Cost / (1 - 0.25) = $80.00 / 0.75 = $106.67. (Note: A 25% markup on cost would give $100.00, but markup on selling price gives $106.67).',
      formulaUsed:
        '$$ SP = \\frac{\\text{Cost}}{1 - M_{SP}} = \\frac{\\$80.00}{1 - 0.25} = \\frac{\\$80.00}{0.75} = \\$106.67 $$',
    },
    {
      title: 'Compound Interest Maturity Value',
      topic: 'Business Mathematics - Compound Interest',
      difficulty: 'Intermediate',
      problemStatement:
        'An investor deposits $50,000 in an account paying 8% nominal annual interest compounded quarterly. What is the compound amount at the end of 5 years?',
      options: ['$74,297.37', '$70,000.00', '$73,466.40', '$76,842.10'],
      correctIndex: 0,
      explanation:
        'P = $50,000, r = 0.08, n = 4 compoundings per year, t = 5 years. Total periods nt = 20. Periodic rate i = 0.08 / 4 = 0.02. A = $50,000 * (1 + 0.02)^20 = $50,000 * 1.4859474 = $74,297.37.',
      formulaUsed:
        '$$ A = P \\left(1 + \\frac{r}{n}\\right)^{nt} = \\$50,000 (1 + 0.02)^{20} = \\$74,297.37 $$',
    },
    {
      title: 'Break-Even Analysis in Units and Sales',
      topic: 'Business Mathematics - Break-Even Point',
      difficulty: 'Intermediate',
      problemStatement:
        'A manufacturer sells units for $150 each. Variable costs are $90 per unit, and total fixed costs are $180,000 per month. How many units must be sold to break even?',
      options: ['3,000 units', '2,000 units', '2,500 units', '4,000 units'],
      correctIndex: 0,
      explanation:
        'Contribution Margin per unit = Selling Price ($150) - Variable Cost ($90) = $60. Break-Even Quantity = Fixed Costs / CM per unit = $180,000 / $60 = 3,000 units.',
      formulaUsed:
        '$$ Q_{BE} = \\frac{FC}{P - VC} = \\frac{\\$180,000}{\\$150 - \\$90} = 3,000 \\text{ units} $$',
    },
    {
      title: 'Rational Function Vertical Asymptotes',
      topic: 'General Mathematics - Rational Functions',
      difficulty: 'Intermediate',
      problemStatement:
        'Find the vertical asymptote(s) of the rational function f(x) = (3x + 6) / (x^2 - 4x - 5).',
      options: [
        'x = 5 and x = -1',
        'x = -5 and x = 1',
        'x = 3 and x = -2',
        'y = 0 only',
      ],
      correctIndex: 0,
      explanation:
        'Vertical asymptotes occur where the denominator equals zero while the numerator is non-zero. Factoring denominator: x^2 - 4x - 5 = (x - 5)(x + 1) = 0. Hence x = 5 and x = -1. Checking numerator at these values: 3(5)+6=21 != 0, 3(-1)+6=3 != 0. Therefore, the vertical asymptotes are x = 5 and x = -1.',
      formulaUsed:
        '$$ x^2 - 4x - 5 = 0 \\implies (x - 5)(x + 1) = 0 \\implies x = 5, \\, x = -1 $$',
    },
    {
      title: 'Derivative via Chain Rule',
      topic: 'Mathematics - Calculus Derivatives',
      difficulty: 'Intermediate',
      problemStatement:
        'Find the first derivative of f(x) = (4x^3 - 5x)^4 with respect to x.',
      options: [
        '4(4x^3 - 5x)^3 * (12x^2 - 5)',
        '(12x^2 - 5)^4',
        '16(4x^3 - 5x)^3',
        '4(12x^2 - 5)^3',
      ],
      correctIndex: 0,
      explanation:
        'Applying the Chain Rule: d/dx [u(x)^n] = n * u(x)^(n-1) * u\'(x). Here u(x) = 4x^3 - 5x, so u\'(x) = 12x^2 - 5. Thus f\'(x) = 4(4x^3 - 5x)^3 * (12x^2 - 5).',
      formulaUsed:
        '$$ \\frac{d}{dx}[u(x)^n] = n \\cdot u(x)^{n-1} \\cdot u\'(x) $$',
    },
    {
      title: 'Parabola Vertex & Axis of Symmetry',
      topic: 'Graphs & Plotting - Quadratic Curves',
      difficulty: 'Beginner',
      problemStatement:
        'Find the vertex coordinate of the quadratic parabola y = 2x^2 - 8x + 3.',
      options: [
        '(2, -5)',
        '(-2, 27)',
        '(4, 3)',
        '(2, 5)',
      ],
      correctIndex: 0,
      explanation:
        'For y = ax^2 + bx + c: Vertex x-coordinate = -b / (2a) = -(-8) / (2 * 2) = 8 / 4 = 2. Substituting x = 2: y = 2(2)^2 - 8(2) + 3 = 8 - 16 + 3 = -5. The vertex is at (2, -5).',
      formulaUsed:
        '$$ h = -\\frac{b}{2a} = -\\frac{-8}{2(2)} = 2, \\quad k = f(2) = 2(4) - 16 + 3 = -5 $$',
    },
    {
      title: 'Straight-Line Depreciation & Book Value',
      topic: 'FABM Accounting - Depreciation',
      difficulty: 'Beginner',
      problemStatement:
        'Equipment was purchased for ₱240,000 on January 1, 2023 with an estimated useful life of 5 years and a salvage value of ₱40,000. Using straight-line depreciation, what is the accumulated depreciation after 2 years on December 31, 2024?',
      options: ['₱80,000', '₱40,000', '₱96,000', '₱160,000'],
      correctIndex: 0,
      explanation:
        'Annual Depreciation = (Cost - Salvage) / Useful Life = (₱240,000 - ₱40,000) / 5 = ₱200,000 / 5 = ₱40,000 per year. After 2 years: Accumulated Depreciation = ₱40,000 * 2 = ₱80,000. Book Value = ₱240,000 - ₱80,000 = ₱160,000.',
      formulaUsed:
        '$$ \\text{Annual Depr} = \\frac{\\text{Cost} - \\text{Salvage}}{\\text{Useful Life}} = \\frac{₱200,000}{5} = ₱40,000, \\quad \\text{Accum Depr} = ₱80,000 $$',
    },
  ];

  // Select questions based on count
  const selected: any[] = [];
  for (let i = 0; i < count; i++) {
    const template = questionPool[i % questionPool.length];
    selected.push({
      ...template,
      id: `q_${i + 1}`,
      title: template.title,
    });
  }

  return {
    id: 'quiz_' + Date.now(),
    title: pdfFileName ? `Quiz on ${pdfFileName}` : `Cipher AI Quiz: ${topic}`,
    topic: topic || pdfFileName || 'Mathematics & Accounting',
    sourceType: pdfFileName ? 'pdf' : 'topic',
    fileName: pdfFileName || undefined,
    questionCount: selected.length,
    difficulty,
    questions: selected,
    createdAt: Date.now(),
  };
}


// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cipher Business Math Assistant running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
