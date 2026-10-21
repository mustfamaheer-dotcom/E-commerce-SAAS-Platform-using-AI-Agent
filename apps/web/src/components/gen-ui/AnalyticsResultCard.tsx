// apps/web/src/components/gen-ui/AnalyticsResultCard.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart2,
  LineChart as LineChartIcon,
  Table as TableIcon,
  PieChart as PieChartIcon,
  Download,
  TrendingUp,
  DollarSign,
  Maximize2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SqlQueryDrawer } from './SqlQueryDrawer';

export interface AnalyticsResultPayload {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  verifiedSql: string;
  chartHint?: 'bar' | 'line' | 'pie' | 'table' | 'kpi' | string;
  isCached?: boolean;
  title?: string;
}

interface AnalyticsResultCardProps {
  data: AnalyticsResultPayload;
}

const CHART_COLORS = ['#6366F1', '#38BDF8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export const AnalyticsResultCard: React.FC<AnalyticsResultCardProps> = ({ data }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith('ar');

  const initialView = data.chartHint === 'table' ? 'table' : 'chart';
  const [viewMode, setViewMode] = useState<'chart' | 'table'>(initialView);

  const { columns, rows, rowCount, executionTimeMs, verifiedSql, isCached } = data;
  const chartType = data.chartHint || 'bar';

  // Export to CSV function
  const handleExportCsv = () => {
    if (!rows || rows.length === 0) return;
    const header = columns.join(',');
    const body = rows.map((r) => columns.map((c) => JSON.stringify(r[c] ?? '')).join(',')).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(`${header}\n${body}`);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `analytics_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Primary X and Y axis keys detection
  const xKey = columns[0] || 'name';
  const metricKeys = columns.slice(1).filter((c) => {
    return rows.some((r) => typeof r[c] === 'number');
  });
  const primaryMetric = metricKeys[0] || columns[1] || 'value';

  // Format currency tooltip
  const formatValue = (val: any) => {
    if (typeof val === 'number') {
      return `${val.toLocaleString()} ${isRtl ? 'ج.م' : 'EGP'}`;
    }
    return val;
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden my-4"
    >
      {/* Card Header & Controls */}
      <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {chartType === 'line' ? (
              <LineChartIcon className="w-5 h-5" />
            ) : chartType === 'pie' ? (
              <PieChartIcon className="w-5 h-5" />
            ) : (
              <BarChart2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">
              {data.title || (isRtl ? 'لوحة تحليلات ذكاء الأعمال التخاطبي (BI)' : 'Conversational BI Analytics')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isRtl ? `عرض تحليلي استناداً إلى ${rowCount} صف بيانات` : `Visual analysis based on ${rowCount} records`}
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                viewMode === 'chart'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'رسم بياني' : 'Chart'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{isRtl ? 'جدول' : 'Table'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            title={isRtl ? 'تصدير كملف CSV / Excel' : 'Export to CSV / Excel'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {viewMode === 'chart' ? (
          <div className="w-full h-72">
            {chartType === 'line' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey={xKey} stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString()} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [formatValue(val), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  {metricKeys.map((k, i) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : chartType === 'pie' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [formatValue(val), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Pie
                    data={rows}
                    dataKey={primaryMetric}
                    nameKey={xKey}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label
                  >
                    {rows.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey={xKey} stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString()} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [formatValue(val), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  {metricKeys.length > 0 ? (
                    metricKeys.map((k, i) => (
                      <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[6, 6, 0, 0]} />
                    ))
                  ) : (
                    <Bar dataKey={primaryMetric} fill="#6366F1" radius={[6, 6, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 text-slate-300 sticky top-0 border-b border-slate-700">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-2.5 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2.5 text-slate-200">
                        {typeof r[col] === 'number' ? r[col].toLocaleString() : String(r[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Collapsible Verified SQL Drawer */}
        {verifiedSql && (
          <SqlQueryDrawer
            sql={verifiedSql}
            executionTimeMs={executionTimeMs}
            rowCount={rowCount}
            isCached={isCached}
          />
        )}
      </div>
    </div>
  );
};
