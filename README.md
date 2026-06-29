# Revia

SaaS de réactivation client pour salons de manucure / onglerie (France).
_(Nom de code interne du dépôt : `boucle`.)_

Un salon a des centaines de clientes, mais une partie ne revient plus — souvent
par simple oubli. **Revia** détecte les clientes « dormantes », les relance au
bon moment (SMS / email) et prouve, chiffres à l'appui, le chiffre d'affaires
récupéré.

> La boucle produit : **Capter → Détecter → Relancer → Prouver**.
> Spécificité onglerie : le cycle de l'ongle est court (2–4 semaines), donc la
> dormance se détecte **en semaines, pas en mois**.

## Stack

- **Next.js 16** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** (theming CSS-first), composants maison re-thémés
- **Supabase** (Auth + Postgres) + **Prisma** _(Phase 1)_
- **Brevo** (SMS + email, RGPD-friendly) _(Phase 3)_
- **Stripe** (abonnement) _(Phase 5)_
- **Vercel** (hébergement + Cron pour le scan quotidien des dormantes)

## Démarrage local (< 5 min)

```bash
npm install
cp .env.example .env.local   # remplir au fur et à mesure des phases
npm run dev
```

Ouvrir http://localhost:3000.

- `/` — landing page
- `/ds` — référence du design system (couleurs, typo, composants)

## Configurer Supabase (auth + base de données)

L'auth et le multi-tenant nécessitent un projet Supabase (gratuit).

1. Créez un projet sur [supabase.com](https://supabase.com) (région **EU**).
2. **Désactivez la confirmation par email** pour le dev :
   _Authentication → Sign In / Providers → Email → décocher « Confirm email »_
   (sinon l'inscription n'ouvre pas de session immédiate).
3. Remplissez `.env.local` (remplacez les valeurs placeholder) :
   - `DATABASE_URL` / `DIRECT_URL` : _Project Settings → Database → Connection
     string_ (URI). `DIRECT_URL` = port 5432 ; `DATABASE_URL` peut utiliser le
     pooler (port 6543, `?pgbouncer=true`).
   - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` :
     _Project Settings → API_.
4. Créez les tables : `npm run db:migrate` (ou `npm run db:push`).
5. `npm run dev`, puis créez votre salon sur `/signup`.

> Les pages publiques (`/`, `/ds`, `/login`, `/signup`) s'affichent même sans
> clés valides ; seule l'authentification requiert un vrai projet Supabase.

## Scripts

| Commande        | Rôle                        |
| --------------- | --------------------------- |
| `npm run dev`   | Serveur de développement    |
| `npm run build` | Build de production         |
| `npm run start` | Sert le build de production |
| `npm run lint`  | ESLint                      |

## Structure

```
src/
  app/            # routes (App Router) + icon.svg (favicon)
  components/
    brand/        # Logo, compteur de CA récupéré
    ui/           # primitives re-thémées (Button, Card, Badge)
  config/brand.ts # nom produit & identité, centralisés
  lib/            # utils (cn, format €), vocabulaire métier
```

L'avancement détaillé et les décisions d'archi sont dans [PROGRESS.md](./PROGRESS.md).
