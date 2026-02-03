import { z } from 'zod';

export const cartItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    // On envoie le prix vu par le vendeur pour s'assurer qu'il n'a pas changé entre temps
    unitPrice: z.number().min(0)
});

export const createSaleSchema = z.object({
    sellerId: z.string().uuid(),
    clientId: z.string().uuid().optional(),
    paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'CARD', 'INSURANCE']),
    items: z.array(cartItemSchema).min(1, "Le panier est vide"),
    discountAmount: z.number().min(0).default(0)
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
