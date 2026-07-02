import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { ContactReply } from "@/components/admin/contact-reply";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Prospects & contacts" };

export default async function AdminContactsPage() {
  await requireAdmin();

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

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
        title="Prospects & contacts"
        description="Messages reçus via le formulaire de contact public."
      />

      {messages.length === 0 ? (
        <div className="border-line bg-surface/60 text-muted rounded-xl border border-dashed px-6 py-16 text-center text-sm">
          Aucun message pour l'instant.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className="border-line bg-surface rounded-xl border p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-ink font-semibold">{m.name}</div>
                  <div className="text-muted mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <a
                      href={`mailto:${m.email}`}
                      className="hover:text-ink inline-flex items-center gap-1.5"
                    >
                      <Mail className="size-3.5" />
                      {m.email}
                    </a>
                    {m.phone ? (
                      <a
                        href={`tel:${m.phone}`}
                        className="hover:text-ink inline-flex items-center gap-1.5"
                      >
                        <Phone className="size-3.5" />
                        {m.phone}
                      </a>
                    ) : null}
                  </div>
                </div>
                <span className="text-muted/80 text-xs">
                  {formatDate(m.createdAt)}
                </span>
              </div>
              <p className="text-muted mt-3 text-sm whitespace-pre-line">
                {m.message}
              </p>
              <ContactReply
                id={m.id}
                name={m.name}
                repliedAt={m.repliedAt ? m.repliedAt.toISOString() : null}
                lastReply={m.reply}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
