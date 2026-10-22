// apps/web/src/components/gen-ui/ProductUpdatePreviewCard.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ShieldAlert, Tag } from 'lucide-react';

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
  const { i18n } = useTranslation();
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
      className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 text-slate-100 shadow-sm overflow-hidden my-3"
    >
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-sky-400" />
          <h4 className="font-semibold text-xs text-slate-200">
            {isRtl ? 'معاينة تعديل منتج فردي (HITL)' : 'Single Product Update Preview'}
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400">{diff.sku}</span>
      </div>

      {diff.marginWarning && (
        <div className="bg-red-950/60 px-4 py-2 border-b border-red-800/80 text-[11px] text-red-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span>{isRtl ? 'تنبيه: السعر المقترح أقل من سعر التكلفة!' : 'Proposed price is below unit cost!'}</span>
        </div>
      )}

      <div className="p-4 space-y-3 text-xs">
        <div className="text-slate-200 font-medium">{diff.before.name}</div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-md bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1 text-[11px]">{isRtl ? 'السعر الحالي' : 'Current'}</span>
            <div className="text-xs font-mono font-semibold text-slate-300">{diff.before.price.toLocaleString()} ج.م</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {isRtl ? 'التكلفة:' : 'Cost:'} {diff.before.cost.toLocaleString()} ج.م
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-slate-950 border border-sky-800/60">
            <span className="text-sky-400 block mb-1 text-[11px]">{isRtl ? 'السعر المقترح' : 'Proposed'}</span>
            <div className="text-xs font-mono font-semibold text-sky-400">
              {(diff.after.price ?? diff.before.price).toLocaleString()} ج.م
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isRtl ? 'هامش الربح:' : 'Margin:'}{' '}
              {(
                (((diff.after.price ?? diff.before.price) - diff.before.cost) /
                  Math.max(diff.after.price ?? diff.before.price, 1)) *
                100
              ).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex justify-end gap-2">
        <button
          type="button"
          disabled={locked}
          onClick={handleCancel}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {isRtl ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={handleApprove}
          className="px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{locked ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : isRtl ? 'تأكيد التعديل' : 'Confirm'}</span>
        </button>
      </div>
    </div>
  );
};
