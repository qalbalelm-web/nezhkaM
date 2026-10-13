import React from 'react';
import { Lock, LogIn } from 'lucide-react';
import scienceHeartLogo from '../assets/images/science_heart_logo_1791928785795.jpg';

interface LandingViewProps {
  onOpenLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onOpenLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Minimal Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={scienceHeartLogo}
            alt="شعار منصة قلب العلم"
            className="w-9 h-9 rounded-lg object-cover ring-1 ring-emerald-500/30"
          />
          <span className="text-sm font-bold text-slate-100 tracking-tight">
            مخزن منصة قلب العلم
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenLogin}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>تسجيل الدخول</span>
        </button>
      </header>

      {/* Centered Welcoming Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 sm:p-12 shadow-2xl backdrop-blur-sm">
          {/* Logo & Platform Name */}
          <div className="space-y-4">
            <img
              src={scienceHeartLogo}
              alt="منصة قلب العلم"
              className="w-20 h-20 rounded-2xl mx-auto shadow-2xl ring-2 ring-emerald-500/40"
            />
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                مخزن منصة قلب العلم
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                مرحباً بك في البوابة السحابية المخصصة لتخزين وإدارة الوسائط والفيديوهات التعليمية.
              </p>
            </div>
          </div>

          {/* Login Action Button */}
          <div className="pt-2 max-w-xs mx-auto space-y-3">
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/60"
            >
              <Lock className="w-4 h-4" />
              <span>تسجيل الدخول إلى حسابك</span>
            </button>
            <span className="text-[11px] text-slate-500 block">
              بوابة خاصة ومحمية للمعلمين وإدارة المنصة
            </span>
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        مخزن منصة قلب العلم التعليمية
      </footer>
    </div>
  );
};
