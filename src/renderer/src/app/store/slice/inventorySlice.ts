import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProductInput } from '@shared/schemas/inventorySchema';

// Type qui matche ton Schema Prisma mis à jour
export interface ProductLot {
    id: string;
    batchNumber: string;
    expiryDate: string; // Serialisé en string par Electron
    quantity: number;
    receivedDate: string;
}

export interface Product {
    id: string;
    name: string;
    code: string;
    category: string;
    dosage: string;
    currentStock: number;
    minStock: number;
    sellPrice: number;
    buyingPrice: number;
    lots: ProductLot[]; // Relation incluse
}

export interface InventoryState {
    products: Product[];
    isLoading: boolean;
    error: string | null;
}

const initialState: InventoryState = {
    products: [],
    isLoading: false,
    error: null,
};

// --- ASYNC THUNKS (Appels IPC) ---

// 1. Charger les produits
export const fetchProducts = createAsyncThunk<Product[], void>(
    'inventory/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await window.api.inventory.getProducts();
            if (!response.success) throw new Error(response.error?.message);

            // On force le cast car on sait que le backend renvoie la bonne structure
            // (Assure-toi que le backend renvoie bien des objets complets)
            return response.data as Product[];
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

// 2. Créer un produit
export const createProduct = createAsyncThunk<Product, ProductInput>(
    'inventory/createProduct',
    async (data, { rejectWithValue }) => {
        try {
            const response = await window.api.inventory.createProduct(data);
            if (!response.success) throw new Error(response.error?.message);
            return response.data as Product;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

// --- SLICE ---
const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Products
            .addCase(fetchProducts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
                state.isLoading = false;
                state.products = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Create Product (Optimistic update ou re-fetch)
            .addCase(createProduct.fulfilled, (state, action: PayloadAction<Product>) => {
                state.products.push(action.payload); // Ajout immédiat à la liste
            });
    },
});

export default inventorySlice.reducer;
