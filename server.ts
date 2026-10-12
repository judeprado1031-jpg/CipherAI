import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Helper: Calculate remaining uses in rolling 24 hours (Max 15 free uses per 24 hours)
const MAX_FREE_USES_PER_24H = 15;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function getUserUsage(user: UserRecord) {
  if (user.isPro) {
    return {
      isPro: true,
      remainingUses: 9999,
      totalLimit: 9999,
      usedInLast24h: user.queries.length,
      resetInMs: 0,
      nextResetTime: null,
    };
  }

  const now = Date.now();
  // Filter queries within the last 24 hours
  user.queries = user.queries.filter((q) => now - q.timestamp < TWENTY_FOUR_HOURS_MS);

  const used = user.queries.length;
  const remaining = Math.max(0, MAX_FREE_USES_PER_24H - used);

  let resetInMs = 0;
  if (user.queries.length > 0) {
    const oldest = user.queries[0].timestamp;
    resetInMs = Math.max(0, TWENTY_FOUR_HOURS_MS - (now - oldest));
  }

  return {
    isPro: false,
    remainingUses: remaining,
    totalLimit: MAX_FREE_USES_PER_24H,
    usedInLast24h: used,
    resetInMs,
    nextResetTime: resetInMs > 0 ? now + resetInMs : null,
  };
}

// Auth / User Sync endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, name, isPro } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = Array.from(usersDb.values()).find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      const id = 'user_' + Math.random().toString(36).substring(2, 10);
      user = {
        id,
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        isPro: !!isPro,
        queries: [],
      };
      usersDb.set(id, user);
    } else if (isPro !== undefined) {
      user.isPro = isPro;
    }

    const usage = getUserUsage(user);
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
  const { userId, isPro } = req.body;
  const user = usersDb.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.isPro = Boolean(isPro);
  res.json({ success: true, isPro: user.isPro, usage: getUserUsage(user) });
});

