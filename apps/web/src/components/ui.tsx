import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";

/* ---------- Botones ---------- */

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-500 disabled:hover:bg-emerald-600",
  secondary: "bg-slate-700 text-slate-100 hover:bg-slate-600",
  danger: "bg-red-600/90 text-white hover:bg-red-500",
  ghost: "bg-transparent text-slate-200 hover:bg-slate-800 border border-slate-700",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  const sizes = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${sizes} ${variants[variant]} ${className}`}
    />
  );
}

export function LinkButton({
  to,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  to: string;
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}) {
  const sizes = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition ${sizes} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ---------- Inputs ---------- */

const inputBase =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${className}`} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputBase} ${className}`}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-[80px] ${className}`} />;
}

/** Etiqueta + control + mensaje de ayuda/error. */
export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-300">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

/* ---------- Layout de página ---------- */

export function PageTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold text-emerald-200">{title}</h2>}
      {children}
    </section>
  );
}

export function Alert({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: ReactNode }) {
  const styles = {
    info: "border-sky-500/40 bg-sky-500/10 text-sky-200",
    error: "border-red-500/40 bg-red-500/10 text-red-200",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  };
  return <div className={`rounded-md border px-3 py-2 text-sm ${styles[kind]}`} role="alert">{children}</div>;
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400 ${className}`}
      aria-label="Cargando"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-400">{children}</p>;
}

/* ---------- Tabla responsive ---------- */

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-800 ${className}`}>
      <table className="min-w-full divide-y divide-slate-800 text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap bg-slate-800/80 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-middle text-slate-200 ${className}`}>{children}</td>;
}

/* ---------- Badges ---------- */

const estadoStyles: Record<string, string> = {
  pendiente: "bg-amber-500/20 text-amber-200 ring-amber-500/40",
  aceptada: "bg-sky-500/20 text-sky-200 ring-sky-500/40",
  rechazada: "bg-red-500/20 text-red-200 ring-red-500/40",
  completada: "bg-emerald-500/20 text-emerald-200 ring-emerald-500/40",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${estadoStyles[estado] ?? "bg-slate-700 text-slate-200 ring-slate-600"}`}>
      {estado}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    ADMIN: "bg-purple-500/20 text-purple-200 ring-purple-500/40",
    CLIENTE: "bg-emerald-500/20 text-emerald-200 ring-emerald-500/40",
    PRESTAMISTA: "bg-sky-500/20 text-sky-200 ring-sky-500/40",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${styles[role] ?? "bg-slate-700 text-slate-200 ring-slate-600"}`}>
      {role}
    </span>
  );
}

/** Par etiqueta/valor para vistas de detalle. */
export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-100">{children}</dd>
    </div>
  );
}
