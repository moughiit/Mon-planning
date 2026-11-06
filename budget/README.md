# My Budget (version simple)

Une seule page HTML, sans serveur ni compte : les données restent dans le navigateur, comme ton planning.

## Utilisation

- Ouvre `index.html` dans un navigateur (Chrome, Safari, Firefox).
- Sur téléphone, il faut une adresse web. Un workflow est prêt : `.github/workflows/pages-budget.yml` publie uniquement le dossier `budget/`.
  - Une fois : dans GitHub, **Settings → Pages → Build and deployment → Source : GitHub Actions**.
  - Le workflow se déclenche à chaque modification de `budget/` sur la branche `claude/awesome-davinci-hz5if2` (ou manuellement, onglet Actions). Pour le publier depuis `main`, modifie la branche dans le fichier après fusion.
  - Je n'ai pas pu activer Pages ni lancer le workflow depuis cette session : vérifie l'onglet Actions après le premier passage.
  - L'adresse publique est ouvrable par n'importe qui. Les données restent cependant dans le navigateur de chacun.

## Points importants

- **Les données sont stockées dans le navigateur, par adresse.** Une version ouverte depuis un fichier local et une version hébergée ne partagent pas leurs données. Utilise toujours la même adresse.
- **Exporte une sauvegarde régulièrement** (Plus → Réglages → Exporter). Vider le cache du navigateur efface les données.
- Les dates sont lues en heure locale (pas en UTC).

## Fonctions

- Comptes (courant, épargne, espèces, autre) avec soldes calculés.
- Opérations : revenus, dépenses, virements ; modification et suppression.
- Dettes : montant initial, taux, échéance ; remboursements découpés capital / intérêts.
- Épargne : objectifs avec compte lié, progression et mensualité estimée.
- Budgets : plafond mensuel par catégorie, alerte au dépassement.
- Rapports : bilan annuel, taux d'épargne, tableau mois par mois.
- Catégories personnalisables, sauvegarde et import JSON.

- Calendrier quotidien : grille du mois, net par jour, opérations du jour et ajout pré-rempli.
