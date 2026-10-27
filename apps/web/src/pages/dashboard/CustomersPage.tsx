// apps/web/src/pages/dashboard/CustomersPage.tsx
import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { Users, UserX } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface CustomersPageProps {
  tenantId?: string;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ tenantId }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const activeTid = tenantId || 'tenant-moustafa-tech';

  useEffect(() => {
    fetch(`${API_BASE_URL}/customers?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(() => {});
  }, [tenantId]);

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>إدارة علاقات العملاء (Customer CRM)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            سجل العملاء، إجمالي الإنفاق، وتكرار عمليات الشراء
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">اسم العميل</th>
                <th className="px-4 py-3 font-semibold">رقم الهاتف</th>
                <th className="px-4 py-3 font-semibold">البريد الإلكتروني</th>
                <th className="px-4 py-3 font-semibold">المحافظة</th>
                <th className="px-4 py-3 font-semibold">عدد الطلبات</th>
                <th className="px-4 py-3 font-semibold">إجمالي الإنفاق</th>
                <th className="px-4 py-3 font-semibold text-center">تصنيف العميل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <UserX className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                        لا يوجد عملاء مسجلين بعد في متجرك
                      </p>
                      <p className="text-xs">
                        عند قيام المشترين بإنشاء حسابات أو تسجيل طلبات شراء ستظهر بياناتهم هنا
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const isVip = c.totalSpent > 30000;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        {c.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {c.email || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {c.governorate || 'القاهرة'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {c.totalOrders}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {c.totalSpent?.toLocaleString()} ج.م
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isVip
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isVip ? <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-500" /><span>عميل ذهبي VIP</span></span> : 'عميل نشط'}
                        </span>
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
