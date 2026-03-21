import { ReactNode, useMemo, useState } from 'react';
import { Toast } from '../components/Toast';
import { ToastContext, ToastType } from './toastContextValue';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const value = useMemo(
    () => ({
      showToast: (message: string, type: ToastType) => {
        setToast({ id: Date.now(), message, type });
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((current) => (current?.id === toast.id ? null : current))}
        />
      )}
    </ToastContext.Provider>
  );
}
