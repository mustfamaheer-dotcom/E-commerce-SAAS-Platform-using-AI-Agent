// apps/web/src/pages/storefront/StorefrontHomePage.tsx
import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addToCart } from '../../store/cartSlice';
import { toggleWishlist } from '../../store/wishlistSlice';
import { useAppTheme } from '../../contexts/ThemeContext';

interface StorefrontHomePageProps {
  tenantId?: string;
  onSelectProduct?: (product: any) => void;
  onOpenCart?: () => void;
  onOpenCheckout?: () => void;
}

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

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedPopup, setAddedPopup] = useState<string | null>(null);
  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    // Fetch live theme from backend
    fetch(`http://127.0.0.1:8001/api/v1/stores/me?tenant_id=${activeTid}`)
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
      })
      .catch(() => {});

    // Fetch live products from backend
    fetch(`http://127.0.0.1:8001/api/v1/products?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else setProducts([]);
      })
      .catch(() => { setProducts([]); });

    // Fetch live categories
    fetch(`http://127.0.0.1:8001/api/v1/categories?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
        else setCategories([]);
      })
      .catch(() => { setCategories([]); });
  }, [tenantId]);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddToCart = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    dispatch(
      addToCart({
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: 1,
        image: p.images?.[0],
        sku: p.sku,
      })
    );
    setAddedPopup(p.name);
    setTimeout(() => setAddedPopup(null), 2500);
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast popup */}
      {addedPopup && (
        <div className="fixed bottom-5 left-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in-up">
          <Check className="w-4 h-4" />
          <span>تمت إضافة "{addedPopup}" إلى سلة التسوق!</span>
        </div>
      )}

      {/* Storefront Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-l from-slate-900 via-sky-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>أحدث العروض الحصرية مع شحن بوسطة لجميع المحافظات 🇪🇬</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              أفضل الأجهزة والإلكترونيات الذكية بأسعار لا تُنافس
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تسوق الآن مع ضمان حقيقي، تقسيط وبطاقات بنكية Paymob، تحويل InstaPay فوري، وخيارات الدفع عند الاستلام.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                style={{ backgroundColor: primaryColor }}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-opacity hover:opacity-90 flex items-center gap-2 shadow-sm"
              >
                <span>تصفح الكتالوج بالكامل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">شحن سريع عبر بوسطة (Bosta)</span>
                <span className="text-[10px] text-slate-400">توصيل خلال 24 ساعة داخل القاهرة والجيزة</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">دفع إلكتروني آمن مع Paymob</span>
                <span className="text-[10px] text-slate-400">فيزا، ميزة، وماستركارد وتحويل InstaPay اللحظي</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">ضمان استرجاع 14 يوم</span>
                <span className="text-[10px] text-slate-400">وفق قانون حماية المستهلك المصري 181/2018</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Categories Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Categories Pill Nav */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              style={selectedCategory === 'all' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedCategory === 'all'
                  ? 'shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              جميع المنتجات
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={selectedCategory === c.id ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute top-2.5 right-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن منتج، ماركة، أو SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">لا توجد منتجات معروضة حالياً</h4>
              <p className="text-xs text-slate-400">سيبدأ هذا المتجر بعرض المنتجات فور إضافتها من لوحة التحكم.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
            const isWish = wishlistItems.some((w) => w.id === p.id);
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProductModal(p);
                  setModalQuantity(1);
                  if (onSelectProduct) onSelectProduct(p);
                }}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Discount Badge with clean margin */}
                  {p.comparePrice && p.comparePrice > p.price && (
                    <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] shadow-sm select-none">
                      خصم {Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}%
                    </span>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(
                        toggleWishlist({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          image: p.images?.[0],
                        })
                      );
                    }}
                    className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center shadow-xs transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${isWish ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold mb-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>4.8</span>
                      <span className="text-slate-400 font-normal mr-1">(42 تقييم)</span>
                    </div>

                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
                      {p.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span
                        style={{ color: primaryColor }}
                        className="font-mono font-extrabold text-sm"
                      >
                        {p.price?.toLocaleString()} ج.م
                      </span>
                      {p.comparePrice && p.comparePrice > p.price && (
                        <span className="font-mono text-[11px] text-slate-400 line-through">
                          {p.comparePrice?.toLocaleString()} ج.م
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => handleAddToCart(e, p)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.color = '';
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>إضافة للسلة</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Customer E-Commerce Product Details Modal */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans animate-fade-in">
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                      {selectedProductModal.name}
                    </h2>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span style={{ color: primaryColor }} className="text-2xl font-black font-mono">
                      {selectedProductModal.price?.toLocaleString()} ج.م
                    </span>
                    {selectedProductModal.comparePrice && selectedProductModal.comparePrice > selectedProductModal.price && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        {selectedProductModal.comparePrice?.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>

                  {/* Stock Availability Badge */}
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 shrink-0" />
                    <span>متوفر في المخزن ({selectedProductModal.stock_qty || 20} قطعة) — شحن فوري بوسطة</span>
                  </div>

                  {/* Quantity selector */}
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
                        dispatch(
                          addToCart({
                            id: selectedProductModal.id,
                            name: selectedProductModal.name,
                            price: selectedProductModal.price,
                            quantity: modalQuantity,
                            image: selectedProductModal.images?.[0],
                            sku: selectedProductModal.sku,
                          })
                        );
                        setAddedPopup(selectedProductModal.name);
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
                          dispatch(
                            addToCart({
                              id: selectedProductModal.id,
                              name: selectedProductModal.name,
                              price: selectedProductModal.price,
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
                        <span>شراء الآن فورياً والدفع والشحن</span>
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
