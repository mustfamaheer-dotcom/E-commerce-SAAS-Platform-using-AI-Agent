// apps/web/src/pages/dashboard/OrdersPage.tsx
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Truck, CheckCircle2, Clock, Filter, Eye, PackageOpen, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface OrdersPageProps {
  tenantId?: string;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ tenantId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeTid = tenantId || localStorage.getItem('techzone_active_store_id') || 'tenant-moustafa-tech';

  const loadOrders = async () => {
    try {
      const url =
        selectedStatus === 'ALL'
          ? `${API_BASE_URL}/orders?tenant_id=${activeTid}`
          : `${API_BASE_URL}/orders?tenant_id=${activeTid}&status=${selectedStatus}`;
      const res = await fetch(url, {
        headers: {
          'X-Tenant-ID': activeTid,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 6000);
    const handleOrderCreated = () => loadOrders();
    window.addEventListener('techzone:order-created', handleOrderCreated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('techzone:order-created', handleOrderCreated);
    };
  }, [activeTid, selectedStatus]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    await fetch(`${API_BASE_URL}/orders/${orderId}/status?tenant_id=${activeTid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': activeTid },
      body: JSON.stringify({ status: nextStatus, note: `Staff marked order as ${nextStatus}` }),
    });
    await loadOrders();
  };

  const statuses = ['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>إدارة وتتبع الطلبات والشحن (Orders & Fulfillment)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            متابعة طلبات العملاء، تحديث الحالات، وبوالص شحن بوسطة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
            <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث الطلبات'}</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  selectedStatus === st
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'جميع الطلبات' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">رقم الطلب</th>
                <th className="px-4 py-3 font-semibold">العميل والمحافظة</th>
                <th className="px-4 py-3 font-semibold">طريقة الدفع</th>
                <th className="px-4 py-3 font-semibold">الإجمالي</th>
                <th className="px-4 py-3 font-semibold">بوليصة بوسطة</th>
                <th className="px-4 py-3 font-semibold">حالة الطلب</th>
                <th className="px-4 py-3 font-semibold text-center">تحديث الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <PackageOpen className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                        لا توجد طلبات شراء مسجلة في متجرك حالياً
                      </p>
                      <p className="text-[11px] text-slate-400">
                        الطلبات التي يقوم بها العملاء من واجهة المتجر ستظهر هنا تلقائياً وفوراً
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const itemsCount = o.items ? o.items.length : 1;
                  const addr = o.shipping_address || {};
                  const city = addr.city || 'القاهرة';
                  const custName = addr.name || o.customer_name || 'عميل المتجر';

                  const statusColors: Record<string, string> = {
                    CONFIRMED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    PROCESSING: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
                    SHIPPED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                    DELIVERED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                    CANCELLED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                  };

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">{o.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString('ar-EG') : 'اليوم'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">{custName}</span>
                        <span className="text-[11px] text-slate-400">{city}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{o.payment_method || 'COD'}</span>
                        <span className="block text-[10px] text-slate-400">{itemsCount} منتجات</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {Number(o.total || 0).toLocaleString()} ج.م
                      </td>
                      <td className="px-4 py-3 font-mono text-sky-600 dark:text-sky-400">
                        {o.shipping_awb || 'BST-908124'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            statusColors[o.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {o.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'PROCESSING')}
                              className="px-2 py-1 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300 hover:bg-sky-100 font-semibold text-[11px] border border-sky-200 dark:border-sky-800"
                            >
                              تجهيز بالمخزن
                            </button>
                          )}
                          {o.status === 'PROCESSING' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'SHIPPED')}
                              className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800"
                            >
                              تسليم لبوسطة 🚚
                            </button>
                          )}
                          {o.status === 'SHIPPED' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'DELIVERED')}
                              className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800"
                            >
                              تأكيد التحصيل والتسليم ✓
                            </button>
                          )}
                          {o.status === 'DELIVERED' && (
                            <span className="text-[11px] text-slate-400 font-semibold">مكتمل ✓</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
