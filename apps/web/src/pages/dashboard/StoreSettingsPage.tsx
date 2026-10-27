// apps/web/src/pages/dashboard/StoreSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Share2,
  Facebook,
  Instagram,
  MessageCircle,
  Twitter,
  Youtube,
  Globe,
} from 'lucide-react';
import { LogoUploader } from '../../components/LogoUploader';
import { API_BASE_URL } from '../../services/api';

const EGYPTIAN_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'البحر الأحمر',
  'البحيرة',
  'الفيوم',
  'الغربية',
  'الإسماعيلية',
  'المنوفية',
  'المنيا',
  'القليوبية',
  'الوادي الجديد',
  'السويس',
  'أسوان',
  'أسيوط',
  'بني سويف',
  'بورسعيد',
  'دمياط',
  'الشرقية',
  'جنوب سيناء',
  'كفر الشيخ',
  'مطروح',
  'الأقصر',
  'قنا',
  'شمال سيناء',
  'سوهاج',
];

interface StoreSettingsPageProps {
  tenantId?: string;
}

export interface SocialMediaChannelsState {
  facebook: { enabled: boolean; url: string };
  instagram: { enabled: boolean; url: string };
  whatsapp: { enabled: boolean; url: string };
  tiktok: { enabled: boolean; url: string };
  twitter: { enabled: boolean; url: string };
  youtube: { enabled: boolean; url: string };
}

const DEFAULT_SOCIALS: SocialMediaChannelsState = {
  facebook: { enabled: true, url: 'https://facebook.com' },
  instagram: { enabled: true, url: 'https://instagram.com' },
  whatsapp: { enabled: true, url: '+201000000000' },
  tiktok: { enabled: false, url: '' },
  twitter: { enabled: false, url: '' },
  youtube: { enabled: false, url: '' },
};

