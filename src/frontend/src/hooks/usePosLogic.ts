import { useState, useMemo, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@renderer/app/store/store'
import { fetchProducts } from '@renderer/app/store/slice/inventorySlice'
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  setPaymentMethod
} from '@renderer/app/store/slice/salesSlice'
import { setPaymentModalOpen, setPrescriptionModalOpen } from '@renderer/app/store/slice/posSlice'
import { ProductDTO } from '@shared/types'
import { buildCartItemFromProduct } from '@renderer/utils/cartItem'
import { createDraftSafeSelector } from '@reduxjs/toolkit'

const selectPosState = createDraftSafeSelector(
  [(s: RootState) => s.inventory.products, (s: RootState) => s.sales],
  (products, sales) => ({ products, ...sales })
)

export const usePosLogic = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { products, cart, paymentMethod, isLoading, error } = useSelector(selectPosState)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  const availableProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return products
      .filter((p) => p.currentStock > 0)
      .filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          (p.code && p.code.toLowerCase().includes(term))
      )
  }, [products, searchTerm])

  const subTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [cart]
  )

  const addToCartCb = useCallback(
    (product: ProductDTO) => dispatch(addToCart(buildCartItemFromProduct(product))),
    [dispatch]
  )

  const actions = {
    setSearchTerm,
    addToCart: addToCartCb,
    removeFromCart: useCallback((id: string) => dispatch(removeFromCart(id)), [dispatch]),
    updateQuantity: useCallback(
      (id: string, qty: number) => dispatch(updateQuantity({ id, qty })),
      [dispatch]
    ),
    setPaymentMethod: useCallback(
      (method: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'INSURANCE') =>
        dispatch(setPaymentMethod(method)),
      [dispatch]
    ),
    openPayment: useCallback(() => {
      const needsRx = cart.some(
        (i) => (i.isPrescriptionRequired || i.isNarcotic) && !i.prescription
      )
      if (needsRx) dispatch(setPrescriptionModalOpen(true))
      else dispatch(setPaymentModalOpen(true))
    }, [cart, dispatch]),
    checkout: useCallback(() => {
      const needsRx = cart.some(
        (i) => (i.isPrescriptionRequired || i.isNarcotic) && !i.prescription
      )
      if (needsRx) dispatch(setPrescriptionModalOpen(true))
      else dispatch(setPaymentModalOpen(true))
    }, [cart, dispatch])
  }

  return {
    state: { searchTerm, availableProducts, cart, paymentMethod, isLoading, error, subTotal },
    actions
  }
}
