import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QRCode from 'qrcode';
import { AppDispatch, RootState } from '@renderer/app/store/store';
import { fetchProducts } from '@renderer/app/store/slice/inventorySlice';
import { UIMedication } from '../features/inventory/types';

export const useInventoryLogic = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, isLoading } = useSelector((state: RootState) => state.inventory);
  const [enrichedMeds, setEnrichedMeds] = useState<UIMedication[]>([]);

  // Chargement
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Mapping et QR Codes
  useEffect(() => {
    const mapAndGenerate = async () => {
      // 1. Mapping Prisma -> UI
      const mapped: UIMedication[] = products.map(p => ({
        id: p.id,
        name: p.name,
        dci: p.dci || undefined, // Mapping
        code: p.code || 'N/A',
        codeCip7: p.codeCip7 || undefined, // Mapping
        codeAtc: p.codeAtc || undefined, // Mapping

        category: p.category || 'Générique',
        form: p.form || undefined, // Mapping
        dosage: p.dosage || 'N/A',
        packaging: p.packaging || undefined, // Mapping
        description: p.description || undefined,
        isPrescriptionRequired: p.isPrescriptionRequired || false,

        sellPrice: p.sellPrice,
        buyingPrice: p.buyingPrice,
        vatRate: p.vatRate || 0,

        minStock: p.minStock,
        maxStock: p.maxStock || undefined,
        currentStock: p.currentStock,
        location: p.location || undefined,

        lots: p.lots.map(l => ({ ...l, expiryDate: new Date(l.expiryDate).toISOString() })),
        qrCode: undefined
      }));

      // 2. Génération QR
      const enriched = await Promise.all(mapped.map(async (m) => {
        try {
          const qr = await QRCode.toDataURL(m.code || m.id);
          return { ...m, qrCode: qr };
        } catch { return m; }
      }));
      setEnrichedMeds(enriched);
    };

    if (products.length > 0 || !isLoading) {
      mapAndGenerate();
    }
  }, [products]);

  return { enrichedMeds, isLoading, dispatch };
};