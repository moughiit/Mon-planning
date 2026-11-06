-- MY BUDGET — 0003 : triggers (profil auto, catégories par défaut, updated_at, audit)

-- 1. Création du profil + catégories par défaut à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, kind, color, icon) values
    (new.id, 'Salaire',        'income',  '#4CAF50', 'briefcase'),
    (new.id, 'Autres revenus', 'income',  '#8BC34A', 'plus-circle'),
    (new.id, 'Logement',       'expense', '#5C6BC0', 'home'),
    (new.id, 'Courses',        'expense', '#26A69A', 'shopping-cart'),
    (new.id, 'Transport',      'expense', '#FFA726', 'truck'),
    (new.id, 'Loisirs',        'expense', '#EC407A', 'film'),
    (new.id, 'Santé',          'expense', '#EF5350', 'heart'),
    (new.id, 'Abonnements',    'expense', '#AB47BC', 'repeat'),
    (new.id, 'Autres dépenses','expense', '#78909C', 'more-horizontal');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- 3. La catégorie d'une opération doit correspondre à son sens (revenu ↔ income, dépense ↔ expense)
create or replace function public.check_transaction_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.categories c
    where c.id = new.category_id and c.kind = new.type
  ) then
    raise exception 'La catégorie ne correspond pas au type de l''opération (%).', new.type
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_check_category on public.transactions;
create trigger transactions_check_category
  before insert or update of category_id, type on public.transactions
  for each row execute function public.check_transaction_category();

-- 4. Journal d'audit (écrit en SECURITY DEFINER, donc non modifiable par l'utilisateur)
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Suppression en cascade lors de la suppression du compte : l'utilisateur n'existe plus,
  -- donc on n'écrit pas de ligne d'audit (elle violerait la clé étrangère vers auth.users).
  if tg_op = 'DELETE' and not exists (select 1 from auth.users where id = old.user_id) then
    return old;
  end if;

  insert into public.audit_logs (user_id, table_name, record_id, action, old_data, new_data)
  values (
    case when tg_op = 'DELETE' then old.user_id else new.user_id end,
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['accounts', 'transactions', 'debts', 'budgets', 'savings_goals']
  loop
    execute format('drop trigger if exists %I_audit on public.%I', tbl, tbl);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I
         for each row execute function public.audit_row_change()',
      tbl, tbl
    );
  end loop;
end $$;
