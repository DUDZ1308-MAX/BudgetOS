# BudgetOS — Product Requirements Document (PRD)

**Status:** v1.0 Draft
**Date:** 2026-06-30
**Author:** Product & Architecture Team

---

## 1. Vision

A world where every individual — regardless of income — has access to enterprise-grade financial planning tools that were previously reserved for the wealthy. BudgetOS makes sophisticated financial guidance universally accessible.

## 2. Mission

Democratize personal financial intelligence by providing a free, AI-powered budgeting and planning system that runs entirely on free-tier infrastructure, with no subscription barriers, no ads, and no data monetization.

---

## 3. Target Users

| Segment | Description |
|---|---|
| **Young Professionals (22–35)** | First real jobs, student loans, rent/mortgage, building savings |
| **Middle-Income Families (30–50)** | Mortgages, children, multiple income streams, retirement planning |
| **Side Hustlers / Freelancers** | Variable income, irregular expenses, tax planning needs |
| **First-Time Home Buyers** | Mortgage comparison, down payment savings, affordability checks |
| **Debt-Focused Users** | Paying down credit cards, student loans, car loans |
| **Financial Minimalists** | Want one pane of glass — no spreadsheets, no apps per bank |

---

## 4. User Personas

### Persona A: Alex (28, Software Engineer)
- **Income:** $85k/yr, salaried
- **Goals:** Pay off $40k student loans in 3 years, save $60k for house down payment, invest 15%
- **Pain:** Has 5 accounts across 3 banks. Spreadsheet is unmaintainable. Mint died.
- **Needs:** Auto-categorization, debt payoff simulator, savings allocation recommendation

### Persona B: Priya (34, Marketing Manager + Freelance)
- **Income:** $72k salary + $15–25k freelance variable
- **Goals:** Save for wedding ($30k), emergency fund (6 months), travel
- **Pain:** Variable income makes budgeting unreliable. Needs %-based budgeting, not fixed
- **Needs:** Percentage-based budget categories, income averaging, "good month / bad month" scenarios

### Persona C: Marcus (45, Teacher)
- **Income:** $62k/yr, spousal income $48k
- **Goals:** Pay off 30-yr mortgage in 18 years, fund 2 kids' college, retire at 62
- **Pain:** Mortgage payoff unclear — "extra $200/mo saves how much?" No tool gives clear tradeoffs
- **Needs:** Mortgage amortization visualizer, extra payment calculator, tradeoff simulator (extra mortgage vs invest)

### Persona D: Elena (52, Nurse)
- **Income:** $78k/yr
- **Goals:** Retire at 65, debt-free, help aging parents
- **Pain:** No savings. No idea where money goes. Afraid to check.
- **Needs:** Gentle onboarding, Financial Health Score, simple monthly snapshot, AI Coach encouragement

---

## 5. Core Problems Being Solved

| Problem | Solution |
|---|---|
| Personal finance tools require paid subscriptions | Entire MVP on free-tier infrastructure |
| Multiple accounts/banks, no single view | Manual or CSV-based unified transaction ledger |
| Budgeting fails because it's rigid | %-based and envelope-style budgeting, adjustable mid-month |
| Mortgage payoff strategy is opaque | Amortization calculator + extra payment simulator with visual debt-free date |
| Savings feels arbitrary | Rule-based + heuristic savings allocator: "put next $X here" |
| Users don't know their financial health | Single 0–100 Financial Health Score with drill-down |
| Spreadsheet fatigue | Clean web + PWA mobile experience |
| No free AI financial coach exists | AI Coach (MVP = deterministic rules engine, future = LLM) |

---

## 6. Competitive Analysis

| Product | Strengths | Weaknesses | BudgetOS Advantage |
|---|---|---|---|
| **Mint (defunct)** | Great aggregation, free | Shut down | Open-ecosystem, future-proof |
| **YNAB** | Best budgeting methodology | $14.99/mo, steep learning curve | Free, simpler UX |
| **Monarch Money** | Beautiful UI, multi-account | $14.99/mo | Free tier-first |
| **Personal Capital (Empower)** | Investment tracking | Salesy, focused on AUM | No upsells, transparent |
| **EveryDollar** | Zero-based budgeting | $17.99/mo for auto-import | Free core features |
| **Simplifi by Quicken** | Good automation | $3.99/mo | Free alternative |
| **Spreadsheets** | Free, fully customizable | Manual, error-prone, no insights | Automated + intelligent |

**Positioning:** BudgetOS is the **free, privacy-first, AI-powered alternative** that replaces the need for any subscription financial tool.

---

## 7. Core Features (MVP)

### F1. Transaction Tracking
- Manual transaction entry (date, amount, category, account, note)
- CSV import from banks
- Category assignment (predefined + custom)
- Transaction search, filter, edit, delete
- Recurring transaction templates

### F2. Account Management
- Add/edit/delete accounts (checking, savings, credit card, loan, investment)
- Running balance per account (manual reconciliation)
- Net worth calculation across all accounts

### F3. Budget Management
- Monthly budget creation per category
- %-based or fixed-amount budgets
- Rollover / no-rollover per category
- Budget vs actual tracked visually
- Mid-month budget adjustments

### F4. Mortgage Payoff Calculator
- Input: loan amount, rate, term, start date, extra monthly payment
- Output: amortization schedule, debt-free date, total interest saved
- Compare "no extra" vs "extra $X" vs "extra $Y every month"
- Visual chart: remaining balance over time (side-by-side)

### F5. Savings Goals
- Create goals: name, target amount, target date, priority
- Track progress ($ / %)
- Savings allocator suggests where to put next dollar
- Pull from specific accounts

### F6. Financial Health Score (0–100)
- Computed from: savings rate, debt-to-income, emergency fund status, budget adherence, net worth trend
- Score breakdown with actionable improvement tips (deterministic rules)
- Monthly historical trend chart

### F7. Dashboard
- Net worth summary (cards)
- Cash flow (income vs expenses this month)
- Budget health (spending vs budget per top categories)
- Savings goal progress bar
- Mortgage payoff countdown
- Financial Health Score gauge
- Recent transactions (last 5)

### F8. Reports & Insights
- Monthly income vs expense bar chart
- Category breakdown (pie/treemap)
- Net worth trend line (3m / 6m / 1y / all)
- Spending by merchant
- Export to CSV

### F9. Mortgage Payoff Simulator
- Interactive slider for extra monthly payment amount
- Real-time recalculation of debt-free date and interest saved
- "What if I invest instead?" scenario using assumed ROI
- Side-by-side comparison table

### F10. Savings Allocation Recommender
- Rule-based engine
- Priority order: (1) high-interest debt > (2) emergency fund to 3mo > (3) 401k match > (4) emergency fund to 6mo > (5) IRA > (6) mortgage extra > (7) brokerage
- User confirms or overrides allocation

### F11. AI Coach (Deterministic MVP)
- Rule-driven insights, not LLM (for MVP)
- Examples: "You've exceeded your dining budget by 40%. Consider reducing dining out to $X for the rest of the month." / "You could save $Y/mo by refinancing your mortgage at current rates."
- Triggered by user actions (overspend, goal milestone, new transaction)
- Presented as timeline feed

### F12. Data Export / Import
- CSV export of all transactions
- CSV import template
- Full data export (JSON)

