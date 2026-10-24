// apps/web/src/components/gen-ui/ProductRecommendationCard.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ShoppingCart, Check, Eye, AlertCircle, Sparkles, Tag } from 'lucide-react';
import { addToCart } from '../../store/cartSlice';

export interface ProductItem {
  id: string;
  name_ar?: string;
  name_en?: string;
  name?: string;
  price: number;
  compare_price?: number;
  sku?: string;
  stock_qty?: number;
  is_in_stock?: boolean;
  image_url?: string;
}

export interface ProductRecommendationPayload {
  title?: string;
  total_found?: number;
  products?: ProductItem[];
  onSelectProduct?: (product: ProductItem) => void;
}

export const ProductRecommendationCard: React.FC<{ data: ProductRecommendationPayload }> = ({ data }) => {
  const dispatch = useDispatch();
  const products = data.products || [];
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleAdd = (p: ProductItem) => {
    const productName = p.name_ar || p.name || p.name_en || 'منتج إلكتروني';
    dispatch(
      addToCart({
        id: p.id,
        name: productName,
        price: p.price,
        quantity: 1,
        image: p.image_url,
        sku: p.sku,
      })
    );

    setAddedIds((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  if (products.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>عذراً، لم نعثر على منتجات تطابق بحثك حالياً. جرب البحث بكلمات بديلة.</span>
      </div>
    );
  }

  return (
    <div dir="rtl" className="my-2 space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>{data.title || 'المنتجات المقترحة من الكتالوج'}</span>
        </div>
        {products.length > 0 && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {products.length} {products.length === 1 ? 'منتج' : 'منتجات'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {products.map((p) => {
          const title = p.name_ar || p.name || p.name_en || 'منتج';
          const isAdded = !!addedIds[p.id];
          const hasDiscount = p.compare_price && p.compare_price > p.price;
          const discountPercent = hasDiscount
            ? Math.round(((p.compare_price! - p.price) / p.compare_price!) * 100)
            : 0;
          const isLowStock = p.stock_qty !== undefined && p.stock_qty > 0 && p.stock_qty <= 5;
          const isOutOfStock = p.stock_qty === 0 || p.is_in_stock === false;

          return (
            <div
              key={p.id}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 hover:border-sky-400/80 dark:hover:border-sky-500/80 transition-all duration-200 shadow-2xs hover:shadow-sm flex flex-col justify-between"
            >
              {/* Product Header & Image */}
              <div>
                <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-2.5 flex items-center justify-center">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-[10px] gap-1">
                      <Tag className="w-6 h-6 opacity-40" />
                      <span>صورة المنتج</span>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {hasDiscount && (
                    <span className="absolute top-2 right-2 text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-lg shadow-2xs">
                      خصم {discountPercent}%
                    </span>
                  )}

                  {/* Stock Badge */}
                  <span
                    className={`absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md shadow-2xs ${
                      isOutOfStock
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : isLowStock
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {isOutOfStock
                      ? 'نفد المخزون'
                      : isLowStock
                      ? `باقي ${p.stock_qty} قطع فقط!`
                      : 'متوفر فورياً'}
                  </span>
                </div>

                {/* Title & SKU */}
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed mb-1">
                  {title}
                </h4>

                {p.sku && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-2">
                    كود: {p.sku}
                  </p>
                )}
              </div>

              {/* Pricing & CTA */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                <div>
                  <div className="font-extrabold text-sm text-sky-600 dark:text-sky-400 font-mono leading-none">
                    {p.price.toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
                  </div>
                  {hasDiscount && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 line-through font-mono mt-0.5">
                      {p.compare_price?.toLocaleString()} ج.م
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(p)}
                  disabled={isOutOfStock}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-2xs ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : isOutOfStock
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-500 text-white active:scale-95'
                  }`}
                  aria-label={`إضافة ${title} إلى السلة`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>أُضيف بالسلة</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>غير متاح</span>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
