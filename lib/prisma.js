import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

// In dev reloadt Next bij elke wijziging de servermodules. zonder deze truc maakt
// elke reload een nieuwe PrismaClient met een nieuwe db verbinding totdat SQLite klaagt.
// globalThis overleeft een reload, daarom bewaar je de client daar en herbruik je 'm
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}