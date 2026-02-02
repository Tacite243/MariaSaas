import { prisma } from '../lib/prisma';
import { CreateRequisitionInput } from '../../shared/schemas/inventorySchema';
import { RequisitionStatus } from '../../shared/types';


export class InventoryService {

    // --- PRODUITS ---
    async createProduct(data: any) {
        return await prisma.product.create({ data });
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
        });
    }

    // --- FOURNISSEURS ---
    async createSupplier(data: { name: string; phone?: string }) {
        return await prisma.supplier.create({ data });
    }

    async getAllSuppliers() {
        return await prisma.supplier.findMany();
    }

    // --- RÉQUISITIONS (Entrée Stock) ---

    // 1. Créer un BROUILLON
    async createDraftRequisition(data: CreateRequisitionInput) {
        const reference = `REQ-${Date.now().toString().slice(-6)}`; // Générateur simple de ref

        return await prisma.requisition.create({
            data: {
                reference,
                status: RequisitionStatus.DRAFT,
                supplierId: data.supplierId,
                createdById: data.createdById,
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        buyPrice: item.buyPrice,
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate
                    }))
                }
            },
            include: { items: { include: { product: true } }, supplier: true }
        });
    }

    // 2. VALIDATION (Transaction Critique)
    async validateRequisition(requisitionId: string) {
        return await prisma.$transaction(async (tx) => {
            const requisition = await tx.requisition.findUnique({
                where: { id: requisitionId },
                include: { items: true }
            });

            if (!requisition || requisition.status !== RequisitionStatus.DRAFT) {
                throw new Error("Réquisition invalide");
            }

            for (const item of requisition.items) {
                // 1. Mise à jour du stock global et du prix d'achat
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        currentStock: { increment: item.quantity },
                        buyingPrice: item.buyPrice // Mise à jour du dernier prix d'achat connu
                    }
                });

                // 2. CRÉATION DU LOT PHYSIQUE (Pour l'onglet "Lots")
                if (item.batchNumber && item.expiryDate) {
                    await tx.stockLot.create({
                        data: {
                            productId: item.productId,
                            batchNumber: item.batchNumber,
                            expiryDate: item.expiryDate,
                            quantity: item.quantity,
                            receivedDate: new Date()
                        }
                    });
                }
            }

            return await tx.requisition.update({
                where: { id: requisitionId },
                data: { status: RequisitionStatus.VALIDATED },
                include: { items: true }
            });
        });
    }

    async getRequisitions() {
        return await prisma.requisition.findMany({
            include: { supplier: true, createdBy: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}

export const inventoryService = new InventoryService();