// apps/web/src/store/catalogSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CatalogState {
  searchQuery: string;
  selectedCategory: string | null;
  minStockFilter: number | null;
  minPriceFilter: number | null;
  maxPriceFilter: number | null;
  selectedProductIds: string[];
  pagination: {
    page: number;
    pageSize: number;
  };
  sorting: {
    field: 'name' | 'price' | 'stock' | 'createdAt';
    direction: 'asc' | 'desc';
  };
  optimisticPrices: Record<string, number>;
}

const initialState: CatalogState = {
  searchQuery: '',
  selectedCategory: null,
  minStockFilter: null,
  minPriceFilter: null,
  maxPriceFilter: null,
  selectedProductIds: [],
  pagination: {
    page: 1,
    pageSize: 20,
  },
  sorting: {
    field: 'createdAt',
    direction: 'desc',
  },
  optimisticPrices: {},
};

export const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.pagination.page = 1;
    },
    setSelectedCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
      state.pagination.page = 1;
    },
    setMinStockFilter(state, action: PayloadAction<number | null>) {
      state.minStockFilter = action.payload;
      state.pagination.page = 1;
    },
    setPriceFilters(
      state,
      action: PayloadAction<{ min?: number | null; max?: number | null }>,
    ) {
      if (action.payload.min !== undefined) state.minPriceFilter = action.payload.min;
      if (action.payload.max !== undefined) state.maxPriceFilter = action.payload.max;
      state.pagination.page = 1;
    },
    toggleSelectProduct(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.selectedProductIds.includes(id)) {
        state.selectedProductIds = state.selectedProductIds.filter((p) => p !== id);
      } else {
        state.selectedProductIds.push(id);
      }
    },
    selectAllProducts(state, action: PayloadAction<string[]>) {
      state.selectedProductIds = action.payload;
    },
    clearSelection(state) {
      state.selectedProductIds = [];
    },
    setPagination(
      state,
      action: PayloadAction<{ page: number; pageSize?: number }>,
    ) {
      state.pagination.page = action.payload.page;
      if (action.payload.pageSize) {
        state.pagination.pageSize = action.payload.pageSize;
      }
    },
    setSorting(
      state,
      action: PayloadAction<{ field: CatalogState['sorting']['field']; direction: 'asc' | 'desc' }>,
    ) {
      state.sorting = action.payload;
    },
    applyOptimisticPrice(
      state,
      action: PayloadAction<{ productId: string; newPrice: number }>,
    ) {
      state.optimisticPrices[action.payload.productId] = action.payload.newPrice;
    },
    clearOptimisticPrices(state) {
      state.optimisticPrices = {};
    },
    resetFilters(state) {
      state.searchQuery = '';
      state.selectedCategory = null;
      state.minStockFilter = null;
      state.minPriceFilter = null;
      state.maxPriceFilter = null;
      state.pagination.page = 1;
    },
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setMinStockFilter,
  setPriceFilters,
  toggleSelectProduct,
  selectAllProducts,
  clearSelection,
  setPagination,
  setSorting,
  applyOptimisticPrice,
  clearOptimisticPrices,
  resetFilters,
} = catalogSlice.actions;

export default catalogSlice.reducer;
