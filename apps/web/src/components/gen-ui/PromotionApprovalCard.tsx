// apps/web/src/components/gen-ui/PromotionApprovalCard.tsx
import React, { useState } from 'react';

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

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 space-y-4 max-w-lg font-sans"
    >
      <div className="flex items-center justify-between border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎟️</span>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {isAr ? 'تأكيد إطلاق حملة الخصم (HITL)' : 'Promotional Campaign Approval'}
            </h3>
            <p className="text-xs text-amber-700">
              {isAr ? 'مطلوب موافقة التاجر قبل إنشاء الكوبون' : 'Merchant confirmation required before launch'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 rounded-full border border-amber-200">
          {status.toUpperCase()}
        </span>
      </div>

      {/* Campaign Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-500 block">{isAr ? 'كود الخصم' : 'Coupon Code'}</span>
          <span className="font-mono font-bold text-base text-indigo-600">{data.coupon_code}</span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-500 block">{isAr ? 'الشريحة المستهدفة' : 'Target Segment'}</span>
          <span className="font-semibold text-slate-800">{data.target_segment}</span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-500 block">{isAr ? 'نسبة الخصم والمدة' : 'Discount & Duration'}</span>
          <span className="font-bold text-slate-800">
            {data.discount_pct}% {isAr ? `(لمدة ${data.duration_days} أيام)` : `(${data.duration_days} days)`}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-500 block">{isAr ? 'الوصول التقديري' : 'Estimated Reach'}</span>
          <span className="font-semibold text-slate-800">
            {data.estimated_reach_customers} {isAr ? 'عميل' : 'customers'}
          </span>
        </div>
      </div>

      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
        <span>{isAr ? 'العائد المتوقع من الحملة:' : 'Projected Campaign Revenue:'}</span>
        <span className="font-bold text-sm text-emerald-900">
          {data.projected_revenue_impact_egp.toLocaleString()} EGP
        </span>
      </div>

      {/* Actions */}
      {status === 'pending' ? (
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
          >
            {isSubmitting
              ? (isAr ? 'جاري الإطلاق...' : 'Launching...')
              : (isAr ? '✅ تأكيد وإطلاق الحملة' : '✅ Confirm & Launch')}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-300 transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      ) : status === 'confirmed' ? (
        <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg text-center font-medium">
          {isAr ? '🎉 تم اعتماد الحملة وإنشاء الكوبون في قاعدة البيانات!' : '🎉 Campaign launched & coupon persisted!'}
        </div>
      ) : (
        <div className="p-2.5 bg-slate-100 text-slate-600 text-xs rounded-lg text-center font-medium">
          {isAr ? 'تم إلغاء الحملة.' : 'Campaign cancelled.'}
        </div>
      )}
    </div>
  );
};
