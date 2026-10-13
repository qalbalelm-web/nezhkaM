import React from 'react';
import { AuthUser } from '../types/index.js';
import { LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import scienceHeartLogo from '../assets/images/science_heart_logo_1791928785795.jpg';

interface NavbarProps {
  user: AuthUser | null;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src={scienceHeartLogo}
            alt="شعار منصة قلب العلم"
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-emerald-500/30"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-100 whitespace-nowrap tracking-tight">
              مخزن منصة قلب العلم
            </span>
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              بوابة التخزين وإدارة وسائط Pixeldrain
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {user?.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => onTabChange?.('teachers')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 ${
                  activeTab === 'teachers' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                إدارة المعلمين
              </button>
              <button
                type="button"
                onClick={() => onTabChange?.('metrics')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 ${
                  activeTab === 'metrics' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                إحصائيات التخزين
              </button>
              <button
                type="button"
                onClick={() => onTabChange?.('database')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 ${
                  activeTab === 'database' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                الحفظ الدائم وقاعدة البيانات
              </button>
            </>
          )}

          {user?.role === 'teacher' && (
            <>
              <button
                type="button"
                onClick={() => onTabChange?.('videos')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 ${
                  activeTab === 'videos' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                جدول فيديوهاتي
              </button>
              <button
                type="button"
                onClick={() => onTabChange?.('upload')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 ${
                  activeTab === 'upload' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                مركز الرفع السحابي
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action / User Profile */}
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">
                  {user.name || user.username || 'مستخدم النظام'}
                </span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                  {user.role === 'admin' ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      المدير الرئيسي
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 text-cyan-400" />
                      معلم معتمد ({user.teacherId})
                    </>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-md hover:bg-rose-900/40 transition-colors whitespace-nowrap shrink-0"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">نظام محمي ببروتوكول الأمان المتقدم</span>
          )}
        </div>
      </div>
    </header>
  );
};
