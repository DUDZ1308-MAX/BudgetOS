# BudgetOS Financial Engine — Architecture Document

> Version 1.0.0  
> Author: BudgetOS Architecture Team  
> Status: Implemented

---

## 1. Overall Engine Structure

### 1.1 Package Identity

The Financial Engine lives at `@budgetos/engine` within the monorepo. It is a **zero-dependency, pure-computation** TypeScript package — no database, no HTTP, no frontend, no file system. It is consumed as a library by the API layer and the test runner.

### 1.2 Design Principles

| Principle | Rule |
|---|---|
| **Deterministic** | Same input → same output, always. No `Math.random()`, no `new Date()` without explicit date argument, no clock reads in computation paths. |
| **Pure Functions** | Every function is `(input: T) => Result`. No mutations. No shared state. No singletons. No classes. |
| **No Exceptions** | Every fallible function returns the `EngineResult<T>` discriminated union. The engine never `throw`s. |
| **Integer Cents** | All monetary values are stored as integer cents (`bigint`-compatible `number`). Floating point is only used for intermediate division. |
| **ISO Date Strings** | All date inputs and outputs are `YYYY-MM-DD` strings. `Date` objects are only instantiated for `currentMonthKey()` and day-clamping. |
| **Framework Agnostic** | Zero runtime dependencies. Works in Node.js, Deno, Bun, Cloudflare Workers, and browser. |
| **Composable** | Small functions compose into larger calculators. Each component is independently testable. |

### 1.3 Dependency Graph

```
@budgetos/shared (domain types + constants)
    │
    └── @budgetos/engine
            ├── shared/          (math, date, errors, precision)
            ├── budget/          (summary, status, adherence)
            ├── savings/         (surplus, goals, allocator)
            ├── mortgage/        (amortization, scenarios, invest-vs-pay)
            ├── health-score/    (score, components, recommendations)
            └── coach/           (engine, templates, rules)
```

The engine depends **only** on `@budgetos/shared` for types and constants. It imports nothing else.

---

## 2. Module Breakdown

### 2.1 Shared Utilities (`shared/`)

The foundation layer. Every engine module imports from here.

#### `shared/errors.ts` — Typed Result System

```typescript
type EngineErrorCode =
  | 'NEGATIVE_PRINCIPAL' | 'INVALID_RATE' | 'TERM_TOO_LONG' | 'TERM_TOO_SHORT'
  | 'AMOUNT_OVERFLOW'    | 'DATE_MISMATCH' | 'DIVISION_BY_ZERO' | 'INVALID_INPUT'
  | 'INVALID_EXTRA_PAYMENT' | 'NEGATIVE_BALANCE' | 'MISSING_REQUIRED_FIELD'
  | 'UNEXPECTED_ERROR';

interface EngineError {
  code: EngineErrorCode;
  message: string;
  recoverable: boolean;
}

type EngineResult<T> =
  | { success: true;  data: T }
  | { success: false; error: EngineError };
```

- `success<T>(data: T): EngineResult<T>`
- `failure<T>(error: EngineError): EngineResult<T>`
- `engineError(code, message, recoverable?): EngineError`
- `validateMortgageInput(principal, annualRate, termYears): EngineError | null`

#### `shared/math.ts` — Financial Math

All rates as decimals (e.g., `0.065` for 6.5%). All payments in integer cents.

| Function | Formula | Edge Cases |
|---|---|---|
| `computeMonthlyPayment(P, r, n)` | PMT standard: `P * r * (1+r)^n / ((1+r)^n - 1)` | Rate=0 → `P / n` |
| `computeFutureValue(pmt, r, n)` | FV of annuity: `pmt * ((1+r)^n - 1) / r` | Rate=0 → `pmt * n` |
| `computeInterestPortion(balance, r)` | `round(balance * r)` | Balance=0 → 0 |
| `computePrincipalPortion(pmt, interest)` | `pmt - interest` | — |
| `computeSavingsRate(savings, income)` | `savings / income` | Income ≤ 0 → 0 |
| `computeDTI(debt, income)` | `debt / income` | Income ≤ 0 → 1 |
| `computeEmergencyFundMonths(balance, expenses)` | `balance / expenses` | Expenses ≤ 0 → 0 |
| `linearScore(ratio, target, max)` | `min(ratio / target, 1) * max` | — |
| `inverseLinearScore(ratio, good, bad, max)` | Descent: `good → max, bad → 0` | — |

#### `shared/date.ts` — Date Arithmetic

- `monthsBetween(start, end)`: Whole months between two ISO dates
- `addMonths(date, n)`: Add N months with day-clamping
- `currentMonthKey()`: `YYYY-MM` for current time
- `amortizationPeriodCount(start, term)`: Always `term * 12`

#### `shared/precision.ts` — Formatting

- `toCents(dollars)`, `toDollars(cents)`, `formatCents(cents)`, `formatPercent(rate)`
- `clamp(value, min, max)`, `roundTo(value, decimals)`

