import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/base";
import { getLocalidades, type Localidad } from "../api/localidades";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { Alert, Button, Field, Input, Select } from "../components/ui";

type Mode = "login" | "register";

type FormState = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: "CLIENTE" | "PRESTAMISTA";
  id_localidad: string;
};

const initial: FormState = { email: "", password: "", nombre: "", apellido: "", rol: "CLIENTE", id_localidad: "" };

type Props = {
  /** Modo inicial del formulario (input property). */
  initialMode?: Mode;
  /** Se dispara al autenticarse correctamente (output property). */
  onAuthenticated?: (email: string) => void;
};

export default function AuthPage({ initialMode = "login", onAuthenticated }: Props) {
  const { user, login, register } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);

  useEffect(() => {
    if (mode === "register" && localidades.length === 0) {
      getLocalidades().then(setLocalidades).catch(() => setLocalidades([]));
    }
  }, [mode, localidades.length]);

  if (user) return <Navigate to={from} replace />;

  const set = (name: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const logged =
        mode === "login"
          ? await login(form.email, form.password)
          : await register({
              email: form.email,
              password: form.password,
              nombre: form.nombre,
              apellido: form.apellido,
              rol: form.rol,
              id_localidad: form.id_localidad ? Number(form.id_localidad) : null,
            });
      toast.success(mode === "login" ? `Bienvenido, ${logged.nombre}` : "Cuenta creada correctamente");
      onAuthenticated?.(logged.email);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo iniciar sesión"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-xl border border-emerald-500/20 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-emerald-300">
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Email">
            <Input type="email" name="email" autoComplete="email" value={form.email} onChange={set("email")} required />
          </Field>

          <Field label="Contraseña" hint={mode === "register" ? "Mínimo 6 caracteres" : undefined}>
            <Input
              type="password"
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={form.password}
              onChange={set("password")}
              required
              minLength={mode === "register" ? 6 : undefined}
            />
          </Field>

          {mode === "register" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input name="nombre" value={form.nombre} onChange={set("nombre")} required />
                </Field>
                <Field label="Apellido">
                  <Input name="apellido" value={form.apellido} onChange={set("apellido")} required />
                </Field>
              </div>

              <Field label="Quiero registrarme como" hint="Cliente: solicito servicios para mis campos. Prestamista: ofrezco servicios.">
                <Select name="rol" value={form.rol} onChange={set("rol")}>
                  <option value="CLIENTE">Cliente (productor)</option>
                  <option value="PRESTAMISTA">Prestamista (contratista)</option>
                </Select>
              </Field>

              <Field label="Localidad (opcional)">
                <Select name="id_localidad" value={form.id_localidad} onChange={set("id_localidad")}>
                  <option value="">Sin localidad</option>
                  {localidades.map((l) => (
                    <option key={l.id_localidad} value={l.id_localidad}>
                      {l.nombre}
                      {l.provincia ? ` (${l.provincia.nombre})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          )}

          {error && <Alert kind="error">{error}</Alert>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Enviando…" : mode === "login" ? "Entrar" : "Registrarme"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
          <button
            type="button"
            className="font-semibold text-emerald-300 underline-offset-2 hover:underline"
            onClick={() => {
              setMode((m) => (m === "login" ? "register" : "login"));
              setError(null);
            }}
          >
            {mode === "login" ? "Crear una" : "Iniciar sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
