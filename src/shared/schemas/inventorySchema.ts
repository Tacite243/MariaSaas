import { z } from 'zod';

// Produit
export const productSchema = z.object({
    name: z.string().min(2, "Nom obligatoire"),
    dci: z.string().optional(), // Molécule
    code: z.string().optional(), // Si vide, le backend générera

    category: z.string().default("Générique"),
    form: z.string().optional(),
    dosage: z.string().optional(),
    packaging: z.string().optional(),

    minStock: z.number().min(0).default(5),
    maxStock: z.number().min(0).optional(),
    location: z.string().optional(),

    sellPrice: z.number().min(0, "Prix de vente invalide"),
    buyingPrice: z.number().min(0).default(0),
    isPrescriptionRequired: z.boolean().default(false)
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