---

### 2.2 Budget Engine (`budget/`)

**Purpose**: Compare planned budgets against actual spending, compute rollovers, generate category-level and overall budget health.

**Entry point**: `computeBudgetSummary(input: BudgetInput): BudgetSummaryResult`

```typescript
interface BudgetInput {
  budgets: CategoryBudget[];          // [{ categoryId, amount, percentage, rolloverEnabled }]
  transactions: TransactionSummary[]; // [{ categoryId, totalAmount }]
  previousMonthRollovers: Rollover[]; // [{ categoryId, unspentAmount }]
  totalIncome: number;                // cents
}

interface BudgetSummaryResult {
  categories: CategoryBudgetResult[];  // per-category breakdown
  overall: OverallBudgetSummary;       // aggregated totals
}

interface CategoryBudgetResult {
  categoryId: string;
  budgeted: number;
  spent: number;
  rollover: number;
  available: number;          // budgeted + rollover - spent
  percentUsed: number;        // (spent / budgeted) * 100
  status: 'under' | 'on_track' | 'at_limit' | 'over';
}

interface OverallBudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRollover: number;
  remaining: number;
  adherence: number;          // weighted adherence percentage
}
```

**Supporting functions**:
- `computeCategoryStatus(percentUsed)`: Maps percent thresholds to status strings
- `computeWeightedAdherence(categories)`: Weighted by budgeted amount, penalizes overspend

---

### 2.3 Mortgage Engine (`mortgage/`)

**Purpose**: Full amortization schedule generation, multi-scenario comparison, invest-vs-pay-down analysis.

#### Full Amortization

```typescript
interface MortgageInput {
  principal: number;           // cents
  annualRate: number;          // e.g., 6.5 for 6.5%
  termYears: number;           // 1–50
  startDate: string;
  extraPayments: ExtraPayment[];
}

type ExtraPayment =
  | { type: 'monthly_fixed'; amount: number }
  | { type: 'biweekly'; amount: number }
  | { type: 'annual_lump'; amount: number; startMonth?: number }
  | { type: 'one_time'; amount: number; month: number };

interface MortgageCalcResult {
  monthlyPayment: number;
  schedule: AmortizationRow[];
  totalPayments: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string;
  payoffMonths: number;
  interestSaved: number;      // vs. baseline no-extra-payment
}

interface AmortizationRow {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  totalInterestToDate: number;
  remainingBalance: number;
  extraPayment: number;
}
```

**Algorithm**:
1. Validate input (`validateMortgageInput`).
2. Compute `monthlyRate = annualRate / 100 / 12`.
3. Compute `basePayment` via PMT formula.
4. Iterate month 1 to `termYears * 12`:
   - Compute interest on current balance: `round(balance * rate)`.
   - Determine extra payment for this month (by type).
   - If `balance + interest <= basePayment + extra`: set principal to `balance` (final payment).
   - Else: principal = `basePayment + extra - interest`.
   - Decrement balance, accrue interest.
   - Push row to schedule.
5. If residual balance remains after loop, absorb into last schedule entry.
6. Compute `interestSaved = baselineTotalInterest - cumulativeInterest`.

#### Scenario Comparison

```typescript
interface ScenarioInput extends MortgageInput {
  label: string;
}

interface ScenarioComparison {
  scenarios: ScenarioResult[];
  bestPayoffDate: string;
  bestInterestSaved: number;
}
```

Runs `calculateFullAmortization` for each input, collects results, sorts by payoff speed.

#### Invest vs. Pay

```typescript
interface InvestVsPayResult {
  extraPaymentAmount: number;
  assumedROI: number;
  mortgagePayoffMonths: number;
  totalInterestSaved: number;
  investmentValueAtPayoff: number;
  netWorthDelta: number;
  recommendation: string;
}
```

Compares future value of investing the extra payment vs. guaranteed interest saved.

---

### 2.4 Savings Allocator Engine (`savings/`)

**Purpose**: Calculate monthly surplus, allocate to priority buckets, compute goal progress.

#### Surplus Calculation

```typescript
interface SurplusInput {
  totalIncome: number;
  totalExpenses: number;
  sinkingFunds: number;
}

function calculateSurplus(input: SurplusInput): number;
```

Pure subtraction: `income - expenses - sinkingFunds`.

#### Goal Progress

```typescript
interface GoalProgressInput {
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  monthlyContribution: number;
}

interface GoalProgressResult {
  percentComplete: number;
  monthsRemaining: number;
  onTrack: boolean;
  estimatedCompletionDate: string;
}
```

#### Priority-Based Allocator

