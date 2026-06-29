"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { DEFAULT_SERVICES } from "@/lib/default-services";
import { seedReactivationDefaults } from "@/lib/reactivation/seed";
import { generateUniqueSlug } from "@/lib/slug";

export type AuthState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Traduit les messages d'erreur Supabase courants en français lisible. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cette adresse email.";
  if (m.includes("email not confirmed"))
    return "Confirmez d'abord votre email via le lien reçu.";
  if (m.includes("rate limit"))
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  return "Une erreur est survenue. Réessayez.";
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    salonName: formData.get("salonName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { salonName, name, email, password } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { salonName, name: name || null } },
    });

    if (error) return { error: translateAuthError(error.message) };
    if (!data.user) return { error: "Inscription impossible. Réessayez." };

    // Crée le tenant et le membre owner. Idempotent : si l'authId existe déjà
    // (action rejouée), on n'écrase rien.
    const existing = await prisma.user.findUnique({
      where: { authId: data.user.id },
    });
    if (!existing) {
      const slug = await generateUniqueSlug(salonName);
      const salon = await prisma.salon.create({
        data: {
          name: salonName,
          slug,
          users: {
            create: {
              authId: data.user.id,
              email,
              name: name || null,
              role: "owner",
            },
          },
          // Catalogue de prestations onglerie pré-rempli.
          services: { create: DEFAULT_SERVICES },
        },
        select: { id: true },
      });
      // Modèles de messages + campagnes de relance par défaut.
      await seedReactivationDefaults(salon.id);
    }

    // Email confirmation désactivée → session immédiate. Sinon, on invite à
    // confirmer l'email.
    if (!data.session) {
      return {
        message:
          "Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous.",
      };
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: "Erreur d'enregistrement du salon. Réessayez." };
    }
    return { error: "Une erreur est survenue. Réessayez." };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const next = (formData.get("next") as string) || "/dashboard";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: translateAuthError(error.message) };

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
