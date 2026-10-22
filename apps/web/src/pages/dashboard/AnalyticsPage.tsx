// apps/web/src/pages/dashboard/AnalyticsPage.tsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Award, ArrowUpRight, BarChart2 } from 'lucide-react';

interface AnalyticsPageProps {
  tenantId?: string;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ tenantId }) => {
  const [summary, setSummary] = useState<any>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  });

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const activeTid = tenantId || 'tenant-moustafa-tech';

  useEffect(() => {
    fetch(`http://127.0.0.1:8001/api/v1/analytics/summary?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((d) => setSummary(d))
      .catch(() => {});

    fetch(`http://127.0.0.1:8001/api/v1/analytics/top-products?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((d) => setTopProducts(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`http://127.0.0.1:8001/api/v1/analytics/revenue?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          const maxRev = Math.max(...d.map((item: any) => item.revenue || 1), 1);
          setMonthlyData(
            d.map((item: any) => ({
              month: item.name,
              rev: Math.round(item.revenue),
              height: `${Math.max(12, Math.round((item.revenue / maxRev) * 100))}%`,
            }))
          );
        } else {
          setMonthlyData([]);
        }
      })
      .catch(() => {});
  }, [tenantId]);

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>لوحة تحليلات الإيرادات والأداء التجاري (Analytics & BI)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مؤشرات النمو، المبيعات الفعلية، ومتوسط قيمة سلة المشتريات
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي الإيرادات</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono font-black text-2xl text-slate-900 dark:text-slate-100">
            {summary.totalRevenue ? summary.totalRevenue.toLocaleString() : '0'} ج.م
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>إجمالي المبيعات المحققة</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي الطلبات المسددة</span>
            <ShoppingCart className="w-4 h-4 text-sky-500" />
          </div>
          <div className="font-mono font-black text-2xl text-slate-900 dark:text-slate-100">
            {summary.totalOrders || 0} طلب
          </div>
          <div className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
            متوسط {summary.averageOrderValue ? summary.averageOrderValue.toLocaleString() : '0'} ج.م للطلب
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>عدد العملاء النشطين</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="font-mono font-black text-2xl text-slate-900 dark:text-slate-100">
            {summary.totalCustomers || 0} عميل
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
            معدل التحويل: {summary.conversionRate || 0}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>منتجات الكتالوج</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-mono font-black text-2xl text-slate-900 dark:text-slate-100">
            {summary.totalProducts || 0} منتج
          </div>
          <div className="text-[11px] text-slate-400">مفعلة وجاهزة للشراء</div>
        </div>
      </div>

      {/* Visual Chart Strip & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
            تطور الإيرادات الشهرية (ج.م)
          </h3>
          {monthlyData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800 text-slate-400 space-y-2">
              <BarChart2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">لا توجد حركات مبيعات سابقة مسجلة لمتجرك حتى الآن</p>
              <p className="text-[11px]">ستظهر الرسوم البيانية التلقائية فور إتمام أول طلب شراء من متجرك</p>
            </div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.rev / 1000}k
                  </div>
                  <div
                    className="w-full max-w-[40px] bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                    style={{ height: d.height }}
                  ></div>
                  <span className="text-[10px] text-slate-500 font-medium">{d.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
            أعلى المنتجات من حيث القيمة
          </h3>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد مبيعات منتجات مسجلة بعد
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={p.id || idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[170px]">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {p.price?.toLocaleString()} ج.م
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
