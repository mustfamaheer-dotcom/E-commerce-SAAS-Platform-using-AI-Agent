// apps/web/src/components/storefront/FloatingIslandNavbar.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  ShoppingBag,
  Search,
  X,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Layers,
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
  onBackToDashboard?: () => void;
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
  onBackToDashboard,
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const { theme, toggleMode } = useAppTheme();
  const primaryColor = theme?.primaryColor || '#0ea5e9';

  const [currentStoreName, setCurrentStoreName] = useState(initialStoreName);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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

  const activeCategoryName =
    selectedCategory === 'all'
      ? 'جميع الأقسام'
      : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name ||
        categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name_ar ||
        'الأقسام';

  return (
    <header className="sticky top-3 z-40 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-6xl mx-auto pointer-events-auto">
        <nav className="rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 transition-all">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 shrink-0 select-none">
            <button
              type="button"
              onClick={() => onNavigateSubView('home')}
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
                <span className="font-black text-sm text-slate-900 dark:text-slate-100 block leading-tight tracking-tight">
                  {currentStoreName}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>متجر معتمد أصلي</span>
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links, Categories Menu & Quick Search */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isSearchExpanded ? (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 w-48 sm:w-64 transition-all">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="ابحث عن اسم أو كود المنتج..."
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
                <button
                  type="button"
                  onClick={() => {
                    onNavigateSubView('home');
                    if (onSelectCategory) onSelectCategory('all');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeSubView === 'home' && selectedCategory === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                  }`}
                >
                  الكتالوج
                </button>

                {/* Categories Dropdown in Navigation */}
                {categories && categories.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        selectedCategory !== 'all'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{activeCategoryName}</span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>

                    {isCategoryMenuOpen && (
                      <div className="absolute top-full mt-2 right-0 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-right animate-fadeIn">
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

                {onSearchChange && (
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 flex items-center gap-1.5 transition-colors"
                    title="بحث في الكتالوج"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">بحث</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Left Actions: Cart Pill, Theme Toggle, Dashboard Return */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Interactive Cart Pill */}
            <button
              type="button"
              onClick={onOpenMiniCart}
              className="group relative flex items-center gap-2 pl-3.5 pr-2.5 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:shadow-lg transition-all duration-200 text-xs font-bold"
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
                <span className="bg-rose-500 text-white rounded-full text-[10px] font-mono px-1.5 py-0.2 font-extrabold shadow-sm">
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

            {/* Merchant Dashboard Shortcut */}
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                title="العودة لإدارة المتجر"
              >
                <span>لوحة التاجر</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
