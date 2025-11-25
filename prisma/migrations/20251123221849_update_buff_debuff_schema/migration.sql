/*
  Warnings:

  - You are about to drop the column `duration` on the `Buff` table. All the data in the column will be lost.
  - You are about to drop the column `effect` on the `Buff` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Buff` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Buff` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Debuff` table. All the data in the column will be lost.
  - You are about to drop the column `effect` on the `Debuff` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Debuff` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Debuff` table. All the data in the column will be lost.
  - Added the required column `description` to the `Buff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pageUrl` to the `Buff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sources` to the `Buff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Debuff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pageUrl` to the `Debuff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sources` to the `Debuff` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Buff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sources" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Buff" ("id", "lastUpdated", "name", "type") SELECT "id", "lastUpdated", "name", "type" FROM "Buff";
DROP TABLE "Buff";
ALTER TABLE "new_Buff" RENAME TO "Buff";
CREATE UNIQUE INDEX "Buff_name_key" ON "Buff"("name");
CREATE INDEX "Buff_name_idx" ON "Buff"("name");
CREATE INDEX "Buff_type_idx" ON "Buff"("type");
CREATE TABLE "new_Debuff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sources" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Debuff" ("id", "lastUpdated", "name", "type") SELECT "id", "lastUpdated", "name", "type" FROM "Debuff";
DROP TABLE "Debuff";
ALTER TABLE "new_Debuff" RENAME TO "Debuff";
CREATE UNIQUE INDEX "Debuff_name_key" ON "Debuff"("name");
CREATE INDEX "Debuff_name_idx" ON "Debuff"("name");
CREATE INDEX "Debuff_type_idx" ON "Debuff"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