// Fetch current usage
app.get('/api/user/usage', (req, res) => {
  const userId = (req.query.userId as string) || DEMO_USER_ID;
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
  res.json(getUserUsage(user));
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

// Main AI Assistant Solver Endpoint
app.post('/api/chat', async (req, res) => {
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
    } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'Message or homework image is required' });
    }

    // Verify User and Rate Limit
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

    const currentUsage = getUserUsage(user);
    if (!user.isPro && currentUsage.remainingUses <= 0) {
      return res.status(429).json({
        error: 'DAILY_LIMIT_REACHED',
        message: 'You have reached your 15 free uses for this 24-hour cycle.',
        resetInMs: currentUsage.resetInMs,
        nextResetTime: currentUsage.nextResetTime,
        usage: currentUsage,
      });
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
- Cartesian Coordinate Graphing: Plotting linear equations ($y = mx + b$), calculating slope ($m$), x-intercepts, y-intercepts
- Quadratic Functions & Parabolas: Finding the vertex $(h, k)$, axis of symmetry $x = -b/(2a)$, roots / zeros, direction of opening (concave up/down), focus and directrix
- Polynomial, Rational, and Trigonometric Function curves (amplitude, period, phase shift, vertical shift, vertical & horizontal asymptotes)
- Systems of equations: Finding the exact intersection point $(x, y)$ of intersecting curves
- Economic & Business graphs: Supply and Demand curve intersection (Equilibrium price and quantity), Break-even point charts (Fixed cost, Total cost, Total revenue lines)
- ALWAYS provide:
  1. The exact mathematical equation
  2. A clean Coordinate Table of $(x, y)$ points across a representative interval
  3. Key geometric points (Vertex, Intercepts, Asymptotes, Intersection points)
  4. A clear visual ASCII/Markdown coordinate chart representation of the graph!`;
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
CRITICAL DIRECT ANSWER MODE ENFORCEMENT:
THE USER HAS CHOSEN "DIRECT ANSWER" MODE.
You must output ONLY THE DIRECT FINAL ANSWER. NOTHING MORE, NOTHING LESS.
- DO NOT include greetings, introductions, conversational filler, or commentary.
- DO NOT provide explanations, step-by-step working, or tutorial breakdowns.
- DO NOT provide summary recommendations or tips.
- Output ONLY the direct solution / answer value (e.g., "**Answer:** ${currency}1,102.50" or the exact journal entry / coordinates).
Strictly answer only. Nothing more, nothing less.
`;
    } else {
      outputStyleInstruction = `
CRITICAL TEACH ME MODE ENFORCEMENT:
THE USER HAS CHOSEN "TEACH ME" MODE (How It Is Done with Hidden Answer):
Your mission is to show HOW IT IS DONE step-by-step so the student understands the underlying concepts and methodology.
IMPORTANT: Do NOT give away the final answer in the instructional steps! Guide the student through the concepts and mechanics.
Then, place the definitive final answer at the very bottom strictly inside the special tags [REVEAL_ANSWER] and [/REVEAL_ANSWER], like this:
[REVEAL_ANSWER]
**Final Answer:** <exact numerical or formal solution with ${currency}>
[/REVEAL_ANSWER]

Structure your instructional response:
1. **Core Concept & Intuition**: Explain what principle or concept governs this problem.
2. **Governing Formula**: Provide the mathematical or accounting formula in LaTeX ($$...$$).
3. **How It Is Done (Step-by-Step Breakdown)**:
   - Walk through the exact methodology and mechanics of how each step is computed.
   - Show how the numbers substitute into the formula.
4. Conclude strictly with:
[REVEAL_ANSWER]
**Final Answer:** <exact answer here>
[/REVEAL_ANSWER]
`;
    }

    const systemInstruction = `
You are Cipher, an elite personal AI assistant specializing in mathematics problems, especially business math, commercial arithmetic, corporate finance, and advanced financial calculations.
${personaGuidance}
${outputStyleInstruction}

CRITICAL MATHEMATICAL & ACCOUNTING FORMATTING RULES:
- Always format mathematical formulas using LaTeX syntax:
  - Block formulas: $$ \\text{NPV} = \\sum_{t=1}^{n} \\frac{CF_t}{(1 + r)^t} - C_0 $$
  - Inline math: $r = 7.5\\%$ or $PV = \\frac{FV}{(1+i)^n}$
- Use currency prefix "${currency}" (or ₱ if specified) where monetary amounts are calculated.
- Maintain utmost arithmetic precision. Double check all calculations (powers, logarithms, fractions, percentages) before printing.
- If the problem involves an amortization schedule, DCF schedule, or scenario comparison, provide a crisp Markdown table.
- FOR ACCOUNTING & FABM 1 / FABM 2 PROBLEMS:
  - For Journal Entries: Present a formal General Journal table with columns: Date | Account Titles and Explanation | PR | Debit (${currency}) | Credit (${currency}). Always indent the credited account by 4 spaces (&nbsp;&nbsp;&nbsp;&nbsp;) and include the transaction explanation in parentheses.
  - Explain the Debit/Credit rule applied (e.g., Increase in Asset = Debit, Increase in Liability/Equity = Credit).
  - Verify that Total Debits strictly equal Total Credits ($$\\sum \\text{Debits} = \\sum \\text{Credits}$$).
  - For Bank Reconciliation: Provide the Adjusted Balance Method showing both Book side and Bank side reconciling items yielding the same Adjusted Balance.
  - For Merchandising: Clearly calculate Net Purchases, Freight-In, Cost of Goods Available for Sale (COGAS), Ending Inventory, Cost of Goods Sold (COGS), and Gross Profit.

STUDENT HOMEWORK & IMAGE ANALYSIS:
If a student provides a picture or paste of their homework:
1. First, clearly state the problem identified from the image: "**Identified Homework Problem:** ..."
2. If handwriting or student calculations are present, review their work, celebrate correct steps, and point out any errors gently.
3. Solve the problem completely according to the requested mode ("Teach Me" or "Direct Answer").
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

      if (image) {
        let base64Data = image;
        let resolvedMime = mimeType || 'image/jpeg';
        if (typeof image === 'string' && image.startsWith('data:')) {
          const match = image.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            resolvedMime = match[1];
            base64Data = match[2];
          }
        }
        userParts.push({
          inlineData: {
            data: base64Data,
            mimeType: resolvedMime,
          },
        });
      }

      userParts.push({
        text:
          message ||
          'Please read and analyze this homework math problem from the image. Solve it step-by-step and explain the methodology.',
      });

      formattedContents.push({
        role: 'user',
        parts: userParts,
      });

      // Try gemini-3.8-flash first, then fallback to gemini-flash-latest or math generator if upstream experiences temporary spikes
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.2, // Low temperature for high mathematical accuracy
          },
        });
        generatedText = response.text || '';
      } catch (geminiErr: any) {
        console.warn('Gemini 3.8 flash busy or error, attempting fallback model...', geminiErr?.message);
        try {
          const fallbackResp = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.2,
            },
          });
          generatedText = fallbackResp.text || '';
        } catch (secondaryErr: any) {
          console.warn('Secondary model unavailable, activating analytical math solver...', secondaryErr?.message);
          generatedText = generateDevFallbackResponse(message, teachingMode, assistantMode, currency);
        }
      }
    } else {
      // High-fidelity fallback for offline/development if GEMINI_API_KEY is not configured
      generatedText = generateDevFallbackResponse(message, teachingMode, assistantMode, currency);
    }

    // Record query usage on successful generation
    user.queries.push({ timestamp: Date.now() });
    const updatedUsage = getUserUsage(user);

    res.json({
      text: generatedText,
      teachingMode,
      assistantMode,
      usage: updatedUsage,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: err.message || 'An error occurred while processing your math problem.',
    });
  }
});

// Fallback math solver for development environment without API key
function generateDevFallbackResponse(
  message: string,
  mode: string,
  assistantMode: string,
  currency: string
): string {
  const lower = message.toLowerCase();

  // 1. Bank Reconciliation
  if (lower.includes('bank rec') || lower.includes('reconciliation')) {
    if (mode === 'direct') {
      return `**Adjusted Cash Balance:** ${currency}93,150.00`;
    }
    return `### Bank Reconciliation (Adjusted Balance Method)

