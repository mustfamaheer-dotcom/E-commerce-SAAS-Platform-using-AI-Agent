// apps/web/src/pages/landing/LandingPage.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Store,
  Terminal,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Truck,
  ArrowLeft,
  ChevronRight,
  Layers,
  Cpu,
  Zap,
  CheckCircle2,
  Users,
  Sun,
  Moon,
  ExternalLink,
  MessageSquare,
  BarChart3,
  Database,
  Lock,
  Package,
  Clock,
  ArrowUpRight,
  HelpCircle,
  ChevronDown,
  ShoppingBag,
  Flame,
  Check,
  Send,
  Sliders,
  DollarSign,
} from 'lucide-react';

interface LandingPageProps {
  onStartBuilding: () => void;
  onOpenAuth: (mode: 'register' | 'login') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartBuilding,
  onOpenAuth,
  theme,
  onToggleTheme,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'agent' | 'erp' | 'storefront'>('agent');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [demoNiche, setDemoNiche] = useState<string>('electronics');

  const niches = [
    { id: 'electronics', label: 'إلكترونيات وهواتف', tag: 'الأعلى طلباً', icon: '💻' },
    { id: 'fashion', label: 'أزياء وملابس كاجوال', tag: 'شائع جداً', icon: '👗' },
    { id: 'beauty', label: 'عطور ومستحضرات تجميل', tag: 'أرباح عالية', icon: '✨' },
    { id: 'home', label: 'مستلزمات منزل وديكور', tag: 'نمو سريع', icon: '🛋️' },
  ];

