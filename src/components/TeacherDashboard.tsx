import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { ITeacher, IVideo } from '../types/index.js';
import {
  UploadCloud,
  Film,
  Copy,
  Check,
  Play,
  Trash2,
  HardDrive,
  Clock,
  Search,
  CheckCircle2,
  FileVideo,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import bannerImage from '../assets/images/storage_cloud_banner_1791928786696.jpg';

interface TeacherDashboardProps {
  onPreviewVideo: (video: IVideo) => void;
  onToast: (msg: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onPreviewVideo,
  onToast,
}) => {
  const [profile, setProfile] = useState<ITeacher | null>(null);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedLink, setLastUploadedLink] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, vidsRes] = await Promise.all([
        api.getTeacherProfile(),
        api.getMyVideos(),
      ]);
      setProfile(profRes.teacher);
      setVideos(vidsRes.videos || []);
    } catch (err: any) {
      onToast(err.message || 'فشل تحميل بيانات المدرس');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate video type
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|mkv|webm|avi|m4v|wmv)$/i)) {
      setUploadError('يرجى اختيار ملف فيديو صالح (مثل: MP4, WebM, MKV, MOV)');
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
    setLastUploadedLink(null);
    // Suggest clean title from file name without extension
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setVideoTitle(cleanName);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusText('تم إلغاء عملية الرفع');
    }
  };

  const startUpload = async () => {
    if (!selectedFile) {
      setUploadError('يرجى تحديد ملف فيديو أولاً');
      return;
    }
    if (!videoTitle.trim()) {
      setUploadError('يرجى كتابة عنوان للفيديو');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText('جاري الاتصال بمخزن Pixeldrain وتجهيز بيانات الاعتماد...');

    try {
      // 1. Fetch authenticated upload credentials for this teacher
      const creds = await api.getUploadCredentials();
      const apiKey = creds.apiKey;
      const cleanFileName = encodeURIComponent(selectedFile.name);

      setUploadStatusText('جاري نقل البيانات سحابياً من متصفحك مباشرة إلى Pixeldrain...');

      // 2. Client-side XMLHttpRequest directly to Pixeldrain API
      // Pixeldrain supports PUT https://pixeldrain.com/api/file/{filename} with Basic auth
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      // Authentication: HTTP Basic Auth with user: "" and password: apiKey
      const authHeader = 'Basic ' + btoa(':' + apiKey);

      // We'll prepare upload URL
      const uploadUrl = `https://pixeldrain.com/api/file/${cleanFileName}`;

      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Authorization', authHeader);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (event.total / (1024 * 1024)).toFixed(1);
          setUploadStatusText(`جاري الرفع السحابي: ${percent}% (${uploadedMB} MB من ${totalMB} MB)`);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            const videoId = responseData.id;

            if (!videoId) {
              throw new Error('لم يتم استلام معرف الفيديو من Pixeldrain');
            }

            setUploadStatusText('تم الرفع بنجاح! جاري تسجيل الفيديو في منصة قلب العلم...');

            // 3. Register newly uploaded video in the backend linked to this teacher
            const regRes = await api.registerVideo({
              videoId,
              title: videoTitle.trim(),
              fileSize: selectedFile.size,
            });

            const directLink = regRes.video.directPlaybackUrl;
            setLastUploadedLink(directLink);
            onToast('اكتمل الرفع السحابي بنجاح! تم نسخ الرابط المباشر إلى الحافظة.');
            navigator.clipboard.writeText(directLink).catch(() => {});

            // Reset uploader
            setSelectedFile(null);
            setVideoTitle('');
            setUploadProgress(100);
            setIsUploading(false);

            // Refresh data
            await loadData();
          } catch (parseErr: any) {
            setUploadError('فشل معالجة استجابة مخزن Pixeldrain: ' + parseErr.message);
            setIsUploading(false);
          }
        } else {
          setUploadError(`فشل الرفع إلى Pixeldrain (رمز الخطأ: ${xhr.status}). تأكد من صحة مفتاح الـ API ومساحة حسابك.`);
          setIsUploading(false);
        }
      };

      xhr.onerror = () => {
        setUploadError('حدث خطأ في الاتصال بالشبكة أثناء الرفع المباشر. قد يكون ذلك بسبب قيود جدار الحماية أو اتصال الإنترنت.');
        setIsUploading(false);
      };

      // Send the raw file payload directly
      xhr.send(selectedFile);
    } catch (err: any) {
      setUploadError(err.message || 'حدث خطأ أثناء بدء عملية الرفع');
      setIsUploading(false);
    }
  };

  const copyPlayerLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onToast('تم نسخ رابط المشغل المباشر بنجاح! جاهز للصق في مشغل LMS الخاص بالمنصة.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteVideo = async (video: IVideo) => {
    if (!window.confirm(`هل أنت متأكد من حذف الفيديو "${video.title}"؟`)) {
      return;
    }
    try {
      setDeletingId(video._id || video.videoId);
      await api.deleteMyVideo(video._id || video.videoId);
      onToast('تم حذف الفيديو بنجاح');
      await loadData();
    } catch (err: any) {
      onToast(err.message || 'فشل حذف الفيديو');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.videoId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Teacher Welcome Hero */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <img src={bannerImage} alt="Cloud storage background" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Film className="w-4 h-4" />
              <span>لوحة تحكم المعلم المعزولة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              أهلاً بك، {profile?.name || 'أستاذنا الفاضل'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              ارفع شروحاتك وفيديوهاتك التعليمية سحابياً بحرية تامة وبأعلى سرعة مباشرة من جهازك إلى حساب Pixeldrain الخاص بك، مع رابط مباشر خالٍ من الإعلانات لمنصتنا.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">إجمالي فيديوهاتك</span>
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {profile?.videoCount ?? videos.length}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">المساحة المستهلكة</span>
              <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
                {(profile as any)?.formattedStorage || '0 بايت'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud File Uploader Component */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">مركز الرفع السحابي المباشر</h2>
              <span className="text-xs text-slate-400">
                الرفع يتم مباشرة من متصفحك إلى Pixeldrain لتوفير أقصى سرعة وحماية باندويث الخادم
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {uploadError && (
          <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-rose-200">تنبيه أثناء الرفع:</span>
              <p className="leading-relaxed">{uploadError}</p>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {lastUploadedLink && (
          <div className="p-4 bg-emerald-950/50 border border-emerald-800/80 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تم الرفع والحفظ بنجاح! يمكنك الآن نسخ رابط البث المباشر:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={lastUploadedLink}
                className="w-full text-xs font-mono bg-slate-950 border border-emerald-900/60 rounded-lg px-3 py-2 text-emerald-300"
              />
              <button
                type="button"
                onClick={() => copyPlayerLink(lastUploadedLink, 'last')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ الرابط</span>
              </button>
            </div>
          </div>
        )}

        {/* Drag and Drop Zone */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.mkv,.webm,.avi,.m4v"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/80 group-hover:bg-emerald-950/60 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                <FileVideo className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                اسحب وأفلت ملف الفيديو هنا، أو انقر للاختيار من جهازك
              </h3>
              <p className="text-xs text-slate-500">
                يدعم صيغ الفيديو المختلفة (MP4, MKV, MOV, WebM). يتم رفع الفيديو وحفظه في حسابك السحابي فوراً.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 bg-slate-950/50 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate max-w-md">
                    {selectedFile.name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    الحجم: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>

              {!isUploading && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                  title="إلغاء التحديد"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Video Title Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                عنوان المحاضرة أو الفيديو (يظهر في جدول فيديوهاتك)
              </label>
              <input
                type="text"
                disabled={isUploading}
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="مثال: فيزياء 3ث - الفصل الأول: التيار الكهربي وقانون أوم"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Progress Bar (Visible while uploading) */}
            {isUploading && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{uploadStatusText}</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150 ease-out rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {isUploading ? (
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="px-4 py-2 bg-rose-950/70 border border-rose-900 text-rose-300 rounded-lg text-xs hover:bg-rose-900/60 transition-colors"
                >
                  إلغاء الرفع
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startUpload}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>ابدأ الرفع السحابي</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* My Videos Table (جدول فيديوهاتي) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-0">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">جدول فيديوهاتي السحابية</h2>
            <p className="text-xs text-slate-400">
              قائمة الفيديوهات الخاصة بك فقط. لا يمكن لأي مدرس آخر الاطلاع على ملفاتك أو روابطك.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في فيديوهاتي..."
              className="w-full pr-9 pl-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4">عنوان الفيديو (Video Title)</th>
                <th className="py-3 px-4">تاريخ الرفع (Upload Date)</th>
                <th className="py-3 px-4">الحجم (File Size)</th>
                <th className="py-3 px-4 text-center">رابط المشغل المباشر</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {searchQuery ? 'لا توجد فيديوهات تطابق بحثك' : 'لم تقم برفع أي فيديوهات بعد. استخدم نافذة الرفع أعلاه لبدء رفع فيديوهاتك.'}
                  </td>
                </tr>
              ) : (
                filteredVideos.map((video) => (
                  <tr key={video._id || video.videoId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-sm">{video.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(video.uploadedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        <span>{(video as any).formattedSize || `${(video.fileSize / (1024 * 1024)).toFixed(1)} MB`}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => copyPlayerLink(video.directPlaybackUrl, video.videoId)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          copiedId === video.videoId
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                        }`}
                        title="نسخ رابط API المباشر لتشغيله في المشغل الخاص بالمنصة"
                      >
                        {copiedId === video.videoId ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ رابط المشغل</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onPreviewVideo(video)}
                          className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 rounded transition-colors"
                          title="معاينة في مشغل المنصة"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === (video._id || video.videoId)}
                          onClick={() => handleDeleteVideo(video)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded transition-colors disabled:opacity-50"
                          title="حذف الفيديو"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
