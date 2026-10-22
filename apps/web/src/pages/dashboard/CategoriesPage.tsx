// apps/web/src/pages/dashboard/CategoriesPage.tsx
import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, CheckCircle2, FolderPlus } from 'lucide-react';

interface CategoriesPageProps {
  tenantId?: string;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ tenantId }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const activeTid = tenantId || 'tenant-moustafa-tech';

  const loadCategories = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/v1/categories?tenant_id=${activeTid}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadCategories();
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;
    setIsAdding(true);
    try {
      await fetch(`http://127.0.0.1:8001/api/v1/categories?tenant_id=${activeTid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name_ar: nameAr, slug: slug.trim() || undefined }),
      });
      setNameAr('');
      setSlug('');
      await loadCategories();
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف القسم "${name}"؟`)) return;
    await fetch(`http://127.0.0.1:8001/api/v1/categories/${id}?tenant_id=${activeTid}`, { method: 'DELETE' });
    await loadCategories();
  };

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>إدارة الأقسام والتصنيفات (Categories Manager)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تنظيم وهيكلة أقسام المتجر الإلكتروني
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Category Form */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-sky-500" />
            <span>إضافة قسم جديد</span>
          </h3>

          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">اسم القسم (بالعربية)</label>
              <input
                type="text"
                required
                placeholder="مثال: ساعات ذكية"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">الرابط المخصص (Slug اختياري)</label>
              <input
                type="text"
                placeholder="smart-watches"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding || !nameAr.trim()}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAdding ? 'جاري الإضافة...' : 'حفظ القسم'}</span>
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
            <span>الأقسام الحالية ({categories.length})</span>
          </div>

          {categories.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto">
                <FolderPlus className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                لا توجد أقسام في متجرك حالياً
              </p>
              <p className="text-[11px] text-slate-400">
                استخدم النموذج الجانبي لإنشاء أول قسم لتصنيف منتجاتك
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{c.name}</h4>
                    <div className="font-mono text-[11px] text-slate-400 mt-0.5">/{c.slug}</div>
                  </div>

                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="حذف القسم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
