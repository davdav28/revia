import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
        Connexion
      </h1>
      <p className="text-muted mt-1 text-sm">
        Heureux de vous revoir. Accédez à votre tableau de bord.
      </p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
