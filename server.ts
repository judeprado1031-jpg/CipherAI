import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
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

function extractGeminiErrorMessage(err: any): string {
  let msg = err?.message || String(err || 'AI service request failed');
  for (let i = 0; i < 3; i++) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
        continue;
      }
      if (parsed?.message) {
        msg = parsed.message;
        continue;
      }
    } catch {
      break;
    }
  }
  return msg.trim();
}

function isTransientGeminiError(err: any): boolean {
  const raw = `${err?.status || ''} ${err?.code || ''} ${err?.message || ''}`;
  return /503|UNAVAILABLE|Service Unavailable|high demand|ECONNRESET|ETIMEDOUT|fetch failed/i.test(raw);
}

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

// Enforce single authorized permanent account: Jude Prado (judeprado1031@gmail.com)
const PERMANENT_USER_ID = 'user_gmail_judeprado';
const DEMO_USER_ID = 'demo-user-1';
const PERMANENT_USER_EMAIL = 'judeprado1031@gmail.com';

const singleAuthorizedUser: UserRecord = {
  id: PERMANENT_USER_ID,
  email: PERMANENT_USER_EMAIL,
  name: 'Jude Prado',
  isPro: false,
  queries: [],
};
usersDb.set(PERMANENT_USER_ID, singleAuthorizedUser);
usersDb.set(DEMO_USER_ID, singleAuthorizedUser);

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

// Single Permanent Account enforcement on Auth
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, name, isPro, deviceId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const clientIp = getClientIp(req);
    const resolvedDeviceId = deviceId || (req.headers['x-device-id'] as string) || `ip_${clientIp}`;

    const { canonicalEmail } = canonicalizeEmail(email);

    // Enforce SINGLE ACCOUNT: Only Jude Prado (judeprado1031@gmail.com) is authorized
    if (canonicalEmail !== PERMANENT_USER_EMAIL) {
      return res.status(403).json({
        error: 'SINGLE_ACCOUNT_RESTRICTION',
        message: 'Account creation and account switching are disabled. Only your single permanent account (judeprado1031@gmail.com) is permitted on this application.',
      });
    }

    const user = singleAuthorizedUser;
    if (name) {
      user.name = name;
    }
    if (isPro !== undefined) {
      user.isPro = isPro;
    }

    const now = Date.now();
    let device = devicesDb.get(resolvedDeviceId);
    if (!device) {
      device = {
        deviceId: resolvedDeviceId,
        firstSeenAt: now,
        lastSeenAt: now,
        queries: [],
        associatedUserIds: new Set([user.id]),
        freeAccountsCreated: [],
        clientIps: new Set([clientIp]),
      };
      devicesDb.set(resolvedDeviceId, device);
    } else {
      device.associatedUserIds.add(user.id);
    }

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
    res.status(500).json({ error: 'AUTH_FAILED', message: err.message });
  }
});

// Update Pro Subscription Status (Binds to single authorized account)
app.post('/api/user/subscription', (req, res) => {
  const { isPro, deviceId } = req.body;
  const clientIp = getClientIp(req);
  const user = singleAuthorizedUser;
  user.isPro = Boolean(isPro);
  res.json({ success: true, isPro: user.isPro, usage: getEffectiveUsage(user, deviceId, clientIp) });
});

// Fetch current usage (evaluates single permanent user + device + IP)
app.get('/api/user/usage', (req, res) => {
  const clientIp = getClientIp(req);
  const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string) || `ip_${clientIp}`;
  const user = singleAuthorizedUser;
  res.json(getEffectiveUsage(user, deviceId, clientIp));
});

