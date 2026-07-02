import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomPriceForm } from "@/components/admin/custom-price-form";

export const metadata: Metadata = { title: "Abonnement sur-mesure" };

export default async function AdminPricingPage() {
  await requireAdmin();
  const stripeOn = isStripeConfigured();

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Espace fondateur
      </Link>
      <PageHeader
        title="Abonnement Multi sur-mesure"
        description="Génère un lien de paiement Stripe pour un tarif Multi négocié."
      />

      <Card>
        <CardHeader>
          <CardTitle>Nouveau lien de paiement</CardTitle>
          <CardDescription>
            Le client garde toutes les fonctionnalités Multi, quel que soit le
            montant. Il doit avoir créé son compte au préalable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stripeOn ? (
            <CustomPriceForm />
          ) : (
            <p className="text-muted text-sm">
              Stripe n'est pas configuré dans cet environnement (mode démo).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
