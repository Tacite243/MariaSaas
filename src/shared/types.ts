export enum UserRole {
    SUPERADMIN = 'SUPERADMIN',
    ADMIN = 'ADMIN',
    PHARMACIST = 'PHARMACIST'
}

export enum RequisitionStatus {
    DRAFT = 'DRAFT',
    VALIDATED = 'VALIDATED',
    CANCELLED = 'CANCELLED'
}

export enum CashMovementType {
    IN = 'IN',   // Entrée
    OUT = 'OUT'  // Sortie
}

export enum CashCategory {
    SALE = 'VENTE',
    EXPENSE = 'DEPENSE_DIVERSE',
    SUPPLY = 'ACHAT_STOCK',
    DEBT_PAYMENT = 'RECOUVREMENT',
    ADJUSTMENT = 'AJUSTEMENT',
    DONATION = 'DON',
    REINVESTMENT = 'REINVESTISSEMENT',
    TAX = 'TAXES_IMPOTS',
    RESTORATION = 'RESTAURATION',
    RENT = 'LOYER',
    LOSS_THEFT = 'PERTE_VOL',
    SALARY = 'SALAIRE',
    OTHER = 'AUTRE'
}

export interface CreateMovementInput {
    type: CashMovementType;
    category: CashCategory;
    amount: number;
    description?: string;
    performedById: string;
}

export interface CashJournalEntry {
    id: string;
    timestamp: Date;
    type: CashMovementType;
    category: CashCategory;
    amount: number;
    reference: string;
    description: string;
    performedBy: string;
    isManual: boolean;
}