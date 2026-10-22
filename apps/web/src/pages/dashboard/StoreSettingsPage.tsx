// apps/web/src/pages/dashboard/StoreSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { LogoUploader } from '../../components/LogoUploader';

interface StoreSettingsPageProps {
  tenantId?: string;
}

export const StoreSettingsPage: React.FC<StoreSettingsPageProps> = ({ tenantId }) => {
  const [storeName, setStoreName] = useState('متجري');
  const [currency, setCurrency] = useState('EGP');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [carrierRate, setCarrierRate] = useState('45');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeTid = tenantId || 'tenant-moustafa-tech';

  useEffect(() => {
    fetch(`http://127.0.0.1:8001/api/v1/stores/me?tenant_id=${activeTid}`)
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
  }, [tenantId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    try {
      await fetch(`http://127.0.0.1:8001/api/v1/stores/me?tenant_id=${activeTid}`, {
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
            التحكم في بيانات المتجر، الشحن، وبوابات الدفع الإلكترونية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left col: Logo Uploader */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
            شعار وهوية المتجر
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            ارفع شعار متجرك لتحليل الألوان آلياً وتطبيقها على متجر العملاء
          </p>
          <LogoUploader />
        </div>

        {/* Right col: Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم المتجر</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">البريد الإلكتروني للتواصل</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رقم الهاتف (واتساب)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-500" />
                <span>إعدادات الشحن والتوصيل (Bosta Express)</span>
              </h4>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  سعر الشحن الافتراضي (ج.م) لجميع المحافظات
                </label>
                <input
                  type="number"
                  value={carrierRate}
                  onChange={(e) => setCarrierRate(e.target.value)}
                  className="w-full sm:w-48 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>بوابات الدفع الإلكتروني</span>
              </h4>

              <div className="space-y-2 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>الدفع عند الاستلام (COD) مفعل تلقائياً</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>بوابة Paymob للبطاقات البنكية وميزة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>التحويل اللحظي عبر InstaPay مفعل</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>

              {isSaved && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ الإعدادات بنجاح!</span>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
