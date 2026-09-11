import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Button } from "./ui";
import { Dialog } from "./ui/Dialog";
import { cn } from "../lib/cn";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ConfirmOptions = { title?: string; message: ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean };

type FeedbackContextValue = {
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void };
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const toastStyles: Record<ToastKind, { cls: string; Icon: typeof Info }> = {
  success: { cls: "border-brand-200 bg-white text-brand-900 dark:border-brand-800 dark:bg-stone-900 dark:text-brand-100", Icon: CheckCircle2 },
  error: { cls: "border-red-200 bg-white text-red-900 dark:border-red-800 dark:bg-stone-900 dark:text-red-100", Icon: XCircle },
  info: { cls: "border-sky-200 bg-white text-sky-900 dark:border-sky-800 dark:bg-stone-900 dark:text-sky-100", Icon: Info },
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback(
    (options: ConfirmOptions | string) =>
      new Promise<boolean>((resolve) => setDialog({ ...(typeof options === "string" ? { message: options } : options), resolve })),
    [],
  );
  const close = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  const value = useMemo<FeedbackContextValue>(
    () => ({ toast: { success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) }, confirm }),
    [push, confirm],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
        <AnimatePresence>
          {toasts.map((t) => {
            const { cls, Icon } = toastStyles[t.kind];
            return (
              <motion.div
                key={t.id}
                role="status"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={cn("pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-card-hover", cls)}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Dialog
        open={!!dialog}
        onClose={() => close(false)}
        title={dialog?.title ?? "Confirmar"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>{dialog?.cancelLabel ?? "Cancelar"}</Button>
            <Button variant={dialog?.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>{dialog?.confirmLabel ?? "Confirmar"}</Button>
          </>
        }
      >
        <div className="flex gap-3 text-sm text-stone-700 dark:text-stone-300">
          {dialog?.danger && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />}
          <div>{dialog?.message}</div>
        </div>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
  return ctx;
}
