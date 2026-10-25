// apps/web/src/components/gen-ui/ClarificationCard.tsx
import React, { useState, useEffect } from 'react';
import { PackagePlus, FolderPlus, Check, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

export interface SlotField {
  field: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'image';
  required?: boolean;
  default?: any;
  options?: string[];
  placeholder?: string;
}

export interface ClarificationPayload {
  question?: string;
  formType?: 'product' | 'category' | string;
  submitLabel?: string;
  slots: SlotField[];
}

interface ClarificationCardProps {
  data: ClarificationPayload;
  onSubmit?: (formattedMessage: string) => void;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({ data, onSubmit }) => {
  const isCategory = data?.formType === 'category';

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    (data?.slots || []).forEach((slot) => {
      initial[slot.field] = slot.default ?? (slot.options ? slot.options[0] : '');
    });
    return initial;
  });

  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  useEffect(() => {
    const tid = localStorage.getItem('techzone_active_store_id') || 'tenant-moustafa-tech';
    const fetchCats = () => {
      fetch(`${API_BASE_URL}/categories?tenant_id=${tid}`)
        .then((r) => r.json())
        .then((cats) => {
          if (Array.isArray(cats) && cats.length > 0) {
            setDynamicCategories(cats.map((c) => c.name || c.name_ar));
          }
        })
        .catch(() => {});
    };

    fetchCats();
    window.addEventListener('techzone:categories-updated', fetchCats);
    return () => window.removeEventListener('techzone:categories-updated', fetchCats);
  }, []);

  const handleChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCategory) {
      const name = formData['name'] || 'قسم جديد';
      const prompt = `أضف قسم ${name}`;
      if (onSubmit) {
        onSubmit(prompt);
      }
      return;
    }

    const name = formData['name'] || 'منتج جديد';
    const price = formData['price'] || 500;
    const stock = formData['stock'] || 20;
    const cat = formData['category'] || '';
    const img = formData['image_url'] || formData['image'] || '';

    let prompt = `أضف منتج ${name} بسعر ${price} جنيه وكمية ${stock}`;
    if (cat) {
      prompt += ` في قسم ${cat}`;
    }
    if (img) {
      prompt += ` ${img}`;
    }

    if (onSubmit) {
      onSubmit(prompt);
    }
  };

  const borderClass = isCategory
    ? 'border-purple-200 dark:border-purple-900/60'
    : 'border-sky-200 dark:border-sky-900/60';
  const headerClass = isCategory
    ? 'text-purple-700 dark:text-purple-300'
    : 'text-sky-700 dark:text-sky-300';
  const btnClass = isCategory
    ? 'bg-purple-600 hover:bg-purple-500'
    : 'bg-sky-600 hover:bg-sky-500';

  return (
    <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border ${borderClass} text-xs shadow-xs`} dir="rtl">
      <div className={`flex items-center gap-2 mb-3 ${headerClass} font-bold`}>
        {isCategory ? (
          <FolderPlus className="w-4 h-4 text-purple-500" />
        ) : (
          <PackagePlus className="w-4 h-4 text-sky-500" />
        )}
        <span>{data?.question || (isCategory ? 'إضافة قسم / تصنيف جديد للمتجر:' : 'عشان أضيفلك المنتج بدقة، يرجى ملء التفاصيل:')}</span>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(data?.slots || []).map((slot) => {
            const isSelectCategory = slot.field === 'category' && slot.type === 'select';
            const optionsToUse =
              isSelectCategory && dynamicCategories.length > 0
                ? dynamicCategories
                : slot.options || [];

            if (slot.type === 'image') {
              return (
                <div key={slot.field} className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                    <span>{slot.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    type="url"
                    value={formData[slot.field] ?? ''}
                    onChange={(e) => handleChange(slot.field, e.target.value)}
                    placeholder={slot.placeholder || 'أدخل رابط صورة المنتج (https://...) أو يمكنك تخطي الخطوة'}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-left"
                  />
                  {formData[slot.field] && (
                    <div className="mt-1.5 flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <img
                        src={formData[slot.field]}
                        alt="Preview"
                        className="w-8 h-8 rounded-md object-cover border"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                      <span className="text-[10px] text-emerald-600 font-semibold">تم إرفاق رابط الصورة</span>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={slot.field} className={`space-y-1 ${isCategory ? 'sm:col-span-2' : ''}`}>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {slot.label} {slot.required && <span className="text-rose-500">*</span>}
                </label>

                {slot.type === 'select' ? (
                  <select
                    value={formData[slot.field] || (optionsToUse[0] ?? '')}
                    onChange={(e) => handleChange(slot.field, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    {optionsToUse.map((opt) => (
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
                    placeholder={slot.placeholder || `أدخل ${slot.label}...`}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className={`w-full mt-2 py-2 px-3 rounded-lg ${btnClass} text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>{data?.submitLabel || (isCategory ? 'تأكيد وإضافة القسم للكتالوج' : 'تأكيد وإضافة المنتج للكتالوج')}</span>
        </button>
      </form>
    </div>
  );
};
