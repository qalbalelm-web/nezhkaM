import React, { useState, useEffect } from 'react';
import { api } from './lib/api.js';
import { AuthUser, IVideo } from './types/index.js';
import { Navbar } from './components/Navbar.js';
import { LandingView } from './components/LandingView.js';
import { SetupView } from './components/SetupView.js';
import { LoginView } from './components/LoginView.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { TeacherDashboard } from './components/TeacherDashboard.js';
import { VideoPlayerModal } from './components/VideoPlayerModal.js';
import { NotificationToast } from './components/NotificationToast.js';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [bootChecking, setBootChecking] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>('default');

  // Video preview modal
  const [previewingVideo, setPreviewingVideo] = useState<IVideo | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const checkInitialState = async () => {
    try {
      setBootChecking(true);
      // 1. Check if first-boot setup is required
      const setupStatus = await api.checkSetupStatus();
      setIsSetupComplete(setupStatus.isSetupComplete);

      if (setupStatus.isSetupComplete) {
        // 2. Check existing authentication session
        try {
          const authRes = await api.getMe();
          if (authRes.user) {
            setCurrentUser(authRes.user);
            setActiveTab(authRes.user.role === 'admin' ? 'teachers' : 'videos');
          }
        } catch {
          // User not logged in, show LoginView
          setCurrentUser(null);
        }
      }
    } catch (err: any) {
      console.error('Boot initialization error:', err);
      showToast('حدث خطأ في الاتصال بالخادم. يرجى إعادة تحميل الصفحة.');
    } finally {
      setBootChecking(false);
    }
  };

  useEffect(() => {
    checkInitialState();
  }, []);

  const handleSetupSuccess = (user: AuthUser) => {
    setIsSetupComplete(true);
    setCurrentUser(user);
    setActiveTab('teachers');
    showToast('تم تهيئة النظام وتسجيل الدخول كمدير رئيسي بنجاح!');
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setActiveTab(user.role === 'admin' ? 'teachers' : 'videos');
    showToast(user.role === 'admin' ? 'مرحباً بك في لوحة تحكم الإدارة' : `أهلاً بك يا ${user.name || 'معلمنا الفاضل'}`);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    showToast('تم تسجيل الخروج بنجاح');
  };

  if (bootChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs font-medium">جاري فحص حالة نظام مخزن منصة قلب العلم...</span>
      </div>
    );
  }

  // 1. First-Time Boot: Strictly redirect to /setup if no Admin exists
  if (!isSetupComplete) {
    return (
      <>
        <SetupView onSetupSuccess={handleSetupSuccess} />
        <NotificationToast message={toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  // 2. Unauthenticated View: Show welcoming Landing Page with Login trigger
  if (!currentUser) {
    if (showLogin) {
      return (
        <>
          <LoginView
            onLoginSuccess={(user) => {
              setShowLogin(false);
              handleLoginSuccess(user);
            }}
            onBackToHome={() => setShowLogin(false)}
          />
          <NotificationToast message={toastMessage} onClose={() => setToastMessage(null)} />
        </>
      );
    }

    return (
      <>
        <LandingView onOpenLogin={() => setShowLogin(true)} />
        <NotificationToast message={toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  // 3. Authenticated View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentUser.role === 'admin' ? (
          <AdminDashboard
            onPreviewVideo={(v) => setPreviewingVideo(v)}
            onToast={showToast}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ) : (
          <TeacherDashboard
            onPreviewVideo={(v) => setPreviewingVideo(v)}
            onToast={showToast}
          />
        )}
      </main>

      {/* Video Playback & LMS Embed Modal */}
      <VideoPlayerModal
        video={previewingVideo}
        onClose={() => setPreviewingVideo(null)}
        onCopyLink={(url) => {
          navigator.clipboard.writeText(url);
          showToast('تم نسخ رابط المشغل المباشر بنجاح!');
        }}
      />

      {/* Feedback Toast */}
      <NotificationToast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        مخزن منصة قلب العلم التعليمية · نظام تخزين سحابي معزول عبر Pixeldrain API
      </footer>
    </div>
  );
}
