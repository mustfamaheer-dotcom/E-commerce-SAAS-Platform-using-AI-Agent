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
import { API_BASE_URL } from '../../services/api';
import { copyToClipboard as safeCopyToClipboard } from '../../utils/clipboard';

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

export interface ExtractedStoreDetails {
  storeName: string;
  category: string;
  nicheDescription?: string;
  themeMode?: 'dark' | 'light';
}

export function extractArabicStoreDetails(rawInput: string): ExtractedStoreDetails {
  const cleanInput = rawInput.trim();

  // 1. Niche & Category Extraction
  let detectedCategory = 'إلكترونيات واكسسوارات';
  let nicheDescription: string | undefined = undefined;

  // Look for explicit niche phrases
  const nicheRegex =
    /(?:و\s*تكون\s*في\s*مجال|و\s*المجال|والمجال|في\s*مجال|ومجال|مجال|المجال|و\s*هيكون\s*في\s*مجال|لبيع|و\s*بيع|بيع|متخصص\s*(?:في|بـ)|نشاطه|نشاط|بالمجال)\s*[:=]?\s*([^.,،\n()]+)/i;
  const nicheMatch = cleanInput.match(nicheRegex);

  if (nicheMatch && nicheMatch[1]) {
    let rawNiche = nicheMatch[1].trim();
    // Strip trailing modifiers
    rawNiche = rawNiche.split(
      /\s+(?:بالوضع|وستايل|ستايل|بالجنيه|وبالجنيه|و\s*ستايل|شحن|بوسطة)\b/i
    )[0].trim();
    rawNiche = rawNiche.replace(/^(?:هو|هي|عبارة\s+عن|أنه|انه)\s+/i, '').trim();
    if (rawNiche.length > 1) {
      nicheDescription = rawNiche;
    }
  }

  const lower = cleanInput.toLowerCase();
  if (
    /موبايل|لابتوب|هاتف|هواتف|تلفون|كمبيوتر|إلكترون|الكترون|أجهزة|اجهزة|سماعات|phone|laptop|electronics/.test(
      lower
    )
  ) {
    detectedCategory = 'إلكترونيات وهواتف ذكية ولابتوبات';
  } else if (/أزياء|ملابس|كاجوال|فاشون|أحذية|احذية|fashion|clothes/.test(lower)) {
    detectedCategory = 'أزياء وملابس كاجوال';
  } else if (/عطور|تجميل|ميك اب|ميكاب|perfume|beauty|بخور/.test(lower)) {
    detectedCategory = 'عطور ومستحضرات تجميل';
  } else if (/منزل|ديكور|أثاث|اثاث|مفروشات|home|decor/.test(lower)) {
    detectedCategory = 'مستلزمات منزل وديكور';
  } else if (/أكل|طعام|مطعم|حلويات|سوبرماركت|أغذية|food/.test(lower)) {
    detectedCategory = 'أغذية ومأكولات سريعة';
  } else if (/رياضة|جيم|مكملات|fitness|gym/.test(lower)) {
    detectedCategory = 'مستلزمات رياضية ولياقة';
  } else if (nicheDescription) {
    detectedCategory = nicheDescription;
  }

  // 2. Store Name Extraction
  let nameCandidate = cleanInput;

  // Check for explicit naming keywords first:
  const explicitNameMatch = cleanInput.match(
    /(?:اسم\s+المتجر(?:\s+بتاعي)?|اسم\s+المحل(?:\s+بتاعي)?|اسم\s+البراند(?:\s+بتاعي)?|الاسم|اسمه|باسم|سميه|نسميه|called|named)\s*[:=]?\s*([A-Za-z0-9\u0600-\u06FF\s_&-]+)/i
  );

  if (explicitNameMatch && explicitNameMatch[1]) {
    let captured = explicitNameMatch[1].trim();
    const cutMatch = captured.split(
      /\s+(?:و\s*تكون\s*في\s*مجال|و\s*المجال|والمجال|في\s*مجال|ومجال|مجال|المجال|لبيع|و\s*بيع|بيع|متخصص\s*(?:في|بـ)|نشاطه|نشاط|بالمجال|بالوضع|وستايل|ستايل|بالجنيه|وبالجنيه|بالريال|وبالريال|بالدولار|وبالدولار|و\s*تكون)(?:\s+|$)/i
    )[0];
    const withoutParens = (cutMatch || captured).split(/[()（）]/)[0].trim();
    if (withoutParens) {
      nameCandidate = withoutParens;
    }
  } else {
    // If no explicit naming phrase, split off any domain/niche suffix
    const sepIndex = nameCandidate.search(
      /\s+(?:و\s*تكون\s*في\s*مجال|و\s*المجال|والمجال|في\s*مجال|ومجال|مجال|المجال|لبيع|و\s*بيع|بيع|متخصص\s*(?:في|بـ)|نشاطه|نشاط|بالمجال|بالوضع|وستايل|ستايل|بالجنيه|وبالجنيه|بالريال|وبالريال|بالدولار|وبالدولار)(?:\s+|$)/i
    );
    if (sepIndex !== -1) {
      nameCandidate = nameCandidate.substring(0, sepIndex);
    }

    nameCandidate = nameCandidate.split(/[()（）]/)[0];

    if (nameCandidate.includes(' - ')) {
      nameCandidate = nameCandidate.split(' - ')[0];
    } else if (nameCandidate.includes(' – ')) {
      nameCandidate = nameCandidate.split(' – ')[0];
    }

    const prefixes = [
      /^(?:عايز|عاوز|نفسي|حابب|أريد|اريد|ودّي|ودي)\s+(?:أعمل|اعمل|أنشئ|انشئ|أفتح|افتح|اخلي|أخلي|اسمي|أسمي|أسس|اسس)\s*/i,
      /^(?:أعمل|اعمل|أنشئ|انشئ|أفتح|افتح|أخلي|اخلي|أسمي|اسمي|سميه|نسميه|سمي|خليه|اجعله)\s*/i,
      /^(?:اسم\s+المتجر(?:\s+بتاعي)?|اسم\s+المحل(?:\s+بتاعي)?|اسم\s+البراند(?:\s+بتاعي)?|الاسم|اسمه|باسم|اسم)\s*[:=]?\s*/i,
      /^(?:متجر|براند|محل|شركة|ستور|store|brand)\s+/i,
    ];

    let cleaned = nameCandidate.trim();
    let changed = true;
    while (changed) {
      changed = false;
      for (const pat of prefixes) {
        if (pat.test(cleaned)) {
          cleaned = cleaned.replace(pat, '').trim();
          changed = true;
        }
      }
    }
    nameCandidate = cleaned;
  }

  // Strip trailing filler words
  nameCandidate = nameCandidate.replace(/\s+(?:بتاعي|لي)$/i, '').trim();
  // Strip quotes
  nameCandidate = nameCandidate.replace(/^[«"''“”]+|[»"''“”]+$/g, '').trim();
  // Strip emojis
  nameCandidate = nameCandidate
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ''
    )
    .trim();

  if (nameCandidate.startsWith('متجر ')) {
    nameCandidate = nameCandidate.replace(/^متجر\s+/, '').trim();
  }

  const finalName = nameCandidate || 'متجر النخبة';

  let themeMode: 'dark' | 'light' | undefined = undefined;
  if (/dark|ليلي|داكن|الوضع الليلي/.test(lower)) {
    themeMode = 'dark';
  } else if (/light|نهاري|فاتح|الوضع النهاري/.test(lower)) {
    themeMode = 'light';
  }

  return {
    storeName: finalName,
    category: detectedCategory,
    nicheDescription,
    themeMode,
  };
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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/stores/onboarding/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          step,
          store_data: storeData,
          history: [...messages, userMsg].map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          // Merge updated fields from LLM extraction
          if (data.updated_fields && Object.keys(data.updated_fields).length > 0) {
            setStoreData((prev) => ({
              ...prev,
              ...data.updated_fields,
            }));
          }

          if (data.step) {
            setStep(data.step);
          }

          const agentReply: Message = {
            id: `agent_${Date.now()}`,
            sender: 'agent',
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            text: data.reply,
            isQuickReplies: data.quick_replies && data.quick_replies.length > 0 ? data.quick_replies : undefined,
            showPreviewCard: data.show_preview || data.step === 5,
          };

          setMessages((prev) => [...prev, agentReply]);
          setIsTyping(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Live onboarding agent failed, using smart fallback:', err);
    }

    // Fallback to local rule engine if network/API unavailable
    setTimeout(() => {
      processAgentResponse(text, step);
    }, 500);
  };

  const processAgentResponse = (userAnswer: string, currentStep: number) => {
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Allow merchants to adjust store name if they want at any point during onboarding
    const renameMatch = userAnswer.match(
      /^(?:غير|عدل|بدل|صلح|خليه|سميه|اسم\s+المتجر)\s+(?:الاسم|اسم\s+المتجر|اسمه)?\s*[:=]?\s*(.+)/i
    );
    if (renameMatch && renameMatch[1] && currentStep > 1 && currentStep < 5) {
      const newName = renameMatch[1].replace(/["'«»“”]/g, '').trim();
      if (newName) {
        setStoreData((prev) => ({ ...prev, storeName: newName }));
        const renameReply: Message = {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          timestamp: nowTime,
          text: `تمام جداً يا فندم! 👍 تم تحديث اسم المتجر ليكون: **"${newName}"**.\n\nيلا بينا نكمل باقي خطوات التأسيس.`,
        };
        setMessages((prev) => [...prev, renameReply]);
        setIsTyping(false);
        return;
      }
    }

    if (currentStep === 1) {
      const extracted = extractArabicStoreDetails(userAnswer);

      const effectiveCategory = extracted.nicheDescription
        ? `${extracted.nicheDescription} (${extracted.category})`
        : extracted.category;

      setStoreData((prev) => ({
        ...prev,
        storeName: extracted.storeName,
        category: effectiveCategory,
        themeMode: extracted.themeMode || prev.themeMode,
      }));

      const categorySnippet = extracted.nicheDescription
        ? `في مجال **"${extracted.nicheDescription}"**`
        : `(${extracted.category})`;

      const reply: Message = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        timestamp: nowTime,
        text: `اسم ممتاز ومميز جداً: **"${extracted.storeName}"** ${categorySnippet}! 👏\n\nندخل على الخطوة التانية الخاصة بالشحن والتوصيل:\n**حابب تشحن وتوصل لفين؟ وهل نعتمد شحن بوسطة (Bosta) لجميع محافظات جمهورية مصر العربية مع التوصيل السريع خلال 24-48 ساعة؟**`,
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

    const rawEnglish = (storeData.storeName || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
    const slug =
      rawEnglish && rawEnglish.length >= 2
        ? rawEnglish
        : `store-${Math.random().toString(36).substring(2, 8)}`;

    // Simulate multi-tier provisioning stages
    const timer1 = setTimeout(() => {
      setProvisionProgress(45);
    }, 500);

    const timer2 = setTimeout(() => {
      setProvisionProgress(75);
    }, 1000);

    const timer3 = setTimeout(async () => {
      setProvisionProgress(100);

      let createdStoreObj: ProvisionedStore = {
        id: 'tenant_' + Date.now(),
        slug: slug + '-' + Math.floor(100 + Math.random() * 900),
        name: storeData.storeName || 'متجري الجديد',
        category: storeData.category,
        currency: 'EGP',
        themeMode: storeData.themeMode,
        createdAt: new Date().toISOString(),
        adminUrl: 'http://localhost:5173/admin/' + slug,
        storefrontUrl: 'http://localhost:5173/store/' + slug,
      };

      try {
        const res = await fetch(`${API_BASE_URL}/stores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: storeData.storeName || 'متجري الجديد',
            category: storeData.category,
            currency: 'EGP',
            owner_name: user.name,
            owner_email: user.email,
            phone: user.phone,
            theme_mode: storeData.themeMode,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.store) {
            createdStoreObj = {
              ...createdStoreObj,
              id: json.store.id,
              slug: json.store.slug,
              name: json.store.name,
              adminUrl: 'http://localhost:5173' + json.store.adminUrl,
              storefrontUrl: 'http://localhost:5173' + json.store.storefrontUrl,
            };
          }
        }
      } catch (err) {
        console.warn('Failed to persist store:', err);
      }

      setIsProvisioning(false);
      onStoreCreated(createdStoreObj);

      const successMsg: Message = {
        id: 'agent_complete_' + Date.now(),
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        text: `ألف ألف مبروك يا فندم! 🎉 متجرك الإلكتروني (${createdStoreObj.name}) تم إنشاؤه وتفعيله بنجاح بنسبة 100% في قاعدة البيانات وعزل كامل للبيانات.\n\nزي ما وعدتك.. دي الروابط الخاصة بمتجرك: الأول لإدارة المتجر والـ ERP (لوحة تحكم فارغة جاهزة لإضافة منتجاتك)، والتاني المتجر الحي اللي زباينك هيشتروا منه:`,
        provisionedStore: createdStoreObj,
      };

      setMessages((prev) => [...prev, successMsg]);
    }, 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleCopyLink = async (text: string, type: 'admin' | 'storefront') => {
    await safeCopyToClipboard(text);
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
                              handleCopyLink(msg.provisionedStore!.adminUrl, 'admin')
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
                              handleCopyLink(msg.provisionedStore!.storefrontUrl, 'storefront')
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
