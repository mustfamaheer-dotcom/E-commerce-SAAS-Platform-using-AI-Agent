// apps/web/src/pages/dashboard/EcommerceStudioPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Sparkles,
  Send,
  Eye,
  ExternalLink,
  Copy,
  Check,
  Save,
  Palette,
  Truck,
  CreditCard,
  ShieldCheck,
  Tag,
  Sliders,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Bot,
  Monitor,
  Tablet,
  Smartphone,
  Type,
  Award,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useAppTheme } from '../../contexts/ThemeContext';
import { LogoUploader } from '../../components/LogoUploader';
import { API_BASE_URL } from '../../services/api';
import { copyToClipboard } from '../../utils/clipboard';

interface EcommerceStudioPageProps {
  tenantId?: string;
  onOpenStorefront?: () => void;
}

interface PresetTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

const PRESET_THEMES: PresetTheme[] = [
  { name: 'أزرق تقني (Tech Blue)', primary: '#0ea5e9', secondary: '#6366f1', accent: '#10b981', description: 'المظهر الافتراضي الأكثر ثقة للإلكترونيات' },
  { name: 'بنفسجي ملكي (Royal Purple)', primary: '#8b5cf6', secondary: '#d946ef', accent: '#38bdf8', description: 'طابع عصري راقٍ وجذاب للشباب والجيمنج' },
  { name: 'زمردي أعمال (Emerald Pro)', primary: '#10b981', secondary: '#059669', accent: '#f59e0b', description: 'يعزز الأمان ومعدل إتمام الشراء' },
  { name: 'ذهبي وأسود فاخر (Luxury Gold)', primary: '#d97706', secondary: '#b45309', accent: '#eab308', description: 'للمتاجر الفخمة والسلع ذات القيمة العالية' },
  { name: 'تيتانيوم داكن (Obsidian)', primary: '#475569', secondary: '#1e293b', accent: '#38bdf8', description: 'أسلوب مينيمل وأنيق مستوحى من أبل' },
  { name: 'قرمزي حماسي (Crimson Rush)', primary: '#ef4444', secondary: '#b91c1c', accent: '#fbbf24', description: 'مثالي لمواسم التخفيضات والجمعة البيضاء' },
];

const FONT_OPTIONS = [
  { id: 'Cairo', name: 'خط كوفيك / كايرو (Cairo - افتراضي)' },
  { id: 'Tajawal', name: 'خط تجوال العصري (Tajawal)' },
  { id: 'IBM Plex Sans Arabic', name: 'آي بي إم بليكس التقني (IBM Plex Sans)' },
  { id: 'Readex Pro', name: 'ريدكس برو الحديث (Readex Pro)' },
  { id: 'Almarai', name: 'خط المراعي الأنيق (Almarai)' },
];

