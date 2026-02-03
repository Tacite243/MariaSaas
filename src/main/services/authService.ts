import { prisma } from '../lib/prisma';
import { LoginInput } from '../../shared/schemas/authSchema';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';

export class AuthService {
    // COMMAND: Login (Write/Compute logic)
    async login(credentials: LoginInput): Promise<Omit<User, 'password'>> {
        // 1. Chercher l'utilisateur (Offline-First : DB locale)
        const user = await prisma.user.findUnique({
            where: { email: credentials.email }
        });

        if (!user) {
            throw new Error('Email ou mot de passe incorrect');
        }

        // 2. Vérifier le mot de passe
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
            throw new Error('Email ou mot de passe incorrect');
        }

        // 3. Mettre à jour la date de connexion (Side effect)
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // 4. Retourner l'utilisateur sans le hash (DTO)
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // COMMAND: Seed Initial (Pour créer le premier admin au premier lancement)
    async ensureSuperAdminExists() {
        const count = await prisma.user.count();
        const supplierCount = await prisma.supplier.count();

        if (supplierCount === 0) {
            await prisma.supplier.create({
                data: {
                    name: 'Fournisseur Divers',
                    email: 'contact@divers.com',
                    phone: '0000000000',
                    address: 'Adresse par défaut'
                }
            })
        }
        if (count === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await prisma.user.create({
                data: {
                    email: 'admin@mariasaas.com',
                    password: hashedPassword,
                    name: 'Super Admin',
                    role: 'SUPERADMIN'
                }
            });
            console.log('⚡ SuperAdmin par défaut créé');
        }
    }
}

export const authService = new AuthService();