---

## 8. Future Features (Post-MVP)

| Feature | Version | Description |
|---|---|---|
| Bank sync (Plaid/Finicity) | v2 | OAuth-based account linking |
| Real-time push notifications | v2 | Budget alerts, bill reminders |
| Multi-currency | v2 | For travelers / expats |
| LLM-powered AI Coach | v3 | Natural language financial Q&A |
| Bill detection from transactions | v3 | Auto-identify recurring bills |
| Tax estimator | v3 | Estimated tax liability based on income/transactions |
| Investment portfolio tracker | v3 | Holdings, returns, allocation |
| Shared / family budgeting | v4 | Multi-user budgets with permissions |
| Goal-based investing | v4 | Link savings goals to fractional investing |
| Open Banking / PSD2 | v4 | EU bank integration |
| Envelope budgeting phase 2 | v4 | Virtual envelopes with overspend blocking |
| Credit score estimator | v5 | Based on user-reported data |
| Financial advisor marketplace | v5 | Optional vetted advisors (commission-free) |
| Scenario engine | v5 | "What if I take this new job?" simulation |
| Mobile native apps (iOS/Android) | v5 | Beyond PWA |

---

## 9. User Stories

### Transaction Management
- US1: As a user, I want to add a transaction quickly so I don't forget where my money went.
- US2: As a user, I want to import CSV files from my bank so I don't have to enter 50 transactions manually.
- US3: As a user, I want to categorize transactions so I can see where my money goes.
- US4: As a user, I want to set up recurring transactions so bills auto-appear each month.
- US5: As a user, I want to search my transactions so I can find that one large purchase.

### Budgeting
- US6: As a user, I want to set a monthly budget per category so I stay within my limits.
- US7: As a user, I want to see budget vs actual at a glance so I know if I'm overspending.
- US8: As a user, I want rollover budgets (e.g., dining) so saved money carries forward.
- US9: As a user, I want to adjust my budget mid-month when life happens.
- US10: As a user, I want %-based budgets because my income varies.

### Mortgage
- US11: As a user, I want to see my full amortization schedule so I understand how my loan works.
- US12: As a user, I want to simulate extra payments so I know how much interest I can save.
- US13: As a user, I want a slider for extra payment so I can find the sweet spot.
- US14: As a user, I want to compare "pay extra" vs "invest extra" so I make informed decisions.

### Savings
- US15: As a user, I want to create savings goals so I stay motivated.
- US16: As a user, I want the system to recommend where to allocate my next dollar.
- US17: As a user, I want goal progress visualizations so I can celebrate milestones.

### Health Score
- US18: As a user, I want a single number that tells me how financially healthy I am.
- US19: As a user, I want to see what's dragging my score down so I know what to fix.
- US20: As a user, I want my score to trend over time so I see improvement.

### AI Coach
- US21: As a user, I want the AI Coach to alert me when I overspend so I can correct course.
- US22: As a user, I want proactive suggestions based on my data.
- US23: As a user, I want the AI Coach to celebrate my wins.

### General
- US24: As a user, I want to see my net worth update when I enter transactions.
- US25: As a user, I want to export my data at any time.
- US26: As a user, I want the app to work on my phone and desktop.
- US27: As a user, I want to know my data is safe and private.

---

## 10. Functional Requirements

### FR1: Transaction CRUD
- FR1.1: Create transaction with: date, amount (signed), category_id, account_id, optional merchant, optional note, optional recurring_template_id
- FR1.2: Edit any field of a transaction
- FR1.3: Soft delete (archived = true)
- FR1.4: List with pagination, sorting (date desc default), filtering (category, account, date range, search query)

### FR2: Category Management
- FR2.1: Seed 20+ default categories (Income: Salary, Freelance, Refunds, Gifts, Other; Expense: Housing, Groceries, Dining, Transport, Utilities, Insurance, Healthcare, Entertainment, Shopping, Education, Savings, Debt, Personal Care, Travel, Gifts, Other)
- FR2.2: User can create custom categories
- FR2.3: Categories belong to Type: INCOME or EXPENSE
- FR2.4: Categories can be archived (not deleted, to preserve history)

### FR3: Account Management
- FR3.1: Account has: name, type (checking/savings/credit/loan/investment/cash), balance, currency (default USD), is_active
- FR3.2: Balance updated automatically when transactions are added/deleted
- FR3.3: Net worth = SUM(positive balances) - SUM(negative/credit balances)

### FR4: Budget Periods
- FR4.1: Budgets are per month (year + month key)
- FR4.2: Each category can have a budget amount (fixed or % of total income)
- FR4.3: Budget vs actual = sum of postings for category in month
- FR4.4: Rollover = unspent from prior month carries forward (per category config)
- FR4.5: Alerts when spending > 80%, 100%, 120% of budget

### FR5: Mortgage Calculator
- FR5.1: Input: principal, annual rate, term_years, start_date, extra_payment (monthly)
- FR5.2: Standard amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
- FR5.3: Output for each month: payment, principal, interest, remaining balance
- FR5.4: Extra payment scenarios: "No Extra", "Extra $X/mo", "Extra $Y/yr", "Lump sum $Z on date N"
- FR5.5: Compare up to 3 scenarios side-by-side

### FR6: Savings Goals
- FR6.1: Goal fields: name, target_amount, current_amount, target_date, priority (1-5), account_id (optional), category_id
- FR6.2: Progress = current / target
- FR6.3: Status: active / completed / cancelled
- FR6.4: When transaction is categorized as Savings/Transfer, update goal progress if linked

### FR7: Financial Health Score
- FR7.1: Computed on-demand and cached monthly
- FR7.2: Components and weights:
  - Savings Rate (30 pts): % of income saved, target >= 20%
  - Debt-to-Income (25 pts): DTI < 36% = 25pts, sliding scale to 0 at 50%+
  - Emergency Fund (20 pts): 6mo expenses saved = 20pts, pro-rata below
  - Budget Adherence (15 pts): % of categories within budget, weighted by category spend
  - Net Worth Trend (10 pts): positive trend = full, flat = half, negative = 0
- FR7.3: Total 0-100
- FR7.4: Each component shows status + actionable tip

### FR8: Savings Allocator Rules
- FR8.1: Order:
  1. High-interest debt (>8% APR): allocate 100% until paid
  2. Emergency fund to 3 months: allocate 100% until reached
  3. Employer 401k match: allocate enough to get full match
  4. Emergency fund to 6 months: allocate 100% until reached
  5. IRA / Roth IRA: allocate up to annual limit
  6. Extra mortgage principal (if user flag is set)
  7. Brokerage / general investment
- FR8.2: User can set percentage splits at each step
- FR8.3: Takes available surplus = income - expenses - sinking funds

### FR9: AI Coach (Deterministic)
- FR9.1: Events are triggered by data state changes
- FR9.2: Rule engine evaluates conditions and generates messages
- FR9.3: Message types: Alert, Tip, Win, Insight
- FR9.4: Stored as coach_messages table, displayed as feed
- FR9.5: Users can dismiss messages

### FR10: Reports
- FR10.1: Cash flow report (income vs expense, monthly bar chart)
- FR10.2: Category breakdown (pie, spending by category, month/year selectable)
- FR10.3: Net worth trend (line chart, selectable range)
- FR10.4: Merchant report (spending grouped by merchant name)
- FR10.5: Export to CSV for any report

