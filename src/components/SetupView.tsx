import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { AuthUser } from '../types/index.js';
import { ShieldAlert, KeyRound, User, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import officialLogo from '../assets/images/official_logo.png';

interface SetupViewProps {
  onSetupSuccess: (user: AuthUser) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onSetupSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('اسم المستخدم يجب ألا يقل عن 3 أحرف');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 خانات للأمان');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      setLoading(true);
      const res = await api.performSetup(username.trim(), password);
      onSetupSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ بيانات المدير الرئيسي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Card Header */}
        <div className="text-center space-y-3">
          <img
            src={officialLogo}
            alt="شعار مخزن منصة قلب العلم"
            className="w-20 h-20 rounded-full mx-auto shadow-2xl ring-2 ring-emerald-500/40 object-cover"
          />
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            تهيئة النظام الأولية (First-Time Boot)
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            مرحباً بك في بوابة مخزن منصة قلب العلم. لم يتم العثور على حساب مدير رئيسي في قاعدة البيانات. يرجى تعيين بيانات الدخول الرئيسية للمسؤول الأول الآن.
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 space-y-1">
            <span className="font-semibold block text-amber-100">إجراء أمني إلزامي لمرة واحدة فقط</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              بمجرد حفظ هذا الحساب، سيتم إغلاق مسار الإعداد (<code className="text-amber-300 font-mono">/setup</code>) نهائياً وتشفير كلمة المرور بتقنية Bcrypt.
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                اسم المستخدم للمدير الرئيسي (Master Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: master_admin أو admin"
                  className="w-full pr-10 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                كلمة المرور الرئيسية (Master Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pr-10 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pr-10 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              {loading ? (
                <span>جاري الحفظ والتثبيت...</span>
              ) : (
                <>
                  <span>تثبيت بيانات المدير وتفعيل النظام</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Checklist */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>تشفير بكلمات مرور Bcrypt وقواعد عزل بيانات المعلمين</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>حفظ التكوين في قاعدة بيانات Mongoose مع استجابة فورية</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
