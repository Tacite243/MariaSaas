import { z } from 'zod';

// Produit (Mise à jour complète)
export const productSchema = z.object({
    name: z.string().min(2, "Nom obligatoire"),

    // Nouveaux champs d'identification
    dci: z.string().optional(),
    code: z.string().optional(),
    codeCip7: z.string().optional(),
    codeAtc: z.string().optional(),

    // Caractéristiques
    category: z.string().default("Générique"),
    form: z.string().optional(),
    dosage: z.string().optional(),
    packaging: z.string().optional(),
    description: z.string().optional(),
    isPrescriptionRequired: z.boolean().default(false),

    // Stock & Logistique
    minStock: z.number().min(0).default(5),
    maxStock: z.number().min(0).optional(),
    location: z.string().optional(),

    // Prix
    sellPrice: z.number().min(0, "Prix de vente invalide"),
    buyingPrice: z.number().min(0).default(0),
    vatRate: z.number().min(0).default(0)
});

// Ligne de réquisition (Inchangé)
export const requisitionItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive("Quantité doit être > 0"),
    buyPrice: z.number().min(0),
    batchNumber: z.string().optional(),
    expiryDate: z.coerce.date().optional()
});

// Entête réquisition (Inchangé)
export const createRequisitionSchema = z.object({
    supplierId: z.string().uuid("Fournisseur requis"),
    createdById: z.string().uuid(),
    items: z.array(requisitionItemSchema).min(1, "Il faut au moins un produit")
});

export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>;
export type ProductInput = z.infer<typeof productSchema>;