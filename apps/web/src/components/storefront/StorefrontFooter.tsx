// apps/web/src/components/storefront/StorefrontFooter.tsx
import React from 'react';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Headphones,
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MessageCircle,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useAppTheme } from '../../contexts/ThemeContext';

export interface SocialChannelConfig {
  enabled?: boolean;
  url?: string;
}

export interface StorefrontFooterProps {
  storeName?: string;
  logoUrl?: string | null;
  socialLinks?: Record<string, SocialChannelConfig | string>;
  contactPhone?: string;
  contactEmail?: string;
  governorate?: string;
}

export const StorefrontFooter: React.FC<StorefrontFooterProps> = ({
  storeName = 'المتجر الإلكتروني',
  logoUrl,
  socialLinks = {},
  contactPhone = '01000000000',
  contactEmail = 'support@talkshow.eg',
  governorate = 'القاهرة',
}) => {
  const { theme } = useAppTheme();
  const primaryColor = theme?.primaryColor || '#0ea5e9';

  // Helper to extract clean channel config
  const getChannel = (key: string): { enabled: boolean; url: string } => {
    const raw = socialLinks[key];
    if (!raw) return { enabled: false, url: '' };
    if (typeof raw === 'string') {
      return { enabled: Boolean(raw.trim()), url: raw.trim() };
    }
    return { enabled: Boolean(raw.enabled && raw.url), url: raw.url?.trim() || '' };
  };

  const facebook = getChannel('facebook');
  const instagram = getChannel('instagram');
  const whatsapp = getChannel('whatsapp');
  const tiktok = getChannel('tiktok');
  const twitter = getChannel('twitter');
  const youtube = getChannel('youtube');

  const activeSocials = [
    { key: 'facebook', label: 'فيسبوك', icon: Facebook, color: '#1877F2', ...facebook },
    { key: 'instagram', label: 'انستغرام', icon: Instagram, color: '#E4405F', ...instagram },
    { key: 'whatsapp', label: 'واتساب', icon: MessageCircle, color: '#25D366', ...whatsapp },
    { key: 'tiktok', label: 'تيك توك', icon: Share2, color: '#000000', ...tiktok },
    { key: 'twitter', label: 'إكس (تويتر)', icon: Twitter, color: '#1DA1F2', ...twitter },
    { key: 'youtube', label: 'يوتيوب', icon: Youtube, color: '#FF0000', ...youtube },
  ].filter((s) => s.enabled && s.url);

  // Fallback defaults if merchant hasn't enabled any yet
  const defaultSocials = [
    {
      key: 'facebook',
      label: 'فيسبوك',
      icon: Facebook,
      color: '#1877F2',
      url: 'https://facebook.com',
    },
    {
      key: 'instagram',
      label: 'انستغرام',
      icon: Instagram,
      color: '#E4405F',
      url: 'https://instagram.com',
    },
    {
      key: 'whatsapp',
      label: 'واتساب',
      icon: MessageCircle,
      color: '#25D366',
      url: `https://wa.me/${contactPhone.replace(/[^0-9]/g, '') || '201000000000'}`,
    },
  ];

  const displayedSocials = activeSocials.length > 0 ? activeSocials : defaultSocials;

  return (
    <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-700 dark:text-slate-300 transition-colors">
      {/* Upper Footer: 4 Grid Columns */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 text-right">
          {/* Column 1: Store Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl || theme?.logoUrl ? (
                <img
                  src={logoUrl || theme.logoUrl!}
                  alt={storeName}
                  className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <img
                  src="/TransparentLogo.png"
                  alt={storeName}
                  className="w-10 h-10 object-contain drop-shadow-sm"
                />
              )}
              <div>
                <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 block leading-tight">
                  {storeName}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>متجر إلكتروني رسمي معتمد</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              وجهتك الأولى لأحدث الأجهزة والإلكترونيات الأصلية بضمان محلي معتمد، شحن بوسطة لكافة محافظات مصر، وخيارات دفع إلكتروني وتقسيط ميسرة.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>المقر الرئيسي: جمهورية مصر العربية — {governorate}</span>
            </div>
          </div>

          {/* Column 2: Social Media (Admin Controlled) */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-sky-500" />
              <span>تابعنا على السوشيال ميديا</span>
            </h4>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              تابع أحدث العروض والخصومات الحصرية والإطلاقات الجديدة عبر منصاتنا الرسمية:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {displayedSocials.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.key}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-sky-400 dark:hover:border-sky-500 shadow-xs hover:shadow-sm hover:scale-[1.03] transition-all text-xs font-semibold"
                    title={`زيارة صفحتنا على ${social.label}`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" style={{ color: social.color }} />
                    <span>{social.label}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 3: Customer Care & Contact */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5 text-emerald-500" />
              <span>خدمة العملاء والدعم</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">الاتصال المباشر والواتساب:</span>
                  <a href={`tel:${contactPhone}`} className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-sky-600 transition-colors">
                    {contactPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">البريد الإلكتروني الرسمي:</span>
                  <a href={`mailto:${contactEmail}`} className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-sky-600 transition-colors">
                    {contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">مواعيد العمل الرسمية:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    يومياً من 10:00 صباحاً حتى 10:00 مساءً
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Assurances & Payment Guarantees */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>ضمانات ومزايا التسوق</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                <div>
                  <span className="font-bold block text-slate-900 dark:text-slate-100 text-xs">شحن سريع عبر بوسطة</span>
                  <span className="text-[10px] text-slate-400">توصيل لكافة المحافظات خلال 24-48 ساعة</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-bold block text-slate-900 dark:text-slate-100 text-xs">دفع إلكتروني آمن 100%</span>
                  <span className="text-[10px] text-slate-400">Paymob فيزا، ميزة، تحويل InstaPay فوري</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5">
                <Banknote className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold block text-slate-900 dark:text-slate-100 text-xs">دفع عند الاستلام متاح</span>
                  <span className="text-[10px] text-slate-400">عاين وتأكد من شحنتك قبل السداد</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Accreditation */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 py-5 bg-slate-50/60 dark:bg-slate-950/60 text-xs">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 dark:text-slate-400">
          <p className="text-center sm:text-right font-medium">
            حقوق النشر والتوزيع محفوظة 2026 {storeName} • تجربة تسوق إسكندنافية معتمدة.
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>معاملات مشفرة وآمنة</span>
            </span>
            <span>•</span>
            <span>مدفوعات Paymob معتمدة</span>
            <span>•</span>
            <span>شحن بوسطة إكسبريس</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
