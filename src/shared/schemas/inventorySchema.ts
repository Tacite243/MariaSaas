import { z } from 'zod';



// Schéma pour le lot initial facultatif
export const initialStockSchema = z.object({
    quantity: z.number().int().positive(),
    batchNumber: z.string().min(1),
    expiryDate: z.coerce.date()
});

// Produit
export const productSchema = z.object({
    name: z.string().min(2, "Nom obligatoire"),
    dci: z.string().optional().nullable(),
    code: z.string().optional(),
    codeCip7: z.string().optional().nullable(),
    codeAtc: z.string().optional().nullable(),
    category: z.string().default("Générique"),
    form: z.string().optional().nullable(),
    dosage: z.string().optional().nullable(),
    packaging: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    isPrescriptionRequired: z.boolean().default(false),

    // Stock
    minStock: z.coerce.number().int().default(5),
    maxStock: z.coerce.number().int().optional().nullable(),
    location: z.string().optional().nullable(),

    // Prix
    sellPrice: z.coerce.number().min(0, "Prix de vente invalide"),
    buyingPrice: z.coerce.number().min(0).default(0),
    vatRate: z.coerce.number().min(0).default(0),

    // Optionnel pour le stock initial
    initialStock: z.object({
        quantity: z.number().int().positive(),
        batchNumber: z.string().min(1),
        expiryDate: z.coerce.date()
    }).optional()
});

// Ligne de réquisition
export const requisitionItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive("Quantité doit être > 0"),
    buyPrice: z.number().min(0),
    batchNumber: z.string().optional(),
    expiryDate: z.coerce.date().optional()
});

// Entête réquisition
export const createRequisitionSchema = z.object({
    supplierId: z.string().uuid("Fournisseur requis"),
    createdById: z.string().uuid(),
    items: z.array(requisitionItemSchema).min(1, "Il faut au moins un produit")
});

export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>;
export type ProductInput = z.infer<typeof productSchema>;