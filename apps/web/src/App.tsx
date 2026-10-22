// apps/web/src/App.tsx
import React, { useState, useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store, RootState } from './store';
import { ThemeProvider, useAppTheme } from './contexts/ThemeContext';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { getCurrentUser, setCurrentUser, UserAccount } from './services/auth';
import { ServicesHubPage, ProvisionedStore } from './pages/hub/ServicesHubPage';
import { AiStoreBuilderPage } from './pages/onboarding/AiStoreBuilderPage';
import { ChatCommandCenter } from './pages/dashboard/ChatCommandCenter';
import { EcommerceStudioPage } from './pages/dashboard/EcommerceStudioPage';
import { ProductsGridPage } from './pages/dashboard/ProductsGridPage';
import { CategoriesPage } from './pages/dashboard/CategoriesPage';
import { OrdersPage } from './pages/dashboard/OrdersPage';
import { InventoryPage } from './pages/dashboard/InventoryPage';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { CouponsPage } from './pages/dashboard/CouponsPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { StoreSettingsPage } from './pages/dashboard/StoreSettingsPage';
import { AuditLogPage } from './pages/dashboard/AuditLogPage';
import { StorefrontHomePage } from './pages/storefront/StorefrontHomePage';
import { CartPage } from './pages/storefront/CartPage';
import { CheckoutPage } from './pages/storefront/CheckoutPage';

