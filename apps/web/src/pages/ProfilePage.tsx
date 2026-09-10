import { useEffect, useState, type FormEvent } from "react";
import { ROLE_LABELS, updateMe } from "../api/auth";
import { getApiErrorMessage } from "../api/base";
import { getLocalidades, type Localidad } from "../api/localidades";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { Button, Card, Field, Input, PageTitle, RoleBadge, Select } from "../components/ui";
import { isoToDateInput } from "../lib/format";

type PerfilForm = {
  nombre: string;
  apellido: string;
  cuil_cuit: string;
  fecha_nac: string;
  domicilio: string;
  id_localidad: string;
  password: string;
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useFeedback();
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PerfilForm>({
    nombre: user?.nombre ?? "",
    apellido: user?.apellido ?? "",
    cuil_cuit: user?.cuil_cuit ?? "",
    fecha_nac: isoToDateInput(user?.fecha_nac),
    domicilio: user?.domicilio ?? "",
    id_localidad: user?.id_localidad ? String(user.id_localidad) : "",
    password: "",
  });

  useEffect(() => {
    getLocalidades().then(setLocalidades).catch(() => setLocalidades([]));
  }, []);

  if (!user) return null;

  const set = (name: keyof PerfilForm) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMe({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        cuil_cuit: form.cuil_cuit.trim() || null,
        fecha_nac: form.fecha_nac || null,
        domicilio: form.domicilio.trim() || null,
        id_localidad: form.id_localidad ? Number(form.id_localidad) : null,
        ...(form.password ? { password: form.password } : {}),
      });
      setUser(updated);
      setForm((f) => ({ ...f, password: "" }));
      toast.success("Perfil actualizado");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No se pudo actualizar el perfil"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Mi perfil" subtitle={user.email} />

      <Card>
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <span>Roles:</span>
          {user.roles.map((r) => (
            <span key={r} title={ROLE_LABELS[r]}>
              <RoleBadge role={r} />
            </span>
          ))}
          <span className="text-xs text-slate-500">(los roles los administra un administrador)</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input value={form.nombre} onChange={set("nombre")} required />
            </Field>
            <Field label="Apellido">
              <Input value={form.apellido} onChange={set("apellido")} required />
            </Field>
            <Field label="CUIL / CUIT">
              <Input value={form.cuil_cuit} onChange={set("cuil_cuit")} placeholder="20-12345678-9" />
            </Field>
            <Field label="Fecha de nacimiento">
              <Input type="date" value={form.fecha_nac} onChange={set("fecha_nac")} />
            </Field>
          </div>

          <Field label="Domicilio">
            <Input value={form.domicilio} onChange={set("domicilio")} placeholder="Calle y número" />
          </Field>

          <Field label="Localidad">
            <Select value={form.id_localidad} onChange={set("id_localidad")}>
              <option value="">Sin localidad</option>
              {localidades.map((l) => (
                <option key={l.id_localidad} value={l.id_localidad}>
                  {l.nombre}
                  {l.provincia ? ` (${l.provincia.nombre})` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Nueva contraseña" hint="Dejar vacío para no cambiarla">
            <Input type="password" autoComplete="new-password" value={form.password} onChange={set("password")} minLength={6} />
          </Field>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
