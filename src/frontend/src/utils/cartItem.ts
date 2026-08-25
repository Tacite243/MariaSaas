import { ProductDTO } from '@shared/types'
import { daysUntilExpiry, getFefoLot } from '@shared/utils/expiry'
import { CartItemUI } from '@renderer/app/store/slice/salesSlice'

export const buildCartItemFromProduct = (product: ProductDTO): Omit<CartItemUI, 'quantity'> & { quantity: number } => {
  const fefoLot = getFefoLot(product.lots ?? [])
  const fefoDays = fefoLot ? daysUntilExpiry(fefoLot.expiryDate) : null

  return {
    productId: product.id,
    name: product.name,
    code: product.code,
    quantity: 1,
    unitPrice: product.sellPrice,
    maxStock: product.currentStock,
    isPrescriptionRequired: product.isPrescriptionRequired,
    isNarcotic: product.isNarcotic ?? false,
    fefoExpiryDate: fefoLot?.expiryDate ?? null,
    fefoDaysUntilExpiry: fefoDays,
    prescription: null
  }
}
