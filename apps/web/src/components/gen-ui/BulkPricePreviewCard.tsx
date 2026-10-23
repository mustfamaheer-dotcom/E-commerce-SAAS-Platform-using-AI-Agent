// apps/web/src/components/gen-ui/BulkPricePreviewCard.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  TrendingDown,
  ShieldAlert,
  Lock,
} from 'lucide-react';

export interface PreviewRow {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  cost: number;
  currentPrice: number;
  proposedPrice: number;
  newNetProfitPerUnit: number;
  newMarginPct: number;
  marginWarning: boolean;
}

export interface BulkPricePreviewPayload {
  actionId: string;
  status: string;
  filterCriteria: {
    category?: string;
    minStock?: number;
    discountPct: number;
  };
  summary: {
    totalAffectedSkus: number;
    averageMarginBeforePct: number;
    averageMarginAfterPct: number;
    negativeMarginCount: number;
  };
  previewRows: PreviewRow[];
}

interface BulkPricePreviewCardProps {
  payload: BulkPricePreviewPayload;
  onApprove: (actionId: string) => void;
  onCancel: (actionId: string) => void;
  isSubmitting?: boolean;
}

export const BulkPricePreviewCard: React.FC<BulkPricePreviewCardProps> = ({
  payload,
  onApprove,
  onCancel,
  isSubmitting = false,
}) => {
  const { i18n } = useTranslation();
  const [locked, setLocked] = useState(false);

  const isRtl = i18n.language.startsWith('ar');
  const hasMarginWarnings = payload.summary.negativeMarginCount > 0;

  const handleApprove = () => {
    if (locked || isSubmitting) return;
    setLocked(true);
    onApprove(payload.actionId);
  };

  const handleCancel = () => {
    if (locked || isSubmitting) return;
    setLocked(true);
    onCancel(payload.actionId);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-md overflow-hidden my-3 transition-colors"
    >
      {/* Header Banner */}
      <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-sky-950/60 text-sky-400 border border-sky-800/80">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-slate-200">
              {isRtl ? 'معاينة تطبيق الخصم الجماعي (HITL)' : 'Bulk Discount Preview (HITL)'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isRtl
                ? `طلب تطبيق خصم ${payload.filterCriteria.discountPct}% على فئة ${payload.filterCriteria.category || 'جميع الفئات'}`
                : `Applying ${payload.filterCriteria.discountPct}% discount on ${payload.filterCriteria.category || 'All Categories'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
            ID: {payload.actionId.slice(0, 14)}...
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/80 text-amber-400 font-medium">
            {isRtl ? 'بانتظار التأكيد' : 'Pending Approval'}
          </span>
        </div>
      </div>

      {/* Margin Floor Warning Alert */}
      {hasMarginWarnings && (
        <div className="bg-red-950/60 border-b border-red-800/80 px-5 py-2.5 flex items-start gap-2.5 text-red-200">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-red-300">
              {isRtl ? 'تحذير حماية هامش الربح: ' : 'Profit Margin Floor Warning: '}
            </span>
            {isRtl
              ? `يوجد ${payload.summary.negativeMarginCount} منتج سيصبح سعرها أقل من سعر التكلفة بعد تطبيق الخصم!`
              : `${payload.summary.negativeMarginCount} SKUs will fall below unit cost under this proposed discount!`}
          </div>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-50/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-center">
        <div>
          <div className="text-[11px] text-slate-400">{isRtl ? 'المنتجات المتأثرة' : 'Affected SKUs'}</div>
          <div className="text-sm font-semibold font-mono text-slate-100 mt-0.5">{payload.summary.totalAffectedSkus}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">{isRtl ? 'متوسط الهامش قبل' : 'Avg Margin Before'}</div>
          <div className="text-sm font-semibold font-mono text-slate-300 mt-0.5">{payload.summary.averageMarginBeforePct}%</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">{isRtl ? 'متوسط الهامش بعد' : 'Avg Margin After'}</div>
          <div className="text-sm font-semibold font-mono text-sky-400 mt-0.5">{payload.summary.averageMarginAfterPct}%</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">{isRtl ? 'منتجات بهامش سالب' : 'Negative Margin'}</div>
          <div className={`text-sm font-semibold font-mono mt-0.5 ${hasMarginWarnings ? 'text-red-400' : 'text-emerald-400'}`}>
            {payload.summary.negativeMarginCount}
          </div>
        </div>
      </div>

      {/* Diff Table */}
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-right text-xs border-collapse">
          <thead className="bg-slate-100/90 dark:bg-slate-950 text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-[11px]">
            <tr>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">{isRtl ? 'اسم المنتج' : 'Product Name'}</th>
              <th className="px-4 py-2 font-medium">{isRtl ? 'المخزون' : 'Stock'}</th>
              <th className="px-4 py-2 font-medium">{isRtl ? 'السعر الحالي' : 'Current Price'}</th>
              <th className="px-4 py-2 font-medium">{isRtl ? 'السعر المقترح' : 'Proposed Price'}</th>
              <th className="px-4 py-2 font-medium">{isRtl ? 'التكلفة' : 'Cost'}</th>
              <th className="px-4 py-2 font-medium">{isRtl ? 'الهامش الجديد' : 'New Margin'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {payload.previewRows.map((row) => (
              <tr
                key={row.productId}
                className={`transition-colors ${
                  row.marginWarning
                    ? 'bg-red-950/20 hover:bg-red-950/30 text-red-200'
                    : 'hover:bg-slate-800/40 text-slate-200'
                }`}
              >
                <td className="px-4 py-2 font-mono text-sky-400">{row.sku}</td>
                <td className="px-4 py-2 font-medium text-slate-200">{row.name}</td>
                <td className="px-4 py-2 font-mono">{row.quantity}</td>
                <td className="px-4 py-2 text-slate-400 line-through font-mono">
                  {row.currentPrice.toLocaleString()} ج.م
                </td>
                <td className="px-4 py-2 font-semibold font-mono text-sky-400">
                  {row.proposedPrice.toLocaleString()} ج.م
                </td>
                <td className="px-4 py-2 text-slate-400 font-mono">{row.cost.toLocaleString()} ج.م</td>
                <td className="px-4 py-2 font-medium font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      row.marginWarning
                        ? 'bg-red-950/60 text-red-400 border border-red-800/80'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80'
                    }`}
                  >
                    {row.newMarginPct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Actions with Optimistic UI Lock */}
      <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {isRtl
              ? 'معاملة ذرية: لن يتم تعديل الأسعار حتى يتم الضغط على تأكيد الاعتماد.'
              : 'Atomic execution: No database changes occur until approved.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={locked || isSubmitting}
            onClick={handleCancel}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isRtl ? 'إلغاء' : 'Cancel'}</span>
          </button>

          <button
            type="button"
            disabled={locked || isSubmitting}
            onClick={handleApprove}
            className="px-4 py-1.5 rounded-md text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {locked || isSubmitting
                ? isRtl
                  ? 'جاري التنفيذ...'
                  : 'Committing...'
                : isRtl
                ? 'تأكيد واعتماد الخصم'
                : 'Approve & Execute'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
