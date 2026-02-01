import { z } from 'zod';
import { UserRole } from '../types';

// 1. Schéma pour la CRÉATION d'un utilisateur
export const createUserSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Le mot de passe doit faire 6 caractères min"),
    role: z.nativeEnum(UserRole)
});

// 2. Schéma pour la MODIFICATION (Mot de passe optionnel)
export const updateUserSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(), // Optionnel : si vide, on ne change pas
    role: z.nativeEnum(UserRole).optional()
});

// Types TypeScript inférés
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;