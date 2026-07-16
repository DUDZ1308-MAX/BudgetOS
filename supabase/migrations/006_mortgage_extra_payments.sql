-- ============================================================
-- BudgetOS: Mortgage Extra Payments Table
-- Migration 006
-- ============================================================

-- Create mortgage_extra_payments table
create table if not exists public.mortgage_extra_payments (
  id uuid primary key default gen_random_uuid(),
  mortgage_id uuid not null references public.mortgages(id) on delete cascade,
  amount numeric(12,2) not null,
  date date not null default current_date,
  type text not null default 'one_time',
  notes text,
  created_at timestamp not null default now()
);

-- Enable Row Level Security
alter table public.mortgage_extra_payments enable row level security;

-- RLS Policies: users can only access their own mortgage extra payments
-- Ownership is verified through the parent mortgages table.

drop policy if exists "mortgage_extra_payments_select" on public.mortgage_extra_payments;
create policy "mortgage_extra_payments_select"
  on public.mortgage_extra_payments for select
  using (
    exists (
      select 1 from public.mortgages
      where mortgages.id = mortgage_extra_payments.mortgage_id
      and mortgages.user_id = auth.uid()
    )
  );

drop policy if exists "mortgage_extra_payments_insert" on public.mortgage_extra_payments;
create policy "mortgage_extra_payments_insert"
  on public.mortgage_extra_payments for insert
  with check (
    exists (
      select 1 from public.mortgages
      where mortgages.id = mortgage_extra_payments.mortgage_id
      and mortgages.user_id = auth.uid()
    )
  );

drop policy if exists "mortgage_extra_payments_update" on public.mortgage_extra_payments;
create policy "mortgage_extra_payments_update"
  on public.mortgage_extra_payments for update
  using (
    exists (
      select 1 from public.mortgages
      where mortgages.id = mortgage_extra_payments.mortgage_id
      and mortgages.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.mortgages
      where mortgages.id = mortgage_extra_payments.mortgage_id
      and mortgages.user_id = auth.uid()
    )
  );

drop policy if exists "mortgage_extra_payments_delete" on public.mortgage_extra_payments;
create policy "mortgage_extra_payments_delete"
  on public.mortgage_extra_payments for delete
  using (
    exists (
      select 1 from public.mortgages
      where mortgages.id = mortgage_extra_payments.mortgage_id
      and mortgages.user_id = auth.uid()
    )
  );

-- Index for performance
create index if not exists idx_mortgage_extra_payments_mortgage_id
  on public.mortgage_extra_payments(mortgage_id);
