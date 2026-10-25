// apps/web/src/App.tsx
import React, { useState, useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { store, RootState } from './store';
import { ThemeProvider, useAppTheme } from './contexts/ThemeContext';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { getCurrentUser, setCurrentUser, UserAccount } from './services/auth';
import { API_BASE_URL } from './services/api';
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
import { StorefrontAiAssistant } from './components/chat/StorefrontAiAssistant';
import { FloatingIslandNavbar } from './components/storefront/FloatingIslandNavbar';
import { MiniCartDrawer } from './components/storefront/MiniCartDrawer';
import { StorefrontFooter } from './components/storefront/StorefrontFooter';

import {
  Check,
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
  LogOut,
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
        badge: 'Live AI',
      },
    ],
  },
  {
    title_ar: 'التجارة والعمليات التشغيلية',
    items: [
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
        label_ar: 'الطلبات والمبيعات',
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
    title_ar: 'التحليلات وهوية المتجر',
    items: [
      {
        key: 'analytics',
        label_ar: 'مؤشرات الأداء والـ BI',
        icon: TrendingUp,
      },
      {
        key: 'ecommerce',
        label_ar: 'استوديو تخصيص المتجر',
        icon: Store,
        badge: 'Studio',
      },
      {
        key: 'settings',
        label_ar: 'إعدادات المتجر والشحن',
        icon: Settings,
      },
      {
        key: 'audit',
        label_ar: 'سجل التدقيق والأمان',
        icon: ShieldCheck,
      },
    ],
  },
];

