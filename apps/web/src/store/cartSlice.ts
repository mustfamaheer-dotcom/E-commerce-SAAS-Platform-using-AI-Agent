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

const CART_STORAGE_KEY = 'techzone_cart_items';

const loadSavedCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

const initialState: CartState = {
  items: loadSavedCart(),
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
      saveCart(state.items);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveCart(state.items);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        existing.quantity = Math.max(1, action.payload.quantity);
      }
      saveCart(state.items);
    },
    applyDiscount: (state, action: PayloadAction<{ code: string; amount: number }>) => {
      state.promoCode = action.payload.code;
      state.discountAmount = action.payload.amount;
    },
    clearCart: (state) => {
      state.items = [];
      state.discountAmount = 0;
      state.promoCode = null;
      saveCart([]);
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, applyDiscount, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
