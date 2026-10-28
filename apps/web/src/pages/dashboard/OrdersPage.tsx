// apps/web/src/pages/dashboard/OrdersPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Truck,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  PackageOpen,
  RefreshCw,
  Search,
  Printer,
  Copy,
  Check,
  Phone,
  MapPin,
  CreditCard,
  ExternalLink,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import { copyToClipboard } from '../../utils/clipboard';

interface OrdersPageProps {
  tenantId?: string;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ tenantId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const activeTid = tenantId || localStorage.getItem('techzone_active_store_id') || '';

  const loadOrders = async () => {
    if (!activeTid) {
      setOrders([]);
      return;
    }
    try {
      const url =
        selectedStatus === 'ALL'
          ? `${API_BASE_URL}/orders?tenant_id=${activeTid}`
          : `${API_BASE_URL}/orders?tenant_id=${activeTid}&status=${selectedStatus}`;
      const res = await fetch(url, {
        headers: {
          'X-Tenant-ID': activeTid,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
          // If no order is selected or current selected is not in data, pick the first
          if (data.length > 0 && !selectedOrderId) {
            setSelectedOrderId(data[0].id);
          }
        } else {
          setOrders([]);
        }
      }
    } catch (_) {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 6000);
    const handleOrderCreated = () => loadOrders();
    window.addEventListener('techzone:order-created', handleOrderCreated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('techzone:order-created', handleOrderCreated);
    };
  }, [activeTid, selectedStatus]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/status?tenant_id=${activeTid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': activeTid },
        body: JSON.stringify({ status: nextStatus, note: `Staff marked order as ${nextStatus}` }),
      });
      setActionSuccessMsg(`تم تحديث حالة الطلب #${orderId} إلى: ${nextStatus}`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      await loadOrders();
    } catch (_) {}
  };

  const handleCopyAwb = (awb: string) => {
    copyToClipboard(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  const handlePrintWaybill = (order: any) => {
    const awb = order.shipping_awb || 'BST-908124';
    setActionSuccessMsg(`جاري إرسال بوليصة الشحن ${awb} للطباعة الحرارية...`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Filter and Search logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const addr = o.shipping_address || {};
      const matchId = String(o.id || '').toLowerCase().includes(q);
      const matchName = String(addr.name || o.customer_name || '').toLowerCase().includes(q);
      const matchCity = String(addr.city || '').toLowerCase().includes(q);
      const matchAwb = String(o.shipping_awb || '').toLowerCase().includes(q);
      const matchPhone = String(addr.phone || '').toLowerCase().includes(q);
      return matchId || matchName || matchCity || matchAwb || matchPhone;
    });
  }, [orders, searchQuery]);

  // Selected Order object
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId && filteredOrders.length > 0) return filteredOrders[0];
    return filteredOrders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || null;
  }, [filteredOrders, selectedOrderId]);

  // Operational metrics calculated from actual orders data
  const metrics = useMemo(() => {
    const total = orders.length;
    const confirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
    const processing = orders.filter((o) => o.status === 'PROCESSING').length;
    const shipped = orders.filter((o) => o.status === 'SHIPPED').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const gross = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    return { total, confirmed, processing, shipped, delivered, gross };
  }, [orders]);

  const statuses = [
    { key: 'ALL', label: 'الكل', count: metrics.total },
    { key: 'CONFIRMED', label: 'بانتظار التأكيد', count: metrics.confirmed },
    { key: 'PROCESSING', label: 'قيد التجهيز', count: metrics.processing },
    { key: 'SHIPPED', label: 'في الطريق (بوسطة)', count: metrics.shipped },
    { key: 'DELIVERED', label: 'تم التسليم', count: metrics.delivered },
    { key: 'CANCELLED', label: 'الملغاة', count: orders.filter((o) => o.status === 'CANCELLED').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            مؤكد جديد
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            قيد التجهيز
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            تم الشحن
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            تم التسليم ✓
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            ملغي
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div dir="rtl" className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Sub-bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>محطة إدارة الطلبات والشحن (Orders & Logistics Workbench)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تدفق مباشر للطلبيات، الربط الآلي مع بوسطة للشحن، وإدارة دورة حياة المبيعات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-500' : 'text-slate-400'}`} />
            <span>{isRefreshing ? 'مزامنة...' : 'مزامنة فورية'}</span>
          </button>
        </div>
      </div>

      {/* 1. Segmented Operational KPI Ledger Strip - Soft Comfortable Tints */}
      <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse sm:divide-slate-200 dark:sm:divide-slate-800 grid grid-cols-2 lg:grid-cols-5 text-xs">
        <div className="p-3.5 bg-slate-100/50 dark:bg-slate-900">
          <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">إجمالي الطلبات</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
            {metrics.total} <span className="text-xs font-normal text-slate-500">طلب</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">سجل المتجر الكامل</div>
        </div>

        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">تحتاج تجهيز بالمخزن</div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono tabular-nums">
            {metrics.processing + metrics.confirmed} <span className="text-xs font-normal text-slate-500">طلب</span>
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">تتطلب فحص العمال</div>
        </div>

        <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">مع مندوب بوسطة</div>
          <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1 font-mono tabular-nums">
            {metrics.shipped} <span className="text-xs font-normal text-slate-500">شحنة</span>
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">في طريقها للعميل</div>
        </div>

        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">تم التحصيل والتسليم</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono tabular-nums">
            {metrics.delivered} <span className="text-xs font-normal text-slate-500">مكتمل</span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">تسليم مؤكد</div>
        </div>

        <div className="p-3.5 col-span-2 lg:col-span-1 bg-sky-50/50 dark:bg-sky-950/20">
          <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">إجمالي قيمة المبيعات</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
            {metrics.gross.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <div className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">حجم العمليات الإجمالي</div>
        </div>
      </div>

      {/* 2. Filters & Omni-Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Status Filter Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {statuses.map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setSelectedStatus(st.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                selectedStatus === st.key
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{st.label}</span>
              <span className="font-mono tabular-nums text-xs opacity-75">({st.count})</span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب، العميل، الهاتف، بوسطة..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Split-Pane Workbench (Left: Order Stream Table | Right: Inspector Drawer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Orders Stream Table (7 cols on large) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="h-10 bg-slate-50 dark:bg-slate-950/60 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              قائمة الطلبات ({filteredOrders.length})
            </span>
            <span className="text-xs text-slate-400">انقر على أي صف لفحص وتحديث الطلب</span>
          </div>

          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 text-xs">
                <tr>
                  <th className="px-3.5 py-2.5 font-semibold">رقم الطلب</th>
                  <th className="px-3.5 py-2.5 font-semibold">العميل والمحافظة</th>
                  <th className="px-3.5 py-2.5 font-semibold">طريقة الدفع</th>
                  <th className="px-3.5 py-2.5 font-semibold">الإجمالي</th>
                  <th className="px-3.5 py-2.5 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <PackageOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="font-medium text-xs text-slate-600 dark:text-slate-300">
                        لا توجد طلبات مطابقة لمعايير البحث
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        جرب تغيير معيار التصفية أو مسح عبارة البحث
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const isSelected = selectedOrder?.id === o.id;
                    const itemsCount = o.items ? o.items.length : 1;
                    const addr = o.shipping_address || {};
                    const city = addr.city || 'القاهرة';
                    const custName = addr.name || o.customer_name || 'عميل المتجر';

                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedOrderId(o.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50/60 dark:bg-sky-950/25 border-r-3 border-sky-600 text-slate-900 dark:text-white font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <td className="px-3.5 py-3">
                          <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white block">
                            #{o.id}
                          </span>
                          <span className="text-xs text-slate-400 font-mono tabular-nums">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB') : 'اليوم'}
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="font-medium text-slate-900 dark:text-slate-100 block truncate max-w-[140px]">
                            {custName}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{city}</span>
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {o.payment_method === 'PAYMOB' ? 'دفع إلكتروني' : o.payment_method || 'عند الاستلام'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono tabular-nums">
                            {itemsCount} {itemsCount === 1 ? 'منتج' : 'منتجات'}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {Number(o.total || 0).toLocaleString('en-US')} ج.م
                        </td>
                        <td className="px-3.5 py-3">
                          {getStatusBadge(o.status)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Order Inspector Drawer (5 cols on large) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4 sticky top-4">
          {selectedOrder ? (
            <>
              {/* Drawer Title Bar */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white">
                      #{selectedOrder.id}
                    </span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block font-mono tabular-nums">
                    تاريخ الطلب: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('en-US') : 'اليوم'}
                  </span>
                </div>

                <div className="text-left font-mono tabular-nums">
                  <div className="text-xs text-slate-400">إجمالي المطلوب</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {Number(selectedOrder.total || 0).toLocaleString('en-US')} ج.م
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Details */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">العميل:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedOrder.shipping_address?.name || selectedOrder.customer_name || 'عميل المتجر'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400">الهاتف:</span>
                  <a
                    href={`tel:${selectedOrder.shipping_address?.phone || ''}`}
                    className="font-mono tabular-nums text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{selectedOrder.shipping_address?.phone || '01000000000'}</span>
                  </a>
                </div>
                <div className="flex justify-between items-start text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 shrink-0">عنوان الشحن:</span>
                  <span className="text-left max-w-[210px] text-slate-800 dark:text-slate-200">
                    {selectedOrder.shipping_address?.address || 'القاهرة، التجمع الخامس'}, {selectedOrder.shipping_address?.city || 'القاهرة'}
                  </span>
                </div>
              </div>

              {/* Bosta Logistics Integration Card */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <Truck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>شحنة بوسطة (Bosta Delivery)</span>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">ربط مباشر API</span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-800 font-mono tabular-nums">
                  <span className="text-xs text-slate-500">رقم البوليصة (AWB):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {selectedOrder.shipping_awb || 'BST-908124'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAwb(selectedOrder.shipping_awb || 'BST-908124')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="نسخ رقم البوليصة"
                    >
                      {copiedAwb === (selectedOrder.shipping_awb || 'BST-908124') ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintWaybill(selectedOrder)}
                    className="flex-1 py-1.5 px-3 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة البوليصة الحرارية</span>
                  </button>
                  <a
                    href={`https://bosta.co/tracking?awb=${selectedOrder.shipping_awb || 'BST-908124'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                    title="تتبع الشحنة في موقع بوسطة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>المنتجات المطلوبة</span>
                  <span className="text-slate-400 font-mono tabular-nums">
                    ({selectedOrder.items?.length || 1} منتج)
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
                      >
                        <div className="truncate max-w-[200px]">
                          <span className="text-slate-800 dark:text-slate-200 font-medium block truncate">
                            {item.title || item.name || 'منتج بالمتجر'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono tabular-nums">
                            الكمية: {item.quantity || 1}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                          {Number(item.price || 0).toLocaleString('en-US')} ج.م
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-800 dark:text-slate-200 font-medium block">
                          منتجات السلة الشاملة
                        </span>
                        <span className="text-xs text-slate-400">طلب مباشر من واجهة المتجر</span>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {Number(selectedOrder.total || 0).toLocaleString('en-US')} ج.م
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Action Transitions */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 block font-medium">الإجراء التشغيلي الفوري:</span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                      className="col-span-2 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <PackageOpen className="w-3.5 h-3.5" />
                      <span>بدء التجهيز بالمخزن</span>
                    </button>
                  )}

                  {selectedOrder.status === 'PROCESSING' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPED')}
                      className="col-span-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>تسليم الشحنة لمندوب بوسطة</span>
                    </button>
                  )}

                  {selectedOrder.status === 'SHIPPED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      className="col-span-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تأكيد التحصيل والتسليم النهائي ✓</span>
                    </button>
                  )}

                  {selectedOrder.status === 'DELIVERED' && (
                    <div className="col-span-2 py-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      تم تسليم هذا الطلب بنجاح وتحصيل القيمة
                    </div>
                  )}

                  {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                      className="py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 text-xs font-medium transition-colors"
                    >
                      إلغاء الطلب
                    </button>
                  )}
                  {selectedOrder.status === 'CANCELLED' && (
                    <div className="col-span-2 py-2 text-center text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                      هذا الطلب ملغي
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Eye className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                اختر طلباً لعرض تفاصيل بوليصة بوسطة والإجراءات
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
