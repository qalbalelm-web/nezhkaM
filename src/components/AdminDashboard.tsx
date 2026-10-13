import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { ITeacher, StorageMetrics } from '../types/index.js';
import {
  Users,
  Film,
  HardDrive,
  UserPlus,
  Trash2,
  Key,
  Search,
  ExternalLink,
  Shield,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Database,
  Download,
  Upload,
  CheckCircle2,
  Sparkles,
  Link2,
} from 'lucide-react';

interface AdminDashboardProps {
  onPreviewVideo: (video: any) => void;
  onToast: (msg: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onPreviewVideo,
  onToast,
  activeTab = 'teachers',
  onTabChange,
}) => {
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Database Management & Persistence States
  const [dbStatus, setDbStatus] = useState<{
    isMongoConnected: boolean;
    storageType: string;
    maskedUri: string | null;
    teachersCount: number;
    videosCount: number;
  } | null>(null);
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [connectingMongo, setConnectingMongo] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  // Add teacher form state
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion confirmation state
  const [teacherToDelete, setTeacherToDelete] = useState<ITeacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersRes, metricsRes, dbRes] = await Promise.all([
        api.getTeachers(),
        api.getStorageMetrics(),
        api.getDatabaseStatus().catch(() => null),
      ]);
      setTeachers(teachersRes.teachers || []);
      setMetrics(metricsRes.metrics || null);
      if (dbRes) setDbStatus(dbRes);
    } catch (err: any) {
      onToast(err.message || 'فشل في تحميل بيانات لوحة الإدارة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName || !formTeacherId || !formPassword || !formApiKey) {
      setFormError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setFormSubmitting(true);
      await api.createTeacher({
        name: formName.trim(),
        teacherId: formTeacherId.trim(),
        password: formPassword,
        pixeldrainApiKey: formApiKey.trim(),
      });
      onToast('تم تسجيل حساب المعلم بنجاح وتعيين مفتاح التخزين الخاص به');
      setFormName('');
      setFormTeacherId('');
      setFormPassword('');
      setFormApiKey('');
      setIsAddingTeacher(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة المدرس');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    try {
      setDeleting(true);
      await api.deleteTeacher(teacherToDelete._id || teacherToDelete.teacherId);
      onToast(`تم حذف حساب المعلم (${teacherToDelete.name}) بنجاح`);
      setTeacherToDelete(null);
      await loadData();
    } catch (err: any) {
      onToast(err.message || 'فشل حذف المدرس');
    } finally {
      setDeleting(false);
    }
  };

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) {
      onToast('يرجى إدخال رابط الاتصال بـ MongoDB');
      return;
    }
    try {
      setConnectingMongo(true);
      const res = await api.updateMongoConnection(mongoUriInput.trim());
      onToast(res.message);
      setMongoUriInput('');
      await loadData();
    } catch (err: any) {
      onToast(err.message || 'فشل الاتصال بقاعدة البيانات');
    } finally {
      setConnectingMongo(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `science_heart_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast('تم تحميل ملف النسخة الاحتياطية بنجاح إلى جهازك!');
    } catch (err: any) {
      onToast(err.message || 'فشل تصدير النسخة الاحتياطية');
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRestoringBackup(true);
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await api.restoreBackup(json);
      onToast(res.message);
      await loadData();
    } catch (err: any) {
      onToast(err.message || 'ملف النسخة الاحتياطية غير صالح أو حدث خطأ أثناء الاسترجاع');
    } finally {
      setRestoringBackup(false);
      e.target.value = '';
    }
  };

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onToast('تم نسخ رابط المشغل المباشر بنجاح!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.teacherId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Hero Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Shield className="w-4 h-4" />
              <span>لوحة التحكم الرئيسية للمشرف العام</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              إدارة تخزين منصة قلب العلم
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              تحكم مركزي بحسابات المعلمين وربط مفاتيح Pixeldrain وقاعدة البيانات السحابية الدائمة في بيئة معزولة تماماً.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={loadData}
              className="p-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.(activeTab === 'database' ? 'teachers' : 'database')}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors border ${
                activeTab === 'database'
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-800 text-cyan-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>إعدادات الحفظ الدائم</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTeacher(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مدرس جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">إجمالي المدرسين المعتمدين</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-slate-100">
            {metrics ? metrics.totalTeachers : teachers.length}
          </div>
          <div className="text-[11px] text-slate-500">
            حسابات نشطة معزولة بمفاتيح API مستقلة
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">إجمالي الفيديوهات المرفوعة</span>
            <Film className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-slate-100">
            {metrics ? metrics.totalVideos : 0}
          </div>
          <div className="text-[11px] text-slate-500">
            ملفات وسائط تعليمية جاهزة للبث المباشر
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">إجمالي المساحة المستخدمة</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-slate-100">
            {metrics?.formattedStorage || '0 بايت'}
          </div>
          <div className="text-[11px] text-slate-500">
            مستضافة مباشرة على حسابات Pixeldrain
          </div>
        </div>
      </div>

      {/* Database & Permanent Persistence Panel (Always visible or in dedicated tab) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                حالة الحفظ الدائم للبيانات (Permanent Storage & Database)
              </h2>
              <span className="text-xs text-slate-400">
                خيارات الحفظ السحابي الدائم عبر MongoDB Atlas أو النسخ الاحتياطي التلقائي
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dbStatus?.isMongoConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                متصل سحابياً بـ MongoDB Atlas (حفظ دائم)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                المخزن المحلي المستمر (جاهز للربط السحابي)
              </span>
            )}
          </div>
        </div>

        {/* Persistence Explanation & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action 1: MongoDB Connection */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-emerald-400" />
                ربط قاعدة بيانات سحابية دائمة (MongoDB Atlas)
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                لضمان بقاء بيانات المعلمين والفيديوهات محفوظة دائماً وبشكل نهائي في السحابة حتى مع تحديثات الخادم أو نقله، يمكنك إدخال رابط اتصال <strong className="text-slate-300">MongoDB Atlas (المجاني مدى الحياة)</strong> هنا.
              </p>
            </div>

            <form onSubmit={handleConnectMongo} className="space-y-3">
              <input
                type="text"
                value={mongoUriInput}
                onChange={(e) => setMongoUriInput(e.target.value)}
                placeholder="mongodb+srv://<user>:<password>@cluster0.mongodb.net/storage_db"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {dbStatus?.maskedUri ? `الرابط الحالي: ${dbStatus.maskedUri}` : 'لم يتم ربط رابط سحابي بعد'}
                </span>
                <button
                  type="submit"
                  disabled={connectingMongo}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {connectingMongo ? 'جاري الفحص والتوصيل...' : 'توصيل وحفظ سحابي دائم'}
                </button>
              </div>
            </form>
          </div>

          {/* Action 2: Instant JSON Backup & Restore */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                النسخ الاحتياطي اليدوي الفوري والاسترجاع (1-Click Backup)
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يمكنك تحميل ملف نسخة احتياطية كاملة لجميع المعلمين وسجلات فيديوهاتهم على جهازك الشخصي، أو استرجاعها في أي لحظة بضغطة زر واحدة كأمان إضافي.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>تحميل نسخة احتياطية (JSON)</span>
              </button>

              <label className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>{restoringBackup ? 'جاري الاسترجاع...' : 'استرجاع نسخة (Upload)'}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  disabled={restoringBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Teacher Modal */}
      {isAddingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">إضافة مدرس جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTeacher(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                إلغاء
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  الاسم الكامل للمعلم
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: أ. أحمد مصطفى"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  كود الدخول / رقم الهاتف (Unique Login ID)
                </label>
                <input
                  type="text"
                  required
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  placeholder="مثال: 01012345678 أو T-105"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  يستخدمه المدرس لتسجيل الدخول إلى بوابته الخاصة.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  مفتاح Pixeldrain API Key الخاص بالمدرس
                </label>
                <input
                  type="password"
                  required
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  placeholder="مفتاح الـ API المستخرج من حساب pixeldrain.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  يتم حفظ هذا المفتاح بصيغة مشفرة ويُستخدم لرفع فيديوهات هذا المدرس حصرياً لحسابه.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingTeacher(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  {formSubmitting ? 'جاري الحفظ...' : 'حفظ حساب المعلم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-100">تأكيد حذف حساب المعلم</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف المعلم <strong className="text-white">({teacherToDelete.name})</strong> ذو الكود <span className="font-mono text-emerald-400">({teacherToDelete.teacherId})</span>؟
              سيؤدي هذا الإجراء إلى حذف حسابه وكافة سجلات فيديوهاته المسجلة في المنصة.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:text-white"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteTeacher}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                {deleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teachers Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">سجل المعلمين المعتمدين</h2>
            <p className="text-xs text-slate-400">
              قائمة الحسابات التي يحق لها رفع وإدارة الفيديوهات السحابية
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الكود..."
              className="w-full pr-9 pl-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4">اسم المعلم</th>
                <th className="py-3 px-4">كود الدخول / الهاتف</th>
                <th className="py-3 px-4">مفتاح Pixeldrain</th>
                <th className="py-3 px-4">عدد الفيديوهات</th>
                <th className="py-3 px-4">المساحة المستهلكة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {searchQuery ? 'لا توجد نتائج تطابق بحثك' : 'لا يوجد مدرسون مسجلون حالياً. انقر على "إضافة مدرس جديد" للبدء.'}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher._id || teacher.teacherId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {teacher.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 tabular-nums">
                      {teacher.teacherId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-slate-400" />
                        <span>{(teacher as any).maskedApiKey || '••••••••'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                      {teacher.videoCount || 0} فيديو
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                      {(teacher as any).formattedStorage || '0 بايت'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setTeacherToDelete(teacher)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded transition-colors"
                        title="حذف المعلم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Uploads Feed (Abstracted Metrics) */}
      {metrics?.recentUploads && metrics.recentUploads.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">أحدث الفيديوهات المرفوعة عبر المنصة</h2>
            <span className="text-xs text-slate-500">تحديث فوري للسجلات</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.recentUploads.map((video) => (
              <div
                key={video.videoId}
                className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{video.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{video.teacherName}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{(video as any).formattedSize}</span>
                    <span>·</span>
                    <span className="font-mono text-emerald-400">{video.videoId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyLink(video.directPlaybackUrl, video.videoId)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="نسخ رابط المشغل"
                  >
                    {copiedId === video.videoId ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewVideo(video)}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="معاينة الفيديو"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
