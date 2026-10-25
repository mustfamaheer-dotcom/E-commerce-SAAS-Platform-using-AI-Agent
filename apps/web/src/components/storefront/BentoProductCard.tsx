// apps/web/src/components/storefront/BentoProductCard.tsx
import React, { useState } from 'react';
import {
  Heart,
  ShoppingCart,
  Star,
  Check,
  Zap,
} from 'lucide-react';
import { useAppTheme } from '../../contexts/ThemeContext';

interface BentoProductCardProps {
  product: any;
  onSelect: (p: any) => void;
  onAddToCart: (e: React.MouseEvent, p: any) => void;
  isWishlisted: boolean;
  onToggleWishlist: (e: React.MouseEvent, p: any) => void;
}

export const BentoProductCard: React.FC<BentoProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const { theme } = useAppTheme();
  const primaryColor = theme?.primaryColor || '#0ea5e9';
  const [isJustAdded, setIsJustAdded] = useState(false);

  const pName = product.name || product.name_ar || product.name_en || 'منتج إلكتروني';
  const pPrice = Number(product.price) || 0;
  const pCompPrice =
    product.compare_price || product.comparePrice
      ? Number(product.compare_price || product.comparePrice)
      : null;
  const pStock = Number(product.stock_qty ?? product.stock ?? 20);
  const hasDiscount = pCompPrice && pCompPrice > pPrice;
  const discountPct = hasDiscount
    ? Math.round(((pCompPrice - pPrice) / pCompPrice) * 100)
    : 0;

  const handleAddClick = (e: React.MouseEvent) => {
    setIsJustAdded(true);
    onAddToCart(e, product);
    setTimeout(() => setIsJustAdded(false), 900);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50/80 dark:bg-slate-950/80 mb-3.5 flex items-center justify-center border border-slate-100 dark:border-slate-800/60">
        <img
          src={
            product.images?.[0] ||
            'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400'
          }
          alt={pName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] shadow-sm select-none">
            خصم {discountPct}%
          </span>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => onToggleWishlist(e, product)}
          className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
          title="إضافة للمفضلة"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Stock Alert Badge */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          {pStock <= 5 && pStock > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/95 text-white font-bold text-[9px] backdrop-blur-xs shadow-xs">
              متبقي {pStock} فقط
            </span>
          ) : pStock === 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-800/90 text-white font-bold text-[9px]">
              نفد المخزون
            </span>
          ) : null}
        </div>
      </div>

      {/* Details & Metadata */}
      <div className="space-y-2 flex-1 flex flex-col justify-between text-right">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold mb-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-mono">4.9</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-normal mr-1">(تقييم معتمد)</span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-2 leading-relaxed">
            {pName}
          </h3>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span
                style={{ color: primaryColor }}
                className="font-mono font-black text-sm sm:text-base"
              >
                {pPrice.toLocaleString()} ج.م
              </span>
              {hasDiscount && (
                <span className="font-mono text-[10px] text-slate-400 line-through">
                  {pCompPrice?.toLocaleString()} ج.م
                </span>
              )}
            </div>
            {product.sku && (
              <span className="text-[9px] text-slate-400 font-mono uppercase">
                {product.sku}
              </span>
            )}
          </div>

          {/* Quick Add Pill Button with Interactive Feedback */}
          <button
            type="button"
            disabled={pStock === 0}
            onClick={handleAddClick}
            style={
              pStock > 0
                ? isJustAdded
                  ? { backgroundColor: '#10b981' }
                  : { backgroundColor: primaryColor }
                : {}
            }
            className={`w-full py-2.5 px-3 rounded-full text-white font-bold text-xs transition-all duration-300 hover:shadow-md disabled:opacity-30 disabled:bg-slate-400 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
              isJustAdded ? 'animate-button-pulse scale-95 shadow-emerald-500/30' : 'hover:scale-[1.01]'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-3.5 h-3.5 animate-bounce" />
                <span>تمت الإضافة</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{pStock === 0 ? 'غير متوفر' : 'أضف للسلة'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
