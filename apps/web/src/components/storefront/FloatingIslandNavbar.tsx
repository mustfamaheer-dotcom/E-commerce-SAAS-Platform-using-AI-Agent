// apps/web/src/components/storefront/FloatingIslandNavbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  ShoppingBag,
  Search,
  X,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Layers,
  MapPin,
  PhoneCall,
  Clock,
  MessageCircle,
  Flame,
  Home,
  Grid,
} from 'lucide-react';
import { RootState } from '../../store';
import { useAppTheme } from '../../contexts/ThemeContext';

interface FloatingIslandNavbarProps {
  storeName?: string;
  activeSubView: 'home' | 'cart' | 'checkout';
  onNavigateSubView: (view: 'home' | 'cart' | 'checkout') => void;
  onOpenMiniCart: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  categories?: any[];
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
}

export const FloatingIslandNavbar: React.FC<FloatingIslandNavbarProps> = ({
  storeName: initialStoreName = 'تيك زون',
  activeSubView,
  onNavigateSubView,
  onOpenMiniCart,
  searchQuery = '',
  onSearchChange,
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const { theme, toggleMode } = useAppTheme();
  const primaryColor = theme?.primaryColor || '#0ea5e9';

  const [currentStoreName, setCurrentStoreName] = useState(initialStoreName);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isBranchesOpen, setIsBranchesOpen] = useState(false);
  const [isCartPopping, setIsCartPopping] = useState(false);

  useEffect(() => {
    setCurrentStoreName(initialStoreName);
  }, [initialStoreName]);

  useEffect(() => {
    const handleStoreUpdated = (e: any) => {
      if (e?.detail?.name) {
        setCurrentStoreName(e.detail.name);
        document.title = `${e.detail.name} — المتجر الإلكتروني`;
      }
    };
    window.addEventListener('techzone:store-updated', handleStoreUpdated);
    return () => window.removeEventListener('techzone:store-updated', handleStoreUpdated);
  }, []);

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

  // Trigger animation on cart pill when item count increases
  const prevCountRef = useRef(totalCartCount);
  useEffect(() => {
    if (totalCartCount > prevCountRef.current) {
      setIsCartPopping(true);
      const timer = setTimeout(() => setIsCartPopping(false), 500);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalCartCount;
  }, [totalCartCount]);

  const activeCategoryName =
    selectedCategory === 'all'
      ? 'جميع الأقسام'
      : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name ||
        categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name_ar ||
        'الأقسام';

  const handleGoHome = () => {
    onNavigateSubView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAllProducts = () => {
    onNavigateSubView('home');
    if (onSelectCategory) onSelectCategory('all');
    window.dispatchEvent(new CustomEvent('techzone:select-category', { detail: { categoryId: 'all' } }));
  };

  const handleBestSellers = () => {
    onNavigateSubView('home');
    window.dispatchEvent(new CustomEvent('techzone:select-sort', { detail: { sortBy: 'popular' } }));
  };

  const handleContactWhatsApp = () => {
    const message = encodeURIComponent(`مرحباً ${currentStoreName}، أود الاستفسار بخصوص المنتجات المتاحة لديكم.`);
    window.open(`https://wa.me/201000000000?text=${message}`, '_blank');
  };

  return (
    <>
      <header className="sticky top-3 z-40 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
        <div className="max-w-6xl mx-auto pointer-events-auto">
          <nav className="rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] px-3 sm:px-5 py-2 flex items-center justify-between gap-2.5 transition-all">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 shrink-0 select-none">
              <button
                type="button"
                onClick={handleGoHome}
                className="flex items-center gap-2.5 text-right group focus:outline-none"
              >
                {theme?.logoUrl ? (
                  <img
                    src={theme.logoUrl}
                    alt={currentStoreName}
                    className="w-9 h-9 rounded-full object-cover shadow-md border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div
                    style={{ backgroundColor: primaryColor }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden sm:block text-right">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 block leading-tight tracking-tight">
                    {currentStoreName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>متجر معتمد أصلي</span>
                  </span>
                </div>
              </button>
            </div>

            {/* Center Navigation: Links & Search */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
              {isSearchExpanded ? (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 w-44 sm:w-60 transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder="ابحث بالاسم أو الكود..."
                    className="bg-transparent border-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-full text-right"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(false);
                      onSearchChange?.('');
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  {/* 1. الرئيسية */}
                  <button
                    type="button"
                    onClick={handleGoHome}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      activeSubView === 'home' && selectedCategory === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Home className="w-3 h-3" />
                    <span>الرئيسية</span>
                  </button>

                  {/* 2. جميع المنتجات */}
                  <button
                    type="button"
                    onClick={handleAllProducts}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 flex items-center gap-1.5 shrink-0"
                  >
                    <Grid className="w-3 h-3" />
                    <span>جميع المنتجات</span>
                  </button>

                  {/* 3. الأكثر مبيعاً */}
                  <button
                    type="button"
                    onClick={handleBestSellers}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 flex items-center gap-1.5 shrink-0"
                  >
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>الأكثر مبيعاً</span>
                  </button>

                  {/* Categories Dropdown in Navigation */}
                  {categories && categories.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                        className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${
                          selectedCategory !== 'all'
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span className="hidden md:inline">{activeCategoryName}</span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>

                      {isCategoryMenuOpen && (
                        <div className="absolute top-full mt-2 right-0 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-right animate-fade-in-up">
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectCategory) onSelectCategory('all');
                              onNavigateSubView('home');
                              setIsCategoryMenuOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 text-xs text-right hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold ${
                              selectedCategory === 'all' ? 'text-sky-600 dark:text-sky-400 font-bold' : ''
                            }`}
                          >
                            جميع الأقسام
                          </button>
                          {categories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                if (onSelectCategory) onSelectCategory(c.id);
                                onNavigateSubView('home');
                                setIsCategoryMenuOpen(false);
                              }}
                              className={`w-full px-3.5 py-2 text-xs text-right hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                selectedCategory === c.id ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {c.name || c.name_ar}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. فروعنا */}
                  <button
                    type="button"
                    onClick={() => setIsBranchesOpen(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <MapPin className="w-3 h-3 text-sky-500" />
                    <span>فروعنا</span>
                  </button>

                  {/* 5. تواصل معنا */}
                  <button
                    type="button"
                    onClick={handleContactWhatsApp}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-1.5 shrink-0 transition-colors"
                    title="تواصل معنا عبر واتساب"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-500" />
                    <span>تواصل معنا</span>
                  </button>

                  {/* Quick Search Trigger */}
                  {onSearchChange && (
                    <button
                      type="button"
                      onClick={() => setIsSearchExpanded(true)}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 flex items-center gap-1 transition-colors shrink-0"
                      title="بحث في الكتالوج"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Left Actions: Cart Pill & Theme Toggle (NO لوحة التاجر) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Interactive Cart Pill with Animation */}
              <button
                type="button"
                onClick={onOpenMiniCart}
                className={`group relative flex items-center gap-2 pl-3.5 pr-2.5 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:shadow-lg transition-all duration-200 text-xs font-bold ${
                  isCartPopping ? 'animate-cart-pop' : ''
                }`}
                title="عرض محتويات السلة"
              >
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
                >
                  <ShoppingBag className="w-3 h-3" />
                </div>
                <span className="font-mono text-xs">
                  {totalCartCount > 0 ? `${totalCartAmount.toLocaleString()} ج.م` : 'السلة'}
                </span>
                {totalCartCount > 0 && (
                  <span className={`bg-rose-500 text-white rounded-full text-[10px] font-mono px-1.5 py-0.2 font-extrabold shadow-sm ${
                    isCartPopping ? 'scale-125' : ''
                  }`}>
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Theme Toggle (Day/Night) */}
              <button
                type="button"
                onClick={toggleMode}
                className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                title={theme.mode === 'dark' ? 'التبديل للوضع النهاري' : 'التبديل للوضع الليلي'}
              >
                {theme.mode === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-500" />
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Branches Modal */}
      {isBranchesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div dir="rtl" className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">فروع {currentStoreName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBranchesOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Branch 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    فرع القاهرة (التجمع الخامس)
                  </span>
                  <span className="text-[10px] text-emerald-500 font-mono">الفرع الرئيسي</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">شارع التسعين الشمالي، مول تيك سكوير - الدور الأول</p>
                <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 10:00 ص - 11:00 م</span>
                  <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3" /> 01000000001</span>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    فرع الجيزة (المهندسين)
                  </span>
                  <span className="text-[10px] text-sky-500 font-mono">فرع معتمد</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">شارع جامعة الدول العربية، أمام مسجد مصطفى محمود</p>
                <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 11:00 ص - 11:00 م</span>
                  <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3" /> 01000000002</span>
                </div>
              </div>

              {/* Branch 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    فرع الإسكندرية (سموحة)
                  </span>
                  <span className="text-[10px] text-sky-500 font-mono">فرع معتمد</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">ميدان فكتور عمانويل، سموحة - الإسكندرية</p>
                <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 10:00 ص - 10:00 م</span>
                  <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3" /> 01000000003</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBranchesOpen(false)}
              className="w-full py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
};
