import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ProductInput, CreateRequisitionInput } from '@shared/schemas/inventorySchema'
import { ApiResponse, ProductDTO, RequisitionDTO, SupplierDTO } from '@shared/types'
import { CreateSupplierInput, UpdateSupplierInput } from '@shared/schemas/supplierSchema'
import { RootState } from '../store'


declare global {
  interface Window {
    api: {
      inventory: {
        getProducts: () => Promise<ApiResponse<ProductDTO[]>>
        createProduct: (data: ProductInput) => Promise<ApiResponse<ProductDTO>>
        updateProduct: (id: string, data: Partial<ProductInput>) => Promise<ApiResponse<ProductDTO>>
        deleteProduct: (id: string) => Promise<ApiResponse<void>>
        createDraft: (data: CreateRequisitionInput) => Promise<ApiResponse<RequisitionDTO>>
        validateRequisition: (id: string) => Promise<ApiResponse<RequisitionDTO>>
        getSuppliers: () => Promise<ApiResponse<SupplierDTO[]>>
        createSupplier: (data: CreateSupplierInput, role: string) => Promise<ApiResponse<SupplierDTO>>
        updateSupplier: (data: UpdateSupplierInput, role: string) => Promise<ApiResponse<SupplierDTO>>
        deleteSupplier: (id: string, role: string) => Promise<ApiResponse<void>>
      }
    }
  }
}

// Les types locaux utiles au composant
export interface Requisition {
  id: string
  reference: string
  status: 'DRAFT' | 'VALIDATED'
  supplierId: string
  createdById: string
  createdAt: string
  items: RequisitionItem[]
}

export interface RequisitionItem {
  id: string
  productId: string
  quantity: number
  buyPrice: number
  batchNumber: string
  expiryDate: string
  product: ProductDTO
}

export interface InventoryState {
  products: ProductDTO[]
  suppliers: SupplierDTO[]
  isLoading: boolean
  error: string | null
}

const initialState: InventoryState = {
  products: [],
  suppliers: [],
  isLoading: false,
  error: null
}

// ============================================================================
// ASYNC THUNKS (Ponts entre le Frontend et le Backend IPC)
// ============================================================================

// Charger les produits
export const fetchProducts = createAsyncThunk<ProductDTO[], void>(
  'inventory/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await window.api.inventory.getProducts()
      if (!response.success) throw new Error(response.error?.message || 'Erreur inconnue')
      return response.data as ProductDTO[]
    } catch (err: unknown) {
      const error = err as Error
      return rejectWithValue(error.message || 'Erreur lors du chargement des produits')
    }
  }
)

// Créer un produit
export const createProduct = createAsyncThunk<ProductDTO, ProductInput>(
  'inventory/createProduct',
  async (data, { rejectWithValue }) => {
    try {
      const response = await window.api.inventory.createProduct(data)
      if (!response.success) throw new Error(response.error?.message || 'Erreur création')
      return response.data as ProductDTO
    } catch (err: unknown) {
      const error = err as Error
      return rejectWithValue(error.message || 'Erreur lors de la création du produit')
    }
  }
)

// Mettre à jour un produit
export const updateProduct = createAsyncThunk<ProductDTO, { id: string, data: Partial<ProductInput> }>(
  'inventory/updateProduct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await window.api.inventory.updateProduct(id, data);
      if (!res.success) throw new Error(res.error?.message || 'Erreur lors de la mise à jour');
      return res.data as ProductDTO;
    } catch (err: unknown) {
      const error = err as Error
      return rejectWithValue(error.message);
    }
  }
);

// Supprimer un produit
export const deleteProduct = createAsyncThunk<string, string>(
  'inventory/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      const res = await window.api.inventory.deleteProduct(id);
      if (!res.success) throw new Error(res.error?.message || 'Erreur lors de la suppression');
      return id;
    } catch (err: unknown) {
      const error = err as Error
      return rejectWithValue(error.message);
    }
  }
);

