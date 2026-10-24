// apps/web/src/components/gen-ui/HumanHandoffCard.tsx
import React from 'react';
import { UserCheck, Phone, MessageSquare, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface HumanHandoffPayload {
  reason?: string;
  phone?: string;
  email?: string;
  ticket_id?: string;
  store_name?: string;
}

export const HumanHandoffCard: React.FC<{ data: HumanHandoffPayload }> = ({ data }) => {
  const phone = data.phone || '+20 100 888 7777';
  const email = data.email || 'support@moustafatech.eg';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  return (
    <div dir="rtl" className="my-2 bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/60 shadow-2xs font-sans space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-amber-950 dark:text-amber-200">
            تم تحويل طلبك لخدمة العملاء والدعم البشري
          </h4>
          <p className="text-[10px] text-amber-800/80 dark:text-amber-400">
            فريق متجر {data.store_name || ''} جاهز لمساعدتك فوراً وحل أي مشكلة
          </p>
        </div>
      </div>

      {data.ticket_id && (
        <div className="inline-block text-[10px] font-mono bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-bold">
          كود التذكرة: {data.ticket_id}
        </div>
      )}

      {/* Quick Action Channels */}
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
        <a
          href={`tel:${cleanPhone}`}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 hover:border-amber-400 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-all active:scale-95"
        >
          <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>اتصال هاتفي</span>
        </a>

        <a
          href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
            `أهلاً خدمة العملاء، أحتاج مساعدة بخصوص طلبي (تذكرة: ${data.ticket_id || 'جديدة'})`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>واتساب فوري</span>
        </a>
      </div>

      <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 flex items-center gap-1.5 pt-0.5">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>ساعات العمل: يومياً من 10:00 صباحاً حتى 10:00 مساءً</span>
      </div>
    </div>
  );
};