### FR11: Authentication & User
- FR11.1: Email + password authentication (Supabase Auth)
- FR11.2: Optional MFA (future)
- FR11.3: Profile: name, currency preference, timezone, locale
- FR11.4: Session management (JWT via Supabase)
- FR11.5: Password reset flow

---

## 11. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR1 | Page load time (initial) | < 3s on 4G |
| NFR2 | Page load time (subsequent) | < 500ms (SPA caching) |
| NFR3 | API response time (p95) | < 300ms |
| NFR4 | Uptime | 99.5% (Supabase SLA) |
| NFR5 | Offline support | PWA with service worker caches last-loaded transactions |
| NFR6 | Concurrent users (MVP) | 1,000 DAU (free-tier row limits) |
| NFR7 | Data storage limit (free Supabase) | 500MB DB, 5GB bandwidth/mo |
| NFR8 | Mobile data efficiency | < 5MB/mo for typical use |
| NFR9 | Number of transactions supported | 50k per user before performance degrades (indexing) |
| NFR10 | Accessibility | WCAG 2.1 AA |
| NFR11 | Browser support | Last 2 versions of Chrome, Firefox, Safari, Edge |
| NFR12 | Localization ready | i18n framework included, English first |
| NFR13 | Dark mode | Support system preference + manual toggle |

---

## 12. Security Considerations

| # | Consideration | Approach |
|---|---|---|
| S1 | Authentication | Supabase Auth (bcrypt hashed, JWT, HTTPS-only) |
| S2 | Row-Level Security (RLS) | Supabase RLS policies on ALL tables — users can ONLY see their own data |
| S3 | API Authorization | All API routes validate JWT and user_id matches |
| S4 | SQL Injection | Supabase client uses parameterized queries (never raw SQL concatenation) |
| S5 | XSS | React/Next.js auto-escapes. CSP headers set via Cloudflare Workers |
| S6 | CSRF | Stateless JWT — no cookies for auth. SameSite strict if cookies used |
| S7 | Input Validation | Zod schemas on all API inputs (server-side, client-side for UX) |
| S8 | Rate Limiting | Cloudflare WAF rate limiting (free: 10 req/s per IP) |
| S9 | Data Encryption at Rest | Supabase encrypts at rest (AES-256) |
| S10 | Data Encryption in Transit | TLS 1.3 (Cloudflare + Supabase) |
| S11 | Session Duration | JWT expires in 7 days, refresh token rotates |
| S12 | Sensitive Fields | No PII in logs. No raw bank numbers stored (only account labels) |
| S13 | Audit Log | User action log for critical operations (optional in MVP) |
| S14 | API Key Exposure | Frontend uses anon key (RLS-restricted). Server uses service_role key only for secure operations |

---

## 13. Privacy Considerations

| # | Principle | Implementation |
|---|---|---|
| P1 | Data Minimization | Only collect fields needed for financial tracking. No SSN, no full account numbers, no DOB |
| P2 | No Data Selling | Explicitly stated in privacy policy. No third-party analytics that share data |
| P3 | User Data Ownership | Export anytime (CSV/JSON). Delete account = delete all data (hard delete within 30 days) |
| P4 | Encryption | AES-256 at rest, TLS 1.3 in transit |
| P5 | Analytics Privacy | First-party, privacy-preserving analytics only (Plausible or equivalent — no Google Analytics) |
| P6 | Supabase Data Residency | Choose US or EU region during signup |
| P7 | No Third-Party Trackers | Zero external tracking scripts. No ads. No Facebook/Twitter pixels |
| P8 | Transparent Privacy Policy | Plain language. What we collect, why, how long we keep it |
| P9 | Right to be Forgotten | Account deletion wipes all rows via cascade |
| P10 | Financial Data Sensitivity | No transaction data ever leaves the user's tenant (RLS enforced at DB level) |

---

## 14. Mortgage Calculation Rules (High Level)

### Standard Monthly Payment (P&I)
```
M = P * [r(1+r)^n] / [(1+r)^n - 1]
```
_Where:_ P = principal, r = monthly rate (annual/12), n = total payments (term*12)

### Amortization Schedule
- For each month: calculate interest = remaining_balance * monthly_rate
- Principal = payment - interest
- Remaining balance reduces by principal portion
- Track cumulative interest paid

### Extra Payment Scenarios
1. **Fixed extra monthly**: Add amount to monthly payment. All extra goes to principal. Recalculate amortization from month 1 with new payment.
2. **Annual lump sum**: Add extra payment in specified month (e.g., month 12).
3. **One-time lump sum**: Insert extra payment at month N.
4. **Bi-weekly accelerated**: 26 half-payments/year = 13 full payments/year instead of 12.

### Side-by-Side Comparison
- Scenario A: No extra payment (baseline)
- Scenario B: Extra $X/mo
- Scenario C: Extra $Y/mo or lump sum
- Compare: pay-off date, total interest paid, total interest saved vs baseline

### Invest vs. Pay Extra
- Assume user invests the extra amount instead at a configurable ROI (e.g., 7%)
- Future value formula: FV = PMT * [((1+r)^n - 1) / r]
- Compare: (net worth after payoff + no more payments) vs (investment value - remaining mortgage balance)
- Break-even analysis chart

---

## 15. Savings Allocation Logic (High Level)

### Surplus Calculation
```
Surplus = Total Monthly Income - Total Monthly Expenses - Sinking Funds
```
- Sinking funds = known future expenses divided by months (e.g., $1200/yr insurance = $100/mo)

### Allocation Queue (in order)
```
Priority 1: High-Interest Debt (APR > 8%)
  Action: Allocate 100% of surplus until balance = 0

Priority 2: Emergency Fund (Tier 1 — 3 months)
  Target: 3 × monthly expenses
  Action: Allocate 100% surplus until reached

Priority 3: Employer 401k Match
  Action: Allocate enough to meet match threshold (e.g., 6% of salary)
  (Note: tracked as allocation recommendation, not an actual transfer)

Priority 4: Emergency Fund (Tier 2 — 6 months)
  Action: Allocate 100% surplus until reached

Priority 5: IRA / Roth IRA (max $7k/yr or $583/mo)
  Action: Allocate up to limit, remaining overflows to next

Priority 6: Extra Mortgage Principal (if enabled)
  Action: Allocate user-specified % of remaining surplus

Priority 7: Taxable Brokerage / General Savings
  Action: Allocate remaining surplus
```

### User Customization
- User can override the priority order
- User can set % splits at any level (e.g., 50% to mortgage, 50% to brokerage)
- User can set target amounts for each step

### Visual Output
- Sankey-style flow: "Available $1,000" -> "Debt $400" -> "Emergency $300" -> "Invest $300"
- Monthly surplus, allocated amounts, timeline to goal completion

---

## 16. Financial Health Score Definition (High Level)

### Formula
```
FHS = min(100, round(SavingsRateScore + DTIScore + EmergencyFundScore + BudgetScore + NetWorthTrendScore))
```

### Component Breakdown

