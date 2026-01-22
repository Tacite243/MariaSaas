import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Le mot de passe doit faire 6 caractères min.")
});

// On exporte le type TypeScript déduit automatiquement par Zod !
export type LoginInput = z.infer<typeof loginSchema>;
