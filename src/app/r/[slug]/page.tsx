import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getBookingData } from "@/server/booking";
import { BookingFlow } from "./booking-flow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBookingData(slug);
  return { title: data ? `Réserver — ${data.salonName}` : "Réservation" };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBookingData(slug);
  if (!data) notFound();

  return (
    <div className="bg-base min-h-dvh">
      <header className="border-line border-b">
        <div className="mx-auto flex max-w-2xl flex-col gap-1 px-6 py-3">
          <span className="font-display text-ink text-lg font-bold">
            {data.salonName}
          </span>
          {data.salonAddress || data.salonPhone ? (
            <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {data.salonAddress ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${data.salonName} ${data.salonAddress}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ink inline-flex items-center gap-1.5"
                >
                  <MapPin className="size-3.5 shrink-0" />
                  {data.salonAddress}
                </a>
              ) : null}
              {data.salonPhone ? (
                <a
                  href={`tel:${data.salonPhone.replace(/\s/g, "")}`}
                  className="hover:text-ink inline-flex items-center gap-1.5"
                >
                  <Phone className="size-3.5 shrink-0" />
                  {data.salonPhone}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
          Réserver votre rendez-vous
        </h1>
        <p className="text-muted mt-1">
          Choisissez votre prestation et votre créneau, en quelques secondes.
        </p>

        <div className="mt-8">
          <BookingFlow
            slug={slug}
            services={data.services}
            busy={data.busy}
            hours={data.hours}
          />
        </div>
      </main>

      <footer className="mx-auto max-w-2xl px-6 py-10 text-center">
        <span className="text-muted inline-flex items-center gap-1.5 text-xs">
          Propulsé par <Logo className="text-sm" />
        </span>
      </footer>
    </div>
  );
}
