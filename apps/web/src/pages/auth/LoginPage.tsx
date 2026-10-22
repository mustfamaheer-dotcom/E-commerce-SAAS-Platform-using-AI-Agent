// apps/web/src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Store,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { loginUser, UserAccount } from '../../services/auth';
import { useAppTheme } from '../../contexts/ThemeContext';

interface LoginPageProps {
  onSuccess: (user: UserAccount) => void;
  onNavigateToRegister: () => void;
  onNavigateToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateToRegister,
  onNavigateToHome,
}) => {
  const { theme, toggleMode } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني للمتابعة');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const user = loginUser(email, password);
        setIsLoading(false);
        onSuccess(user);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى.');
      }
    }, 450);
  };

  const handleQuickLoginMoustafa = () => {
    const user = loginUser('owner@moustafatech.eg', '123456');
    onSuccess(user);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200"
    >
      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs font-bold text-xs">
              TZ
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">TechZone ERP</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={theme.mode === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {theme.mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            إنشاء حساب جديد
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
          {/* Left / Info Branding Column */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 w-fit">
              <Sparkles className="w-4 h-4" />
              <span>نظام التجارة الذكية المتكامل 🇪🇬</span>
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              أهلاً بعودتك إلى مركز قيادة متجرك
            </h1>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              سجّل دخولك للوصول إلى لوحة الـ ERP، كتالوج المنتجات، فحص المخزون ونواقص السلع، والتحكم التلقائي مع وكيل الذكاء الاصطناعي المصري.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>إدارة فورية للطلبات والشحن عبر بوسطة (Bosta)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>بوابات دفع آمنة Paymob، كروت بنكية، وتحويل InstaPay</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>وكيل ذكي يستجيب لأوامرك الصوتية والمكتوبة بالعامية</span>
              </div>
            </div>
          </div>

          {/* Right / Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  تسجيل الدخول إلى حسابك
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  أدخل بيانات حسابك للمتابعة إلى مركز إدارة الخدمات
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="owner@moustafatech.eg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-right">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      كلمة المرور
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>تسجيل الدخول</span>
                      <Zap className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Login for Demo/Moustafa */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleQuickLoginMoustafa}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                >
                  <Store className="w-4 h-4 text-sky-500" />
                  <span>دخول تجريبي سريع كـ مصطفى ماهر (Moustafa Tech)</span>
                </button>
              </div>

              {/* Link to Register */}
              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                <span>ليس لديك حساب تاجر بعد؟ </span>
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  أنشئ حسابك مجاناً الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