const MainAppContent: React.FC = () => {
  const { theme, toggleMode } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication State - Defaults to null unless user explicitly logged in
  const [user, setUser] = useState<UserAccount | null>(() => getCurrentUser());

  const [activeTab, setActiveTab] = useState<NavItemKey>(() => {
    const savedTab = localStorage.getItem('techzone_active_tab') as NavItemKey | null;
    return savedTab || 'analytics';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Storefront sub-navigation (Home, Cart, Checkout)
  const [storefrontSubView, setStorefrontSubView] = useState<StorefrontSubView>(() => {
    const p = window.location.pathname;
    if (p.includes('/cart')) return 'cart';
    if (p.includes('/checkout')) return 'checkout';
    const savedSub = localStorage.getItem('techzone_storefront_subview') as StorefrontSubView | null;
    return savedSub || 'home';
  });

  // Slide-over Mini-Cart Drawer State
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  // Stores State - Loaded dynamically from live database tenants
  const [merchantStores, setMerchantStores] = useState<ProvisionedStore[]>([]);
  const [activeStore, setActiveStore] = useState<ProvisionedStore | null>(() => {
    const savedStore = localStorage.getItem('techzone_active_store');
    if (savedStore) {
      try {
        return JSON.parse(savedStore);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [navBadges, setNavBadges] = useState<Record<string, string>>({});
  const [liveSettings, setLiveSettings] = useState<any>(null);

  useEffect(() => {
    const tid = activeStore?.id || user?.tenantId || 'tenant-moustafa-tech';
    fetch(`${API_BASE_URL}/stores/me?tenant_id=${tid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setLiveSettings(data.settings);
        }
      })
      .catch(() => {});
  }, [activeStore, user]);

  useEffect(() => {
    localStorage.setItem('techzone_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('techzone_storefront_subview', storefrontSubView);
  }, [storefrontSubView]);

  useEffect(() => {
    if (activeStore) {
      localStorage.setItem('techzone_active_store', JSON.stringify(activeStore));
    }
  }, [activeStore]);

  useEffect(() => {
    const handleStoreUpdated = (e: any) => {
      if (e?.detail) {
        if (e.detail.name) {
          setActiveStore((prev) => (prev ? { ...prev, name: e.detail.name } : prev));
          document.title = `${e.detail.name} — المتجر الإلكتروني`;
        }
        if (e.detail.socialLinks || e.detail.phone || e.detail.governorate) {
          setLiveSettings((prev: any) => ({
            ...prev,
            socialLinks: e.detail.socialLinks || prev?.socialLinks,
            contactPhone: e.detail.phone || prev?.contactPhone,
            governorate: e.detail.governorate || prev?.governorate,
          }));
        }
      }
    };
    window.addEventListener('techzone:store-updated', handleStoreUpdated);
    return () => window.removeEventListener('techzone:store-updated', handleStoreUpdated);
  }, []);

  useEffect(() => {
    const emailParam = user?.email ? `?owner_email=${encodeURIComponent(user.email)}` : '';
    fetch(`${API_BASE_URL}/stores${emailParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMerchantStores(data);
          const found = data.find((s: any) => s.id === user?.tenantId) || data[0];
          setActiveStore(found);
        } else if (user?.tenantId && user?.storeName) {
          const fallbackStore: ProvisionedStore = {
            id: user.tenantId,
            slug: user.tenantId.replace('tenant-', ''),
            name: user.storeName,
            category: user.businessType || 'تجارة عامة',
            currency: 'EGP',
            themeMode: 'dark',
            createdAt: new Date().toISOString(),
            adminUrl: `/swm-admin`,
            storefrontUrl: `/`,
          };
          setMerchantStores([fallbackStore]);
          setActiveStore(fallbackStore);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const tid = activeStore?.id || user?.tenantId || 'tenant-moustafa-tech';
    fetch(`${API_BASE_URL}/analytics/summary?tenant_id=${tid}`)
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          const formatNum = (num: number) => {
            if (!num) return '0';
            if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
            if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
            return `${num}`;
          };
          setNavBadges({
            products: formatNum(d.totalProducts),
            orders: formatNum(d.totalOrders),
            customers: formatNum(d.totalCustomers),
            analytics: formatNum(d.totalRevenue),
          });
        }
      })
      .catch(() => {});
  }, [activeStore, user]);

  const handleAuthSuccess = (account: UserAccount) => {
    setUser(account);
    setCurrentUser(account);
    navigate('/swm-admin');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentUser(null);
    localStorage.removeItem('techzone_active_tab');
    localStorage.removeItem('techzone_active_store');
    navigate('/login');
  };

  const handleStoreCreated = (storeObj: ProvisionedStore) => {
    setMerchantStores((prev) => [storeObj, ...prev]);
    setActiveStore(storeObj);
  };

  const handleOpenStoreAdmin = (storeObj: ProvisionedStore) => {
    setActiveStore(storeObj);
    setActiveTab('analytics');
    navigate('/swm-admin');
  };

  const handleOpenStorefront = (storeObj: ProvisionedStore) => {
    setActiveStore(storeObj);
    setStorefrontSubView('home');
    navigate('/');
  };

  // ==============================================================
  // VIEW 1: CUSTOMER STOREFRONT (PUBLIC - MAIN URL /)
  // STRICTLY ZERO ADMIN PRIVILEGES - NO ACCESS TO ERP OR BUILDER
  // ==============================================================
  const renderStorefront = () => (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Spatial Minimalist Floating Island Navigation (NO لوحة التاجر) */}
      <FloatingIslandNavbar
        storeName={activeStore?.name || 'المتجر الإلكتروني'}
        activeSubView={storefrontSubView}
        onNavigateSubView={(view) => setStorefrontSubView(view)}
        onOpenMiniCart={() => setIsMiniCartOpen(true)}
      />

      {/* Slide-Over Frosted Glass Mini-Cart Drawer */}
      <MiniCartDrawer
        isOpen={isMiniCartOpen}
        onClose={() => setIsMiniCartOpen(false)}
        onProceedToCheckout={() => {
          setIsMiniCartOpen(false);
          setStorefrontSubView('checkout');
        }}
      />

      <main className="flex-1 pb-12">
        {storefrontSubView === 'home' && (
          <StorefrontHomePage
            tenantId={activeStore?.id}
            onOpenCart={() => setStorefrontSubView('cart')}
            onOpenCheckout={() => setStorefrontSubView('checkout')}
            onOpenMiniCart={() => setIsMiniCartOpen(true)}
          />
        )}
        {storefrontSubView === 'cart' && (
          <CartPage
            onProceedToCheckout={() => setStorefrontSubView('checkout')}
            onContinueShopping={() => setStorefrontSubView('home')}
          />
        )}
        {storefrontSubView === 'checkout' && <CheckoutPage tenantId={activeStore?.id} />}
      </main>

      {/* Customer AI Shopping Assistant */}
      <StorefrontAiAssistant
        tenantId={activeStore?.id}
        storeName={activeStore?.name}
        activeSubView={storefrontSubView}
        onNavigateSubView={(view) => setStorefrontSubView(view)}
      />

      {/* Rich Customer Footer with Admin-Controlled Social Media Channels */}
      <StorefrontFooter
        storeName={activeStore?.name || 'المتجر الإلكتروني'}
        logoUrl={theme?.logoUrl}
        socialLinks={liveSettings?.socialLinks}
        contactPhone={liveSettings?.contactPhone}
        contactEmail={liveSettings?.contactEmail}
        governorate={liveSettings?.governorate}
      />
    </div>
  );

  // ==============================================================
  // VIEW 2: MERCHANT ERP ADMIN (/swm-admin)
  // STRICT MULTI-TENANT ISOLATION - ONLY ACCESSIBLE BY AUTHENTICATED MERCHANT
  // ==============================================================
  const renderAdminDashboard = () => {
    if (!user) {
      return (
        <LoginPage
          onSuccess={handleAuthSuccess}
          onNavigateToRegister={() => navigate('/register')}
          onNavigateToHome={() => navigate('/')}
        />
      );
    }

    return (
      <div
        dir="rtl"
        className="fixed inset-0 h-screen h-[100dvh] w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex font-sans transition-colors duration-200 antialiased z-0"
      >
        {/* Sidebar Navigation - Strictly for This Merchant's Store */}
        <aside
          className={`${
            isSidebarOpen ? 'w-64' : 'w-16'
          } shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 z-30 select-none shadow-xs h-full overflow-hidden`}
        >
          {/* Sidebar Header: Shows ONLY this store */}
          <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 space-x-reverse overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Terminal className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  {merchantStores.length > 1 ? (
                    <select
                      value={activeStore?.id}
                      onChange={(e) => {
                        const found = merchantStores.find((s) => s.id === e.target.value);
                        if (found) setActiveStore(found);
                      }}
                      className="font-bold text-xs text-slate-900 dark:text-slate-100 bg-transparent border-0 cursor-pointer focus:outline-none max-w-[130px] truncate"
                    >
                      {merchantStores.map((s) => (
                        <option key={s.id} value={s.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">
                      {activeStore?.name || user?.storeName || 'متجري الخاص'}
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-500 font-semibold block truncate">
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><span>لوحة التحكم الخاصة</span></span>
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
                    const badgeText = navBadges[item.key] || item.badge;
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
                            {badgeText && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                                {badgeText}
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
              onClick={() => navigate('/hub')}
              className="w-full flex items-center justify-center p-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Store className="w-3.5 h-3.5 ml-1.5 text-sky-500" />
              {isSidebarOpen && <span>إدارة المتاجر (Hub)</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-100/60 dark:bg-slate-950">
          {/* ERP Header: Scoped strictly to THIS store */}
          <header className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-2xs z-20">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">{activeStore?.name}</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {activeTab === 'chat' && 'مركز قيادة الوكيل الذكي (AI Command Center)'}
                {activeTab === 'ecommerce' && 'استوديو تخصيص متجر العملاء (E-Commerce Studio)'}
                {activeTab === 'products' && 'إدارة المنتجات والكتالوج'}
                {activeTab === 'categories' && 'الأقسام والتصنيفات'}
                {activeTab === 'orders' && 'الطلبات والشحن'}
                {activeTab === 'inventory' && 'المخزون ونواقص السلع'}
                {activeTab === 'customers' && 'إدارة علاقات العملاء (CRM)'}
                {activeTab === 'coupons' && 'الكوبونات والعروض'}
                {activeTab === 'analytics' && 'مؤشرات الأداء والـ BI'}
                {activeTab === 'settings' && 'إعدادات المتجر والهوية البصرية'}
                {activeTab === 'audit' && 'سجل التدقيق والأمان (Audit Log)'}
              </span>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Action 1: Visit THIS store's public storefront */}
              <button
                type="button"
                onClick={() => {
                  window.open('/', '_blank');
                }}
                className="px-3.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                title="معاينة كيف يظهر متجرك للعملاء والمشترين"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>معاينة متجري كعميل</span>
              </button>

              <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

              {/* Dark Mode toggle */}
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

              {/* Merchant Account / Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="تسجيل الخروج من لوحة الإدارة"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main
            className={
              activeTab === 'chat'
                ? 'flex-1 flex flex-col overflow-hidden min-h-0 p-0 w-full'
                : activeTab === 'analytics'
                ? 'flex-1 flex flex-col overflow-y-auto lg:overflow-hidden min-h-0 p-4 sm:p-6 max-w-[1600px] w-full mx-auto'
                : 'flex-1 overflow-auto p-6 max-w-7xl w-full mx-auto'
            }
          >
            {activeTab === 'chat' && (
              <ChatCommandCenter
                tenantId={activeStore?.id || user?.tenantId}
                merchantName={user?.name}
                storeName={activeStore?.name || user?.storeName}
              />
            )}
            {activeTab === 'ecommerce' && (
              <EcommerceStudioPage
                tenantId={activeStore?.id}
                onOpenStorefront={() => {
                  window.open('/', '_blank');
                }}
              />
            )}
            {activeTab === 'products' && <ProductsGridPage tenantId={activeStore?.id} />}
            {activeTab === 'categories' && <CategoriesPage tenantId={activeStore?.id} />}
            {activeTab === 'orders' && <OrdersPage tenantId={activeStore?.id} />}
            {activeTab === 'inventory' && <InventoryPage tenantId={activeStore?.id} />}
            {activeTab === 'customers' && <CustomersPage tenantId={activeStore?.id} />}
            {activeTab === 'coupons' && <CouponsPage tenantId={activeStore?.id} />}
            {activeTab === 'analytics' && <AnalyticsPage tenantId={activeStore?.id} />}
            {activeTab === 'settings' && <StoreSettingsPage tenantId={activeStore?.id} />}
            {activeTab === 'audit' && <AuditLogPage tenantId={activeStore?.id} />}
          </main>
        </div>
      </div>
    );
  };

  return (
    <Routes>
      {/* 1. Customer Storefront (Public Main Route) */}
      <Route path="/" element={renderStorefront()} />
      <Route path="/store/*" element={renderStorefront()} />
      <Route path="/cart" element={renderStorefront()} />
      <Route path="/checkout" element={renderStorefront()} />

      {/* 2. Merchant ERP Admin Route */}
      <Route path="/swm-admin/*" element={renderAdminDashboard()} />
      <Route path="/admin/*" element={<Navigate to="/swm-admin" replace />} />

      {/* 3. Auth & Onboarding Routes */}
      <Route
        path="/login"
        element={
          <LoginPage
            onSuccess={handleAuthSuccess}
            onNavigateToRegister={() => navigate('/register')}
            onNavigateToHome={() => navigate('/')}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            onSuccess={handleAuthSuccess}
            onNavigateToLogin={() => navigate('/login')}
            onNavigateToHome={() => navigate('/')}
          />
        }
      />
      <Route
        path="/hub"
        element={
          user ? (
            <ServicesHubPage
              user={user}
              onSelectBuildNewStore={() => navigate('/builder')}
              onSelectManageCurrentStore={() => {
                setActiveTab('analytics');
                navigate('/swm-admin');
              }}
              onLogout={handleLogout}
              provisionedStores={merchantStores}
              onOpenStoreAdmin={handleOpenStoreAdmin}
              onOpenStorefront={handleOpenStorefront}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/builder"
        element={
          user ? (
            <AiStoreBuilderPage
              user={user}
              onStoreCreated={handleStoreCreated}
              onOpenStoreAdmin={handleOpenStoreAdmin}
              onOpenStorefront={handleOpenStorefront}
              onBackToHub={() => navigate('/hub')}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/landing"
        element={
          <LandingPage
            onStartBuilding={() => navigate('/register')}
            onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')}
            theme={theme.mode}
            onToggleTheme={toggleMode}
          />
        }
      />

      {/* Fallback to Customer Storefront */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider>
          <BrowserRouter>
            <MainAppContent />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
};

export default App;
