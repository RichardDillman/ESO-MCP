-- CreateTable
CREATE TABLE "Metadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "skillLine" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "costResource" TEXT,
    "costAmount" INTEGER,
    "castTime" INTEGER,
    "channelTime" INTEGER,
    "duration" INTEGER,
    "cooldown" INTEGER,
    "range" INTEGER,
    "radius" INTEGER,
    "target" TEXT,
    "description" TEXT NOT NULL,
    "unlockDescription" TEXT,
    "patch" TEXT,
    "source" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseSkillId" TEXT,
    "skillLineId" TEXT,
    CONSTRAINT "Skill_baseSkillId_fkey" FOREIGN KEY ("baseSkillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Skill_skillLineId_fkey" FOREIGN KEY ("skillLineId") REFERENCES "SkillLine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Effect" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" TEXT,
    "duration" INTEGER,
    "target" TEXT,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "Effect_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Morph" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "Morph_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scaling" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stat" TEXT NOT NULL,
    "coefficient" REAL NOT NULL,
    "maxTargets" INTEGER,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "Scaling_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Requirements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "level" INTEGER,
    "skillLineRank" INTEGER,
    "prerequisiteSkill" TEXT,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "Requirements_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "maxRank" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Set" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "slots" TEXT NOT NULL,
    "weaponTypes" TEXT,
    "location" TEXT,
    "dropSource" TEXT,
    "craftingSites" TEXT,
    "dlcRequired" TEXT,
    "tradeable" BOOLEAN NOT NULL,
    "bindType" TEXT,
    "description" TEXT,
    "patch" TEXT,
    "source" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SetBonus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pieces" INTEGER NOT NULL,
    "stats" TEXT,
    "effect" TEXT,
    "effectType" TEXT,
    "cooldown" INTEGER,
    "setId" TEXT NOT NULL,
    CONSTRAINT "SetBonus_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "alliance" TEXT,
    "baseStats" TEXT,
    "source" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RacialPassive" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "unlockLevel" INTEGER NOT NULL,
    "effects" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    CONSTRAINT "RacialPassive_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Buff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "value" REAL,
    "duration" TEXT,
    "source" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Debuff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "value" REAL,
    "duration" TEXT,
    "source" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TargetDummy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "health" INTEGER NOT NULL,
    "buffsProvided" TEXT NOT NULL,
    "debuffsProvided" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_key_key" ON "Metadata"("key");

-- CreateIndex
CREATE INDEX "Skill_name_idx" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_skillLine_idx" ON "Skill"("skillLine");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_type_idx" ON "Skill"("type");

-- CreateIndex
CREATE INDEX "Effect_skillId_idx" ON "Effect"("skillId");

-- CreateIndex
CREATE INDEX "Morph_skillId_idx" ON "Morph"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Scaling_skillId_key" ON "Scaling"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Requirements_skillId_key" ON "Requirements"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillLine_name_key" ON "SkillLine"("name");

-- CreateIndex
CREATE INDEX "SkillLine_name_idx" ON "SkillLine"("name");

-- CreateIndex
CREATE INDEX "SkillLine_category_idx" ON "SkillLine"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Set_name_key" ON "Set"("name");

-- CreateIndex
CREATE INDEX "Set_name_idx" ON "Set"("name");

-- CreateIndex
CREATE INDEX "Set_type_idx" ON "Set"("type");

-- CreateIndex
CREATE INDEX "SetBonus_setId_idx" ON "SetBonus"("setId");

-- CreateIndex
CREATE UNIQUE INDEX "Race_name_key" ON "Race"("name");

-- CreateIndex
CREATE INDEX "Race_name_idx" ON "Race"("name");

-- CreateIndex
CREATE INDEX "RacialPassive_raceId_idx" ON "RacialPassive"("raceId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_key" ON "Class"("name");

-- CreateIndex
CREATE INDEX "Class_name_idx" ON "Class"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Buff_name_key" ON "Buff"("name");

-- CreateIndex
CREATE INDEX "Buff_name_idx" ON "Buff"("name");

-- CreateIndex
CREATE INDEX "Buff_type_idx" ON "Buff"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Debuff_name_key" ON "Debuff"("name");

-- CreateIndex
CREATE INDEX "Debuff_name_idx" ON "Debuff"("name");

-- CreateIndex
CREATE INDEX "Debuff_type_idx" ON "Debuff"("type");

-- CreateIndex
CREATE UNIQUE INDEX "TargetDummy_name_key" ON "TargetDummy"("name");

-- CreateIndex
CREATE INDEX "TargetDummy_name_idx" ON "TargetDummy"("name");
