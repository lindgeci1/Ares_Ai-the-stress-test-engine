import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastContextType = {
  showToast: (message: string, type: ToastType) => void;
};

export const ToastContext = createContext<ToastContextType>({
  showToast: () => {
    throw new Error('ToastProvider is missing in component tree');
  },
});
