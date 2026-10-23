// apps/web/src/components/gen-ui/ShapExplanationBars.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight, Brain } from 'lucide-react';

export interface ShapDriver {
  feature: string;
  impact_pct?: number;
  contribution?: number;
  direction?: 'positive' | 'negative' | string;
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
  discount: { en: 'Promotional Discount', ar: 'الخصم الترويجي الحالي (Discount)' },
  marketing_campaign: { en: 'Social Media Marketing', ar: 'حملة التسويق على السوشيال ميديا' },
  social_campaign: { en: 'Social Media Marketing', ar: 'حملة التسويق على السوشيال ميديا' },
  weekend_white_friday: { en: 'Weekend & White Friday', ar: 'عطلة نهاية الأسبوع والجمعة البيضاء' },
  white_friday: { en: 'White Friday & Weekend', ar: 'عطلة نهاية الأسبوع والجمعة البيضاء' },
  competitor_price_index: { en: 'Competitor Price Index', ar: 'مؤشر أسعار المنافسين' },
};

export const ShapExplanationBars: React.FC<ShapExplanationBarsProps> = ({
  drivers,
  title,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith('ar');

  const labelFor = (feature: string) => {
    if (FEATURE_LABELS[feature]) {
      return isRtl ? FEATURE_LABELS[feature].ar : FEATURE_LABELS[feature].en;
    }
    const localLabel = t(`forecast.features.${feature}`, { defaultValue: '' });
    if (localLabel) return localLabel;
    return feature.replace(/_/g, ' ');
  };

  const getImpact = (driver: ShapDriver): number => {
    if (typeof driver.impact_pct === 'number' && !isNaN(driver.impact_pct)) {
      return driver.impact_pct;
    }
    if (typeof driver.contribution === 'number' && !isNaN(driver.contribution)) {
      return driver.direction === 'negative' ? -Math.abs(driver.contribution) : driver.contribution;
    }
    return 0;
  };

  if (!drivers || drivers.length === 0) return null;

  const maxImpact = Math.max(
    ...drivers.map((driver) => Math.abs(getImpact(driver))),
    1
  );

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 p-4 transition-colors ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-300" />
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {title || t('forecast.driversTitle', { defaultValue: isRtl ? 'العوامل المؤثرة في التوقع (SHAP)' : 'What drives this forecast (SHAP)' })}
        </h4>
      </div>

      <ul className="space-y-2.5">
        {drivers.map((driver) => {
          const impact = getImpact(driver);
          const positive = impact >= 0;
          const width = Math.max(4, Math.round((Math.abs(impact) / maxImpact) * 100));
          return (
            <li key={driver.feature} className="flex items-center gap-3">
              <span className="w-48 shrink-0 text-[11px] text-slate-700 dark:text-slate-300 truncate" title={labelFor(driver.feature)}>
                {labelFor(driver.feature)}
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-950/70 overflow-hidden" dir="ltr">
                <div
                  className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span
                className={`w-16 shrink-0 text-[11px] font-mono font-semibold flex items-center justify-end gap-0.5 ${
                  positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
                dir="ltr"
              >
                {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {positive ? '+' : ''}
                {impact}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
