export interface UILot {
    id: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    receivedDate: string;
}

export interface UIMedication {
    id: string;
    name: string;
    code: string;
    category: string;
    dosage: string;
    price: number;
    buyingPrice: number;
    threshold: number;
    currentStock: number; // Stock calculé ou direct
    lots: UILot[];
    qrCode?: string;
}

export const CATEGORIES = ['Tous', 'Analgésique', 'Antibiotique', 'Anti-inflammatoire', 'Supplément', 'Générique'];