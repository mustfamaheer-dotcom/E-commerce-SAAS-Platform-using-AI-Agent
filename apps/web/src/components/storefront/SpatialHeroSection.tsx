// apps/web/src/components/storefront/SpatialHeroSection.tsx
import React from 'react';
import {
  Sparkles,
  ArrowLeft,
  Truck,
  ShieldCheck,
  CreditCard,
  Award,
  Zap,
  Check,
} from 'lucide-react';
import { useAppTheme } from '../../contexts/ThemeContext';

interface SpatialHeroSectionProps {
  storeName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  onShopNow: () => void;
  onDiscoverDeals: () => void;
  productsCount?: number;
}

export const SpatialHeroSection: React.FC<SpatialHeroSectionProps> = ({
  storeName = 'تيك زون',
  heroTitle = 'أفضل الأجهزة والإلكترونيات الذكية بأسعار لا تُنافس',
  heroSubtitle = 'تسوق أحدث الأجهزة الذكية مع ضمان محلي معتمد، شحن سريع بجميع محافظات مصر، وخيارات تقسيط ودفع إلكتروني ميسرة.',
  onShopNow,
  onDiscoverDeals,
  productsCount = 12,
}) => {
  const { theme } = useAppTheme();
  const primaryColor = theme?.primaryColor || '#0ea5e9';

  return (
    <div className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
      {/* Ambient background soft glow - comfortable low opacity in light mode */}
      <div
        className="absolute top-0 right-1/4 -z-10 w-[550px] h-[550px] rounded-full blur-[120px] opacity-10 dark:opacity-20 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute bottom-0 left-1/4 -z-10 w-[450px] h-[450px] rounded-full blur-[100px] opacity-10 dark:opacity-15 pointer-events-none bg-indigo-400"
      />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text Content & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-right">
            {/* Crisp Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 dark:text-white leading-[1.2] tracking-tight">
              {heroTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onShopNow}
                style={{ backgroundColor: primaryColor }}
                className="px-6 py-3.5 rounded-full text-white font-bold text-xs sm:text-sm transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/25 hover:scale-[1.02] flex items-center gap-2.5 shadow-md cursor-pointer"
              >
                <span>تصفح الكتالوج بالكامل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onDiscoverDeals}
                className="px-5 py-3.5 rounded-full bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-xs backdrop-blur-md transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>عروض وتخفيضات اليوم</span>
              </button>
            </div>

            {/* Quick Micro-Trust Signals */}
            <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                شحن سريع عبر بوسطة
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                ضمان استبدال معتمد
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                دفع عند الاستلام متاح
              </span>
            </div>
          </div>

          {/* Spatial Flagship Showcase (5 cols) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Center Device Card */}
            <div className="relative w-full max-w-sm rounded-3xl bg-white/85 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"
                  alt="Flagship Showcase"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/85 text-white font-mono text-[10px] font-bold backdrop-blur-md">
                  Studio Edition 16
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    أجهزة الحواسب الذكية
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">معالجات M-Series الأصلية</span>
                </div>
                <span
                  style={{ color: primaryColor }}
                  className="font-mono font-black text-sm"
                >
                  ضمان وكيل 100%
                </span>
              </div>
            </div>

            {/* Spatial Floating Badge 1 (Top Left) */}
            <div className="absolute -top-3 -left-3 sm:-left-6 bg-white dark:bg-slate-800 rounded-2xl p-2.5 shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 animate-float">
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px]">توصيل 24 ساعة</span>
            </div>

            {/* Spatial Floating Badge 2 (Bottom Right) */}
            <div className="absolute -bottom-3 -right-3 sm:-right-4 bg-white dark:bg-slate-800 rounded-2xl p-2.5 shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px]">ضمان 14 يوم استرجاع</span>
            </div>
          </div>
        </div>

        {/* 4-Item Minimalist Feature Bar */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">شحن سريع</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">بوسطة لكل مصر</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">دفع مرن</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">كاش و Paymob</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">ضمان معتمد</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">14 يوماً للاسترجاع</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">أصلي 100%</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">ضمان الوكيل</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
