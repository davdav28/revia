import type { Metadata } from "next";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
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

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  const stripeOn = isStripeConfigured();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Espace fondateur"
        description="Outils internes — réservés à toi."
      />

      <Link href="/admin/clients" className="block">
        <Card className="hover:bg-nude-soft/40 transition-colors">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="bg-nude-soft text-lacquer-ink flex size-10 items-center justify-center rounded-md">
              <Users className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Tous mes clients</CardTitle>
              <CardDescription>
                Tous les salons abonnés : statut, plan, usage, CA récupéré.
              </CardDescription>
            </div>
            <ChevronRight className="text-muted size-5" />
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement Multi sur-mesure</CardTitle>
          <CardDescription>
            Génère un lien de paiement Stripe pour un tarif Multi négocié. Le
            client garde toutes les fonctionnalités Multi, quel que soit le
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
