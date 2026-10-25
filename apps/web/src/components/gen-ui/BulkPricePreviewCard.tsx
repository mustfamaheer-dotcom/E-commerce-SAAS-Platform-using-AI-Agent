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
  actionId?: string;
  status?: string;
  filterCriteria?: {
    category?: string;
    minStock?: number;
    discountPct?: number;
  };
  summary?: {
    totalAffectedSkus?: number;
    averageMarginBeforePct?: number;
    averageMarginAfterPct?: number;
    negativeMarginCount?: number;
  };
  previewRows?: PreviewRow[];
  // Backwards compatibility with alternative backend tool payload formats
  percentChange?: number;
  totalAffected?: number;
  items?: Array<{
    sku?: string;
    name?: string;
    oldPrice?: number;
    newPrice?: number;
    delta?: number;
    cost?: number;
    quantity?: number;
  }>;
}

interface BulkPricePreviewCardProps {
  payload?: BulkPricePreviewPayload | any;
  onApprove?: (actionId: string) => void;
  onCancel?: (actionId: string) => void;
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

  // Resilient normalization for any payload shape (master_command_graph or product_tool or partial)
  const actionId = payload?.actionId || `bulk_${Date.now().toString(36)}`;
  
  const discountPct = Number(
    payload?.filterCriteria?.discountPct ??
    payload?.percentChange ??
    10
  );

  const category = payload?.filterCriteria?.category || payload?.category || (isRtl ? 'جميع المنتجات' : 'All Products');

  const rawRows: any[] = payload?.previewRows || payload?.items || [];
  
  const rows: PreviewRow[] = rawRows.map((row: any, idx: number) => {
    const currentPrice = Number(row?.currentPrice ?? row?.oldPrice ?? 0);
    const proposedPrice = Number(
      row?.proposedPrice ??
      row?.newPrice ??
      Math.round(currentPrice * (1 + discountPct / 100))
    );
    const cost = Number(row?.cost ?? Math.round(currentPrice * 0.7));
    const profit = Math.round((proposedPrice - cost) * 100) / 100;
    const margin = proposedPrice > 0 ? Math.round((profit / proposedPrice) * 100) : 0;
    const warning = Boolean(row?.marginWarning ?? (proposedPrice < cost));

    return {
      productId: String(row?.productId || row?.sku || `prod_${idx}`),
      sku: String(row?.sku || `PRD-${idx + 1}`),
      name: String(row?.name || (isRtl ? `منتج ${idx + 1}` : `Product ${idx + 1}`)),
      quantity: Number(row?.quantity ?? row?.stock ?? 20),
      cost,
      currentPrice,
      proposedPrice,
      newNetProfitPerUnit: profit,
      newMarginPct: margin,
      marginWarning: warning,
    };
  });

  const negativeMarginCount = Number(
    payload?.summary?.negativeMarginCount ??
    rows.filter((r) => r.marginWarning).length
  );

  const totalAffectedSkus = Number(
    payload?.summary?.totalAffectedSkus ??
    payload?.totalAffected ??
    rows.length
  );

  const avgMarginBefore = Number(payload?.summary?.averageMarginBeforePct ?? 28.5);
  const avgMarginAfter = Number(payload?.summary?.averageMarginAfterPct ?? 22.0);

  const hasMarginWarnings = negativeMarginCount > 0;

  const handleApprove = () => {
    if (locked || isSubmitting) return;
    setLocked(true);
    onApprove?.(actionId);
  };

  const handleCancel = () => {
    if (locked || isSubmitting) return;
    setLocked(true);
    onCancel?.(actionId);
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
            <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-200">
              {isRtl ? 'معاينة تطبيق الخصم الجماعي (HITL)' : 'Bulk Discount Preview (HITL)'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isRtl
                ? `طلب تطبيق خصم ${discountPct}% على فئة ${category}`
                : `Applying ${discountPct}% discount on ${category}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
            ID: {actionId.slice(0, 14)}...
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-400 font-medium">
            {isRtl ? 'بانتظار التأكيد' : 'Pending Approval'}
          </span>
        </div>
      </div>

      {/* Margin Floor Warning Alert */}
      {hasMarginWarnings && (
        <div className="bg-red-50 dark:bg-red-950/60 border-b border-red-200 dark:border-red-800/80 px-5 py-2.5 flex items-start gap-2.5 text-red-700 dark:text-red-200">
          <ShieldAlert className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-red-800 dark:text-red-300">
              {isRtl ? 'تحذير حماية هامش الربح: ' : 'Profit Margin Floor Warning: '}
            </span>
            {isRtl
              ? `يوجد ${negativeMarginCount} منتج سيصبح سعرها أقل من سعر التكلفة بعد تطبيق الخصم!`
              : `${negativeMarginCount} SKUs will fall below unit cost under this proposed discount!`}
          </div>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-50/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-center">
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{isRtl ? 'المنتجات المتأثرة' : 'Affected SKUs'}</div>
          <div className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-100 mt-0.5">{totalAffectedSkus}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{isRtl ? 'متوسط الهامش قبل' : 'Avg Margin Before'}</div>
          <div className="text-sm font-semibold font-mono text-slate-700 dark:text-slate-300 mt-0.5">{avgMarginBefore}%</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{isRtl ? 'متوسط الهامش بعد' : 'Avg Margin After'}</div>
          <div className="text-sm font-semibold font-mono text-sky-600 dark:text-sky-400 mt-0.5">{avgMarginAfter}%</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{isRtl ? 'منتجات بهامش سالب' : 'Negative Margin'}</div>
          <div className={`text-sm font-semibold font-mono mt-0.5 ${hasMarginWarnings ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {negativeMarginCount}
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-400 text-xs">
                  {isRtl ? 'لا توجد منتجات مسجلة للمعاينة' : 'No preview items available'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.productId}
                  className={`transition-colors ${
                    row.marginWarning
                      ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-900 dark:text-red-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-sky-600 dark:text-sky-400">{row.sku}</td>
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{row.name}</td>
                  <td className="px-4 py-2 font-mono">{row.quantity}</td>
                  <td className="px-4 py-2 text-slate-400 line-through font-mono">
                    {(row.currentPrice ?? 0).toLocaleString()} ج.م
                  </td>
                  <td className="px-4 py-2 font-semibold font-mono text-sky-600 dark:text-sky-400">
                    {(row.proposedPrice ?? 0).toLocaleString()} ج.م
                  </td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400 font-mono">
                    {(row.cost ?? 0).toLocaleString()} ج.م
                  </td>
                  <td className="px-4 py-2 font-medium font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        row.marginWarning
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800/80'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80'
                      }`}
                    >
                      {row.newMarginPct}%
                    </span>
                  </td>
                </tr>
              ))
            )}
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
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isRtl ? 'إلغاء' : 'Cancel'}</span>
          </button>

          <button
            type="button"
            disabled={locked || isSubmitting}
            onClick={handleApprove}
            className="px-4 py-1.5 rounded-md text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
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
