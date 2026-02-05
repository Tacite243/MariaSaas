import React from 'react';
import { usePosLogic } from '../hooks/usePosLogic';
import { SearchBar } from './SearchBar';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';



const POS: React.FC = () => {
  const { state, actions } = usePosLogic();

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8 animate-in fade-in duration-500">

      {/* SECTION GAUCHE */}
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        {/* Search */}
        <SearchBar value={state.searchTerm} onChange={actions.setSearchTerm} />

        {/* Catalog */}
        <ProductGrid products={state.availableProducts} onAdd={actions.addToCart} />
      </div>

      {/* SECTION DROITE (Fixe) */}
      <div className="flex-none h-full">
        <CartPanel
          cart={state.cart}
          subTotal={state.subTotal}
          paymentMethod={state.paymentMethod}
          isLoading={state.isLoading}
          error={state.error}
          onRemove={actions.removeFromCart}
          onUpdateQty={actions.updateQuantity}
          onSetMethod={actions.setPaymentMethod}
          onCheckout={actions.checkout}
        />
      </div>
    </div>
  );
};

export default POS;
