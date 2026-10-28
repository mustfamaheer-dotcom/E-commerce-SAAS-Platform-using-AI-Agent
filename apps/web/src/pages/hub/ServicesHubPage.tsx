// apps/web/src/pages/hub/ServicesHubPage.tsx
import React from 'react';
import {
  Sparkles,
  Store,
  Layers,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Truck,
  TrendingUp,
  Cpu,
  Package,
  LogOut,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { UserAccount } from '../../components/auth/AuthModal';
import { useAppTheme } from '../../contexts/ThemeContext';

export interface ProvisionedStore {
  id: string;
  slug: string;
  name: string;
  category: string;
  currency: string;
  themeMode: 'light' | 'dark';
  createdAt: string;
  adminUrl: string;
  storefrontUrl: string;
}

interface ServicesHubPageProps {
  user: UserAccount;
  onSelectBuildNewStore: () => void;
  onSelectManageCurrentStore: () => void;
  onLogout: () => void;
  provisionedStores?: ProvisionedStore[];
  onOpenStoreAdmin: (store: ProvisionedStore) => void;
  onOpenStorefront: (store: ProvisionedStore) => void;
}

export const ServicesHubPage: React.FC<ServicesHubPageProps> = ({
  user,
  onSelectBuildNewStore,
  onSelectManageCurrentStore,
  onLogout,
  provisionedStores = [],
  onOpenStoreAdmin,
  onOpenStorefront,
}) => {
  const { theme, toggleMode } = useAppTheme();
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200"
    >
      {/* Top Banner / User Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/TransparentLogo.png"
              alt="TalkShow Logo"
              className="w-11 h-11 object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>أهلاً بك، {user.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  حساب معتمد ✓
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  TalkShow
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.email} • {user.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMode}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={theme.mode === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            >
              {theme.mode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              onClick={onLogout}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Intro Headline */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            لوحة اختيار الخدمات الرئيسية
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            اختر ما ترغب بالقيام به اليوم: تأسيس متجر جديد بالدردشة مع الوكيل الذكي، أو إدارة وتوصيل متجرك الحالي
          </p>
        </div>

        {/* The Two Main Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Service 1: Build a New E-Commerce with AI */}
          <div className="relative group bg-white dark:bg-slate-900 rounded-2xl border-2 border-sky-500/30 dark:border-sky-500/30 hover:border-sky-500 transition-all p-7 shadow-sm hover:shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                  <Store className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>الخدمة الأولى (تأسيس متكامل)</span>
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  بناء متجر إلكتروني جديد بالذكاء الاصطناعي
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  سيبدأ الوكيل الذكي محادثة ودية معك باللهجة المصرية يسألك فيها عن اسم متجرك وتفاصيله، ويبني لك المتجر، ويزودك برابط إدارة المتجر ورابط متجر العملاء.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>دردشة تفاعلية باللهجة المصرية خطوة بخطوة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>توليد فوري لبوابات الدفع (Paymob / InstaPay / Fawry)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>ربط الشحن والتوصيل مع بوسطة (Bosta Logistics)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>الحصول على رابط إدارة المتجر ورابط متجر الزبائن مباشرة</span>
                </div>
              </div>
            </div>

            <button
              onClick={onSelectBuildNewStore}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
            >
              <span>ابدأ محادثة تأسيس المتجر مع الوكيل الذكي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Service 2: Manage Current E-Commerce */}
          <div className="relative group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all p-7 shadow-sm hover:shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>الخدمة الثانية (إدارة قائمة)</span>
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  إدارة وتوصيل متجرك الإلكتروني الحالي
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  هل تمتلك متجراً بالفعل على منصة مثل Shopify أو سلة أو زد أو نظام خاص؟ قم بتوصيل متجرك ودع وكيلنا يدير الكتالوج والمخزون والتنبؤ بالمبيعات.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>مركز قيادة الوكيل (Agent Command Center) الذكي</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>مراقبة المخزون وتنبيهات نواقص السلع فورياً</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>تنبؤ بالطلب والمبيعات لمدة 30 يوماً بنماذج ML</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>سجل أمان وتدقيق معتمد غير قابل للتعديل (Audit Trail)</span>
                </div>
              </div>
            </div>

            <button
              onClick={onSelectManageCurrentStore}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>الدخول للوحة إدارة المتجر والكتالوج الحالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Provisioned Stores Section (if any store has been generated) */}
        {provisionedStores.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  متاجرك المفعلة التي تم إنشاؤها عبر الوكيل ({provisionedStores.length})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  يمكنك الدخول مباشرة إلى لوحة إدارة أي متجر أو فتح رابط متجر الزبائن
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {provisionedStores.map((st) => (
                <div key={st.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {st.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {st.slug} • {st.category} • {st.currency}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenStoreAdmin(st)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <span>لوحة الإدارة</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenStorefront(st)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>متجر العملاء</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
