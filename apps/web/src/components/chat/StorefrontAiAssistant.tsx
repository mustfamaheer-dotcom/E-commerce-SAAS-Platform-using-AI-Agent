// apps/web/src/components/chat/StorefrontAiAssistant.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Sparkles,
  Bot,
  User,
  X,
  Send,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Truck,
  Package,
} from 'lucide-react';
import { RootState } from '../../store';
import { addToCart } from '../../store/cartSlice';
import { GenUiRegistry } from './GenUiRegistry';
import { API_BASE_URL } from '../../services/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cardType?: string;
  payload?: any;
  citations?: string[];
  actions?: Array<{ label: string; action: string; params: any }>;
  followUps?: string[];
  requiresHumanSupport?: boolean;
  warnings?: string[];
  timestamp: string;
  feedback?: 'like' | 'dislike' | null;
}

interface StorefrontAiAssistantProps {
  tenantId?: string;
  storeName?: string;
  activeSubView?: 'home' | 'cart' | 'checkout';
  onNavigateSubView?: (view: 'home' | 'cart' | 'checkout') => void;
}

export const StorefrontAiAssistant: React.FC<StorefrontAiAssistantProps> = ({
  tenantId = 'tenant-moustafa-tech',
  storeName = 'المتجر الإلكتروني',
  activeSubView = 'home',
  onNavigateSubView,
}) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `sess_cust_${Math.random().toString(36).substring(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial Welcome Message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `أهلاً بك في متجر **${storeName}**!\nأنا مساعدك الذكي للتسوق. أقدر أساعدك في العثور على أفضل الأجهزة، معرفة أسعار وتوافر المنتجات، تتبع شحنتك، أو توضيح سياسة الشحن والاسترجاع. بتدور على إيه النهاردة؟`,
      followUps: [
        'عايز سماعات ايربودز أصلية',
        'كام مصاريف ومدة الشحن؟',
        'إيه سياسة الاسترجاع والضمان؟',
        'هل فيه كود خصم متاح؟',
      ],
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Contextual suggested chips based on current storefront page
  const contextualChips = React.useMemo(() => {
    if (activeSubView === 'cart') {
      return [
        'هل كود الخصم GOLD20 فعال؟',
        'كام تكلفة الشحن للقاهرة والمحافظات؟',
        'ما هي طرق الدفع المتاحة بالمتجر؟',
      ];
    }
    if (activeSubView === 'checkout') {
      return [
        'تتبع طلبي برقم الشحنة',
        'مدة توصيل شركة بوسطة',
        'ضمان الاسترجاع خلال 14 يوماً',
      ];
    }
    return [
      'عندك سماعات ايربودز برو وبكام؟',
      'عايز شاحن أنكر 65 واط سريع',
      'ما هي سياسة الاسترجاع والضمان؟',
      'كام مدة وتكلفة الشحن؟',
    ];
  }, [activeSubView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    const userMsgId = `usr_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_BASE_URL}/agent/orchestrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          tenant_id: tenantId,
          role: 'customer',
          cart_items_count: totalCartCount,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.reply_text || data.response || 'تم استلام طلبك بنجاح.',
        cardType: data.card_type,
        payload: data.gen_ui_payload,
        citations: data.citations || [],
        actions: data.actions || [],
        followUps: data.follow_up_suggestions || [],
        requiresHumanSupport: data.requires_human_support || false,
        warnings: data.warnings || [],
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content:
          'عذراً يا فندم، حدث تعذر مؤقت في الاتصال بالخادم. يرجى المحاولة مرة أخرى أو التواصل المباشر مع خدمة العملاء.',
        requiresHumanSupport: true,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; action: string; params: any }) => {
    if (action.action === 'add_to_cart' && action.params?.product_id) {
      dispatch(
        addToCart({
          id: action.params.product_id,
          name: action.params.name || 'منتج إلكتروني',
          price: action.params.price || 0,
          quantity: action.params.quantity || 1,
        })
      );
      if (onNavigateSubView) {
        onNavigateSubView('cart');
      }
    } else if (action.action === 'track_order') {
      handleSendMessage(`تتبع طلبي رقم ${action.params?.order_id || ''}`);
    } else if (action.action === 'escalate_support') {
      handleSendMessage('أريد التحدث مع موظف خدمة العملاء');
    }
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: type } : m))
    );
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg_welcome_reset',
        role: 'assistant',
        content: `تم بدء محادثة جديدة مع متجر **${storeName}**! كيف يمكنني مساعدتك؟`,
        followUps: contextualChips,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div dir="rtl" className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-50 font-sans select-none max-w-[calc(100vw-1.5rem)]">
      {/* 1. Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-2xl hover:scale-105 backdrop-blur-2xl font-bold text-xs transition-all duration-300 active:scale-95 focus:outline-none"
          aria-label="فتح المساعد الذكي للتسوق"
          aria-expanded={isOpen}
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </div>
          <span className="hidden sm:inline-block tracking-wide font-extrabold">مساعد التسوق الذكي</span>
          <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-spin-slow" />
        </button>
      )}

      {/* 2. Chat Window Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="chat-assistant-title"
          className="w-[calc(100vw-1.5rem)] sm:w-[420px] h-[540px] sm:h-[580px] max-h-[85vh] sm:max-h-[80vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 id="chat-assistant-title" className="font-black text-xs leading-tight">
                  مساعد {storeName} الذكي
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>متصل • بالذكاء الاصطناعي الرسمي</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                title="بدء محادثة جديدة"
                aria-label="مسح المحادثة وبدء محادثة جديدة"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                title="تصغير المحادثة"
                aria-label="إغلاق المحادثة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Badge */}
          <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate">
              {activeSubView === 'home' && 'تتصفح: كتالوج المنتجات'}
              {activeSubView === 'cart' && `تتصفح: سلة المشتريات (${totalCartCount} منتج)`}
              {activeSubView === 'checkout' && 'تتصفح: صفحة الدفع والشحن'}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>مضمون بقانون 181/2018</span>
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 bg-slate-50/50 dark:bg-slate-950/40"
            aria-live="polite"
          >
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} space-y-1`}
                >
                  <div className="flex items-end gap-1.5 max-w-[90%]">
                    {isAssistant && (
                      <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mb-1">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isAssistant
                          ? 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs rounded-br-xs'
                          : 'bg-sky-600 text-white shadow-2xs rounded-bl-xs font-medium'
                      }`}
                    >
                      {/* Formatted Text Message */}
                      <div className="whitespace-pre-wrap break-words space-y-1">
                        {m.content.split('\n').map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line ? <div>{line}</div> : <div className="h-1.5" />}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Warnings if any */}
                      {m.warnings && m.warnings.length > 0 && (
                        <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[10px] text-amber-800 dark:text-amber-300 space-y-0.5">
                          {m.warnings.map((w, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* GenUI Card Rendering */}
                      {m.cardType && m.payload && (
                        <div className="mt-2">
                          <GenUiRegistry
                            cardType={m.cardType}
                            payload={m.payload}
                            onSendMessage={handleSendMessage}
                          />
                        </div>
                      )}

                      {/* Citations */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                          <span>المصادر:</span>
                          {m.citations.map((c, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {m.actions && m.actions.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {m.actions.map((act, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleActionClick(act)}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 text-[11px] font-bold transition-colors"
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Meta & Feedback */}
                  {isAssistant && (
                    <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{m.timestamp}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'like')}
                          className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
                            m.feedback === 'like' ? 'text-sky-600 font-bold' : ''
                          }`}
                          aria-label="إجابة مفيدة"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'dislike')}
                          className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
                            m.feedback === 'dislike' ? 'text-rose-600 font-bold' : ''
                          }`}
                          aria-label="إجابة غير مفيدة"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Follow-up Quick Chips */}
                  {m.followUps && m.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {m.followUps.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 text-slate-700 dark:text-slate-300 text-[10px] font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-95"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 w-fit">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                <span className="font-semibold text-[11px]">مساعد المتجر يراجع قاعدة البيانات...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Chips Bar (when idle) */}
          {!isLoading && messages.length <= 2 && (
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-400 shrink-0 font-bold">مقترحات:</span>
              {contextualChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] whitespace-nowrap hover:border-sky-400 font-medium shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب سؤالك عن المنتجات، الشحن، أو الطلب..."
              disabled={isLoading}
              className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
              aria-label="رسالة إلى مساعد المتجر"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              aria-label="إرسال السؤال"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
