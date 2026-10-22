// apps/web/src/pages/dashboard/CouponsPage.tsx
import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState('percent');
  const [minOrder, setMinOrder] = useState('0');
  const [isAdding, setIsAdding] = useState(false);

  const loadCoupons = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/api/v1/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) return;
    setIsAdding(true);
    try {
      await fetch('http://127.0.0.1:8001/api/v1/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: parseFloat(value),
          min_order: parseFloat(minOrder) || 0,
        }),
      });
      setCode('');
      setValue('');
      setMinOrder('0');
      await loadCoupons();
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكوبون "${codeName}"؟`)) return;
    await fetch(`http://127.0.0.1:8001/api/v1/coupons/${id}`, { method: 'DELETE' });
    await loadCoupons();
  };

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>إدارة الكوبونات والخصومات (Coupons & Promotions)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            توليد أكواد الخصم والحملات الترويجية لزيادة المبيعات
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-sky-500" />
            <span>إنشاء كوبون جديد</span>
          </h3>

          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">كود الكوبون</label>
              <input
                type="text"
                required
                placeholder="مثال: SALE25"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">نوع الخصم</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">قيمة الخصم</label>
                <input
                  type="number"
                  required
                  placeholder={type === 'percent' ? '15' : '100'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">الحد الأدنى للطلب (ج.م)</label>
              <input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding || !code.trim() || !value}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAdding ? 'جاري الإنشاء...' : 'تفعيل الكوبون'}</span>
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            الكوبونات النشطة ({coupons.length})
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {coupons.map((c) => (
              <div key={c.id || c.code} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                    %
                  </div>
                  <div>
                    <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {c.code}
                    </span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      خصم {c.value} {c.type === 'percent' ? '%' : 'ج.م'} • الحد الأدنى: {c.minOrder?.toLocaleString()} ج.م • مرات الاستخدام: {c.usedCount}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(c.id, c.code)}
                  className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
