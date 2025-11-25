-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "ItemTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tagId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "Tag"("category");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "ItemTag_tagId_idx" ON "ItemTag"("tagId");

-- CreateIndex
CREATE INDEX "ItemTag_itemType_idx" ON "ItemTag"("itemType");

-- CreateIndex
CREATE INDEX "ItemTag_itemId_itemType_idx" ON "ItemTag"("itemId", "itemType");

-- CreateIndex
CREATE UNIQUE INDEX "ItemTag_tagId_itemId_itemType_key" ON "ItemTag"("tagId", "itemId", "itemType");
