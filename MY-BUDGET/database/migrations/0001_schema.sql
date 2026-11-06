-- MY BUDGET — 0001 : schéma initial
-- Convention : pour income / expense / debt_payment, le compte concerné est `source_account_id`.
-- Pour transfer, `source_account_id` = compte débité, `destination_account_id` = compte crédité.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'EUR' check (char_length(currency) = 3),
  theme text not null default 'system'
    check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (type in ('checking', 'savings', 'cash', 'other')),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  opening_balance numeric(14,2) not null default 0,
  opening_date date not null default current_date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  kind text not null check (kind in ('income', 'expense')),
  color text,
  icon text,
  created_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, kind, name)
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  creditor text,
  initial_amount numeric(14,2) not null check (initial_amount > 0),
  interest_rate numeric(7,4) not null default 0 check (interest_rate >= 0),
  start_date date not null,
  due_date date,
  status text not null default 'active'
    check (status in ('active', 'repaid', 'archived')),
  created_at timestamptz not null default now(),
  unique (user_id, id),
  check (due_date is null or due_date >= start_date)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer', 'debt_payment')),
  description text not null check (char_length(trim(description)) > 0),
  amount numeric(14,2) not null check (amount > 0),
  transaction_date date not null,
  category_id uuid,
  source_account_id uuid,
  destination_account_id uuid,
  debt_id uuid,
  principal_amount numeric(14,2) check (principal_amount >= 0),
  interest_amount numeric(14,2) check (interest_amount >= 0),
  transfer_group_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  -- Les FK composites (user_id, ...) empêchent de référencer la ligne d'un AUTRE utilisateur.
  -- Une FK simple sur `id` seule ne le ferait pas : le RLS ne s'applique pas aux vérifications de FK.
  constraint transactions_category_fk
    foreign key (user_id, category_id) references public.categories(user_id, id),
  constraint transactions_source_account_fk
    foreign key (user_id, source_account_id) references public.accounts(user_id, id),
  constraint transactions_destination_account_fk
    foreign key (user_id, destination_account_id) references public.accounts(user_id, id),
  constraint transactions_debt_fk
    foreign key (user_id, debt_id) references public.debts(user_id, id),
  -- Chaque type a une forme de données attendue
  constraint transactions_shape_check check (
    (type = 'income'
      and source_account_id is not null and destination_account_id is null
      and debt_id is null)
    or (type = 'expense'
      and source_account_id is not null and destination_account_id is null
      and debt_id is null)
    or (type = 'transfer'
      and source_account_id is not null and destination_account_id is not null
      and source_account_id <> destination_account_id
      and category_id is null and debt_id is null)
    or (type = 'debt_payment'
      and source_account_id is not null and destination_account_id is null
      and debt_id is not null and category_id is null
      and (
        (principal_amount is null and interest_amount is null)
        or principal_amount + interest_amount = amount
      ))
  )
);

-- Table conservée de la conception initiale. Elle recoupe partiellement
-- transactions.principal_amount / interest_amount : à garder si on veut un
-- historique détaillé par dette, sinon à supprimer.
create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null,
  transaction_id uuid not null,
  principal_paid numeric(14,2) not null default 0 check (principal_paid >= 0),
  interest_paid numeric(14,2) not null default 0 check (interest_paid >= 0),
  payment_date date not null,
  created_at timestamptz not null default now(),
  constraint debt_payments_debt_fk
    foreign key (user_id, debt_id) references public.debts(user_id, id),
  constraint debt_payments_transaction_fk
    foreign key (user_id, transaction_id) references public.transactions(user_id, id)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  month integer not null check (month between 1 and 12),
  category_id uuid,
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  constraint budgets_category_fk
    foreign key (user_id, category_id) references public.categories(user_id, id)
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date,
  account_id uuid,
  status text not null default 'active'
    check (status in ('active', 'reached', 'archived')),
  created_at timestamptz not null default now(),
  constraint savings_goals_account_fk
    foreign key (user_id, account_id) references public.accounts(user_id, id)
);

create table public.monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  month integer not null check (month between 1 and 12),
  total_income numeric(14,2) not null default 0,
  total_expenses numeric(14,2) not null default 0,
  total_savings numeric(14,2) not null default 0,
  remaining_debt numeric(14,2) not null default 0,
  closing_balance numeric(14,2) not null default 0,
  closed_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- Index pour les requêtes mensuelles et journalières
create index transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index transactions_user_category_idx
  on public.transactions (user_id, category_id);
create index transactions_user_source_idx
  on public.transactions (user_id, source_account_id);
create index transactions_user_destination_idx
  on public.transactions (user_id, destination_account_id);
create index accounts_user_idx
  on public.accounts (user_id);
create index categories_user_idx
  on public.categories (user_id);
create index debts_user_idx
  on public.debts (user_id);
create index snapshots_user_period_idx
  on public.monthly_snapshots (user_id, year, month);
-- NULLS NOT DISTINCT : nécessite PostgreSQL 15+ (Supabase utilise une version plus récente).
-- Empêche deux budgets identiques, y compris quand category_id est NULL (budget global).
create unique index budgets_unique_period_category
  on public.budgets (user_id, year, month, category_id) nulls not distinct;
create index budgets_user_period_idx
  on public.budgets (user_id, year, month);
