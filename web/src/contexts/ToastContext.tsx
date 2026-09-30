import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import Icon, { type IconName } from '../components/ui/Icon.tsx';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toast: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastState | null>(null);

const STYLES: Record<ToastKind, string> = {
  success: 'border-brand-500/40 bg-brand-500/10 text-brand-500',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  info: 'border-accent-500/40 bg-accent-500/10 text-accent-500',
};

const ICONS: Record<ToastKind, IconName> = {
  success: 'check',
  error: 'x',
  info: 'alert',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`animate-fade-up pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${STYLES[item.kind]}`}
            role="status"
          >
            <Icon name={ICONS[item.kind]} className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-slate-100">{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastState {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return context;
}
