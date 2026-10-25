// apps/web/src/components/storefront/MiniCartDrawer.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Truck,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { RootState } from '../../store';
import { updateQuantity, removeFromCart } from '../../store/cartSlice';
import { useAppTheme } from '../../contexts/ThemeContext';

interface MiniCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
  freeShippingThreshold?: number;
}

export const MiniCartDrawer: React.FC<MiniCartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  freeShippingThreshold = 1000,
}) => {
  const dispatch = useDispatch();
  const { theme } = useAppTheme();
  const primaryColor = theme?.primaryColor || '#0ea5e9';

  const { items, discountAmount } = useSelector((state: RootState) => state.cart);
  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const isFreeShippingUnlocked = remainingForFreeShipping === 0 && subtotal > 0;
  const estimatedShipping = isFreeShippingUnlocked || subtotal === 0 ? 0 : 45;
  const total = Math.max(0, subtotal - discountAmount + estimatedShipping);

  if (!isOpen) return null;

  return (
    <div dir="rtl" className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop blur overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 pr-4 sm:pr-0">
        <div className="w-screen max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: primaryColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  سلة المشتريات
                </h3>
                <span className="text-[11px] text-slate-400">
                  {totalCount} {totalCount === 1 ? 'منتج' : 'منتجات'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Free Shipping Threshold Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Truck className="w-4 h-4 text-emerald-500" />
                {isFreeShippingUnlocked ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مبروك! حصلت على شحن مجاني لكافة المحافظات
                  </span>
                ) : (
                  <span>
                    أضف{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {remainingForFreeShipping.toLocaleString()} ج.م
                    </strong>{' '}
                    للحصول على شحن مجاني
                  </span>
                )}
              </span>
              <span className="font-mono text-[10px] text-slate-400 font-normal">
                {freeShippingProgress}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${freeShippingProgress}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isFreeShippingUnlocked ? 'bg-emerald-500' : 'bg-sky-500'
                }`}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  سلتك فارغة حالياً
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  تصفح الكتالوج واختر أفضل الأجهزة الأصلية بأسعار حصرية.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ backgroundColor: primaryColor }}
                  className="px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-md hover:opacity-90"
                >
                  استكشف المنتجات الآن
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200'
                      }
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </h4>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 block mt-0.5">
                      {item.price.toLocaleString()} ج.م
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                id: item.id,
                                quantity: Math.max(1, item.quantity - 1),
                              })
                            )
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold px-2 text-slate-800 dark:text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                id: item.id,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="إزالة من السلة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>إجمالي المنتجات</span>
                  <span className="font-mono">{subtotal.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>مصاريف الشحن</span>
                  <span className="font-mono font-bold">
                    {estimatedShipping === 0 ? (
                      <span className="text-emerald-500">مجاناً ✓</span>
                    ) : (
                      `${estimatedShipping} ج.م`
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>خصم الكوبون</span>
                    <span className="font-mono">-{discountAmount.toLocaleString()} ج.م</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-black text-sm text-slate-900 dark:text-slate-100">
                  <span>المبلغ الإجمالي</span>
                  <span className="font-mono text-base">{total.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-3.5 px-4 rounded-full text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:opacity-95 transition-all"
              >
                <span>متابعة إتمام الطلب والدفع</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  دفع آمن 100%
                </span>
                <span>•</span>
                <span>بوسطة إكسبريس</span>
                <span>•</span>
                <span>الدفع عند الاستلام</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
