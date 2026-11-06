-- MY BUDGET — 0004 : suppression de compte (droit à l'effacement, RGPD)

-- Supprime le compte de l'utilisateur connecté. La suppression de auth.users
-- entraîne en cascade celle de toutes ses données (profil, comptes, opérations,
-- dettes, budgets, objectifs, journal d'audit).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Non connecté' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from anon, public;
grant execute on function public.delete_my_account() to authenticated;
