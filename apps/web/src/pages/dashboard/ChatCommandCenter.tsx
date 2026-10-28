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
  Sparkles,
  BarChart2,
  Users,
  Pin,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { GenUiRegistry } from '../../components/chat/GenUiRegistry';
import { useAgentStream } from '../../hooks/useAgentStream';
import { ThinkingBubble } from '../../components/chat/ThinkingBubble';
import { StreamingMessage } from '../../components/chat/StreamingMessage';
import { API_BASE_URL } from '../../services/api';

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
  const activeTid = tenantId || localStorage.getItem('techzone_active_store_id') || '';
  const displayName = merchantName || 'يا فندم';
  const displayStore = storeName ? `متجر "${storeName}"` : 'متجرك الخاص';

  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session management: Pin & Rename
  const [pinnedSessionIds, setPinnedSessionIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`techzone_pinned_sessions_${activeTid}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const togglePinSession = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPinnedSessionIds((prev) => {
      const isPinned = prev.includes(sessionId);
      const updated = isPinned ? prev.filter((id) => id !== sessionId) : [sessionId, ...prev];
      try {
        localStorage.setItem(`techzone_pinned_sessions_${activeTid}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleStartRename = (session: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title || 'محادثة');
  };

  const handleSaveRename = async (sessionId: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    const newTitle = editingTitle.trim();
    try {
      await fetch(`${API_BASE_URL}/agent/sessions/${sessionId}?tenant_id=${activeTid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
      );
    } catch (err) {
      console.error('Failed to rename session:', err);
    } finally {
      setEditingSessionId(null);
    }
  };

  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟')) return;

    try {
      await fetch(`${API_BASE_URL}/agent/sessions/${sessionId}?tenant_id=${activeTid}`, {
        method: 'DELETE',
      });
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== sessionId);
        if (currentSessionId === sessionId) {
          if (remaining.length > 0) {
            setCurrentSessionId(remaining[0].id);
          } else {
            handleStartNewSession();
          }
        }
        return remaining;
      });
      setPinnedSessionIds((prev) => {
        const updated = prev.filter((id) => id !== sessionId);
        try {
          localStorage.setItem(`techzone_pinned_sessions_${activeTid}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Streaming State
  const { isStreaming, thinkingStatus, currentTool, sendStreamMessage } = useAgentStream();
  const [streamingTokens, setStreamingTokens] = useState<string>('');
  const [streamingCardType, setStreamingCardType] = useState<string | null>(null);
  const [streamingCardPayload, setStreamingCardPayload] = useState<any>(null);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/agent/sessions?tenant_id=${activeTid}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data[0].id);
        } else if (!currentSessionId) {
          const freshId = `sess_${activeTid.replace(/[^a-zA-Z0-9]/g, '')}_main`;
          setCurrentSessionId(freshId);
        }
      }
    } catch (_) {}
  };

  const loadSessionMessages = async (sessId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/agent/sessions/${sessId}?tenant_id=${activeTid}`);
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

    setMessages([
      {
        id: `msg_init_${activeTid}`,
        role: 'assistant',
        content: `أهلاً بك يا ${displayName} في مركز قيادة ${displayStore}! \n\nأنا وكيلك الذكي لإدارة متجرك والـ ERP بالكامل بالمحادثة الحقيقية وبث الردود الحية.\nجرب تطلب مني دلوقتي:\n• "قولي الارباح في الداشبورد"\n• "ضيف منتج جديد"\n• "توقع المبيعات القادمة"\n• "افحص نواقص المخزون"\n• "اعرض تقسيم العملاء"`,
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
  }, [messages, isStreaming, streamingTokens, thinkingStatus]);

  const handleStartNewSession = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/agent/sessions?tenant_id=${activeTid}`, {
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
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Reset stream accumulators
    setStreamingTokens('');
    setStreamingCardType(null);
    setStreamingCardPayload(null);

    await sendStreamMessage(
      {
        message: text,
        session_id: currentSessionId,
        tenant_id: activeTid,
      },
      {
        onToken: (tok) => {
          setStreamingTokens((prev) => prev + tok);
        },
        onCard: (cardType, payload) => {
          setStreamingCardType(cardType);
          setStreamingCardPayload(payload);
        },
        onDone: (data) => {
          const aiMsg: ChatMessage = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: data.reply || streamingTokens,
            cardType: data.cardType || streamingCardType || undefined,
            payload: data.payload || streamingCardPayload || undefined,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setStreamingTokens('');
          setStreamingCardType(null);
          setStreamingCardPayload(null);
          loadSessions();
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai_err_${Date.now()}`,
              role: 'assistant',
              content: 'عذراً، حدث خطأ أثناء الاتصال بالوكيل. يرجى إعادة المحاولة.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setStreamingTokens('');
          setStreamingCardType(null);
          setStreamingCardPayload(null);
        },
      }
    );
  };

  const QUICK_PROMPTS = [
    { label: 'الأرباح والداشبورد', query: 'قولي الارباح في الداشبورد' },
    { label: 'إضافة منتج', query: 'عايز اضيف منتج' },
    { label: 'توقع المبيعات', query: 'توقع المبيعات القادمة' },
    { label: 'فحص المخزون', query: 'افحص نواقص المخزون' },
    { label: 'تقسيم العملاء', query: 'اعرض تقسيم العملاء' },
    { label: 'تقرير مالي PDF', query: 'استخرج تقرير مالي pdf' },
  ];

  return (
    <div dir="rtl" className="h-full flex flex-col font-sans text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>وكيل تيك زون للـ ERP والمحادثة الذكية</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Streaming SSE Live
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              إدارة الكتالوج، المخزون، الطلبات، وبطاقات التحليلات التفاعلية عبر الشات 100%
            </p>
          </div>
        </div>

        <button
          onClick={handleStartNewSession}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-sky-500" />
          <span>محادثة جديدة</span>
        </button>
      </div>

      {/* Main Container with Sidebar + Chat */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sessions Sidebar */}
        <div className="hidden md:flex w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex-col shrink-0 min-h-0">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>سجل الجلسات</span>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {sessions.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-[11px] leading-relaxed">
                لا توجد محادثات سابقة لهذا المتجر.
              </div>
            ) : (
              [...sessions]
                .sort((a, b) => {
                  const aPinned = pinnedSessionIds.includes(a.id);
                  const bPinned = pinnedSessionIds.includes(b.id);
                  if (aPinned && !bPinned) return -1;
                  if (!aPinned && bPinned) return 1;
                  return 0;
                })
                .map((s) => {
                  const isPinned = pinnedSessionIds.includes(s.id);
                  const isEditing = editingSessionId === s.id;
                  const isActive = currentSessionId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`group relative rounded-xl text-xs transition-all flex items-center justify-between p-1.5 ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(s.id, e);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            autoFocus
                            className="flex-1 bg-white dark:bg-slate-800 border border-sky-400 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRename(s.id, e)}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                            title="حفظ"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(null);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                            title="إلغاء"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setCurrentSessionId(s.id)}
                            className="flex-1 text-right flex items-center gap-2 truncate pr-1 cursor-pointer"
                          >
                            {isPinned ? (
                              <Pin className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-500 rotate-45" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            )}
                            <span className="truncate">{s.title || 'محادثة'}</span>
                          </button>

                          {/* Quick Action Icons: Pin, Rename, Delete */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                            <button
                              type="button"
                              onClick={(e) => togglePinSession(s.id, e)}
                              className={`p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer ${
                                isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                              }`}
                              title={isPinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
                            >
                              <Pin className={`w-3 h-3 ${isPinned ? 'fill-amber-500 rotate-45' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleStartRename(s, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-sky-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                              title="تعديل اسم المحادثة"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(s.id, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                              title="حذف المحادثة"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
            )}
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
                  className={`max-w-[92%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white rounded-br-xs font-medium'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-medium break-words space-y-1">
                    {msg.content.split('\n').map((line, idx) => (
                      <React.Fragment key={idx}>
                        {line ? <div>{line}</div> : <div className="h-1.5" />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Render GenUI Card via GenUiRegistry */}
                  {msg.cardType && msg.cardType !== 'text' && (
                    <div className="mt-3">
                      <GenUiRegistry
                        cardType={msg.cardType}
                        payload={msg.payload || {}}
                        onSendMessage={(cmd) => handleSendMessage(cmd)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live Streaming Response / Thinking Indicator */}
            {isStreaming && (
              <div className="space-y-3">
                {thinkingStatus && !streamingTokens && (
                  <ThinkingBubble statusText={thinkingStatus} toolName={currentTool} />
                )}

                {(streamingTokens || streamingCardType) && (
                  <StreamingMessage
                    tokens={streamingTokens}
                    cardType={streamingCardType}
                    cardPayload={streamingCardPayload}
                    isStreaming={isStreaming}
                    onSendMessage={(cmd) => handleSendMessage(cmd)}
                  />
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                disabled={isStreaming}
                onClick={() => handleSendMessage(p.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-950/60 text-slate-700 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400 text-[11px] font-semibold transition-colors shrink-0 border border-slate-200/60 dark:border-slate-700/60"
              >
                {p.label}
              </button>
            ))}
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
                placeholder="اطلب أي أمر بالمصري (مثال: قولي الارباح في الداشبورد، أو ضيف منتج جديد)..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming}
                className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-40 shadow-xs"
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
