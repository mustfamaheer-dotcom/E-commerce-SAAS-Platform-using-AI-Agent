// apps/web/src/pages/dashboard/OrdersPage.tsx
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Truck, CheckCircle2, Clock, Filter, Eye } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const loadOrders = async () => {
    try {
      const url =
        selectedStatus === 'ALL'
          ? 'http://127.0.0.1:8001/api/v1/orders'
          : `http://127.0.0.1:8001/api/v1/orders?status=${selectedStatus}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    await fetch(`http://127.0.0.1:8001/api/v1/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
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
              {orders.map((o) => {
                const isShipped = o.status === 'SHIPPED' || o.status === 'DELIVERED';
                return (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {o.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {o.shippingAddress?.name || 'عميل مباشر'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {o.shippingAddress?.city} • {o.shippingAddress?.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {o.total?.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <Truck className="w-3.5 h-3.5" />
                        <span>{o.trackingNumber || 'جاهز للشحن'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isShipped
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {o.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'SHIPPED')}
                            className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            <span>شحن الطلب</span>
                          </button>
                        )}
                        {o.status === 'SHIPPED' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'DELIVERED')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>تم التسليم</span>
                          </button>
                        )}
                        {o.status === 'DELIVERED' && (
                          <span className="text-[11px] text-slate-400 font-semibold">مكتمل ✓</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
