-- CreateTable
CREATE TABLE "Cap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "capValue" TEXT,
    "capType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StatAffectsCap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "capId" TEXT NOT NULL,
    "statName" TEXT NOT NULL,
    "conversionInfo" TEXT,
    CONSTRAINT "StatAffectsCap_capId_fkey" FOREIGN KEY ("capId") REFERENCES "Cap" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Cap_name_key" ON "Cap"("name");

-- CreateIndex
CREATE INDEX "Cap_name_idx" ON "Cap"("name");

-- CreateIndex
CREATE INDEX "Cap_category_idx" ON "Cap"("category");

-- CreateIndex
CREATE INDEX "Cap_capType_idx" ON "Cap"("capType");

-- CreateIndex
CREATE INDEX "StatAffectsCap_capId_idx" ON "StatAffectsCap"("capId");

-- CreateIndex
CREATE INDEX "StatAffectsCap_statName_idx" ON "StatAffectsCap"("statName");

-- CreateIndex
CREATE UNIQUE INDEX "StatAffectsCap_capId_statName_key" ON "StatAffectsCap"("capId", "statName");
