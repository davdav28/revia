import type { Metadata } from "next";
import { Hanken_Grotesk, Geist_Mono } from "next/font/google";
import { BRAND } from "@/config/brand";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

/**
 * Hanken Grotesk : grotesque chaleureux et lisible, présent en titres (graisse
 * forte) comme en corps de texte. Choix délibéré, à contre-courant d'Inter.
 */
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Geist Mono : chiffres tabulaires pour aligner montants et compteurs. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${hanken.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
