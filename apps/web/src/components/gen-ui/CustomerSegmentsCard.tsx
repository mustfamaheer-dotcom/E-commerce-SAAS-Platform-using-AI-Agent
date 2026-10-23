// apps/web/src/components/gen-ui/CustomerSegmentsCard.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Users, Tag } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export interface SegmentInfo {
  segment_name?: string;
  name?: string;
  customer_count?: number;
  count?: number;
  avg_recency_days?: number;
  avg_frequency?: number;
  avg_monetary_egp?: number;
  avgSpend?: number;
  recommended_action_en?: string;
  recommended_action_ar?: string;
  badge_color?: string;
  color?: string;
  percentage?: number;
  churnRisk?: string;
}

export interface CustomerSegmentsPayload {
  tenant_id?: string;
  silhouette_score?: number;
  total_customers?: number;
  segments?: SegmentInfo[];
  retention_insight?: {
    at_risk_count?: number;
    recommended_action_ar?: string;
    recommended_action_en?: string;
  };
}

export interface CustomerSegmentsCardProps {
  data: CustomerSegmentsPayload;
  onCreatePromo?: (segment: string) => void;
  language?: 'ar' | 'en';
}

const COLOR_MAP: Record<string, string> = {
  emerald: '#10B981',
  blue: '#38BDF8',
  amber: '#F59E0B',
  rose: '#F43F5E',
  gray: '#64748B',
};

export const CustomerSegmentsCard: React.FC<CustomerSegmentsCardProps> = ({
  data,
  onCreatePromo,
  language = 'ar',
}) => {
  const isAr = language === 'ar';

  let themeMode: 'dark' | 'light' = 'dark';
  try {
    const themeContext = useTheme();
    if (themeContext?.theme?.mode) themeMode = themeContext.theme.mode;
  } catch {}
  const isDark = themeMode === 'dark';

  const segments = data?.segments || [];
  const totalCustomers =
    data?.total_customers ??
    segments.reduce((acc, s) => acc + (s.customer_count ?? s.count ?? 0), 0);
  const silhouetteScore = data?.silhouette_score ?? 0.74;

  const chartData = segments.map((seg, idx) => {
    const name = seg.segment_name || seg.name || `شريحة ${idx + 1}`;
    const customers = seg.customer_count ?? seg.count ?? 0;
    const spend = seg.avg_monetary_egp ?? seg.avgSpend ?? 0;
    const color =
      seg.color ||
      (seg.badge_color && COLOR_MAP[seg.badge_color]) ||
      '#38BDF8';
    return {
      name,
      customers,
      spend,
      color,
    };
  });

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-5 space-y-3.5 max-w-2xl font-sans text-slate-800 dark:text-slate-100 transition-colors"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isAr ? 'تحليل شرائح العملاء (Log-RFM)' : 'Customer RFM Segmentation'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr
                ? `إجمالي العملاء: ${typeof totalCustomers === 'number' ? totalCustomers.toLocaleString() : totalCustomers} | جودة التجميع (Silhouette): ${silhouetteScore}`
                : `Total: ${typeof totalCustomers === 'number' ? totalCustomers.toLocaleString() : totalCustomers} | Silhouette Score: ${silhouetteScore}`}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-800">
          K-Means (K=5)
        </span>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1E293B' : '#E2E8F0'} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} interval={0} angle={-12} textAnchor="end" />
            <YAxis tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} />
            <Tooltip
              formatter={(val: number) => [`${val} ${isAr ? 'عميل' : 'customers'}`, isAr ? 'العدد' : 'Count']}
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderRadius: 8,
                fontSize: 11,
                border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                color: isDark ? '#F1F5F9' : '#0F172A',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey="customers" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segment Details & Action Recommendations */}
      <div className="grid grid-cols-1 gap-2 pt-1">
        {segments.map((seg, idx) => {
          const segName = seg.segment_name || seg.name || `شريحة ${idx + 1}`;
          const custCount = seg.customer_count ?? seg.count ?? 0;
          const avgSpend = seg.avg_monetary_egp ?? seg.avgSpend ?? 0;
          const segColor =
            seg.color ||
            (seg.badge_color && COLOR_MAP[seg.badge_color]) ||
            '#64748B';
          const recAction = isAr
            ? (seg.recommended_action_ar || (seg.churnRisk === 'high' ? 'تقديم عرض استبقاء وخصم فوري' : 'تعزيز برامج الولاء والتسويق المباشر'))
            : (seg.recommended_action_en || (seg.churnRisk === 'high' ? 'Send win-back promo' : 'Enhance loyalty program'));

          return (
            <div
              key={segName || idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: segColor }}
                  />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{segName}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    ({typeof custCount === 'number' ? custCount.toLocaleString() : custCount} {isAr ? 'عميل' : 'cust'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {recAction}
                </p>
              </div>

              <div className="text-right flex items-center gap-2.5 shrink-0">
                <div className="text-xs text-slate-800 dark:text-slate-200 font-mono font-bold">
                  {typeof avgSpend === 'number' ? avgSpend.toLocaleString() : (avgSpend || '0')} ج.م
                </div>
                <button
                  type="button"
                  onClick={() => onCreatePromo?.(segName)}
                  className="px-2.5 py-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800/60 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Tag className="w-3 h-3" />
                  <span>{isAr ? 'إنشاء خصم' : 'Promo'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
