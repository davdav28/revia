# Boucle — Avancement

SaaS de réactivation client pour salons d'onglerie (France).
Boucle produit : **Capter → Détecter → Relancer → Prouver**.

---

## Phase 5 — Abonnement (Stripe) & RGPD ✅ (vérifié en local)

**Abonnement (Stripe)**
- Champs sur `Salon` : `stripeCustomerId`, `stripeSubscriptionId`,
  `subscriptionStatus` (trial/active/past_due/canceled), `plan`, `currentPeriodEnd`.
- Page `/reglages/abonnement` : statut, formules **Mensuel 49 €** / **Annuel
  490 € (2 mois offerts, mise en avant)**, abonnement + gestion.
- Stripe abstrait : **réel** (Checkout + portail + webhook `/api/stripe/webhook`)
  si `STRIPE_SECRET_KEY`, sinon **mode démo** (activation simulée). Bascule sans
  réécriture.
- **Gating** : le scan n'envoie de relances que si l'abonnement est actif
  (trial/active) ; sinon « relances en pause ».
- Vérifié : activation démo trial → actif (annuel, échéance +1 an).

**RGPD**
- **Export** des données : compte salon (`/api/account/export`) et par cliente
  (`/api/clients/[id]/export`) en JSON téléchargeable. Vérifié (81 clientes).
- **Registre des consentements** affiché sur la fiche cliente (SMS/email + dates,
  date de désabonnement).
