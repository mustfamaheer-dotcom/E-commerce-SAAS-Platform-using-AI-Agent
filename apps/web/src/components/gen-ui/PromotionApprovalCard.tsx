// apps/web/src/components/gen-ui/PromotionApprovalCard.tsx
import React, { useState } from 'react';
import { Ticket, Check, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface PromotionApprovalPayload {
  action_id: string;
  tenant_id: string;
  coupon_code: string;
  target_segment: string;
  discount_pct: number;
  duration_days: number;
  estimated_reach_customers: number;
  projected_revenue_impact_egp: number;
  message_ar?: string;
  message_en?: string;
}

export interface PromotionApprovalCardProps {
  data: PromotionApprovalPayload;
  onConfirm?: (actionId: string) => void;
  onCancel?: (actionId: string) => void;
  language?: 'ar' | 'en';
}

export const PromotionApprovalCard: React.FC<PromotionApprovalCardProps> = ({
  data,
  onConfirm,
  onCancel,
  language = 'ar',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  const isAr = language === 'ar';

  const handleConfirm = () => {
    setIsSubmitting(true);
    setStatus('confirmed');
    onConfirm?.(data.action_id);
  };

  const handleCancel = () => {
    setStatus('cancelled');
    onCancel?.(data.action_id);
  };

  const projectedRev = typeof data?.projected_revenue_impact_egp === 'number'
    ? data.projected_revenue_impact_egp.toLocaleString()
    : '0';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-5 space-y-3.5 max-w-lg font-sans text-slate-800 dark:text-slate-100 transition-colors"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isAr ? 'تأكيد إطلاق الحملة الترويجية (HITL)' : 'Promotional Campaign Approval'}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {isAr ? 'مطلوب تأكيد التاجر قبل إنشاء ونشر الكوبون' : 'Confirmation required before campaign deployment'}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-800">
          {status.toUpperCase()}
        </span>
      </div>

      {/* Campaign Details Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{isAr ? 'كود الكوبون' : 'Coupon Code'}</span>
          <span className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">{data.coupon_code}</span>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{isAr ? 'الشريحة المستهدفة' : 'Target Segment'}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{data.target_segment}</span>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{isAr ? 'نسبة الخصم والمدة' : 'Discount & Duration'}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {data.discount_pct}% {isAr ? `(لمدة ${data.duration_days} أيام)` : `(${data.duration_days} days)`}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{isAr ? 'الوصول التقديري' : 'Estimated Reach'}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {data.estimated_reach_customers} {isAr ? 'عميل' : 'customers'}
          </span>
        </div>
      </div>

      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400">{isAr ? 'العائد المالي المتوقع:' : 'Projected Revenue Impact:'}</span>
        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
          {projectedRev} ج.م
        </span>
      </div>

      {/* Actions */}
      {status === 'pending' ? (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? (isAr ? 'جاري الاعتماد...' : 'Deploying...') : (isAr ? 'تأكيد وإطلاق الحملة' : 'Confirm & Deploy')}</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
          </button>
        </div>
      ) : status === 'confirmed' ? (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl text-center font-bold flex items-center justify-center gap-1.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{isAr ? 'تم اعتماد الحملة وإنشاء الكوبون بنجاح في قاعدة البيانات' : 'Campaign confirmed and coupon created'}</span>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded-xl text-center font-medium">
          {isAr ? 'تم إلغاء الحملة بأمان دون تعديل.' : 'Campaign safely cancelled.'}
        </div>
      )}
    </div>
  );
};
