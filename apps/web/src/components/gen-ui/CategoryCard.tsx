// apps/web/src/components/gen-ui/CategoryCard.tsx
import React from 'react';
import { FolderCheck, Folder, Sparkles, Plus, ArrowRight } from 'lucide-react';

export interface CategoryData {
  id?: string;
  name: string;
  slug?: string;
  isActive?: boolean;
}

export interface CategoryCardPayload {
  category?: CategoryData;
  categories?: CategoryData[];
  name?: string;
}

interface CategoryCardProps {
  payload: CategoryCardPayload;
  onSendMessage?: (msg: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ payload, onSendMessage }) => {
  const isList = Array.isArray(payload?.categories) && payload.categories.length > 0;
  const cat = payload?.category || (payload?.name ? { name: payload.name } : null);

  if (isList) {
    return (
      <div
        dir="rtl"
        className="w-full max-w-lg rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-md overflow-hidden my-3"
      >
        <div className="bg-purple-50/70 dark:bg-purple-950/40 px-4 py-3 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-sm text-purple-950 dark:text-purple-200">
              أقسام وتصنيفات المتجر النشطة ({payload.categories!.length})
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
            كتالوج معتمد
          </span>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {payload.categories!.map((c, idx) => (
            <div
              key={c.id || idx}
              className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between hover:border-purple-300 transition-colors cursor-pointer group"
              onClick={() => onSendMessage?.(`اعرض منتجات قسم ${c.name}`)}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Folder className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{c.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono truncate">{c.slug || `cat-${c.name}`}</span>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
          <button
            onClick={() => onSendMessage?.('عايز اضيف قسم جديد')}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>
      </div>
    );
  }

  if (!cat) return null;

  return (
    <div
      dir="rtl"
      className="w-full max-w-md rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-md overflow-hidden my-3"
    >
      <div className="bg-purple-50/70 dark:bg-purple-950/40 px-4 py-3 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-bold text-sm text-purple-950 dark:text-purple-200">
            تم اعتماد وتفعيل القسم في الكتالوج
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          نشط
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">اسم القسم / التصنيف:</div>
            <div className="text-base font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">{cat.name}</div>
          </div>
          <div className="text-left font-mono text-[11px] text-slate-400">
            {cat.slug || `cat-${cat.name}`}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onSendMessage?.(`عايز اضيف منتج جديد في قسم ${cat.name}`)}
            className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة منتج لهذا القسم</span>
          </button>
          <button
            onClick={() => onSendMessage?.('عرض جميع الأقسام')}
            className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>كل الأقسام</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
