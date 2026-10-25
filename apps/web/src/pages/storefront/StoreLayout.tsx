// apps/web/src/pages/storefront/StoreLayout.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Globe, Sun, Moon } from 'lucide-react';
import { setAppLanguage } from '../../i18n';
import { API_BASE_URL } from '../../services/api';

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
      try {
        const res = await fetch(`${API_BASE_URL}/stores`);
        if (res.ok) {
          const data = await res.json();
          const stores = Array.isArray(data) ? data : data.stores || [];
          const found = stores.find((s: any) => s.slug === tenantSlug || s.id === tenantSlug);
          if (found) {
            return {
              id: found.id,
              slug: found.slug || tenantSlug,
              name: found.name,
              currency: found.currency || 'EGP',
              theme: {
                mode: 'dark',
                primaryColor: '#0ea5e9',
                backgroundColor: '#0f172a',
              },
              paymentMethods: ['Paymob', 'InstaPay', 'الدفع عند الاستلام'],
              shippingPolicy: 'شحن لجميع المحافظات خلال 24-48 ساعة',
            };
          }
        }
      } catch (e) {
        console.warn('Could not fetch tenant, using default branding:', e);
      }
      return {
        id: tenantSlug || 'tenant-moustafa-tech',
        slug: tenantSlug || 'moustafa-tech',
        name: 'Moustafa Tech',
        currency: 'EGP',
        theme: {
          mode: 'dark',
          primaryColor: '#0ea5e9',
          backgroundColor: '#0f172a',
        },
        paymentMethods: ['Paymob', 'InstaPay', 'الدفع عند الاستلام'],
        shippingPolicy: 'شحن لجميع المحافظات خلال 24-48 ساعة عبر بوسطة',
      };
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
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight">{tenant?.name}</span>
              <span className="block text-[10px] text-emerald-500 font-medium">متجر رسمي معتمد</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{currentLang === 'ar-EG' ? 'English' : 'عربي'}</span>
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};
