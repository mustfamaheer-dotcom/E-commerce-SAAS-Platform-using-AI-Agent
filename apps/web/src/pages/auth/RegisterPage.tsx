// apps/web/src/pages/auth/RegisterPage.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Moon,
  ArrowLeft,
  Store,
} from 'lucide-react';
import { registerUser, UserAccount } from '../../services/auth';
import { useAppTheme } from '../../contexts/ThemeContext';

interface RegisterPageProps {
  onSuccess: (user: UserAccount) => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateToLogin,
  onNavigateToHome,
}) => {
  const { theme, toggleMode } = useAppTheme();
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessType, setBusinessType] = useState('electronics');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم التاجر أو اسم المسؤول');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsLoading(true);
    try {
      const user = await registerUser({
        name: name.trim(),
        storeName: storeName.trim() || `متجر ${name.trim()}`,
        email: email.trim(),
        phone: phone.trim() || '+20 100 000 0000',
        password,
        businessType,
      });
      setIsLoading(false);
      onSuccess(user);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg('حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى.');
    }
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
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-semibold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>

          <div className="flex items-center gap-3">
            <img
              src="/TransparentLogo.png"
              alt="TalkShow Logo"
              className="h-10 w-auto object-contain drop-shadow-sm"
            />
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">TalkShow</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {theme.mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            type="button"
            onClick={onNavigateToLogin}
            className="px-4 py-2 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors border border-sky-200 dark:border-sky-800"
          >
            لديك حساب بالفعل؟ تسجيل الدخول
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
              <span>انضم إلى مجتمع تجار TalkShow</span>
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              أنشئ متجرك الإلكتروني المستقل مع عزل كامل للبيانات
            </h1>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              سجل حسابك لتأسيس متجر إلكتروني خاص بك فقط (Isolated Multi-Tenant). لوحة تحكم فارغة ونظيفة وجاهزة لاستقبال منتجاتك وطلباتك دون أي تداخل مع المتاجر الأخرى.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>عزل كامل لقاعدة البيانات: لا أحد يرى منتجاتك أو مبيعاتك سواك</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>لوحة تحكم ERP مخصصة لمتجرك الجديد تبدأ فارغة وجاهزة للإضافة</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>متجر للعملاء برابط مستقل خاص بمتجرك</span>
              </div>
            </div>
          </div>

          {/* Right / Register Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  إنشاء حساب تاجر ومتجر جديد
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  أدخل بياناتك لإنشاء متجرك الخاص فوراً
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Store Name Field */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    اسم المتجر الإلكتروني (البراند الخاص بك)
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute top-3 right-3 text-sky-500 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="مثال: متجر صاصا / Sasa Electronics"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-300 dark:border-sky-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs font-bold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    سيتم إنشاء لوحة تحكم ERP ومتجر عملاء مخصص بهذا الاسم
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الاسم الكامل للتاجر / المسؤول
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد مصطفى"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

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
                      placeholder="sasa@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Phone & Business Type in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      رقم الهاتف (واتساب)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="+20 100 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      مجال النشاط التجاري
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="electronics">إلكترونيات وموبايلات</option>
                        <option value="fashion">أزياء وملابس</option>
                        <option value="home">مستلزمات منزل وديكور</option>
                        <option value="cosmetics">عناية ومستحضرات تجميل</option>
                        <option value="fmcg">أغذية وسلع استهلاكية</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>جارٍ إنشاء الحساب وتخصيص المتجر...</span>
                  ) : (
                    <>
                      <span>إنشاء الحساب وبدء إدارة متجري</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  بالتسجيل، أنت توافق على شروط الاستخدام وسياسة خصوصية منصة تيك زون.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