- **Suppression du compte** (droit à l'effacement) : efface le salon (cascade) +
  l'utilisateur Supabase Auth, avec confirmation par saisie.
- **Pages légales** publiques `/confidentialite` et `/cgu` (placeholders à
  compléter par un juriste), liées depuis Réglages.

---

## Réservation en ligne publique ✅ (vérifié en local)

Les clientes finales réservent directement sur le site, par salon.

- **Page publique** `/r/[slug]` (slug unique par salon, généré à l'inscription
  + backfill). Sans authentification.
- **Parcours** : prestation → créneau → coordonnées + consentement → confirmation.
  Crénaux calculés (lun-sam 9h-19h, pas 30 min, horizon 14 j, sans
  chevauchement avec les RDV existants, futurs uniquement). Re-contrôle serveur
  (fuseau salon + anti-double-réservation).
- **Création** : rapproche d'une cliente existante (tél/email) ou en crée une
  (avec consentement), puis crée un `Appointment` (source `online_booking`,
  montant = prix prestation). Apparaît dans l'agenda du salon.
- **`{{lien}}`** des SMS pointe désormais vers `/r/[slug]` (si réservation active).
- **Réglages** : carte « Réservation en ligne » (lien + copier + ouvrir +
  activer/désactiver via `Salon.bookingEnabled`).
- Vérifié de bout en bout : réservation publique « Juliette Moreau » → RDV
  Pose gel 45 € online_booking visible dans l'agenda.

Limite assumée : horaires d'ouverture fixes (lun-sam 9-19h, poste unique) —
configurables par salon plus tard.

---

## Page Aide & suggestions ✅ (vérifié en local)

- Nouvelle entrée de nav secondaire « Aide & suggestions » (`/aide`).
- **FAQ** (tableau éditable en tête de fichier, en accordéons natifs `<details>`).
- **Formulaire de suggestion** (catégorie question/idée/souci + message) →
  enregistré en base (`Suggestion`, scoppé au salon, auteur capté). Pensé pour
  être exploité plus tard (un back-office de tri viendra ; champs `category`/
  `status` en chaînes libres, extensibles sans migration).
- Historique des messages envoyés par le salon. Contact support (email).

À noter : la **réservation en ligne publique** (clientes finales qui réservent
sur le site) n'est **pas encore construite** — seul le flag `FEATURES.onlineBooking`
existe ; c'est pourquoi `{{lien}}` reste vide dans les SMS. Le **modèle anniversaire**
existe bien (scénario F, 2 variantes + campagne).

---

## Phase 4 — Dashboard « CA récupéré » (la preuve) ✅ (vérifié en local)

Le tableau de bord répond en 3 secondes à « combien Revia me rapporte ».

- **Hero** : compteur de CA récupéré sur **30 jours glissants**, gros et animé
  (élément signature, rouge laque).
- **ROI** : « Revia vous a rapporté X € ce mois pour Y € d'abonnement — soit N×
  votre investissement » (prix d'abonnement dans `config/brand.ts`, en attendant
  Stripe).
- **KPIs** : clientes réactivées (30 j), taux de réactivation (réactivées /
  relancées), rétention à 90 j (réactivées encore actives — vrai indicateur de
  valeur), clientes encore à relancer (lien vers la liste).
- **Graphe** d'évolution du CA récupéré (6 mois, SVG/CSS maison, sans dépendance).
- **Liste des dernières réactivations** : « Clara L. — revenue le 29 juin après
  25 semaines — 45 € ».

Vérifié sur le salon démo (enrichi de ~10 réactivations étalées) : hero 175 €,
ROI 3,6×, graphe croissant, liste détaillée. Le MVP (Phases 0→4) est complet.

---

## Phase 3 — Moteur de réactivation (le cœur) ✅ (vérifié en local)

**Vérifié de bout en bout** (compte démo) : campagne dormance activée → scan →
**18 relances envoyées** (mock, consentement/opt-out respectés) → une cliente
relancée reprend RDV → **1 réactivation, 45 € récupérés** → le compteur
signature du dashboard affiche « 45 € ce mois-ci ». Opt-out public testé.

- **Détection de dormance** : statut par cliente depuis l'écart à la dernière
  visite et le **cycle de sa prestation habituelle** (sinon cycle salon).
  active → at_risk (cycle+grâce) → dormant (cycle×2) → lost (> lostAfterDays).
  Paramètres par salon (`defaultCycleDays`, `graceDays`, `lostAfterDays`).
- **Scan quotidien** : route `/api/cron/daily-scan` (Vercel Cron, `vercel.json`),
  authentifiée par `CRON_SECRET`, **idempotente** (cooldown par cliente).
  Recalcule les statuts, détecte les réactivations, envoie les relances.
- **Campagnes / déclencheurs** : dormance, après 1re visite, anniversaire
  (activables/désactivables). `slow_slot` posé mais non traité (à venir).
- **Bibliothèque de modèles** pré-écrits (FR, variables `{{prenom}}` etc.),
  éditables par le salon. SMS + email.
- **Envoi** via `MessagingProvider` : **Brevo** (réel, si `BREVO_API_KEY`) ou
  **Mock** (dev, par défaut). Statuts (sent/failed), **coût loggé**, respect des
  **plages horaires** (9-20h, hors dimanche), **consentement** par canal et
  **cooldown**.
- **Opt-out / STOP** : page publique `/stop/[token]` (lien signé HMAC) +
  bouton « Ne plus contacter » sur la fiche ; lien de désabonnement dans les
  emails. Une cliente opted-out n'est plus jamais contactée.
- **Détection de réactivation** : cliente relancée qui reprend RDV dans la
  fenêtre → `Recovery` avec montant → alimente le dashboard.
- **Dashboard** : le compteur de CA récupéré est branché sur les `Recovery` du mois.

Décision : provider **Mock par défaut** (testable sans compte Brevo) ; bascule
réelle en ajoutant `BREVO_API_KEY`. `slow_slot` différé.

**Mise à niveau (bibliothèque de modèles — `modeles-reactivation-manucure.md`)** :
- Seed remplacé par la **bibliothèque complète** (scénarios A→J, plusieurs
  variantes par déclencheur), éditable par le salon. Champ `scenario` ajouté
  aux modèles.
- **Sélection de scénario** dans le scan : « à surveiller » → rappel de cycle
  (A) ; dormante < 8 sem. → dormante douce (B) ; ≥ 8 sem. → dormante longue (E).
  La campagne dormance cible désormais `at_risk` **et** `dormant`.
- **Rotation des variantes** par tentative + **mise en sommeil après 3 relances**
  sans retour (en plus du cooldown 30 j).
- **Nouvelles variables** : `{{semaines}}`, `{{derniere_presta}}`, `{{jour}}`.
- **Correctif** : plus de « STOP » dans le corps du SMS (géré par l'opérateur).
- Scénarios **manuels** (nouveauté C, créneau libéré D, saisonnier H, win-back I)
  seedés comme modèles disponibles, sans envoi automatique (règle « pas de remise
  par défaut »). `slow_slot` reste manuel (pas d'auto-scan).
- Vérifié : les « à surveiller » reçoivent le rappel de cycle, variables
  remplies, 0 message avec « STOP » dans le corps.

⚠️ La connexion bash→localhost:3000 échoue dans ce sandbox ; déclencher le scan
via le bouton UI « Lancer le scan » (et non curl) pour les tests locaux.

---

## Phase 2 — Agenda / planification de RDV ✅ (vérifié en local)

**Fait & vérifié de bout en bout** :

- **Vue agenda semaine + jour** : grille horaire 8h–20h, navigation
  (précédent / aujourd'hui / suivant), bascule semaine ↔ jour. Rendu **côté
  client** (fuseau Europe/Paris du navigateur) pour éviter les décalages UTC.
- **Créer / modifier / déplacer / supprimer un RDV** via une modale (cliente,
  prestation, date, heure, durée, montant). « Déplacer » = rééditer date/heure.
  Clic sur un créneau vide → création pré-remplie ; clic sur un RDV → édition.
- **Statuts** (planifié / honoré / absente / annulé) en boutons segmentés, avec
  un style de bloc distinct par statut.
- **RDV honoré → met à jour la fiche cliente** : recalcul `lastVisitAt`,
  `visitCount`, `averageSpend`, `status`. _Testé : marquer honoré fait passer
  Amel de 3 → 4 visites, dernière visite = aujourd'hui._
- **Saisie rapide d'une visite passée** (bouton dédié, statut « honoré » par
  défaut) pour les salons partant d'un carnet papier.
- **Réservation en ligne publique** : drapeau de feature `FEATURES.onlineBooking`
  (désactivé) posé dans `config/brand.ts` — page à construire plus tard.

Schéma : ajout de `durationMin` (Appointment) et `defaultDurationMin` (Service).
Décision : pas de glisser-déposer pour l'instant (déplacement par réédition) ;
les actions RDV prennent des objets (pas FormData) pour que le client construise
`startAt` en heure locale et l'envoie en ISO.

---

## Phase 1 — Données clientes & onboarding ✅ (vérifié en local)

**Fait & vérifié de bout en bout (avec vrai Supabase)** :

- **Modèle de données** étendu : `Service`, `Client`, `Appointment` (+ enums
  `ClientStatus`, `AppointmentStatus`, `VisitSource`). Argent en **centimes**.
- **Import CSV** (`/clientes/import`) : upload → **mapping de colonnes**
  auto-détecté → **aperçu** → import. Parsing client (PapaParse), revalidation
  serveur (Zod), dédoublonnage par téléphone/email, gestion des lignes mal
  formées (dates illisibles, emails invalides → avertissements, pas d'échec).
  _Testé : 70 clientes importées, mapping auto correct._
- **Ajout / édition / suppression** manuels d'une cliente (`/clientes/nouvelle`,
  `/clientes/[id]`), formulaire Zod, consentements RGPD.
- **Catalogue de prestations** (`/reglages/services`) : CRUD + bouton
  « prestations types » (pose gel, semi-permanent, remplissage, nail art,
  dépose). Pré-rempli automatiquement aux nouvelles inscriptions.
- **Liste clientes** : recherche (nom/tél/email), filtre par statut, tri
  (dernière visite / nom / visites / panier moyen).
- **Recalcul** `lastVisitAt` / `visitCount` / `averageSpend` / `status` dérivé
  des `Appointment` (statut depuis la dernière visite + intervalle 28 j par
  défaut → active / at_risk / dormant).
- **Tableau de bord** : compteurs réels (clientes, à relancer, à surveiller).
- **Seed de démo** (`npm run db:seed`) : salon « Salon Démo Revia » connectable
  (`demo@revia.app` / `DemoRevia2026`), 80 clientes, visites sur 6 mois,
  mélange de statuts. Désactivable (supprimer le salon).

Décisions : `Appointment` introduit dès maintenant (source de vérité des stats +
fondation Agenda Phase 2) ; argent en centimes ; intervalle de dormance par
défaut 28 j (affinement par prestation en Phase 2) ; catalogue sous Réglages.

⚠️ Le client Prisma doit être régénéré (`npm run db:generate`) **après** arrêt du
serveur dev quand le schéma change (le DLL du moteur est verrouillé sinon).

---

## Phase 0b — Auth, multi-tenant & shell d'app ✅ (vérifié en local)

**Vérifié de bout en bout avec un vrai projet Supabase (2026-06-29)** :
inscription → création du tenant (Salon + User owner en base) → connexion →
tableau de bord → navigation (états actifs) → Réglages (vraies infos) →
déconnexion → redirection ; routes protégées (`/dashboard` déconnecté →
`/login?next=…`). Tables créées via `npm run db:push` (pas `migrate dev` :
Supabase n'autorise pas la shadow database).

Notes :
- La CLI Prisma ne lit que `.env` ; on charge `.env.local` via `dotenv-cli`
  dans les scripts `db:*`.
- La clé Supabase est au nouveau format `sb_publishable_…` (rangée dans
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, fonctionne tel quel).
- Confirmation d'email **toujours active** sur le projet → l'inscription affiche
  « vérifiez votre email » (comportement correct en prod). Pour tester sans
  friction : désactiver le toggle « Confirm email », ou confirmer les comptes
  via l'API admin (clé `sb_secret_…`). Compte de test confirmé :
  `manon@bel-ongle.fr` / `MotDePasse123`.



**Fait**

- **Prisma** (v6) : schéma cœur multi-tenant `Salon` + `User` (lié à Supabase
  Auth via `authId`), singleton client, scripts `db:*`.
- **Supabase Auth** (@supabase/ssr) : clients serveur/navigateur, `proxy.ts`
  (ex-middleware) qui rafraîchit la session et protège les routes app.
- **Auth complète** : inscription (crée le tenant Salon + User owner), connexion,
  déconnexion — server actions validées par **Zod**, messages d'erreur FR.
- **Garde-fou tenant** : `requireMember()` côté serveur résout le membre + son
  salon ; tout part de `member.salonId`. Les routes app redirigent vers /login.
- **Composants UI ajoutés** : `Input`, `Label`, `Table`, `EmptyState`, `Toast`
  (sonner re-thémé).
- **Shell d'app** : sidebar responsive (drawer mobile) — Tableau de bord,
  Clientes, Agenda, Relances, Réglages — header au nom du salon + déconnexion.
- **Pages** : Tableau de bord stylé (vrais zéros, état vide invitant à importer),
  Clientes/Agenda/Relances en états vides, Réglages affichant les vraies infos.
- Pages d'auth : layout deux volets (panneau de marque sombre + formulaire).

**À tester (sans clés Supabase)** : `/`, `/ds`, `/signup`, `/login` (design).
**À tester (avec clés)** : inscription → tableau de bord, navigation, déconnexion.

**Reste avant clôture Phase 0** : brancher un vrai projet Supabase (clés dans
`.env.local`), lancer `npm run db:migrate`, vérifier le flux connecté.

---

## Phase 0 — Scaffold & design system ✅ (en cours de validation)

**Fait**

- Projet Next.js 16 (App Router) + TypeScript strict + Tailwind v4, `src/`, alias `@/*`.
- Design tokens (palette vernis, rayons, ombres) dans `globals.css`, mappés en
  utilitaires Tailwind. Dark-mode auto du scaffold retiré (thème clair maîtrisé).
- Polices : Hanken Grotesk (titres + UI), Geist Mono (chiffres tabulaires). Pas d'Inter.
- Primitives d'UI re-thémées (aucune trace shadcn par défaut) : `Button`, `Card`, `Badge`.
- Nom produit centralisé dans `src/config/brand.ts` (changeable en 1 ligne).
- Vocabulaire métier des statuts cliente dans `src/lib/client-status.ts`.
- Logo : wordmark `<Logo />` (« o » = boucle vectorielle qui se referme),
  `<LogoMark />`, favicon `app/icon.svg`.
- Élément signature : `<RecoveredCounter />` — compteur de CA animé,
  `prefers-reduced-motion` respecté, chiffres tabulaires laque.
- Landing page FR (`/`) présentant la boucle produit + aperçu du compteur.
- Page de référence design system (`/ds`).
- Outillage : ESLint (scaffold), Prettier + plugin Tailwind, `.env.example` complet,
  README, ce PROGRESS.

**À tester**

- `npm run dev` → `/` (landing) et `/ds` (design system).
- Compteur qui s'anime au chargement ; vérifier le rendu en réduisant les animations.
- Responsive mobile, focus clavier visible, favicon dans l'onglet.

**Reste / prochaines phases**

- Phase 1 — Auth (Supabase) + Prisma + modèle de données multi-tenant + seed démo.
- Phase 2 — Capter/Détecter : import clientes, RDV, calcul de dormance (cron idempotent).
- Phase 3 — Relancer : MessagingProvider (Brevo), templates, campagnes.
- Phase 4 — Prouver : dashboard CA récupéré (table `Recovery`).
- Phase 5 — Stripe (abonnement), RGPD (consentement, opt-out, export/suppression).

---

## Décisions d'architecture

- **Auth + DB : Supabase** (un seul fournisseur, hébergement EU possible, RGPD-friendly).
- **Stack bleeding-edge assumée** : create-next-app a livré Next 16 / React 19 /
  Tailwind v4 (« Next.js 14+ » respecté). Theming en CSS-first (`@theme`).
- **Emplacement du projet** : `D:\Desktop\boucle`. Le dossier de travail initial
  s'appelait littéralement `mkdir boucle && cd boucle` (commande transformée en nom
  de dossier) — incompatible avec npm (`&&`, espaces dans le nom de package).
- **Nom produit** : placeholder « Boucle », centralisé pour swap en 1 ligne.
- **Token `--lacquer` creusé** de `#d6405e` → `#ce3a57` : `#d6405e` donnait un
  contraste de 4.21:1 avec du texte clair (boutons/badges), sous le seuil AA de
  4.5:1. La nouvelle valeur passe (4.58:1) en restant visuellement identique.
- **Piège `text-base`** : nommer un token couleur « base » entre en collision
  avec l'utilitaire de taille `text-base` de Tailwind. Pour la couleur base en
  texte, on utilise `text-[var(--base)]` (sinon Tailwind applique la taille).
- **Compteur animé par ref DOM** (pas via state React) : zéro re-render par
  frame, valeur finale rendue côté serveur (accessible, OK sans JS), conforme
  à la règle `react-hooks/set-state-in-effect` de React 19.
- **`react/no-unescaped-entities` désactivée** : UI francophone = apostrophes
  partout, la règle ne produit que des faux positifs.
- **Prisma redescendu en v6** : Prisma 7 (sorti récemment) impose les driver
  adapters et déplace l'URL hors du schéma — trop de pièces mobiles vs le
  « standard/robuste » demandé. v6 = schéma `url`/`directUrl` classique.
- **`middleware.ts` → `proxy.ts`** : Next 16 a renommé la convention.
- **Auth = Supabase Auth + tenant maison** : Supabase gère l'identité ; on
  miroite chaque utilisateur dans nos tables `User`/`Salon` (lien `authId`) pour
  scoper le multi-tenant et porter les données métier.
