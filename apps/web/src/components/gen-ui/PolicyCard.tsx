// apps/web/src/components/gen-ui/PolicyCard.tsx
import React from 'react';
import { ShieldCheck, Truck, Scale, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export interface PolicyCardPayload {
  policy_type: 'return_policy' | 'shipping_policy' | 'warranty';
  title?: string;
  lead_time?: string;
  rates?: Record<string, number>;
  return_days?: number;
  defect_days?: number;
  carrier?: string;
  legal_citation?: string;
}

export const PolicyCard: React.FC<{ data: PolicyCardPayload }> = ({ data }) => {
  const isReturn = data.policy_type === 'return_policy' || data.policy_type === 'warranty';

  return (
    <div dir="rtl" className="my-2 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs font-sans space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isReturn
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
            }`}
          >
            {isReturn ? <Scale className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
            {data.title || (isReturn ? 'سياسة الاسترجاع والضمان' : 'سياسة وأسعار الشحن والتوصيل')}
          </h4>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          معتمد رسمياً ✓
        </span>
      </div>

      {isReturn ? (
        /* Return & Warranty Policy Content */
        <div className="space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5">
                استرجاع قياسي
              </span>
              <span className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200 font-mono">
                {data.return_days || 14} يوماً
              </span>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                بشرط الحالة الأصلية والغلاف
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40">
              <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold block mb-0.5">
                عيب صناعة أو تلف
              </span>
              <span className="font-extrabold text-sm text-sky-900 dark:text-sky-200 font-mono">
                {data.defect_days || 30} يوماً
              </span>
              <p className="text-[10px] text-sky-700/80 dark:text-sky-400/80 mt-1">
                استبدال فوري أو استرداد كامل
              </p>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {data.legal_citation || 'وفقاً لأحكام قانون حماية المستهلك المصري رقم 181 لسنة 2018.'}
            </span>
          </div>
        </div>
      ) : (
        /* Shipping & Delivery Policy Content */
        <div className="space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                القاهرة والجيزة
              </span>
              <span className="font-extrabold text-sm text-sky-600 dark:text-sky-400 font-mono">
                45 <span className="text-[10px] font-sans">ج.م</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">خلال 24-48 ساعة</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                باقي محافظات مصر
              </span>
              <span className="font-extrabold text-sm text-sky-600 dark:text-sky-400 font-mono">
                65 <span className="text-[10px] font-sans">ج.م</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">خلال 2-4 أيام عمل</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-[11px] text-sky-800 dark:text-sky-300">
            <span>الناقل اللوجستي المعتمد:</span>
            <span className="font-bold">{data.carrier || 'شركة بوسطة (Bosta Express)'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
