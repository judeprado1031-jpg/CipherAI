import { ChatSession, ReviewItem, QuizQuestion } from '../types';

export const INITIAL_FORMULAS: ReviewItem[] = [
  {
    id: 'formula-npv',
    title: 'Net Present Value (NPV)',
    category: 'Corporate Finance',
    problem: 'Evaluating capital expenditure projects by discounting future cash flows to time zero.',
    solution:
      'NPV > 0 creates shareholder value (Accept). NPV < 0 destroys value (Reject). A hurdle rate or WACC is used as the discount rate $r$.',
    formula: '$$ \\text{NPV} = \\sum_{t=1}^{n} \\frac{CF_t}{(1 + r)^t} - C_0 $$',
    tags: ['Capital Budgeting', 'DCF', 'Investment'],
    savedAt: Date.now() - 86400000 * 2,
    notes: 'Remember: Only include incremental after-tax cash flows. Exclude sunk costs and financing interest (already captured in WACC).',
  },
  {
    id: 'formula-wacc',
    title: 'Weighted Average Cost of Capital (WACC)',
    category: 'Corporate Finance',
    problem: 'Calculating a firm’s blended hurdle rate considering equity and tax-shielded debt.',
    solution:
      'Multiplies the proportion of equity and debt by their respective required rates, taking the corporate tax shield $(1 - T_c)$ on interest payments into account.',
    formula: '$$ \\text{WACC} = \\left( \\frac{E}{V} \\times R_e \\right) + \\left( \\frac{D}{V} \\times R_d \\times (1 - T_c) \\right) $$',
    tags: ['Cost of Capital', 'Valuation', 'Corporate Finance'],
    savedAt: Date.now() - 86400000 * 3,
    notes: 'Cost of Equity $R_e$ is typically estimated via CAPM: $R_e = R_f + \\beta(R_m - R_f)$.',
  },
  {
    id: 'formula-black-scholes',
    title: 'Black-Scholes-Merton Option Pricing',
    category: 'Quantitative',
    problem: 'Theoretical estimate of the price of European call and put options.',
    solution:
      'Prices the non-arbitrage call option premium using spot price $S$, strike $K$, risk-free rate $r$, time $T$, and volatility $\\sigma$.',
    formula:
      '$$ C = S \\cdot N(d_1) - K e^{-rT} N(d_2) \\quad \\text{where} \\; d_1 = \\frac{\\ln(S/K) + (r + \\sigma^2/2)T}{\\sigma\\sqrt{T}}, \\; d_2 = d_1 - \\sigma\\sqrt{T} $$',
    tags: ['Derivatives', 'Options', 'Quantitative'],
    savedAt: Date.now() - 86400000 * 4,
    notes: 'Delta for Call = $N(d_1)$; Delta for Put = $N(d_1) - 1$.',
  },
  {
    id: 'formula-breakeven',
    title: 'Break-Even Quantity & Revenue',
    category: 'Pricing & Ops',
    problem: 'Finding the sales volume required to cover all fixed and variable operating costs.',
    solution:
      'Unit Contribution Margin is $(P - VC)$. Break-Even revenue equals Fixed Costs divided by the Contribution Margin Ratio.',
    formula: '$$ Q_{BE} = \\frac{\\text{Fixed Costs}}{P - VC}, \\quad \\text{Revenue}_{BE} = \\frac{\\text{Fixed Costs}}{\\frac{P - VC}{P}} $$',
    tags: ['Operations', 'Pricing', 'Break-Even'],
    savedAt: Date.now() - 86400000 * 5,
    notes: 'Margin of Safety = (Expected Sales - Break-Even Sales) / Expected Sales.',
  },
  {
    id: 'formula-eoq',
    title: 'Economic Order Quantity (EOQ)',
    category: 'Pricing & Ops',
    problem: 'Minimizing the sum of inventory ordering costs and holding/carrying costs.',
    solution:
      'Balances fixed setup cost per order $S$ against unit holding cost $H$ for annual demand $D$.',
    formula: '$$ \\text{EOQ} = \\sqrt{\\frac{2 D S}{H}} $$',
    tags: ['Operations', 'Inventory', 'Supply Chain'],
    savedAt: Date.now() - 86400000 * 6,
    notes: 'Total Annual Cost is minimized where Annual Ordering Cost = Annual Holding Cost.',
  },
  {
    id: 'formula-dupont',
    title: 'DuPont 3-Step ROE Decomposition',
    category: 'Corporate Finance',
    problem: 'Deconstructing Return on Equity into operational efficiency, asset utilization, and financial leverage.',
    solution:
      'Dissects profitability into Net Profit Margin $\\times$ Asset Turnover $\\times$ Equity Multiplier.',
    formula:
      '$$ \\text{ROE} = \\left( \\frac{\\text{Net Income}}{\\text{Sales}} \\right) \\times \\left( \\frac{\\text{Sales}}{\\text{Total Assets}} \\right) \\times \\left( \\frac{\\text{Total Assets}}{\\text{Total Equity}} \\right) $$',
    tags: ['Financial Ratios', 'DuPont', 'ROE'],
    savedAt: Date.now() - 86400000 * 7,
    notes: 'Identifies whether ROE growth is driven by margin expansion, faster inventory turns, or risky debt leverage.',
  },
  {
    id: 'formula-amortization',
    title: 'Loan Amortization Payment',
    category: 'Pricing & Ops',
    problem: 'Calculating the fixed periodic payment on an amortizing loan or mortgage.',
    solution:
      'Equates the present value of all level annuity payments to the principal loan amount.',
    formula: '$$ PMT = P \\cdot \\frac{r(1 + r)^n}{(1 + r)^n - 1} $$',
    tags: ['Amortization', 'Mortgage', 'Loans'],
    savedAt: Date.now() - 86400000 * 8,
    notes: 'Early payments are dominated by interest; late payments consist mostly of principal repayment.',
  },
  {
    id: 'formula-accounting-eq',
    title: 'The Fundamental Accounting Equation (FABM 1)',
    category: 'Accounting (FABM)',
    problem: 'The foundational bedrock of double-entry bookkeeping and balance sheet preparation.',
    solution:
      'Assets represent economic resources owned; Liabilities represent creditors claims; Equity represents owners residual claim. Debits must always equal Credits.',
    formula: '$$ \\text{Assets} = \\text{Liabilities} + \\text{Owner\'s Equity} + (\\text{Revenues} - \\text{Expenses} - \\text{Drawings}) $$',
    tags: ['FABM 1', 'Accounting Equation', 'Balance Sheet'],
    savedAt: Date.now() - 86400000 * 1,
    notes: 'DEAD CLIC mnemonic: Debits increase Expenses, Assets, Drawings. Credits increase Liabilities, Income (Revenue), Capital (Equity).',
  },
  {
    id: 'formula-bank-rec',
    title: 'Bank Reconciliation Statement (FABM 2)',
    category: 'Accounting (FABM)',
    problem: 'Reconciling differences between cash balance per general ledger and cash balance per bank statement.',
    solution:
      'Adjusts book balance for unrecorded collections, interest, NSF checks, and fees. Adjusts bank balance for deposits in transit and outstanding checks.',
    formula: '$$ \\text{Adjusted Book Balance} = \\text{Book Bal} + \\text{Credit Memos} - \\text{Debit Memos} \\pm \\text{Book Errors} $$ \n$$ \\text{Adjusted Bank Balance} = \\text{Bank Bal} + \\text{Deposits in Transit} - \\text{Outstanding Checks} \\pm \\text{Bank Errors} $$',
    tags: ['FABM 2', 'Bank Reconciliation', 'Cash Management'],
    savedAt: Date.now() - 86400000 * 1,
    notes: 'Rule: Only book reconciling items require adjusting journal entries in the general journal.',
  },
  {
    id: 'formula-cogs',
    title: 'Cost of Goods Sold (COGS) & Gross Profit (FABM 1 & 2)',
    category: 'Accounting (FABM)',
    problem: 'Determining product costs for merchandising and manufacturing business SCI.',
    solution:
      'Beginning Inventory plus Net Cost of Purchases plus Freight-In equals Cost of Goods Available for Sale (COGAS). Subtracting Ending Inventory yields Cost of Sales.',
    formula: '$$ \\text{Net Purchases} = \\text{Purchases} - \\text{Purchase Returns/Allowances} - \\text{Purchase Discounts} + \\text{Freight-In} $$ \n$$ \\text{COGS} = \\text{Beg. Inventory} + \\text{Net Purchases} - \\text{Ending Inventory} $$',
    tags: ['FABM 1', 'Merchandising', 'Cost of Sales', 'Gross Profit'],
    savedAt: Date.now() - 86400000 * 2,
    notes: 'Gross Profit = Net Sales - COGS. Gross Margin % = Gross Profit / Net Sales.',
  },
  {
    id: 'formula-depreciation',
    title: 'Straight-Line & Double Declining Depreciation (FABM 1 & 2)',
    category: 'Accounting (FABM)',
    problem: 'Allocating depreciable asset cost systematically over its useful economic lifespan.',
    solution:
      'Straight-line spreads cost evenly net of salvage value. Double declining accelerates expense based on 2 / Useful Life without deducting salvage initially.',
    formula: '$$ \\text{Annual Depr (SL)} = \\frac{\\text{Cost} - \\text{Salvage Value}}{\\text{Useful Life}} \\quad | \\quad \\text{Rate (DDB)} = \\frac{2}{n} \\times \\text{Beg. Book Value} $$',
    tags: ['FABM 1', 'Adjusting Entries', 'Depreciation', 'PPE'],
    savedAt: Date.now() - 86400000 * 3,
    notes: 'Accumulated Depreciation is a contra-asset account with a normal credit balance, netted against PPE on the SFP.',
  },
];

