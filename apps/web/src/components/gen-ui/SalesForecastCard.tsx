// apps/web/src/components/gen-ui/SalesForecastCard.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ShapExplanationBars, ShapDriver } from './ShapExplanationBars';

export interface ForecastHistoryPoint {
  report_date: string;
  units_sold: number;
}

export interface ForecastPoint {
  report_date: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface ForecastRestock {
  current_stock: number;
  predicted_demand: number;
  gap: number;
  safety_stock: number;
  reorder_level?: number;
  stockout_eta: string | null;
  recommendation: 'order_now' | 'sufficient' | string;
  suggested_order_qty: number;
}

export interface SalesForecastPayload {
  card_type: 'sales_forecast';
  product: {
    id: string;
    name: string;
    sku: string;
    current_stock: number;
  };
  horizon_days: 7 | 14 | 30 | number;
  history: ForecastHistoryPoint[];
  point_forecast: ForecastPoint[];
  totals: { yhat: number; yhat_lower: number; yhat_upper: number };
  top_shap_drivers: ShapDriver[];
  restock: ForecastRestock;
  model_version?: string;
  source?: 'model' | 'heuristic' | 'live' | 'mock' | string;
  latency_ms?: number;
}

interface SalesForecastCardProps {
  data: SalesForecastPayload;
  onHorizonChange?: (horizon: 7 | 14 | 30) => void;
  onRequestPurchase?: (quantity: number) => void;
}

export const SalesForecastCard: React.FC<SalesForecastCardProps> = ({
  data,
  onHorizonChange,
  onRequestPurchase,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith('ar');
  const { product, totals, restock } = data;

  const chartData = [
    ...data.history.map((point) => ({
      date: point.report_date,
      actual: point.units_sold,
    })),
    ...data.point_forecast.map((point) => ({
      date: point.report_date,
      yhat: point.yhat,
      yhat_lower: point.yhat_lower,
      yhat_upper: point.yhat_upper,
    })),
  ];

  const orderNow = restock.recommendation === 'order_now' && restock.suggested_order_qty > 0;

  const requestPurchase = () => {
    if (!orderNow) return;
    const quantity = restock.suggested_order_qty;
    if (onRequestPurchase) {
      onRequestPurchase(quantity);
      return;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('techzone:prompt', {
          detail: {
            text: isRtl
              ? `اعمل أمر شراء بـ ${quantity} وحدة من ${product.name}`
              : `Draft a purchase order for ${quantity} units of ${product.name}`,
          },
        })
      );
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden my-4 border-l-4 border-l-purple-600"
    >
      <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">
              {t('forecast.title', { defaultValue: isRtl ? 'توقّع المبيعات والطلب' : 'Sales Demand Forecast' })}
            </h3>
            <p className="text-[11px] text-slate-400">
              {product.name} · <span className="font-mono">{product.sku}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            {t('forecast.horizon', { defaultValue: isRtl ? 'الأفق' : 'Horizon' })}
          </span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {([7, 14, 30] as const).map((horizon) => (
              <button
                key={horizon}
                type="button"
                onClick={() => onHorizonChange?.(horizon)}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  Number(data.horizon_days) === horizon
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {horizon}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              {t('forecast.expectedDemand', {
                defaultValue: isRtl ? `الطلب المتوقع (${data.horizon_days} يوم)` : `Expected demand (${data.horizon_days}d)`,
              })}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-mono">{totals.yhat}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                [{totals.yhat_lower}–{totals.yhat_upper}]
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Package className="w-3.5 h-3.5 text-sky-300" />
              {t('forecast.currentStock', { defaultValue: isRtl ? 'المخزون الحالي' : 'Current stock' })}
            </div>
            <div className="mt-1 text-2xl font-extrabold text-white font-mono">{restock.current_stock}</div>
          </div>

          <div
            className={`rounded-xl border px-4 py-3 ${
              orderNow
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-emerald-500/30 bg-emerald-500/10'
            }`}
          >
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              {orderNow ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              )}
              {t('forecast.restockTitle', { defaultValue: isRtl ? 'توصية المخزون' : 'Restock recommendation' })}
            </div>
            <div className="mt-1 text-sm font-bold text-white">
              {orderNow
                ? t('forecast.orderNow', {
                    qty: restock.suggested_order_qty,
                    defaultValue: isRtl
                      ? `اطلب ${restock.suggested_order_qty} وحدة هذا الأسبوع`
                      : `Order ${restock.suggested_order_qty} units this week`,
                  })
                : t('forecast.sufficient', {
                    defaultValue: isRtl ? 'المخزون يكفي للأفق الحالي' : 'Stock covers this horizon',
                  })}
            </div>
            {restock.stockout_eta && (
              <div className="mt-1 text-[10px] text-amber-200/80 flex items-center gap-1">
                <CalendarRange className="w-3 h-3" />
                {t('forecast.stockoutEta', {
                  date: restock.stockout_eta,
                  defaultValue: isRtl ? `تاريخ النفاد المتوقع: ${restock.stockout_eta}` : `Projected stockout: ${restock.stockout_eta}`,
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2" dir="ltr">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(value: string) => value.slice(5)}
              minTickGap={24}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} width={36} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#cbd5e1' }}
              formatter={(value: any, name: any) => [value, String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }} />
            <Area
              name={t('forecast.confidence', { defaultValue: '95% confidence' })}
              dataKey={["yhat_lower", "yhat_upper"] as any}
              fill="rgba(168, 85, 247, 0.18)"
              stroke="none"
            />
            <Line
              name={t('forecast.historySeries', { defaultValue: isRtl ? 'المبيعات الفعلية' : 'Actual sales' })}
              type="monotone"
              dataKey="actual"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              name={t('forecast.forecastSeries', { defaultValue: isRtl ? 'التوقع' : 'Forecast' })}
              type="monotone"
              dataKey="yhat"
              stroke="#a855f7"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="px-6 pb-5">
        <ShapExplanationBars drivers={data.top_shap_drivers} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-mono text-slate-500">
            {t('forecast.model', { defaultValue: 'Model' })}: {data.model_version || '—'}
            {data.source ? ` · ${data.source}` : ''}
            {typeof data.latency_ms === 'number' ? ` · ${data.latency_ms}ms` : ''}
          </div>

          {orderNow && (
            <button
              type="button"
              onClick={requestPurchase}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              {t('forecast.requestPurchase', {
                defaultValue: isRtl ? 'جهّز أمر شراء' : 'Draft purchase order',
              })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
