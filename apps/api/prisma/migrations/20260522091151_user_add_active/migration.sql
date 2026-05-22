-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "nickname" TEXT NOT NULL DEFAULT '田园用户',
    "avatar" TEXT NOT NULL DEFAULT '🧑‍🌾',
    "level" TEXT NOT NULL DEFAULT 'Lv.1',
    "role" TEXT NOT NULL DEFAULT 'customer',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "openid" TEXT,
    "unionid" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "createdAt", "id", "level", "nickname", "openid", "phone", "role", "unionid", "updatedAt") SELECT "avatar", "createdAt", "id", "level", "nickname", "openid", "phone", "role", "unionid", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_openid_key" ON "User"("openid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