export const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session-demo-fabm',
    title: 'FABM: Journal Entries & Adjustments',
    assistantMode: 'fabm',
    defaultTeachingMode: 'teach',
    isPinned: true,
    createdAt: Date.now() - 3600000 * 1,
    updatedAt: Date.now() - 3600000 * 1,
    messages: [
      {
        id: 'msg-fabm-1',
        role: 'user',
        content:
          'On Nov 10, our merchandising business purchased inventory costing ₱25,000 on account with terms 2/10, n/30, FOB shipping point. We paid ₱1,200 cash for freight on Nov 12. On Nov 14, we returned ₱3,000 of defective goods. Teach me how to record these transactions in the general journal and calculate the cash payment on Nov 19.',
        timestamp: Date.now() - 3600000 * 1,
        teachingMode: 'teach',
        assistantMode: 'fabm',
      },
      {
        id: 'msg-fabm-2',
        role: 'assistant',
        content: `### FABM 1 Accounting Breakdown: Perpetual Merchandising Transactions

#### 1. Core Accounting Intuition & Account Classification
In standard double-entry bookkeeping, every transaction maintains the fundamental equality:
$$ \\mathbf{\\text{Assets} = \\text{Liabilities} + \\text{Owner's Equity}} $$

- **Merchandise Inventory**: Asset account. Increased with a **Debit**.
- **Accounts Payable**: Liability account. Increased with a **Credit**.
- **Freight-In (Transportation-In)**: Under FOB shipping point, freight is paid by the buyer and added directly to the cost of inventory.
- **Cash Discounts (2/10, n/30)**: A $2\\%$ cash incentive for paying within 10 days.

#### 2. Formal General Journal
| Date | Account Titles & Explanation | PR | Debit (₱) | Credit (₱) |
| :--- | :--- | :---: | :---: | :---: |
| Nov 10 | Merchandise Inventory | 120 | 25,000.00 | |
| | &nbsp;&nbsp;&nbsp;&nbsp;Accounts Payable | 201 | | 25,000.00 |
| | *(Purchased goods on account, terms 2/10, n/30)* | | | |
| Nov 12 | Merchandise Inventory (Freight-In) | 120 | 1,200.00 | |
| | &nbsp;&nbsp;&nbsp;&nbsp;Cash | 101 | | 1,200.00 |
| | *(Paid freight on purchase, FOB Shipping Point)* | | | |
| Nov 14 | Accounts Payable | 201 | 3,000.00 | |
| | &nbsp;&nbsp;&nbsp;&nbsp;Merchandise Inventory | 120 | | 3,000.00 |
| | *(Returned damaged merchandise to supplier)* | | | |

#### 3. Settlement Calculation on Nov 19 (Within Discount Window)
- **Gross Accounts Payable**: ₱25,000.00 - ₱3,000.00 = ₱22,000.00
- **Cash Discount (2%)**: $₱22,000.00 \\times 0.02 = \\mathbf{₱440.00}$
- **Net Cash Payment**:
  $$ \\text{Cash Paid} = ₱22,000.00 - ₱440.00 = \\mathbf{₱21,560.00} $$

#### General Journal Entry on Settlement (Nov 19):
| Date | Account Titles & Explanation | PR | Debit (₱) | Credit (₱) |
| :--- | :--- | :---: | :---: | :---: |
| Nov 19 | Accounts Payable | 201 | 22,000.00 | |
| | &nbsp;&nbsp;&nbsp;&nbsp;Merchandise Inventory (Discount) | 120 | | 440.00 |
| | &nbsp;&nbsp;&nbsp;&nbsp;Cash | 101 | | 21,560.00 |
| | *(Settled account within 2/10 discount period)* | | | |

#### 4. Self-Check Practice
*Checkpoint:* If the payment was made on Nov 25 (after the 10-day discount period), how much cash must be disbursed? (Hint: The discount is forfeited, so the full remaining ₱22,000 invoice balance is paid).`,
        timestamp: Date.now() - 3600000 * 1 + 1000,
        teachingMode: 'teach',
        assistantMode: 'fabm',
        bookmarked: true,
        topic: 'FABM Merchandising Cycle',
      },
    ],
  },
  {
    id: 'session-demo-1',
    title: 'NPV & Capital Budgeting Analysis',
    assistantMode: 'business_math',
    defaultTeachingMode: 'teach',
    isPinned: true,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content:
          'Our manufacturing firm is evaluating a new robotics packaging line with an initial investment of $250,000. It produces net cash inflows of $75,000 per year for 5 years. Our corporate cost of capital is 10%. Teach me how to evaluate whether we should accept this project.',
        timestamp: Date.now() - 3600000 * 2,
        teachingMode: 'teach',
        assistantMode: 'cfo',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `### How to Evaluate Capital Projects Using Net Present Value (NPV)

#### 1. Core Concept & Economic Intuition
When evaluating major equipment acquisitions like a robotics packaging line, we cannot simply add up $75,000 \\times 5 = $375,000 and declare a profit. Money received five years from now has a lower purchasing power and carries risk. 

**Net Present Value (NPV)** converts every future dollar into today's equivalent using your company's hurdle rate ($10\\%$). If the sum of discounted cash flows exceeds your initial outlay ($250,000), the project creates shareholder wealth.

#### 2. Governing Equation
$$ \\text{NPV} = \\sum_{t=1}^{n} \\frac{CF_t}{(1 + r)^t} - C_0 $$

Where:
- $CF_t = \\$75,000$ (Annual net cash flow)
- $r = 10\\% = 0.10$ (Corporate cost of capital / WACC)
- $n = 5$ years (Project lifespan)
- $C_0 = \\$250,000$ (Initial capital outlay)

#### 3. Step-by-Step Execution
Since the cash flows are identical each year, this is an **Ordinary Annuity**. We can calculate the Present Value of each year:

| Year ($t$) | Cash Flow ($CF_t$) | Discount Factor $(1 + 0.10)^{-t}$ | Discounted PV |
| :---: | :---: | :---: | :---: |
| Year 1 | $75,000.00 | $0.90909$ | $68,181.82 |
| Year 2 | $75,000.00 | $0.82645$ | $61,983.47 |
| Year 3 | $75,000.00 | $0.75131$ | $56,348.61 |
| Year 4 | $75,000.00 | $0.68301$ | $51,226.01 |
| Year 5 | $75,000.00 | $0.62092$ | $46,569.08 |
| **Sum of PVs** | | | **$308,416.72** |

Now subtract the initial outlay:
$$ \\text{NPV} = \\$308,416.72 - \\$250,000.00 = \\mathbf{+\\$58,416.72} $$

#### 4. Additional Investment Metrics
- **Internal Rate of Return (IRR)**: $15.24\\%$ (Significantly higher than the $10.0\\%$ hurdle rate).
- **Profitability Index (PI)**: $\\frac{\\$308,416.72}{\\$250,000.00} = 1.234$.
- **Payback Period**: $\\frac{\\$250,000}{\\$75,000} = 3.33 \\text{ years}$.

#### 5. Managerial Decision
**Decision: ACCEPT THE PROJECT.**
The positive NPV of **+$58,416.72** directly increases the firm's equity value by that amount.

#### 6. Self-Check Practice
*Checkpoint:* If unexpected inflation pushes your hurdle rate up to $16\\%$, would the project still create value? (Hint: compare $16\\%$ with the project's IRR of $15.24\\%$).`,
        timestamp: Date.now() - 3600000 * 2 + 1000,
        teachingMode: 'teach',
        assistantMode: 'cfo',
        bookmarked: true,
        topic: 'Capital Budgeting',
      },
    ],
  },
  {
    id: 'session-demo-2',
    title: 'Gross Margin vs Markup on Cost',
    assistantMode: 'operations',
    defaultTeachingMode: 'direct',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content:
          'If our cost of goods sold is $65.00 and we want a 40% gross profit margin, what should our selling price be, and what is the equivalent markup on cost?',
        timestamp: Date.now() - 3600000 * 24,
        teachingMode: 'direct',
        assistantMode: 'operations',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `### Executive Pricing Analysis: Gross Margin vs. Markup

**Required Selling Price: $108.33**
**Equivalent Markup on Cost: 66.67%**

#### Calculation Summary Table
| Metric | Value | Formula |
| :--- | :--- | :--- |
| **Unit Cost (COGS)** | $65.00 | Given |
| **Target Gross Margin %** | 40.00% | Given |
| **Selling Price ($P$)** | **$108.33** | $P = \\frac{\\text{COGS}}{1 - \\text{Margin}}$ |
| **Gross Profit Dollar ($)** | $43.33 | $\\text{Price} - \\text{Cost}$ |
| **Markup on Cost %** | **66.67%** | $\\frac{\\text{Gross Profit}}{\\text{Cost}} \\times 100\\%$ |

#### Governing Formulas Applied
$$ \\text{Price} = \\frac{\\text{COGS}}{1 - \\text{Gross Margin}} = \\frac{65.00}{1 - 0.40} = \\frac{65.00}{0.60} = \\mathbf{\\$108.33} $$

$$ \\text{Markup on Cost} = \\frac{\\text{Selling Price} - \\text{Cost}}{\\text{Cost}} = \\frac{108.33 - 65.00}{65.00} = \\frac{43.33}{65.00} = \\mathbf{66.67\\%} $$

*Executive Note:* A common retailer trap is multiplying cost by $1.40$ ($65 \\times 1.40 = \\$91.00$). Selling at $\\$91.00$ yields only a $28.57\\%$ gross margin, severely degrading cash flow. Always divide by $(1 - M)$.`,
        timestamp: Date.now() - 3600000 * 24 + 1000,
        teachingMode: 'direct',
        assistantMode: 'operations',
        bookmarked: false,
        topic: 'Pricing Strategy',
      },
    ],
  },
];