```typescript
interface AllocationRequest {
  monthlySurplus: number;                    // cents
  currentState: AllocationCurrentState;
  customPriorities?: PriorityOverride[];     // optional reordering
}

interface AllocationCurrentState {
  highInterestDebtBalance: number;
  highInterestDebtApr: number;
  emergencyFundBalance: number;
  monthlyExpenses: number;
  employerMatchPercent: number;
  salary: number;
  iraContributionsYTD: number;
  extraMortgageEnabled: boolean;
  mortgageExtraDesired: number;
}

interface AllocationResult {
  totalSurplus: number;
  remainingSurplus: number;
  steps: AllocationStep[];
  isFullyAllocated: boolean;
  summary: string;
  allocationDate: string;
}

interface AllocationStep {
  bucketName: string;
  targetAmount: number;
  currentProgress: number;
  allocatedThisRound: number;
  isComplete: boolean;
}
```

**Priority ladder** (8 buckets in `DEFAULT_PRIORITIES`):

| # | Bucket | Allocation Logic |
|---|---|---|
| 1 | High-Interest Debt (≥7% APR) | Full balance |
| 2 | Emergency Fund (3 months) | `3 × monthlyExpenses - currentBalance` |
| 3 | Employer 401k Match | Up to `salary × matchPercent ÷ 12` monthly |
| 4 | Emergency Fund (6 months) | `6 × monthlyExpenses - currentBalance` |
| 5 | IRA (annual limit $7,000) | Up to `$7,000 - YTD contributions` |
| 6 | Extra Mortgage Principal | User-defined monthly extra |
| 7 | Taxable Brokerage | Remaining surplus (infinite capacity) |

Each bucket is a `PriorityRule`:

```typescript
interface PriorityRule {
  name: string;
  isComplete: (state: AllocationCurrentState) => boolean;
  needed: (state: AllocationCurrentState) => number;
  progress: (state: AllocationCurrentState) => number;
  target: (state: AllocationCurrentState) => number;
}
```

---

### 2.5 Financial Health Score Engine (`health-score/`)

**Purpose**: Compute a 0–100 financial health score from 5 weighted components.

```typescript
interface FHSRequest {
  totalIncomeMonthly: number;
  totalSavingsMonthly: number;
  totalDebtPaymentsMonthly: number;
  emergencyFundBalance: number;
  monthlyExpenses: number;
  budgets: FHSCategoryBudget[];
  actualSpending: FHSCategoryActual[];
  currentNetWorth: number;
  netWorthThreeMonthsAgo: number;
}

interface FHSResult {
  overallScore: number;
  tier: 'excellent' | 'good' | 'fair' | 'concerning' | 'critical';
  components: {
    savingsRate: FHSComponentScore;
    debtToIncome: FHSComponentScore;
    emergencyFund: FHSComponentScore;
    budgetAdherence: FHSComponentScore;
    netWorthTrend: FHSComponentScore;
  };
  recommendations: string[];
}
```

**Scoring Matrix**:

| Component | Max | Target | Scoring Method |
|---|---|---|---|
| Savings Rate | 30 | ≥20% of income | `linearScore(actual / 0.20, 1, 30)` |
| Debt-to-Income | 25 | ≤36% of income | `inverseLinearScore(ratio, 0.36, 0.50, 25)` |
| Emergency Fund | 20 | ≥6 months expenses | `linearScore(months / 6, 1, 20)` |
| Budget Adherence | 15 | 100% adherence | `weightedAdherence * 15` |
| Net Worth Trend | 10 | Positive growth | Positive=10, Flat=5, Negative=0 |

**Tier thresholds**: `≥80` excellent, `≥60` good, `≥40` fair, `≥20` concerning, `<20` critical.

**Recommendations**: Generated for any component earning <50% of max points, or if net worth trend is negative.

---

### 2.6 Coach / Insight Engine (`coach/`)

**Purpose**: Rule-based message generation. No LLM, no AI. Pure deterministic rule evaluation.

```typescript
interface CoachContext {
  eventType: CoachEventType;
  eventPayload?: Record<string, unknown>;
  userState: UserFinancialState;
  existingMessages: CoachEvaluatedMessage[];
}

type CoachEventType =
  | 'transaction_added'
  | 'monthly_rollover'
  | 'goal_milestone'
  | 'score_changed';

interface CoachMessageOutput {
  type: 'alert' | 'insight' | 'win' | 'tip';
  category: string;
  title: string;
  message: string;
  priority: number;
  deduplicationKey: string;
}
```

**Architecture**: Orchestrator → 4 rule evaluators → dedup → priority sort → top 5.

| Evaluator | Triggered By | Produces |
|---|---|---|
| `evaluateBudgetAlerts` | `transaction_added` | Alerts when category exceeds 80% or 100% |
| `evaluateSpendingTips` | `transaction_added`, `monthly_rollover` | Tips when spending >80% income |
| `evaluateSavingsWins` | `goal_milestone`, `monthly_rollover` | Wins for goal progress, all-under-budget |
| `evaluateHealthInsights` | `score_changed` | Insights on score delta, top spending category |

**Deduplication** is via `deduplicationKey` — checked against `context.existingMessages`. Messages with matching keys are dropped. Duplicates within the same evaluation batch are also dropped.

---

## 3. Input/Output Contracts — Consolidated

