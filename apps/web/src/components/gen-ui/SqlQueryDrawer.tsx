// apps/web/src/components/gen-ui/SqlQueryDrawer.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, Copy, Check, ShieldCheck, Clock, Hash, ChevronDown, ChevronUp } from 'lucide-react';

interface SqlQueryDrawerProps {
  sql: string;
  executionTimeMs: number;
  rowCount: number;
  isCached?: boolean;
}

export const SqlQueryDrawer: React.FC<SqlQueryDrawerProps> = ({
  sql,
  executionTimeMs,
  rowCount,
  isCached = false,
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isRtl = i18n.language.startsWith('ar');

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="mt-3 border border-slate-800 rounded-xl bg-slate-950/70 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-slate-300 hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center gap-2 font-mono">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">
            {isRtl ? 'استعلام SQL المفحوص (Verified SQL)' : 'Verified SQL Query'}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            AST Safe
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {executionTimeMs}ms
          </span>
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {rowCount} {isRtl ? 'صفوف' : 'rows'}
          </span>
          {isCached && (
            <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
              Redis
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="relative">
            <pre className="font-mono text-emerald-300 text-xs p-3 rounded-lg bg-black/60 overflow-x-auto border border-slate-800/80 leading-relaxed">
              <code>{sql}</code>
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? (isRtl ? 'تم النسخ' : 'Copied') : isRtl ? 'نسخ' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
