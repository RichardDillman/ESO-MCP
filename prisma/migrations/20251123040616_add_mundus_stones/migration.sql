-- CreateTable
CREATE TABLE "MundusStone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "source" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "MundusStone_name_key" ON "MundusStone"("name");

-- CreateIndex
CREATE INDEX "MundusStone_name_idx" ON "MundusStone"("name");