| Module | Input Type | Output Type | Fallible? |
|---|---|---|---|
| Budget | `BudgetInput` | `BudgetSummaryResult` | No |
| Savings (surplus) | `SurplusInput` | `number` | No |
| Savings (goals) | `GoalProgressInput` | `GoalProgressResult` | No |
| Savings (allocator) | `AllocationRequest` | `EngineResult<AllocationResult>` | Yes |
| Mortgage (calculator) | `MortgageInput` | `EngineResult<MortgageCalcResult>` | Yes |
| Mortgage (scenarios) | `ScenarioInput[]` | `EngineResult<ScenarioComparison>` | Yes |
| Mortgage (invest-vs-pay) | `MortgageInput + ROI` | `EngineResult<InvestVsPayResult>` | Yes |
| Health Score | `FHSRequest` | `FHSResult` | No |
| Coach | `CoachContext` | `CoachMessageOutput[]` | No |

---

## 4. Data Flow Between Modules

### 4.1 No Cross-Module Coupling

Engine modules **do not call each other**. The sole exception is intra-module: `mortgage/scenarios.ts` and `mortgage/invest-vs-pay.ts` both call `mortgage/calculator.ts`, which is within the same module.

Data flows are orchestrated by the **API layer**, which calls engine functions sequentially:

```
[API Layer]                     [Engine]                         [Database]
    │                               │                                │
    ├─ POST /transactions ──────► computeBudgetSummary()          reads budgets, txs
    │                               │                                │
    │                               ▼                                │
    │                          FHSRequest ← budget result            │
    │                          computeScore()                        │
    │                               │                                │
    │                               ▼                                │
    │                          evaluateCoachRules()                  │
    │                               │                                │
    │                               ▼                                │
    │                          return { budgets, score, msgs }       │
    │                                                                 │
    │                         ←───── persist all results ────────►   │
```

### 4.2 Pipeline Flows

**Transaction → Budget → Score → Coach**:
```
BudgetInput ← (budgets + transactions from DB)
    ↓
computeBudgetSummary()
    ↓ (result feeds into)
FHSRequest.budgets ← budget categories
FHSRequest.actualSpending ← transaction totals
    ↓
computeScore()
    ↓ (result feeds into)
CoachContext ← { eventType: 'score_changed', previousScore, newScore, userState }
    ↓
evaluateCoachRules()
    ↓
CoachMessageOutput[]
```

**Monthly Rollover**:
```
End of month:
  BudgetSummaryResult.remaining → next month's rollover
  Score history → FHS period snapshot
  evaluateCoachRules({ eventType: 'monthly_rollover' })
```

**Savings Allocation**:
```
AllocationRequest ← { monthlySurplus, debt/efund/retirement state }
    ↓
computeAllocation()
    ↓
AllocationStep[] → apply each step (DB writes by API layer)
remainingSurplus → next month or unallocated
```

---

## 5. Pure Function Design Rules

### Rule 1: No Side Effects

Every function:
- Reads only its parameters
- Returns a value
- Never writes to disk, network, or global state
- Never calls `Date.now()`, `Math.random()`, `crypto.randomUUID()`

### Rule 2: Return, Don't Throw

Every fallible function returns `EngineResult<T>`. Consumers must check `.success`:

```typescript
const result = calculateFullAmortization(input);
if (!result.success) {
  return handleError(result.error);
}
const { schedule, totalInterest } = result.data;
```

### Rule 3: No Classes

Zero class instances. Zero `new` keyword (except `new Date()` in `currentMonthKey()`). Functions only.

### Rule 4: Immutable Inputs

Parameters are never mutated. If transformation is needed, create new objects:

```typescript
// Good
function computeBalance(balance: number, payment: number): number {
  return balance - payment;
}

// Never:
function computeBalance(balance: { value: number }, payment: number): void {
  balance.value -= payment;  // mutation bad
}
```

### Rule 5: Exhaustive Validation at Boundaries

Validation happens at the public API boundary (`calculateFullAmortization`, `computeAllocation`). Internal helpers assume validated inputs.

### Rule 6: One Export Per Concern

Each file exports exactly one primary function (or a small, related set). The `index.ts` barrel explicitly re-exports every public function.

---

## 6. API Integration (Without Coupling)

The engine is a **pure library**. The API layer calls it like any other library — it never imports HTTP types, never reads request objects, never accesses the database.

### Integration Pattern

```typescript
// In API handler (e.g., Supabase Edge Function)
import { calculateFullAmortization } from '@budgetos/engine';

export async function handler(req: Request): Promise<Response> {
  const body = await req.json();

  const engineResult = calculateFullAmortization({
    principal: body.principal,
    annualRate: body.annualRate,
    termYears: body.termYears,
    startDate: body.startDate,
    extraPayments: body.extraPayments ?? [],
  });

  if (!engineResult.success) {
    return Response.json({ error: engineResult.error }, { status: 400 });
  }

  return Response.json(engineResult.data);
}
```

