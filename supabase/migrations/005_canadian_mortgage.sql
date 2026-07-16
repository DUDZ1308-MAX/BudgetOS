-- ============================================================
-- BudgetOS: Canadian Mortgage Planner - Phase 2
-- Migration 005
-- ============================================================

-- Add payment_frequency enum
do $$ begin
  create type payment_frequency as enum (
    'monthly', 'semi_monthly', 'bi_weekly', 'accelerated_bi_weekly', 'weekly', 'accelerated_weekly'
  );
exception when duplicate_object then null;
end $$;

-- Add new columns to mortgages table
alter table if exists public.mortgages
  add column if not exists payment_frequency payment_frequency not null default 'monthly',
  add column if not exists amortization_years int,
  add column if not exists compound_semi_annual boolean not null default true,
  add column if not exists down_payment numeric default 0,
  add column if not exists purchase_price numeric;

-- Set amortization_years = term_years for existing rows
update public.mortgages set amortization_years = term_years where amortization_years is null;

-- Make amortization_years not null after backfill
alter table if exists public.mortgages
  alter column amortization_years set not null;
