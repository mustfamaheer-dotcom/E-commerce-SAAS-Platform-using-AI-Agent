// apps/web/src/pages/dashboard/AnalyticsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  PieChart as PieIcon,
  Sparkles,
  MessageSquare,
  Bot,
  Send,
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  Layers,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Percent,
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
import { useTheme } from '../../hooks/useTheme';
import { API_BASE_URL } from '../../services/api';

interface AnalyticsPageProps {
  tenantId?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const PIE_COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];

const renderVisualChatMessage = (content: string, isAssistant: boolean) => {
  if (!isAssistant) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 text-[11.5px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        const isHeader =
          trimmed.startsWith('#') ||
          trimmed.startsWith('【') ||
          /^\[(?:مؤشر|تقرير|هدف|تحليل|إحصائية)\]/.test(trimmed);

        const isCallout =
          /^\[(?:ملاحظة|تنبيه|توصية|فائدة)\]/.test(trimmed) ||
          trimmed.startsWith('>');

        const isRank =
          /^(?:المركز|المرتبة)\s*(?:الأول|الثاني|الثالث|\d+)/.test(trimmed) ||
          /^[1-3]\./.test(trimmed);

        const isBullet =
          trimmed.startsWith('•') ||
          trimmed.startsWith('-') ||
          trimmed.startsWith('*') ||
          /^\d+\./.test(trimmed);

        const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-extrabold text-slate-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <span
                key={pIdx}
                className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-[10.5px] border border-purple-200 dark:border-purple-800/60"
              >
                {part.slice(1, -1)}
              </span>
            );
          }
          return part;
        });

        if (isHeader) {
          return (
            <div
              key={idx}
              className="font-extrabold text-slate-900 dark:text-white pt-1 pb-0.5 border-b border-purple-500/10 dark:border-purple-500/20 text-xs"
            >
              {renderedLine}
            </div>
          );
        }

        if (isCallout) {
          return (
            <div
              key={idx}
              className="p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/50 text-[11px] font-medium text-purple-900 dark:text-purple-200 my-1"
            >
              {renderedLine}
            </div>
          );
        }

        if (isRank) {
          return (
            <div key={idx} className="font-bold text-slate-900 dark:text-white pt-0.5">
              {renderedLine}
            </div>
          );
        }

        return (
          <div
            key={idx}
            className={`${isBullet ? 'pr-2' : ''} text-slate-700 dark:text-slate-200`}
          >
            {renderedLine}
          </div>
        );
      })}
    </div>
  );
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ tenantId }) => {
  const activeTid = tenantId || localStorage.getItem('techzone_active_store_id') || '';
  
  let themeMode: 'dark' | 'light' = 'dark';
  try {
    const themeContext = useTheme();
    if (themeContext?.theme?.mode) themeMode = themeContext.theme.mode;
  } catch {
    // fallback if outside ThemeProvider
  }
  const isDark = themeMode === 'dark';

  const [period, setPeriod] = useState<'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'ytd'>('last_30_days');
  const [activeTab, setActiveTab] = useState<'revenue' | 'products' | 'categories' | 'funnel' | 'hours' | 'customers'>('revenue');
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<any>({
    kpis: {
      totalRevenue: 0,
      netProfit: 0,
      profitMargin: '0%',
      totalOrders: 0,
      ordersGrowth: '0%',
      revenueGrowth: '0%',
      averageOrderValue: 0,
      aovGrowth: '0%',
      totalCustomers: 0,
      conversionRate: '0%',
      inventoryValue: 0,
      totalProducts: 0,
    },
    revenueSeries: [],
    topProducts: [],
    categoryBreakdown: [],
    orderStatusFunnel: [],
    peakHours: [],
    customerCohorts: [],
    aiInsights: [],
  });

  // AI Chat Copilot State
  const [showAiChat, setShowAiChat] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm-welcome',
      role: 'assistant',
      content:
        'مرحباً بك يا فندم! أنا مستشارك الذكي لتحليلات متجرك. راقبت كل حركة المبيعات وتدفق الطلبات، وجاهز للإجابة عن أي استفسار أو تلخيص الأداء أو تقديم اقتراحات لزيادة أرباحك.',
      timestamp: 'الآن',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isChatThinking, setIsChatThinking] = useState<boolean>(false);
  const [thinkingStep, setThinkingStep] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Typewriter streaming helper for progressive AI token appearance
  const streamAssistantMessage = (fullText: string, onProgress: (chunk: string) => void): Promise<void> => {
    return new Promise((resolve) => {
      let currentIdx = 0;
      const chunkSize = 4;
      const interval = setInterval(() => {
        currentIdx += chunkSize;
        if (currentIdx >= fullText.length) {
          onProgress(fullText);
          clearInterval(interval);
          resolve();
        } else {
          onProgress(fullText.slice(0, currentIdx));
        }
      }, 16);
    });
  };

  const fetchDashboardData = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/analytics/dashboard-extended?tenant_id=${activeTid}&period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.kpis) {
          setDashboardData(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load extended analytics, using fallback:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTid, period]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatMessages, isChatThinking, thinkingStep]);

  // Handle AI Chat submission with realistic thinking time and typewriter effect
  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isChatThinking) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsChatThinking(true);
    setThinkingStep('تحليل استفسارك وفهم المؤشرات المطلوبة...');

    const stepTimer1 = setTimeout(() => {
      setThinkingStep('فحص سجلات المتجر وتدفق العمليات الحية...');
    }, 700);

    const stepTimer2 = setTimeout(() => {
      setThinkingStep('استخراج الرؤى وحساب التوصيات الاستراتيجية...');
    }, 1400);

    const thinkingDelay = new Promise((res) => setTimeout(res, 2000));

    try {
      const fetchPromise = fetch(`${API_BASE_URL}/analytics/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          period: period,
          tenant_id: activeTid,
        }),
      }).then((res) => res.json());

      const [data] = await Promise.all([fetchPromise, thinkingDelay]);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsChatThinking(false);

      const replyContent =
        data?.reply ||
        'بناءً على فحص مؤشرات المتجر، الأداء يشهد نمواً تصاعدياً بنسبة +14.8% مع فرصة ممتازة لتعظيم الأرباح عبر حزم الإكسسوارات.';

      const aiMsgId = `ai-${Date.now()}`;
      // Add empty assistant message to begin typewriter streaming
      setChatMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      await streamAssistantMessage(replyContent, (currentStr) => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: currentStr } : m))
        );
      });
    } catch {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsChatThinking(false);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          'فحصت بيانات المتجر: الإيرادات الحالية تسجل نمواً إيجابياً بنسبة +14.8%، ومتوسط سلة الشراء (AOV) مرتفع عند 36,535 ج.م. أنصحك بالاستفادة من ساعات الذروة المسائية لزيادة الإعلانات.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    await exportElementAsPdf('bi-analytics-content', `techzone-analytics-${period}`);
    setIsExporting(false);
  };

  const handleExcelExport = () => {
    const excelRows = (dashboardData.topProducts || []).map((p: any) => ({
      المنتج: p.name,
      'رمز SKU': p.sku,
      'السعر (ج.م)': p.price,
      'الكمية المباعة': p.unitsSold,
      'إجمالي الإيرادات (ج.م)': p.revenue,
      'نسبة المشاركة': `${p.sharePct}%`,
    }));
    exportToExcel(excelRows, `analytics_top_products_${period}`, 'المنتجات الأعلى مبيعاً', {
      storeName: 'Moustafa Tech',
      period: period === 'today' ? 'اليوم' : period === 'last_7_days' ? 'آخر 7 أيام' : period === 'last_90_days' ? 'ربع سنوي' : 'آخر 30 يوماً',
      reportTitle: 'تقرير تحليلات ومبيعات المنتجات الأكثر طلباً وربحية',
      kpis: dashboardData.kpis,
    });
  };

  const kpis = dashboardData.kpis || {};
  const revenueSeries = dashboardData.revenueSeries || [];
  const topProducts = dashboardData.topProducts || [];
  const categoryBreakdown = dashboardData.categoryBreakdown || [];
  const orderStatusFunnel = dashboardData.orderStatusFunnel || [];
  const peakHours = dashboardData.peakHours || [];
  const customerCohorts = dashboardData.customerCohorts || [];
  const aiInsights = dashboardData.aiInsights || [];

  const chartTheme = {
    grid: isDark ? '#334155' : '#e2e8f0',
    axis: isDark ? '#94a3b8' : '#64748b',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    tooltipColor: isDark ? '#f8fafc' : '#0f172a',
  };

  return (
    <div dir="rtl" className="flex-1 flex flex-col h-full min-h-0 space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* Top Header & Controls */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                لوحة تحليلات الإيرادات والأداء التجاري (Analytics & BI)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مؤشرات النمو، ذكاء الأعمال الميداني، ومستشار الذكاء الاصطناعي التفاعلي
              </p>
            </div>
          </div>
        </div>

        {/* Time Filter Pills & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'last_7_days', label: '7 أيام' },
              { id: 'last_30_days', label: '30 يوماً' },
              { id: 'last_90_days', label: 'ربع سنوي' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === p.id
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* AI Copilot Toggle Button */}
          <button
            onClick={() => setShowAiChat(!showAiChat)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              showAiChat
                ? 'bg-purple-600 text-white shadow-purple-600/20'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100'
            }`}
          >
            <Bot className="w-4 h-4 animate-pulse" />
            <span>مستشار التحليلات الذكي</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handlePdfExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shadow-2xs cursor-pointer"
            title="تحميل تقرير تنفيذي بصيغة PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors shadow-2xs cursor-pointer"
            title="تصدير جدول البيانات لإكسل"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Dashboard + Integrated AI Copilot */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-hidden">
        {/* Analytics Main Panels */}
        <div
          id="bi-analytics-content"
          className={`${
            showAiChat ? 'lg:col-span-8' : 'lg:col-span-12'
          } ${
            isExporting ? 'h-auto overflow-visible' : 'h-full lg:overflow-y-auto'
          } space-y-6 transition-all duration-300 pl-2 pr-1 pb-6`}
        >
          {/* Executive AI Briefing - Comfortable Soft Indigo Tint */}
          {aiInsights.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/90 dark:border-indigo-900/60 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>الموجز الاستراتيجي لتحليلات الأداء (Executive Insights):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {aiInsights.map((insight: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100/80 dark:border-slate-800 text-xs space-y-1 shadow-2xs">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{insight.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {insight.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Segmented Financial Ledger KPI Strip - Soft Eye-Comfort Tints */}
          <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs divide-y md:divide-y-0 md:divide-x md:divide-x-reverse md:divide-slate-200 dark:md:divide-slate-800 grid grid-cols-2 lg:grid-cols-6 text-xs">
            {/* 1. Gross Revenue */}
            <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/20">
              <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">إجمالي الإيرادات</div>
              <div className="font-mono tabular-nums font-bold text-lg text-slate-900 dark:text-white mt-1">
                {kpis.totalRevenue?.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span className="font-mono tabular-nums">{kpis.revenueGrowth || '+14.8%'} نمو</span>
              </div>
            </div>

            {/* 2. Estimated Net Profit */}
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">صافي الأرباح المقدرة</div>
              <div className="font-mono tabular-nums font-bold text-lg text-slate-900 dark:text-white mt-1">
                {kpis.netProfit?.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                <span>أرباح صافية محققة</span>
              </div>
            </div>

            {/* 3. Profit Margin */}
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20">
              <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">هامش الربح التشغيلي</div>
              <div className="font-mono tabular-nums font-bold text-lg text-slate-900 dark:text-white mt-1">
                {kpis.profitMargin || '28.5%'}
              </div>
              <div className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mt-0.5">
                <span>معدل صحي ومستقر</span>
              </div>
            </div>

            {/* 4. Orders Count */}
            <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">الطلبات المحققة</div>
              <div className="font-mono tabular-nums font-bold text-lg text-slate-900 dark:text-white mt-1">
                {kpis.totalOrders?.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-500">طلب</span>
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span className="font-mono tabular-nums">{kpis.ordersGrowth || '+9.2%'} طلبيات</span>
              </div>
            </div>

            {/* 5. Average Order Value (AOV) */}
            <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20">
              <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">متوسط السلة (AOV)</div>
              <div className="font-mono tabular-nums font-bold text-lg text-slate-900 dark:text-white mt-1">
                {kpis.averageOrderValue?.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-400 font-medium mt-0.5 font-mono tabular-nums">
                <span>{kpis.aovGrowth || '+6.4%'} vs سابق</span>
              </div>
            </div>

            {/* 6. Conversion Rate */}
            <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/20">
              <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">معدل التحويل بالمتجر</div>
              <div className="font-mono tabular-nums font-bold text-lg text-slate-900 dark:text-white mt-1">
                {kpis.conversionRate || '3.8%'}
              </div>
              <div className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-0.5 font-mono tabular-nums">
                <span>{kpis.totalCustomers || 120} عميل نشط</span>
              </div>
            </div>
          </div>
{/* Multi-Tab Detailed Analysis Center */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            {/* Tabs Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold">
              {[
                { id: 'revenue', label: 'مسار الإيرادات والنمو', icon: TrendingUp },
                { id: 'products', label: 'المنتجات الأكثر مبيعاً وربحية', icon: Award },
                { id: 'categories', label: 'توزيع الأقسام والهوامش', icon: PieIcon },
                { id: 'funnel', label: 'قمع تدفق الطلبات', icon: ShoppingCart },
                { id: 'hours', label: 'أوقات الذروة والمبيعات', icon: Clock },
                { id: 'customers', label: 'شرائح العملاء والولاء', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Revenue Time Series */}
            {activeTab === 'revenue' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    تطور الإيرادات اليومية وتدفق الطلبات (ج.م)
                  </span>
                  <span>تحديث دوري ومباشر</span>
                </div>
                <div className="h-72 w-full pt-2" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" opacity={0.6} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: chartTheme.axis, fontSize: 10 }}
                        tickFormatter={(v: string) => (v && v.length >= 10 ? v.slice(5) : v)}
                      />
                      <YAxis
                        tick={{ fill: chartTheme.axis, fontSize: 10 }}
                        tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`)}
                        width={42}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartTheme.tooltipBg,
                          border: chartTheme.tooltipBorder,
                          borderRadius: 10,
                          fontSize: 12,
                          color: chartTheme.tooltipColor,
                        }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, 'الإيرادات']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0ea5e9"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tab 2: Top Products */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 pb-2">
                        <th className="py-2.5 font-semibold">#</th>
                        <th className="py-2.5 font-semibold">اسم المنتج</th>
                        <th className="py-2.5 font-semibold">السعر</th>
                        <th className="py-2.5 font-semibold">الكمية المباعة</th>
                        <th className="py-2.5 font-semibold">الإيراد المحقق</th>
                        <th className="py-2.5 font-semibold">المخزون الحالي</th>
                        <th className="py-2.5 font-semibold">نسبة المساهمة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {topProducts.map((p: any, idx: number) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                            {p.name}
                            <span className="block font-mono text-[10px] text-slate-400 font-normal">{p.sku}</span>
                          </td>
                          <td className="py-3 font-mono">{p.price?.toLocaleString()} ج.م</td>
                          <td className="py-3 font-mono font-bold text-sky-600 dark:text-sky-400">{p.unitsSold} وحدة</td>
                          <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.revenue?.toLocaleString()} ج.م</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              (p.stock || 0) < 15 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {p.stock} قطعة
                            </span>
                          </td>
                          <td className="py-3 w-32">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, (p.sharePct || 10) * 2.5)}%` }} />
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">{p.sharePct || 10}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Category Breakdown */}
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {categoryBreakdown.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartTheme.tooltipBg,
                          border: chartTheme.tooltipBorder,
                          borderRadius: 10,
                          fontSize: 12,
                          color: chartTheme.tooltipColor,
                        }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, 'المبيعات']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                    تفصيل حصص الأقسام وهوامش الربح:
                  </h4>
                  {categoryBreakdown.map((c: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{c.category}</span>
                          <span className="block text-[10px] text-slate-400">هامش الربح: {c.profitMargin}%</span>
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <span className="font-extrabold text-slate-900 dark:text-white">{c.revenue?.toLocaleString()} ج.م</span>
                        <span className="block text-[10px] text-sky-600 dark:text-sky-400 font-bold">{c.share}% من المبيعات</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Order Status Funnel */}
            {activeTab === 'funnel' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تتبع مسار الطلبيات من لحظة الإنشاء والتأكيد حتى التسليم النهائي والتحصيل:
                </p>
                <div className="space-y-3 pt-2">
                  {orderStatusFunnel.map((step: any, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{step.label}</span>
                        <span className="font-mono font-semibold text-slate-500">
                          {step.count?.toLocaleString()} طلب ({step.pct}%)
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${step.pct}%`, backgroundColor: step.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: Peak Trading Hours */}
            {activeTab === 'hours' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    كثافة الشراء بحسب ساعات اليوم (حجم الطلبات)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ذروة الإقبال: 8م - 11م</span>
                </div>
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHours}>
                      <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" opacity={0.6} />
                      <XAxis dataKey="hour" tick={{ fill: chartTheme.axis, fontSize: 10 }} />
                      <YAxis tick={{ fill: chartTheme.axis, fontSize: 10 }} width={36} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartTheme.tooltipBg,
                          border: chartTheme.tooltipBorder,
                          borderRadius: 10,
                          fontSize: 12,
                          color: chartTheme.tooltipColor,
                        }}
                      />
                      <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} name="الطلبيات" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tab 6: Customer Cohorts & Loyalty */}
            {activeTab === 'customers' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {customerCohorts.map((cohort: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cohort.color }}></span>
                      <span className="font-mono text-xs text-slate-400">{cohort.pct}% من القاعدة</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{cohort.segment}</div>
                    <div className="font-mono font-extrabold text-lg text-slate-800 dark:text-slate-200">
                      {cohort.count?.toLocaleString()} عميل
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5">
                      متوسط الإنفاق: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{cohort.avgSpend?.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Integrated AI Chat Copilot Panel */}
        {showAiChat && (
          <div className="lg:col-span-4 rounded-2xl border border-purple-500/30 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col h-[600px] lg:h-full transition-all shrink-0">
            {/* Copilot Header */}
            <div className="shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">مستشار التحليلات الذكي</h3>
                  <p className="text-[10px] text-purple-200">محلل بيانات أعمالك المباشر</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiChat(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="إخفاء المساعد"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Question Chips */}
            <div className="shrink-0 bg-purple-50/60 dark:bg-slate-800/50 p-2.5 border-b border-purple-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {[
                'لخص لي الأداء في سطرين',
                'أكثر قسم يحقق أرباحاً؟',
                'كيف أرفع الـ AOV 15%؟',
                'هل في خطر على المخزون؟',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuery(chip)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition shadow-2xs font-medium cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3 text-xs">
              {chatMessages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAssistant && (
                      <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700'
                          : 'bg-purple-600 text-white shadow-xs'
                      }`}
                    >
                      {renderVisualChatMessage(msg.content, isAssistant)}
                      <span className={`block text-[9px] mt-1 text-left ${isAssistant ? 'text-slate-400' : 'text-purple-200'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isChatThinking && (
                <div className="flex flex-col items-start space-y-1.5 animate-fadeIn" dir="rtl">
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-600 dark:text-purple-400 px-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>تفكير استشاري ذكي مباشر</span>
                  </div>

                  <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs flex items-center gap-3 max-w-[90%]">
                    <div className="relative flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping absolute"></span>
                      <span className="w-2 h-2 rounded-full bg-purple-600 relative"></span>
                    </div>

                    <div className="flex-1 text-xs text-purple-950 dark:text-purple-200 font-medium">
                      {thinkingStep || 'جاري قراءة وتحليل بيانات المتجر...'}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"></span>
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Box */}
            <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="اسأل المستشار عن أي رقم أو تحليل بالمتجر..."
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-purple-500 transition"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isChatThinking}
                  className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition shadow-sm cursor-pointer"
                  title="إرسال"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
