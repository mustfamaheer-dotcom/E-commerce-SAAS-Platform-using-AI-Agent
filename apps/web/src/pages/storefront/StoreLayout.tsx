// apps/web/src/pages/storefront/StoreLayout.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Globe, Sun, Moon } from 'lucide-react';
import { setAppLanguage } from '../../i18n';

interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  currency: string;
  theme: {
    mode: 'dark' | 'light';
    primaryColor: string;
    backgroundColor: string;
  };
  paymentMethods: string[];
  shippingPolicy: string;
}

export const StoreLayout: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [currentLang, setCurrentLang] = useState<'ar-EG' | 'en-US'>('ar-EG');

  // TanStack Query for dynamic multi-tenant branding
  const { data: tenant, isLoading, error } = useQuery<TenantConfig>({
    queryKey: ['tenant', tenantSlug],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/v1/tenants/${tenantSlug}`);
      if (!res.ok) {
        throw new Error('Tenant storefront not found');
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // 15 min cache
  });

  const isDark = tenant?.theme?.mode === 'dark';
  const primaryColor = tenant?.theme?.primaryColor || '#4F46E5';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'ar-EG' ? 'en-US' : 'ar-EG';
    setCurrentLang(nextLang);
    setAppLanguage(nextLang);
  };

  useEffect(() => {
    if (tenant) {
      document.title = `${tenant.name} — Storefront`;
    }
  }, [tenant]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Resolving Storefront & Tenant RLS...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            404
          </div>
          <h2 className="text-xl font-bold text-slate-900">Store Not Found</h2>
          <p className="text-xs text-slate-500">
            No active tenant exists with the slug <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{tenantSlug}</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      style={{
        // Dynamic CSS variables injected from tenant config
        ['--brand-primary' as any]: primaryColor,
      }}
    >
      {/* Storefront Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-tight tracking-tight">{tenant.name}</h1>
              <span className="text-[10px] font-mono text-slate-400">/{tenant.slug}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{currentLang === 'ar-EG' ? 'العربية' : 'English'}</span>
            </button>

            <button
              className="p-2 rounded-xl text-white flex items-center justify-center relative shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Storefront Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ tenant }} />
      </main>

      {/* Storefront Footer */}
      <footer
        className={`border-t py-8 mt-12 text-center text-xs ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
        }`}
      >
        <p>© {new Date().getFullYear()} {tenant.name}. Secured by TechZone PostgreSQL Row-Level Security.</p>
      </footer>
    </div>
  );
};