| Component | Max Points | Calculation |
|---|---|---|
| **Savings Rate** | 30 | savings_rate = savings / income. If >= 20% -> 30pts. Linear scale: (rate / 0.20) * 30. |
| **Debt-to-Income** | 25 | DTI = monthly debt payments / monthly income. If <= 36% -> 25pts. Linear decrease to 0 at 50%+. |
| **Emergency Fund** | 20 | Months of expenses saved = emergency_balance / monthly_expenses. Linear: (months / 6) * 20. |
| **Budget Adherence** | 15 | Weighted average of category adherence. Each category = min(1, budget_actual / budget_target). Weighted by budget_target. Scored as: weighted_avg * 15. |
| **Net Worth Trend** | 10 | Compare current net worth vs 3 months ago. Positive (>0%) -> 10pts. Flat (0 to -5%) -> 5pts. Negative (< -5%) -> 0pts. |

### Scoring Tiers
| Score | Rating | Color |
|---|---|---|
| 80-100 | Excellent | Green |
| 60-79 | Good | Yellow-green |
| 40-59 | Fair | Yellow |
| 20-39 | Concerning | Orange |
| 0-19 | Critical | Red |

### Improvement Recommendations (Rules)
- If savings rate < 20%: "Your savings rate is X%. Aim for 20%. Try increasing by 1% per month."
- If DTI > 36%: "Your debt-to-income ratio is X%. Consider a debt consolidation plan."
- If emergency fund < 3 months: "Build your emergency fund to 3 months of expenses before investing."
- If budget adherence < 80%: "You went over budget in X, Y, Z categories this month."
- If net worth declining: "Your net worth dropped X% this quarter. Review large expenses."

---

## 17. AI Coach Concept (Design Only — Deterministic MVP)

### Architecture (MVP)
- NOT an LLM integration (MVP) — purely rule-based
- Rules evaluated on state change (transaction added, budget period ends, monthly rollover)
- Rules map to pre-written message templates with variable interpolation

### Rule Categories

#### Alert Rules (high priority)
- "You have exceeded your {category} budget by ${overspend} ({overspend_percent}%)."
- "Your total spending this month is {spend_percent}% of your income. Consider reducing non-essentials."
- "Your {account} balance is ${balance}. Below your {threshold} minimum threshold."

#### Tip Rules (medium priority)
- "Based on your spending patterns, you could save ${amount}/mo by reducing {category} by {percent}%."
- "Round-up your purchases? 52,345 transactions at $0.47 avg = ${potential_savings}/year in spare change."
- "You have {count} subscriptions totaling ${total}/mo. Are they all active?"

#### Win Rules (low priority — only when triggered)
- "You've stayed under budget in all categories this month!"
- "Your net worth is up ${amount} ({percent}%) this month. Keep it up!"
- "Savings goal '{name}' is {percent}% complete. You're {ahead/behind} schedule by {delta}."

#### Insight Rules (medium priority)
- "Your biggest expense category this month was {category} ({percent}% of total)."
- "Your income was {higher/lower} than average by {amount}. This was due to {reason} (if traceable)."
- "You've been a BudgetOS user for {days} days. Your Financial Health Score has {improved/declined} by {delta} points."

### Message Model
```
{
  id: uuid,
  user_id: uuid,
  type: 'alert' | 'tip' | 'win' | 'insight',
  title: string,
  message: string (interpolated),
  category: string (budget | spending | savings | mortgage | health | general),
  is_read: boolean,
  is_dismissed: boolean,
  created_at: timestamp,
  triggered_by: string (entity type + id)
}
```

### Future: v3 LLM Integration
- Replace rule engine with LLM call (OpenAI API or self-hosted)
- Pass structured financial context (budget summary, transactions, goals, score)
- LLM generates personalized natural language advice
- User can ask follow-up questions
- Cost management: limit queries per day, cache common patterns

---

## 18. Dashboard Layout Requirements

### Header (Persistent)
- Logo + "BudgetOS"
- Navigation (desktop: horizontal, mobile: hamburger)
- User avatar/initial + dropdown (Profile, Settings, Logout)

### Main Dashboard Grid (Desktop)

```
+------------------------------------------------------------------+
|  +---------+ +---------+ +---------+ +---------+                 |
|  | Net     | | Cash    | | Budget  | | FHS     |                 |
|  | Worth   | | Flow    | | Health  | | Gauge   |                 |
|  | $XX,XXX | | +$X,XXX | | 78%     | | 72/100  |                 |
|  +---------+ +---------+ +---------+ +---------+                 |
|                                                                    |
|  +------------------------------+  +----------------------------+ |
|  |  Monthly Budget vs Actual    |  |  Savings Goals             | |
|  |  (Horizontal bar chart)      |  |  [████████░░ 80%           | |
|  |  Housing ████████████░░░ 85% |  |  [████░░░░░░ 40%           | |
|  |  Food    ██████████░░░░ 70%  |  |  [██████████ 100%          | |
|  |  Transport ████░░░░░░ 45%   |  |                            | |
|  +------------------------------+  +----------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  Mortgage Payoff Countdown                                    | |
|  |  No extra: Jul 2045 (19yr)  |  +$200/mo: Jul 2035 (9yr)     | |
|  |  Interest saved: $62,340                                    | |
|  |  [View Full Simulator ->]                                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +------------------------------+  +----------------------------+ |
|  |  AI Coach Feed              |  |  Recent Transactions        | |
|  |  ⚠ Dining budget exceeded   |  |  -$45.00 Groceries         | |
|  |  💡 Try round-up savings    |  |  +$3,200 Salary            | |
|  |  🎉 Under budget this month |  |  -$120 Electric Bill       | |
|  +------------------------------+  +----------------------------+ |
+------------------------------------------------------------------+
```

### Dashboard Responsive Breakpoints
- **Desktop (>=1024px):** 4 columns for metric cards, 2-column main area
- **Tablet (768-1023px):** 2 columns metric cards, single column content
- **Mobile (<768px):** Single column, stacked cards, horizontal scroll disabled

### Key UX Rules
- All numbers are formatted: $X,XXX.XX for USD
- Negative values in red, positive in green
- Sparklines on trendable metrics
- Empty states with onboarding CTAs for new users
- Maximum 6 metric cards (to avoid overwhelming)
- FHS gauge is circular/arc, prominently positioned top-right

---

## 19. App Navigation Structure

```
Dashboard (Home)
├── Overview / Net worth
├── Quick actions (Add Transaction, Import CSV)
└── AI Coach Feed

Transactions
├── All Transactions
│   ├── List view (filterable, searchable, paginated)
│   └── Calendar view (optional, future)
├── Add Transaction
├── Import CSV
├── Recurring Transactions
└── Categories (management)

Budgets
├── Current Month Budget
│   ├── Budget vs Actual per category
│   └── Adjust Budget
├── Budget History
│   └── Past months (selectable)
└── Budget Settings
    ├── Rollover preferences
    └── Default budget amounts

Accounts
├── All Accounts (list with balances)
├── Add Account
├── Net Worth Summary
└── Reconciliation (manual)

Mortgage
├── Mortgage Overview
│   ├── Current amortization schedule
│   └── Payoff date, interest summary
├── Extra Payment Simulator
│   ├── Slider
│   ├── Scenario comparison
│   └── Invest vs Pay chart
└── Multiple mortgages (future)

Savings
├── Savings Goals
│   ├── Active goals with progress
│   └── Completed goals
├── Create Goal
├── Savings Allocator
│   ├── Current surplus
│   ├── Allocation flow chart
│   └── Customize priorities
└── Sinking Funds (future)

Reports
├── Cash Flow (income vs expense)
├── Category Breakdown
├── Net Worth Trend
├── Merchant Report
├── Financial Health Score History
└── Export Data

AI Coach
├── Coach Feed (all messages)
├── Filter: Alerts | Tips | Wins | Insights
└── Archived Messages

Settings
├── Profile (name, email, currency, timezone)
├── Account Preferences (theme, locale, date format)
├── Categories (customize default + add custom)
├── Data Management (import, export, delete)
├── Security (change password, MFA future)
└── About / Privacy

Authentication (pre-login)
├── Login
├── Sign Up
├── Forgot Password
└── Post-login onboarding wizard (3-5 step setup)
```