// Créer un brouillon de réquisition (Entrée en stock)
export const createDraftRequisition = createAsyncThunk<Requisition, CreateRequisitionInput>(
  'inventory/createDraft',
  async (data, { rejectWithValue }) => {
    try {
      const response = await window.api.inventory.createDraft(data)
      if (!response.success) throw new Error(response.error?.message || 'Erreur création bon')
      return response.data as unknown as Requisition
    } catch (err: unknown) {
      const error = err as Error
      return rejectWithValue(error.message || 'Erreur lors de la création du brouillon de réquisition')
    }
  }
)

// Valider une réquisition
export const validateRequisition = createAsyncThunk<Requisition, string>(
  'inventory/validate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await window.api.inventory.validateRequisition(id)
      if (!response.success) throw new Error(response.error?.message || 'Erreur validation')
      return response.data as unknown as Requisition
    } catch (err: unknown) {
      const error = err as Error
      return rejectWithValue(error.message || 'Erreur lors de la validation du bon')
    }
  }
)

// --- THUNKS POUR FOURNISSEURS ---

export const fetchSuppliers = createAsyncThunk('inventory/fetchSuppliers', async () => {
  const res = await window.api.inventory.getSuppliers()
  return res.data as SupplierDTO[]
})

export const addSupplier = createAsyncThunk<SupplierDTO, CreateSupplierInput>(
  'inventory/addSupplier',
  async (data, { getState, rejectWithValue }) => {
    try {
      const role = (getState() as RootState).auth.user?.role
      if (!role) return rejectWithValue('Non authentifié')
      const res = await window.api.inventory.createSupplier(data, role)
      if (!res.success) throw new Error(res.error?.message)
      return res.data as SupplierDTO
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  }
)

export const editSupplier = createAsyncThunk<SupplierDTO, UpdateSupplierInput>(
  'inventory/editSupplier',
  async (data, { getState, rejectWithValue }) => {
    try {
      const role = (getState() as RootState).auth.user?.role
      if (!role) return rejectWithValue('Non authentifié')
      const res = await window.api.inventory.updateSupplier(data, role)
      if (!res.success) throw new Error(res.error?.message)
      return res.data as SupplierDTO
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  }
)

export const removeSupplier = createAsyncThunk<string, string>(
  'inventory/removeSupplier',
  async (id, { getState, rejectWithValue }) => {
    try {
      const role = (getState() as RootState).auth.user?.role
      if (!role) return rejectWithValue('Non authentifié')
      const res = await window.api.inventory.deleteSupplier(id, role)
      if (!res.success) throw new Error(res.error?.message)
      return id
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  }
)

// ============================================================================
// SLICE (Gestion de l'état local Redux)
// ============================================================================
const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Products ---
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<ProductDTO[]>) => {
        state.isLoading = false
        state.products = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // --- Create Product ---
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createProduct.fulfilled, (state, action: PayloadAction<ProductDTO>) => {
        state.isLoading = false
        state.products.unshift(action.payload) // unshift pour le mettre en haut de liste
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // --- Update Product ---
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<ProductDTO>) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          // Remplace l'ancien objet par le nouveau reçu du backend
          state.products[index] = action.payload;
        }
      })

      // --- Delete Product ---
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<string>) => {
        state.products = state.products.filter(p => p.id !== action.payload);
      })

      // --- Requisitions ---
      .addCase(createDraftRequisition.pending, (state) => {
        state.error = null
      })
      .addCase(createDraftRequisition.rejected, (state, action) => {
        state.error = action.payload as string
      })
      .addCase(validateRequisition.rejected, (state, action) => {
        state.error = action.payload as string
      })

      // --- Fournisseurs ---
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.suppliers = action.payload
      })
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.suppliers.push(action.payload)
      })
      .addCase(editSupplier.fulfilled, (state, action) => {
        const index = state.suppliers.findIndex((s) => s.id === action.payload.id)
        if (index !== -1) state.suppliers[index] = action.payload
      })
      .addCase(removeSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter((s) => s.id !== action.payload)
      })
  }
})

export const { clearError } = inventorySlice.actions
export default inventorySlice.reducer