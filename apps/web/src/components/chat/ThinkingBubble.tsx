// apps/web/src/components/chat/ThinkingBubble.tsx
import React from 'react';
import {
  Bot,
  BarChart3,
  Package,
  ClipboardList,
  Tag,
  Zap,
  ShoppingCart,
  AlertTriangle,
  Ticket,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react';

interface ThinkingBubbleProps {
  statusText?: string | null;
  toolName?: string | null;
}

const TOOL_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  get_analytics_dashboard: { label: 'جاري تحميل لوحة تحليلات المتجر...', icon: BarChart3 },
  add_product: { label: 'جاري إضافة المنتج للكتالوج وتحديث المخزن...', icon: Package },
  list_products: { label: 'جاري استخراج قائمة منتجات المتجر...', icon: ClipboardList },
  update_product_price: { label: 'جاري تحديث أسعار المنتجات...', icon: Tag },
  bulk_update_prices: { label: 'جاري تطبيق التخفيض المجمع على الأسعار...', icon: Zap },
  list_orders: { label: 'جاري مراجعة الطلبات الحديثة...', icon: ShoppingCart },
  get_inventory_alerts: { label: 'جاري فحص نواقص المخزون ونقاط إعادة الطلب...', icon: AlertTriangle },
  create_coupon: { label: 'جاري تفعيل الكوبون الترويجي...', icon: Ticket },
  sales_forecast: { label: 'جاري تشغيل نموذج التنبؤ الذكي بالمبيعات...', icon: TrendingUp },
  customer_segments: { label: 'جاري تصنيف العملاء وفق نموذج RFM...', icon: Users },
  pdf_report: { label: 'جاري إعداد التقرير وتجهيزه للتحميل...', icon: FileText },
};

export const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ statusText, toolName }) => {
  const currentConfig = toolName ? TOOL_CONFIG[toolName] : null;
  const ToolIcon = currentConfig?.icon;
  const displayLabel =
    currentConfig?.label ||
    statusText ||
    'وكيل تيك زون يحلل طلبك وينفذ في قاعدة البيانات...';

  return (
    <div className="flex flex-col items-start space-y-1.5 animate-fadeIn" dir="rtl">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
        <Bot className="w-3 h-3 text-sky-500 animate-spin" />
        <span className="font-medium text-sky-600 dark:text-sky-400">تفكير ذكي وتفاعل حي</span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-950/80 rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs flex items-center gap-3 max-w-[85%]">
        <div className="relative flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping absolute"></span>
          <span className="w-2 h-2 rounded-full bg-sky-600 relative"></span>
        </div>

        {ToolIcon && <ToolIcon className="w-4 h-4 text-sky-500 shrink-0" />}

        <div className="flex-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
          {displayLabel}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"></span>
          <span
            className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
            style={{ animationDelay: '150ms' }}
          ></span>
          <span
            className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
            style={{ animationDelay: '300ms' }}
          ></span>
        </div>
      </div>
    </div>
  );
};
