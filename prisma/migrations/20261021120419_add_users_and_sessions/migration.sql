/*
  Warnings:

  - Added the required column `userId` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `soorten` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "gebruikers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gebruikers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fieldValues" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gebruikers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "items_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "soorten" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_items" ("body", "createdAt", "date", "fieldValues", "id", "title", "typeId", "updatedAt") SELECT "body", "createdAt", "date", "fieldValues", "id", "title", "typeId", "updatedAt" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE INDEX "items_userId_idx" ON "items"("userId");
CREATE INDEX "items_typeId_idx" ON "items"("typeId");
CREATE TABLE "new_soorten" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "fieldDefinitions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "soorten_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gebruikers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_soorten" ("createdAt", "fieldDefinitions", "icon", "id", "name", "updatedAt") SELECT "createdAt", "fieldDefinitions", "icon", "id", "name", "updatedAt" FROM "soorten";
DROP TABLE "soorten";
ALTER TABLE "new_soorten" RENAME TO "soorten";
CREATE UNIQUE INDEX "soorten_userId_name_key" ON "soorten"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "gebruikers_email_key" ON "gebruikers"("email");

-- CreateIndex
CREATE INDEX "sessies_userId_idx" ON "sessies"("userId");
