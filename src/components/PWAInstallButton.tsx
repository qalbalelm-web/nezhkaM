import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import officialLogo from '../assets/images/official_logo.png';

interface PWAInstallButtonProps {
  variant?: 'header' | 'prominent';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone app, do not display
  if (isInstalled) {
    return null;
  }

  // Handle clicking
  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback instruction for browsers where beforeinstallprompt hasn't fired yet
      alert('لتثبيت التطبيق على جهازك:\n- على الكمبيوتر: اضغط على أيقونة التثبيت في شريط المتصفح أعلى اليمين (Install App).\n- على الهاتف: افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
    }
  };

  return (
    <>
      {variant === 'prominent' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 hover:border-emerald-500 text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-md shadow-emerald-950/20 group"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Download className="w-3.5 h-3.5" />
          </div>
          <span>تثبيت مخزن قلب العلم كتطبيق على جهازك</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          title="تثبيت التطبيق على هذا الجهاز"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>تثبيت التطبيق</span>
        </button>
      )}

      {/* Guided Modal for iOS Safari Users */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={officialLogo}
                  alt="شعار مخزن قلب العلم"
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-emerald-500/40"
                />
                <h3 className="text-sm font-bold text-slate-100">
                  تثبيت التطبيق على iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <Share2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>1. اضغط على زر <strong>المشاركة (Share)</strong> في أسفل متصفح Safari.</span>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>2. مرر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              تم، حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
