// apps/web/src/components/chat/ThinkingBubble.tsx
import React from 'react';
import { Bot, Sparkles, Cpu } from 'lucide-react';

interface ThinkingBubbleProps {
  statusText?: string | null;
  toolName?: string | null;
}

const TOOL_FRIENDLY_NAMES: Record<string, string> = {
  get_analytics_dashboard: '📊 جاري تحميل لوحة تحليلات المتجر...',
  add_product: '📦 جاري إضافة المنتج للكتالوج وتحديث المخزن...',
  list_products: '📋 جاري استخراج قائمة منتجات المتجر...',
  update_product_price: '🏷️ جاري تحديث أسعار المنتجات...',
  bulk_update_prices: '⚡ جاري تطبيق التخفيض المجمع على الأسعار...',
  list_orders: '🛒 جاري مراجعة الطلبات الحديثة...',
  get_inventory_alerts: '⚠️ جاري فحص نواقص المخزون ونقاط إعادة الطلب...',
  create_coupon: '🎟️ جاري تفعيل الكوبون الترويجي...',
  sales_forecast: '📈 جاري تشغيل نموذج التنبؤ الذكي بالمبيعات...',
  customer_segments: '👥 جاري تصنيف العملاء وفق نموذج RFM...',
  pdf_report: '📄 جاري إعداد التقرير وتجهيزه للتحميل...',
};

export const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ statusText, toolName }) => {
  const displayLabel =
    (toolName && TOOL_FRIENDLY_NAMES[toolName]) ||
    statusText ||
    'وكيل تيك زون يحلل طلبك وينفذ في قاعدة البيانات...';

  return (
    <div className="flex flex-col items-start space-y-1.5 animate-fadeIn" dir="rtl">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
        <Bot className="w-3 h-3 text-sky-500 animate-spin" />
        <span className="font-medium text-sky-600 dark:text-sky-400">تفكير ذكي وتفاعل حي</span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-950/80 rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs flex items-center gap-3 max-w-[85%]">
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping absolute"></span>
          <span className="w-2 h-2 rounded-full bg-sky-600 relative"></span>
        </div>

        <div className="flex-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
          {displayLabel}
        </div>

        <div className="flex items-center gap-1">
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
