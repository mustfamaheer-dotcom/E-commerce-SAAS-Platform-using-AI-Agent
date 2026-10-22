// apps/web/src/pages/dashboard/StoreSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { LogoUploader } from '../../components/LogoUploader';

export const StoreSettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('Moustafa Tech');
  const [currency, setCurrency] = useState('EGP');
  const [email, setEmail] = useState('owner@moustafatech.eg');
  const [phone, setPhone] = useState('+20 100 123 4567');
  const [carrierRate, setCarrierRate] = useState('45');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/v1/stores/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant?.name) setStoreName(data.tenant.name);
        if (data.settings?.contactEmail) setEmail(data.settings.contactEmail);
        if (data.settings?.contactPhone) setPhone(data.settings.contactPhone);
        if (data.settings?.shippingZones?.default_rate) {
          setCarrierRate(String(data.settings.shippingZones.default_rate));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    try {
      await fetch('http://127.0.0.1:8001/api/v1/stores/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          contact_email: email,
          contact_phone: phone,
          shipping_zones: { default_rate: parseFloat(carrierRate) || 45, carrier: 'Bosta Express' },
        }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6 font-sans text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>إعدادات المتجر والهوية البصرية (Store Settings)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تخصيص بيانات المتجر، شعار العلامة التجارية، بوابات الدفع وشحن بوسطة
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>تم حفظ وتحديث إعدادات المتجر بنجاح!</span>
        </div>
      )}

      {/* AI Logo & Brand Theme Generator */}
      <LogoUploader />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Store Info */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
            البيانات الأساسية للمتجر
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">اسم المتجر التجاري</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">العملة الافتراضية</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">بريد خدمة العملاء</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">هاتف / واتساب المتجر</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Gateways */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-500" />
            <span>إعدادات الشحن اللوجستي (Bosta Express)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">سعر الشحن الافتراضي (ج.م)</label>
              <input
                type="number"
                value={carrierRate}
                onChange={(e) => setCarrierRate(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">شركة الشحن المعتمدة</label>
              <input
                type="text"
                disabled
                value="بوسطة (Bosta Logistics) — تكامل API مباشر"
                className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات الآن'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
