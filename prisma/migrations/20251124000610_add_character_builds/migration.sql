-- CreateTable
CREATE TABLE "CharacterBuild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "classId" TEXT,
    "raceId" TEXT,
    "stats" TEXT NOT NULL,
    "sets" TEXT,
    "rotation" TEXT,
    "buffs" TEXT,
    "cachedDPS" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CharacterBuild_name_idx" ON "CharacterBuild"("name");
