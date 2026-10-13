import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface NotificationToastProps {
  message: string | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900 border border-emerald-500/50 shadow-2xl shadow-emerald-950/60 rounded-xl px-4 py-3 flex items-center gap-3 text-slate-100 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-xs font-mono pr-2"
        >
          ×
        </button>
      </div>
    </div>
  );
};
