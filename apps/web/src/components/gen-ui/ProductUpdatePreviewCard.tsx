// apps/web/src/components/gen-ui/ProductUpdatePreviewCard.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ArrowRight, ShieldAlert, Tag, Package } from 'lucide-react';

export interface ProductUpdateDiff {
  actionId: string;
  productId: string;
  sku: string;
  before: {
    name: string;
    price: number;
    cost: number;
    stock?: number;
    category?: string;
  };
  after: {
    name?: string;
    price?: number;
    cost?: number;
    stock?: number;
    category?: string;
  };
  marginWarning: boolean;
}

interface ProductUpdatePreviewCardProps {
  diff: ProductUpdateDiff;
  onApprove: (actionId: string) => void;
  onCancel: (actionId: string) => void;
}

export const ProductUpdatePreviewCard: React.FC<ProductUpdatePreviewCardProps> = ({
  diff,
  onApprove,
  onCancel,
}) => {
  const { t, i18n } = useTranslation();
  const [locked, setLocked] = useState(false);
  const isRtl = i18n.language.startsWith('ar');

  const handleApprove = () => {
    if (locked) return;
    setLocked(true);
    onApprove(diff.actionId);
  };

  const handleCancel = () => {
    if (locked) return;
    setLocked(true);
    onCancel(diff.actionId);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-xl overflow-hidden my-4"
    >
      <div className="bg-slate-800 px-5 py-3.5 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-400" />
          <h4 className="font-semibold text-sm text-white">
            {isRtl ? 'معاينة تعديل منتج فردي' : 'Single Product Update Preview'}
          </h4>
        </div>
        <span className="text-xs font-mono text-slate-400">{diff.sku}</span>
      </div>

      {diff.marginWarning && (
        <div className="bg-rose-950/60 px-5 py-2.5 border-b border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{isRtl ? 'السعر المقترح أقل من سعر التكلفة!' : 'Proposed price is below unit cost!'}</span>
        </div>
      )}

      <div className="p-5 space-y-3 text-xs">
        <div className="text-slate-300 font-medium text-sm">{diff.before.name}</div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">{isRtl ? 'السابق' : 'Current'}</span>
            <div className="text-sm font-semibold text-slate-300">{diff.before.price.toFixed(2)} EGP</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isRtl ? 'التكلفة:' : 'Cost:'} {diff.before.cost.toFixed(2)} EGP
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
            <span className="text-indigo-300 block mb-1">{isRtl ? 'المقترح بعد التعديل' : 'Proposed'}</span>
            <div className="text-sm font-bold text-indigo-400">
              {(diff.after.price ?? diff.before.price).toFixed(2)} EGP
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isRtl ? 'الهامش:' : 'Margin:'}{' '}
              {(
                ((((diff.after.price ?? diff.before.price) - diff.before.cost) /
                  (diff.after.price ?? diff.before.price)) *
                100
              ).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex justify-end gap-2.5">
        <button
          type="button"
          disabled={locked}
          onClick={handleCancel}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
        >
          {isRtl ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={handleApprove}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1.5 shadow"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {locked ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : isRtl ? 'تأكيد التعديل' : 'Confirm'}
        </button>
      </div>
    </div>
  );
};
