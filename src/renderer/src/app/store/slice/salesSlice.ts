import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CreateSaleInput, CartItemInput } from '@shared/schemas/salesSchema';
import { RootState } from '../store';

// Type pour un article dans le panier (UI)
// On étend l'input standard pour ajouter des infos d'affichage (Nom, Stock max...)
export interface CartItemUI extends CartItemInput {
    name: string;
    code: string;
    maxStock: number; // Pour bloquer si on demande plus que dispo
}

export interface SalesState {
    cart: CartItemUI[];
    currentCustomer: string | null; // ID du client (optionnel pour l'instant)
    paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'INSURANCE';
    discount: number;
    isLoading: boolean;
    error: string | null;
    lastSaleId: string | null; // Pour imprimer le ticket après succès
}

const initialState: SalesState = {
    cart: [],
    currentCustomer: null,
    paymentMethod: 'CASH',
    discount: 0,
    isLoading: false,
    error: null,
    lastSaleId: null
};

// --- THUNK : VALIDER LA VENTE ---
export const processCheckout = createAsyncThunk(
    'sales/checkout',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const { cart, paymentMethod, discount, currentCustomer } = state.sales;
        const { user } = state.auth;

        if (!user) return rejectWithValue("Vendeur non identifié");
        if (cart.length === 0) return rejectWithValue("Panier vide");

        // Préparation du payload conforme au schéma Zod
        const payload: CreateSaleInput = {
            sellerId: user.id,
            clientId: currentCustomer || undefined,
            paymentMethod,
            discountAmount: discount,
            items: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }))
        };

        try {
            const response = await window.api.sales.create(payload);
            if (!response.success) throw new Error(response.error?.message);
            return response.data; // Renvoie l'objet Sale créé
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

const salesSlice = createSlice({
    name: 'sales',
    initialState,
    reducers: {
        // Ajouter au panier
        addToCart: (state, action: PayloadAction<CartItemUI>) => {
            const existing = state.cart.find(i => i.productId === action.payload.productId);
            if (existing) {
                // On incrémente si ça ne dépasse pas le stock
                if (existing.quantity < existing.maxStock) {
                    existing.quantity += 1;
                }
            } else {
                state.cart.push(action.payload);
            }
        },
        // Retirer du panier
        removeFromCart: (state, action: PayloadAction<string>) => {
            state.cart = state.cart.filter(i => i.productId !== action.payload);
        },
        // Changer quantité manuellement
        updateQuantity: (state, action: PayloadAction<{ id: string, qty: number }>) => {
            const item = state.cart.find(i => i.productId === action.payload.id);
            if (item) {
                // Borne entre 1 et MaxStock
                const validQty = Math.max(1, Math.min(action.payload.qty, item.maxStock));
                item.quantity = validQty;
            }
        },
        // Changer méthode paiement
        setPaymentMethod: (state, action: PayloadAction<SalesState['paymentMethod']>) => {
            state.paymentMethod = action.payload;
        },
        // Vider panier
        clearCart: (state) => {
            state.cart = [];
            state.error = null;
            state.lastSaleId = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(processCheckout.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(processCheckout.fulfilled, (state, action) => {
                state.isLoading = false;
                state.cart = []; // On vide le panier
                state.lastSaleId = action.payload.id; // Prêt à imprimer
            })
            .addCase(processCheckout.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    }
});

export const { addToCart, removeFromCart, updateQuantity, setPaymentMethod, clearCart } = salesSlice.actions;
export default salesSlice.reducer;