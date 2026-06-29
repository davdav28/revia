import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma — évite d'épuiser le pool de connexions en dev (HMR
 * recrée les modules à chaque sauvegarde).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