export const StoreSettingsPage: React.FC<StoreSettingsPageProps> = ({ tenantId }) => {
  const [storeName, setStoreName] = useState('متجري');
  const [currency, setCurrency] = useState('EGP');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [carrierRate, setCarrierRate] = useState('45');
  const [socials, setSocials] = useState<SocialMediaChannelsState>(DEFAULT_SOCIALS);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeTid = tenantId || localStorage.getItem('techzone_active_store_id') || 'tenant-moustafa-tech';

  useEffect(() => {
    fetch(`${API_BASE_URL}/stores/me?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant?.name) setStoreName(data.tenant.name);
        if (data.settings?.contactEmail) setEmail(data.settings.contactEmail);
        if (data.settings?.contactPhone) setPhone(data.settings.contactPhone);
        if (data.settings?.governorate) setGovernorate(data.settings.governorate);
        if (data.settings?.shippingZones?.default_rate) {
          setCarrierRate(String(data.settings.shippingZones.default_rate));
        }

        if (data.settings?.socialLinks && typeof data.settings.socialLinks === 'object') {
          const raw = data.settings.socialLinks;
          setSocials({
            facebook: typeof raw.facebook === 'object' ? { enabled: Boolean(raw.facebook.enabled), url: raw.facebook.url || '' } : { enabled: Boolean(raw.facebook), url: raw.facebook || '' },
            instagram: typeof raw.instagram === 'object' ? { enabled: Boolean(raw.instagram.enabled), url: raw.instagram.url || '' } : { enabled: Boolean(raw.instagram), url: raw.instagram || '' },
            whatsapp: typeof raw.whatsapp === 'object' ? { enabled: Boolean(raw.whatsapp.enabled), url: raw.whatsapp.url || '' } : { enabled: Boolean(raw.whatsapp), url: raw.whatsapp || '' },
            tiktok: typeof raw.tiktok === 'object' ? { enabled: Boolean(raw.tiktok.enabled), url: raw.tiktok.url || '' } : { enabled: Boolean(raw.tiktok), url: raw.tiktok || '' },
            twitter: typeof raw.twitter === 'object' ? { enabled: Boolean(raw.twitter.enabled), url: raw.twitter.url || '' } : { enabled: Boolean(raw.twitter), url: raw.twitter || '' },
            youtube: typeof raw.youtube === 'object' ? { enabled: Boolean(raw.youtube.enabled), url: raw.youtube.url || '' } : { enabled: Boolean(raw.youtube), url: raw.youtube || '' },
          });
        }
      })
      .catch(() => {});
  }, [activeTid]);

  const handleToggleChannel = (key: keyof SocialMediaChannelsState) => {
    setSocials((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }));
  };

  const handleUrlChange = (key: keyof SocialMediaChannelsState, val: string) => {
    setSocials((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        url: val,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    try {
      await fetch(`${API_BASE_URL}/stores/me?tenant_id=${activeTid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          contact_email: email,
          contact_phone: phone,
          governorate: governorate,
          shipping_zones: { default_rate: parseFloat(carrierRate) || 45, carrier: 'Bosta Express' },
          social_links: socials,
        }),
      });

      window.dispatchEvent(
        new CustomEvent('techzone:store-updated', {
          detail: { name: storeName, governorate, phone, socialLinks: socials },
        })
      );
      document.title = `${storeName} — إدارة المتجر`;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const channelList: {
    key: keyof SocialMediaChannelsState;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    placeholder: string;
    color: string;
  }[] = [
    {
      key: 'facebook',
      label: 'صفحة فيسبوك (Facebook)',
      icon: Facebook,
      placeholder: 'https://facebook.com/yourstore',
      color: '#1877F2',
    },
    {
      key: 'instagram',
      label: 'حساب انستغرام (Instagram)',
      icon: Instagram,
      placeholder: 'https://instagram.com/yourstore',
      color: '#E4405F',
    },
    {
      key: 'whatsapp',
      label: 'رقم واتساب المباشر (WhatsApp)',
      icon: MessageCircle,
      placeholder: '+20 10X XXX XXXX',
      color: '#25D366',
    },
    {
      key: 'tiktok',
      label: 'حساب تيك توك (TikTok)',
      icon: Share2,
      placeholder: 'https://tiktok.com/@yourstore',
      color: '#000000',
    },
    {
      key: 'twitter',
      label: 'حساب إكس / تويتر (X / Twitter)',
      icon: Twitter,
      placeholder: 'https://x.com/yourstore',
      color: '#1DA1F2',
    },
    {
      key: 'youtube',
      label: 'قناة يوتيوب (YouTube)',
      icon: Youtube,
      placeholder: 'https://youtube.com/@yourstore',
      color: '#FF0000',
    },
  ];

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6 font-sans text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>إعدادات المتجر والهوية البصرية (Store Settings)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            التحكم في بيانات المتجر، قنوات السوشيال ميديا، الشحن، وبوابات الدفع الإلكترونية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left col: Logo Uploader */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
            شعار وهوية المتجر
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            ارفع شعار متجرك لتحليل الألوان آلياً وتطبيقها فوراً على متجر الزوار والواجهات الحية
          </p>
          <LogoUploader tenantId={activeTid} />
        </div>

        {/* Right col: Settings & Social Media Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Store Name */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم المتجر الرسمي</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-semibold"
              />
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">البريد الإلكتروني للتواصل</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رقم هاتف المتجر</label>
                <input
                  type="tel"
                  placeholder="+20 10X XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span>المحافظة الرئيسية</span>
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-semibold"
                >
                  {EGYPTIAN_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Social Media Channels Section (With Individual Enable/Disable Toggles) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-sky-500" />
                  <span>قنوات التواصل الاجتماعي (الظهور في الفوتر)</span>
                </h4>
                <span className="text-xs text-slate-400">
                  تفعيل أو تعطيل كل منصة مع تحديد الرابط
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {channelList.map((ch) => {
                  const IconComponent = ch.icon;
                  const item = socials[ch.key];
                  const isEnabled = Boolean(item?.enabled);

                  return (
                    <div
                      key={ch.key}
                      className={`p-3 rounded-xl border transition-all ${
                        isEnabled
                          ? 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-2xs'
                          : 'bg-slate-100/40 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                            <IconComponent className="w-3.5 h-3.5 shrink-0" style={{ color: ch.color }} />
                          </div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {ch.label}
                          </span>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(ch.key)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? '-translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <input
                        type="text"
                        disabled={!isEnabled}
                        value={item?.url || ''}
                        onChange={(e) => handleUrlChange(ch.key, e.target.value)}
                        placeholder={ch.placeholder}
                        className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono disabled:cursor-not-allowed"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping & Payment settings */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-500" />
                <span>إعدادات الشحن والتوصيل (Bosta Express)</span>
              </h4>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  سعر الشحن الافتراضي (ج.م) لكافة المحافظات
                </label>
                <input
                  type="number"
                  value={carrierRate}
                  onChange={(e) => setCarrierRate(e.target.value)}
                  className="w-full sm:w-48 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span>العملة الرسمية</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">{currency} — الجنيه المصري</span>
              </div>

              <div className="flex items-center gap-3">
                {isSaved && (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم حفظ الإعدادات وتحديث الفوتر فوراً!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
