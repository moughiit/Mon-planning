// Tests d'intégration SQL : migrations + RLS + contraintes, sur PostgreSQL en mémoire (PGlite).
// Lancer depuis MY-BUDGET/ : npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Chemin relatif au dossier database/ (ce fichier est dans database/tests/)
const BASE = fileURLToPath(new URL('..', import.meta.url));
const db = new PGlite();
let failures = 0;
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name} ${extra}`);
  if (!cond) failures++;
};

// Shim Supabase minimal : schéma auth, auth.uid(), rôles anon/authenticated
await db.exec(`
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);

for (const f of [
  '/migrations/0001_schema.sql',
  '/migrations/0002_rls.sql',
  '/migrations/0003_triggers.sql',
  '/migrations/0004_delete_account.sql',
  '/functions/finance_functions.sql',
]) {
  try {
    await db.exec(readFileSync(BASE + f, 'utf8'));
    ok(`apply ${f}`, true);
  } catch (e) {
    ok(`apply ${f}`, false, e.message);
    process.exit(1);
  }
}

await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant select on all tables in schema public to anon;
`);

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
await db.exec(`
  insert into auth.users (id, email) values
    ('${A}', 'a@test.fr'), ('${B}', 'b@test.fr');
`);

// Helper : exécute une requête en tant qu'utilisateur (rôle authenticated + JWT sub)
async function asUser(uid, sql, params = []) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  if (uid) await db.exec('set role authenticated');
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role');
  }
}
async function expectError(name, uid, sql, params = []) {
  try {
    await asUser(uid, sql, params);
    ok(name, false, '(aucune erreur levée)');
  } catch (e) {
    ok(name, true, `→ ${e.message.slice(0, 90)}`);
  }
}

// 1. Profils et catégories par défaut créés par le trigger
const prof = await db.query(`select count(*)::int c from public.profiles`);
ok('profils créés automatiquement (2)', prof.rows[0].c === 2);
const cat = await db.query(`select count(*)::int c from public.categories where user_id = '${A}'`);
ok('catégories par défaut créées (9 pour A)', cat.rows[0].c === 9, `(${cat.rows[0].c})`);

// 2. Données de A (via l'utilisateur A)
const acc = await asUser(A, `
  insert into public.accounts (user_id, name, type, opening_balance)
  values ($1, 'Courant', 'checking', 1000), ($1, 'Livret', 'savings', 0)
  returning id, name`, [A]);
const checking = acc.rows.find((r) => r.name === 'Courant').id;
const savings = acc.rows.find((r) => r.name === 'Livret').id;
const catSalaire = (await asUser(A, `select id from public.categories where name = 'Salaire'`)).rows[0].id;
const catCourses = (await asUser(A, `select id from public.categories where name = 'Courses'`)).rows[0].id;
const debt = (await asUser(A, `
  insert into public.debts (user_id, name, initial_amount, start_date)
  values ($1, 'Prêt auto', 5000, '2026-01-01') returning id`, [A])).rows[0].id;

await asUser(A, `
  insert into public.transactions (user_id, type, description, amount, transaction_date, category_id, source_account_id)
  values
    ($1, 'income',  'Paie',      500, '2026-10-05', $2, $3),
    ($1, 'expense', 'Carrefour', 100, '2026-10-07', $4, $3)`,
  [A, catSalaire, checking, catCourses]);
await asUser(A, `
  insert into public.transactions (user_id, type, description, amount, transaction_date, source_account_id, destination_account_id)
  values ($1, 'transfer', 'Épargne', 200, '2026-10-10', $2, $3)`, [A, checking, savings]);
await asUser(A, `
  insert into public.transactions (user_id, type, description, amount, transaction_date, source_account_id, debt_id, principal_amount, interest_amount)
  values ($1, 'debt_payment', 'Mensualité', 50, '2026-10-12', $2, $3, 40, 10)`, [A, checking, debt]);

// 3. Calculs
const bal = await asUser(A, `select name, balance::float8 from public.account_balances() order by name`);
const balChecking = bal.rows.find((r) => r.name === 'Courant')?.balance;
const balSavings = bal.rows.find((r) => r.name === 'Livret')?.balance;
ok('solde courant = 1000 + 500 - 100 - 200 - 50 = 1150', balChecking === 1150, `(${balChecking})`);
ok('solde livret = 200', balSavings === 200, `(${balSavings})`);

const sum = await asUser(A, `select income::float8, expenses::float8, savings_transferred::float8, debt_repaid::float8, debt_interest::float8 from public.monthly_summary(2026, 10)`);
const s = sum.rows[0];
ok('monthly_summary octobre 2026',
  s.income === 500 && s.expenses === 100 && s.savings_transferred === 200 && s.debt_repaid === 50 && s.debt_interest === 10,
  JSON.stringify(s));

// 4. Isolation RLS entre utilisateurs
const seenByB = await asUser(B, `select count(*)::int c from public.transactions`);
ok('B ne voit aucune transaction de A', seenByB.rows[0].c === 0);
const accB = await asUser(B, `select count(*)::int c from public.accounts`);
ok('B ne voit aucun compte de A', accB.rows[0].c === 0);
const profB = await asUser(B, `select id from public.profiles`);
ok('B ne voit que son profil', profB.rows.length === 1 && profB.rows[0].id === B);
const upd = await asUser(B, `update public.profiles set display_name = 'piraté' where id = $1 returning id`, [A]);
ok('B ne peut pas modifier le profil de A', upd.rows.length === 0);
const bal0 = await asUser(B, `select count(*)::int c from public.account_balances()`);
ok('B n\'obtient aucun solde de A', bal0.rows[0].c === 0);

// 5. Un utilisateur ne peut pas référencer les données d'un autre (FK composite)
await expectError('B ne peut pas créer une opération sur le compte de A', B, `
  insert into public.transactions (user_id, type, description, amount, transaction_date, source_account_id)
  values ($1, 'expense', 'Fraude', 10, '2026-10-01', $2)`, [B, checking]);
await expectError('B ne peut pas utiliser la catégorie de A', B, `
  insert into public.budgets (user_id, year, month, category_id, amount) values ($1, 2026, 10, $2, 100)`, [B, catCourses]);
await expectError('B ne peut pas écrire un user_id qui n\'est pas le sien', B, `
  insert into public.accounts (user_id, name, type) values ($1, 'Intrus', 'cash')`, [A]);

// 6. Contraintes métier
await expectError('catégorie revenu refusée sur une dépense', A, `
  insert into public.transactions (user_id, type, description, amount, transaction_date, category_id, source_account_id)
  values ($1, 'expense', 'Mauvais', 10, '2026-10-02', $2, $3)`, [A, catSalaire, checking]);
await expectError('virement vers le même compte refusé', A, `
  insert into public.transactions (user_id, type, description, amount, transaction_date, source_account_id, destination_account_id)
  values ($1, 'transfer', 'Boucle', 10, '2026-10-02', $2, $2)`, [A, checking]);
await expectError('montant négatif refusé', A, `
  insert into public.transactions (user_id, type, description, amount, transaction_date, source_account_id)
  values ($1, 'expense', 'Négatif', -10, '2026-10-02', $2)`, [A, checking]);
await expectError('debt_payment incohérent (principal + intérêts ≠ montant) refusé', A, `
  insert into public.transactions (user_id, type, description, amount, transaction_date, source_account_id, debt_id, principal_amount, interest_amount)
  values ($1, 'debt_payment', 'Faux', 50, '2026-10-03', $2, $3, 30, 10)`, [A, checking, debt]);
await expectError('budget en double pour un budget global (category NULL) refusé', A, `
  insert into public.budgets (user_id, year, month, amount) values ($1, 2026, 10, 100), ($1, 2026, 10, 200)`, [A]);

// 7. Journal d'audit : lecture seule pour l'utilisateur
const audit = await asUser(A, `select count(*)::int c from public.audit_logs`);
ok('audit_logs alimenté par les triggers', audit.rows[0].c > 0, `(${audit.rows[0].c} lignes)`);
await expectError('l\'utilisateur ne peut pas falsifier le journal', A, `
  insert into public.audit_logs (user_id, table_name, record_id, action) values ($1, 'x', gen_random_uuid(), 'INSERT')`, [A]);

// 8. updated_at mis à jour
const before = (await asUser(A, `select updated_at from public.transactions limit 1`)).rows[0].updated_at;
await new Promise((r) => setTimeout(r, 20));
await asUser(A, `update public.transactions set notes = 'ok' where description = 'Paie'`);
const after = (await asUser(A, `select updated_at from public.transactions where description = 'Paie'`)).rows[0].updated_at;
ok('updated_at mis à jour au UPDATE', new Date(after).getTime() > new Date(before).getTime());

// 9. Suppression d'un utilisateur : cascade
await db.exec(`delete from auth.users where id = '${B}'`);
const profAfter = await db.query(`select count(*)::int c from public.profiles where id = '${B}'`);
ok('suppression auth.users → profil supprimé (cascade)', profAfter.rows[0].c === 0);

// 10. Suppression de compte par l'utilisateur (RGPD)
await db.exec('reset role');
await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
await db.exec('set role anon');
try {
  await db.query('select public.delete_my_account()');
  ok('anonyme ne peut pas supprimer de compte', false, '(aucune erreur levée)');
} catch (e) {
  ok('anonyme ne peut pas supprimer de compte', true, `→ ${e.message.slice(0, 80)}`);
} finally {
  await db.exec('reset role');
}

await asUser(A, `select public.delete_my_account()`);
const left = await db.query(`
  select
    (select count(*) from auth.users where id = '${A}')::int as users,
    (select count(*) from public.profiles where id = '${A}')::int as profiles,
    (select count(*) from public.transactions where user_id = '${A}')::int as transactions,
    (select count(*) from public.audit_logs where user_id = '${A}')::int as audit`);
const l = left.rows[0];
ok('delete_my_account supprime compte, profil, opérations et journal',
  l.users === 0 && l.profiles === 0 && l.transactions === 0 && l.audit === 0, JSON.stringify(l));

console.log(failures === 0 ? '\nTOUS LES TESTS PASSENT' : `\n${failures} ÉCHEC(S)`);
process.exit(failures ? 1 : 0);
