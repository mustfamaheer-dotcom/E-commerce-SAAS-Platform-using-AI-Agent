// apps/web/src/components/gen-ui/StoreCreationPreviewCard.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ShieldCheck, Sparkles, CreditCard, Truck, Palette, Store, Banknote, Zap, Loader2 } from 'lucide-react';

export interface StorePreviewData {
  store_name?: string;
  currency?: 'EGP' | 'USD' | 'SAR' | string;
  theme_mode?: 'dark' | 'light';
  primary_color?: string;
  payment_methods?: string[];
  shipping_policy?: string;
  product_category?: string;
  logo_url?: string;
}

interface StoreCreationPreviewCardProps {
  data: StorePreviewData;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const StoreCreationPreviewCard: React.FC<StoreCreationPreviewCardProps> = ({
  data,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const isDark = data.theme_mode === 'dark';
  const primaryColor = data.primary_color || (isDark ? '#38bdf8' : '#4F46E5');
  const currency = data.currency || 'EGP';
  const storeName = data.store_name || (i18n.language.startsWith('ar') ? 'متجري الجديد' : 'My New Store');

  const handleConfirm = () => {
    setSubmitted(true);
    onConfirm();
  };

  return (
    <div
      className={`w-full max-w-lg rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden my-4 ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Banner & Multi-Tenancy Badge */}
      <div
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{
          borderBottomColor: isDark ? '#334155' : '#e2e8f0',
          background: isDark
            ? 'linear-gradient(to right, rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.8))'
            : 'linear-gradient(to right, rgba(79, 70, 229, 0.05), rgba(255, 255, 255, 0.9))',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-tight">{storeName}</h3>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              PostgreSQL RLS Isolated Tenant
            </span>
          </div>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold"
          style={{
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(79, 70, 229, 0.1)',
            color: primaryColor,
          }}
        >
          {currency}
        </span>
      </div>

      {/* Card Content & Extracted Slots */}
      <div className="p-6 space-y-5">
        {/* Live Theme Palette Swatch */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <Palette className="w-3.5 h-3.5" />
            {t('onboarding.themeMode')} & Branding
          </label>
          <div className="flex items-center gap-3">
            <div
              className="h-9 px-4 rounded-xl flex items-center gap-2 border text-xs font-semibold shadow-sm"
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
                borderColor: primaryColor,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Primary Accent
            </div>
            <div
              className={`h-9 px-3.5 rounded-xl flex items-center text-xs font-medium border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              Mode: <span className="font-bold uppercase ml-1.5 mr-1.5">{data.theme_mode || 'light'}</span>
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            {t('onboarding.paymentMethods')}
          </label>
          <div className="flex flex-wrap gap-2">
            {(data.payment_methods || ['cod', 'card']).map((method) => (
              <span
                key={method}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {method === 'cod' ? (
                  <span className="inline-flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-emerald-500" /><span>Cash on Delivery</span></span>
                ) : method === 'card' ? (
                  <span className="inline-flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-indigo-500" /><span>Paymob / Cards</span></span>
                ) : (
                  <span className="inline-flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /><span>InstaPay</span></span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Shipping Policy */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Truck className="w-3.5 h-3.5" />
            {t('onboarding.shippingPolicy')}
          </label>
          <p className="text-xs text-slate-500 leading-relaxed bg-slate-500/5 p-3 rounded-xl border border-slate-500/10">
            {data.shipping_policy ||
              (i18n.language.startsWith('ar')
                ? 'توصيل قياسي وسريع لجميع المحافظات خلال 3-5 أيام عمل.'
                : 'Standard delivery across all governorates within 3-5 business days.')}
          </p>
        </div>
      </div>

      {/* Action Footer (HITL Confirmation Gate) */}
      <div
        className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <button
          onClick={onCancel}
          disabled={submitted || isLoading}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition disabled:opacity-50"
        >
          {t('onboarding.cancel')}
        </button>

        <button
          onClick={handleConfirm}
          disabled={submitted || isLoading}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-95 transition flex items-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          {submitted || isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white inline-block mr-1" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{t('onboarding.launchStore')}</span>
        </button>
      </div>
    </div>
  );
};
