// apps/web/src/App.tsx
import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { ChatCommandCenter } from './pages/dashboard/ChatCommandCenter';
import { ProductsGridPage } from './pages/dashboard/ProductsGridPage';
import { CheckoutPage } from './pages/storefront/CheckoutPage';
import { AuditLogPage } from './pages/dashboard/AuditLogPage';
import { MessageSquare, Package, ShoppingCart, ShieldCheck, Sparkles } from 'lucide-react';
import './i18n';

const queryClient = new QueryClient();

type TabType = 'chat' | 'catalog' | 'checkout' | 'audit';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans" dir="rtl">
          {/* Top Global Navigation Bar */}
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  TechZone Agentic Platform
                </h1>
                <p className="text-xs text-slate-400">منصة التجارة الإلكترونية المدارة بالوكلاء الأذكياء</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 space-x-1 space-x-reverse">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>مركز قيادة الوكيل (Chat)</span>
              </button>

              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'catalog'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>الكتالوج والمخزون</span>
              </button>

              <button
                onClick={() => setActiveTab('checkout')}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'checkout'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>متجر الدفع (Checkout)</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'audit'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>سجل الأمان والتدقيق</span>
              </button>
            </nav>

            <div className="flex items-center space-x-3 space-x-reverse">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1.5 animate-pulse"></span>
                النظام متصل
              </span>
            </div>
          </header>

          {/* Active Tab View */}
          <main className="flex-1 overflow-auto">
            {activeTab === 'chat' && <ChatCommandCenter />}
            {activeTab === 'catalog' && (
              <div className="p-6">
                <ProductsGridPage />
              </div>
            )}
            {activeTab === 'checkout' && (
              <div className="p-6">
                <CheckoutPage />
              </div>
            )}
            {activeTab === 'audit' && (
              <div className="p-6">
                <AuditLogPage />
              </div>
            )}
          </main>
        </div>
      </Provider>
    </QueryClientProvider>
  );
};

export default App;
