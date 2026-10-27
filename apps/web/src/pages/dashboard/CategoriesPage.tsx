// apps/web/src/pages/dashboard/CategoriesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  FolderPlus,
  Package,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface CategoriesPageProps {
  tenantId?: string;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ tenantId }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeTid = tenantId || 'tenant-moustafa-tech';

  const loadData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories?tenant_id=${activeTid}`),
        fetch(`${API_BASE_URL}/products?tenant_id=${activeTid}`),
      ]);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/categories?tenant_id=${activeTid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ar: nameAr.trim(),
          slug: slug.trim() || undefined,
          product_ids: selectedProductIds,
        }),
      });
      if (res.ok) {
        setSuccessMsg(`تم إنشاء القسم "${nameAr}" وربط ${selectedProductIds.length} منتج بنجاح`);
        setNameAr('');
        setSlug('');
        setSelectedProductIds([]);
        setProductSearch('');
        setTimeout(() => setSuccessMsg(null), 3500);
        await loadData();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف القسم "${name}"؟ ستصبح المنتجات التابعة له غير مصنفة.`)) return;
    await fetch(`${API_BASE_URL}/categories/${id}?tenant_id=${activeTid}`, { method: 'DELETE' });
    await loadData();
  };

  const toggleSelectProduct = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const filteredFormProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>إدارة وتصنيف الأقسام (Categories & Product Grouping)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            إنشاء تصنيفات المتجر وربط المنتجات والسلع بها مباشرة لسهولة التصفح في متجر العملاء
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Category Form (5 cols on large) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-500" />
              <span>إضافة قسم جديد وتعيين منتجات</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              حدد اسم القسم واختر المنتجات التي تنتمي إليه
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                اسم القسم (بالعربية) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: ساعات ذكية وإلكترونيات"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                الرابط المخصص (Slug اختياري)
              </label>
              <input
                type="text"
                placeholder="smart-watches"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-xs"
              />
            </div>

            {/* Product Assignment Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-sky-500" />
                  <span>تعيين منتجات لهذا القسم</span>
                </label>
                <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {selectedProductIds.length} محدد
                </span>
              </div>

              {/* Product Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج لإضافته..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pr-8 pl-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              {/* Scrollable Products Checklist */}
              <div className="max-h-48 overflow-y-auto space-y-1 p-1 bg-slate-50/50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-800">
                {filteredFormProducts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    لا توجد منتجات مطابقة للبحث
                  </div>
                ) : (
                  filteredFormProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleSelectProduct(p.id)}
                        className={`p-2 rounded-md flex items-center justify-between cursor-pointer text-xs transition-colors ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 font-medium text-slate-900 dark:text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate max-w-[200px]">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="font-mono tabular-nums text-xs text-slate-400">
                          {Number(p.price || 0).toLocaleString('en-US')} ج.م
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdding || !nameAr.trim()}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50 mt-4 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAdding ? 'جاري الحفظ...' : 'حفظ القسم والمنتجات المحددة'}</span>
            </button>
          </form>
        </div>

        {/* Categories List (7 cols on large) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span>الأقسام المفعلة ({categories.length})</span>
            <span className="text-xs text-slate-400 font-normal">
              انقر على أي قسم لعرض قائمة المنتجات التابعة له
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto">
                <FolderPlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                لا توجد أقسام مسجلة في متجرك حالياً
              </p>
              <p className="text-xs text-slate-400">
                استخدم النموذج لإنشاء وتصنيف السلع في أول قسم
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((c) => {
                const isExpanded = expandedCatId === c.id;
                const prodCount = c.productsCount || (c.products ? c.products.length : 0);
                const assignedProds = c.products || [];

                return (
                  <div key={c.id} className="transition-colors">
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedCatId(isExpanded ? null : c.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {c.name}
                            </h4>
                            <span className="font-mono tabular-nums text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                              {prodCount} {prodCount === 1 ? 'منتج' : 'منتجات'}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-slate-400 mt-0.5">
                            /{c.slug}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="حذف هذا القسم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Assigned Products Preview */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/60 text-xs space-y-2">
                        <div className="font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>المنتجات المندرجة تحت قسم &quot;{c.name}&quot;:</span>
                          <span className="font-mono tabular-nums text-slate-400">
                            {assignedProds.length} عناصر
                          </span>
                        </div>

                        {assignedProds.length === 0 ? (
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                            لا توجد منتجات مسندة لهذا القسم بعد. يمكنك تعيين المنتجات من صفحة المنتجات والكتالوج.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {assignedProds.map((prod: any) => (
                              <div
                                key={prod.id}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs"
                              >
                                <div className="truncate max-w-[170px]">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                    {prod.name}
                                  </span>
                                  <span className="font-mono tabular-nums text-xs text-slate-400">
                                    {prod.sku}
                                  </span>
                                </div>
                                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                                  {Number(prod.price || 0).toLocaleString('en-US')} ج.م
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
