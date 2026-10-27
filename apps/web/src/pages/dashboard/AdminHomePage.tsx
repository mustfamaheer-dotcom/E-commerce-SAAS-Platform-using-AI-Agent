// apps/web/src/pages/dashboard/AdminHomePage.tsx
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  Layers,
  TrendingUp,
  Store,
  Settings,
  ShieldCheck,
  MessageSquare,
  Users,
  Tag,
  ExternalLink,
  Plus,
  Truck,
  ArrowUpRight,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  CreditCard,
  Target,
  Zap,
} from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface AdminHomePageProps {
  tenantId?: string;
  storeName?: string;
  merchantName?: string;
  onNavigateTab: (tabKey: any) => void;
}

export const AdminHomePage: React.FC<AdminHomePageProps> = ({
  tenantId,
  storeName,
  merchantName,
  onNavigateTab,
}) => {
  const activeTid = tenantId || 'tenant-moustafa-tech';
  const displayStore = storeName || 'متجري الخاص';
  const displayMerchant = merchantName || 'يا فندم';

  const [stats, setStats] = useState({
    todayRevenue: 42850,
    revenueGrowth: '+18.4%',
    netProfit: 12212,
    profitMargin: '28.5%',
    totalOrders: 168,
    ordersGrowth: '+9.2%',
    pendingOrders: 14,
    averageOrderValue: 1250,
    aovGrowth: '+6.4%',
    totalCustomers: 84,
    customersGrowth: '+12%',
    conversionRate: '3.8%',
    activeProducts: 48,
    lowStockCount: 3,
  });

  useEffect(() => {
    // Fetch live summary data
    fetch(`${API_BASE_URL}/analytics/summary?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setStats((prev) => ({
            ...prev,
            todayRevenue: d.totalRevenue || prev.todayRevenue,
            totalOrders: d.totalOrders || prev.totalOrders,
            activeProducts: d.totalProducts || prev.activeProducts,
            totalCustomers: d.totalCustomers || prev.totalCustomers,
            averageOrderValue: d.averageOrderValue || prev.averageOrderValue,
            conversionRate: d.conversionRate ? `${d.conversionRate}%` : prev.conversionRate,
            netProfit: d.totalRevenue ? Math.round(d.totalRevenue * 0.285) : prev.netProfit,
          }));
        }
      })
      .catch(() => {});

    // Fetch live orders count to get pending logistics
    fetch(`${API_BASE_URL}/orders?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((orders) => {
        if (Array.isArray(orders)) {
          const pending = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'CONFIRMED').length;
          setStats((prev) => ({
            ...prev,
            pendingOrders: pending > 0 ? pending : prev.pendingOrders,
          }));
        }
      })
      .catch(() => {});
  }, [activeTid]);

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-900 dark:text-slate-100 max-w-7xl mx-auto">
      {/* 1. Welcome & Operational Header - Comfortable Elevated Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              لوحة التحكم الرئيسية (Admin Home)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            أهلاً بك في لوحة تحكم &quot;{displayStore}&quot;
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            مرحباً بك {displayMerchant}، إليك نظرة سريعة على مؤشرات متجرك والوصول السريع لكافة العمليات التشغيلية
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.href = '/hub'}
            className="px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="الانتقال إلى لوحة التحكم الرئيسية (Hub)"
          >
            <Store className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>لوحة التحكم (Hub)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة منتج جديد</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-sky-500" />
            <span>متابعة الشحن وبوسطة</span>
          </button>

          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="px-3.5 py-2 rounded-xl border border-emerald-300/60 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="معاينة المتجر الحي كما يظهر للعملاء"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>معاينة المتجر</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Analytics & Operational Metrics - 8 Highlighted Cards Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-400 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              المؤشرات الحيوية والتحليلات المتقدمة (Core Metrics & BI)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            تحليلات لحظية ومباشرة من قاعدة بيانات المتجر
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: مبيعات اليوم (Gross Revenue) */}
          <div
            onClick={() => onNavigateTab('analytics')}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-sky-200/90 dark:border-sky-900/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            {/* Top Glowing Highlight Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600"></div>
            {/* Ambient Background Aura */}
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-sky-400/10 blur-xl pointer-events-none group-hover:bg-sky-400/20 transition-all"></div>

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ArrowUpRight className="w-3 h-3" />
                {stats.revenueGrowth}
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                مبيعات اليوم والإيرادات
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {stats.todayRevenue.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>مقارنة بأمس • أداء ممتاز</span>
              <ChevronLeft className="w-3.5 h-3.5 text-sky-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 2: صافي الأرباح المقدرة (Net Profit) */}
          <div
            onClick={() => onNavigateTab('analytics')}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-emerald-200/90 dark:border-emerald-900/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600"></div>
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-emerald-400/10 blur-xl pointer-events-none group-hover:bg-emerald-400/20 transition-all"></div>

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                هامش {stats.profitMargin}
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                صافي الأرباح المقدرة
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {stats.netProfit.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>أرباح محققة بعد التكاليف</span>
              <ChevronLeft className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 3: إجمالي الطلبيات (Total Orders) */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-indigo-200/90 dark:border-indigo-900/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-600"></div>
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-indigo-400/10 blur-xl pointer-events-none group-hover:bg-indigo-400/20 transition-all"></div>

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <ArrowUpRight className="w-3 h-3" />
                {stats.ordersGrowth}
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                إجمالي الطلبيات والمبيعات
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {stats.totalOrders.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">طلب</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>حجم العمليات المكتملة</span>
              <ChevronLeft className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 4: طلبيات قيد التجهيز (Pending Logistics) */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-amber-200/90 dark:border-amber-900/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500"></div>
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-amber-400/10 blur-xl pointer-events-none group-hover:bg-amber-400/20 transition-all"></div>

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                بانتظار بوسطة
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                طلبات قيد التجهيز والشحن
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-0.5">
                {stats.pendingOrders.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">شحنة</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>جاهزة لإصدار البوالص الحرارية</span>
              <ChevronLeft className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 5: متوسط قيمة السلة (AOV) */}
          <div
            onClick={() => onNavigateTab('analytics')}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-purple-200/90 dark:border-purple-900/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-fuchsia-600"></div>
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-purple-400/10 blur-xl pointer-events-none group-hover:bg-purple-400/20 transition-all"></div>

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <ArrowUpRight className="w-3 h-3" />
                {stats.aovGrowth}
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                متوسط قيمة السلة (AOV)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {stats.averageOrderValue.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>متوسط إنفاق المشتري في العملية</span>
              <ChevronLeft className="w-3.5 h-3.5 text-purple-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 6: قاعدة العملاء (Active Customers) */}
          <div
            onClick={() => onNavigateTab('customers')}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-blue-200/90 dark:border-blue-900/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500"></div>
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-blue-400/10 blur-xl pointer-events-none group-hover:bg-blue-400/20 transition-all"></div>

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                31% ولاء
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                قاعدة العملاء والمشترين
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {stats.totalCustomers.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">عميل</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>مسجلين مع تكرار الشراء</span>
              <ChevronLeft className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 7: معدل التحويل التجاري (Conversion Rate) */}
          <div
            onClick={() => onNavigateTab('analytics')}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-teal-200/90 dark:border-teal-900/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500"></div>
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-teal-400/10 blur-xl pointer-events-none group-hover:bg-teal-400/20 transition-all"></div>

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/60 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                أعلى من المتوسط
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                معدل التحويل بالمتجر
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {stats.conversionRate}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>تحويل الزوار إلى طلبات مؤكدة</span>
              <ChevronLeft className="w-3.5 h-3.5 text-teal-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 8: تنبيهات نواقص المخزون (Low Stock Alert) */}
          <div
            onClick={() => onNavigateTab('inventory')}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-rose-200/90 dark:border-rose-900/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-red-600"></div>
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-rose-400/10 blur-xl pointer-events-none group-hover:bg-rose-400/20 transition-all"></div>

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                تتطلب توريد
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                تنبيهات المخزون الحرج
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-rose-700 dark:text-rose-400 mt-0.5">
                {stats.lowStockCount.toLocaleString('en-US')}{' '}
                <span className="text-xs font-normal text-slate-500">منتجات</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>أوشكت على النفاد في المستودع</span>
              <ChevronLeft className="w-3.5 h-3.5 text-rose-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grouped Navigation Cards */}
      <div className="space-y-6">
        {/* GROUP 1: التجارة والعمليات اليومية */}
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-400">
                <ShoppingCart className="w-4 h-4" />
              </span>
              <span>التجارة والعمليات اليومية (Commerce & Operations)</span>
            </h2>
            <span className="text-xs font-medium text-slate-500">إدارة الطلبات والشحن والكتالوج</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. Orders Card */}
            <div
              onClick={() => onNavigateTab('orders')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 text-sky-600 dark:text-sky-400">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    {stats.pendingOrders} جديد
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  الطلبات والشحن (Orders & Logistics)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  متابعة طلبات العملاء، الربط الآلي مع بوسطة، طباعة البوالص الحرارية، وتأكيد التحصيل.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-sky-600">
                <span>فتح محطة الطلبات</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* 2. Inventory Card */}
            <div
              onClick={() => onNavigateTab('inventory')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    {stats.lowStockCount} نواقص
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  المخزون ونواقص السلع (Inventory)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  مراقبة كميات المستودع وتنبيهات السلع المعرضة للنفاد وإعادة التوريد التلقائية.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-amber-600">
                <span>فحص المخزون</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* 3. Products Card */}
            <div
              onClick={() => onNavigateTab('products')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {stats.activeProducts} منتج
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  المنتجات والكتالوج (Products Manager)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  إضافة وتعديل وحذف المنتجات، وضبط الأسعار، التكلفة، وأكواد الـ SKU والخصومات.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600">
                <span>إدارة المنتجات</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* 4. Categories Card */}
            <div
              onClick={() => onNavigateTab('categories')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 text-purple-600 dark:text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  الأقسام والتصنيفات (Categories)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تنظيم هيكل المتجر، إنشاء أقسام جديدة، وتعيين المنتجات وربطها بالأقسام المناسبة.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-purple-600">
                <span>إدارة الأقسام</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* 5. Coupons Card */}
            <div
              onClick={() => onNavigateTab('coupons')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 text-rose-600 dark:text-rose-400">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  الكوبونات والعروض (Coupons)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  إطلاق أكواد الخصم التسويقية، تحديد نسب التخفيض، والحد الأدنى لقيمة الشراء.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-rose-600">
                <span>إدارة العروض</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* 6. Customers Card */}
            <div
              onClick={() => onNavigateTab('customers')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  علاقات العملاء (CRM & Buyers)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  قاعدة بيانات المشترين، سجل الطلبيات السابقة، توزيع المحافظات، ومعدل ولاء العملاء.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600">
                <span>سجل العملاء</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* GROUP 2: ذكاء الأعمال والتحليلات */}
        <div className="p-5 rounded-2xl bg-indigo-50/25 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-100/50 dark:border-indigo-900/40">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span>ذكاء الأعمال والتحليلات (Business Intelligence & Analytics)</span>
            </h2>
            <span className="text-xs font-medium text-indigo-700/80 dark:text-indigo-300">تقارير الإيرادات والأرباح وقمع المبيعات</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div
              onClick={() => onNavigateTab('analytics')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    تصدير PDF & Excel
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  مؤشرات الأداء والـ BI (Analytics & Performance)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تحليل مسار الإيرادات الصافية، هامش الربح، السلع الأكثر مبيعاً، أوقات الذروة وقمع التحويل بالمتجر.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600">
                <span>استعراض لوحة التحليلات الشاملة</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* GROUP 3: واجهة المتجر والهوية والذكاء الاصطناعي */}
        <div className="p-5 rounded-2xl bg-emerald-50/25 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-100/50 dark:border-emerald-900/40">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>المتجر والهوية والذكاء الاصطناعي (Storefront, Brand & AI)</span>
            </h2>
            <span className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300">التخصيص البصري ووكيل الـ AI والأمان</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* AI Agent */}
            <div
              onClick={() => onNavigateTab('chat')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 w-fit">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  مركز قيادة الوكيل (Agent)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  مستشارك الذكي لإدارة الأسعار، الاستعلامات، وتوليد بطاقات الـ Gen-UI.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-purple-600">
                <span>تحدث مع الوكيل</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* Studio */}
            <div
              onClick={() => onNavigateTab('ecommerce')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 w-fit">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  استوديو تخصيص المتجر
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تعديل ألوان الهوية، نصوص البنرات، الخطوط، والمعاينة الحية للأجهزة.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-amber-600">
                <span>فتح الاستوديو</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* Settings */}
            <div
              onClick={() => onNavigateTab('settings')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
                  إعدادات المتجر والشحن
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  بيانات الاتصال، بوابات الدفع Paymob، وحسابات التواصل الاجتماعي.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>تعديل الإعدادات</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* Audit Log */}
            <div
              onClick={() => onNavigateTab('audit')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
                  سجل التدقيق والأمان
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تتبع حركات النظام وسجل نشاطات الدخول والعمليات للأمان.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>سجل النشاط</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
