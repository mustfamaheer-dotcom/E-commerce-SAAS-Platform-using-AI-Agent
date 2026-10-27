// apps/web/src/pages/dashboard/InventoryPage.tsx
import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Minus, CheckCircle2, PackageSearch } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface InventoryPageProps {
  tenantId?: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ tenantId }) => {
  const [items, setItems] = useState<any[]>([]);
  const activeTid = tenantId || 'tenant-moustafa-tech';

  const loadInventory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory?tenant_id=${activeTid}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadInventory();
  }, [tenantId]);

  const handleAdjustStock = async (productId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    await fetch(`${API_BASE_URL}/inventory/${productId}?tenant_id=${activeTid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_qty: nextStock }),
    });
    await loadInventory();
  };

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>مراقبة المخزون وتنبيهات النفاد (Inventory & Stock Alerts)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            فحص كميات المستودع وتنبيهات نواقص السلع والأرباح المعرضة للخطر
          </p>
        </div>
      </div>

      {/* Alert Banner if any items low in stock */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-xs">
            <span className="font-bold block">
              تنبيه ذكي: يوجد {lowStockCount} منتجات في مستوى مخزون حرج!
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400">
              يُنصح بإعادة التوريد لتجنب خسارة المبيعات اليومية المحتملة.
            </span>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">اسم المنتج</th>
                <th className="px-4 py-3 font-semibold">السعر</th>
                <th className="px-4 py-3 font-semibold">الرصيد الحالي</th>
                <th className="px-4 py-3 font-semibold">حد الأمان</th>
                <th className="px-4 py-3 font-semibold">حالة التوفر</th>
                <th className="px-4 py-3 font-semibold text-center">تعديل سريع (+/-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <PackageSearch className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                        لا توجد عناصر مسجلة في مستودع متجرك حالياً
                      </p>
                      <p className="text-xs">
                        قم بإضافة منتجات من صفحة الكتالوج لتظهر كميات المخزون وتنبيهات الأمان هنا
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                      {item.price?.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3 font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {item.stock}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {item.threshold} قطع
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          item.isLowStock
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {item.isLowStock ? 'مخزون منخفض' : 'متوفر'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleAdjustStock(item.id, item.stock, -1)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-600 hover:text-rose-600 transition-colors"
                          title="إنقاص قطعة"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item.id, item.stock, 1)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-600 hover:text-emerald-600 transition-colors"
                          title="زيادة قطعة"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
