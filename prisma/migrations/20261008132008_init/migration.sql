-- CreateTable
CREATE TABLE "soorten" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "fieldDefinitions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "typeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fieldValues" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "items_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "soorten" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verbindingen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromItemId" INTEGER NOT NULL,
    "toItemId" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verbindingen_fromItemId_fkey" FOREIGN KEY ("fromItemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "verbindingen_toItemId_fkey" FOREIGN KEY ("toItemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "soorten_name_key" ON "soorten"("name");

-- CreateIndex
CREATE INDEX "items_typeId_idx" ON "items"("typeId");

-- CreateIndex
CREATE INDEX "verbindingen_toItemId_idx" ON "verbindingen"("toItemId");

-- CreateIndex
CREATE UNIQUE INDEX "verbindingen_fromItemId_toItemId_key" ON "verbindingen"("fromItemId", "toItemId");