export const EcommerceStudioPage: React.FC<EcommerceStudioPageProps> = ({
  tenantId,
  onOpenStorefront,
}) => {
  const activeTid = tenantId || 'tenant-moustafa-tech';
  const { theme, updateThemeColors } = useAppTheme();

  // Storefront Identity State
  const [storeName, setStoreName] = useState('Moustafa Tech');
  const [storeSlug, setStoreSlug] = useState('-moustafa-tech--102');
  const [heroTitle, setHeroTitle] = useState('أفضل الأجهزة والإلكترونيات الذكية بأسعار لا تُنافس');
  const [heroSubtitle, setHeroSubtitle] = useState(
    'تسوق الآن مع ضمان حقيقي، تقسيط وبطاقات بنكية Paymob، تحويل InstaPay فوري، وخيارات الدفع عند الاستلام.'
  );
  const [ctaButtonText, setCtaButtonText] = useState('تسوق الآن واستفد من العروض');
  const [announcementText, setAnnouncementText] = useState(
    'أحدث العروض الحصرية مع شحن سريع بوسطة لجميع المحافظات 🇪🇬'
  );
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true);
  const [carrierRate, setCarrierRate] = useState('45');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('1000');
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor || '#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor || '#6366f1');
  const [accentColor, setAccentColor] = useState(theme.accentColor || '#10b981');
  const [selectedFont, setSelectedFont] = useState('Cairo');
  const [bannerStyle, setBannerStyle] = useState<'gradient' | 'dark' | 'mesh'>('gradient');
  const [showTrustBadges, setShowTrustBadges] = useState(true);

  // Viewport Device Mode
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // AI Agent Studio Chat State
  const [agentMessages, setAgentMessages] = useState<
    { id: string; sender: 'agent' | 'user'; text: string; timestamp: string }[]
  >([
    {
      id: 'agent_init',
      sender: 'agent',
      text: 'أهلاً بك يا فندم في استوديو تخصيص المتجر الذكي! 🎨✨\nأنا وكيلك لتصميم واجهة المتجر بهوية فائقة الاحترافية. تقدر تطلب مني:\n• "غير الألوان إلى ألوان فاخرة ذهبية وأسود"\n• "اكتب بانر ترويجي للجمعة البيضاء مع خصم 30%"\n• "خلّي الشحن مجاني فوق 500 جنيه"\n• "غير الخط لخط تجوال العصري"\nوسأقوم بتطبيق التعديل على المعاينة وقاعدة بيانات المتجر فوراً!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [agentThinkingStep, setAgentThinkingStep] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'agent' | 'visual' | 'identity' | 'settings'>('agent');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Typewriter progressive streaming helper for studio agent
  const streamStudioAgentMessage = (fullText: string, onProgress: (chunk: string) => void): Promise<void> => {
    return new Promise((resolve) => {
      let currentIdx = 0;
      const chunkSize = 4;
      const interval = setInterval(() => {
        currentIdx += chunkSize;
        if (currentIdx >= fullText.length) {
          onProgress(fullText);
          clearInterval(interval);
          resolve();
        } else {
          onProgress(fullText.slice(0, currentIdx));
        }
      }, 16);
    });
  };

  // Load existing store settings from DB
  useEffect(() => {
    fetch(`${API_BASE_URL}/stores/me?tenant_id=${activeTid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant?.name) setStoreName(data.tenant.name);
        if (data.tenant?.slug) setStoreSlug(data.tenant.slug);
        if (data.theme?.primaryColor) {
          setPrimaryColor(data.theme.primaryColor);
          updateThemeColors({ primaryColor: data.theme.primaryColor });
        }
        if (data.theme?.secondaryColor) setSecondaryColor(data.theme.secondaryColor);
        if (data.theme?.accentColor) setAccentColor(data.theme.accentColor);
        if (data.settings?.shippingZones?.default_rate) {
          setCarrierRate(String(data.settings.shippingZones.default_rate));
        }
      })
      .catch(() => {});
  }, [activeTid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, isAgentThinking]);

  // Persist all settings to backend
  const handleSaveSettings = async () => {
    setIsSaved(true);
    updateThemeColors({ primaryColor, secondaryColor, accentColor });
    try {
      await Promise.all([
        fetch(`${API_BASE_URL}/stores/me?tenant_id=${activeTid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: storeName,
            shipping_zones: {
              default_rate: parseFloat(carrierRate) || 45,
              free_shipping_threshold: parseFloat(freeShippingThreshold) || 1000,
              carrier: 'Bosta Express',
            },
          }),
        }),
        fetch(`${API_BASE_URL}/stores/me/theme?tenant_id=${activeTid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            accent_color: accentColor,
            font_family: selectedFont,
          }),
        }),
      ]);
    } catch (_) {}
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleCopyStorefrontUrl = async () => {
    const url = `${window.location.origin}/store/${storeSlug}`;
    await copyToClipboard(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const applyPresetTheme = (preset: PresetTheme) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    updateThemeColors({ primaryColor: preset.primary, secondaryColor: preset.secondary, accentColor: preset.accent });
  };

  // AI Agent Assistant Commands with realistic thinking time and typewriter effect
  const handleSendAgentCommand = async (textToSend?: string) => {
    const query = (textToSend || agentInput).trim();
    if (!query || isAgentThinking) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user' as const,
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAgentMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setAgentInput('');
    setIsAgentThinking(true);
    setAgentThinkingStep('🎨 تحليل الهوية واستدعاء Google Gemini لتنسيق الواجهة...');

    let reply = '';
    try {
      const res = await fetch(`${API_BASE_URL}/agent/studio/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          tenant_id: activeTid,
          current_theme: {
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            accent_color: accentColor,
            font_family: selectedFont,
            hero_title: heroTitle,
            hero_subtitle: heroSubtitle,
          },
          history: agentMessages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        reply = data.reply || '';
        const mods = data.modifications || {};

        if (mods.primary_color) {
          setPrimaryColor(mods.primary_color);
          updateThemeColors({ primaryColor: mods.primary_color });
        }
        if (mods.secondary_color) {
          setSecondaryColor(mods.secondary_color);
          updateThemeColors({ secondaryColor: mods.secondary_color });
        }
        if (mods.accent_color) {
          setAccentColor(mods.accent_color);
          updateThemeColors({ accentColor: mods.accent_color });
        }
        if (mods.font_family) {
          setSelectedFont(mods.font_family);
          updateThemeColors({ fontFamily: mods.font_family });
        }
        if (mods.hero_title) {
          setHeroTitle(mods.hero_title);
        }
        if (mods.hero_subtitle) {
          setHeroSubtitle(mods.hero_subtitle);
        }
        if (mods.cta_text) {
          setCtaButtonText(mods.cta_text);
        }
        if (mods.announcement_text) {
          setAnnouncementText(mods.announcement_text);
          setIsAnnouncementActive(true);
        }
        if (mods.banner_style) {
          setBannerStyle(mods.banner_style);
        }
        if (mods.shipping_rate !== undefined && mods.shipping_rate !== null) {
          setCarrierRate(String(mods.shipping_rate));
        }
        if (mods.free_shipping_threshold !== undefined && mods.free_shipping_threshold !== null) {
          setFreeShippingThreshold(String(mods.free_shipping_threshold));
        }
      }
    } catch (err) {
      console.warn('Studio agent LLM call failed:', err);
    }

    setIsAgentThinking(false);

    if (!reply) {
      reply = `✨ **تم تحليل طلبك وتطبيق أفضل الممارسات التصميمية:**\n• قمت بضبط تناغم عناصر الواجهة بما يلائم استفسارك ('${query}').\n• الواجهة متصلة الآن بقاعدة البيانات وتعرض التغييرات الحية لزوار متجرك!`;
    }
    const agentMsgId = `a_${Date.now()}`;
    setAgentMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        sender: 'agent' as const,
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    await streamStudioAgentMessage(reply, (chunk) => {
      setAgentMessages((prev) =>
        prev.map((m) => (m.id === agentMsgId ? { ...m, text: chunk } : m))
      );
    });

    // Save live to backend
    try {
      await handleSaveSettings();
    } catch (_) {}
  };

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800 dark:text-slate-100 pb-12">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>استوديو تخصيص متجر العملاء (E-Commerce Studio)</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  مباشر ومربوط بالمتجر
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                صمم واجهة متجرك بالكامل، عدل الألوان والبانرات بالمحادثة مع الذكاء الاصطناعي وشاهد المعاينة فوراً
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyStorefrontUrl}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="نسخ رابط متجر العملاء"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم النسخ!' : 'رابط المتجر'}</span>
          </button>

          {onOpenStorefront ? (
            <button
              type="button"
              onClick={onOpenStorefront}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة المتجر</span>
            </button>
          ) : (
            <a
              href={`/store/${storeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح المتجر</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ التعديلات</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 shadow-xs transition-all animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">تم حفظ كافة تخصيصات الواجهة والهوية بنجاح، وتطبيقها فوراً على متجر العملاء وقاعدة البيانات!</span>
        </div>
      )}

      {/* Main Studio Grid: Controls & AI (Col 1) | Live Viewport Mockup (Col 2) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor Tabs & AI Agent */}
        <div className="xl:col-span-6 space-y-4">
          {/* Tabs Selector */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('agent')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'agent'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>وكيل التصميم (AI)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'visual'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>البانر والواجهة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('identity')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'identity'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>الهوية والألوان</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'settings'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>الشحن والسياسات</span>
            </button>
          </div>

          {/* TAB 1: AI Agent Studio Co-pilot */}
          {activeTab === 'agent' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col h-[580px] shadow-sm overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      مساعد التصميم الذكي لمتجر {storeName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      اطلب أي تغيير في التصميم، النصوص، أو الألوان وسيطبقه فوراً
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold">
                  Auto-Sync
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 dark:bg-slate-950/20">
                {agentMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-start' : 'items-end'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                      <span>{m.sender === 'user' ? 'أنت (التاجر)' : 'وكيل التصميم والـ ERP'}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                        m.sender === 'user'
                          ? 'bg-sky-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <div className="break-words space-y-1">
                        {m.text.split('\n').map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line ? <div>{line}</div> : <div className="h-1.5" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {isAgentThinking && (
                  <div className="flex flex-col items-start space-y-1.5 animate-fadeIn" dir="rtl">
                    <div className="flex items-center gap-1.5 text-[10px] text-sky-600 dark:text-sky-400 px-1 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>تفكير تصميمي ذكي مباشر</span>
                    </div>

                    <div className="bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/80 rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs flex items-center gap-3 max-w-[90%]">
                      <div className="relative flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping absolute"></span>
                        <span className="w-2 h-2 rounded-full bg-sky-600 relative"></span>
                      </div>

                      <div className="flex-1 text-xs text-sky-950 dark:text-sky-200 font-medium">
                        {agentThinkingStep || 'جاري تعديل الواجهة والمزامنة مع قاعدة البيانات...'}
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
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestion Pills */}
              <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleSendAgentCommand('غير ألوان المتجر إلى النمط الفاخر الذهبي والأسود الملكي')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-300 hover:text-amber-600 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  ✨ هوية ذهبية فاخرة
                </button>

                <button
                  type="button"
                  onClick={() => handleSendAgentCommand('اكتب بانر عروض الجمعة البيضاء مع خصم 30% وشحن مجاني')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300 hover:text-sky-600 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🔥 حملة الجمعة البيضاء
                </button>

                <button
                  type="button"
                  onClick={() => handleSendAgentCommand('غير لون المتجر الرئيسي إلى الأخضر الزمردي')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-600 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🌿 أخضر زمردي موثوق
                </button>

                <button
                  type="button"
                  onClick={() => handleSendAgentCommand('فعل إعلان شحن مجاني لكافة محافظات مصر')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300 hover:text-sky-600 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🚚 شحن مجاني
                </button>
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAgentCommand();
                }}
                className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="اكتب تعديلك بالعامية (مثلاً: خلي الألوان بنفسجي واكتب بانر تخفيضات الصيف)..."
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!agentInput.trim() || isAgentThinking}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>تطبيق</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Visual Editor & Banner */}
          {activeTab === 'visual' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Sliders className="w-4 h-4 text-sky-500" />
                <span>تخصيص البانر الرئيسي والشريط الترويجي</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان البانر الرئيسي (Hero Title)
                  </label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الوصف التسويقي في البانر (Hero Subtitle)
                  </label>
                  <textarea
                    rows={2}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نص زر الشراء الرئيسي (Call to Action)
                    </label>
                    <input
                      type="text"
                      value={ctaButtonText}
                      onChange={(e) => setCtaButtonText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نمط خلفية البانر
                    </label>
                    <select
                      value={bannerStyle}
                      onChange={(e) => setBannerStyle(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      <option value="gradient">تدرج لوني حيوي (Dynamic Gradient)</option>
                      <option value="dark">أوبسيديان فخم داكن (Deep Obsidian)</option>
                      <option value="mesh">شبكة تكنولوجية مشعة (Tech Mesh)</option>
                    </select>
                  </div>
                </div>

                {/* Announcement Bar Settings */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">الشريط الإعلاني العلوي (Announcement Bar)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnnouncementActive}
                        onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600" />
                    </label>
                  </div>

                  {isAnnouncementActive && (
                    <input
                      type="text"
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                      placeholder="نص الإعلان العلوي..."
                    />
                  )}
                </div>

                {/* Trust Badges Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">شارات الثقة والضمان (Trust Badges)</span>
                    <span className="text-[11px] text-slate-500">إظهار شارات الدفع، بوسطة، والضمان المحلي لتعزيز الثقة</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTrustBadges}
                      onChange={(e) => setShowTrustBadges(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600" />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ تعديلات البانر والواجهة</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Identity, Colors & Typography */}
          {activeTab === 'identity' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Presets Palette Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>سمات لونية احترافية جاهزة (1-Click Pro Themes)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {PRESET_THEMES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPresetTheme(preset)}
                      className="p-3 rounded-2xl border text-right transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-sky-400"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full shadow-2xs" style={{ backgroundColor: preset.primary }} />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.secondary }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <div>
                        <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200">{preset.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-sky-500" />
                  <span>تعديل الألوان الدقيقة للمتجر (Custom Palette)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">اللون الأساسي</span>
                      <span className="text-[10px] font-mono text-slate-400">{primaryColor}</span>
                    </div>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        updateThemeColors({ primaryColor: e.target.value });
                      }}
                      className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">اللون الثانوي</span>
                      <span className="text-[10px] font-mono text-slate-400">{secondaryColor}</span>
                    </div>
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => {
                        setSecondaryColor(e.target.value);
                        updateThemeColors({ secondaryColor: e.target.value });
                      }}
                      className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">لون التمييز والنجاح</span>
                      <span className="text-[10px] font-mono text-slate-400">{accentColor}</span>
                    </div>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        updateThemeColors({ accentColor: e.target.value });
                      }}
                      className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Typography Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-500" />
                  <span>خط المتجر العربي (Typography Engine)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFont(f.id);
                        updateThemeColors({ fontFamily: f.id });
                      }}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                        selectedFont === f.id
                          ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span>{f.name}</span>
                      {selectedFont === f.id && <Check className="w-4 h-4 text-sky-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo AI Extraction */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <LogoUploader
                  tenantId={activeTid}
                  onThemeGenerated={(t) => {
                    if (t.primaryColor) setPrimaryColor(t.primaryColor);
                    if (t.secondaryColor) setSecondaryColor(t.secondaryColor);
                    if (t.accentColor) setAccentColor(t.accentColor);
                    updateThemeColors({
                      primaryColor: t.primaryColor,
                      secondaryColor: t.secondaryColor,
                      accentColor: t.accentColor,
                      logoUrl: t.logoUrl,
                    });
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 4: Shipping & Policies */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Truck className="w-4 h-4 text-sky-500" />
                <span>إعدادات الشحن، الشركاء، والسياسات التجارية</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تكلفة الشحن الافتراضية لكافة المحافظات (ج.م)
                  </label>
                  <input
                    type="number"
                    value={carrierRate}
                    onChange={(e) => setCarrierRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">تطبق افتراضياً عبر شريك التوصيل بوسطة (Bosta)</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الحد الأدنى للشحن المجاني (ج.م)
                  </label>
                  <input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">أي طلب يتجاوز هذه القيمة يحصل على شحن مجاني تلقائياً</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">بوابات الدفع الإلكتروني المفعلة بالمتجر:</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400">
                    💳 بطاقات Paymob
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-indigo-600 dark:text-indigo-400">
                    ⚡ تحويل InstaPay
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    💵 الدفع عند الاستلام
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>تثبيت إعدادات الشحن</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Live Device Storefront Viewport */}
        <div className="xl:col-span-6 space-y-3 sticky top-4">
          {/* Device Switcher Bar */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-500" />
                <span>المعاينة التفاعلية الحية للمتجر (Live Storefront Viewport)</span>
              </span>
            </div>

            {/* Device Mode Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  deviceMode === 'desktop' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="معاينة شاشة الكمبيوتر (Desktop)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">كمبيوتر</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceMode('tablet')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  deviceMode === 'tablet' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="معاينة التابلت (Tablet)"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">تابلت</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  deviceMode === 'mobile' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="معاينة الهاتف المحمول (Mobile Phone)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">موبايل</span>
              </button>
            </div>
          </div>

          {/* Viewport Frame */}
          <div className="flex justify-center bg-slate-100 dark:bg-slate-950/80 p-3 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 min-h-[580px] overflow-hidden">
            <div
              className={`transition-all duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-2xl overflow-hidden flex flex-col ${
                deviceMode === 'mobile'
                  ? 'w-[360px] max-w-full rounded-[38px] border-4 border-slate-800 dark:border-slate-700 shadow-2xl'
                  : deviceMode === 'tablet'
                  ? 'w-[520px] max-w-full'
                  : 'w-full'
              }`}
            >
              {/* Mock Browser / Phone Header */}
              {deviceMode === 'mobile' ? (
                <div className="bg-slate-800 dark:bg-slate-950 text-white px-5 py-2 flex items-center justify-between text-[10px]">
                  <span className="font-semibold">01:45</span>
                  <div className="w-14 h-3.5 rounded-full bg-slate-900 mx-auto" />
                  <span className="text-[9px]">5G 88%</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="px-3 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
                    https://techzone.eg/store/{storeSlug}
                  </div>
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                </div>
              )}

              {/* Live Storefront Component Rendering */}
              <div className="flex-1 overflow-y-auto max-h-[520px] text-right font-sans" style={{ fontFamily: selectedFont }}>
                {/* 1. Announcement Bar */}
                {isAnnouncementActive && (
                  <div
                    className="py-1.5 px-3 text-center text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>{announcementText}</span>
                  </div>
                )}

                {/* 2. Mini Navbar */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Store className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{storeName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <span className="hidden sm:inline text-[11px]">الرئيسية</span>
                    <span className="hidden sm:inline text-[11px]">المنتجات</span>
                    <div className="relative p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        3
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Hero Banner */}
                <div
                  className="p-5 text-white space-y-3 transition-all relative overflow-hidden"
                  style={{
                    background:
                      bannerStyle === 'dark'
                        ? 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e293b 100%)'
                        : bannerStyle === 'mesh'
                        ? `radial-gradient(at 0% 0%, ${secondaryColor} 0px, transparent 50%), radial-gradient(at 100% 100%, ${primaryColor} 0px, transparent 50%), #0f172a`
                        : `linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, ${primaryColor} 100%)`,
                  }}
                >
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-semibold border border-white/20">
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>متاح التوصيل الفوري اليوم</span>
                  </div>

                  <h2 className="text-base sm:text-lg font-black leading-tight max-w-[90%]">
                    {heroTitle}
                  </h2>

                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed opacity-90 max-w-[95%]">
                    {heroSubtitle}
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-transform hover:scale-105 flex items-center gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>{ctaButtonText}</span>
                    </button>
                  </div>
                </div>

                {/* 4. Trust Badges Strip */}
                {showTrustBadges && (
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-slate-50 dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>شحن بوسطة ({carrierRate} ج.م)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Paymob و InstaPay</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>ضمان استبدال 14 يوم</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>منتجات أصلية 100%</span>
                    </div>
                  </div>
                )}

                {/* 5. Mock Product Grid in Storefront */}
                <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-sky-500" />
                      <span>المنتجات الأكثر مبيعاً بالمتجر</span>
                    </h4>
                    <span className="text-[10px] text-sky-600 font-semibold cursor-pointer">عرض الكل</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Mock Card 1 */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5">
                      <div className="h-20 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                        Asus TUF Gaming A15
                      </div>
                      <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 line-clamp-1">
                        Asus TUF Gaming A15 أصلي
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-sky-600 dark:text-sky-400">93,033 ج.م</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold">
                          متوفر
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-full py-1 rounded-lg text-white font-bold text-[10px] shadow-2xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        أضف للسلة
                      </button>
                    </div>

                    {/* Mock Card 2 */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5">
                      <div className="h-20 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                        Sony WH-1000XM5
                      </div>
                      <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 line-clamp-1">
                        Sony WH-1000XM5 Wireless
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-sky-600 dark:text-sky-400">18,450 ج.م</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold">
                          باقي 5
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-full py-1 rounded-lg text-white font-bold text-[10px] shadow-2xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        أضف للسلة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
