export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          currency: string;
          locale: string;
          timezone: string;
          onboarding_complete: boolean;
          onboarding_completed: boolean;
          theme_preference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          locale?: string;
          timezone?: string;
          onboarding_complete?: boolean;
          onboarding_completed?: boolean;
          theme_preference?: string | null;
        };
        Update: {
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          locale?: string;
          timezone?: string;
          onboarding_complete?: boolean;
          onboarding_completed?: boolean;
          theme_preference?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          type: 'income' | 'expense' | 'transfer' | 'saving';
          is_system: boolean;
          is_archived: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          type: 'income' | 'expense' | 'transfer' | 'saving';
          is_system?: boolean;
          is_archived?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          icon?: string | null;
          color?: string | null;
          type?: 'income' | 'expense' | 'transfer' | 'saving';
          is_archived?: boolean;
          sort_order?: number;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'credit' | 'credit_card' | 'investment' | 'loan' | 'cash' | 'other';
          balance: number;
          currency: string;
          institution: string | null;
          is_active: boolean;
          include_in_net_worth: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'credit' | 'credit_card' | 'investment' | 'loan' | 'cash' | 'other';
          balance?: number;
          currency?: string;
          institution?: string | null;
          is_active?: boolean;
          include_in_net_worth?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          type?: 'checking' | 'savings' | 'credit' | 'credit_card' | 'investment' | 'loan' | 'cash' | 'other';
          balance?: number;
          institution?: string | null;
          is_active?: boolean;
          include_in_net_worth?: boolean;
          sort_order?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          category_id: string | null;
          amount: number;
          currency: string | null;
          description: string | null;
          note: string | null;
          merchant: string | null;
          date: string;
          is_archived: boolean;
          is_recurring: boolean;
          is_pending: boolean;
          recurring_id: string | null;
          notes: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          account_id?: string | null;
          category_id?: string | null;
          amount: number;
          currency?: string;
          description?: string | null;
          note?: string | null;
          merchant?: string | null;
          date: string;
          is_archived?: boolean;
          is_recurring?: boolean;
          is_pending?: boolean;
          recurring_id?: string | null;
          notes?: string | null;
          tags?: string[] | null;
        };
        Update: {
          account_id?: string | null;
          category_id?: string | null;
          amount?: number;
          description?: string | null;
          note?: string | null;
          merchant?: string | null;
          date?: string;
          is_archived?: boolean;
          is_pending?: boolean;
          recurring_id?: string | null;
          notes?: string | null;
          tags?: string[] | null;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          category_id: string | null;
          type: 'income' | 'expense' | 'transfer';
          name: string;
          description: string | null;
          amount: number;
          frequency: 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
          interval_count: number;
          day_of_week: number | null;
          day_of_month: number | null;
          month_of_year: number | null;
          start_date: string;
          end_date: string | null;
          next_run: string;
          last_run: string | null;
          auto_post: boolean;
          reminder_type: 'today' | 'day_before' | 'three_days_before' | 'week_before' | null;
          status: 'active' | 'paused' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          account_id?: string | null;
          category_id?: string | null;
          type: 'income' | 'expense' | 'transfer';
          name: string;
          description?: string | null;
          amount: number;
          frequency: 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
          interval_count?: number;
          day_of_week?: number | null;
          day_of_month?: number | null;
          month_of_year?: number | null;
          start_date: string;
          end_date?: string | null;
          next_run?: string;
          auto_post?: boolean;
          reminder_type?: 'today' | 'day_before' | 'three_days_before' | 'week_before' | null;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
        };
        Update: {
          account_id?: string | null;
          category_id?: string | null;
          type?: 'income' | 'expense' | 'transfer';
          name?: string;
          description?: string | null;
          amount?: number;
          frequency?: 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
          interval_count?: number;
          day_of_week?: number | null;
          day_of_month?: number | null;
          month_of_year?: number | null;
          start_date?: string;
          end_date?: string | null;
          next_run?: string;
          last_run?: string | null;
          auto_post?: boolean;
          reminder_type?: 'today' | 'day_before' | 'three_days_before' | 'week_before' | null;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          year: number;
          month: number;
          amount: number;
          rollover: boolean;
          month_key: string;
          rollover_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          category_id: string;
          year: number;
          month: number;
          amount: number;
          rollover?: boolean;
          month_key?: string;
          rollover_enabled?: boolean;
        };
        Update: {
          amount?: number;
          rollover?: boolean;
          month_key?: string;
          rollover_enabled?: boolean;
        };
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          monthly_contribution: number;
          category_id: string | null;
          is_completed: boolean;
          sort_order: number;
          priority: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          monthly_contribution?: number;
          category_id?: string | null;
          is_completed?: boolean;
          sort_order?: number;
          priority?: number;
          status?: string;
        };
        Update: {
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          monthly_contribution?: number;
          category_id?: string | null;
          is_completed?: boolean;
          sort_order?: number;
          priority?: number;
          status?: string;
        };
      };
      mortgages: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          principal: number;
          annual_rate: number;
          term_years: number;
          amortization_years: number;
          start_date: string | null;
          payment_frequency: 'monthly' | 'semi_monthly' | 'bi_weekly' | 'accelerated_bi_weekly' | 'weekly' | 'accelerated_weekly';
          compound_semi_annual: boolean;
          extra_payment: number;
          extra_payments: { type: string; amount: number; month?: number }[];
          down_payment: number;
          purchase_price: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name?: string;
          principal: number;
          annual_rate: number;
          term_years: number;
          amortization_years?: number;
          start_date?: string | null;
          payment_frequency?: 'monthly' | 'semi_monthly' | 'bi_weekly' | 'accelerated_bi_weekly' | 'weekly' | 'accelerated_weekly';
          compound_semi_annual?: boolean;
          extra_payment?: number;
          extra_payments?: { type: string; amount: number; month?: number }[];
          down_payment?: number;
          purchase_price?: number | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          principal?: number;
          annual_rate?: number;
          term_years?: number;
          amortization_years?: number;
          start_date?: string | null;
          payment_frequency?: 'monthly' | 'semi_monthly' | 'bi_weekly' | 'accelerated_bi_weekly' | 'weekly' | 'accelerated_weekly';
          compound_semi_annual?: boolean;
          extra_payment?: number;
          extra_payments?: { type: string; amount: number; month?: number }[];
          down_payment?: number;
          purchase_price?: number | null;
          is_active?: boolean;
        };
      };
      mortgage_extra_payments: {
        Row: {
          id: string;
          mortgage_id: string;
          amount: number;
          date: string;
          type: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          mortgage_id: string;
          amount: number;
          date: string;
          type?: string;
          notes?: string | null;
        };
        Update: {
          amount?: number;
          date?: string;
          type?: string;
          notes?: string | null;
        };
      };
      contributions: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          amount: number;
          date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          goal_id: string;
          amount: number;
          date: string;
          notes?: string | null;
        };
        Update: {
          amount?: number;
          date?: string;
          notes?: string | null;
        };
      };
      amortization_cache: {
        Row: {
          id: string;
          user_id: string;
          mortgage_id: string;
          month: number;
          date: string;
          payment: number;
          principal: number;
          interest: number;
          total_interest_to_date: number;
          remaining_balance: number;
          extra_payment: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          mortgage_id: string;
          month: number;
          date: string;
          payment: number;
          principal: number;
          interest: number;
          total_interest_to_date: number;
          remaining_balance: number;
          extra_payment?: number;
        };
      };
      financial_health_scores: {
        Row: {
          id: string;
          user_id: string;
          period_key: string;
          overall_score: number;
          tier: string;
          components: Record<string, unknown>;
          recommendations: string[];
          snapshot_date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          period_key: string;
          overall_score: number;
          tier: string;
          components: Record<string, unknown>;
          recommendations?: string[];
          snapshot_date?: string;
        };
      };
      coach_messages: {
        Row: {
          id: string;
          user_id: string;
          type: 'alert' | 'insight' | 'win' | 'tip';
          category: string;
          title: string;
          message: string;
          priority: number;
          deduplication_key: string;
          is_read: boolean;
          is_dismissed: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: 'alert' | 'insight' | 'win' | 'tip';
          category: string;
          title: string;
          message: string;
          priority?: number;
          deduplication_key: string;
        };
        Update: {
          is_read?: boolean;
          is_dismissed?: boolean;
        };
      };
      allocator_configs: {
        Row: {
          id: string;
          user_id: string;
          priorities: string[];
          custom_rules: Record<string, unknown>[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          priorities?: string[];
          custom_rules?: Record<string, unknown>[];
        };
        Update: {
          priorities?: string[];
          custom_rules?: Record<string, unknown>[];
        };
      };
    };
    Views: {
      savings_contributions: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          amount: number;
          date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Functions: {
      get_monthly_summary: {
        Args: { p_user_id: string; p_year: number; p_month: number };
        Returns: {
          total_income: number;
          total_expenses: number;
          transaction_count: number;
          category_breakdown: unknown;
        }[];
      };
      get_net_worth: {
        Args: { p_user_id: string };
        Returns: {
          total_assets: number;
          total_liabilities: number;
          net_worth: number;
          as_of_date: string;
        }[];
      };
      get_cash_flow: {
        Args: { p_user_id: string; p_months?: number };
        Returns: {
          period_key: string;
          total_income: number;
          total_expenses: number;
          net_cash_flow: number;
        }[];
      };
    };
  };
}
