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
  blue: '#3B82F6',
  amber: '#F59E0B',
  rose: '#EF4444',
  gray: '#6B7280',
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
    color: COLOR_MAP[seg.badge_color] || '#4F46E5',
  }));

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 max-w-2xl font-sans"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            {isAr ? '📊 تحليل شرائح العملاء (Log-RFM)' : '📊 Customer RFM Segments'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? `إجمالي العملاء: ${data.total_customers} | جودة التجميع (Silhouette): ${data.silhouette_score}`
              : `Total Customers: ${data.total_customers} | Cluster Quality (Silhouette): ${data.silhouette_score}`}
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
          K-Means (K=5)
        </span>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-12} textAnchor="end" />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
            <Tooltip
              formatter={(val: number) => [`${val} ${isAr ? 'عميل' : 'customers'}`, isAr ? 'العدد' : 'Count']}
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #CBD5E1' }}
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
      <div className="grid grid-cols-1 gap-2.5 pt-2">
        {(data.segments || []).map((seg) => (
          <div
            key={seg.segment_name}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-150 hover:bg-slate-100 transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLOR_MAP[seg.badge_color] || '#6B7280' }}
                />
                <span className="font-semibold text-sm text-slate-800">{seg.segment_name}</span>
                <span className="text-xs text-slate-500">
                  ({seg.customer_count} {isAr ? 'عميل' : 'cust'})
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {isAr ? seg.recommended_action_ar : seg.recommended_action_en}
              </p>
            </div>

            <div className="text-right flex items-center gap-3">
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900">{seg.avg_monetary_egp.toLocaleString()}</span> ج.م
              </div>
              <button
                type="button"
                onClick={() => onCreatePromo?.(seg.segment_name)}
                className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                {isAr ? 'إنشاء خصم' : 'Create Promo'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
