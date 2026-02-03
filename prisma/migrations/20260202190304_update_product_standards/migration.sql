/*
  Warnings:

  - Made the column `code` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dci" TEXT,
    "code" TEXT NOT NULL,
    "codeCip7" TEXT,
    "codeAtc" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Générique',
    "form" TEXT,
    "dosage" TEXT,
    "packaging" TEXT,
    "description" TEXT,
    "isPrescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "maxStock" INTEGER,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "sellPrice" REAL NOT NULL,
    "buyingPrice" REAL NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("buyingPrice", "category", "code", "createdAt", "currentStock", "description", "dosage", "id", "minStock", "name", "sellPrice", "updatedAt") SELECT "buyingPrice", "category", "code", "createdAt", "currentStock", "description", "dosage", "id", "minStock", "name", "sellPrice", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
