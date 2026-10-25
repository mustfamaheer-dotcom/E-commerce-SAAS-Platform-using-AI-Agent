// apps/web/src/pages/storefront/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { clearCart } from '../../store/cartSlice';
import { CheckCircle2, CreditCard, Truck, ShieldCheck, Tag, ArrowRight, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

const EGYPTIAN_CITIES = ['Cairo', 'Giza', 'Alexandria', 'Mansoura', 'Tanta', 'Assiut', 'Suez', 'Ismailia'];

interface CheckoutPageProps {
  tenantId?: string;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ tenantId }) => {
  const dispatch = useDispatch();
  const activeTenantId = tenantId || localStorage.getItem('techzone_active_store_id') || 'tenant-moustafa-tech';

  const { items: cartItems, discountAmount: initialDiscount, promoCode: initialCode } = useSelector(
    (state: RootState) => state.cart
  );

  const [formData, setFormData] = useState({
    name: 'محمد الشناوي',
    email: 'mohamed.shennawy@gmail.com',
    phone: '+20 100 123 4567',
    city: 'Cairo',
    address: 'شارع 9، المعادي، القاهرة',
    paymentMethod: 'COD' as 'CARD' | 'INSTAPAY' | 'FAWRY' | 'COD',
    promoCode: initialCode || '',
  });

  const [paymentGateways, setPaymentGateways] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(initialDiscount);
  const [promoMessage, setPromoMessage] = useState('');
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  // Load store settings to inspect enabled payment methods
  useEffect(() => {
    fetch(`${API_BASE_URL}/stores/me?tenant_id=${activeTenantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.paymentGateways) {
          const gws = data.settings.paymentGateways;
          setPaymentGateways(gws);
          const isEnabled = (k: string) => {
            const v = gws[k] ?? gws[k.toLowerCase()];
            if (v === undefined) return false;
            if (typeof v === 'boolean') return v;
            return Boolean(v?.enabled);
          };
          if (!isEnabled('paymob') && !isEnabled('instapay') && !isEnabled('fawry') && isEnabled('cod')) {
            setFormData((prev) => ({ ...prev, paymentMethod: 'COD' }));
          } else if (isEnabled('paymob')) {
            setFormData((prev) => ({ ...prev, paymentMethod: 'CARD' }));
          }
        }
      })
      .catch(() => {});
  }, [activeTenantId]);

  const isGatewayEnabled = (key: string) => {
    if (!paymentGateways) return true;
    if (Object.keys(paymentGateways).length === 0) return true;
    const val = paymentGateways[key] ?? paymentGateways[key.toLowerCase()];
    if (val === undefined) return false;
    if (typeof val === 'boolean') return val;
    return Boolean(val?.enabled);
  };

  const allGateways = [
    { id: 'CARD' as const, key: 'paymob', name: 'Paymob', sub: 'فيزا / ميزة' },
    { id: 'INSTAPAY' as const, key: 'instapay', name: 'InstaPay', sub: 'تحويل فوري' },
    { id: 'FAWRY' as const, key: 'fawry', name: 'Fawry', sub: 'كود دفع فوري' },
    { id: 'COD' as const, key: 'cod', name: 'عند الاستلام', sub: 'دفع كاش (COD)' },
  ];

  const availableGateways = allGateways.filter((g) => isGatewayEnabled(g.key));
  const renderedGateways = availableGateways.length > 0 ? availableGateways : [allGateways[3]];

  // Fallback items if cart is empty
  const activeItems =
    cartItems.length > 0
      ? cartItems
      : [
          { id: 'prod_101', name: 'سماعة سبيكر JBL Flip 6 مقاومة للماء', price: 5000, quantity: 1 },
        ];

  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = formData.city === 'Cairo' || formData.city === 'Giza' ? 45 : 65;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = async () => {
    if (!formData.promoCode.trim()) return;
    setIsCheckingPromo(true);
    setPromoMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.promoCode, subtotal, tenant_id: activeTenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'كود غير صالح');

      setDiscountAmount(data.discountAmount);
      setPromoMessage(data.message);
    } catch (err: any) {
      setPromoMessage(err.message || 'الكوبون غير صالح');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        tenant_id: activeTenantId,
        items: activeItems,
        shipping_address: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          address: formData.address,
        },
        payment_method: formData.paymentMethod,
        promo_code: formData.promoCode,
      };

      const res = await fetch(`${API_BASE_URL}/orders?tenant_id=${activeTenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': activeTenantId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error('فشل إتمام الطلب');

      window.dispatchEvent(
        new CustomEvent('techzone:order-created', {
          detail: { orderId: data.orderId, tenantId: activeTenantId },
        })
      );

      setOrderComplete({
        orderId: data.orderId,
        shippingAwb: data.shippingAwb,
        paymentRef: data.paymentRef,
        total: data.total,
      });

      dispatch(clearCart());
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تنفيذ الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div dir="rtl" className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            تم تسجيل طلبك بنجاح! 🎉
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            شكراً لثقتك بنا. تم إرسال رسالة تأكيد بتفاصيل الشحنة عبر البريد والواتساب.
          </p>
        </div>

        {/* Order Details Ticket */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-right space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">رقم الطلب:</span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{orderComplete.orderId}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">بوليصة شحن بوسطة:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{orderComplete.shippingAwb}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">طريقة الدفع المختارة:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.paymentMethod}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-bold pt-1">
            <span className="text-slate-900 dark:text-slate-100">المبلغ الإجمالي المطلوب:</span>
            <span className="font-mono text-base text-slate-900 dark:text-slate-100">{orderComplete.total.toLocaleString()} ج.م</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-xs"
          >
            العودة للمتجر والتسوق مجدداً
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <span>إتمام الطلب والشحن (Secure Checkout)</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          دفع آمن بالجنيه المصري وشحن سريع عبر بوسطة (Bosta Express) لكافة محافظات مصر
        </p>
      </div>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Shipping Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>عنوان الاستلام ومعلومات التواصل</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد الشناوي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">المحافظة / المدينة</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  {EGYPTIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.eg"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  placeholder="+20 10X XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">العنوان التفصيلي</label>
              <input
                type="text"
                required
                placeholder="الشارع، رقم المبنى، الحي"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>اختر وسيلة الدفع المتاحة</span>
            </h3>

            <div className={`grid grid-cols-2 ${renderedGateways.length >= 3 ? 'sm:grid-cols-4' : 'sm:grid-cols-2'} gap-2.5`}>
              {renderedGateways.map((gw) => (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: gw.id })}
                  className={`p-3 rounded-xl border text-right transition-colors ${
                    formData.paymentMethod === gw.id
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-slate-100 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-200">{gw.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{gw.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Coupon */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs pb-3 border-b border-slate-200 dark:border-slate-800">
              ملخص الطلب ({activeItems.length} منتجات)
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {activeItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-slate-400">الكمية: {item.quantity}</p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {(item.price * item.quantity).toLocaleString()} ج.م
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">كوبون الخصم</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PROMO20"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                  className="flex-1 text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={isCheckingPromo || !formData.promoCode}
                  className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 disabled:opacity-50"
                >
                  {isCheckingPromo ? 'فحص...' : 'تطبيق'}
                </button>
              </div>
              {promoMessage && (
                <p className={`text-[10px] ${discountAmount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{subtotal.toLocaleString()} ج.م</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>قيمة الخصم:</span>
                  <span className="font-mono">-{discountAmount.toLocaleString()} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>مصاريف الشحن (بوسطة):</span>
                <span className="font-mono">{shippingFee} ج.م</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-base">{total.toLocaleString()} ج.م</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'جاري تأكيد وتسجيل الطلب...' : `تأكيد الطلب بمبلغ ${total.toLocaleString()} ج.م`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
