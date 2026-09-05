"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check } from "lucide-react";

export type ToastTone = "default" | "error";
interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

interface ToastApi {
  push: (text: string, tone?: ToastTone) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastApi>({ push: () => {}, toasts: [] });
export const useToast = () => useContext(ToastContext);

let toastId = 0;

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchInterval: 20_000,
          },
        },
      }),
  );

  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: ToastTone = "default") => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const api = useMemo(() => ({ push, toasts }), [push, toasts]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContext.Provider value={api}>{children}</ToastContext.Provider>
    </QueryClientProvider>
  );
}

/** Toast bubbles, rendered high inside the phone shell by AppScreen. */
export function ToastViewport() {
  const { toasts } = useContext(ToastContext);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-[80] flex flex-col items-center gap-2 px-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={`flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium shadow-xl ${
              t.tone === "error" ? "bg-ember text-white" : "bg-ink text-cream"
            }`}
          >
            {t.tone === "error" ? (
              <AlertTriangle size={14} strokeWidth={2.5} />
            ) : (
              <span className="grid size-4 place-items-center rounded-full bg-leaf text-white">
                <Check size={11} strokeWidth={3.5} />
              </span>
            )}
            <span className="truncate">{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