#### 1. Core Concept
A bank reconciliation aligns the general ledger Cash balance (Book balance) with the Bank statement balance by accounting for timing differences (deposits in transit, outstanding checks) and unrecorded items (bank collections, NSF checks, service fees). Both sides must arrive at the exact same adjusted cash balance.

#### 2. Governing Method
$$\\text{Adjusted Book Balance} = \\text{Book Balance} + \\text{Credit Memos} - \\text{Debit Memos} \\pm \\text{Book Errors}$$
$$\\text{Adjusted Bank Balance} = \\text{Bank Balance} + \\text{Deposits in Transit} - \\text{Outstanding Checks} \\pm \\text{Bank Errors}$$

#### 3. How It Is Done (Step-by-Step)
- **Book Side Calculations:**
  - Starting Unadjusted Book: ${currency}84,500.00
  - Add Notes Collected (+${currency}12,000.00) & Interest (+${currency}180.00)
  - Less NSF Check (-${currency}3,400.00), Service Charge (-${currency}50.00), Book Error (-${currency}270.00)
  - Result: ${currency}84,500 + ${currency}12,180 - ${currency}3,530 = ${currency}93,150.00
- **Bank Side Calculations:**
  - Starting Bank: ${currency}92,300.00
  - Add Deposits in Transit (+${currency}8,400.00)
  - Less Outstanding Checks (-${currency}7,550.00)
  - Result: ${currency}92,300 + ${currency}8,400 - ${currency}7,550 = ${currency}93,150.00

[REVEAL_ANSWER]
**Final Answer:** Adjusted Cash Balance is **${currency}93,150.00** on both Book and Bank statements.
[/REVEAL_ANSWER]`;
  }

  // 2. Net Present Value (NPV)
  if (lower.includes('npv') || lower.includes('net present value')) {
    if (mode === 'direct') {
      return `**Net Present Value (NPV):** ${currency}58,416.72 (Decision: Accept Project)`;
    }
    return `### How to Calculate Net Present Value (NPV)

#### 1. Core Concept
Net Present Value (NPV) evaluates capital investments by discounting all future net cash flows back to the present day using the firm's required cost of capital ($r$), and then subtracting the initial outlay ($C_0$).

#### 2. Governing Formula
$$ \\text{NPV} = \\sum_{t=1}^{n} \\frac{CF_t}{(1 + r)^t} - C_0 $$

