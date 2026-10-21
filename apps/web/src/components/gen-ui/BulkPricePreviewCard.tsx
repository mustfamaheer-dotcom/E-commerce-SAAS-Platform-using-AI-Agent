// apps/web/src/components/gen-ui/BulkPricePreviewCard.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Layers,
  ArrowRight,
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
  const { t, i18n } = useTranslation();
  // Optimistic UI lock: immediately disabled on click to prevent double dispatch
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
      className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden my-4"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-900 px-6 py-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">
              {isRtl ? 'معاينة تطبيق الخصم الجماعي (HITL)' : 'Bulk Discount Preview (HITL)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isRtl
                ? `طلب تطبيق خصم ${payload.filterCriteria.discountPct}% على فئة ${payload.filterCriteria.category || 'جميع الفئات'}`
                : `Applying ${payload.filterCriteria.discountPct}% discount on ${payload.filterCriteria.category || 'All Categories'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300 font-mono">
            ID: {payload.actionId.slice(0, 14)}...
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium">
            {isRtl ? 'بانتظار التأكيد' : 'Pending Approval'}
          </span>
        </div>
      </div>

      {/* Margin Floor Warning Alert */}
      {hasMarginWarnings && (
        <div className="bg-rose-950/60 border-b border-rose-800/80 px-6 py-3 flex items-start gap-3 text-rose-200">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-rose-300">
              {isRtl ? 'تحذير أمان هامش الربح: ' : 'Profit Margin Floor Warning: '}
            </span>
            {isRtl
              ? `يوجد ${payload.summary.negativeMarginCount} منتج سيصبح سعرها أقل من سعر التكلفة بعد تطبيق الخصم!`
              : `${payload.summary.negativeMarginCount} SKUs will fall below unit cost under this proposed discount!`}
          </div>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 bg-slate-950/50 border-b border-slate-800 text-center">
        <div>
          <div className="text-xs text-slate-400">{isRtl ? 'المنتجات المتأثرة' : 'Affected SKUs'}</div>
          <div className="text-xl font-bold text-white mt-1">{payload.summary.totalAffectedSkus}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">{isRtl ? 'متوسط الهامش قبل' : 'Avg Margin Before'}</div>
          <div className="text-xl font-bold text-slate-300 mt-1">{payload.summary.averageMarginBeforePct}%</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">{isRtl ? 'متوسط الهامش بعد' : 'Avg Margin After'}</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{payload.summary.averageMarginAfterPct}%</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">{isRtl ? 'منتجات بهامش سالب' : 'Negative Margin'}</div>
          <div className={`text-xl font-bold mt-1 ${hasMarginWarnings ? 'text-rose-400' : 'text-emerald-400'}`}>
            {payload.summary.negativeMarginCount}
          </div>
        </div>
      </div>

      {/* Diff Table */}
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-800 text-slate-300 sticky top-0 border-b border-slate-700">
            <tr>
              <th className="px-4 py-2.5">SKU</th>
              <th className="px-4 py-2.5">{isRtl ? 'اسم المنتج' : 'Product Name'}</th>
              <th className="px-4 py-2.5">{isRtl ? 'المخزون' : 'Stock'}</th>
              <th className="px-4 py-2.5">{isRtl ? 'السعر الحالي' : 'Current Price'}</th>
              <th className="px-4 py-2.5">{isRtl ? 'السعر المقترح' : 'Proposed Price'}</th>
              <th className="px-4 py-2.5">{isRtl ? 'التكلفة' : 'Cost'}</th>
              <th className="px-4 py-2.5">{isRtl ? 'الهامش الجديد' : 'New Margin'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {payload.previewRows.map((row) => (
              <tr
                key={row.productId}
                className={`transition-colors ${
                  row.marginWarning
                    ? 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-200'
                    : 'hover:bg-slate-800/50 text-slate-200'
                }`}
              >
                <td className="px-4 py-2.5 font-mono font-medium">{row.sku}</td>
                <td className="px-4 py-2.5 font-medium">{row.name}</td>
                <td className="px-4 py-2.5">{row.quantity}</td>
                <td className="px-4 py-2.5 text-slate-400 line-through">
                  {row.currentPrice.toFixed(2)} EGP
                </td>
                <td className="px-4 py-2.5 font-bold text-indigo-400">
                  {row.proposedPrice.toFixed(2)} EGP
                </td>
                <td className="px-4 py-2.5 text-slate-400">{row.cost.toFixed(2)} EGP</td>
                <td className="px-4 py-2.5 font-semibold">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      row.marginWarning
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
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
      <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          {isRtl
            ? 'لن يتم تطبيق أي تغيير على قاعدة البيانات حتى تضغط اعتماد.'
            : 'Atomic execution: No database changes occur until approved.'}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={locked || isSubmitting}
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            {isRtl ? 'إلغاء / تعديل' : 'Cancel / Modify'}
          </button>

          <button
            type="button"
            disabled={locked || isSubmitting}
            onClick={handleApprove}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            {locked || isSubmitting
              ? isRtl
                ? 'جاري الاعتماد والتنفيذ...'
                : 'Committing atomically...'
              : isRtl
              ? 'اعتماد وتطبيق التغييرات'
              : 'Approve & Execute Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
