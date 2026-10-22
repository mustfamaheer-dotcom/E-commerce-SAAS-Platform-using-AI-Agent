// apps/web/src/pages/dashboard/ProductsGridPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';

export const ProductsGridPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('http://127.0.0.1:8001/api/v1/products'),
        fetch('http://127.0.0.1:8001/api/v1/categories'),
      ]);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProduct = async (formData: any) => {
    const isEdit = Boolean(editingProduct);
    const url = isEdit
      ? `http://127.0.0.1:8001/api/v1/products/${editingProduct.id}`
      : 'http://127.0.0.1:8001/api/v1/products';
    const method = isEdit ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    await loadData();
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) return;
    await fetch(`http://127.0.0.1:8001/api/v1/products/${id}`, {
      method: 'DELETE',
    });
    await loadData();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div dir="rtl" className="space-y-5 font-sans text-slate-800 dark:text-slate-100">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>إدارة المنتجات والكتالوج (Products Manager)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            إضافة وتعديل وحذف المنتجات، وضبط الأسعار والمخزون والتنبيهات الذكية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Controls Strip: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute top-2.5 right-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو SKU..."
            className="w-full pr-8 pl-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            الكل ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="focus:outline-none">
                    {selectedIds.length === filteredProducts.length &&
                    filteredProducts.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-2.5 font-semibold">SKU</th>
                <th className="px-4 py-2.5 font-semibold">اسم المنتج</th>
                <th className="px-4 py-2.5 font-semibold">السعر</th>
                <th className="px-4 py-2.5 font-semibold">المخزون</th>
                <th className="px-4 py-2.5 font-semibold">الحالة</th>
                <th className="px-4 py-2.5 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const isLow = p.stock <= 5;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      isSelected ? 'bg-sky-50/70 dark:bg-sky-950/20' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleSelectOne(p.id)}
                        className="focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sky-600 dark:text-sky-400 font-semibold">
                      {p.sku}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-200">
                      {p.name}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-slate-100 font-bold">
                      {p.price?.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-200">
                      {p.stock}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          isLow
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {isLow ? 'مخزون حرج' : 'متوفر'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        categories={categories}
      />
    </div>
  );
};
