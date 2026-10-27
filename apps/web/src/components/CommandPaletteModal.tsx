// apps/web/src/components/CommandPaletteModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Home,
  ShoppingCart,
  TrendingUp,
  Package,
  Layers,
  Users,
  Tag,
  Store,
  Settings,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  Sun,
  Moon,
  ArrowRight,
  Command,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: 'تنقل' | 'إجراءات سريعة';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabKey: any) => void;
  onToggleTheme: () => void;
  isDark: boolean;
  onOpenStorefront: () => void;
  onNavigateHub: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onToggleTheme,
  isDark,
  onOpenStorefront,
  onNavigateHub,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'nav-home',
      title: 'الرئيسية (لوحة التحكم العامة)',
      category: 'تنقل',
      icon: Home,
      shortcut: 'G H',
      action: () => {
        onNavigateTab('home');
        onClose();
      },
    },
    {
      id: 'nav-orders',
      title: 'الطلبات والمبيعات والشحن',
      category: 'تنقل',
      icon: ShoppingCart,
      shortcut: 'G O',
      action: () => {
        onNavigateTab('orders');
        onClose();
      },
    },
    {
      id: 'nav-analytics',
      title: 'مؤشرات الأداء والتحليلات (BI)',
      category: 'تنقل',
      icon: TrendingUp,
      shortcut: 'G A',
      action: () => {
        onNavigateTab('analytics');
        onClose();
      },
    },
    {
      id: 'nav-products',
      title: 'المنتجات والكتالوج',
      category: 'تنقل',
      icon: Package,
      shortcut: 'G P',
      action: () => {
        onNavigateTab('products');
        onClose();
      },
    },
    {
      id: 'nav-inventory',
      title: 'المخزون ونواقص السلع',
      category: 'تنقل',
      icon: Package,
      shortcut: 'G I',
      action: () => {
        onNavigateTab('inventory');
        onClose();
      },
    },
    {
      id: 'nav-categories',
      title: 'الأقسام والتصنيفات',
      category: 'تنقل',
      icon: Layers,
      action: () => {
        onNavigateTab('categories');
        onClose();
      },
    },
    {
      id: 'nav-ecommerce',
      title: 'استوديو تخصيص المتجر',
      category: 'تنقل',
      icon: Store,
      action: () => {
        onNavigateTab('ecommerce');
        onClose();
      },
    },
    {
      id: 'nav-customers',
      title: 'إدارة علاقات العملاء (CRM)',
      category: 'تنقل',
      icon: Users,
      action: () => {
        onNavigateTab('customers');
        onClose();
      },
    },
    {
      id: 'nav-coupons',
      title: 'الكوبونات والعروض الترويجية',
      category: 'تنقل',
      icon: Tag,
      action: () => {
        onNavigateTab('coupons');
        onClose();
      },
    },
    {
      id: 'nav-chat',
      title: 'مركز قيادة الوكيل الذكي (AI Agent)',
      category: 'تنقل',
      icon: MessageSquare,
      shortcut: 'G C',
      action: () => {
        onNavigateTab('chat');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      title: 'إعدادات المتجر والهوية',
      category: 'تنقل',
      icon: Settings,
      shortcut: 'G S',
      action: () => {
        onNavigateTab('settings');
        onClose();
      },
    },
    {
      id: 'nav-audit',
      title: 'سجل التدقيق والأمان (Audit Log)',
      category: 'تنقل',
      icon: ShieldCheck,
      action: () => {
        onNavigateTab('audit');
        onClose();
      },
    },
    // Quick Actions
    {
      id: 'act-storefront',
      title: 'معاينة متجري كعميل ومشتري',
      category: 'إجراءات سريعة',
      icon: ExternalLink,
      action: () => {
        onOpenStorefront();
        onClose();
      },
    },
    {
      id: 'act-theme',
      title: isDark ? 'التحويل للوضع النهاري (Light Mode)' : 'التحويل للوضع الليلي (Dark Mode)',
      category: 'إجراءات سريعة',
      icon: isDark ? Sun : Moon,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'act-hub',
      title: 'إدارة المتاجر المتعددة (Store Hub)',
      category: 'إجراءات سريعة',
      icon: Store,
      action: () => {
        onNavigateHub();
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          onClose(); // trigger toggle in parent
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="h-13 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن صفحة، إجراء، أو أمر سريع..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-[340px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              لا توجد نتائج مطابقة لـ &quot;{query}&quot;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        isSelected
                          ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{cmd.category}</span>
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3 h-3 text-slate-400 rotate-180" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">↑↓</kbd> للتنقل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">↵</kbd> للتنفيذ
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">لوحة أوامر التاجر السريعة</span>
        </div>
      </div>
    </div>
  );
};