---

## 20. Screen List (All Pages)

| # | Screen Name | Route | Purpose |
|---|---|---|---|
| 01 | Landing / Splash | `/` | Marketing landing page, CTA to sign up |
| 02 | Login | `/login` | Email/password authentication |
| 03 | Sign Up | `/signup` | Create account |
| 04 | Forgot Password | `/forgot-password` | Password reset |
| 05 | Onboarding Step 1 | `/onboarding/income` | Set up income sources |
| 06 | Onboarding Step 2 | `/onboarding/expenses` | Set up recurring expenses |
| 07 | Onboarding Step 3 | `/onboarding/accounts` | Add initial accounts |
| 08 | Onboarding Step 4 | `/onboarding/goals` | Set initial goals (optional) |
| 09 | Dashboard | `/dashboard` | Main overview |
| 10 | Transactions | `/transactions` | Full transaction list |
| 11 | Transaction Add | `/transactions/add` | Manual entry form |
| 12 | Transaction Edit | `/transactions/:id/edit` | Edit entry |
| 13 | Transaction Detail | `/transactions/:id` | View single transaction |
| 14 | CSV Import | `/transactions/import` | CSV upload + mapping |
| 15 | Recurring Transactions | `/transactions/recurring` | Manage templates |
| 16 | Categories | `/categories` | Manage categories |
| 17 | Budget Current | `/budgets/current` | Current month budget view |
| 18 | Budget Adjust | `/budgets/:year/:month` | View/edit specific month |
| 19 | Budget Settings | `/budgets/settings` | Global budget preferences |
| 20 | Accounts | `/accounts` | All accounts overview |
| 21 | Account Add | `/accounts/add` | Add account form |
| 22 | Account Detail | `/accounts/:id` | Account transactions + balance |
| 23 | Net Worth | `/net-worth` | Net worth summary + trend |
| 24 | Mortgage Overview | `/mortgage` | Mortgage summary + amortization |
| 25 | Mortgage Simulator | `/mortgage/simulator` | Extra payment scenarios |
| 26 | Mortgage Invest vs Pay | `/mortgage/invest-vs-pay` | Tradeoff analysis |
| 27 | Savings Goals | `/savings` | All goals overview |
| 28 | Savings Goal Detail | `/savings/:id` | Single goal progress |
| 29 | Savings Goal Add | `/savings/add` | Create goal |
| 30 | Savings Allocator | `/savings/allocator` | Allocation flow |
| 31 | Reports Cash Flow | `/reports/cash-flow` | Income vs expense chart |
| 32 | Reports Categories | `/reports/categories` | Category breakdown |
| 33 | Reports Net Worth | `/reports/net-worth-trend` | Net worth line chart |
| 34 | Reports Merchants | `/reports/merchants` | Merchant spending |
| 35 | Reports FHS | `/reports/health-score` | Score history |
| 36 | Export | `/reports/export` | Data export page |
| 37 | AI Coach | `/coach` | Coach message feed |
| 38 | Profile | `/settings/profile` | User profile edit |
| 39 | Preferences | `/settings/preferences` | Theme, locale, format |
| 40 | Security | `/settings/security` | Password, MFA |
| 41 | Data Management | `/settings/data` | Import, export, delete |
| 42 | About | `/settings/about` | Version, privacy, terms |
| 43 | 404 | `*` | Not found page |

**Total: 43 screens (MVP subset: ~30)**

---

## 21. Data Entities (High-Level Database Model)

### Core Entities

| Entity | Key Fields | Relationships |
|---|---|---|
| **users** | id, email, hashed_password, name, currency, timezone, locale, created_at | Inherited from Supabase Auth |
| **profiles** | id (FK users), onboarding_complete, theme_pref, monthly_budget_day | 1:1 with users |
| **accounts** | id, user_id, name, type (enum), balance (decimal), currency, is_active, sort_order, created_at | M:1 with users |
| **categories** | id, user_id, name, type (income/expense), icon, color, is_system, is_archived | M:1 with users |
| **transactions** | id, user_id, account_id, category_id, amount (signed decimal), date, merchant, note, is_recurring, recurring_template_id, is_archived, created_at, updated_at | M:1 with users, M:1 accounts, M:1 categories |
| **recurring_templates** | id, user_id, category_id, account_id, amount, frequency (monthly/weekly/biweekly/yearly), day_of_month, merchant, note, is_active, next_date | M:1 with users |
| **budgets** | id, user_id, category_id, year, month, amount (decimal), rollover (bool), created_at, updated_at | M:1 with users, M:1 categories |
| **savings_goals** | id, user_id, name, target_amount, current_amount, target_date, priority, account_id (optional), category_id (optional), status, created_at, updated_at | M:1 with users |
| **mortgages** | id, user_id, name, principal, annual_rate, term_years, start_date, extra_payment (decimal), extra_payment_frequency, is_active | M:1 with users |
| **amortization_cache** | id, mortgage_id, month_number, payment, principal, interest, remaining_balance (for performance) | M:1 mortgages |
| **financial_health_scores** | id, user_id, score, savings_rate_score, dti_score, emergency_fund_score, budget_score, net_worth_score, calculated_at, month_key | M:1 with users |
| **coach_messages** | id, user_id, type, title, message, category, is_read, is_dismissed, triggered_by_entity, created_at | M:1 with users |
| **allocator_config** | id, user_id, steps (JSON array of priority config), custom_surplus_formula (JSON) | 1:1 with users |

### Important Design Notes
- **RLS:** Every table has `user_id` and a Supabase RLS policy: `USING (user_id = auth.uid())`
- **Transactions:** Amount is signed (positive = income, negative = expense). Running balance on accounts is computed via SQL aggregation, not stored.
- **Soft Deletes:** All entities support `is_archived` rather than hard delete (except truly sensitive user data).
- **Indexes:** (user_id, date) on transactions. (user_id, year, month) on budgets. (user_id, type, is_read) on coach_messages.
- **Free Tier Constraints:** Supabase free tier = 500MB DB. Estimated ~300 bytes/transaction + overhead ≈ 1.5M transactions max. With 50k/user cap, supports ~30 heavy users or ~500 light users.

---

## 22. API Structure (High Level)

### Base URL
```
https://budgetos-rust.vercel.app    (Vercel deployment)
```

### Endpoints

#### Auth (handled by Supabase Auth SDK, not custom API)
```
POST /auth/v1/signup
POST /auth/v1/login
POST /auth/v1/logout
POST /auth/v1/recover
```

