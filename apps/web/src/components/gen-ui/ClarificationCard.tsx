// apps/web/src/components/gen-ui/ClarificationCard.tsx
import React, { useState } from 'react';
import { PackagePlus, Send, Check } from 'lucide-react';

export interface SlotField {
  field: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  default?: any;
  options?: string[];
}

export interface ClarificationPayload {
  question?: string;
  slots: SlotField[];
}

interface ClarificationCardProps {
  data: ClarificationPayload;
  onSubmit?: (formattedMessage: string) => void;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({ data, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    (data?.slots || []).forEach((slot) => {
      initial[slot.field] = slot.default ?? (slot.options ? slot.options[0] : '');
    });
    return initial;
  });

  const handleChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData['name'] || 'منتج جديد';
    const price = formData['price'] || 500;
    const stock = formData['stock'] || 20;
    const cat = formData['category'] || 'إلكترونيات';

    const prompt = `أضف منتج ${name} بسعر ${price} جنيه وكمية ${stock} في قسم ${cat}`;
    if (onSubmit) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-sky-200 dark:border-sky-900/60 text-xs shadow-xs" dir="rtl">
      <div className="flex items-center gap-2 mb-3 text-sky-700 dark:text-sky-300 font-bold">
        <PackagePlus className="w-4 h-4 text-sky-500" />
        <span>{data?.question || 'عشان أضيفلك المنتج بدقة، يرجى ملء التفاصيل:'}</span>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(data?.slots || []).map((slot) => (
            <div key={slot.field} className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                {slot.label} {slot.required && <span className="text-rose-500">*</span>}
              </label>

              {slot.type === 'select' ? (
                <select
                  value={formData[slot.field] || ''}
                  onChange={(e) => handleChange(slot.field, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  {(slot.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={slot.type}
                  required={slot.required}
                  value={formData[slot.field] ?? ''}
                  onChange={(e) => handleChange(slot.field, e.target.value)}
                  placeholder={`أدخل ${slot.label}...`}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>تأكيد وإضافة المنتج للكتالوج</span>
        </button>
      </form>
    </div>
  );
};
