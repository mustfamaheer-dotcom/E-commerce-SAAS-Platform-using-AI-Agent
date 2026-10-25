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
import { SpatialHeroSection } from '../../components/storefront/SpatialHeroSection';
import { BentoProductCard } from '../../components/storefront/BentoProductCard';

interface StorefrontHomePageProps {
  tenantId?: string;
  onSelectProduct?: (product: any) => void;
  onOpenCart?: () => void;
  onOpenCheckout?: () => void;
  onOpenMiniCart?: () => void;
}

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'newest';

const ITEMS_PER_PAGE = 16;

export const StorefrontHomePage: React.FC<StorefrontHomePageProps> = ({
  tenantId,
  onSelectProduct,
  onOpenCart,
  onOpenCheckout,
  onOpenMiniCart,
}) => {
  const activeTid = tenantId || 'tenant-moustafa-tech';
  const dispatch = useDispatch();
  const { theme, updateThemeColors } = useAppTheme();
  const primaryColor = theme?.primaryColor || '#0ea5e9';
  const secondaryColor = theme?.secondaryColor || '#6366f1';

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  // Store Configuration
  const [storeMeta, setStoreMeta] = useState<any>({
    name: 'المتجر الإلكتروني',
    heroTitle: 'أفضل الأجهزة والإلكترونيات الذكية بأسعار لا تُنافس',
    heroSubtitle: 'تسوق أحدث الأجهزة الذكية مع ضمان محلي معتمد، شحن سريع بجميع محافظات مصر، وخيارات تقسيط ودفع إلكتروني ميسرة.',
    announcementText: '🚚 شحن سريع لكافة محافظات مصر عبر بوسطة — شحن مجاني للطلبات فوق 1,000 ج.م',
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
          name: data.tenant?.name || 'المتجر الإلكتروني',
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

  const isProductInCategory = (p: any, category: any) => {
    if (!p || !category) return false;
    const pCat = String(p.categoryId || p.category_id || '').trim();
    if (!pCat) return false;
    return (
      pCat === category.id ||
      pCat === category.slug ||
      pCat === category.name ||
      pCat === category.name_ar ||
      pCat === category.nameEn ||
      (category.slug && pCat.toLowerCase() === category.slug.toLowerCase())
    );
  };

  useEffect(() => {
    const handleSelectCat = (e: any) => {
      if (e?.detail?.categoryId) {
        setSelectedCategory(e.detail.categoryId);
        catalogTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('techzone:select-category', handleSelectCat);
    return () => window.removeEventListener('techzone:select-category', handleSelectCat);
  }, []);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy, onlyInStock]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      let matchesCat = selectedCategory === 'all';
      if (!matchesCat) {
        const catObj = categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory);
        if (catObj) {
          matchesCat = isProductInCategory(p, catObj);
        } else {
          const pCat = String(p.categoryId || p.category_id || '').trim();
          matchesCat = pCat === selectedCategory;
        }
      }
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

    result = [...result].sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
      return priceB - priceA;
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy, onlyInStock]);

  // Pagination
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
    // Optionally open the slide-over Mini-Cart for instant feedback
    if (onOpenMiniCart) {
      onOpenMiniCart();
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    const pName = p.name || p.name_ar || p.name_en || 'منتج';
    dispatch(
      toggleWishlist({
        id: p.id,
        name: pName,
        price: Number(p.price) || 0,
        image: p.images?.[0],
      })
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast Notification */}
      {addedPopup && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-bounce border border-slate-200 dark:border-slate-800">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>تمت إضافة "{addedPopup}" إلى سلة مشترياتك بنجاح!</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      <div
        className="py-2 px-4 text-center text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs select-none"
        style={{ backgroundColor: primaryColor }}
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>{storeMeta.announcementText}</span>
      </div>

      {/* Spatial Hero Section (Apple & Scandinavian Style) */}
      <SpatialHeroSection
        storeName={storeMeta.name}
        heroTitle={storeMeta.heroTitle}
        heroSubtitle={storeMeta.heroSubtitle}
        productsCount={products.length}
        onShopNow={() => {
          setSelectedCategory('all');
          catalogTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        onDiscoverDeals={() => {
          setSortBy('popular');
          catalogTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Catalog & Bento Grid Showcase */}
      <div ref={catalogTopRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Pills Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>أقسام وتصنيفات المتجر</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              إجمالي {products.length} منتجاً نشطاً
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={selectedCategory === 'all' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 shadow-xs ${
                selectedCategory === 'all'
                  ? 'shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              جميع المنتجات ({products.length})
            </button>

            {categories.map((c) => {
              const catCount = products.filter((p) => isProductInCategory(p, c)).length;
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  style={isSelected ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs ${
                    isSelected
                      ? 'shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span>{c.name || c.name_ar}</span>
                  {catCount > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {catCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters & Sorting Toolbar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الموديل أو الكود..."
              className="w-full pl-9 pr-10 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters: In-Stock Toggle & Sorting */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 select-none bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-full">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-sky-600 accent-sky-600 cursor-pointer"
              />
              <span>المتوفر بالمخزن فقط</span>
            </label>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="popular">الأكثر مبيعاً</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="newest">أحدث المنتجات</option>
              </select>
            </div>
          </div>
        </div>

        {/* Counter Info */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
          <span>
            عرض{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-mono">
              {filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            </strong>{' '}
            إلى{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-mono">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
            </strong>{' '}
            من أصل{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-mono">
              {filteredProducts.length}
            </strong>{' '}
            منتجاً
          </span>

          {filteredProducts.length > ITEMS_PER_PAGE && (
            <span className="font-mono">صفحة {currentPage} من {totalPages}</span>
          )}
        </div>

        {/* Bento Grid 2.0 Products Catalog */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              لا توجد منتجات مطابقة لخيارات البحث
            </h4>
            <p className="text-xs text-slate-400">جرب تعديل الكلمات المفتاحية أو اختيار تصنيف آخر.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyInStock(false);
              }}
              className="px-5 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paginatedProducts.map((p) => {
              const isWish = wishlistItems.some((w) => w.id === p.id);
              return (
                <BentoProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={isWish}
                  onSelect={(prod) => {
                    setSelectedProductModal(prod);
                    setModalQuantity(1);
                    if (onSelectProduct) onSelectProduct(prod);
                  }}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                />
              );
            })}
          </div>
        )}

        {/* Minimalist Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 pb-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

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
                        className={`w-9 h-9 rounded-full text-xs font-bold font-mono transition-all ${
                          isCurrent
                            ? 'shadow-md shadow-sky-500/20'
                            : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
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
              className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Customer Product Details Modal (Spatial Glass Aesthetic) */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md font-sans animate-fade-in">
          <div
            dir="rtl"
            className="w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-slate-100"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  تفاصيل الجهاز
                </span>
                {selectedProductModal.sku && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedProductModal.sku}
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <img
                    src={
                      selectedProductModal.images?.[0] ||
                      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600'
                    }
                    alt={selectedProductModal.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedProductModal.comparePrice &&
                    selectedProductModal.comparePrice > selectedProductModal.price && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-500 text-white font-extrabold text-xs shadow-md">
                        خصم{' '}
                        {Math.round(
                          ((selectedProductModal.comparePrice - selectedProductModal.price) /
                            selectedProductModal.comparePrice) *
                            100
                        )}
                        %
                      </span>
                    )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-mono">4.9</span>
                      <span className="text-slate-400 font-normal">(42 تقييم عملاء معتمد)</span>
                    </div>

                    <h2 className="text-lg font-black leading-snug">
                      {selectedProductModal.name || selectedProductModal.name_ar}
                    </h2>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span
                      style={{ color: primaryColor }}
                      className="text-2xl font-black font-mono"
                    >
                      {Number(selectedProductModal.price || 0).toLocaleString()} ج.م
                    </span>
                    {selectedProductModal.comparePrice &&
                      selectedProductModal.comparePrice > selectedProductModal.price && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {Number(selectedProductModal.comparePrice).toLocaleString()} ج.م
                        </span>
                      )}
                  </div>

                  {/* Stock Availability */}
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
                    <PackageCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>
                      متوفر في المخزن ({selectedProductModal.stock_qty || 20} قطعة) • شحن بوسطة فوري
                    </span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      الكمية:
                    </span>
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-full bg-slate-50 dark:bg-slate-800 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                        className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-mono font-bold text-xs">
                        {modalQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalQuantity((q) => q + 1)}
                        className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="pt-2 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const pName =
                          selectedProductModal.name ||
                          selectedProductModal.name_ar ||
                          'منتج';
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
                        if (onOpenMiniCart) onOpenMiniCart();
                      }}
                      style={{ backgroundColor: primaryColor }}
                      className="w-full py-3 rounded-full text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:opacity-95 transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>إضافة إلى سلة التسوق ({modalQuantity})</span>
                    </button>

                    {onOpenCheckout && (
                      <button
                        type="button"
                        onClick={() => {
                          const pName =
                            selectedProductModal.name ||
                            selectedProductModal.name_ar ||
                            'منتج';
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
                        className="w-full py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-slate-50 transition-colors"
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
                <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="font-bold block text-xs">شحن بوسطة</span>
                    <span className="text-[10px] text-slate-400">توصيل 24-48 ساعة</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold block text-xs">ضمان 14 يوم</span>
                    <span className="text-[10px] text-slate-400">استبدال واسترجاع مجاني</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-bold block text-xs">دفع Paymob آمن</span>
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
