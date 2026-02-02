-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Générique',
    "dosage" TEXT,
    "description" TEXT,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "sellPrice" REAL NOT NULL,
    "buyingPrice" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StockLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "quantity" INTEGER NOT NULL,
    "receivedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    CONSTRAINT "StockLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Requisition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Requisition_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Requisition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequisitionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requisitionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buyPrice" REAL NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    CONSTRAINT "RequisitionItem_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RequisitionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Requisition_reference_key" ON "Requisition"("reference");
