import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 * In development, Next.js hot-reload would otherwise create a new
 * PrismaClient on every reload, exhausting database connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