### Responsibility Split

| Concern | Owned By |
|---|---|
| Input validation (field types, required fields) | API layer (Zod schemas) |
| Business validation (negative principal, bad rate) | Engine (`validateMortgageInput`) |
| Computation | Engine |
| Database reads | API layer |
| Database writes | API layer |
| Caching | API layer (or infra layer) |
| Response formatting | API layer |

### Query Pattern for Engine Inputs

The API layer is responsible for assembling engine inputs from the database:

```typescript
// API layer: assemble engine input from DB
const budgets = await db.selectBudgets(userId, monthKey);
const transactions = await db.selectTransactions(userId, monthKey);
const rollovers = await db.selectRollovers(userId, monthKey);

// Pass to engine (pure function)
const budgetResult = computeBudgetSummary({
  budgets: budgets.map(b => ({ categoryId: b.category_id, amount: b.amount, ... })),
  transactions: transactions.map(t => ({ categoryId: t.category_id, totalAmount: t.amount })),
  previousMonthRollovers: rollovers,
  totalIncome: userIncome,
});

// API layer: persist result
await db.upsertBudgetResults(userId, monthKey, budgetResult);
```

---

## 7. Caching Strategy

### 7.1 What to Cache

| Computation | Cache Key | TTL | Rationale |
|---|---|---|---|
| Amortization schedule | `mortgage:{principal}:{rate}:{term}:{extraPaymentsJSON}` | Until input changes | Expensive O(n), inputs change rarely |
| Amortization baseline interest | `baseline:{principal}:{rate}:{term}` | Until input changes | Pure function, memoizable |
| FHS result | `fhs:{userStateHash}` | 1 day or until new transaction | Changes with every transaction |
| Coach messages | `coach:{eventType}:{userStateHash}` | Per event | Evaluated on each event |

### 7.2 In-Memory Cache (Within Request)

For repeated computations within a single request, use a simple `Map`:

```typescript
// Not part of engine — part of API layer
const memoCache = new Map<string, unknown>();

function memoizedAmortization(input: MortgageInput): EngineResult<MortgageCalcResult> {
  const key = JSON.stringify(input);
  if (memoCache.has(key)) return memoCache.get(key) as EngineResult<MortgageCalcResult>;
  const result = calculateFullAmortization(input);
  memoCache.set(key, result);
  return result;
}
```

### 7.3 Persistent Cache (Cross-Request)

Amortization schedules are cacheable in the database (`amortization_cache` table). When a user's mortgage or extra payments change, the cache is invalidated and recomputed on next read.

### 7.4 What NOT to Cache

- `calculateSurplus`: O(1), cheaper to compute than cache lookup
- `computeGoalProgress`: O(1), depends on live goal state
- `computeCategoryStatus`: O(1), trivial

---

## 8. Performance Considerations

### 8.1 Complexity Analysis

| Operation | Time Complexity | Space Complexity |
|---|---|---|
| `computeMonthlyPayment` | O(1) | O(1) |
| `computeBudgetSummary` | O(budgets + transactions) | O(budgets) |
| `calculateFullAmortization` | O(months) = O(360–600) | O(months) = O(360–600) |
| `compareScenarios` | O(scenarios × months) | O(scenarios × months) |
| `computeScore` | O(categories) | O(1) |
| `evaluateCoachRules` | O(rules × user data) | O(messages) |
| `computeAllocation` | O(buckets) = O(8) | O(buckets) |

### 8.2 Amortization Schedule — The Heavy Case

A full 30-year monthly schedule generates 360 rows. Each row does:
- 1 multiplication + 1 rounding (interest)
- 1–3 integer additions/subtractions
- 1 object allocation

≈ 360 iterations × 5μs = **~1.8ms** per full amortization on modern hardware.

Comparing 5 scenarios: **~9ms**.

### 8.3 Optimization Rules

1. **Do not optimize prematurely.** The heaviest computation (mortgage) completes in <2ms.
2. **Memoize baseline interest** within a single request (used by both calculator and invest-vs-pay).
3. **Stream large schedules** if the API layer needs them — the engine creates the full array; the API can paginate before responding.
4. **Use `for` loops, not `array.reduce` or `.map`** for hot paths (amortization schedule generation). The engine already uses `for` for schedule generation.
5. **Bulk allocation** — the allocator processes 8 buckets max. No optimization needed.

### 8.4 Worker Threads / Serverless

The engine is synchronous, single-threaded, and CPU-light. No need for worker threads. In serverless (Cloudflare Workers, Lambda, Supabase Edge Functions):
- Cold start: engine adds ≈1–2ms (just loading the module)
- Runtime: as analyzed above
- Memory: negligible (<1MB for typical inputs)

---

## 9. Test Strategy

### 9.1 Coverage Requirements

- **100% statement coverage** on all engine source files (excluding types.ts and index.ts)
- Every `if/else` branch tested
- Every error path tested
- Every edge case (empty arrays, zero values, negative values, boundary conditions)

