import { z } from 'zod';

// Produit
export const productSchema = z.object({
    name: z.string().min(2, "Nom obligatoire"),
    code: z.string().optional(),
    minStock: z.number().min(0).default(5),
    sellPrice: z.number().min(0, "Prix de vente invalide")
});

// Ligne de réquisition
export const requisitionItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive("Quantité doit être > 0"),
    buyPrice: z.number().min(0),
    batchNumber: z.string().optional(),
    expiryDate: z.coerce.date().optional() // 'coerce' permet de transformer une string ISO en Date
});

// Création d'une réquisition (Entête)
export const createRequisitionSchema = z.object({
    supplierId: z.string().uuid("Fournisseur requis"),
    createdById: z.string().uuid(),
    items: z.array(requisitionItemSchema).min(1, "Il faut au moins un produit")
});

export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>;
export type ProductInput = z.infer<typeof productSchema>;