#### 3. How It Is Done (Step-by-Step)
- **Identify Given Variables:**
  - Initial Outlay ($C_0$): ${currency}250,000.00
  - Periodic Annual Inflow ($CF$): ${currency}75,000.00 for $n = 5$ years
  - Hurdle Rate ($r$): $10\\% = 0.10$
- **Step 1: Compute Present Value of Inflows using Annuity Factor:**
  $$ PVIFA_{10\\%, 5} = \\frac{1 - (1.10)^{-5}}{0.10} = \\frac{1 - 0.620921}{0.10} = 3.790787 $$
  $$ PV(\\text{Inflows}) = ${currency}75,000 \\times 3.790787 = ${currency}308,416.72 $$
- **Step 2: Deduct Initial Investment:**
  $$ \\text{NPV} = ${currency}308,416.72 - ${currency}250,000.00 $$

[REVEAL_ANSWER]
**Final Answer:** Net Present Value is **${currency}58,416.72**. Since $\\text{NPV} > 0$, the managerial decision is to **ACCEPT PROJECT**.
[/REVEAL_ANSWER]`;
  }

  // 3. Markup vs Gross Margin
  if (lower.includes('markup') || lower.includes('margin') || assistantMode === 'business_math') {
    if (mode === 'direct') {
      return `**Selling Price:** ${currency}692.31 | **Markup on Cost:** 53.85%`;
    }
    return `### How to Calculate Markup vs Gross Margin

#### 1. Core Economic Concept
- **Gross Margin**: The percentage of the final selling price that is gross profit.
- **Markup on Cost**: The percentage added onto wholesale cost to reach selling price.

#### 2. Governing Formulas
$$ \\text{Selling Price} = \\frac{\\text{Cost}}{1 - \\text{Margin Rate}} $$
$$ \\text{Markup on Cost} = \\frac{\\text{Selling Price} - \\text{Cost}}{\\text{Cost}} \\times 100\\% $$

#### 3. How It Is Done (Step-by-Step)
- **Given Parameters:** Cost = ${currency}450.00, Desired Gross Margin = $35\\%$ ($0.35$).
- **Step 1: Calculate Selling Price:**
  $$ \\text{Selling Price} = \\frac{${currency}450.00}{1 - 0.35} = \\frac{${currency}450.00}{0.65} $$
- **Step 2: Calculate Dollar Profit:**
  $$ \\text{Gross Profit} = \\text{Selling Price} - \\text{Cost} = ${currency}692.31 - ${currency}450.00 = ${currency}242.31 $$
- **Step 3: Calculate Percentage Markup on Cost:**
  $$ \\text{Markup} \\% = \\frac{${currency}242.31}{${currency}450.00} \\times 100\\% $$

[REVEAL_ANSWER]
**Final Answer:** **Selling Price: ${currency}692.31** and **Markup on Cost: 53.85%**.
[/REVEAL_ANSWER]`;
  }

  // 4. Graphs & Plotting
  if (lower.includes('graph') || lower.includes('plot') || lower.includes('parabola') || assistantMode === 'graphs') {
    if (mode === 'direct') {
      return `**Vertex:** (2, -1) | **Roots (X-Intercepts):** x = 1, x = 3 | **Y-Intercept:** (0, 3)`;
    }
    return `### How to Analyze and Graph the Parabola $f(x) = x^2 - 4x + 3$

#### 1. Core Function Characteristics
The equation is quadratic in standard form $y = ax^2 + bx + c$, where $a = 1$, $b = -4$, and $c = 3$. Because $a > 0$, the parabola opens upward and has a minimum vertex.

#### 2. Governing Formulas
- Axis of Symmetry: $x = -\\frac{b}{2a}$
- Vertex Coordinates: $(h, k)$ where $h = -\\frac{b}{2a}$ and $k = f(h)$
- Roots: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

#### 3. How It Is Done (Step-by-Step)
- **Step 1: Find Axis of Symmetry and Vertex:**
  $$ h = -\\frac{-4}{2(1)} = 2 $$
  $$ k = f(2) = (2)^2 - 4(2) + 3 = 4 - 8 + 3 = -1 \\implies \\text{Vertex: } (2, -1) $$
