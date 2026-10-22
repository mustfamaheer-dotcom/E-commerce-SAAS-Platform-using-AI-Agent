// apps/web/src/components/gen-ui/InventoryAlertsList.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Clock, PackagePlus, CheckCircle2 } from 'lucide-react';

export interface InventoryAlertData {
  productId?: string;
  sku: string;
  productName?: string;
  product_name?: string;
  categoryName?: string;
  category?: string;
  currentStock?: number;
  current_stock?: number;
  reorderLevel?: number;
  daysUntilStockout?: number;
  days_until_stockout?: number;
  urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY' | string;
  dailyProfitAtRisk?: number;
  daily_profit_at_risk?: number;
  recommendedReorderQty?: number;
  recommended_reorder_qty?: number;
}

interface InventoryAlertsListProps {
  alerts: InventoryAlertData[];
  onReorderClick?: (sku: string, qty: number) => void;
}

export const InventoryAlertsList: React.FC<InventoryAlertsListProps> = ({
  alerts,
  onReorderClick,
}) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language.startsWith('ar');

  const safeAlerts: InventoryAlertData[] = Array.isArray(alerts) ? alerts : (alerts as any)?.alerts || [];

  if (!safeAlerts || safeAlerts.length === 0) {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full max-w-2xl rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-4 text-center text-emerald-400 text-xs flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>{isRtl ? 'مستويات المخزون كافية ولا توجد مخاطر نفاد قريبة.' : 'Inventory levels are optimal. No stockout risks detected.'}</span>
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full max-w-3xl rounded-lg border border-slate-800 bg-slate-900 text-slate-100 shadow-sm overflow-hidden my-3"
    >
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <div>
            <h4 className="font-semibold text-xs text-slate-200">
              {isRtl ? 'تنبيهات مخاطر نفاد المخزون (Dynamic ROP)' : 'Inventory Stockout Risk Alerts'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isRtl
                ? 'مرتبة حسب أعلى صافي ربح يومي معرض للضياع'
                : 'Ranked by highest daily net profit at risk'}
            </p>
          </div>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-950/60 text-red-400 border border-red-800/80 font-medium">
          {safeAlerts.length} {isRtl ? 'نواقص حرجة' : 'Alerts'}
        </span>
      </div>

      <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
        {safeAlerts.map((item, idx) => {
          const sku = item.sku || `SKU-${idx}`;
          const prodName = item.productName || item.product_name || sku;
          const currentStock = item.currentStock ?? item.current_stock ?? 0;
          const daysUntilStockout = item.daysUntilStockout ?? item.days_until_stockout ?? 0;
          const dailyProfitAtRisk = Number(item.dailyProfitAtRisk ?? item.daily_profit_at_risk ?? 0);
          const recommendedReorderQty = item.recommendedReorderQty ?? item.recommended_reorder_qty ?? 30;
          const urgency = item.urgency || 'WARNING';

          return (
            <div key={sku} className="p-3.5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sky-400 font-medium">{sku}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      urgency === 'CRITICAL'
                        ? 'bg-red-950/60 text-red-400 border border-red-800/80'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/80'
                    }`}
                  >
                    {urgency === 'CRITICAL'
                      ? isRtl ? 'حرج جداً' : 'CRITICAL'
                      : isRtl ? 'تحذير' : 'WARNING'}
                  </span>
                </div>
                <div className="text-slate-200 font-medium">{prodName}</div>
                <div className="text-slate-400 text-[11px] flex items-center gap-2.5">
                  <span>{isRtl ? 'المتبقي:' : 'Stock:'} <b className="text-slate-100 font-mono">{currentStock}</b></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{isRtl ? 'ينفد خلال:' : 'Stockout in:'}</span>
                    <b className="text-amber-400 font-mono">{daysUntilStockout} {isRtl ? 'أيام' : 'days'}</b>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right sm:text-left">
                  <div className="text-[10px] text-slate-400">{isRtl ? 'ربح يومي معرض للفقد' : 'Daily Profit at Risk'}</div>
                  <div className="text-xs font-mono font-semibold text-red-400 mt-0.5">
                    {dailyProfitAtRisk.toLocaleString()} ج.م
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isRtl ? `طلب موصى به: ${recommendedReorderQty} قطعة` : `Reorder: ${recommendedReorderQty} units`}
                  </div>
                </div>

                {onReorderClick && (
                  <button
                    type="button"
                    onClick={() => onReorderClick(sku, recommendedReorderQty)}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 transition-colors flex items-center gap-1 shrink-0 text-xs font-medium"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إعادة طلب' : 'Reorder'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
