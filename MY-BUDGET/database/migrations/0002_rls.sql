-- MY BUDGET — 0002 : Row Level Security
-- Chaque utilisateur ne voit et ne modifie que ses propres lignes.

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.monthly_snapshots enable row level security;
alter table public.audit_logs enable row level security;

-- Profil : la clé est `id` (c'est l'auth.users.id), pas `user_id`.
-- Cette politique remplace la boucle générique, qui échouait sur profiles.
create policy "own profile only"
on public.profiles
for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Tables avec user_id : accès complet limité à l'utilisateur connecté.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'accounts', 'categories', 'transactions',
    'debts', 'debt_payments', 'budgets',
    'savings_goals', 'monthly_snapshots'
  ]
  loop
    execute format(
      'create policy "own records only" on public.%I
         for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)',
      tbl
    );
  end loop;
end $$;

-- Journal d'audit : lecture seule pour l'utilisateur.
-- Les écritures passent uniquement par les triggers (0003), qui s'exécutent en SECURITY DEFINER.
create policy "own audit logs readable"
on public.audit_logs
for select
to authenticated
using ((select auth.uid()) = user_id);
