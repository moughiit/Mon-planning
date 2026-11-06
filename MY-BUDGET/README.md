# MY BUDGET

Application de gestion de budget (iOS / Android, EUR, multi-comptes, thème clair/sombre).
Stack : Expo SDK 58 · Expo Router · TypeScript · Supabase (PostgreSQL + Auth) · TanStack Query · NativeWind 4 · react-native-gifted-charts · Zustand.

## État d'avancement

**Fait**
- Schéma SQL, RLS (isolation stricte par utilisateur), triggers, fonctions de calcul — testés (`npm run test:db`).
- Authentification (connexion / inscription), garde de navigation.
- Accueil : patrimoine total, revenus, dépenses, épargne transférée, remboursement dette, comptes, dernières opérations.
- Opérations du mois : ajout (dépense / revenu / virement), suppression par appui long.
- Comptes : liste avec soldes, création.
- Analyse : répartition des dépenses par catégorie (anneau).
- Historique : 12 derniers mois (graphique + détail).
- Réglages : thème, déconnexion, accès aux écrans secondaires.

**Pas encore fait** (écrans placeholders « Bientôt disponible »)
- Écrans Revenus, Dépenses, Épargne, Dettes, Budgets, Calendrier quotidien, Rapports.
- Modification d'une opération (seule la suppression existe).
- Clôture mensuelle (`monthly_snapshots`) et exports PDF / Excel.
- Notifications (Expo Notifications) et mode hors-ligne.
- Icône et splash screen (dossier `assets/` vide).

**Non vérifié** : le code compile (`npm run typecheck`) et le bundle Android se génère (`npx expo export --platform android`), mais l'app n'a **pas** été lancée sur simulateur ou appareil. Les styles NativeWind, notamment sur `Link` avec `className`, sont à valider visuellement.

## Mise en place

### 1. Base Supabase

Dans le SQL Editor de ton projet Supabase, exécute **dans cet ordre** :

1. `database/migrations/0001_schema.sql`
2. `database/migrations/0002_rls.sql`
3. `database/migrations/0003_triggers.sql`
4. `database/functions/finance_functions.sql`

Les fonctions utilisent `CREATE OR REPLACE` ; relancer le fichier est sans risque.
Les index `NULLS NOT DISTINCT` demandent PostgreSQL 15+ (Supabase utilise une version plus récente).

### 2. Application

```bash
cp .env.example .env        # renseigner l'URL et la clé anon (Project Settings → API)
npm install
npm start
```

Seule la clé **anon** doit figurer dans l'app. La clé `service_role` ne doit jamais être embarquée.

### 3. Tests de la base

```bash
npm run test:db
```

Lance PostgreSQL en mémoire (PGlite) avec un shim minimal de Supabase (`auth.users`, `auth.uid()`, rôles) et vérifie : application des migrations, calculs de soldes et de totaux mensuels, isolation entre deux utilisateurs, refus des références croisées, contraintes métier, journal d'audit en lecture seule. Ce n'est pas un substitut à un test sur une vraie instance Supabase (le shim ne reproduit pas tout le comportement de GoTrue).

## Décisions de modélisation

- **Compte concerné** : pour `income`, `expense` et `debt_payment`, le compte est stocké dans `source_account_id`. Pour `transfer`, `source_account_id` est le compte débité et `destination_account_id` le compte crédité.
- **Épargne transférée** = virements dont le compte destination est de type `savings`.
- **Remboursement dette** = opérations `debt_payment` ; les intérêts sont suivis dans `interest_amount`.
- **Montants** : toujours positifs ; le sens est donné par le type d'opération.
- **Ownership** : les clés étrangères sont composites `(user_id, id)`. Sans cela, un utilisateur pourrait référencer le compte ou la catégorie d'un autre, car le RLS ne s'applique pas aux vérifications de clés étrangères.
- **Catégories** : neuf catégories par défaut créées à l'inscription (`handle_new_user`). Une catégorie de revenu ne peut pas être affectée à une dépense (trigger).
- **Soldes** : calculés à la volée par `account_balances()` à partir des opérations et du solde initial. Pas de colonne de solde stockée, donc pas de risque de désynchronisation.

## Points à vérifier

- **Confirmation par email** : si elle est activée dans Supabase, l'inscription ne connecte pas immédiatement l'utilisateur (l'écran l'indique).
- **Identifiant d'application** : `fr.example.mybudget` dans `app.json` est un placeholder à remplacer avant toute publication.
- **Versions** : les versions Expo ont été alignées sur `node_modules/expo/bundledNativeModules.json` (SDK 58). NativeWind 4 nécessite Tailwind 3.x : la version 5 était encore en release candidate au moment de l'écriture. À revérifier si tu mets à jour.
- **Export Excel** : le paquet `xlsx` publié sur npm est ancien et porte des failles connues ; il n'est pas utilisé. Une alternative (ex. `exceljs`) reste à choisir quand l'export sera implémenté.

## Structure

```
app/             routes Expo Router (auth, onglets, écrans secondaires)
components/      composants réutilisables (KPI, cartes, graphiques, formulaire)
services/        accès Supabase (transactions, comptes, catégories, analyse, profil)
hooks/           hooks TanStack Query
store/           état global Zustand (session, mois sélectionné)
utils/           dates et montants
constants/       libellés et couleurs
types/           types TypeScript des tables et des RPC
database/        migrations, fonctions SQL, tests SQL
```
