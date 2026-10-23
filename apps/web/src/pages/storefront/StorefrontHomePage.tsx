// apps/web/src/pages/storefront/StorefrontHomePage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Sparkles,
  Zap,
  Tag,
  Check,
  X,
  Plus,
  Minus,
  PackageCheck,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Award,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addToCart } from '../../store/cartSlice';
import { toggleWishlist } from '../../store/wishlistSlice';
import { useAppTheme } from '../../contexts/ThemeContext';
import { API_BASE_URL } from '../../services/api';

interface StorefrontHomePageProps {
  tenantId?: string;
  onSelectProduct?: (product: any) => void;
  onOpenCart?: () => void;
  onOpenCheckout?: () => void;
}

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'newest';

const ITEMS_PER_PAGE = 16;

export const StorefrontHomePage: React.FC<StorefrontHomePageProps> = ({
  tenantId,
  onSelectProduct,
  onOpenCart,
  onOpenCheckout,
}) => {
  const activeTid = tenantId || 'tenant-moustafa-tech';
  const dispatch = useDispatch();
  const { theme, updateThemeColors } = useAppTheme();
  const primaryColor = theme?.primaryColor || '#0ea5e9';
  const secondaryColor = theme?.secondaryColor || '#6366f1';

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  // Store Custom Configuration
  const [storeMeta, setStoreMeta] = useState<any>({
    name: 'Moustafa Tech',
    heroTitle: 'أفضل الأجهزة والإلكترونيات الذكية بأسعار لا تُنافس',
    heroSubtitle: 'تسوق الآن مع ضمان حقيقي، تقسيط وبطاقات بنكية Paymob، تحويل InstaPay فوري، وخيارات الدفع عند الاستلام.',
    announcementText: '🚚 شحن سريع لكافة محافظات مصر عبر بوسطة — شحن مجاني للطلبات فوق 1000 ج.م',
    carrierRate: 45,
    freeShippingThreshold: 1000,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Toast States
  const [addedPopup, setAddedPopup] = useState<string | null>(null);
  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const catalogTopRef = useRef<HTMLDivElement>(null);

  // 1. Fetch live theme & store settings from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/stores/me?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.theme?.primaryColor) {
          updateThemeColors({
            primaryColor: data.theme.primaryColor,
            secondaryColor: data.theme.secondaryColor || '#6366f1',
            accentColor: data.theme.accentColor || '#10b981',
            logoUrl: data.theme.logoUrl,
          });
        }
        setStoreMeta({
          name: data.tenant?.name || 'Moustafa Tech',
          heroTitle: data.settings?.displayName
            ? `أهلاً بكم في ${data.settings.displayName} — الإلكترونيات الأصلية`
            : 'أفضل الأجهزة والإلكترونيات الذكية بأسعار لا تُنافس',
          heroSubtitle: 'تسوق الآن مع ضمان محلي معتمد، تقسيط مرن عبر ValU وبطاقات Paymob، وتحويل InstaPay فوري عند الشراء.',
          announcementText: '🚚 شحن سريع لكافة محافظات مصر عبر بوسطة — شحن مجاني للطلبات فوق 1,000 ج.م',
          carrierRate: data.settings?.shippingZones?.default_rate || 45,
          freeShippingThreshold: data.settings?.shippingZones?.free_shipping_threshold || 1000,
        });
      })
      .catch(() => {});

    // 2. Fetch live products from backend
    fetch(`${API_BASE_URL}/products?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else setProducts([]);
      })
      .catch(() => { setProducts([]); });

    // 3. Fetch live categories
    fetch(`${API_BASE_URL}/categories?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
        else setCategories([]);
      })
      .catch(() => { setCategories([]); });
  }, [activeTid]);

  // Reset pagination when category, search, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy, onlyInStock]);

  // Calculate filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const pCat = p.categoryId || p.category_id;
      const matchesCat = selectedCategory === 'all' || pCat === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
        (p.name_en && p.name_en.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));
      const matchesStock = !onlyInStock || (p.stock_qty || p.stock || 0) > 0;
      return matchesCat && matchesSearch && matchesStock;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
      // popular (default)
      return priceB - priceA;
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy, onlyInStock]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      catalogTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCart = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    const pName = p.name || p.name_ar || p.name_en || 'منتج';
    dispatch(
      addToCart({
        id: p.id,
        name: pName,
        price: Number(p.price) || 0,
        quantity: 1,
        image: p.images?.[0],
        sku: p.sku,
      })
    );
    setAddedPopup(pName);
    setTimeout(() => setAddedPopup(null), 2500);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast popup */}
      {addedPopup && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4" />
          <span>تمت إضافة "{addedPopup}" إلى سلة مشترياتك بنجاح!</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      <div
        className="py-2 px-4 text-center text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
        style={{ backgroundColor: primaryColor }}
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>{storeMeta.announcementText}</span>
      </div>

      {/* Modern E-Commerce Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-l from-slate-900 via-slate-900 to-slate-950 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 75% 25%, ${primaryColor} 0%, transparent 55%), radial-gradient(circle at 25% 75%, ${secondaryColor} 0%, transparent 60%)`,
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>متاح التوصيل الفوري والدفع عند الاستلام بجميع المحافظات</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {storeMeta.heroTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {storeMeta.heroSubtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  catalogTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ backgroundColor: primaryColor }}
                className="px-6 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm transition-transform hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <span>تسوق الكتالوج الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSortBy('popular');
                  catalogTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/15 transition-colors"
              >
                🔥 المنتجات الأكثر مبيعاً
              </button>
            </div>
          </div>

          {/* Quick Category Showcase Cards */}
          <div className="w-full lg:w-auto grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-right space-y-1">
              <span className="text-[10px] text-sky-400 font-bold block">كتالوج متكامل</span>
              <span className="text-lg font-black text-white">{products.length || 445}+</span>
              <span className="text-[11px] text-slate-400 block">منتج إلكتروني أصلي</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-right space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">شحن معتمد</span>
              <span className="text-lg font-black text-white">24 - 48 س</span>
              <span className="text-[11px] text-slate-400 block">بوسطة لكافة مصر</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-right space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold block">تقسيط ودفع</span>
              <span className="text-lg font-black text-white">Paymob</span>
              <span className="text-[11px] text-slate-400 block">فيزا و InstaPay و ValU</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-right space-y-1">
              <span className="text-[10px] text-amber-400 font-bold block">أمان العملاء</span>
              <span className="text-lg font-black text-white">14 يوم</span>
              <span className="text-[11px] text-slate-400 block">ضمان استرجاع قانوني</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Professional Value Proposition Bar */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">شحن سريع عبر بوسطة</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">توصيل لكافة محافظات مصر</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">دفع إلكتروني آمن</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Paymob، InstaPay، وتقسيط</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">ضمان استرجاع 14 يوم</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">طبقاً لقانون حماية المستهلك</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">منتجات أصلية 100%</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">ضمان معتمد من الوكيل المحلي</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <div ref={catalogTopRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Pills Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>أقسام وتصنيفات المتجر</span>
            </h2>
            <span className="text-xs text-slate-400">
              إجمالي {products.length} منتجاً نشطاً
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={selectedCategory === 'all' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              جميع المنتجات ({products.length})
            </button>

            {categories.map((c) => {
              const catCount = products.filter((p) => (p.categoryId || p.category_id) === c.id).length;
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  style={isSelected ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span>{c.name || c.name_ar}</span>
                  {catCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {catCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters & Sorting Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الماركة، أو رمز SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-3 left-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Stock Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end text-xs">
            {/* In-Stock Filter */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
              />
              <span>المتوفر بالمخزن فقط</span>
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="popular">الأكثر طلباً ومبيعاً</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="newest">الأحدث وصولاً</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            عرض{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            </strong>{' '}
            إلى{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
            </strong>{' '}
            من أصل <strong className="text-slate-900 dark:text-slate-100">{filteredProducts.length}</strong> منتجاً
          </span>

          {filteredProducts.length > ITEMS_PER_PAGE && (
            <span>صفحة {currentPage} من {totalPages}</span>
          )}
        </div>

        {/* Modern Paginated Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">لا توجد منتجات مطابقة لخيارات البحث</h4>
            <p className="text-xs text-slate-400">جرب تعديل الكلمات المفتاحية أو اختيار تصنيف آخر.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyInStock(false);
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paginatedProducts.map((p) => {
              const isWish = wishlistItems.some((w) => w.id === p.id);
              const pName = p.name || p.name_ar || p.name_en || 'منتج';
              const pPrice = Number(p.price) || 0;
              const pCompPrice = p.compare_price || p.comparePrice ? Number(p.compare_price || p.comparePrice) : null;
              const pStock = Number(p.stock_qty ?? p.stock ?? 20);
              const hasDiscount = pCompPrice && pCompPrice > pPrice;
              const discountPct = hasDiscount ? Math.round(((pCompPrice - pPrice) / pCompPrice) * 100) : 0;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProductModal(p);
                    setModalQuantity(1);
                    if (onSelectProduct) onSelectProduct(p);
                  }}
                  className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
                >
                  {/* Image Container with Badges */}
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400'}
                      alt={pName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-extrabold text-[10px] shadow-sm select-none">
                        خصم {discountPct}%
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(
                          toggleWishlist({
                            id: p.id,
                            name: pName,
                            price: pPrice,
                            image: p.images?.[0],
                          })
                        );
                      }}
                      className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center shadow-xs transition-colors"
                      title="إضافة للمفضلة"
                    >
                      <Heart className={`w-4 h-4 ${isWish ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    {/* Stock Status Tag */}
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      {pStock <= 5 && pStock > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-white font-bold text-[9px] backdrop-blur-xs">
                          باقي {pStock} فقط
                        </span>
                      ) : pStock === 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-white font-bold text-[9px]">
                          نفد المخزون
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>4.8</span>
                        <span className="text-slate-400 font-normal mr-1">(42 تقييم)</span>
                      </div>

                      <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
                        {pName}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-baseline gap-2">
                        <span
                          style={{ color: primaryColor }}
                          className="font-mono font-extrabold text-sm sm:text-base"
                        >
                          {pPrice.toLocaleString()} ج.م
                        </span>
                        {hasDiscount && (
                          <span className="font-mono text-[11px] text-slate-400 line-through">
                            {pCompPrice?.toLocaleString()} ج.م
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, p)}
                        disabled={pStock === 0}
                        style={{
                          backgroundColor: primaryColor,
                        }}
                        className="w-full py-2.5 px-3 rounded-xl text-white font-bold text-xs transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{pStock === 0 ? 'غير متوفر' : 'أضف للسلة'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modern Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 pb-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((page, idx, arr) => {
                  const isCurrent = page === currentPage;
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        style={isCurrent ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'shadow-sm'
                            : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Customer Product Details Modal */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs font-sans animate-fade-in">
          <div
            dir="rtl"
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-slate-100"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">تفاصيل المنتج</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] font-mono text-slate-400">{selectedProductModal.sku}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <img
                    src={selectedProductModal.images?.[0] || 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600'}
                    alt={selectedProductModal.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedProductModal.comparePrice && selectedProductModal.comparePrice > selectedProductModal.price && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-xs shadow-md">
                      خصم {Math.round(((selectedProductModal.comparePrice - selectedProductModal.price) / selectedProductModal.comparePrice) * 100)}%
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>4.8</span>
                      <span className="text-slate-400 font-normal">(42 تقييم عملاء موثق)</span>
                    </div>

                    <h2 className="text-lg font-black leading-snug">
                      {selectedProductModal.name || selectedProductModal.name_ar}
                    </h2>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span style={{ color: primaryColor }} className="text-2xl font-black font-mono">
                      {Number(selectedProductModal.price || 0).toLocaleString()} ج.م
                    </span>
                    {selectedProductModal.comparePrice && selectedProductModal.comparePrice > selectedProductModal.price && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        {Number(selectedProductModal.comparePrice).toLocaleString()} ج.م
                      </span>
                    )}
                  </div>

                  {/* Stock Availability Badge */}
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 shrink-0" />
                    <span>متوفر في المخزن ({selectedProductModal.stock_qty || 20} قطعة) — شحن فوري بوسطة</span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">الكمية:</span>
                    <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-4 py-1 font-mono font-bold text-xs">
                        {modalQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalQuantity((q) => q + 1)}
                        className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pName = selectedProductModal.name || selectedProductModal.name_ar || 'منتج';
                        dispatch(
                          addToCart({
                            id: selectedProductModal.id,
                            name: pName,
                            price: Number(selectedProductModal.price) || 0,
                            quantity: modalQuantity,
                            image: selectedProductModal.images?.[0],
                            sku: selectedProductModal.sku,
                          })
                        );
                        setAddedPopup(pName);
                        setTimeout(() => setAddedPopup(null), 2500);
                        setSelectedProductModal(null);
                      }}
                      style={{ backgroundColor: primaryColor }}
                      className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>إضافة إلى سلة التسوق ({modalQuantity})</span>
                    </button>

                    {onOpenCheckout && (
                      <button
                        type="button"
                        onClick={() => {
                          const pName = selectedProductModal.name || selectedProductModal.name_ar || 'منتج';
                          dispatch(
                            addToCart({
                              id: selectedProductModal.id,
                              name: pName,
                              price: Number(selectedProductModal.price) || 0,
                              quantity: modalQuantity,
                              image: selectedProductModal.images?.[0],
                              sku: selectedProductModal.sku,
                            })
                          );
                          setSelectedProductModal(null);
                          onOpenCheckout();
                        }}
                        className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>شراء الآن فورياً والمتابعة للدفع</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="font-bold block">شحن بوسطة</span>
                    <span className="text-[10px] text-slate-400">توصيل 24-48 ساعة</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold block">ضمان 14 يوم</span>
                    <span className="text-[10px] text-slate-400">استبدال واسترجاع مجاني</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-bold block">دفع Paymob آمن</span>
                    <span className="text-[10px] text-slate-400">InstaPay ودفع عند الاستلام</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
