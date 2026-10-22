// apps/web/src/store/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

interface CartState {
  items: CartItem[];
  discountAmount: number;
  promoCode: string | null;
}

const initialState: CartState = {
  items: [
    {
      id: 'prod_101',
      name: 'سماعة سبيكر JBL Flip 6 مقاومة للماء',
      price: 5000,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80',
      sku: 'SPK-JBL-01',
    },
    {
      id: 'prod_104',
      name: 'شاحن أنكر 65 واط GaN سريع 3 منافذ',
      price: 1450,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
      sku: 'CHG-ANK-65W',
    },
  ],
  discountAmount: 0,
  promoCode: null,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        existing.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        existing.quantity = Math.max(1, action.payload.quantity);
      }
    },
    applyDiscount: (state, action: PayloadAction<{ code: string; amount: number }>) => {
      state.promoCode = action.payload.code;
      state.discountAmount = action.payload.amount;
    },
    clearCart: (state) => {
      state.items = [];
      state.discountAmount = 0;
      state.promoCode = null;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, applyDiscount, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
