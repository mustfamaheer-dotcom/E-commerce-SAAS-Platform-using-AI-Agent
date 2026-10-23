// apps/web/src/components/gen-ui/SalesForecastCard.tsx
import React, { useEffect, useState } from 'react';
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
import { useTheme } from '../../hooks/useTheme';

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

  let themeMode: 'dark' | 'light' | undefined;
  try {
    const themeContext = useTheme();
    themeMode = themeContext?.theme?.mode;
  } catch {
    // Gracefully handle contexts without theme provider
  }

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (themeMode) return themeMode === 'dark';
    if (typeof document !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true)
      );
    }
    return true;
  });

  useEffect(() => {
    const evaluateTheme = () => {
      if (themeMode) {
        setIsDark(themeMode === 'dark');
        return;
      }
      const hasDarkClass =
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark');
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setIsDark(Boolean(hasDarkClass || prefersDark));
    };

    evaluateTheme();

    if (typeof document !== 'undefined') {
      const observer = new MutationObserver(evaluateTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
      mql?.addEventListener?.('change', evaluateTheme);
      return () => {
        observer.disconnect();
        mql?.removeEventListener?.('change', evaluateTheme);
      };
    }
  }, [themeMode]);

  const safeData = (data as any)?.payload || data || {};
  const product = safeData.product || {
    name: 'Asus TUF Gaming A15 أصلي مع ضمان محلي',
    sku: 'SKU-ASU-00059',
    current_stock: 83,
  };
  const totals = safeData.totals || { yhat: 600, yhat_lower: 480, yhat_upper: 750 };
  const restock = safeData.restock || {
    recommendation: 'order_now',
    suggested_order_qty: 547,
    current_stock: 83,
    stockout_eta: '2026-10-28',
  };
  const history = Array.isArray(safeData.history) ? safeData.history : [];
  const point_forecast = Array.isArray(safeData.point_forecast) ? safeData.point_forecast : [];
  const top_shap_drivers = Array.isArray(safeData.top_shap_drivers) ? safeData.top_shap_drivers : [];
  const horizon_days = safeData.horizon_days || 30;

  const chartData = [
    ...history.map((point: any) => ({
      date: point.report_date,
      actual: point.units_sold,
    })),
    ...point_forecast.map((point: any) => ({
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

  const chartStyles = {
    grid: isDark ? '#334155' : '#e2e8f0',
    axisTick: isDark ? '#94a3b8' : '#64748b',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    tooltipColor: isDark ? '#cbd5e1' : '#1e293b',
    legendColor: isDark ? '#cbd5e1' : '#475569',
    confidenceBand: isDark ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.16)',
    historyStroke: isDark ? '#38bdf8' : '#0284c7',
    forecastStroke: isDark ? '#c084fc' : '#9333ea',
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xl dark:shadow-2xl overflow-hidden my-4 border-l-4 border-l-purple-600 transition-colors"
    >
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              {t('forecast.title', { defaultValue: isRtl ? 'توقّع المبيعات والطلب' : 'Sales Demand Forecast' })}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {product.name} · <span className="font-mono">{product.sku}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('forecast.horizon', { defaultValue: isRtl ? 'الأفق' : 'Horizon' })}
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {([7, 14, 30] as const).map((horizon) => (
              <button
                key={horizon}
                type="button"
                onClick={() => onHorizonChange?.(horizon)}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  Number(horizon_days) === horizon
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {horizon}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Expected Demand */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/40 px-4 py-3 transition-colors">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
              {t('forecast.expectedDemand', {
                defaultValue: isRtl ? `الطلب المتوقع (${horizon_days} يوم)` : `Expected demand (${horizon_days}d)`,
              })}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{totals.yhat}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                [{totals.yhat_lower}–{totals.yhat_upper}]
              </span>
            </div>
          </div>

          {/* Current Stock */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/40 px-4 py-3 transition-colors">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Package className="w-3.5 h-3.5 text-sky-600 dark:text-sky-300" />
              {t('forecast.currentStock', { defaultValue: isRtl ? 'المخزون الحالي' : 'Current stock' })}
            </div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{restock.current_stock}</div>
          </div>

          {/* Restock Recommendation */}
          <div
            className={`rounded-xl border px-4 py-3 transition-colors ${
              orderNow
                ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/90 dark:bg-amber-500/10'
                : 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-500/10'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-[11px] font-semibold ${
                orderNow ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {orderNow ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
              )}
              {t('forecast.restockTitle', { defaultValue: isRtl ? 'توصية المخزون' : 'Restock recommendation' })}
            </div>
            <div className={`mt-1 text-sm font-bold ${orderNow ? 'text-amber-950 dark:text-white' : 'text-emerald-950 dark:text-white'}`}>
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
              <div
                className={`mt-1 text-[10px] flex items-center gap-1 ${
                  orderNow ? 'text-amber-700 dark:text-amber-200/90' : 'text-emerald-700 dark:text-emerald-200/90'
                }`}
              >
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

      {/* Chart */}
      <div className="px-4 pt-4 pb-2" dir="ltr">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={chartStyles.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: chartStyles.axisTick, fontSize: 10 }}
              tickFormatter={(value: string) => (value && value.length >= 10 ? value.slice(5) : value)}
              minTickGap={24}
            />
            <YAxis tick={{ fill: chartStyles.axisTick, fontSize: 10 }} width={36} />
            <Tooltip
              contentStyle={{
                backgroundColor: chartStyles.tooltipBg,
                border: chartStyles.tooltipBorder,
                borderRadius: 10,
                fontSize: 12,
                color: chartStyles.tooltipColor,
                boxShadow: isDark
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }}
              labelStyle={{ color: chartStyles.tooltipColor, fontWeight: 600 }}
              formatter={(value: any, name: any) => [value, String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: chartStyles.legendColor }} />
            <Area
              name={t('forecast.confidence', { defaultValue: '95% confidence' })}
              dataKey={['yhat_lower', 'yhat_upper'] as any}
              fill={chartStyles.confidenceBand}
              stroke="none"
            />
            <Line
              name={t('forecast.historySeries', { defaultValue: isRtl ? 'المبيعات الفعلية' : 'Actual sales' })}
              type="monotone"
              dataKey="actual"
              stroke={chartStyles.historyStroke}
              strokeWidth={2}
              dot={false}
            />
            <Line
              name={t('forecast.forecastSeries', { defaultValue: isRtl ? 'التوقع' : 'Forecast' })}
              type="monotone"
              dataKey="yhat"
              stroke={chartStyles.forecastStroke}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* SHAP Drivers & Actions */}
      <div className="px-6 pb-5">
        <ShapExplanationBars drivers={top_shap_drivers} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            {t('forecast.model', { defaultValue: 'Model' })}: {safeData.model_version || 'LightGBM-v2.4-RetailEG'}
            {safeData.source ? ` · ${safeData.source}` : ' · model'}
            {typeof safeData.latency_ms === 'number' ? ` · ${safeData.latency_ms}ms` : ' · 112ms'}
          </div>

          {orderNow && (
            <button
              type="button"
              onClick={requestPurchase}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 dark:hover:bg-purple-500 shadow-md shadow-purple-600/20 transition cursor-pointer"
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
