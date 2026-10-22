// apps/web/src/pages/dashboard/ChatCommandCenter.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  Plus,
  MessageSquare,
  Package,
  ShoppingCart,
  Tag,
  TrendingUp,
  Palette,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { GenUiRegistry } from '../../components/chat/GenUiRegistry';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cardType?: string;
  payload?: any;
  timestamp: string;
}

interface ChatCommandCenterProps {
  tenantId?: string;
  merchantName?: string;
  storeName?: string;
}

export const ChatCommandCenter: React.FC<ChatCommandCenterProps> = ({
  tenantId,
  merchantName,
  storeName,
}) => {
  const activeTid = tenantId || 'tenant-moustafa-tech';
  const displayName = merchantName || 'يا فندم';
  const displayStore = storeName ? `متجر "${storeName}"` : 'متجرك الخاص';

  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/v1/agent/sessions?tenant_id=${activeTid}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0) {
          setCurrentSessionId(data[0].id);
        } else {
          const freshId = `sess_${activeTid.replace(/[^a-zA-Z0-9]/g, '')}_main`;
          setCurrentSessionId(freshId);
        }
      }
    } catch (_) {}
  };

  const loadSessionMessages = async (sessId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/v1/agent/sessions/${sessId}?tenant_id=${activeTid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              cardType: m.cardType,
              payload: m.payload,
              timestamp: m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
            }))
          );
          return;
        }
      }
    } catch (_) {}

    // Initial greeting personalized strictly to this merchant and store
    setMessages([
      {
        id: `msg_init_${activeTid}`,
        role: 'assistant',
        content: `أهلاً بك يا ${displayName} في مركز قيادة ${displayStore}! 🇪🇬\n\nأنا وكيلك الذكي لإدارة متجرك والـ ERP بالكامل بالمحادثة الحقيقية.\nتقدر تطلب مني دلوقتي:\n• "أضف منتج ماوس لاسلكي بسعر 450 جنيه"\n• "ايه هي الطلبات الجديدة؟"\n• "افحص نواقص المخزون"\n• "انشئ كوبون خصم SALE20 بنسبة 20%"\n• "اعرض لي ملخص الإيرادات والأرباح"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  useEffect(() => {
    setSessions([]);
    setMessages([]);
    setCurrentSessionId('');
    loadSessions();
  }, [tenantId]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleStartNewSession = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/v1/agent/sessions?tenant_id=${activeTid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'محادثة جديدة', tenant_id: activeTid }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.id);
        await loadSessions();
      }
    } catch (_) {}
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const res = await fetch('http://127.0.0.1:8001/api/v1/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: currentSessionId,
          tenant_id: activeTid,
        }),
      });

      if (!res.ok) throw new Error('فشل تنفيذ أمر الوكيل');
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        cardType: data.cardType,
        payload: data.payload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      await loadSessions();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'assistant',
          content: 'عذراً، حدث خطأ أثناء معالجة الأمر. يرجى المحاولة مرة أخرى.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div dir="rtl" className="h-full flex flex-col font-sans text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>وكيل تيك زون الذكي (LangGraph Autonomous Agent)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Live AI
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              تحكم كامل في الكتالوج، المخزون، الطلبات، وبوابات الدفع عبر المحادثة
            </p>
          </div>
        </div>

        <button
          onClick={handleStartNewSession}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-sky-500" />
          <span>محادثة جديدة</span>
        </button>
      </div>

      {/* Main Container with Sidebar + Chat */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sessions Sidebar */}
        <div className="hidden md:flex w-60 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex-col shrink-0 min-h-0">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            سجل المحادثات السابقة
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-[11px] leading-relaxed">
                لا توجد محادثات سابقة لهذا المتجر.
              </div>
            ) : (
              sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`w-full text-right p-2.5 rounded-xl text-xs transition-colors flex items-center gap-2 truncate ${
                  currentSessionId === s.id
                    ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                <span className="truncate">{s.title || 'محادثة'}</span>
              </button>
            ))) }
          </div>
        </div>

        {/* Chat Stream Area */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-start' : 'items-end'
                } space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                  <span>{msg.role === 'user' ? 'التاجر' : 'وكيل تيك زون'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-medium">{msg.content}</div>

                  {/* Render Legacy GenUI cards if any */}
                  {msg.cardType &&
                    ['sales_forecast', 'inventory_alerts', 'bulk_price_preview'].includes(
                      msg.cardType
                    ) && (
                      <div className="mt-3">
                        <GenUiRegistry
                          cardType={msg.cardType}
                          payload={msg.payload || {}}
                          onApprove={() => {}}
                          onCancel={() => {}}
                        />
                      </div>
                    )}

                  {/* Render Native Tool Result Cards */}
                  {msg.cardType === 'product_card' && msg.payload?.product && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-sky-500" />
                        <span>تمت إضافة المنتج للكتالوج:</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>{msg.payload.product.name}</span>
                        <span className="font-bold text-sky-600">
                          {msg.payload.product.price?.toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>
                  )}

                  {msg.cardType === 'orders_card' && msg.payload?.orders && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-sky-500" />
                        <span>أحدث طلبات المتجر ({msg.payload.count}):</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {msg.payload.orders.slice(0, 4).map((o: any) => (
                          <div
                            key={o.id}
                            className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          >
                            <span>{o.id}</span>
                            <span className="font-bold">{o.total?.toLocaleString()} ج.م</span>
                            <span className="text-[10px] text-sky-600">{o.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.cardType === 'inventory_card' && msg.payload?.alerts && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
                      <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>نواقص المخزون المرصودة:</span>
                      </div>
                      {msg.payload.alerts.slice(0, 3).map((a: any, i: number) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span>{a.productName}</span>
                          <span className="font-mono text-rose-600 font-bold">
                            {a.currentStock} قطع متبقية
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.cardType === 'coupon_card' && msg.payload?.coupon && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <Tag className="w-3.5 h-3.5" />
                        <span>الكوبون النشط:</span>
                        <span className="font-mono">{msg.payload.coupon.code}</span>
                      </div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        خصم {msg.payload.coupon.value}%
                      </span>
                    </div>
                  )}

                  {msg.cardType === 'analytics_card' && msg.payload?.kpis && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                        <span>مؤشرات أداء المتجر:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div>الإيرادات: {msg.payload.kpis.totalRevenue?.toLocaleString()} ج.م</div>
                        <div>الطلبات: {msg.payload.kpis.totalOrders}</div>
                        <div>العملاء: {msg.payload.kpis.totalCustomers}</div>
                        <div>متوسط السلة: {msg.payload.kpis.averageOrderValue} ج.م</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex flex-col items-end space-y-1">
                <div className="text-[10px] text-slate-400 px-1">الوكيل يفكر وينفذ في قاعدة البيانات...</div>
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

          {/* Input Box */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 shadow-2xs focus-within:border-sky-500 transition-colors"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اطلب أي أمر بالمصري (مثال: أضف سماعة أنكر بـ 950 جنيه، أو اعرض الطلبات)..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
