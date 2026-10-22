// apps/web/src/pages/onboarding/AiStoreBuilderPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Store,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Truck,
  Copy,
  Check,
  Share2,
  ArrowRight,
  RefreshCw,
  Sliders,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { UserAccount } from '../../components/auth/AuthModal';
import { ProvisionedStore } from '../hub/ServicesHubPage';
import { useAppTheme } from '../../contexts/ThemeContext';

interface Message {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  isQuickReplies?: string[];
  showPreviewCard?: boolean;
  provisionedStore?: ProvisionedStore;
}

interface AiStoreBuilderPageProps {
  user: UserAccount;
  onStoreCreated: (store: ProvisionedStore) => void;
  onOpenStoreAdmin: (store: ProvisionedStore) => void;
  onOpenStorefront: (store: ProvisionedStore) => void;
  onBackToHub: () => void;
}

export const AiStoreBuilderPage: React.FC<AiStoreBuilderPageProps> = ({
  user,
  onStoreCreated,
  onOpenStoreAdmin,
  onOpenStorefront,
  onBackToHub,
}) => {
  const { theme, toggleMode } = useAppTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState<'admin' | 'storefront' | null>(null);

  // Collected Store Data State
  const [storeData, setStoreData] = useState({
    storeName: '',
    category: 'إلكترونيات واكسسوارات',
    shippingScope: 'جميع محافظات مصر عبر بوسطة (Bosta)',
    paymentGateways: ['Paymob (فيزا/ميزة)', 'InstaPay (تحويل فوري)', 'فوري', 'الدفع عند الاستلام'],
    themeMode: 'dark' as 'light' | 'dark',
    primaryColor: '#0ea5e9',
    currency: 'EGP (جنيه مصري)',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initial Egyptian Arabic Greeting
  useEffect(() => {
    const initialGreeting: Message = {
      id: 'msg_init',
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      text: `يا أهلاً وسهلاً بيك يا باشا (${user.name})! 🇪🇬\n\nأنا وكيلك الذكي لتأسيس المتاجر في تيك زون. خطوة بخطوة وبالمصري كده هبني لك متجرك الإلكتروني المتكامل في دقايق معدودة، وهجهز لك الهوية، بوابات الدفع المصرية، وشحن بوسطة.\n\nيلا بينا نبدأ.. **عايز تسمي متجرك إيه؟ وإيه المجال أو نوع المنتجات اللي هتركز عليها؟**`,
      isQuickReplies: [
        'متجر تك زون إلكترونيكس (أجهزة واكسسوارات) 📱',
        'براند أزياء وملابس شبابية كاجوال 👕',
        'متجر عطور ومستحضرات تجميل أصلية 🧴',
        'مستلزمات منزل وديكور عصري 🏠',
      ],
    };
    setMessages([initialGreeting]);
  }, [user]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      processAgentResponse(text, step);
    }, 700);
  };

  const processAgentResponse = (userAnswer: string, currentStep: number) => {
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (currentStep === 1) {
      // Extract Store Name & Niche
      let detectedName = userAnswer;
      let detectedCategory = 'إلكترونيات واكسسوارات';

      if (userAnswer.includes('أزياء') || userAnswer.includes('ملابس')) {
        detectedCategory = 'أزياء وملابس كاجوال';
      } else if (userAnswer.includes('عطور') || userAnswer.includes('تجميل')) {
        detectedCategory = 'عطور ومستحضرات تجميل';
      } else if (userAnswer.includes('منزل') || userAnswer.includes('ديكور')) {
        detectedCategory = 'مستلزمات منزل وديكور';
      }

      // Clean store name
      const cleanName = userAnswer
        .replace(/متجر|براند|شركة|للـ/g, '')
        .split('(')[0]
        .replace(/[📱👕🧴🏠]/g, '')
        .trim();

      const finalName = cleanName || 'متجر النخبة';
      setStoreData((prev) => ({
        ...prev,
        storeName: finalName,
        category: detectedCategory,
      }));

      const reply: Message = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        timestamp: nowTime,
        text: `اسم ممتاز ومميز جداً: **"${finalName}"** (${detectedCategory})! 👏\n\nندخل على الخطوة التانية الخاصة بالتوصيل:\n**حابب تشحن وتوصل لفين؟ وهل نعتمد شحن بوسطة (Bosta) لجميع محافظات جمهورية مصر العربية مع التوصيل السريع خلال 24-48 ساعة؟**`,
        isQuickReplies: [
          'جميع محافظات مصر عبر بوسطة (24-48 ساعة) 🚚',
          'القاهرة والجيزة والإسكندرية فقط',
          'تسليم فوري داخل القاهرة الكبرى ⚡',
        ],
      };

      setMessages((prev) => [...prev, reply]);
      setStep(2);
      setIsTyping(false);
    } else if (currentStep === 2) {
      setStoreData((prev) => ({
        ...prev,
        shippingScope: userAnswer,
      }));

      const reply: Message = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        timestamp: nowTime,
        text: `تمام يا سيدي، تم تسجيل سياسة الشحن اللوجستي بنجاح! 📦\n\nنيجي بقى لأهم خطوة: **طرق الدفع اللي زباينك هيشتروا بيها.**\nإيه بوابات الدفع اللي حابب نفعلها في متجرك؟\n(عندنا دعم كامل ومباشر لـ Paymob كروت وميزة، تحويل InstaPay فوري، كود فوري Fawry، والدفع عند الاستلام COD).`,
        isQuickReplies: [
          'فعل جميع الطرق (Paymob + InstaPay + فوري + دفع عند الاستلام) 💳',
          'Paymob (فيزا وميزة) و InstaPay اللحظي فقط',
          'الدفع عند الاستلام (COD) و InstaPay',
        ],
      };

      setMessages((prev) => [...prev, reply]);
      setStep(3);
      setIsTyping(false);
    } else if (currentStep === 3) {
      const gateways = userAnswer.includes('فعل جميع الطرق')
        ? ['Paymob (فيزا/ميزة)', 'InstaPay (تحويل فوري)', 'فوري', 'الدفع عند الاستلام (COD)']
        : userAnswer.includes('فقط')
        ? ['Paymob (فيزا وميزة)', 'InstaPay (تحويل فوري)']
        : ['الدفع عند الاستلام (COD)', 'InstaPay (تحويل فوري)'];

      setStoreData((prev) => ({
        ...prev,
        paymentGateways: gateways,
      }));

      const reply: Message = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        timestamp: nowTime,
        text: `عظيم جداً! 💳 كده بوابات الدفع جاهزة ومربوطة.\n\nآخر تفصيلة سريعة خاصة بمظهر وهوية المتجر:\n**تحب متجرك يكون بالوضع الليلي الفخم (Dark Mode) ولا الوضع النهاري الهادي (Light Mode)؟ ولونك المفضل للواجهة إيه؟**`,
        isQuickReplies: [
          'وضع ليلي (Dark Mode) مع أزرق سماوي فخم 🌙',
          'وضع نهاري (Light Mode) مع لون بنفسجي عصري ☀️',
          'وضع ليلي (Dark Mode) مع لون زمردي أخضر 🟢',
        ],
      };

      setMessages((prev) => [...prev, reply]);
      setStep(4);
      setIsTyping(false);
    } else if (currentStep === 4) {
      const isDark = userAnswer.includes('ليلي') || userAnswer.includes('Dark');
      const primaryColor = userAnswer.includes('زمردي') ? '#10b981' : userAnswer.includes('بنفسجي') ? '#6366f1' : '#0ea5e9';

      const updated = {
        ...storeData,
        themeMode: isDark ? ('dark' as const) : ('light' as const),
        primaryColor,
      };
      setStoreData(updated);

      const reply: Message = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        timestamp: nowTime,
        text: `تسلم يا غالي! 🎨 جمعت منك كل البيانات المطلوبة وبنيت لك مواصفات المتجر بدقة.\n\nراجع تفاصيل متجرك في البطاقة أدناه، ودوس على **"إنشاء وإطلاق المتجر الآن"** عشان أبدأ فوراً في توليد قاعدة البيانات وبوابات الدفع والشحن وأسلمك الرابطين:`,
        showPreviewCard: true,
      };

      setMessages((prev) => [...prev, reply]);
      setStep(5);
      setIsTyping(false);
    } else {
      // General follow up if user chats after
      const reply: Message = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        timestamp: nowTime,
        text: `أنا جاهز في أي وقت يا باشا لأي استفسار أو لتعديل أي إعداد في متجرك!`,
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }
  };

  // Human-In-The-Loop Approval & Provisioning Trigger
  const handleConfirmStoreLaunch = () => {
    setIsProvisioning(true);
    setProvisionProgress(15);

    const slug = (storeData.storeName || 'techzone-store')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-') || 'store-online';

    // Simulate multi-tier provisioning stages
    const timer1 = setTimeout(() => {
      setProvisionProgress(45);
    }, 500);

    const timer2 = setTimeout(() => {
      setProvisionProgress(75);
    }, 1000);

    const timer3 = setTimeout(() => {
      setProvisionProgress(100);

      const newStore: ProvisionedStore = {
        id: `tenant_${Date.now()}`,
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        name: storeData.storeName || 'متجري الجديد',
        category: storeData.category,
        currency: 'EGP',
        themeMode: storeData.themeMode,
        createdAt: new Date().toISOString(),
        adminUrl: `http://localhost:5173/admin/${slug}`,
        storefrontUrl: `http://localhost:5173/store/${slug}`,
      };

      setIsProvisioning(false);
      onStoreCreated(newStore);

      const successMsg: Message = {
        id: `agent_complete_${Date.now()}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        text: `ألف ألف مبروك يا فندم! 🎉 متجرك الإلكتروني تم إنشاؤه وتفعيله بنجاح بنسبة 100% وعزل كامل للبيانات (PostgreSQL RLS Isolated Tenant).\n\nزي ما وعدتك.. دي الروابط الخاصة بمتجرك: الأول لإدارة المتجر والـ ERP، والتاني المتجر الحي اللي زباينك هيشتروا منه:`,
        provisionedStore: newStore,
      };

      setMessages((prev) => [...prev, successMsg]);
    }, 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const copyToClipboard = (text: string, type: 'admin' | 'storefront') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title="الرجوع لمركز الخدمات"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>وكيل تيك زون لتأسيس المتاجر (Store Builder Agent)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  بالمصري 🇪🇬
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                محادثة تفاعلية لتوليد المتجر وبوابات الدفع والشحن
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={toggleMode}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={theme.mode === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
          >
            {theme.mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <span className="hidden sm:inline-block text-[11px] text-slate-500">التاجر:</span>
          <span className="font-semibold text-sky-600 dark:text-sky-400 text-xs">{user.name}</span>
        </div>
      </header>

      {/* Main Chat Canvas */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-start' : 'items-end'
              } space-y-1`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                <span>{msg.sender === 'user' ? user.name : 'وكيل تيك زون الذكي'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line font-medium">{msg.text}</div>

                {/* HITL Store Preview Card if requested */}
                {msg.showPreviewCard && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {storeData.storeName || 'متجري الجديد'}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          {storeData.currency}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block">مجال المتجر:</span>
                          <span className="font-semibold">{storeData.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">نطاق الشحن:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {storeData.shippingScope}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">السمة والمظهر:</span>
                          <span className="font-semibold">
                            {storeData.themeMode === 'dark' ? 'الوضع الليلي (Dark)' : 'الوضع النهاري (Light)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">بوابات الدفع المفعلة:</span>
                          <span className="font-semibold">Paymob / InstaPay / Fawry</span>
                        </div>
                      </div>
                    </div>

                    {/* Launch Trigger Button */}
                    <button
                      onClick={handleConfirmStoreLaunch}
                      disabled={isProvisioning}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    >
                      {isProvisioning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري إنشاء قاعدة البيانات وتفعيل المتجر ({provisionProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>إنشاء وإطلاق المتجر الآن (توليد الرابطين) 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Provisioned Result with THE TWO DISTINCT LINKS */}
                {msg.provisionedStore && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
                    <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>تم تجهيز المتجر بنجاح! إليك الرابطان الأساسيان:</span>
                      </div>

                      {/* Link 1: Store Management & ERP Link */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                            <Sliders className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>1. رابط إدارة المتجر والتحكم (Admin Dashboard):</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                            خاص بك كتاجر
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          لوحة التحكم لإدارة المنتجات، متابعة المخزون، ضبط الأسعار، واستعراض سجل التدقيق.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={msg.provisionedStore.adminUrl}
                            className="flex-1 font-mono text-[11px] p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 select-all"
                          />
                          <button
                            onClick={() =>
                              copyToClipboard(msg.provisionedStore!.adminUrl, 'admin')
                            }
                            className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors flex items-center gap-1"
                            title="نسخ الرابط"
                          >
                            {copiedLink === 'admin' ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span className="text-[10px]">
                              {copiedLink === 'admin' ? 'تم النسخ' : 'نسخ'}
                            </span>
                          </button>
                          <button
                            onClick={() => onOpenStoreAdmin(msg.provisionedStore!)}
                            className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <span>فتح لوحة الإدارة</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Link 2: Customer Storefront Link */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                            <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>2. رابط متجر العملاء المباشر (Customer Storefront):</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            مخصص لجمهورك وزبائنك
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          الرابط الحي الذي تشاركه مع عملائك لتصفح الكتالوج، وإتمام الدفع عبر Paymob و InstaPay والشحن عبر بوسطة.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={msg.provisionedStore.storefrontUrl}
                            className="flex-1 font-mono text-[11px] p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 select-all"
                          />
                          <button
                            onClick={() =>
                              copyToClipboard(msg.provisionedStore!.storefrontUrl, 'storefront')
                            }
                            className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors flex items-center gap-1"
                            title="نسخ الرابط"
                          >
                            {copiedLink === 'storefront' ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span className="text-[10px]">
                              {copiedLink === 'storefront' ? 'تم النسخ' : 'نسخ'}
                            </span>
                          </button>
                          <button
                            onClick={() => onOpenStorefront(msg.provisionedStore!)}
                            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <span>فتح متجر الزبائن</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Reply Chips */}
              {msg.isQuickReplies && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 max-w-[85%]">
                  {msg.isQuickReplies.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-950/60 text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-800 transition-colors shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col items-end space-y-1">
              <div className="text-[10px] text-slate-400 px-1">وكيل تيك زون يكتب...</div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-xs px-4 py-2.5 shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"></span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 shadow-xs focus-within:border-sky-500 transition-colors"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="اكتب إجابتك هنا بالمصري (مثال: متجر تك زون للملابس والإلكترونيات)..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-40 disabled:hover:bg-sky-600"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
