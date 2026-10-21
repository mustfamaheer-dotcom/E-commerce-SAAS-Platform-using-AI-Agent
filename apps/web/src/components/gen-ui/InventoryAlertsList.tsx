// apps/web/src/components/gen-ui/InventoryAlertsList.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Clock, DollarSign, PackagePlus, ArrowUpRight } from 'lucide-react';

export interface InventoryAlertData {
  productId?: string;
  sku: string;
  productName: string;
  categoryName?: string;
  currentStock: number;
  reorderLevel?: number;
  daysUntilStockout: number;
  urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  dailyProfitAtRisk: number;
  recommendedReorderQty: number;
}

interface InventoryAlertsListProps {
  alerts: InventoryAlertData[];
  onReorderClick?: (sku: string, qty: number) => void;
}

export const InventoryAlertsList: React.FC<InventoryAlertsListProps> = ({
  alerts,
  onReorderClick,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith('ar');

  if (!alerts || alerts.length === 0) {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full max-w-2xl rounded-2xl border border-emerald-800/40 bg-slate-900/80 p-5 text-center text-emerald-400 text-xs"
      >
        {isRtl ? '✅ مستويات المخزون ممتازة ولا توجد مخاطر نفاد قريبة.' : '✅ Inventory levels are optimal. No stockout risks detected.'}
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-xl overflow-hidden my-4"
    >
      <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="font-semibold text-sm text-white">
              {isRtl ? 'تنبيهات مخاطر نفاد المخزون (Dynamic ROP)' : 'Inventory Stockout Risk Alerts'}
            </h4>
            <p className="text-xs text-slate-400">
              {isRtl
                ? 'مرتبة حسب أعلى صافي ربح يومي معرض للضياع'
                : 'Ranked by highest daily net profit at risk'}
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
          {alerts.length} {isRtl ? 'نواقص عاجلة' : 'Urgent Alerts'}
        </span>
      </div>

      <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
        {alerts.map((item) => (
          <div key={item.sku} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-indigo-400">{item.sku}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.urgency === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {item.urgency === 'CRITICAL'
                    ? isRtl ? 'حرج جداً' : 'CRITICAL'
                    : isRtl ? 'تحذير' : 'WARNING'}
                </span>
              </div>
              <div className="text-slate-200 font-medium">{item.productName}</div>
              <div className="text-slate-400 text-[11px] flex items-center gap-3">
                <span>{isRtl ? 'المتبقي:' : 'Stock:'} <b className="text-white">{item.currentStock}</b></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {isRtl ? 'ينفد خلال:' : 'Stockout in:'}{' '}
                  <b className="text-amber-400">{item.daysUntilStockout} {isRtl ? 'أيام' : 'days'}</b>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right sm:text-left">
                <div className="text-[10px] text-slate-400">{isRtl ? 'ربح يومي معرض للفقد' : 'Daily Profit at Risk'}</div>
                <div className="text-xs font-bold text-rose-400 mt-0.5">
                  {item.dailyProfitAtRisk.toFixed(2)} EGP
                </div>
                <div className="text-[10px] text-slate-500">
                  {isRtl ? `طلب موصى: ${item.recommendedReorderQty} وحدة` : `Reorder: ${item.recommendedReorderQty} units`}
                </div>
              </div>

              {onReorderClick && (
                <button
                  type="button"
                  onClick={() => onReorderClick(item.sku, item.recommendedReorderQty)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-1 shrink-0"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إعادة طلب' : 'Reorder'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