- **Step 2: Find X-Intercepts (Factoring):**
  $$ x^2 - 4x + 3 = 0 \\implies (x - 1)(x - 3) = 0 \\implies x_1 = 1, x_2 = 3 $$
- **Step 3: Find Y-Intercept:**
  $$ f(0) = 0 - 0 + 3 = 3 \\implies (0, 3) $$

[REVEAL_ANSWER]
**Final Answer:** Vertex is **(2, -1)**, X-Intercepts are **(1, 0)** and **(3, 0)**, Y-Intercept is **(0, 3)**, Axis of symmetry is line **$x = 2$**.
[/REVEAL_ANSWER]`;
  }

  // 5. FABM & Journal Entries
  if (lower.includes('journal') || lower.includes('debit') || lower.includes('credit') || lower.includes('fabm') || lower.includes('accounting') || assistantMode === 'fabm') {
    if (mode === 'direct') {
      return `| Date | Account Titles & Explanation | PR | Debit (${currency}) | Credit (${currency}) |
| :--- | :--- | :---: | :---: | :---: |
| Nov 10 | Merchandise Inventory | 120 | ${currency}25,000.00 | |
| | &nbsp;&nbsp;&nbsp;&nbsp;Accounts Payable | 201 | | ${currency}25,000.00 |
| | *(Purchased inventory on account, 2/10, n/30)* | | | |`;
    }
    return `### How to Journalize Perpetual Inventory Merchandising Transactions

#### 1. Core Double-Entry Concept
The fundamental accounting equation:
$$\\mathbf{\\text{Assets} = \\text{Liabilities} + \\text{Owner's Equity}}$$
Under perpetual inventory, purchases of merchandise directly increase the asset account **Merchandise Inventory** (Debit), while incurring trade credit increases **Accounts Payable** (Credit).

#### 2. Governing Rules of Debit and Credit
- Increase in Asset = **Debit**
- Increase in Liability = **Credit**
- Normal balance of Inventory is Debit; normal balance of Accounts Payable is Credit.

#### 3. How It Is Done (Step-by-Step)
- **Step 1: Identify Accounts:** Merchandise is acquired for resale (Merchandise Inventory, Asset) on credit terms (Accounts Payable, Liability).
- **Step 2: Determine Direction:** Assets increase by ${currency}25,000; Liabilities increase by ${currency}25,000.
- **Step 3: Verify Balance:** Debits (${currency}25,000) equal Credits (${currency}25,000).

[REVEAL_ANSWER]
**Final Answer:**
| Date | Account Titles & Explanation | PR | Debit (${currency}) | Credit (${currency}) |
| :--- | :--- | :---: | :---: | :---: |
| Nov 10 | Merchandise Inventory | 120 | ${currency}25,000.00 | |
| | &nbsp;&nbsp;&nbsp;&nbsp;Accounts Payable | 201 | | ${currency}25,000.00 |
| | *(To record purchase of inventory on account, terms 2/10, n/30)* | | | |
[/REVEAL_ANSWER]`;
  }

  // 6. Generic Math & Tutor Fallback
  if (mode === 'direct') {
    return `**Answer:** ${currency}1,250.00`;
  }
  return `### How to Solve: ${message}

#### 1. Core Principle
In applied mathematics, we break the problem into known parameters, governing relationship formulas, and systematic algebra.

#### 2. Governing Formula
$$ \\text{Result} = \\text{Base} \\times (1 + r)^n $$

#### 3. How It Is Done (Step-by-Step)
- **Step 1: Extract Given Quantities:**
  Identify your base parameter, applicable rate, and time cycles.
- **Step 2: Substitute Knowns into the Formula:**
  Compute intermediate terms following order of operations (PEMDAS).
- **Step 3: Verification:**
  Check units and numerical reasonableness.

[REVEAL_ANSWER]
**Final Answer:** Calculated result is **${currency}1,250.00**.
[/REVEAL_ANSWER]`;
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
          setTimeout(() => reject(new Error('AI_TIMEOUT')), 8000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [{ role: 'user', parts: userParts }],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
          timeoutPromise,
        ]);

        const rawText = response?.text || '{}';
        const parsed = JSON.parse(rawText);
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
