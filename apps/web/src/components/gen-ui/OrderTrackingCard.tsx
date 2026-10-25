// apps/web/src/components/gen-ui/OrderTrackingCard.tsx
import React from 'react';
import { Package, Truck, CheckCircle2, Clock, MapPin, CreditCard, ExternalLink, ShieldCheck, Check } from 'lucide-react';

export interface OrderTrackingPayload {
  order_id: string;
  status: string;
  total: number;
  currency?: string;
  items_count?: number;
  payment_method?: string;
  payment_status?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  shipping_address?: {
    city?: string;
    address?: string;
    phone?: string;
  };
  created_at?: string;
}

const STEPS = [
  { key: 'CONFIRMED', label_ar: 'تم تأكيد الطلب', icon: CheckCircle2 },
  { key: 'PROCESSING', label_ar: 'تجهيز الشحنة', icon: Clock },
  { key: 'SHIPPED', label_ar: 'تم الشحن (بوسطة)', icon: Truck },
  { key: 'DELIVERED', label_ar: 'تم التوصيل بنجاح', icon: ShieldCheck },
];

export const OrderTrackingCard: React.FC<{ data: OrderTrackingPayload }> = ({ data }) => {
  const normStatus = (data.status || 'PROCESSING').toUpperCase();

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PROCESSING':
        return 1;
      case 'SHIPPED':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'CANCELLED':
      case 'REFUNDED':
        return -1;
      default:
        return 1;
    }
  };

  const activeStep = getStepIndex(normStatus);
  const isCancelled = normStatus === 'CANCELLED' || normStatus === 'REFUNDED';

  return (
    <div dir="rtl" className="my-2 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">رقم الطلب</div>
            <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">{data.order_id}</div>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            normStatus === 'DELIVERED'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : normStatus === 'SHIPPED'
              ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
              : isCancelled
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
          }`}
        >
          {isCancelled ? (
            'ملغي / مسترجع'
          ) : normStatus === 'DELIVERED' ? (
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><span>تم التسليم</span></span>
          ) : normStatus === 'SHIPPED' ? (
            <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-sky-500" /><span>جاري التوصيل</span></span>
          ) : (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /><span>قيد التجهيز</span></span>
          )}
        </span>
      </div>

      {/* Progress Timeline Stepper */}
      {!isCancelled && (
        <div className="py-2">
          <div className="relative flex items-center justify-between">
            {/* Background Track Line */}
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 right-4 h-1 bg-sky-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, (activeStep / (STEPS.length - 1)) * 100))}%`,
              }}
            />

            {STEPS.map((step, idx) => {
              const isPastOrCurrent = idx <= activeStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs ${
                      isPastOrCurrent
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[9px] mt-1.5 font-bold whitespace-nowrap ${
                      isPastOrCurrent
                        ? 'text-slate-900 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.label_ar}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Carrier Tracking Pill */}
      {data.tracking_number && (
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-500" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">شحن بوسطة Express</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{data.tracking_number}</span>
            </div>
          </div>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
            <span>تحديث حي</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">إجمالي الطلب</span>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            {data.total.toLocaleString()} {data.currency || 'ج.م'}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">طريقة الدفع</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {data.payment_method === 'CARD'
              ? 'بطاقة بنكية (Paymob)'
              : data.payment_method === 'INSTAPAY'
              ? 'إنستاباي (InstaPay)'
              : 'الدفع عند الاستلام (COD)'}
          </span>
        </div>
      </div>

      {data.shipping_address?.address && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">عنوان الشحن: {data.shipping_address.address}</span>
        </div>
      )}
    </div>
  );
};
