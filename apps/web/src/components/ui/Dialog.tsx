import { Dialog as HDialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { X } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Modal accesible (foco atrapado, Escape, click afuera) con animación. */
export function Dialog({ open, onClose, title, description, children, size = "md", footer }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: "sm" | "md" | "lg" | "xl"; footer?: ReactNode }) {
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <Transition show={open} as={Fragment}>
      <HDialog onClose={onClose} className="relative z-50">
        <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm" aria-hidden />
        </TransitionChild>
        <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <TransitionChild as={Fragment} enter="ease-out duration-250" enterFrom="translate-y-6 opacity-0 sm:translate-y-2 sm:scale-95" enterTo="translate-y-0 opacity-100 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 sm:scale-100" leaveTo="translate-y-4 opacity-0 sm:scale-95">
            <DialogPanel className={cn("flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-stone-900", widths[size])}>
              <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
                <div>
                  <DialogTitle className="text-lg font-bold text-stone-900 dark:text-white">{title}</DialogTitle>
                  {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
                </div>
                <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800" aria-label="Cerrar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
              {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-stone-200 px-5 py-3 dark:border-stone-800">{footer}</div>}
            </DialogPanel>
          </TransitionChild>
        </div>
      </HDialog>
    </Transition>
  );
}
