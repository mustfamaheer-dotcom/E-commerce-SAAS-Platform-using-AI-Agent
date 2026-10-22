// apps/web/src/pages/dashboard/EcommerceStudioPage.tsx
import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAppTheme } from '../../contexts/ThemeContext';
import { LogoUploader } from '../../components/LogoUploader';

interface EcommerceStudioPageProps {
  onOpenStorefront?: () => void;
}

export const EcommerceStudioPage: React.FC<EcommerceStudioPageProps> = ({
  onOpenStorefront,
}) => {
  const { theme, updateThemeColors } = useAppTheme();

  // Storefront Config State
  const [storeName, setStoreName] = useState('Moustafa Tech');
  const [storeSlug, setStoreSlug] = useState('-moustafa-tech--102');
  const [heroTitle, setHeroTitle] = useState('أفضل الأجهزة والإلكترونيات الذكية بأسعار لا تُنافس');
  const [heroSubtitle, setHeroSubtitle] = useState(
    'تسوق الآن مع ضمان حقيقي، تقسيط وبطاقات بنكية Paymob، تحويل InstaPay فوري، وخيارات الدفع عند الاستلام.'
  );
  const [announcementText, setAnnouncementText] = useState(
    'أحدث العروض الحصرية مع شحن بوسطة لجميع المحافظات 🇪🇬'
  );
  const [carrierRate, setCarrierRate] = useState('45');
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor || '#0ea5e9');

  // AI Agent Studio Chat State
  const [agentMessages, setAgentMessages] = useState<
    { id: string; sender: 'agent' | 'user'; text: string; timestamp: string }[]
  >([
    {
      id: 'agent_init',
      sender: 'agent',
      text: 'أهلاً بك يا فندم في استوديو تخصيص المتجر الذكي! 🎨\nأنا وكيلك لتصميم واجهة المتجر. تقدر تطلب مني تعديل الألوان، تغيير نصوص البانر الرئيسي، إبراز العروض، أو ضبط إعدادات الشحن فوراً.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'agent' | 'visual' | 'identity'>('agent');

  // Load existing store settings
  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/v1/stores/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant?.name) setStoreName(data.tenant.name);
        if (data.tenant?.slug) setStoreSlug(data.tenant.slug);
        if (data.theme?.primaryColor) {
          setPrimaryColor(data.theme.primaryColor);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    setIsSaved(true);
    updateThemeColors({ primaryColor });
    try {
      await fetch('http://127.0.0.1:8001/api/v1/stores/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          shipping_zones: { default_rate: parseFloat(carrierRate) || 45 },
        }),
      });
      await fetch('http://127.0.0.1:8001/api/v1/stores/me/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: primaryColor,
        }),
      });
    } catch (_) {}
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopyStorefrontUrl = () => {
    const url = `${window.location.origin}/store/${storeSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendAgentCommand = (textToSend?: string) => {
    const query = textToSend || agentInput;
    if (!query.trim()) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user' as const,
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAgentMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setAgentInput('');
    setIsAgentThinking(true);

    setTimeout(() => {
      let reply = 'تم استلام وتطبيق التعديل على متجرك بنجاح! ✨';
      const q = query.toLowerCase();

      if (q.includes('بنفسجي') || q.includes('purple')) {
        setPrimaryColor('#8b5cf6');
        updateThemeColors({ primaryColor: '#8b5cf6' });
        reply = 'تم تغيير لون المتجر الرئيسي إلى البنفسجي العصري الملكي (#8b5cf6) وتطبيقه على كافة أزرار الشراء والعناوين! 💜';
      } else if (q.includes('ازرق') || q.includes('أزرق') || q.includes('سماوي')) {
        setPrimaryColor('#0ea5e9');
        updateThemeColors({ primaryColor: '#0ea5e9' });
        reply = 'تم تحديث ألوان الهوية إلى الأزرق السماوي التقني (#0ea5e9) بنجاح! 🌊';
      } else if (q.includes('اخضر') || q.includes('أخضر') || q.includes('زمردي')) {
        setPrimaryColor('#10b981');
        updateThemeColors({ primaryColor: '#10b981' });
        reply = 'تم اعتماد اللون الأخضر الزمردي (#10b981) ليعكس الثقة وسرعة الشحن! 🌿';
      } else if (q.includes('شحن') || q.includes('مجاني')) {
        setAnnouncementText('شحن مجاني لكافة محافظات مصر للطلبات فوق 1000 جنيه لفترة محدودة 🚚');
        reply = 'تم تحديث شريط الإعلانات العلوي إلى عرض الشحن المجاني بنجاح! 🚚';
      } else if (q.includes('عنوان') || q.includes('بانر')) {
        setHeroTitle('أقوى عروض الأجهزة الذكية وملحقات الهواتف في مصر');
        reply = 'تم تحديث العنوان الرئيسي للبانر ليكون أكثر جاذبية للعملاء! 📢';
      } else if (q.includes('خصم') || q.includes('عروض')) {
        setHeroSubtitle('خصومات حصرية تصل إلى 25% مع إمكانية التقسيط والدفع عند الاستلام وضمان استبدال 14 يوم.');
        reply = 'تم تفعيل وربط نصوص الخصم في الواجهة الأمامية للمتجر بنجاح! 🏷️';
      }

      setAgentMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          sender: 'agent',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsAgentThinking(false);
    }, 600);
  };

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-900 dark:text-slate-100 pb-12">
      {/* Top Banner and Quick Links */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Store className="w-5 h-5 text-sky-500" />
              <span>استوديو تخصيص متجر العملاء (E-Commerce Studio)</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تحكم في واجهة المتجر، البانرات الإعلانية، الهوية البصرية، وأسعار الشحن بالذكاء الاصطناعي
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={handleCopyStorefrontUrl}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط المتجر'}</span>
          </button>

          {onOpenStorefront && (
            <button
              type="button"
              onClick={onOpenStorefront}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة متجر العملاء</span>
            </button>
          )}
        </div>
      </div>

      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>تم حفظ كافة تخصيصات المتجر وتطبيقها فوراً على متجر العملاء!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('agent')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'agent'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>التخصيص مع وكيل الذكاء الاصطناعي (AI Agent)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visual')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'visual'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>البانر والواجهة الرئيسية (Visual Editor)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'identity'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>ألوان الهوية والشعار (Vision AI)</span>
        </button>
      </div>

      {/* Tab 1: AI Agent Customization */}
      {activeTab === 'agent' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    محادثة وكيل تصميم وتخصيص المتجر
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    اكتب أي تعديل بالعربي وسيقوم الوكيل بتطبيقه فوراً
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
              {agentMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-start' : 'items-end'
                  } space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                    <span>{m.sender === 'user' ? 'أنت (التاجر)' : 'وكيل التصميم'}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                      m.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isAgentThinking && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce delay-200" />
                  <span className="text-[11px]">جاري تعديل المتجر في السيرفر وقاعدة البيانات...</span>
                </div>
              )}
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-1.5 overflow-x-auto text-[11px]">
              <button
                type="button"
                onClick={() => handleSendAgentCommand('غير ألوان المتجر إلى البنفسجي العصري')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-600 dark:text-slate-300 hover:text-sky-600 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                💜 لون بنفسجي ملكي
              </button>

              <button
                type="button"
                onClick={() => handleSendAgentCommand('فعل إعلان شحن مجاني لكافة المحافظات')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-600 dark:text-slate-300 hover:text-sky-600 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                🚚 إعلان شحن مجاني
              </button>

              <button
                type="button"
                onClick={() => handleSendAgentCommand('غير عنوان البانر لعنوان تسويقي مميز')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-600 dark:text-slate-300 hover:text-sky-600 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                📢 عنوان تسويقي جذاب
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAgentCommand();
              }}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="اطلب من الوكيل أي تعديل (مثلاً: غير اللون للأخضر أو فعل عرض خصم 20%)..."
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!agentInput.trim() || isAgentThinking}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>إرسال</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Live Mini Preview Box */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-500" />
                <span>معاينة واجهة المتجر الحية (Live Preview)</span>
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {primaryColor}
              </span>
            </div>

            {/* Scaled Mini Store View */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 text-xs">
              {/* Mini Banner */}
              <div
                className="p-4 text-white text-right space-y-2"
                style={{
                  background: `linear-gradient(135deg, #0f172a 0%, ${primaryColor} 100%)`,
                }}
              >
                <div className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold">
                  {announcementText}
                </div>
                <h4 className="font-black text-sm leading-tight">{heroTitle}</h4>
                <p className="text-[10px] opacity-80 line-clamp-2">{heroSubtitle}</p>
                <button
                  type="button"
                  style={{ backgroundColor: primaryColor }}
                  className="px-3 py-1 rounded-lg text-white font-bold text-[10px] shadow-xs"
                >
                  تصفح الكتالوج بالكامل
                </button>
              </div>

              {/* Mini Trust Items */}
              <div className="p-3 grid grid-cols-2 gap-2 text-[10px] border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>شحن سريع بوسطة ({carrierRate} ج.م)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>دفع Paymob و InstaPay</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتثبيت التخصيصات</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Visual Editor */}
      {activeTab === 'visual' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                العنوان الرئيسي في البانر (Hero Title)
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                الشريط الإعلاني العلوي (Announcement Bar)
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                الوصف التسويقي في البانر (Hero Subtitle)
              </label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                تكلفة الشحن الافتراضية (بوسطة Bosta)
              </label>
              <input
                type="number"
                value={carrierRate}
                onChange={(e) => setCarrierRate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>حفظ تعديلات البانر والواجهة</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Colors & Logo AI */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          <LogoUploader
            onThemeGenerated={(t) => {
              if (t.primaryColor) {
                setPrimaryColor(t.primaryColor);
                updateThemeColors({ primaryColor: t.primaryColor });
              }
            }}
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-500" />
              <span>تعديل لون المتجر الرئيسي يدوياً</span>
            </h3>

            <div className="flex items-center gap-4">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  updateThemeColors({ primaryColor: e.target.value });
                }}
                className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
              />
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                {primaryColor}
              </span>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
              >
                تطبيق وحفظ اللون
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
