-- CreateTable
CREATE TABLE "Goods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "intro" TEXT NOT NULL DEFAULT '',
    "origin" TEXT NOT NULL DEFAULT '河南·周口',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "coldChain" BOOLEAN NOT NULL DEFAULT false,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER NOT NULL DEFAULT 48,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 99,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goodsId" TEXT NOT NULL,
    "spec" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 99,
    CONSTRAINT "Sku_goodsId_fkey" FOREIGN KEY ("goodsId") REFERENCES "Goods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
