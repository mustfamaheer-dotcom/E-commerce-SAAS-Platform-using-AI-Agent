// apps/web/src/components/gen-ui/ShapExplanationBars.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight, Brain } from 'lucide-react';

export interface ShapDriver {
  feature: string;
  impact_pct: number;
}

interface ShapExplanationBarsProps {
  drivers: ShapDriver[];
  title?: string;
  className?: string;
}

const FEATURE_LABELS: Record<string, { en: string; ar: string }> = {
  sales_lag_7: { en: 'Weekly Momentum', ar: 'زخم المبيعات الأسبوعي' },
  sales_lag_14: { en: 'Biweekly Momentum', ar: 'زخم المبيعات نصف الشهري' },
  sales_lag_28: { en: 'Monthly Momentum', ar: 'زخم المبيعات الشهري' },
  sales_rolling_mean_7: { en: 'Weekly Average', ar: 'متوسط المبيعات الأسبوعي' },
  sales_rolling_mean_28: { en: 'Monthly Average', ar: 'متوسط المبيعات الشهري' },
  sales_rolling_std_28: { en: 'Demand Volatility', ar: 'تقلّب الطلب' },
  discount_pct: { en: 'Active Discounts', ar: 'الخصومات الفعالة' },
  price_change_pct: { en: 'Price Changes', ar: 'تغيّر السعر' },
  day_of_week: { en: 'Weekend Effect', ar: 'تأثير الويكند' },
  month: { en: 'Seasonality', ar: 'الموسمية' },
  is_holiday: { en: 'Holiday Season', ar: 'الموسم / العيد' },
  holiday_weight: { en: 'Holiday Strength', ar: 'قوة الموسم' },
  stock_level: { en: 'Stock Availability', ar: 'توفر المخزون' },
};

export const ShapExplanationBars: React.FC<ShapExplanationBarsProps> = ({
  drivers,
  title,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith('ar');

  const labelFor = (feature: string) => {
    const localLabel = FEATURE_LABELS[feature]?.[isRtl ? 'ar' : 'en'];
    return t(`forecast.features.${feature}`, {
      defaultValue: localLabel || feature.replace(/_/g, ' '),
    });
  };

  if (!drivers || drivers.length === 0) return null;

  const maxImpact = Math.max(...drivers.map((driver) => Math.abs(driver.impact_pct)), 1);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-purple-300" />
        <h4 className="text-xs font-semibold text-slate-200">
          {title || t('forecast.driversTitle', { defaultValue: isRtl ? 'العوامل المؤثرة في التوقع (SHAP)' : 'What drives this forecast (SHAP)' })}
        </h4>
      </div>

      <ul className="space-y-2.5">
        {drivers.map((driver) => {
          const positive = driver.impact_pct >= 0;
          const width = Math.max(4, Math.round((Math.abs(driver.impact_pct) / maxImpact) * 100));
          return (
            <li key={driver.feature} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-[11px] text-slate-300 truncate" title={labelFor(driver.feature)}>
                {labelFor(driver.feature)}
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-950/70 overflow-hidden" dir="ltr">
                <div
                  className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span
                className={`w-16 shrink-0 text-[11px] font-mono font-semibold flex items-center justify-end gap-0.5 ${
                  positive ? 'text-emerald-400' : 'text-rose-400'
                }`}
                dir="ltr"
              >
                {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {positive ? '+' : ''}
                {driver.impact_pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