#### Transactions
```
GET    /transactions                     # List (paginated, filterable)
POST   /transactions                     # Create
GET    /transactions/:id                 # Get single
PATCH  /transactions/:id                 # Update
DELETE /transactions/:id                 # Soft delete
POST   /transactions/import              # Bulk CSV import
```

#### Accounts
```
GET    /accounts                         # List (with balances)
POST   /accounts                         # Create
GET    /accounts/:id                     # Detail
PATCH  /accounts/:id                     # Update
DELETE /accounts/:id                     # Archive
```

#### Categories
```
GET    /categories                       # List
POST   /categories                       # Create custom
PATCH  /categories/:id                   # Update
DELETE /categories/:id                   # Archive
```

#### Budgets
```
GET    /budgets?year=&month=             # Get budget for month
POST   /budgets                          # Create/update
PATCH  /budgets/:id                      # Adjust single category
GET    /budgets/summary?year=&month=     # Budget vs actual summary
```

#### Mortgage
```
GET    /mortgages                        # List
POST   /mortgages                        # Create
PATCH  /mortgages/:id                    # Update
DELETE /mortgages/:id                    # Archive
GET    /mortgages/:id/amortization       # Full schedule
POST   /mortgages/simulate               # What-if scenario
```

#### Savings
```
GET    /savings/goals                    # List goals
POST   /savings/goals                    # Create
PATCH  /savings/goals/:id                # Update
DELETE /savings/goals/:id                # Cancel
GET    /savings/allocator                # Current allocation recommendation
PATCH  /savings/allocator/config         # Update allocator config
```

#### Reports
```
GET    /reports/cash-flow?months=6       # Income vs expense
GET    /reports/category-breakdown       # By category
GET    /reports/net-worth                # Over time
GET    /reports/merchants                # By merchant
```

#### Financial Health Score
```
GET    /health-score                     # Current score
GET    /health-score/history             # Score over time
GET    /health-score/breakdown           # Component breakdown
```

#### AI Coach
```
GET    /coach/messages                   # List (paginated, filterable by type)
PATCH  /coach/messages/:id               # Mark read/dismissed
POST   /coach/messages/:id/dismiss       # Dismiss
GET    /coach/messages/unread-count      # Badge count
```

#### User / Settings
```
GET    /me                                # Profile
PATCH  /me                                # Update profile
DELETE /me                                # Delete account + data
GET    /me/export                         # Export all data
```

### API Design Principles
- RESTful with consistent resource naming
- Pagination via `?page=X&limit=Y` (default 50, max 100)
- Filtering via query params: `?category_id=X&date_from=Y&date_to=Z`
- Sorting via `?sort=field:asc|desc` (default created_at:desc)
- Response format: `{ data: ..., error: ..., pagination: { page, limit, total } }`
- All responses: HTTP status codes (200, 201, 400, 401, 403, 404, 422, 500)
- Error format: `{ error: { code, message, details } }`
- Client: Generated TypeScript SDK via openapi-typescript or tRPC

---

## 23. UI/UX Principles

| # | Principle | Description |
|---|---|---|
| UX1 | Progressive Disclosure | Show summary first, drill-down on demand. Don't overwhelm with data. |
| UX2 | Data at a Glance | Numbers + visual indicators (colors, bars, gauges). No wall of text. |
| UX3 | Consistency | Same color meanings everywhere (green=positive/good, red=negative/bad, yellow=warning). Same layout patterns. |
| UX4 | Forgiveness | Undo actions when possible. Confirm before deletes. Soft deletes with 30-day trash. |
| UX5 | Empty States | New users see onboarding prompts, not blank pages. "Add your first transaction" CTA with example. |
| UX6 | Feedback | Every action shows immediate feedback (toast, spinner, or optimistic UI). |
| UX7 | Financial Tone | Professional, reassuring, never alarmist. Numbers formatted cleanly. |
| UX8 | Mobile-First | Design for mobile screens first, then enhance for desktop. |
| UX9 | Keyboard Navigation | Full keyboard support for power users (Tab order, Enter to submit, Escape to cancel). |
| UX10 | Optimistic UI | Update UI immediately on user actions, sync to server in background. |
| UX11 | Undo | "Transaction deleted. [Undo]" banner for 10 seconds. |
| UX12 | Tour | Optional guided tour on first login (3 steps: "Here's your Dashboard", "Add a Transaction", "Check your Health Score"). |
| UX13 | Skeleton Loading | Use skeleton screens, not spinners, for data loading. |
| UX14 | Autosave | Never lose data. Autosave forms on blur. |

---

## 24. Accessibility Requirements

| # | Standard | Implementation |
|---|---|---|
| A1 | WCAG 2.1 AA | Target compliance level |
| A2 | Color Contrast | Minimum 4.5:1 for normal text, 3:1 for large text |
| A3 | Keyboard Navigation | All interactive elements reachable and operable via keyboard alone |
| A4 | Focus Indicators | Visible focus outlines on all interactive elements (2px solid, high-contrast) |
| A5 | Screen Reader Labels | All inputs, icons, charts have aria-labels. Chart data in accessible tables. |
| A6 | Semantic HTML | Proper heading hierarchy (h1-h6), nav, main, section, article, aside |
| A7 | ARIA Landmarks | banner, navigation, main, complementary, contentinfo, form |
| A8 | Error Announcements | Form errors announced via aria-live="assertive" |
| A9 | Dynamic Content | aria-live="polite" for AI Coach feed updates |
| A10 | Color Independence | No information conveyed solely by color. Patterns + labels accompany colors. |
| A11 | Font Size | Minimum 16px for inputs to prevent iOS zoom. Relative units (rem) for scalability. |
| A12 | Reduced Motion | Respect prefers-reduced-motion. Animations optional. |
| A13 | Touch Targets | Minimum 44x44px for mobile touch targets |
| A14 | Skip Navigation | "Skip to content" link at top of every page |
| A15 | Language Attribute | `<html lang="en">` set based on user locale |

---

## 25. Mobile Responsiveness Requirements

| # | Requirement | Detail |
|---|---|---|
| M1 | PWA Support | Manifest.json, service worker, install prompt. Works offline for previously loaded data. |
| M2 | Responsive Grid | CSS Grid/Flexbox. Breakpoints: 480px (small phone), 768px (tablet), 1024px (desktop), 1440px (wide) |
| M3 | Touch-Friendly | All interactive elements >= 44px. Swipe gestures for list items (delete, archive). |
| M4 | Bottom Navigation | Mobile: bottom tab bar with 5 icons (Dashboard, Transactions, Budgets, Accounts, More) |
| M5 | Sticky Headers | Section headers stick on scroll for context |
| M6 | Pull to Refresh | Dashboard and transaction list support pull-to-refresh |
| M7 | Infinite Scroll | Transaction list loads more on scroll (no pagination clicks on mobile) |
| M8 | Horizontal Scroll | Never. All content wraps or becomes a slideshow/carousel. |
| M9 | Data Tables | Tables become stacked cards on mobile (label: value per row) |
| M10 | Charts | Charts become full-width, single-column on mobile |
| M11 | Forms | Single-column, full-width inputs on mobile. Grouped sections with collapsible headers. |
| M12 | Safe Areas | Respect iOS notch and Android status bar with safe-area-inset-* |
| M13 | Font Scaling | Use rem/em. Test at 200% zoom. No text overflow. |
| M14 | Fast 4G | Bundle < 200KB JS gzipped. Lazy load charts, non-critical sections. |

