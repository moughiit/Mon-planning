-- MY BUDGET — fonctions de calcul (SECURITY INVOKER : le RLS s'applique à l'appelant)

-- Solde courant de chaque compte actif de l'utilisateur
create or replace function public.account_balances()
returns table (
  account_id uuid,
  name text,
  type text,
  currency text,
  balance numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with movements as (
    -- revenus et dépenses/remboursements : impact sur le compte source
    select t.source_account_id as account_id,
           case when t.type = 'income' then t.amount else -t.amount end as delta
    from public.transactions t
    where t.type in ('income', 'expense', 'debt_payment')
    union all
    -- virements : débit du compte source
    select t.source_account_id, -t.amount
    from public.transactions t
    where t.type = 'transfer'
    union all
    -- virements : crédit du compte destination
    select t.destination_account_id, t.amount
    from public.transactions t
    where t.type = 'transfer'
  )
  select a.id,
         a.name,
         a.type,
         a.currency,
         a.opening_balance + coalesce(sum(m.delta), 0) as balance
  from public.accounts a
  left join movements m on m.account_id = a.id
  where a.archived_at is null
  group by a.id, a.name, a.type, a.currency, a.opening_balance
  order by a.name;
$$;

-- Totaux d'un mois. "Épargne transférée" = virements vers un compte de type 'savings'.
create or replace function public.monthly_summary(p_year integer, p_month integer)
returns table (
  income numeric,
  expenses numeric,
  savings_transferred numeric,
  debt_repaid numeric,
  debt_interest numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'transfer' and d.type = 'savings'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'debt_payment'), 0),
    coalesce(sum(t.interest_amount) filter (where t.type = 'debt_payment'), 0)
  from public.transactions t
  left join public.accounts d on d.id = t.destination_account_id
  where t.transaction_date >= make_date(p_year, p_month, 1)
    and t.transaction_date < (make_date(p_year, p_month, 1) + interval '1 month')::date;
$$;

-- Pas d'accès anonyme aux fonctions de calcul
revoke execute on function public.account_balances() from anon, public;
revoke execute on function public.monthly_summary(integer, integer) from anon, public;
grant execute on function public.account_balances() to authenticated;
grant execute on function public.monthly_summary(integer, integer) to authenticated;
