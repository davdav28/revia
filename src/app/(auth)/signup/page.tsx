import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un salon" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
        Créer votre salon
      </h1>
      <p className="text-muted mt-1 text-sm">
        Quelques secondes pour commencer à récupérer vos clientes.
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
    </div>
  );
}