  const faqs = [
    {
      q: 'هل أحتاج لأي خبرة برمجية أو تقنية لتأسيس وإدارة متجري؟',
      a: 'إطلاقاً! منصة TalkShow صُممت لتكون مؤتمتة بالكامل. الوكيل الذكي يتحدث معك باللغة العربية واللهجة المصرية الطبيعية، ويسألك أسئلة بسيطة، ويبني المتجر، ويجهز بوابات الدفع وقاعدة البيانات بالكامل في أقل من 3 دقائق.',
    },
    {
      q: 'كيف يتم تحصيل أموال المبيعات من العملاء داخل مصر؟',
      a: 'المنصة مربوطة مسبقاً بأقوى وسائل الدفع المعتمدة في السوق المصري: بوابات Paymob لبطاقات فيزا وماستركارد وميزة، محافظ الهاتف الذكي (Vodafone Cash, Orange, Etisalat)، التحويل الفوري InstaPay (IPN)، وخيار الدفع عند الاستلام مع المعاينة.',
    },
    {
      q: 'كيف يعمل التكامل اللوجستي مع شركة بوسطة (Bosta)؟',
      a: 'بمجرد أن يُتم العميل طلبه في متجرك، يتم تحويل الشحنة بنقرة واحدة إلى شبكة بوسطة، وتوليد بوليصة الشحن مع الباركود وتتبع خط سير الشحنة لحظياً حتى باب منزل العميل في جميع المحافظات.',
    },
    {
      q: 'هل بيانات متجري ومبيعاتي معزولة ومحمية عن المتاجر الأخرى؟',
      a: 'نعم بنسبة 100%. تعتمد TalkShow على معمارية العزل المتعدد للمستأجرين (Multi-Tenancy Isolation) مع سياسات الأمان على مستوى الصفوف (PostgreSQL Row-Level Security)، مما يضمن عدم تداخل أي بيانات أو مبيعات أو عملاء لأي متجر مع متجر آخر.',
    },
    {
      q: 'هل يمكنني ربط متجري القائم بالفعل على شوبيفاي أو ووكومرس؟',
      a: 'بالتأكيد. توفر TalkShow وضع "المتاجر القائمة" حيث يمكنك ربط متجرك الحالي والاستفادة من محرك الذكاء الاصطناعي للتنبؤ بالطلب 30 يوماً مقدماً (LightGBM) ومراقبة المخزون وضبط الخصومات آلياً.',
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#070D1A] dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-sky-500/20 selection:text-sky-600 dark:selection:text-sky-300 relative overflow-x-hidden"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 inset-x-0 h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-sky-400/15 via-indigo-500/10 to-transparent blur-3xl rounded-full dark:from-sky-500/20 dark:via-blue-600/10"></div>
        <div className="absolute top-48 right-10 w-96 h-96 bg-sky-500/10 dark:bg-sky-500/15 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute top-72 left-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {/* Top Navigation Bar - Sleek Glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0A1124]/85 backdrop-blur-xl shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/80 shadow-xs hover:border-sky-500/40 transition-colors">
              <img
                src="/TransparentLogo.png"
                alt="TalkShow Logo"
                className="h-12 w-auto max-h-12 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              />
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">
                  TalkShow
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-700 dark:text-sky-300 border border-sky-300/40 dark:border-sky-700/40 uppercase tracking-wider">
                  AI Egypt
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                منصة المتاجر الذكية ونظام ERP المستقل
              </span>
            </div>
          </div>

          {/* Nav Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 shadow-2xs"
              title={theme === 'dark' ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              تسجيل الدخول
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="px-4.5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-600/20 hover:shadow-sky-600/35 transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>ابدأ مجاناً</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Animated Glow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-900/90 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span>الجيل الأحدث من التجارة الإلكترونية والوكلاء الأذكياء في مصر 🇪🇬</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.2] sm:leading-[1.25]">
            ابنِ وأدِر متجرك الإلكتروني في دقائق{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-cyan-300 dark:to-indigo-400">
              بذكاء اصطناعي يفهم السوق المصري
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            تأسيس متجر كامل من الصفر بمحادثة تفاعلية بالمصري مع وكيلنا الذكي، أو ربط متجرك الحالي للاستفادة من تنبؤ المبيعات بالـ AI، بوابات Paymob و InstaPay، وشحن بوسطة الفوري.
          </p>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-xl shadow-sky-600/25 hover:shadow-sky-600/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>تأسيس متجرك الآن مع الوكيل</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-bold border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>تسجيل الدخول للمتجر القائم</span>
            </button>
          </div>

          {/* Quick Value Props Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
              <span>بدون بطاقة ائتمانية للبدء</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
              <span>جاهز في أقل من 3 دقائق</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
              <span>عزل تام للبيانات ومطابق للقانون 181/2018</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* INTERACTIVE LIVE PLATFORM DEMO WINDOW */}
        {/* ============================================================== */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B132B]/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300">
            {/* Window Browser Bar */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-900/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="text-[11px] text-slate-400 font-mono mr-2 hidden sm:inline">
                  https://talkshow.eg/demo
                </span>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800/80 rounded-xl p-1 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('agent')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activePreviewTab === 'agent'
                      ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  الوكيل الذكي (AI Agent)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('erp')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activePreviewTab === 'erp'
                      ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  لوحة الإدارة (ERP)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('storefront')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activePreviewTab === 'storefront'
                      ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  متجر العملاء
                </button>
              </div>
            </div>

            {/* Window Content Display */}
            <div className="p-4 sm:p-6 min-h-[380px] flex flex-col justify-center bg-slate-50/50 dark:bg-[#070D1A]/60">
              {activePreviewTab === 'agent' && (
                <div className="space-y-4 max-w-2xl mx-auto w-full">
                  <div className="flex items-start gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                      تاجر
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tr-xs p-3.5 text-xs text-slate-800 dark:text-slate-200 shadow-xs max-w-[85%]">
                      مساء الخير يا فندم، عاوز أعمل خصم 15% على كل سماعات البلوتوث عشان عروض الجمعة، وكمان راجع لي نواقص المخزون اللي هتخلص الأسبوع الجاي.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-sky-600 text-white rounded-2xl rounded-tl-xs p-3.5 text-xs shadow-md max-w-[85%] space-y-2 text-right">
                      <div className="flex items-center gap-1.5 font-bold text-sky-200">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>وكيل TalkShow الذكي:</span>
                      </div>
                      <p>
                        عيوني يا فندم! نفذت المطلوب فوراً وبأمان:
                      </p>
                      <ul className="space-y-1 text-[11px] text-sky-100 list-disc list-inside">
                        <li>تم تطبيق خصم 15% على 24 منتج سماعات مع حماية هامش الربح الأدنى (20% Floor Margin).</li>
                        <li>كشف الذكاء الاصطناعي (LightGBM) أن سماعة "Anker Soundcore R50i" متبقي منها 4 قطع فقط والطلب المتوقع 22 قطعة خلال 7 أيام.</li>
                        <li>تم إنشاء أمر توريد مقترح بنقرة واحدة لتفادي خسارة مبيعات بقيمة 12,400 ج.م.</li>
                      </ul>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      TS
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    <span className="italic">اكتب أي أمر تشغيلي أو استفسار بالعامية المصرية...</span>
                  </div>
                </div>
              )}

              {activePreviewTab === 'erp' && (
                <div className="space-y-4">
                  {/* Top 3 Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>إجمالي المبيعات اليوم</span>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        48,250 ج.م
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold">+18.4% نمو أسبوعي</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>طلبات قيد الشحن (بوسطة)</span>
                        <Truck className="w-4 h-4 text-sky-500" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        34 شحنة نشطة
                      </div>
                      <span className="text-[10px] text-sky-500 font-bold">تسليم خلال 24 ساعة</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>حماية الأرباح (Margin Guard)</span>
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        28.5% صافي
                      </div>
                      <span className="text-[10px] text-indigo-500 font-bold">معدل صحي ومضمون</span>
                    </div>
                  </div>

                  {/* Micro Table */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs">
                    <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/50 font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>أحدث الطلبات المؤكدة تلقائياً</span>
                      <span className="text-emerald-500">مباشر • Live</span>
                    </div>
                    <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold">أحمد محمود (مدينة نصر)</span>
                          <span className="text-[10px] text-slate-400 block">لابتوب Dell XPS 15 • دفع Paymob</span>
                        </div>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">42,500 ج.م</span>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold">سارة إبراهيم (الشيخ زايد)</span>
                          <span className="text-[10px] text-slate-400 block">سماعة Sony WH-1000XM5 • شحن بوسطة</span>
                        </div>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">14,900 ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'storefront' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                        متجر عملاء فاخر ومُحسّن للتحويل
                      </span>
                      <h4 className="font-black text-lg mt-1">تيك زون مصر — إلكترونيات وأجهزة ذكية</h4>
                      <p className="text-xs text-sky-100">شحن بوسطة إكسبريس في نفس اليوم لجميع المحافظات</p>
                    </div>
                    <ShoppingBag className="w-10 h-10 opacity-30" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['MacBook Air M3', 'iPhone 15 Pro', 'AirPods Pro 2', 'iPad Pro 11'].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-right space-y-1">
                        <div className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                          {item.split(' ')[0]}
                        </div>
                        <span className="font-bold block truncate">{item}</span>
                        <span className="text-sky-600 dark:text-sky-400 font-mono font-bold block">
                          {(idx + 1) * 8500} ج.م
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* LOCAL INTEGRATION & TRUST BADGES STRIP */}
      {/* ============================================================== */}
      <section className="py-10 border-y border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0A1124]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            تكامل وتشغيل محلي كامل مع كبرى المنظومات في السوق المصري
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-extrabold text-sm">
              <CreditCard className="w-5 h-5 text-sky-600" />
              <span>Paymob (فيزا وميزة)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-extrabold text-sm">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span>InstaPay (IPN فوري)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-extrabold text-sm">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>بوسطة للشحن (Bosta)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-extrabold text-sm">
              <Database className="w-5 h-5 text-amber-600" />
              <span>PostgreSQL RLS المعزول</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-extrabold text-sm">
              <Cpu className="w-5 h-5 text-rose-600" />
              <span>محرك تنبؤ LightGBM</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* THE 4 PILLARS BENTO GRID */}
      {/* ============================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            المميزات التنافسية
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            كل ما تحتاجه لتجارة إلكترونية ناجحة في منصة واحدة
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            تخلص من الأدوات المنفصلة والمعقدة، واستمتع بنظام متكامل ينمو مع متجرك من اليوم الأول.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Agentic AI (Col 7) */}
          <div className="md:col-span-7 p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                وكيل ذكاء اصطناعي (Agent) يتكلم مصري ويفهم البيع
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                ليس مجرد شات بوت، بل وكيل تنفيذي كامل الصلاحيات يستمع لأوامرك: يُنشئ المنتجات، يطبق الخصومات الجماعية، يراجع نواقص المخزون، ويجيب على العملاء على مدار الساعة.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>أوامر صوتية ونصية بالعامية</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>تنفيذ فوري في قاعدة البيانات</span>
              </div>
            </div>
          </div>

          {/* Card 2: Multi-Tenancy Isolation (Col 5) */}
          <div className="md:col-span-5 p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                عزل بيانات تام وسيادة رقمية
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                كل متجر يمتلك بيئة معزولة بنسبة 100% باستخدام تقنية PostgreSQL Row-Level Security. بيانات مبيعاتك وعملائك في أمان تام ولا يمكن لأي متجر آخر الوصول إليها.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>مساحة معزولة ومخصصة لكل تاجر وماركة</span>
            </div>
          </div>

          {/* Card 3: Predictive ML Engine (Col 5) */}
          <div className="md:col-span-5 p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                تنبؤ بالمبيعات والطلب لـ 30 يوماً
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                محرك التعلم الآلي بنماذج LightGBM يحلل سجل مبيعاتك وسلوك المستهلك المصري، ويخبرك مسبقاً بما يحتاجه المخزون قبل نفاده لتفادي تضييع الأرباح.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
              <span>حماية هامش الربح الأدنى ومنع الخسائر</span>
            </div>
          </div>

          {/* Card 4: Local Ecosystem Integration (Col 7) */}
          <div className="md:col-span-7 p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                تكامل مباشر مع بوسطة وبوابات الدفع
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                لا داعي لتعقيدات الربط وتوقيع العقود الطويلة: شحن بوسطة مفعل تلقائياً لجميع محافظات مصر مع تتبع حي، وبوابات الدفع Paymob وميزة و InstaPay جاهزة لاستقبال أموالك فوراً.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>إصدار بوالص الشحن بنقرة زر</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>تحصيل نقدي عند الاستلام COD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* TWO PATHS: BUILD NEW OR CONNECT EXISTING */}
      {/* ============================================================== */}
      <section className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              طريقتان سهلتان لبدء العمل اليوم
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              سواء كنت تبدأ علامتك التجارية من الصفر، أو تدير بالفعل متجراً على منصة أخرى
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Option 1: Build New */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-sky-500/30 hover:border-sky-500 transition-all shadow-md hover:shadow-2xl flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    الخيار الأسرع • ابدأ الآن
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  بناء وتأسيس متجر جديد بالدردشة
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  سيبدأ وكيلنا الذكي محادثة ودية معك باللهجة المصرية يسألك فيها عن اسم متجرك ونشاطك، ويبني لك المتجر، ويزودك برابط إدارة المتجر ورابط متجر العملاء في دقائق معدودة.
                </p>

                <div className="space-y-2.5 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>توليد تلقائي لواجهة المتجر ولوحة الإدارة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>تفعيل Paymob و InstaPay وبوسطة بنقرة واحدة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>قاعدة بيانات فارغة ونظيفة خاصة بمتجرك فقط</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ابدأ بناء متجرك الجديد مجاناً</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Option 2: Connect Existing */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    للمتاجر القائمة
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  ربط وإدارة متجرك الإلكتروني الحالي
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  هل لديك متجر قائم بالفعل على Shopify, WooCommerce, سلة, أو زد؟ اربط متجرك بـ TalkShow ودع وكيل الذكاء الاصطناعي يتولى مراقبة المخزون، ضبط التخفيضات آلياً، والتنبؤ بالطلب.
                </p>

                <div className="space-y-2.5 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>تنبؤ بالطلب والمبيعات لمدة 30 يوماً بنماذج LightGBM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>تنبيهات استباقية لنواقص المخزون المعرضة للنفاد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>تطبيق خصومات جماعية مع حماية حد الهامش الآمن</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="w-full py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ربط وإدارة متجرك القائم</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
      {/* ============================================================== */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            الأسئلة الشائعة
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            كل ما يدور في ذهنك عن منصة TalkShow
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-right font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-sky-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* FINAL HIGH-ENERGY BOTTOM CALL TO ACTION */}
      {/* ============================================================== */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-sky-900 via-indigo-950 to-slate-950 p-8 sm:p-14 text-center text-white space-y-6 shadow-2xl border border-sky-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent pointer-events-none"></div>

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-sky-200 backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>جاهز للانطلاق بالسوق المصري؟</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              أطلق متجرك الإلكتروني الذكي اليوم وضاعف مبيعاتك وأرباحك
            </h2>

            <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
              سجل حسابك كتاجر في ثوانٍ، دردش مع الوكيل بالمصري، واستلم فوراً روابط متجرك ولوحة الإدارة مع بوابات الدفع والشحن المعتمدة.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-extrabold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ابدأ الآن مجاناً وبدون تعقيد</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-bold border border-white/20 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <span>تسجيل دخول التجار</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FOOTER */}
      {/* ============================================================== */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0A1124] py-10 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/TransparentLogo.png"
              alt="TalkShow Logo"
              className="h-9 w-auto object-contain drop-shadow-xs"
            />
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 block">
                TalkShow Platform
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                منصة المتاجر الذكية ونظام ERP المستقل 2026 — جمهورية مصر العربية
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Paymob معتمد</span>
            </span>
            <span>•</span>
            <span>بوسطة للشحن الإكسبريس</span>
            <span>•</span>
            <span>حماية قانون المستهلك 181/2018</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