---

## 26. Free-Tier Deployment Architecture (CRITICAL)

### Architecture Diagram (Text)
```
+-------------------------------------------------------------+
|  Browser / PWA                                              |
|  (React SPA hosted on Cloudflare Pages)                     |
|  - Static assets (JS, CSS, HTML)                            |
|  - Service worker for offline cache                         |
|  - Supabase client SDK (anon key)                           |
+---------------------------+---------------------------------+
                            | HTTPS (TLS 1.3)
                            v
+-------------------------------------------------------------+
|  Vercel (FREE tier)                                         |
|  - Static site hosting                                      |
|  - Global CDN                                               |
|  - Custom domain (budgetos-rust.vercel.app)                 |
|  - Automatic HTTPS                                          |
+---------------------------+---------------------------------+
                            | API calls via Supabase JS SDK
                            v
+-------------------------------------------------------------+
|  Cloudflare Workers (FREE)  [OPTIONAL / FUTURE]             |
|  - 100k requests/day                                        |
|  - For: AI Coach Rule Engine (server-side), CSV parsing     |
|  - Or: Use Supabase Edge Functions instead (free 500k/mo)   |
+---------------------------+---------------------------------+
                            |
                            v
+-------------------------------------------------------------+
|  Supabase (FREE TIER)                                       |
|  +----------------------+  +------------------------------+ |
|  |  PostgreSQL Database  |  |  Supabase Auth               | |
|  |  - 500MB storage      |  |  - Built-in user management  | |
|  |  - Row Level Security |  |  - Email/password auth       | |
|  |  - 2GB RAM            |  |  - JWT tokens                | |
|  |  - Auto backups       |  |  - Password reset            | |
|  +----------------------+  +------------------------------+ |
|  +----------------------+  +------------------------------+ |
|  |  Supabase Storage     |  |  Supabase Edge Functions     | |
|  |  - 1GB storage        |  |  - 500k invocations/month   | |
|  |  - For CSV uploads    |  |  - For: server-side logic    | |
|  |  - User avatars       |  |  - Deno runtime              | |
|  +----------------------+  +------------------------------+ |
|  +----------------------+                                   |
|  |  Supabase Realtime    |                                   |
|  |  - 2M messages/mo    |                                   |
|  |  - For: live updates |                                   |
|  +----------------------+                                   |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
|  Third-Party (FREE)                                         |
|  +----------------------+                                   |
|  |  Sentry (free tier)   |  - 5k errors/mo                 |
|  |  Error tracking       |                                   |
|  +----------------------+                                   |
|  +----------------------+                                   |
|  |  Plausible (self-host |  - Privacy-first analytics       |
|  |  or cloud free tier)  |  - OR: umami, or none           |
|  +----------------------+                                   |
|  +----------------------+                                   |
|  |  GitHub Actions       |  - CI/CD (free for public repos)|
|  |  (Free for public)    |  - Lint, test, deploy            |
|  +----------------------+                                   |
+-------------------------------------------------------------+
```

### Free-Tier Capacity Plan
| Service | Limit | BudgetOS Estimate | Headroom |
|---|---|---|---|
| Cloudflare Pages | 500 builds/mo, 500MB storage | ~50 builds/mo, ~50MB | 10x |
| Cloudflare Workers | 100k req/day | ~500 API calls/day (delegated to Supabase) | 200x |
| Supabase DB | 500MB, 2GB RAM | ~100MB for 200 users @ 50k txns each | 5x |
| Supabase Auth | 50k users | 1k users = 50x headroom | 50x |
| Supabase Storage | 1GB | ~100MB (CSV uploads) | 10x |
| Supabase Edge Functions | 500k invocations/mo | ~10k/mo | 50x |
| GitHub Actions | 2000 min/mo (public) | ~200 min/mo | 10x |
| Sentry | 5k errors/mo | ~500 errors/mo | 10x |

### Why No Paid Services Are Needed
- **Database:** Supabase free tier (PostgreSQL) = 500MB, sufficient for 200-500 active users
- **Auth:** Supabase Auth free tier (50k users)
- **Hosting:** Cloudflare Pages (unlimited bandwidth on free plan)
- **APIs:** Supabase Edge Functions (500k/mo) or Cloudflare Workers (100k/day)
- **Storage:** Supabase Storage (1GB) for user uploads
- **CI/CD:** GitHub Actions (free for public repos)
- **Analytics:** Plausible community edition or Umami (free self-hosted on Railway free tier)
- **Error Tracking:** Sentry free tier (5k errors/mo)

### Migrating to Growth Stage (without paying)
- If hitting limits, optimize before scaling up:
  1. Archive old transactions to cold storage (Supabase bucket as JSON)
  2. Implement data retention policies (keep last 3 years hot)
  3. Use Cloudflare KV (free 1GB) for caching amortization schedules
  4. Implement read replicas via Supabase (paid feature, but defer)

---

## 27. Scalability Roadmap

### Phase 1: MVP (0-100 users)
- **Architecture:** Single-region, single Supabase project
- **Caching:** None (direct DB queries)
- **Offline:** Service worker caches shell + last-load data
- **Performance:** Direct Supabase queries with RLS. Optimize with DB indexes.
- **Monitoring:** Sentry free tier + custom health-check endpoint

### Phase 2: Growth (100-1,000 users)
- **Caching:** Introduce Cloudflare KV for mortgage amortization results (computation-heavy, cacheable)
- **DB Pools:** Supabase provides connection pooling automatically
- **Materialized Views:** For dashboard aggregates. Refresh daily via pg_cron (Supabase supports)
- **Pagination:** Ensure all list endpoints use cursor-based pagination
- **Batch Processing:** Offload monthly rollover computations to Supabase Edge Function (scheduled via cron)

### Phase 3: Scale (1,000-10,000 users)
- **Read Replicas:** Upgrade to Supabase Pro ($25/mo) for read replicas. Or migrate to self-hosted Supabase on a VPS.
- **CDN Caching:** Cache API responses at Cloudflare Workers level using Cache API
- **Database Sharding:** By user_id hash range. Accept this requires paid tier or self-hosting.
- **Background Jobs:** Use Supabase queues (pgmq) or Cloudflare Queues for async processing
- **Analytics:** Move from Plausible self-hosted to Plausible Cloud ($19/mo) or retain self-hosted

### Phase 4: Enterprise (10,000+ users)
- **Architecture Shift:** Move to dedicated PostgreSQL instances (RDS, Cloud SQL, or self-hosted Supabase)
- **Microservices:** Split reports, mortgage calculator, AI Coach into separate services
- **Kubernetes:** Run on DOKS, EKS, or GKE for container orchestration
- **Multi-Region:** Primary in US, read-replica in EU for latency
- **Cost:** At this stage, revenue from optional premium features (bank sync, AI Coach unlimited) covers infrastructure

---

## 28. Version Roadmap (v1 -> v5)

### v1 - MVP ("Core Foundations")
**Timeline:** 0-3 months

**Theme:** Build the essential personal finance tracker with all core calculations working offline and on free-tier.