### 9.2 Testing Approach

| Layer | Tool | Pattern |
|---|---|---|
| Shared utilities | Vitest | Pure function: known input → expected output |
| Calculators | Vitest | Fixture-based: load known-good scenarios |
| Edge cases | Vitest | Property-based: zero, negative, overflow, empty |
| Integrations | Vitest | Module-level: feed one module's output into another's input |

### 9.3 Test Organization

```
src/budget/__tests__/calculator.test.ts
src/savings/__tests__/{allocator,goals,surplus}.test.ts
src/mortgage/__tests__/{calculator,scenarios,invest-vs-pay}.test.ts
src/health-score/__tests__/{calculator,recommendations}.test.ts
src/coach/__tests__/engine.test.ts
src/shared/__tests__/{math,date,precision}.test.ts
```

### 9.4 Key Test Cases Per Module

**Shared Math**:
- PMT at various rates (including 0% and very high)
- FV with 0% rate
- DTI with 0 income
- Emergency fund months with 0 expenses
- Score functions at boundary thresholds

**Mortgage**:
- Standard 30-year at 6.5% (compare against known amortization table)
- Final balance = 0
- Total principal = original principal
- Extra payment reduces term and interest
- 0% interest rate
- 1-year term
- Invalid inputs: negative principal, rate > 100%, term > 50
- Rounding: 52¢ residual absorbed in final payment

**Budget**:
- Standard case with multiple categories
- Percentage-based budgets
- Rollover enabled vs disabled
- Overspend detection
- Empty budgets
- Income = 0 edge case

**Savings Allocator**:
- Full allocation (surplus exactly covers all buckets)
- Partial allocation (surplus runs out mid-priority)
- No surplus (0 or negative)
- Custom priority overrides
- All emergency fund tiers, IRA limits, etc.

**FHS**:
- Excellent score (all components strong)
- Poor score (all components weak)
- Each component scoring independently
- Tier mapping for all 5 tiers
- Recommendation generation

**Coach**:
- Each event type triggers correct rules
- Deduplication works (same key → dropped)
- Priority sorting (alert before tip)
- Empty state (no messages when no conditions met)

### 9.5 Test Fixture Pattern

```typescript
// Fixtures stored alongside tests
const STANDARD_MORTGAGE = {
  principal: 300_000_00,
  annualRate: 6.5,
  termYears: 30,
  startDate: '2024-01-01',
  extraPayments: [],
};

// Expected values pre-computed from known amortization tables
const EXPECTED_SCHEDULE_FIRST_MONTH = {
  month: 1,
  payment: 1896_22,
  principal: 271_72,
  interest: 1625_00,
  remainingBalance: 299_728_28,
};
```

---

## 10. Example Computation Flows

### Flow 1: Transaction → Budget → Health Score → Coach

```
1. API receives POST /transactions { amount: -500_00, categoryId: "cat-1" }
2. API persists transaction to DB
3. API reads current month's budgets + all transactions + previous rollovers
4. API calls engine:

   const budgetResult = computeBudgetSummary({
     budgets: [
       { categoryId: "cat-1", amount: 1000_00, percentage: null, rolloverEnabled: false },
       { categoryId: "cat-2", amount: 500_00, percentage: null, rolloverEnabled: false },
     ],
     transactions: [
       { categoryId: "cat-1", totalAmount: -1400_00 },  // now over budget
       { categoryId: "cat-2", totalAmount: -200_00 },
     ],
     previousMonthRollovers: [],
     totalIncome: 5000_00,
   });

   // budgetResult.categories[0] = { budgeted: 1000, spent: 1400, percentUsed: 140, status: 'over' }

5. API calls engine:

   const scoreResult = computeHealthScore({
     totalIncomeMonthly: 5000_00,
     totalSavingsMonthly: 500_00,
     totalDebtPaymentsMonthly: 1200_00,
     emergencyFundBalance: 15000_00,
     monthlyExpenses: 4000_00,
     budgets: budgetResult.categories.map(...),
     actualSpending: /* from transactions */,
     currentNetWorth: 50000_00,
     netWorthThreeMonthsAgo: 48000_00,
   });

   // scoreResult = { overallScore: 68, tier: 'good', ... }

6. API calls engine:

   const coachMessages = evaluateCoachRules({
     eventType: 'transaction_added',
     eventPayload: { categoryId: "cat-1", amount: -500_00 },
     userState: {
       currentMonthBudgets: budgetResult.categories,
       currentMonthScore: scoreResult,
       savingsGoals: [...],
       recentTransactions: [...],
     },
     existingMessages: [],
   });

   // coachMessages = [
   //   { type: 'alert', priority: 1, title: 'Budget Overspent',
   //     message: 'Your Dining Out budget is at 140%.', deduplicationKey: 'budget-over:cat-1' },
   // ]

7. API persists coach messages to DB
8. API returns { budget: budgetResult, score: scoreResult, messages: coachMessages }
```

