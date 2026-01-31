import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="pointer-events-auto flex items-center gap-3 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-apple-hover dark:shadow-2xl rounded-full pl-4 pr-3 py-3 min-w-[300px] max-w-[90vw]"
    >
      <div className={`shrink-0 ${toast.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
        {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
      </div>
      <p className="flex-1 text-[15px] font-medium text-[#1D1D1F] dark:text-white leading-tight">
        {toast.message}
      </p>
      <button 
        onClick={onRemove}
        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};