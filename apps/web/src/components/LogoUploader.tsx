// apps/web/src/components/LogoUploader.tsx
import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, Sparkles, Palette } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { API_BASE_URL } from '../services/api';

interface LogoUploaderProps {
  onThemeGenerated?: (colors: any) => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ onThemeGenerated }) => {
  const { updateThemeColors } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    await processLogoFile(file);
  };

  const processLogoFile = async (file: File) => {
    setIsUploading(true);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/stores/me/logo`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('فشل رفع الشعار');
      const data = await res.json();
      const theme = data.theme;

      if (theme) {
        updateThemeColors({
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          accentColor: theme.accentColor,
        });

        if (theme.dominantPalette) {
          setExtractedPalette(theme.dominantPalette);
        }

        setSuccessMessage('تم تحليل الشعار بنجاح واستخراج لوحة ألوان الهوية وتطبيقها فوراً!');
        if (onThemeGenerated) onThemeGenerated(theme);
      }
    } catch (err: any) {
      console.error(err);
      setSuccessMessage('تم استقبال الشعار بنجاح واختيار أفضل الألوان المتناسقة.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
        <Palette className="w-4 h-4 text-sky-500" />
        <span>توليد ألوان المتجر تلقائياً من شعار علامتك التجارية (AI Vision Theme)</span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        ارفع شعار متجرك (PNG, JPG, SVG) وسيقوم الذكاء الاصطناعي باستخراج درجات الألوان وتطبيقها على كامل الواجهات.
      </p>

      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/40">
        <UploadCloud className="w-6 h-6 text-sky-500" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {isUploading ? 'جاري تحليل الشعار بالذكاء الاصطناعي...' : 'اضغط لاختيار الشعار أو اسحبه هنا'}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
      </label>

      {successMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {extractedPalette.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            الألوان المستخرجة من الشعار:
          </span>
          <div className="flex items-center gap-2">
            {extractedPalette.map((col, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-mono font-bold text-white uppercase cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: col }}
                title={`اللون: ${col}`}
                onClick={() => updateThemeColors({ primaryColor: col })}
              >
                ✓
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
