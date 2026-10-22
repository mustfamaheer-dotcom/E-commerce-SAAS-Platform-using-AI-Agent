// apps/web/src/pages/landing/LandingPage.tsx
import React from 'react';
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
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-sky-500/20 selection:text-sky-600 dark:selection:text-sky-300"
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                TechZone AI
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Egypt 🇪🇬
                </span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                منصة المتاجر الذكية ونظام ERP المستقل
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              تسجيل الدخول
            </button>

            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
            >
              <span>ابدأ الآن مجاناً</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 pointer-events-none -z-10 flex justify-center">
          <div className="w-[800px] h-[400px] bg-gradient-to-tr from-sky-500/10 via-indigo-500/10 to-transparent blur-3xl rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>الجيل الجديد من التجارة الإلكترونية المستقلة في مصر</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto leading-tight sm:leading-snug">
            ابنِ وأدِر متجرك الإلكتروني في دقائق{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
              بذكاء اصطناعي يفهم السوق المصري
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            أنشئ متجرك المتكامل من الصفر بمحادثة ودية باللهجة المصرية مع وكيلنا الذكي، أو اربط متجرك الحالي ودع الذكاء الاصطناعي يتولى المخزون، التسعير، والدفع والشحن المحلي.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <span>إنشاء حساب وتأسيس متجرك الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <span>لديك حساب بالفعل؟ تسجيل الدخول</span>
            </button>
          </div>

          {/* Value Badges Strip */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>بوابات دفع مصرية معتمدة (Paymob / InstaPay / Fawry)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>تكامل لوجستي مباشر مع بوسطة (Bosta)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>عزل كامل للمستأجر وبياناته (PostgreSQL RLS)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two Core Services Highlights Section */}
      <section className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              اختر الخدمة المناسبة لحجم ونشاط عملك
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              سواء كنت تبدأ من الصفر، أو تمتلك متجراً بالفعل على منصة أخرى
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Service 1: Build a new e-commerce */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    موصى به للمشاريع الجديدة 🚀
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  إنشاء متجر إلكتروني جديد بالذكاء الاصطناعي
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  محادثة ودية وتفاعلية باللهجة المصرية مع وكيلنا الذكي؛ تسألك عن اسم متجرك ونشاطك، وتقوم بتوليد المتجر، ضبط الهوية، تفعيل بوابات Paymob و InstaPay، وربط شحن بوسطة فورياً.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>محادثة دردشة بالمصري بدون أي كود أو إعدادات معقدة</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>رابطان فوريان: رابط إدارة المتجر ورابط متجر العملاء</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>قاعدة بيانات مستقلة ومحمية لكل متجر (Multi-Tenancy)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>ابدأ بناء متجرك الجديد الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Service 2: Manage current e-commerce */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    للمتاجر القائمة 🔌
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  إدارة وتوصيل متجرك الإلكتروني الحالي
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  هل لديك متجر قائم بالفعل على Shopify, WooCommerce, سلة, أو زد؟ اربط متجرك بـ TechZone ودع وكيل الذكاء الاصطناعي يتولى مراقبة المخزون، ضبط التخفيضات آلياً، والتنبؤ بالطلب.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>تنبؤ دقيق بالطلب والمبيعات لمدة 30 يوماً بنماذج LightGBM</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>تنبيهات استباقية لنواقص المخزون والأرباح المعرضة للنفاد</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>تطبيق خصومات جماعية مع حماية حد الهامش الآمن (Floor Guard)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('login')}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>ربط وإدارة متجرك القائم</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 max-w-xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            كيف تبدأ تجارتك في 3 خطوات بسيطة؟
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            طريق مباشر وسريع للانطلاق في السوق المصري بدون تعقيدات برمجية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              أنشئ حسابك كتاجر
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              سجل ببريدك ورقم هاتفك المصري في ثوانٍ لتحصل على مساحة آمنة ومعزولة لإدارة أعمالك.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              دردش مع الوكيل بالمصري
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              أجب عن أسئلة بسيطة حول اسم متجرك، منتجاتك، طرق الدفع وتفضيلات الشحن عبر بوسطة.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              استلم رابطين وابدأ البيع
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              احصل فورياً على رابط متجر العملاء ورابط لوحة الإدارة لمتابعة المبيعات والطلبات.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
              T
            </div>
            <span>منصة TechZone للتجارة الذكية والـ ERP © 2026 — مصممة للسوق المصري</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span>Paymob معتمد</span>
            <span>•</span>
            <span>بوسطة للشحن</span>
            <span>•</span>
            <span>حماية قانون حماية المستهلك 181/2018</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
