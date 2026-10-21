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
