import { PrismaClient } from "@prisma/client";

// Un singur client Prisma pe proces; in dezvoltare, hot-reload-ul ar crea altfel
// cate o conexiune noua la fiecare salvare.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
