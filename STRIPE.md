# Brancher Stripe (paiement réel)

Tant que `STRIPE_SECRET_KEY` est vide, Revia tourne en **mode démo** (activation
simulée, aucun paiement). Pour facturer pour de vrai :

## 1. Clés API

Dashboard Stripe → Developers → API keys. En **mode test** d'abord.

```
STRIPE_SECRET_KEY="sk_test_…"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_…"
```

## 2. Produits & prix (3 plans × mensuel/annuel = 6 prix)

Dashboard → Products. Créer un produit par plan, avec 2 prix récurrents
(mensuel et annuel). Reporter les **IDs de prix** (`price_…`) :

| Plan      | Mensuel                        | Annuel                        |
| --------- | ------------------------------ | ----------------------------- |
| Essentiel | `STRIPE_PRICE_ESSENTIEL_MONTHLY` (69 €)  | `STRIPE_PRICE_ESSENTIEL_ANNUAL` (690 €)  |
| Pro       | `STRIPE_PRICE_PRO_MONTHLY` (119 €)       | `STRIPE_PRICE_PRO_ANNUAL` (1190 €)       |
| Multi     | `STRIPE_PRICE_MULTI_MONTHLY` (199 €)     | `STRIPE_PRICE_MULTI_ANNUAL` (1990 €)     |

Les montants sont la source de vérité dans `src/config/brand.ts` (`SUBSCRIPTION`).
Gardez Stripe aligné.

## 3. Webhook

Dashboard → Developers → Webhooks → Add endpoint :

- URL : `https://VOTRE-DOMAINE/api/stripe/webhook`
- Événements : `checkout.session.completed`,
  `customer.subscription.created/updated/deleted`, `invoice.paid`.

Copier le **signing secret** (`whsec_…`) :

```
STRIPE_WEBHOOK_SECRET="whsec_…"
```

Le webhook synchronise statut, plan, période et **remet le quota SMS à zéro**
à chaque nouvelle période de facturation.

## 4. Dépassement facturé à l'usage

Un **compteur** (Billing → Meters, `event_name = sms_overage`) + un **prix
metered « par segment »** par plan (0,16 / 0,13 / 0,10 €). Le Checkout ajoute
automatiquement ce prix comme 2ᵉ ligne de l'abonnement, et le scan reporte
chaque segment de dépassement au compteur → facturé sur l'invoice du mois.

```
STRIPE_OVERAGE_METER_EVENT="sms_overage"
STRIPE_METER_PRICE_ESSENTIEL="price_…"
STRIPE_METER_PRICE_PRO="price_…"
STRIPE_METER_PRICE_MULTI="price_…"
```

Laisser ces 4 variables vides = pas de facturation du dépassement (les envois se
mettent simplement en pause au plafond, géré en interne).

## 5. Prix fondateur (optionnel)

Dashboard → Coupons : créer un coupon (ex. -30 % à vie, ou montant fixe), puis
renseigner son ID :

```
STRIPE_FOUNDER_COUPON="abc123"
```

Il est appliqué automatiquement à l'abonnement au moment du Checkout.

## 6. Recharges de SMS

Aucune config supplémentaire : le pack de recharge (montant dans
`SUBSCRIPTION.rechargePack`) est facturé via un paiement unique Checkout, et
crédité par le webhook `checkout.session.completed` (metadata `kind=recharge`).

## 7. Sur Vercel

Coller toutes ces variables dans Project → Settings → Environment Variables,
puis redéployer. Tester un paiement avec une carte de test
(`4242 4242 4242 4242`). Le portail client (« Gérer mon abonnement ») devient
actif automatiquement dès que Stripe est configuré.
