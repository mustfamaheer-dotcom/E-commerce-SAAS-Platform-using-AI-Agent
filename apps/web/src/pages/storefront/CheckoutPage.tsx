// apps/web/src/pages/storefront/CheckoutPage.tsx
import React, { useState } from 'react';

const EGYPTIAN_CITIES = ['Cairo', 'Giza', 'Alexandria', 'Mansoura', 'Tanta', 'Assiut'];

export const CheckoutPage: React.FC = () => {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const isAr = language === 'ar';

  const [formData, setFormData] = useState({
    name: 'Ahmed Mostafa',
    email: 'ahmed.mostafa@example.eg',
    phone: '+201012345001',
    city: 'Cairo',
    address: '15 Tahrir Square, Downtown',
    paymentMethod: 'CARD' as 'CARD' | 'INSTAPAY' | 'FAWRY',
    promoCode: '',
  });

  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  const cartItems = [
    { id: 'prod_101', name: 'JBL Flip 6 Waterproof Speaker', price: 5000, quantity: 1 },
    { id: 'prod_105', name: 'Anker 65W GaN Fast Charger', price: 850, quantity: 1 },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = formData.city === 'Cairo' || formData.city === 'Giza' ? 45 : 65;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = async () => {
    if (!formData.promoCode.trim()) return;
    setIsCheckingPromo(true);
    setPromoMessage('');

    // Simulate discount check (e.g. 15% discount for demo)
    setTimeout(() => {
      const discount = Math.round(subtotal * 0.15);
      setDiscountAmount(discount);
      setPromoMessage(
        isAr ? `✅ تم تطبيق الكوبون بنجاح (خصم ${discount} ج.م)` : `✅ Promo applied successfully (-${discount} EGP)`
      );
      setIsCheckingPromo(false);
    }, 400);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setOrderComplete({
        orderId: `ord_eg_${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'PAID',
        shippingAwb: `BOSTA-AWB-${Math.floor(1000000 + Math.random() * 9000000)}`,
        paymentRef: `PAYMOB-${Math.floor(100000 + Math.random() * 900000)}`,
        total,
      });
      setIsSubmitting(false);
    }, 600);
  };

  if (orderComplete) {
    return (
      <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-xl mx-auto p-8 font-sans">
        <div className="bg-white border border-emerald-200 rounded-2xl shadow-sm p-6 text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isAr ? 'تم تأكيد طلبك بنجاح!' : 'Order Placed Successfully!'}
          </h2>
          <p className="text-sm text-slate-600">
            {isAr
              ? `رقم الطلب: ${orderComplete.orderId} | بوابة الدفع Paymob: ${orderComplete.paymentRef}`
              : `Order ID: ${orderComplete.orderId} | Paymob Ref: ${orderComplete.paymentRef}`}
          </p>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-900 space-y-1">
            <div className="font-semibold">{isAr ? 'الشحن عبر بوسطة (Bosta):' : 'Bosta Shipping Waybill:'}</div>
            <div className="font-mono text-base font-bold text-emerald-700">{orderComplete.shippingAwb}</div>
            <div className="text-xs text-emerald-600">
              {isAr ? 'التوصيل خلال 24 ساعة في القاهرة الكبرى' : 'Estimated 24-hour delivery in Greater Cairo'}
            </div>
          </div>

          <div className="text-lg font-bold text-slate-900 pt-2">
            {isAr ? `الإجمالي المدفوع: ${orderComplete.total.toLocaleString()} ج.م` : `Total Paid: ${orderComplete.total.toLocaleString()} EGP`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto p-6 font-sans">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAr ? 'إتمام الشراء والدفع الآمن' : 'Checkout & Secure Payment'}
          </h1>
          <p className="text-sm text-slate-500">
            {isAr ? 'بوابات دفع مصرية معتمدة (Paymob / Fawry / InstaPay)' : 'Certified Egyptian Payment Gateways'}
          </p>
        </div>
        <button
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          {isAr ? 'English' : 'عربي'}
        </button>
      </div>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
        {/* Customer & Shipping Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">{isAr ? 'بيانات الشحن والتوصيل' : 'Shipping Address'}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{isAr ? 'الاسم' : 'Name'}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{isAr ? 'المحافظة' : 'Governorate'}</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {EGYPTIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{isAr ? 'العنوان بالتفصيل' : 'Street Address'}</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">{isAr ? 'طريقة الدفع' : 'Payment Method'}</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'CARD', label_ar: 'بطاقة بنكية (Paymob)', label_en: 'Card (Paymob)' },
                { id: 'INSTAPAY', label_ar: 'إنستاباي (InstaPay)', label_en: 'InstaPay' },
                { id: 'FAWRY', label_ar: 'فوري (Fawry)', label_en: 'Fawry Code' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: m.id as any })}
                  className={`p-3 rounded-lg border text-xs font-medium transition-all text-center ${
                    formData.paymentMethod === m.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {isAr ? m.label_ar : m.label_en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Coupon */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">{isAr ? 'ملخص الطلب' : 'Order Summary'}</h3>

            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              {cartItems.map((item) => (
                <div key={item.id} className="pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-500 block">x{item.quantity}</span>
                  </div>
                  <span className="font-medium text-slate-900">{item.price.toLocaleString()} ج.م</span>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-medium text-slate-600">{isAr ? 'كوبون الخصم' : 'Promo Code'}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WINBACK15"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                  className="flex-1 text-xs p-2 border border-slate-300 rounded-lg uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={isCheckingPromo}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
                >
                  {isCheckingPromo ? '...' : isAr ? 'تطبيق' : 'Apply'}
                </button>
              </div>
              {promoMessage && <p className="text-xs text-emerald-600 font-medium">{promoMessage}</p>}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span>{subtotal.toLocaleString()} EGP</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>{isAr ? 'الخصم المطبق:' : 'Discount:'}</span>
                  <span>-{discountAmount.toLocaleString()} EGP</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? 'مصاريف الشحن (بوسطة):' : 'Bosta Shipping:'}</span>
                <span>{shippingFee} EGP</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>{isAr ? 'الإجمالي النهائي:' : 'Total:'}</span>
                <span>{total.toLocaleString()} EGP</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
            >
              {isSubmitting ? (isAr ? 'جاري المعالجة...' : 'Processing...') : isAr ? 'دفع وتأكيد الطلب' : 'Pay & Confirm Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
