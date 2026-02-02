import { ipcMain } from 'electron';
import { inventoryService } from '../services/inventoryService';
import { procedure } from '../lib/procedure';
import { productSchema, createRequisitionSchema } from '../../shared/schemas/inventorySchema';

export function setupInventoryHandlers() {

    // Nettoyage
    ipcMain.removeHandler('inventory:get-products');
    ipcMain.removeHandler('inventory:create-product');
    ipcMain.removeHandler('inventory:get-suppliers');
    ipcMain.removeHandler('inventory:create-supplier');
    ipcMain.removeHandler('inventory:create-draft');
    ipcMain.removeHandler('inventory:validate');
    ipcMain.removeHandler('inventory:get-requisitions');

    // Produits
    ipcMain.handle('inventory:get-products', async () => {
        const data = await inventoryService.getAllProducts();
        return { success: true, data };
    });

    ipcMain.handle('inventory:create-product', procedure.input(productSchema).mutation(async (input) => {
        return await inventoryService.createProduct(input);
    }));

    // Fournisseurs
    ipcMain.handle('inventory:get-suppliers', async () => {
        const data = await inventoryService.getAllSuppliers();
        return { success: true, data };
    });

    // Réquisitions
    ipcMain.handle('inventory:create-draft', procedure.input(createRequisitionSchema).mutation(async (input) => {
        return await inventoryService.createDraftRequisition(input);
    }));

    ipcMain.handle('inventory:validate', async (_event, requisitionId: string) => {
        try {
            const result = await inventoryService.validateRequisition(requisitionId);
            return { success: true, data: result };
        } catch (e: any) {
            return { success: false, error: { message: e.message } };
        }
    });

    ipcMain.handle('inventory:get-requisitions', async () => {
        const data = await inventoryService.getRequisitions();
        return { success: true, data };
    });
}