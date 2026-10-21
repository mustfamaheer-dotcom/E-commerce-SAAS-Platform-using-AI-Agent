// apps/web/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  'en-US': {
    translation: {
      onboarding: {
        title: 'Storefront Setup & Live Preview',
        subtitle: 'Watch your storefront adapt in real-time as you chat with the Agent',
        launchStore: 'Launch Store Now',
        cancel: 'Cancel',
        storeName: 'Store Name',
        currency: 'Billing Currency',
        themeMode: 'Theme Mode',
        paymentMethods: 'Payment Gateways',
        shippingPolicy: 'Shipping Policy',
        readyStatus: 'Ready for Instant Deployment',
      },
      storefront: {
        cart: 'Shopping Cart',
        checkout: 'Checkout',
        addToCart: 'Add to Cart',
        emptyCatalog: 'No products published yet.',
      },
      catalog: {
        title: 'Catalog & Inventory Management',
        bulkPreviewTitle: 'Bulk Price Discount Preview (HITL)',
        approveAndExecute: 'Approve & Execute Changes',
        cancelModify: 'Cancel / Modify',
        marginWarningTitle: 'Profit Margin Floor Warning',
        affectedSkus: 'Affected SKUs',
        avgMarginBefore: 'Avg Margin Before',
        avgMarginAfter: 'Avg Margin After',
        negativeMarginCount: 'Negative Margin SKUs',
        inventoryAlertsTitle: 'Inventory Stockout Risk Alerts',
        dailyProfitAtRisk: 'Daily Profit at Risk',
        daysUntilStockout: 'Days Until Stockout',
        recommendedOrderQty: 'Recommended Reorder',
        inStock: 'In Stock',
        lowStock: 'Low Stock',
        criticalRisk: 'Critical Stockout Risk',
      },
      forecast: {
        title: 'Sales Demand Forecast',
        horizon: 'Horizon',
        expectedDemand: 'Expected demand',
        currentStock: 'Current stock',
        restockTitle: 'Restock recommendation',
        orderNow: 'Order {{qty}} units this week',
        sufficient: 'Stock covers this horizon',
        stockoutEta: 'Projected stockout: {{date}}',
        historySeries: 'Actual sales',
        forecastSeries: 'Forecast',
        confidence: '95% confidence',
        driversTitle: 'What drives this forecast (SHAP)',
        model: 'Model',
        requestPurchase: 'Draft purchase order',
        features: {
          sales_lag_7: 'Weekly Momentum',
          sales_lag_14: 'Biweekly Momentum',
          sales_lag_28: 'Monthly Momentum',
          sales_rolling_mean_7: 'Weekly Average',
          sales_rolling_mean_28: 'Monthly Average',
          sales_rolling_std_28: 'Demand Volatility',
          discount_pct: 'Active Discounts',
          price_change_pct: 'Price Changes',
          day_of_week: 'Weekend Effect',
          month: 'Seasonality',
          is_holiday: 'Holiday Season',
          holiday_weight: 'Holiday Strength',
          stock_level: 'Stock Availability',
        },
      },
    },
  },
  'ar-EG': {
    translation: {
      onboarding: {
        title: 'إعداد المتجر والمعاينة الحية',
        subtitle: 'شاهد متجرك يتشكل ويتحدث تلقائياً لحظة بلحظة أثناء محادثة المساعد الذكي',
        launchStore: 'إطلاق المتجر الآن',
        cancel: 'إلغاء',
        storeName: 'اسم المتجر',
        currency: 'عملة البيع',
        themeMode: 'نمط المظهر',
        paymentMethods: 'بوابات الدفع',
        shippingPolicy: 'سياسة الشحن والتوصيل',
        readyStatus: 'جاهز للنشر الفوري وعزل البيانات',
      },
      storefront: {
        cart: 'عربة التسوق',
        checkout: 'إتمام الشراء',
        addToCart: 'أضف للسلة',
        emptyCatalog: 'لم يتم إضافة منتجات للمتجر بعد.',
      },
      catalog: {
        title: 'إدارة المنتجات والمخزون',
        bulkPreviewTitle: 'معاينة تطبيق الخصم الجماعي (HITL)',
        approveAndExecute: 'اعتماد وتطبيق التغييرات',
        cancelModify: 'إلغاء / تعديل',
        marginWarningTitle: 'تحذير أمان هامش الربح',
        affectedSkus: 'المنتجات المتأثرة',
        avgMarginBefore: 'متوسط الهامش قبل',
        avgMarginAfter: 'متوسط الهامش بعد',
        negativeMarginCount: 'منتجات بهامش سالب',
        inventoryAlertsTitle: 'تنبيهات مخاطر نفاد المخزون (Dynamic ROP)',
        dailyProfitAtRisk: 'صافي ربح يومي معرض للضياع',
        daysUntilStockout: 'أيام حتى نفاد الكمية',
        recommendedOrderQty: 'الكمية الموصى بإعادة طلبها',
        inStock: 'متوفر',
        lowStock: 'مخزون منخفض',
        criticalRisk: 'خطر نفاد حرج جداً',
      },
      forecast: {
        title: 'توقّع المبيعات والطلب',
        horizon: 'الأفق',
        expectedDemand: 'الطلب المتوقع',
        currentStock: 'المخزون الحالي',
        restockTitle: 'توصية المخزون',
        orderNow: 'اطلب {{qty}} وحدة هذا الأسبوع',
        sufficient: 'المخزون يكفي للأفق الحالي',
        stockoutEta: 'تاريخ النفاد المتوقع: {{date}}',
        historySeries: 'المبيعات الفعلية',
        forecastSeries: 'التوقع',
        confidence: 'ثقة 95%',
        driversTitle: 'العوامل المؤثرة في التوقع (SHAP)',
        model: 'النموذج',
        requestPurchase: 'جهّز أمر شراء',
        features: {
          sales_lag_7: 'زخم المبيعات الأسبوعي',
          sales_lag_14: 'زخم المبيعات نصف الشهري',
          sales_lag_28: 'زخم المبيعات الشهري',
          sales_rolling_mean_7: 'متوسط المبيعات الأسبوعي',
          sales_rolling_mean_28: 'متوسط المبيعات الشهري',
          sales_rolling_std_28: 'تقلّب الطلب',
          discount_pct: 'الخصومات الفعالة',
          price_change_pct: 'تغيّر السعر',
          day_of_week: 'تأثير الويكند',
          month: 'الموسمية',
          is_holiday: 'الموسم / العيد',
          holiday_weight: 'قوة الموسم',
          stock_level: 'توفر المخزون',
        },
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar-EG',
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });

export function setAppLanguage(lang: 'ar-EG' | 'en-US') {
  i18n.changeLanguage(lang);
  document.documentElement.dir = lang.startsWith('ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

export default i18n;
