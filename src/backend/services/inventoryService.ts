import { prisma } from '../lib/prisma'
import { CreateRequisitionInput, ProductInput } from '../../shared/schemas/inventorySchema'
import { RequisitionStatus } from '../../shared/types'
import { CreateSupplierInput, UpdateSupplierInput } from '@shared/schemas/supplierSchema'

function generateInternalEAN13() {
  // Préfixe interne (20-29 sont réservés usage interne)
  const prefix = '20'
  const timestamp = Date.now().toString().slice(-9) // 9 derniers chiffres du temps
  const code = prefix + timestamp + '0' // 12 chiffres temporaires

  // Calcul clé de contrôle EAN13 (Modulo 10)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checksum = (10 - (sum % 10)) % 10

  return prefix + timestamp + checksum
}

export class InventoryService {
  // --- PRODUITS ---

  async createProduct(data: ProductInput) {
    const finalCode = data.code || generateInternalEAN13();
    const existing = await prisma.product.findUnique({ where: { code: finalCode } });
    if (existing) throw new Error(`Le code ${finalCode} est déjà utilisé`);

    // Séparation des données de stock initial
    const { initialStock, ...productData } = data;

    return await prisma.$transaction(async (tx) => {
      // Création du produit
      const product = await tx.product.create({
        data: {
          ...productData,
          code: finalCode,
          currentStock: initialStock?.quantity || 0, // Stock initial ou 0
        }
      });

      // Si initialStock est présent, créer le lot
      if (initialStock) {
        await tx.stockLot.create({
          data: {
            productId: product.id,
            batchNumber: initialStock.batchNumber,
            expiryDate: initialStock.expiryDate,
            quantity: initialStock.quantity,
          }
        });
      }

      return product;
    });
  }

  async getAllProducts() {
    return await prisma.product.findMany({
      include: {
        lots: {
          where: { quantity: { gt: 0 } }, // On ne récupère que les lots non vides
          orderBy: { expiryDate: 'asc' } // Le plus vieux en premier (FEFO)
        }
      },
      orderBy: { name: 'asc' }
    })
  }

  async updateProduct(id: string, data: Partial<ProductInput>) {
    // Si on met à jour le code, on vérifie l'unicité
    if (data.code) {
      const existing = await prisma.product.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) throw new Error("Ce code produit est déjà utilisé");
    }

    return await prisma.product.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteProduct(id: string) {
    // Vérifier s'il y a des ventes ou des lots liés
    const hasSales = await prisma.saleItem.findFirst({ where: { productId: id } });
    if (hasSales) throw new Error("Impossible de supprimer : ce produit a été vendu.");

    return await prisma.product.delete({ where: { id } });
  }

  // --- FOURNISSEURS ---
  async getAllSuppliers() {
    return await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
  }

  async createSupplier(data: CreateSupplierInput) {
    return await prisma.supplier.create({ data })
  }

  async updateSupplier(data: UpdateSupplierInput) {
    const { id, ...updateData } = data
    return await prisma.supplier.update({
      where: { id },
      data: updateData
    })
  }

  async deleteSupplier(id: string) {
    // RBAC Métier : On ne supprime pas un fournisseur s'il a déjà des réquisitions (historique)
    const count = await prisma.requisition.count({ where: { supplierId: id } })
    if (count > 0) {
      throw new Error(
        'Impossible de supprimer ce fournisseur car un historique de commandes y est rattaché.'
      )
    }
    return await prisma.supplier.delete({ where: { id } })
  }

  // --- RÉQUISITIONS (Entrée Stock) ---

  // Créer un BROUILLON
  async createDraftRequisition(data: CreateRequisitionInput) {
    const reference = `REQ-${Date.now().toString().slice(-6)}` // Générateur simple de ref

    return await prisma.requisition.create({
      data: {
        reference,
        status: RequisitionStatus.DRAFT,
        supplierId: data.supplierId,
        createdById: data.createdById,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            buyPrice: item.buyPrice,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate
          }))
        }
      },
      include: { items: { include: { product: true } }, supplier: true }
    })
  }

  // VALIDATION (Transaction Critique)
  async validateRequisition(requisitionId: string) {
    return await prisma.$transaction(async (tx) => {
      const requisition = await tx.requisition.findUnique({
        where: { id: requisitionId },
        include: { items: true }
      })

      if (!requisition || requisition.status !== RequisitionStatus.DRAFT) {
        throw new Error('Réquisition invalide')
      }

      for (const item of requisition.items) {
        // 1. Mise à jour du stock global et du prix d'achat
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: { increment: item.quantity },
            buyingPrice: item.buyPrice // Mise à jour du dernier prix d'achat connu
          }
        })

        // CRÉATION DU LOT PHYSIQUE (Pour l'onglet "Lots")
        if (item.batchNumber && item.expiryDate) {
          await tx.stockLot.create({
            data: {
              productId: item.productId,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              quantity: item.quantity,
              receivedDate: new Date()
            }
          })
        }
      }

      return await tx.requisition.update({
        where: { id: requisitionId },
        data: { status: RequisitionStatus.VALIDATED },
        include: { items: true }
      })
    })
  }

  async getRequisitions() {
    return await prisma.requisition.findMany({
      include: { supplier: true, createdBy: true },
      orderBy: { createdAt: 'desc' }
    })
  }
}

export const inventoryService = new InventoryService()