**Features:**
- Authentication (email/password via Supabase Auth)
- Account management (CRUD)
- Category management (preset + custom)
- Transaction tracking (manual entry + CSV import)
- Monthly budget creation (fixed + %-based, rollover)
- Budget vs actual visualization
- Mortgage calculator (amortization + extra payment)
- Savings goals (create, track progress)
- Financial Health Score (0-100)
- Dashboard (net worth, cash flow, budget health, FHS)
- Reports (cash flow, category breakdown, net worth trend)
- Data export (CSV/JSON)
- PWA support (installable, offline shell)
- Mobile-responsive UI
- Dark mode

**Technical Milestones:**
- Cloudflare Pages + Supabase free tier deployed
- RLS policies on all tables
- CI/CD pipeline (GitHub Actions -> Cloudflare Pages)
- 100% test coverage on calculation functions (mortgage, FHS, allocator)

---

### v2 - Connected & Proactive
**Timeline:** 3-6 months

**Theme:** Connected experience — bank sync, proactive alerts, and richer insights.

**Features:**
- Plaid/Finicity OAuth integration (bank feed)
- Auto-categorization of transactions (ML-based, lightweight)
- Recurring bill detection from transaction history
- Push notifications (budget alerts, bill reminders, goal milestones)
- Multi-currency support
- Calendar view of transactions
- Enhanced reports: merchant spending, income sources
- Notification preferences
- Shared access (view-only for spouse/partner)
- Tags on transactions (beyond categories)

**Technical Milestones:**
- Plaid/Finicity API integration (both offer free tiers for low volume)
- Simple ML model for categorization (or rules-based frequency analysis)
- Recurring transaction detection algorithm
- Push notification via service worker (free) or OneSignal free tier

---

### v3 - Intelligent Coach
**Timeline:** 6-9 months

**Theme:** AI-powered financial coaching and guidance — the system becomes proactive, not just reactive.

**Features:**
- LLM-powered AI Coach (OpenAI API or self-hosted LLM)
- Natural language financial Q&A
- "Explain this" on any chart or number
- Personalized financial tips based on full user context
- Spending pattern anomaly detection
- "What if I [action]?" natural language scenarios
- Bill negotiation suggestions
- Investment portfolio tracker (manual entries)
- Tax estimator (based on income/expense data)
- Scenario comparison improvement

**Technical Milestones:**
- LLM integration with structured financial context prompt
- Safety guardrails (no hallucinated numbers, no investment advice disclaimers)
- Cost monitoring: budget max $0.10/user/month via caching + prompt optimization
- Anomaly detection (statistical outlier detection on transaction patterns)

---

### v4 - Family & Envelopes
**Timeline:** 9-12 months

**Theme:** Multi-user budgeting and advanced money management methodology.

**Features:**
- Multi-user budgets (shared household)
- Permission management (admin, editor, viewer)
- Envelope budgeting system
- Virtual envelopes with overspend blocking
- Sinking funds (car repairs, vacations, holidays)
- Goal-based investing (link goals to fractional investing via APIs)
- Open Banking / PSD2 (EU integration)
- Credit card payoff optimizer (avalanche vs snowball)
- Net worth milestones (celebrations at key thresholds)
- Recurring transfer templates

**Technical Milestones:**
- Multi-user RLS policies (complex access patterns)
- Real-time collaboration via Supabase Realtime
- Envelope balance management (constraint: cannot overspend envelope)
- Third-party investing API integration (Alpaca free tier for fractional shares)

---

### v5 - Mature Platform
**Timeline:** 12-18 months

**Theme:** Platform maturity — premium optional features, native apps, and ecosystem.

**Features:**
- Native iOS and Android apps (React Native or Flutter)
- Credit score estimator (based on user-reported data)
- Financial advisor marketplace (optional, commission-free)
- Scenario engine ("What if I take this new job?" "What if I move to Austin?")
- Advanced mortgage refinance calculator
- Tax-loss harvesting suggestions (investment)
- Estate planning basics (will, beneficiaries, trusts)
- Retirement planner (full Monte Carlo simulation)
- API for third-party developers (optional, future)
- Premium tier ($5/mo): unlimited bank sync, advanced AI, family sharing

**Technical Milestones:**
- Native mobile apps with biometric auth
- Monte Carlo simulation engine (WASM-based for performance)
- Public API with rate limiting and API keys
- Premium subscription via Stripe (integration cost, but paid features cover it)
- SOC 2 compliance preparation

---

### Transition from Free to Paid (v5+)
- **Free Tier Always:** Core features remain free forever — manual tracking, budgets, mortgage calc, FHS, limited AI Coach
- **Premium ($5/mo):** Bank sync, unlimited AI Coach, family sharing, advanced reports, CSV export to PDF
- **Why users pay:** Convenience, not necessity. Free tier is genuinely useful on its own.

---

## Appendices

### A. Technology Stack Recommendation

| Layer | Technology | Free Tier? | Rationale |
|---|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Yes | Fast builds, type safety |
| **UI Library** | Radix UI + Tailwind CSS | Yes | Accessible, composable, utility-first |
| **State Management** | Zustand + React Query | Yes | Lightweight, server-state sync |
| **Charts** | Recharts / Chart.js | Yes | Free, React-friendly |
| **Forms** | React Hook Form + Zod | Yes | Performant, validated |
| **Routing** | React Router v6 | Yes | Standard |
| **PWA** | vite-plugin-pwa | Yes | Zero-config PWA |
| **Backend/Database** | Supabase (PostgreSQL + Auth + Storage) | Yes (500MB DB, 50k users) | Complete backend |
| **Serverless Functions** | Supabase Edge Functions | Yes (500k/mo) | For CSV parsing, AI rules |
| **Hosting** | Cloudflare Pages | Yes (unlimited bandwidth) | Global CDN, fast builds |
| **CI/CD** | GitHub Actions | Yes (public repos) | Free 2000 min/mo |
| **Analytics** | Plausible (self-hosted) | Yes (or Umami) | Privacy-first |
| **Error Tracking** | Sentry | Yes (5k errors/mo) | Industry standard |
| **Testing** | Vitest + Playwright | Yes | Fast, modern |
| **i18n** | react-i18next | Yes | Mature ecosystem |

### B. Key Calculation Libraries (Free, no code)
- **Big Number Math:** decimal.js (handles currency precision)
- **Date Handling:** date-fns (lightweight, tree-shakeable)
- **CSV Parsing:** Papa Parse (browser + worker)

### C. Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Supabase free tier row limits hit | Medium | Implement data archiving (move old transactions to cold storage) |
| Cloudflare Pages build limit exceeded | Low | Optimize build frequency, use PR previews only on demand |
| Plaid API costs at scale | Medium | Free tier covers small volume. Charge premium for bank sync. |
| LLM API costs at scale | Medium | Caching + prompt optimization + per-user daily limit. Premium feature. |
| User data loss | Low | Supabase auto-backups. Weekly export reminder to users. |
| Privacy regulation changes | Low | Design for data portability from day one. Encrypt PII. |
| Browser storage limits (PWA) | Low | Store only cache in browser, not authoritative data. |

---

*End of PRD. This document serves as the complete specification for BudgetOS v1 design and implementation. All decisions prioritize free-tier viability, user privacy, and long-term scalability without premature optimization.*