### Flow 2: Mortgage Simulation

```
1. Client requests: "What if I paid $200/month extra on my 30-year mortgage?"

2. API calls engine:

   const baseline = calculateFullAmortization({
     principal: 300_000_00,
     annualRate: 6.5,
     termYears: 30,
     startDate: '2024-01-01',
     extraPayments: [],
   });

   const scenario = calculateFullAmortization({
     ...baselineInput,
     extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
   });

   // baseline.data.schedule.length = 360 (30 years)
   // scenario.data.schedule.length = 304 (25.3 years — 67 months saved)
   // scenario.data.interestSaved = $56,840.00 (example)

3. API calls engine for invest-vs-pay comparison:

   const investVsPay = compareInvestVsPay({
     ...baselineInput,
     extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
   }, 0.07);  // assumed 7% ROI

   // investVsPay.data.recommendation = "Investing the extra payment may yield higher
   //                                    net worth over the mortgage term."

4. API returns { baseline, scenario, investVsPay }
```

### Flow 3: Savings Allocation

```
1. User has $1,500/month surplus after expenses.

2. Current state:
   - Credit card debt: $5,000 at 22% APR
   - Emergency fund: $2,000 (monthly expenses: $4,000 → 0.5 months)
   - Salary: $80,000, 401k match: 4%
   - IRA contributions YTD: $0
   - Extra mortgage enabled: no

3. API calls engine:

   const allocation = computeAllocation({
     monthlySurplus: 1500_00,
     currentState: {
       highInterestDebtBalance: 5000_00,
       highInterestDebtApr: 22,
       emergencyFundBalance: 2000_00,
       monthlyExpenses: 4000_00,
       employerMatchPercent: 4,
       salary: 8000_00,  // monthly
       iraContributionsYTD: 0,
       extraMortgageEnabled: false,
       mortgageExtraDesired: 0,
     },
   });

4. Result (example):
   Step 1: Debt: allocate $1500 → remaining $3500 (3 months to pay off)
   Step 2: EF Tier 1: needs $10,000 (3 months), already have $2000, allocate $0 (surplus exhausted)
   Remaining: $0
   Fully allocated: false (blocked at debt repayment)

5. After 3 months of allocation (debt paid off):
   Step 1: Debt: $0 (complete)
   Step 2: EF Tier 1: allocate $1500 → $3500 (needs $10,000)
   ...continues for ~5 months to complete Tier 1
   Step 3: EF Tier 2: needs $24,000 total - $10,000 = $14,000
   Step 4: 401k: $80,000 × 4% / 12 = $266.67/month → allocate $266.67
   Step 5: IRA: $7,000 / 12 = $583.33/month
   Step 6: Brokerage: remaining surplus
```

---

## 11. Rules for Avoiding Logic Duplication

### Rule 1: Shared Math Lives in `shared/math.ts`

Any financial formula used by more than one module must live in `shared/math.ts`:
- PMT, FV — used by mortgage calculator and invest-vs-pay
- DTI, savings rate, emergency fund months — used by both FHS and coach
- Score functions (linear, inverse) — used by all 5 FHS components
- The `roundTo` helper — used by precision and interest calculation

### Rule 2: Constants Live in `@budgetos/shared/constants/`

Never hard-code a financial threshold:
- `FHS_WEIGHTS` — weight of each FHS component
- `FINANCIAL_THRESHOLDS` — emergency fund targets, DTI limits, IRA limits, budget adherence thresholds
- `DEFAULT_PRIORITIES` — the allocator's priority ladder

### Rule 3: Validation at the Public Boundary Only

`validateMortgageInput` is called once — in `calculateFullAmortization`. Internal helpers (`computeMonthlyPayment`, `computeInterestPortion`) assume valid inputs. This avoids redundant validation in every helper.

### Rule 4: Each Piece of Business Logic Lives in Exactly One File

| Logic | File |
|---|---|
| Budget overspend thresholds | `budget/percentage.ts` |
| Emergency fund scoring | `health-score/components/emergency-fund.ts` |
| DTI scoring | `health-score/components/dti.ts` |
| Budget adherence scoring | `health-score/components/budget-adherence.ts` |
| Coach budget alerts | `coach/rules/budget-alerts.ts` |
| Coach spending tips | `coach/rules/spending-tips.ts` |

### Rule 5: Never Duplicate Between Engine and API

If the API layer needs the same calculation as the engine, it imports the engine function. The API never reimplements financial logic.

### Rule 6: Template Interpolation Is Centralized

`interpolateTemplate` in `coach/templates.ts` is the only place `{variable}` replacement happens. No rule evaluator implements its own string interpolation.

---

## 12. Folder Structure

