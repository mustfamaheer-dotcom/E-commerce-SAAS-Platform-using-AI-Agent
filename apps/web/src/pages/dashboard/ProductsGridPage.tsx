// apps/web/src/pages/dashboard/ProductsGridPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Plus,
  UploadCloud,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Package,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_101',
    sku: 'SPK-JBL-01',
    name: 'JBL Flip 6 Waterproof Speaker',
    category: 'Speakers',
    price: 5000.0,
    cost: 3800.0,
    stock: 72,
    isActive: true,
  },
  {
    id: 'prod_102',
    sku: 'SPK-ANKER-02',
    name: 'Anker Soundcore Motion+ Bluetooth Speaker',
    category: 'Speakers',
    price: 3200.0,
    cost: 2100.0,
    stock: 58,
    isActive: true,
  },
  {
    id: 'prod_109',
    sku: 'SPK-MINI-09',
    name: 'Mini Bluetooth Pocket Speaker',
    category: 'Speakers',
    price: 500.0,
    cost: 450.0,
    stock: 64,
    isActive: true,
  },
  {
    id: 'prod_115',
    sku: 'CHG-65W-GAN',
    name: '65W GaN Fast Wall Charger',
    category: 'Chargers',
    price: 850.0,
    cost: 400.0,
    stock: 12,
    isActive: true,
  },
  {
    id: 'prod_120',
    sku: 'CAB-USBC-2M',
    name: 'Braided USB-C to USB-C Cable 2M',
    category: 'Cables',
    price: 250.0,
    cost: 90.0,
    stock: 4,
    isActive: true,
  },
];

export const ProductsGridPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith('ar');

  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Filters
  const categories = ['ALL', 'Speakers', 'Chargers', 'Cables'];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropzoneActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadStatus(
        isRtl
          ? `تم رفع الملف '${file.name}' بنجاح وتوليد رابط S3 آمن.`
          : `File '${file.name}' uploaded successfully to secure S3 storage.`,
      );
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans"
    >
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            {isRtl ? 'إدارة المنتجات والمخزون' : 'Catalog & Inventory Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'تحكم متكامل بالمنتجات، التسعير، وتنبيهات نفاد المخزون المدعومة بالذكاء الاصطناعي'
              : 'Autonomous catalog operations, dynamic pricing, and probabilistic stockout alerts'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isRtl ? 'إضافة منتج جديد' : 'New Product'}
          </button>
        </div>
      </div>

      {/* Media Dropzone (S3/Cloudinary Presigned Upload) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDropzoneActive(true);
        }}
        onDragLeave={() => setIsDropzoneActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-4 transition-all text-center flex flex-col items-center justify-center gap-2 ${
          isDropzoneActive
            ? 'border-indigo-400 bg-indigo-950/20 text-indigo-300'
            : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
        }`}
      >
        <UploadCloud className="w-6 h-6 text-indigo-400" />
        <div className="text-xs font-medium">
          {isRtl
            ? 'اسحب وأفلت صور المنتجات أو ملفات Excel للرفع المباشر عبر S3 Presigned URLs'
            : 'Drag & drop product images or Excel sheets for direct S3 presigned upload'}
        </div>
        {uploadStatus && (
          <div className="text-xs text-emerald-400 font-medium">{uploadStatus}</div>
        )}
      </div>

      {/* Controls Strip: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute top-3 left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isRtl ? 'بحث فوري (MeiliSearch)...' : 'Instant search (MeiliSearch)...'
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? (isRtl ? 'الكل' : 'All') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="focus:outline-none">
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">{isRtl ? 'الاسم' : 'Name'}</th>
                <th className="px-4 py-3 font-semibold">{isRtl ? 'الفئة' : 'Category'}</th>
                <th className="px-4 py-3 font-semibold">{isRtl ? 'السعر' : 'Price'}</th>
                <th className="px-4 py-3 font-semibold">{isRtl ? 'التكلفة' : 'Cost'}</th>
                <th className="px-4 py-3 font-semibold">{isRtl ? 'المخزون' : 'Stock'}</th>
                <th className="px-4 py-3 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                let stockBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isRtl ? 'متوفر' : 'In Stock'}
                  </span>
                );
                if (p.stock <= 5) {
                  stockBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                      {isRtl ? 'حرج جداً' : 'Critical Risk'}
                    </span>
                  );
                } else if (p.stock <= 20) {
                  stockBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {isRtl ? 'منخفض' : 'Low Stock'}
                    </span>
                  );
                }

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-slate-800/40 ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button onClick={() => toggleSelectOne(p.id)} className="focus:outline-none">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-indigo-300">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400">{p.category}</td>
                    <td className="px-4 py-3 font-semibold text-white">{p.price.toFixed(2)} EGP</td>
                    <td className="px-4 py-3 text-slate-400">{p.cost.toFixed(2)} EGP</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{p.stock}</td>
                    <td className="px-4 py-3">{stockBadge}</td>
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
