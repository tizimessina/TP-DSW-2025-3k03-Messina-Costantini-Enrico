import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "./ui";

/* ---------- Toasts ---------- */

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type FeedbackContextValue = {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  /** Abre un diálogo de confirmación y resuelve true/false según la elección. */
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const toastStyles: Record<ToastKind, string> = {
  success: "border-emerald-500/50 bg-emerald-950/90 text-emerald-100",
  error: "border-red-500/50 bg-red-950/90 text-red-100",
  info: "border-sky-500/50 bg-sky-950/90 text-sky-100",
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions | string) =>
      new Promise<boolean>((resolve) => {
        const opts = typeof options === "string" ? { message: options } : options;
        setDialog({ ...opts, resolve });
      }),
    [],
  );

  const close = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  const value = useMemo<FeedbackContextValue>(
    () => ({
      toast: {
        success: (m) => push("success", m),
        error: (m) => push("error", m),
        info: (m) => push("info", m),
      },
      confirm,
    }),
    [push, confirm],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur ${toastStyles[t.kind]}`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">{dialog.title ?? "Confirmar"}</h3>
            <p className="mt-2 text-sm text-slate-300">{dialog.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => close(false)}>
                {dialog.cancelLabel ?? "Cancelar"}
              </Button>
              <Button variant={dialog.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
                {dialog.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
  return ctx;
}
