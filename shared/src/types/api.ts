export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface TransactionListParams extends ListQueryParams {
  category_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface BudgetQueryParams {
  year: number;
  month: number;
}

export interface CreateTransactionRequest {
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
  merchant?: string;
  note?: string;
}

export interface UpdateTransactionRequest {
  account_id?: string;
  category_id?: string;
  amount?: number;
  date?: string;
  merchant?: string;
  note?: string;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  balance: number;
  currency?: string;
}

export interface CreateBudgetRequest {
  category_id: string;
  year: number;
  month: number;
  amount: number;
  rollover?: boolean;
}

export interface CreateMortgageRequest {
  name: string;
  principal: number;
  annual_rate: number;
  term_years: number;
  start_date: string;
  extra_payment?: number;
  extra_payment_frequency?: string;
}

export interface MortgageSimulateRequest {
  principal: number;
  annual_rate: number;
  term_years: number;
  start_date: string;
  extra_payments: Array<{
    type: string;
    amount: number;
    start_month?: number;
    end_month?: number;
  }>;
}

export interface CreateSavingsGoalRequest {
  name: string;
  target_amount: number;
  target_date: string;
  priority: number;
  account_id?: string;
}

export interface CsvImportRequest {
  rows: CsvImportRow[];
}

export interface CsvImportRow {
  date: string;
  amount: number;
  category_name?: string;
  account_name?: string;
  merchant?: string;
  note?: string;
}

export interface CsvImportResult {
  imported: number;
  failed: number;
  errors: CsvImportError[];
}

export interface CsvImportError {
  row: number;
  message: string;
}
