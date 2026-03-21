import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastProps = {
  message: string;
  type: ToastType;
  onClose: () => void;
};

const typeStyles: Record<ToastType, string> = {
  success: 'border-[#22C55E] text-[#22C55E]',
  error: 'border-[#EF4444] text-[#EF4444]',
  info: 'border-[#3B82F6] text-[#3B82F6]',
};

const progressStyles: Record<ToastType, string> = {
  success: 'bg-[#22C55E]',
  error: 'bg-[#EF4444]',
  info: 'bg-[#3B82F6]',
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <>
      <style>
        {`@keyframes toast-progress { from { width: 100%; } to { width: 0%; } }`}
      </style>
      <div className={`fixed bottom-4 right-4 z-[100] min-w-[280px] max-w-[420px] bg-[#0a0a0a] border px-4 py-3 shadow-lg ${typeStyles[type]}`}>
        <p className="font-mono text-xs tracking-widest text-white pr-4">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 font-mono text-[10px] text-[#666] hover:text-white"
        >
          X
        </button>
        <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#1a1a1a]">
          <div
            className={`h-full ${progressStyles[type]}`}
            style={{ animation: 'toast-progress 4s linear forwards' }}
          />
        </div>
      </div>
    </>
  );
}