import {
  MessageSquare,
  Package,
  ShoppingCart,
  ShieldCheck,
  Terminal,
  Sun,
  Moon,
  Store,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  Tag,
  TrendingUp,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import './i18n';

const queryClient = new QueryClient();

export type NavItemKey =
  | 'chat'
  | 'ecommerce'
  | 'products'
  | 'categories'
  | 'orders'
  | 'inventory'
  | 'customers'
  | 'coupons'
  | 'analytics'
  | 'settings'
  | 'audit';

export type AppView =
  | 'landing'
  | 'login'
  | 'register'
  | 'services_hub'
  | 'ai_builder'
  | 'dashboard'
  | 'storefront';
export type StorefrontSubView = 'home' | 'cart' | 'checkout';

interface NavCategory {
  title_ar: string;
  items: {
    key: NavItemKey;
    label_ar: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    title_ar: 'الذكاء الاصطناعي والمحادثة',
    items: [
      {
        key: 'chat',
        label_ar: 'مركز قيادة الوكيل (Agent)',
        icon: MessageSquare,
        badge: 'Live',
      },
    ],
  },
  {
    title_ar: 'التجارة والعمليات التشغيلية',
    items: [
      {
        key: 'ecommerce',
        label_ar: 'متجر العملاء وتخصيصه',
        icon: Store,
        badge: 'Studio',
      },
      {
        key: 'products',
        label_ar: 'المنتجات والكتالوج',
        icon: Package,
      },
      {
        key: 'categories',
        label_ar: 'الأقسام والتصنيفات',
        icon: Layers,
      },
      {
        key: 'orders',
        label_ar: 'الطلبات والشحن (Bosta)',
        icon: ShoppingCart,
      },
      {
        key: 'inventory',
        label_ar: 'المخزون ونواقص السلع',
        icon: Package,
        badge: 'Alerts',
      },
      {
        key: 'customers',
        label_ar: 'إدارة علاقات العملاء (CRM)',
        icon: Users,
      },
      {
        key: 'coupons',
        label_ar: 'الكوبونات والعروض',
        icon: Tag,
      },
    ],
  },
  {
    title_ar: 'التحليلات والحوكمة',
    items: [
      {
        key: 'analytics',
        label_ar: 'مؤشرات الأداء والـ BI',
        icon: TrendingUp,
      },
      {
        key: 'audit',
        label_ar: 'سجل التدقيق والأمان',
        icon: ShieldCheck,
        badge: 'RLS',
      },
    ],
  },
  {
    title_ar: 'النظام والهوية',
    items: [
      {
        key: 'settings',
        label_ar: 'إعدادات المتجر والشعار',
        icon: Settings,
      },
    ],
  },
];

const MainAppContent: React.FC = () => {
  const { theme, toggleMode } = useAppTheme();

  // Navigation / View state
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeTab, setActiveTab] = useState<NavItemKey>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Storefront sub-navigation
  const [storefrontSubView, setStorefrontSubView] = useState<StorefrontSubView>('home');

  // Authentication State
  const [user, setUser] = useState<UserAccount | null>(() => getCurrentUser());

  // Stores State
  const [provisionedStores, setProvisionedStores] = useState<ProvisionedStore[]>([
    {
      id: 'tenant-moustafa-tech',
      slug: '-moustafa-tech--102',
      name: 'Moustafa Tech',
      category: 'بيع موبايلات وإلكترونيات',
      currency: 'EGP',
      themeMode: 'dark',
      createdAt: new Date().toISOString(),
      adminUrl: 'http://localhost:5173/admin/-moustafa-tech--102',
      storefrontUrl: 'http://localhost:5173/store/-moustafa-tech--102',
    },
  ]);
  const [activeStore, setActiveStore] = useState<ProvisionedStore | null>(provisionedStores[0]);

  // Cart badge
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleAuthSuccess = (account: UserAccount) => {
    setUser(account);
    setCurrentUser(account);
    setCurrentView('services_hub');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleStoreCreated = (storeObj: ProvisionedStore) => {
    setProvisionedStores((prev) => [storeObj, ...prev]);
    setActiveStore(storeObj);
  };

  const handleOpenStoreAdmin = (storeObj: ProvisionedStore) => {
    setActiveStore(storeObj);
    setCurrentView('dashboard');
    setActiveTab('chat');
  };

  const handleOpenStorefront = (storeObj: ProvisionedStore) => {
    setActiveStore(storeObj);
    setCurrentView('storefront');
    setStorefrontSubView('home');
  };

  return (
    <>
      {/* View 1: Landing Page */}
      {currentView === 'landing' && (
        <LandingPage
          onStartBuilding={() => setCurrentView('register')}
          onOpenAuth={(mode) => setCurrentView(mode)}
          theme={theme.mode}
          onToggleTheme={toggleMode}
        />
      )}

      {/* View 1.1: Dedicated Login Page */}
      {currentView === 'login' && (
        <LoginPage
          onSuccess={handleAuthSuccess}
          onNavigateToRegister={() => setCurrentView('register')}
          onNavigateToHome={() => setCurrentView('landing')}
        />
      )}

      {/* View 1.2: Dedicated Register Page */}
      {currentView === 'register' && (
        <RegisterPage
          onSuccess={handleAuthSuccess}
          onNavigateToLogin={() => setCurrentView('login')}
          onNavigateToHome={() => setCurrentView('landing')}
        />
      )}

      {/* View 2: Services Hub */}
      {currentView === 'services_hub' && user && (
        <ServicesHubPage
          user={user}
          onSelectBuildNewStore={() => setCurrentView('ai_builder')}
          onSelectManageCurrentStore={() => {
            setCurrentView('dashboard');
            setActiveTab('products');
          }}
          onLogout={handleLogout}
          provisionedStores={provisionedStores}
          onOpenStoreAdmin={handleOpenStoreAdmin}
          onOpenStorefront={handleOpenStorefront}
        />
      )}

      {/* View 3: AI Store Builder Agent Chat */}
      {currentView === 'ai_builder' && user && (
        <AiStoreBuilderPage
          user={user}
          onStoreCreated={handleStoreCreated}
          onOpenStoreAdmin={handleOpenStoreAdmin}
          onOpenStorefront={handleOpenStorefront}
          onBackToHub={() => setCurrentView('services_hub')}
        />
      )}

      {/* View 4: Full Amazon-Style Customer Storefront */}
      {currentView === 'storefront' && (
        <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
          {/* Top Storefront Bar for Navigation back to management */}
          <header className="bg-slate-900 text-slate-200 px-4 sm:px-6 py-2.5 text-xs flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-white text-sm">
                {activeStore?.name || 'Moustafa Tech'}
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">
                ({activeStore?.slug || '-moustafa-tech--102'})
              </span>
            </div>

            {/* Navigation links within Storefront */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStorefrontSubView('home')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  storefrontSubView === 'home' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                المتجر
              </button>

              <button
                onClick={() => setStorefrontSubView('cart')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors relative flex items-center gap-1.5 ${
                  storefrontSubView === 'cart' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>السلة</span>
                {totalCartCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] flex items-center justify-center font-bold">
                    {totalCartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setStorefrontSubView('checkout')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  storefrontSubView === 'checkout' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                الدفع والشحن
              </button>

              <div className="h-4 w-[1px] bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={toggleMode}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title={theme.mode === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              >
                {theme.mode === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                )}
              </button>

              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <span>لوحة الإدارة (ERP)</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <main className="flex-1">
            {storefrontSubView === 'home' && (
              <StorefrontHomePage
                onOpenCart={() => setStorefrontSubView('cart')}
                onOpenCheckout={() => setStorefrontSubView('checkout')}
              />
            )}
            {storefrontSubView === 'cart' && (
              <CartPage
                onProceedToCheckout={() => setStorefrontSubView('checkout')}
                onContinueShopping={() => setStorefrontSubView('home')}
              />
            )}
            {storefrontSubView === 'checkout' && <CheckoutPage />}
          </main>
        </div>
      )}

      {/* View 5: Store Management Dashboard & Complete ERP Modules */}
      {currentView === 'dashboard' && (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 antialiased"
        >
          <div className="flex-1 flex overflow-hidden h-screen">
            {/* Sidebar Navigation - Fixed & Sticky */}
            <aside
              className={`${
                isSidebarOpen ? 'w-64' : 'w-16'
              } shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 z-30 select-none shadow-xs sticky top-0 h-screen overflow-hidden`}
            >
              {/* Sidebar Header */}
              <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 space-x-reverse overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Terminal className="w-4 h-4" />
                  </div>
                  {isSidebarOpen && (
                    <div className="truncate">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">
                        {activeStore?.name || 'Moustafa Tech'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        نظام الـ ERP والوكيل الذكي
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>

              {/* Navigation Categories and Items */}
              <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
                {/* Hub button */}
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('services_hub')}
                    className="w-full flex items-center space-x-2.5 space-x-reverse px-2.5 py-2 rounded-xl text-xs font-semibold bg-sky-50/70 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 transition-colors border border-sky-200/50 dark:border-sky-800/50"
                  >
                    <Store className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    {isSidebarOpen && <span>مركز الخدمات الرئيسي (Hub)</span>}
                  </button>
                </div>

                {NAV_CATEGORIES.map((cat, catIdx) => (
                  <div key={catIdx} className="space-y-1">
                    {isSidebarOpen && (
                      <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pb-1">
                        {cat.title_ar}
                      </h3>
                    )}

                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setActiveTab(item.key)}
                            className={`w-full flex items-center space-x-2.5 space-x-reverse px-2.5 py-2 rounded-xl text-xs transition-colors ${
                              isActive
                                ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                            title={item.label_ar}
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                            {isSidebarOpen && (
                              <div className="flex-1 flex items-center justify-between truncate text-right">
                                <span className="truncate">{item.label_ar}</span>
                                {item.badge && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 space-y-2">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {theme.mode === 'dark' ? (
                      <Moon className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    {isSidebarOpen && (
                      <span>{theme.mode === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
                    )}
                  </div>
                  {isSidebarOpen && (
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{theme.mode}</span>
                  )}
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-950">
              <header className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">لوحة إدارة المتجر</span>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeTab === 'chat' && 'مركز قيادة الوكيل الذكي (AI Command Center)'}
                    {activeTab === 'ecommerce' && 'استوديو تخصيص متجر العملاء (E-Commerce Studio)'}
                    {activeTab === 'products' && 'إدارة المنتجات والكتالوج'}
                    {activeTab === 'categories' && 'الأقسام والتصنيفات'}
                    {activeTab === 'orders' && 'الطلبات والشحن (Bosta)'}
                    {activeTab === 'inventory' && 'المخزون ونواقص السلع'}
                    {activeTab === 'customers' && 'إدارة علاقات العملاء (CRM)'}
                    {activeTab === 'coupons' && 'الكوبونات والعروض'}
                    {activeTab === 'analytics' && 'مؤشرات الأداء والـ BI'}
                    {activeTab === 'settings' && 'إعدادات المتجر والهوية البصرية'}
                    {activeTab === 'audit' && 'سجل التدقيق والأمان (Audit Log)'}
                  </span>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('storefront');
                      setStorefrontSubView('home');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                    <span>متجر العملاء</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleMode}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {theme.mode === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-700" />
                    )}
                  </button>
                </div>
              </header>

              <main
                className={
                  activeTab === 'chat'
                    ? 'flex-1 flex flex-col overflow-hidden min-h-0 p-0 w-full'
                    : 'flex-1 overflow-auto p-6 max-w-7xl w-full mx-auto'
                }
              >
                {activeTab === 'chat' && <ChatCommandCenter />}
                {activeTab === 'ecommerce' && (
                  <EcommerceStudioPage
                    onOpenStorefront={() => {
                      setCurrentView('storefront');
                      setStorefrontSubView('home');
                    }}
                  />
                )}
                {activeTab === 'products' && <ProductsGridPage />}
                {activeTab === 'categories' && <CategoriesPage />}
                {activeTab === 'orders' && <OrdersPage />}
                {activeTab === 'inventory' && <InventoryPage />}
                {activeTab === 'customers' && <CustomersPage />}
                {activeTab === 'coupons' && <CouponsPage />}
                {activeTab === 'analytics' && <AnalyticsPage />}
                {activeTab === 'settings' && <StoreSettingsPage />}
                {activeTab === 'audit' && <AuditLogPage />}
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider>
          <MainAppContent />
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
};

export default App;