// Cloud Sync Endpoint: Sync data for permanent single account
app.post('/api/sync', (req, res) => {
  try {
    const { data } = req.body;
    const user = singleAuthorizedUser;

    if (data) {
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

// Cloud Sync Endpoint: Fetch synced data for permanent single account
app.get('/api/sync/:userId', (req, res) => {
  try {
    const user = singleAuthorizedUser;
    res.json({
      success: true,
      data: user.syncedData || null,
      lastSyncedAt: user.syncedData?.updatedAt || Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Fetch sync failed' });
  }
});

// Instant math calculation helper for ultra-fast (0ms) solutions on pure arithmetic
function solveDirectMath(
  message: string,
  mode: string,
  _currency: string
): { isSolved: boolean; text: string } {
  const trimmed = (message || '').trim();
  const lower = trimmed.toLowerCase();

  // Anchored percentage pattern ONLY when entire prompt is a pure percentage query:
  // e.g. "15% of 500" or "what is 20% of 250?"
  const pctMatch = lower.match(
    /^(?:what\s+is\s+|calculate\s+|solve\s+)?([0-9]+(?:\.[0-9]+)?)\s*%\s+of\s+([0-9]+(?:\.[0-9]+)?)\s*\??$/
  );
  if (pctMatch) {
    const rate = parseFloat(pctMatch[1]) / 100;
    const base = parseFloat(pctMatch[2]);
    const res = Number((rate * base).toFixed(4));
    if (mode === 'direct') {
      return {
        isSolved: true,
        text: `**Final Answer:** **${res}**`,
      };
    }
    return {
      isSolved: true,
      text: `### 1. Problem Analysis & Given Data
- **Given Base ($B$):** $${base}$
- **Given Rate ($R$):** $${pctMatch[1]}\\%$ ($${rate}$ in decimal)
- **Required:** Portion / Percentage amount ($P$)

### 2. Relevant Formula / Accounting Principle
$$\\text{Percentage} = \\text{Base} \\times \\text{Rate}$$
$$\\text{Rate (in decimal)} = \\frac{\\text{Percentage Rate}}{100}$$

### 3. Step-by-Step Calculation
1. **Convert percentage to decimal:**
   $$\\text{Rate} = \\frac{${pctMatch[1]}}{100} = ${rate}$$
2. **Multiply base by decimal rate:**
   $$P = ${base} \\times ${rate}$$

[REVEAL_ANSWER]
### 4. Final Answer & Practical Tip
- **Final Answer:** **${res}**
- **Practical Tip:** To double-check, divide the computed result by the base ($${res} \\div ${base} = ${rate}$) and multiply by 100 to confirm it equals $${pctMatch[1]}\\%$.
[/REVEAL_ANSWER]`,
    };
  }

  // Pure arithmetic ONLY: e.g. "25 * 4", "100 / 4 + 15", "(15 + 3) * 8"
  let mathStr = lower
    .replace(/^(?:what\s+is\s+|calculate\s+|solve\s+)/, '')
    .replace(/\?$/, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+x\s+/g, ' * ')
    .replace(/(?<=\d)x(?=\d)/g, '*')
    .replace(/\^/g, '**')
    .trim();

  if (/^[0-9\+\-\*\/\(\)\.\s]+$/.test(mathStr) && /[0-9]/.test(mathStr) && /[\+\-\*\/]/.test(mathStr)) {
    try {
      const calcResult = Function(`'use strict'; return (${mathStr})`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
        const formatted = Number.isInteger(calcResult)
          ? calcResult.toLocaleString()
          : Number(calcResult.toFixed(4)).toLocaleString();
        if (mode === 'direct') {
          return {
            isSolved: true,
            text: `**Final Answer:** **${formatted}**`,
          };
        }
        return {
          isSolved: true,
          text: `### 1. Problem Analysis & Given Data
- **Expression to Evaluate:** $${trimmed}$
- **Required:** Exact simplified numerical value

### 2. Relevant Formula / Accounting Principle
- **Order of Operations (PEMDAS / BODMAS):**
  1. Parentheses / Brackets
  2. Exponents / Powers / Roots
  3. Multiplication & Division (from left to right)
  4. Addition & Subtraction (from left to right)

### 3. Step-by-Step Calculation
1. Evaluate sub-expressions within grouping symbols first.
2. Carry out multiplicative and additive operations according to standard precedence:
   $$${trimmed}$$

[REVEAL_ANSWER]
### 4. Final Answer & Practical Tip
- **Final Answer:** **${formatted}**
- **Practical Tip:** Recalculate each intermediate term step-by-step or use inverse operations to confirm your result.
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

    // Enforce single authorized permanent account: Jude Prado
    const user = singleAuthorizedUser;

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
- Output ONLY the final answer directly, concisely, and accurately without showing the long step-by-step breakdown.
- For math & accounting calculations, state ONLY the final computed value (or exact final journal entry / table if specifically asked for an entry):
  **Final Answer:** <Exact computed value, simplified expression, or final journal entry>
- For multiple-choice questions or worksheets:
  List each question number shown in the user's image/prompt and its verified final choice letter and value ONLY (e.g., **Question 1:** C — ₱450.00).
- For conceptual or conversational questions ("what is FIFO?", "hello", "who are you"): Answer directly and concisely in 2-5 sentences (no invented numbers).
`;
    } else {
      outputStyleInstruction = `
CRITICAL TEACH ME MODE (STRICT ACADEMIC TUTOR STRUCTURE):
Whenever answering a problem, you MUST structure your response strictly following this 4-part layout:

### 1. Problem Analysis & Given Data
Identify what is given and what needs to be solved. List all known quantities, given financial figures, and required variables clearly.

### 2. Relevant Formula / Accounting Principle
State the exact formula or standard accounting rule being applied (e.g., Assets = Liabilities + Owner's Equity, Simple/Compound Interest formula, Markup/Markdown, Straight-Line Depreciation).

### 3. Step-by-Step Calculation / Journal Entry
Show every step of the math explicitly without skipping operations. Format accounting entries in standard tabular layout (Date, Account Title, PR, Debit, Credit) and verify debit/credit equality.
STRICT NO-SPOILER RULE: In this section, show the substituted numbers into the formula and explain the operations, but DO NOT spoil or state the final computed numerical answer or choice letter here.

[REVEAL_ANSWER]
### 4. Final Answer & Practical Tip
- **Final Answer:** <State the final computed answer clearly with ${currency} or units>
- **Practical Tip:** <Provide a short, single-sentence tip on how the student can double-check this type of problem in the future.>
[/REVEAL_ANSWER]

For multiple-choice worksheets:
For each question, provide Sections 1-3 analyzing the question and formula, then place the answer and tip inside [REVEAL_ANSWER].
`;
    }

    const systemInstruction = `
You are Cipher AI, an expert, step-by-step academic AI tutor designed specifically for Grade 12 Accountancy, Business, and Management (ABM) students studying Fundamentals of Accountancy, Business, and Management (FABM), General Mathematics, and Business Mathematics.

Your primary duty is to deliver high-accuracy, reliable, and mathematically sound instructional guidance while strictly maintaining academic integrity.

### CORE OPERATIONAL RULES:
1. ACCURACY FIRST: Accuracy is non-negotiable. Before generating your final response, compute all arithmetic step-by-step, verify debit/credit equality, and double-check all mathematical formulas. If you are uncertain of a specific localized accounting rule or missing critical given data, explicitly state what is missing instead of guessing.
2. STEP-BY-STEP EXPLANATIONS: Never provide a standalone numerical answer without showing the complete work. Always break down complex problems into clear, sequential logical steps.
3. RESPONSIBLE AI SAFEGUARD: Act as a scaffolded learning tutor, NOT an answer generator. Guide the student through the concepts and underlying formulas. Provide reminders on academic integrity when applicable.
4. ZERO HALLUCINATION IN MATH/ACCOUNTING: Maintain a low creative variance (deterministic logic). Strictly adhere to standard accounting rules (GAAP / PFRS basics) and standard financial algebra formulas.

### OUTPUT FORMAT FOR EXPLANATIONS:
Whenever answering a problem, structure your response as follows:

1. **Problem Analysis & Given Data**: Identify what is given and what needs to be solved.
2. **Relevant Formula / Accounting Principle**: State the formula or standard rule being applied (e.g., Assets = Liabilities + Owner's Equity, Simple/Compound Interest formula, Markup/Markdown).
3. **Step-by-Step Calculation / Journal Entry**: Show every step of the math explicitly. Format accounting entries in standard tabular layout (Date, Account Title, Debit, Credit).
4. **Final Answer & Practical Tip**: State the final computed answer clearly and provide a short, single-sentence tip on how the student can double-check this type of problem in the future.

${personaGuidance}
${outputStyleInstruction}

CRITICAL RULES — ANSWER WHAT THE USER ASKS (ACCURATE & CORRELATED):
1. ALWAYS ANSWER WHAT THE USER ACTUALLY ASKS:
   - If the user sends a conversation, greeting ("hello", "hi", "how are you"), or asks questions about your capabilities, converse naturally, politely, and concisely as Cipher AI (Grade 12 ABM tutor). Never output random numbers or repeat unrelated answers.
   - If the user asks a specific question, answer THAT specific question. Never repeat a previous answer over and over again.

2. MULTIPLE-CHOICE ACTIVITIES & SCREENSHOT ANALYSIS (ACCURATE CORRELATION):
   When the user provides a picture or screenshot of an activity, worksheet, exam, or quiz (especially multiple choice):
   - Carefully read and transcribe every question and its options (A, B, C, D) visible in the image.
   - Address EACH question specifically by its number (e.g., **Question 1**, **Question 2**, etc.).
   - NEVER invent or make up random questions or random numbers that are not in the user's image. Answer strictly the questions shown in the image!
   - In Direct Answer mode: Output the question numbers, correct choice letters/values, and practical verification tip.
   - In Teach Me mode: Show Sections 1, 2, and 3 proving each question, then put Section 4 inside [REVEAL_ANSWER] tags.

3. SPEED, ACCURACY & CONCISENESS:
   - Answer directly and accurately without unsolicited background essays or filler.
   - When graphing: State the exact equation and key points (Vertex, Intercepts, Slope). DO NOT generate ASCII or text art diagrams!
   - Always format mathematical formulas using LaTeX syntax ($$...$$ for block, $...$ for inline).
   - Use currency prefix "${currency}" (or ₱ if specified) where monetary amounts are calculated.
`;

    let generatedText = '';

    if (ai) {
      // Build conversation contents
      const formattedContents: any[] = [];

      // Add recent non-empty history turns (excluding duplicate trailing prompt)
      if (Array.isArray(history) && history.length > 0) {
        const recent = history
          .filter((item: any) => typeof (item?.text ?? item?.content) === 'string' && (item?.text ?? item?.content).trim().length > 0)
          .slice(-6);
        for (let i = 0; i < recent.length; i++) {
          const item = recent[i];
          const text = (item.text || item.content || '').trim();
          const isLastDuplicateUser =
            i === recent.length - 1 &&
            item.role === 'user' &&
            message &&
            text === message.trim();
          if (isLastDuplicateUser) continue;
          formattedContents.push({
            role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
            parts: [{ text }],
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

      // Precompute graph image ONLY if in graphs mode, explicit SVG graph sent, or text-only graph/plot request
      let graphImageUrl: string | undefined = undefined;
      const lowerMsg = (message || '').toLowerCase();
      const isSvgUpload = Boolean(image && typeof image === 'string' && image.startsWith('data:image/svg'));
      const isGraphQuery =
        isSvgUpload ||
        assistantMode === 'graphs' ||
        (!image && (/\b(graph|plot)\b/.test(lowerMsg) || lowerMsg.includes('parabola')));

      if (isGraphQuery) {
        if (isSvgUpload && typeof image === 'string') {
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
      let lastError: any = null;
      const modelErrors: string[] = [];

      // Primary: gemini-4-hydrogen (fast & accurate Gemini 4 Flash), fallback: gemini-3.1-flash-lite
      const primaryModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
      for (const mName of primaryModels) {
        if (streamSucceeded) break;
        const maxAttempts = 2;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (streamSucceeded) break;
          generatedText = '';
          let sentAnyChunk = false;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const streamConfig: any = {
              systemInstruction,
              abortSignal: controller.signal,
            };
            if (mName === 'gemini-4-hydrogen') {
              streamConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
            }

            const responseStream = await ai.models.generateContentStream({
              model: mName,
              contents: formattedContents,
              config: streamConfig,
            });

            try {
              for await (const chunk of responseStream) {
                const chunkText = chunk.text || '';
                if (chunkText) {
                  generatedText += chunkText;
                  sentAnyChunk = true;
                  if (wantsStream) {
                    res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
                  }
                }
              }
            } finally {
              clearTimeout(timeoutId);
            }

            if (generatedText.trim()) {
              streamSucceeded = true;
              break;
            }
          } catch (streamErr: any) {
            lastError = streamErr;
            const cleanErr = extractGeminiErrorMessage(streamErr);
            modelErrors.push(`${mName}#${attempt + 1}: ${cleanErr}`);
            console.warn(`Stream with ${mName} (attempt ${attempt + 1}) failed:`, cleanErr);
            if (sentAnyChunk || !isTransientGeminiError(streamErr) || attempt >= maxAttempts - 1) {
              break;
            }
            await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
          }
        }
      }

      if (!streamSucceeded || !generatedText.trim()) {
        const cleanMsg = lastError
          ? extractGeminiErrorMessage(lastError)
          : 'Cipher AI could not generate a response from Gemini. Please try again.';
        console.error('All Gemini chat models failed:', modelErrors.join(' | '));
        if (wantsStream) {
          res.write(`data: ${JSON.stringify({ error: cleanMsg, details: modelErrors })}\n\n`);
          return res.end();
        }
        return res.status(502).json({
          error: 'AI_GENERATION_FAILED',
          message: cleanMsg,
          details: modelErrors,
        });
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
      const missingKeyMsg =
        'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in Settings > Secrets.';
      if (wantsStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.write(`data: ${JSON.stringify({ error: missingKeyMsg })}\n\n`);
        return res.end();
      }
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message: missingKeyMsg,
      });
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

    if (!ai) {
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message: 'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const count = Math.min(25, Math.max(1, Number(questionCount) || 5));
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
        text: `You are Cipher AI, an expert Grade 12 ABM educational exam creator and tutor in Mathematics and FABM Accounting.
Analyze this attached PDF document (${pdfFileName || 'Course Document'}).
Extract the core accounting, mathematics, or business concepts from this document and generate exactly ${count} high-quality, mathematically accurate multiple-choice quiz questions based strictly on the material in this PDF.
Difficulty level: ${difficulty}.
Mode/Specialization: ${assistantMode}.
Topic focus: ${topic || 'Cover key topics from the document'}.
Make sure each question has exactly 4 distinct options, correctIndex is an integer between 0 and 3 matching the right option, formulaUsed is valid LaTeX (e.g. "$$ I = Prt $$"), and explanation shows the verified step-by-step computation.`,
      });
    } else {
      userParts.push({
        text: `You are Cipher AI, an expert Grade 12 ABM exam creator and tutor in Mathematics and FABM Accounting.
Generate exactly ${count} high-quality, mathematically verified multiple-choice quiz questions strictly about the topic: "${topic}".
Specialization / Mode: ${assistantMode}.
Difficulty level: ${difficulty}.
Make sure each question is directly about "${topic}", has exactly 4 distinct options, correctIndex is an integer between 0 and 3 matching the verified correct option, formulaUsed is valid LaTeX (e.g. "$$ I = Prt $$"), and explanation proves the calculation step-by-step.`,
      });
    }

    const quizResponseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        questionCount: { type: Type.INTEGER },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              problemStatement: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              formulaUsed: { type: Type.STRING },
            },
            required: [
              'id',
              'title',
              'topic',
              'difficulty',
              'problemStatement',
              'options',
              'correctIndex',
              'explanation',
              'formulaUsed',
            ],
          },
        },
      },
      required: ['title', 'topic', 'difficulty', 'questionCount', 'questions'],
    };

    const quizModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let rawText = '';
    let lastQuizErr: any = null;
    const quizErrors: string[] = [];

    for (const qModel of quizModels) {
      if (rawText) break;
      const maxAttempts = 2;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), pdfData ? 45000 : 35000);
          let response: any;
          try {
            const quizConfig: any = {
              responseMimeType: 'application/json',
              responseSchema: quizResponseSchema,
              abortSignal: controller.signal,
            };
            if (qModel === 'gemini-4-hydrogen') {
              quizConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
            }
            response = await ai.models.generateContent({
              model: qModel,
              contents: [{ role: 'user', parts: userParts }],
              config: quizConfig,
            });
          } finally {
            clearTimeout(timeoutId);
          }

          if (response?.text) {
            rawText = response.text;
            break;
          }
        } catch (e: any) {
          lastQuizErr = e;
          const cleanErr = extractGeminiErrorMessage(e);
          quizErrors.push(`${qModel}#${attempt + 1}: ${cleanErr}`);
          console.warn(`Quiz model ${qModel} (attempt ${attempt + 1}) failed:`, cleanErr);
          if (!isTransientGeminiError(e) || attempt >= maxAttempts - 1) {
            break;
          }
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        }
      }
    }

    if (!rawText) {
      const cleanQuizErr = lastQuizErr
        ? extractGeminiErrorMessage(lastQuizErr)
        : 'Could not generate quiz questions from Gemini. Please try again.';
      return res.status(502).json({
        error: 'QUIZ_GENERATION_FAILED',
        message: cleanQuizErr,
        details: quizErrors,
      });
    }

    const parsed = JSON.parse(rawText);
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(502).json({
        error: 'QUIZ_INVALID_RESPONSE',
        message: 'Quiz model returned empty question set. Please retry.',
      });
    }

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
  } catch (err: any) {
    console.error('Quiz error:', err);
    res.status(500).json({ error: 'QUIZ_SERVER_ERROR', message: err.message || 'Failed to generate quiz' });
  }
});


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
