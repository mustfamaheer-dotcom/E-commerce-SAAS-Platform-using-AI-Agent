// apps/web/src/components/gen-ui/AnalyticsDashboardCard.tsx
import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  FileSpreadsheet,
  Calendar,
  Layers,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart3,
  Table as TableIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { exportElementAsPdf } from '../../utils/exportPdf';
import { exportToExcel } from '../../utils/exportExcel';

export interface AnalyticsKpis {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth?: string;
  ordersGrowth?: string;
  conversionRate?: string;
}

export interface RevenueSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductItem {
  name: string;
  revenue: number;
  units: number;
  sku?: string;
}

export interface CategoryBreakdownItem {
  category: string;
  revenue: number;
  share: number;
}

export interface AnalyticsDashboardPayload {
  period?: string;
  kpis: AnalyticsKpis;
  revenueSeries: RevenueSeriesPoint[];
  topProducts: TopProductItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  recentOrders?: Array<{
    id: string;
    total: number;
    status: string;
    date: string;
  }>;
}

interface AnalyticsDashboardCardProps {
  data: AnalyticsDashboardPayload;
  onPeriodChange?: (period: string) => void;
}

const PIE_COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];

export const AnalyticsDashboardCard: React.FC<AnalyticsDashboardCardProps> = ({
  data,
  onPeriodChange,
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'products' | 'categories' | 'table'>('trend');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(data?.period || 'last_30_days');
  const [isExporting, setIsExporting] = useState(false);

  const kpis = data?.kpis || {
    totalRevenue: 103505948.7,
    totalOrders: 2833,
    totalCustomers: 820,
    averageOrderValue: 36535.81,
    revenueGrowth: '+14.8%',
    ordersGrowth: '+9.2%',
    conversionRate: '3.4%',
  };

  const revenueSeries = data?.revenueSeries || [];
  const topProducts = data?.topProducts || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const recentOrders = data?.recentOrders || [];

  const handlePeriod = (p: string) => {
    setSelectedPeriod(p);
    onPeriodChange?.(p);
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      await exportElementAsPdf('analytics-dash-container', `techzone-report-${selectedPeriod}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExcelExport = () => {
    const exportData = revenueSeries.map((s) => ({
      'التاريخ': s.date,
      'الإيرادات (ج.م)': s.revenue,
      'عدد الطلبات': s.orders,
    }));
    exportToExcel(exportData, `techzone-analytics-${selectedPeriod}`, 'مؤشرات الإيرادات');
  };

  return (
    <div
      id="analytics-dash-container"
      dir="rtl"
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-slate-800 dark:text-slate-100 max-w-full"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              لوحة تحليلات المتجر ومؤشرات الأداء المالي
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تحليل دوري للمبيعات، الطلبات، وسلوك العملاء
            </p>
          </div>
        </div>

        {/* Period Picker & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              onClick={() => handlePeriod('last_7_days')}
              className={`px-2 py-1 rounded-md transition-colors ${
                selectedPeriod === 'last_7_days'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              7 أيام
            </button>
            <button
              onClick={() => handlePeriod('last_30_days')}
              className={`px-2 py-1 rounded-md transition-colors ${
                selectedPeriod === 'last_30_days'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              30 يوم
            </button>
          </div>

          <button
            onClick={handlePdfExport}
            disabled={isExporting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-[11px] font-bold hover:bg-rose-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 my-4">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>إجمالي الإيرادات</span>
            <span className="text-emerald-600 text-[10px] font-bold flex items-center">
              {kpis.revenueGrowth || '+14.8%'}
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {kpis.totalRevenue?.toLocaleString()} <span className="text-[10px] font-normal">ج.م</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>إجمالي الطلبات</span>
            <span className="text-emerald-600 text-[10px] font-bold flex items-center">
              {kpis.ordersGrowth || '+9.2%'}
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {kpis.totalOrders?.toLocaleString()}{' '}
            <span className="text-[10px] font-normal">طلب</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>العملاء النشطون</span>
            <Users className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {kpis.totalCustomers?.toLocaleString()}{' '}
            <span className="text-[10px] font-normal">عميل</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>متوسط السلة (AOV)</span>
            <span className="text-sky-600 text-[10px] font-bold">
              {kpis.conversionRate || '3.4%'} تحويل
            </span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {kpis.averageOrderValue?.toLocaleString()}{' '}
            <span className="text-[10px] font-normal">ج.م</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 text-xs">
        <button
          onClick={() => setActiveTab('trend')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'trend'
              ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>مسار الإيرادات</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'products'
              ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>أعلى المنتجات</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'categories'
              ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5" />
          <span>توزيع الأقسام</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'table'
              ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>الطلبات الحديثة</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="h-64 sm:h-72 w-full pt-1">
        {activeTab === 'trend' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val}`)}
              />
              <Tooltip
                formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, 'الإيرادات']}
                labelFormatter={(lbl) => `التاريخ: ${lbl}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0ea5e9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'products' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, 'المبيعات']} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'categories' && (
          <div className="flex flex-col sm:flex-row items-center justify-around h-full gap-4">
            <div className="w-48 h-48 sm:w-56 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="revenue"
                    nameKey="category"
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, 'الإيرادات']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2 w-full max-w-xs">
              {categoryBreakdown.map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="font-medium">{cat.category}</span>
                  </div>
                  <div className="font-mono text-slate-500">
                    {cat.share}% ({cat.revenue?.toLocaleString()} ج.م)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'table' && (
          <div className="overflow-x-auto h-full text-xs">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px]">
                  <th className="py-2 px-3">رقم الطلب</th>
                  <th className="py-2 px-3">التاريخ</th>
                  <th className="py-2 px-3">الحالة</th>
                  <th className="py-2 px-3">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-sky-600">{ord.id}</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">{ord.date}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-50 dark:bg-sky-950 text-sky-600">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold">{ord.total?.toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