```
packages/engine/
├── package.json                  # @budgetos/engine, type: module
├── tsconfig.json                 # extends root, outDir: ./dist
├── vitest.config.ts              # provider: istanbul, 100% threshold
│
├── src/
│   ├── index.ts                  # Public API barrel (22 exports)
│   ├── ENGINE_VERSION            # "1.0.0"
│   │
│   ├── shared/
│   │   ├── errors.ts             # EngineResult<T>, EngineError, validators
│   │   ├── math.ts               # PMT, FV, DTI, savings rate, score functions
│   │   ├── date.ts               # monthsBetween, addMonths, currentMonthKey
│   │   ├── precision.ts          # toCents, toDollars, formatCents, clamp, roundTo
│   │   └── __tests__/
│   │       ├── math.test.ts      # 24 tests
│   │       ├── date.test.ts      # 11 tests
│   │       └── precision.test.ts # 6 tests
│   │
│   ├── budget/
│   │   ├── types.ts              # Re-exports from @budgetos/shared
│   │   ├── calculator.ts         # computeBudgetSummary()
│   │   ├── percentage.ts         # computeCategoryStatus(), computeWeightedAdherence()
│   │   └── __tests__/
│   │       └── calculator.test.ts
│   │
│   ├── savings/
│   │   ├── types.ts              # Re-exports
│   │   ├── surplus.ts            # calculateSurplus()
│   │   ├── goals.ts              # computeGoalProgress()
│   │   ├── allocator.ts          # computeAllocation() — 8 priority buckets
│   │   └── __tests__/
│   │       ├── allocator.test.ts
│   │       ├── goals.test.ts
│   │       └── surplus.test.ts
│   │
│   ├── mortgage/
│   │   ├── types.ts              # MortgageInput, ScenarioInput, ExtraPayment
│   │   ├── calculator.ts         # calculateFullAmortization() — full schedule
│   │   ├── scenarios.ts          # compareScenarios() — multi-scenario
│   │   ├── invest-vs-pay.ts      # compareInvestVsPay() — opportunity cost
│   │   └── __tests__/
│   │       ├── calculator.test.ts
│   │       ├── scenarios.test.ts
│   │       └── invest-vs-pay.test.ts
│   │
│   ├── health-score/
│   │   ├── types.ts              # Re-exports
│   │   ├── calculator.ts         # computeScore() — 5-component aggregator
│   │   ├── recommendations.ts    # formatRecommendations(), getTopRecommendation()
│   │   ├── components/
│   │   │   ├── savings-rate.ts   # computeSavingsRateScore()
│   │   │   ├── dti.ts            # computeDTIScore()
│   │   │   ├── emergency-fund.ts # computeEmergencyFundScore()
│   │   │   ├── budget-adherence.ts # computeBudgetAdherenceScore()
│   │   │   └── net-worth-trend.ts # computeNetWorthTrendScore()
│   │   └── __tests__/
│   │       ├── calculator.test.ts
│   │       └── recommendations.test.ts
│   │
│   └── coach/
│       ├── types.ts              # Re-exports
│       ├── templates.ts          # createTemplate(), interpolateTemplate(), defaults
│       ├── engine.ts             # evaluateCoachRules() — orchestrator + dedup
│       ├── rules/
│       │   ├── budget-alerts.ts  # Overspend and limit alerts
│       │   ├── spending-tips.ts  # Savings and subscription tips
│       │   ├── savings-wins.ts   # Goal and budget wins
│       │   └── health-insights.ts # Score change and spending insights
│       └── __tests__/
│           └── engine.test.ts
│
├── dist/                         # Compiled output (gitignored)
├── node_modules/                 # (gitignored)
├── .gitignore
└── README.md                     # Quick-start for engine development
```

---

## Appendix A: Versioning Strategy

The engine exposes `ENGINE_VERSION = '1.0.0'`. This version is:

1. **Bumped on any output schema change** — if an interface field is added, removed, or renamed.
2. **Stored alongside computed results** in the database — so the API layer can detect stale cached results.
3. **Independent of the project version** — the engine can evolve at its own pace.

## Appendix B: Error Code Reference

| Code | When | Recoverable? |
|---|---|---|
| `NEGATIVE_PRINCIPAL` | `principal < 0` | No (fix input) |
| `INVALID_RATE` | `rate < 0 \|\| rate > 100` | No (fix input) |
| `TERM_TOO_LONG` | `termYears > 50` | No (fix input) |
| `TERM_TOO_SHORT` | `termYears < 1` | No (fix input) |
| `AMOUNT_OVERFLOW` | Computation exceeds `Number.MAX_SAFE_INTEGER` | No (input too large) |
| `DIVISION_BY_ZERO` | Runtime division by zero | No (bug) |
| `INVALID_EXTRA_PAYMENT` | Extra payment type not recognized | Yes (skip and warn) |
| `NEGATIVE_BALANCE` | Balance went below zero unexpectedly | No (bug) |
| `MISSING_REQUIRED_FIELD` | Required field is `undefined` | No (fix input) |
| `UNEXPECTED_ERROR` | Catch-all for unanticipated cases | No |

## Appendix C: Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-06-30 | Initial architecture — 6 modules, 33 source files, 94 tests |
