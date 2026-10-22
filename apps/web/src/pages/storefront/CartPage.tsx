// apps/web/src/pages/storefront/CartPage.tsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeFromCart, updateQuantity, applyDiscount } from '../../store/cartSlice';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  Tag,
  ShieldCheck,
  Truck,
  Check,
} from 'lucide-react';

interface CartPageProps {
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const dispatch = useDispatch();
  const { items, discountAmount, promoCode } = useSelector((state: RootState) => state.cart);

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingFee = subtotal > 0 ? 45 : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async () => {
    if (!inputCoupon.trim()) return;
    setIsValidating(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await fetch('http://127.0.0.1:8001/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inputCoupon, subtotal }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'الكوبون غير صالح');
      }

      dispatch(applyDiscount({ code: data.code, amount: data.discountAmount }));
      setCouponSuccess(data.message);
    } catch (err: any) {
      setCouponError(err.message || 'فشل تطبيق الكوبون');
    } finally {
      setIsValidating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div dir="rtl" className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">سلة التسوق فارغة</h2>
        <p className="text-xs text-slate-500">لم تقم بإضافة أي منتجات للسلة بعد.</p>
        <button
          onClick={onContinueShopping}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors inline-flex items-center gap-2"
        >
          <span>تصفح المنتجات الآن</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-sky-500" />
        <span>سلة المشتريات ({items.length} منتجات)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200'}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                      {item.name}
                    </h3>
                    <div className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1">
                      {item.price.toLocaleString()} ج.م
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                      }
                      className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
                      }
                      className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    title="حذف من السلة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onContinueShopping}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1.5"
          >
            <span>العودة لإضافة منتجات أخرى للمتجر</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
              ملخص الطلب
            </h3>

            {/* Coupon Box */}
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="كود الخصم (WELCOME10 أو SAVE20)"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 uppercase font-mono"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isValidating || !inputCoupon.trim()}
                  className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs disabled:opacity-50 transition-colors"
                >
                  {isValidating ? '...' : 'تطبيق'}
                </button>
              </div>

              {couponSuccess && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{couponSuccess}</span>
                </div>
              )}
              {couponError && (
                <div className="text-[11px] text-rose-500 font-semibold">{couponError}</div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>إجمالي المنتجات:</span>
                <span className="font-mono font-semibold">{subtotal.toLocaleString()} ج.م</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>قيمة الخصم ({promoCode}):</span>
                  <span className="font-mono">-{discountAmount.toLocaleString()} ج.م</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>الشحن عبر بوسطة (Bosta):</span>
                <span className="font-mono font-semibold">{shippingFee.toLocaleString()} ج.م</span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-slate-100 pt-3 border-t border-slate-200 dark:border-slate-800">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-sky-600 dark:text-sky-400">
                  {total.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={onProceedToCheckout}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>متابعة الشراء والدفع الآمن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
