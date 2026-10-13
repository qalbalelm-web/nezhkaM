import React, { useState } from 'react';
import { IVideo } from '../types/index.js';
import { X, Copy, Check, Play, Code, ExternalLink } from 'lucide-react';

interface VideoPlayerModalProps {
  video: IVideo | null;
  onClose: () => void;
  onCopyLink: (url: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onCopyLink,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!video) return null;

  const directUrl = video.directPlaybackUrl || `https://pixeldrain.com/api/file/${video.videoId}`;
  const lmsSnippet = `<video controls playsinline preload="metadata" style="width:100%; max-height:560px; border-radius:12px; background:#020617;">
  <source src="${directUrl}" type="video/mp4">
  متصفحك لا يدعم تشغيل الفيديو المباشر.
</video>`;

  const copyLmsCode = () => {
    navigator.clipboard.writeText(lmsSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100 truncate max-w-md">
              {video.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player (Raw Direct Playback HTML5) */}
        <div className="p-6 space-y-5">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-slate-800">
            <video
              src={directUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            >
              متصفحك لا يدعم تشغيل هذا الفيديو مباشرة.
            </video>
          </div>

          {/* Direct URL & Quick Copy */}
          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-300">رابط البث السحابي المباشر (Direct API Stream)</span>
              <span>تخطي واجهة Pixeldrain بنسبة 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={directUrl}
                className="w-full text-xs font-mono bg-slate-900 border border-slate-700/60 rounded px-3 py-2 text-slate-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onCopyLink(directUrl)}
                className="px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الرابط</span>
              </button>
            </div>
          </div>

          {/* HTML5 Embed Code for External LMS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                كود التضمين المباشر لمنصة قلب العلم (LMS Embed)
              </span>
              <button
                type="button"
                onClick={copyLmsCode}
                className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 transition-colors"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-400 overflow-x-auto whitespace-pre-wrap select-all">
              {lmsSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-md transition-colors"
          >
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>
  );
};
