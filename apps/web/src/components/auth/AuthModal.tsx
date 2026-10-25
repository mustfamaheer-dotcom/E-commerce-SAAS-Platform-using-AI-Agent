// apps/web/src/components/auth/AuthModal.tsx
import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Mail, Lock, User, Phone, Briefcase, ArrowLeft, Loader2 } from 'lucide-react';

export interface UserAccount {
  name: string;
  email: string;
  phone: string;
  businessType: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'register' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    businessType: 'electronics',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      const user: UserAccount = {
        name: formData.name.trim() || (mode === 'login' ? 'أحمد الشناوي' : 'التاجر الجديد'),
        email: formData.email.trim() || 'merchant@techzone.eg',
        phone: formData.phone.trim() || '+20 100 123 4567',
        businessType: formData.businessType,
      };
      setIsSubmitting(false);
      onSuccess(user);
    }, 400);
  };

  const handleDemoLogin = () => {
    const demoUser: UserAccount = {
      name: 'محمود عبد العزيز (تاجر تجريبي)',
      email: 'demo.merchant@techzone.eg',
      phone: '+20 102 987 6543',
      businessType: 'electronics',
    };
    onSuccess(demoUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
      <div
        dir="rtl"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {mode === 'register' ? 'إنشاء حساب تاجر جديد في TechZone' : 'تسجيل الدخول إلى حسابك'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {mode === 'register' ? 'ابدأ تأسيس وإدارة متجرك بالذكاء الاصطناعي' : 'تابع مبيعاتك وإدارة متجرك'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            إنشاء حساب جديد
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            تسجيل الدخول
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">الاسم بالكامل</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute top-2.5 right-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد الشريف"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">رقم الهاتف أو الواتساب (مصر)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute top-2.5 right-3 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="+20 10X XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">نوع النشاط التجاري</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute top-2.5 right-3 text-slate-400 pointer-events-none" />
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="electronics">إلكترونيات واكسسوارات وهواتف</option>
                    <option value="fashion">أزياء وملابس وأحذية</option>
                    <option value="cosmetics">مستحضرات تجميل وعطور</option>
                    <option value="home">مستلزمات منزل وديكور</option>
                    <option value="food">أغذية ومشروبات وكافيه</option>
                    <option value="other">نشاط تجاري آخر</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">البريد الإلكتروني للعمل</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute top-2.5 right-3 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="name@company.eg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pr-9 pl-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute top-2.5 right-3 text-slate-400 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pr-9 pl-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white inline-block" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span>{mode === 'register' ? 'تأكيد الحساب ومتابعة الخدمات' : 'تسجيل الدخول'}</span>
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">أو التجربة الفورية</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>الدخول السريع كتاجر تجريبي (Demo Merchant)</span>
          </button>
        </form>

        <div className="p-3 text-center border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] text-slate-400">
          بياناتك محمية بعزل مستأجر كامل (PostgreSQL RLS) وفق معايير الأمان الوطنية
        </div>
      </div>
    </div>
  );
};