export const STATIC_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    title: 'DuPont Financial Leverage',
    topic: 'Corporate Finance',
    difficulty: 'Intermediate',
    problemStatement:
      'Omni Corp has a Net Profit Margin of 8.0%, an Asset Turnover of 1.5, and Total Assets of $10,000,000 financed with $4,000,000 of equity. What is Omni Corp’s Return on Equity (ROE)?',
    options: ['12.0%', '18.0%', '30.0%', '24.5%'],
    correctIndex: 2,
    explanation:
      'Equity Multiplier = Assets / Equity = $10M / $4M = 2.5. By DuPont: ROE = Net Margin (8%) * Asset Turnover (1.5) * Equity Multiplier (2.5) = 0.08 * 1.5 * 2.5 = 30.0%.',
    formulaUsed: '$$ \\text{ROE} = \\text{Net Margin} \\times \\text{Asset Turnover} \\times \\frac{\\text{Assets}}{\\text{Equity}} $$',
  },
  {
    title: 'Operating Break-Even Calculation',
    topic: 'Operations',
    difficulty: 'Beginner',
    problemStatement:
      'A SaaS company charges $50/month per seat. Server and maintenance costs are $10/seat/month. Monthly fixed salaries and rent total $120,000. How many paid seats are needed to break even?',
    options: ['2,400 seats', '3,000 seats', '4,000 seats', '12,000 seats'],
    correctIndex: 1,
    explanation:
      'Contribution Margin per seat = $50 - $10 = $40. Break-even volume = Fixed Costs / Unit Contribution Margin = $120,000 / $40 = 3,000 seats.',
    formulaUsed: '$$ Q_{BE} = \\frac{FC}{P - VC} $$',
  },
  {
    title: 'Effective Annual Rate (EAR)',
    topic: 'Financial Math',
    difficulty: 'Intermediate',
    problemStatement:
      'A credit facility quotes a nominal APR of 12.0% compounded monthly. What is the Effective Annual Rate (EAR)?',
    options: ['12.00%', '12.36%', '12.68%', '13.14%'],
    correctIndex: 2,
    explanation:
      'EAR = (1 + r/m)^m - 1 = (1 + 0.12/12)^12 - 1 = (1.01)^12 - 1 = 1.126825 - 1 = 12.68%.',
    formulaUsed: '$$ \\text{EAR} = \\left(1 + \\frac{\\text{APR}}{m}\\right)^m - 1 $$',
  },
  {
    title: 'Bond Yield & Price Invariance',
    topic: 'Quantitative',
    difficulty: 'Advanced',
    problemStatement:
      'A 10-year annual coupon bond has a coupon rate of 7.0% and a par value of $1,000. If the market yield to maturity (YTM) equals 7.0%, what is the market price of the bond?',
    options: ['$932.00', '$1,000.00', '$1,070.00', '$1,125.00'],
    correctIndex: 1,
    explanation:
      'When Coupon Rate equals the Yield to Maturity, the bond trades exactly at Par Value ($1,000.00). If YTM > Coupon, it trades at discount; if YTM < Coupon, at premium.',
    formulaUsed: '$$ P = C \\left[ \\frac{1 - (1+y)^{-n}}{y} \\right] + \\frac{M}{(1+y)^n} = M \\quad \\text{when } c = y $$',
  },
  {
    title: 'Bank Reconciliation Outstanding Checks (FABM 2)',
    topic: 'Accounting (FABM)',
    difficulty: 'Intermediate',
    problemStatement:
      'A company cash balance per bank statement shows $45,200. Deposits in transit are $6,800, and outstanding checks total $9,400. What is the reconciled adjusted cash balance?',
    options: ['$42,600', '$47,800', '$52,600', '$38,600'],
    correctIndex: 0,
    explanation:
      'Under the adjusted balance method: Adjusted Bank Balance = Unadjusted Bank Balance ($45,200) + Deposits in Transit ($6,800) - Outstanding Checks ($9,400) = $42,600.',
    formulaUsed: '$$ \\text{Adjusted Bank Bal} = \\text{Bank Bal} + \\text{DIT} - \\text{Outstanding Checks} $$',
  },
  {
    title: 'Merchandising Cash Discount 2/10, n/30 (FABM 1)',
    topic: 'Accounting (FABM)',
    difficulty: 'Beginner',
    problemStatement:
      'On May 4, a firm purchased $20,000 of goods with terms 2/10, n/30, FOB shipping point. Returned $2,000 of damaged goods on May 7. If paid in full on May 12, how much cash was disbursed?',
    options: ['$17,640', '$18,000', '$19,600', '$17,600'],
    correctIndex: 0,
    explanation:
      'Net invoice balance = $20,000 - $2,000 = $18,000. Paid within 10 days (May 4 to May 12 is 8 days), earning 2% discount ($18,000 * 0.02 = $360). Cash paid = $18,000 - $360 = $17,640.',
    formulaUsed: '$$ \\text{Cash Paid} = (\\text{Purchases} - \\text{Returns}) \\times (1 - \\text{Discount Rate}) $$',
  },
  {
    title: 'Year-End Accrued Interest Adjusting Entry (FABM 1)',
    topic: 'Accounting (FABM)',
    difficulty: 'Intermediate',
    problemStatement:
      'On Nov 1, a company issued a $60,000, 6-month, 10% note payable. What adjusting entry is required on Dec 31 for the calendar year-end?',
    options: [
      'Debit Interest Expense $1,000, Credit Interest Payable $1,000',
      'Debit Interest Expense $3,000, Credit Interest Payable $3,000',
      'Debit Interest Payable $1,000, Credit Cash $1,000',
      'Debit Interest Expense $6,000, Credit Cash $6,000',
    ],
    correctIndex: 0,
    explanation:
      'Interest accrued for 2 months (Nov & Dec): $60,000 * 10% * (2/12) = $1,000. Adjusting entry: Debit Interest Expense $1,000, Credit Interest Payable $1,000.',
    formulaUsed: '$$ \\text{Interest} = \\text{Principal} \\times \\text{Rate} \\times \\frac{\\text{Time}}{12} = 60,000 \\times 0.10 \\times \\frac{2}{12} = 1,000 $$',
  },
];
