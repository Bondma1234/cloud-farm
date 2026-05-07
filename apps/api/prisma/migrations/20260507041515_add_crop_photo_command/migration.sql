-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "daysToHarvest" TEXT NOT NULL,
    "yieldPerSqm" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "recommendPkg" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PhotoPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "userIcon" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "plotId" TEXT,
    "crop" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Command" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "requestedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "statusLabel" TEXT NOT NULL DEFAULT '待执行',
    "by" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "photo" TEXT,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
