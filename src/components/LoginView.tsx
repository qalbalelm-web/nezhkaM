import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { AuthUser } from '../types/index.js';
import { Lock, User, ArrowLeft } from 'lucide-react';
import officialLogo from '../assets/images/official_logo.png';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToHome?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('يرجى إدخال اسم المستخدم أو كود الدخول وكلمة المرور');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(identifier.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src={officialLogo}
            alt="شعار مخزن منصة قلب العلم"
            className="w-20 h-20 rounded-full mx-auto shadow-2xl ring-2 ring-emerald-500/40 object-cover"
          />
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            مخزن منصة قلب العلم
          </h1>
          <p className="text-xs text-slate-400">
            منصة تعليمية حديثة · تسجيل الدخول إلى بوابتك
          </p>
        </div>

        {/* Single Unified Login Form (No tabs, No mention of admin) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                اسم المستخدم أو كود الدخول / الهاتف
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="أدخل اسم المستخدم أو كود الدخول"
                  className="w-full pr-10 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                كلمة المرور
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
                  placeholder="••••••••"
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
                <span>جاري التحقق...</span>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {onBackToHome && (
            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={onBackToHome}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                ← العودة إلى الصفحة الترحيبية
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
