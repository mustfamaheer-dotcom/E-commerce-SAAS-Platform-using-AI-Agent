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

export interface SegmentInfo {
  segment_name: string;
  customer_count: number;
  avg_recency_days: number;
  avg_frequency: number;
  avg_monetary_egp: number;
  recommended_action_en: string;
  recommended_action_ar: string;
  badge_color: string;
}

export interface CustomerSegmentsPayload {
  tenant_id: string;
  silhouette_score: number;
  total_customers: number;
  segments: SegmentInfo[];
  retention_insight?: {
    at_risk_count: number;
    recommended_action_ar: string;
    recommended_action_en: string;
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

  const chartData = (data.segments || []).map((seg) => ({
    name: seg.segment_name,
    customers: seg.customer_count,
    spend: seg.avg_monetary_egp,
    color: COLOR_MAP[seg.badge_color] || '#38BDF8',
  }));

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-4 space-y-3.5 max-w-2xl font-sans text-slate-100"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-sky-950/60 border border-sky-800/80 flex items-center justify-center text-sky-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              {isAr ? 'تحليل شرائح العملاء (Log-RFM)' : 'Customer RFM Segmentation'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? `إجمالي العملاء: ${data.total_customers} | جودة التجميع (Silhouette): ${data.silhouette_score}`
                : `Total: ${data.total_customers} | Silhouette Score: ${data.silhouette_score}`}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-950 text-slate-300 rounded-md border border-slate-800">
          K-Means (K=5)
        </span>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={0} angle={-12} textAnchor="end" />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
            <Tooltip
              formatter={(val: number) => [`${val} ${isAr ? 'عميل' : 'customers'}`, isAr ? 'العدد' : 'Count']}
              contentStyle={{ backgroundColor: '#0F172A', borderRadius: 6, fontSize: 11, border: '1px solid #334155', color: '#F1F5F9' }}
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
        {(data.segments || []).map((seg) => (
          <div
            key={seg.segment_name}
            className="flex items-center justify-between p-2.5 rounded-md bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLOR_MAP[seg.badge_color] || '#64748B' }}
                />
                <span className="font-medium text-xs text-slate-200">{seg.segment_name}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({seg.customer_count} {isAr ? 'عميل' : 'cust'})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isAr ? seg.recommended_action_ar : seg.recommended_action_en}
              </p>
            </div>

            <div className="text-right flex items-center gap-2.5 shrink-0">
              <div className="text-xs text-slate-300 font-mono">
                {seg.avg_monetary_egp.toLocaleString()} ج.م
              </div>
              <button
                type="button"
                onClick={() => onCreatePromo?.(seg.segment_name)}
                className="px-2 py-1 text-[11px] font-medium text-sky-400 bg-slate-900 border border-sky-800/60 rounded hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                <span>{isAr ? 'إنشاء خصم' : 'Promo'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
