import { useState, type FormEvent } from "react";
import { ROLE_LABELS, type RoleName } from "../../api/auth";
import { getApiErrorMessage } from "../../api/base";
import { getLocalidades } from "../../api/localidades";
import { createUsuario, deleteUsuario, getUsuarios, updateUsuario, type Usuario } from "../../api/usuarios";
import { useAuth } from "../../auth/AuthContext";
import { useFeedback } from "../../components/feedback";
import { Alert, Button, Card, EmptyState, Field, Input, PageSpinner, PageTitle, RoleBadge, Select, Table, Td, Th } from "../../components/ui";
import { useQuery } from "../../lib/useQuery";

const ALL_ROLES: RoleName[] = ["ADMIN", "CLIENTE", "PRESTAMISTA"];

type FormState = { email: string; password: string; nombre: string; apellido: string; roles: RoleName[]; id_localidad: string };
const empty: FormState = { email: "", password: "", nombre: "", apellido: "", roles: ["CLIENTE"], id_localidad: "" };

/** CRUD simple: Usuario con asignación de roles (ADMIN). */
export default function UsuariosPage() {
  const { user: me } = useAuth();
  const { toast, confirm } = useFeedback();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleName | "">("");
  const usuarios = useQuery(() => getUsuarios({ q: q || undefined, role: role || undefined }), [q, role]);
  const localidades = useQuery(() => getLocalidades(), []);

  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);

  const set = (name: keyof FormState) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [name]: e.target.value }));
  const toggleRole = (r: RoleName) =>
    setForm((p) => ({ ...p, roles: p.roles.includes(r) ? p.roles.filter((x) => x !== r) : [...p.roles, r] }));

  const reset = () => {
    setEditing(null);
    setForm(empty);
    setError(null);
  };

  const startEdit = (u: Usuario) => {
    setEditing(u);
    setForm({ email: u.email, password: "", nombre: u.nombre, apellido: u.apellido, roles: u.roles, id_localidad: u.id_localidad ? String(u.id_localidad) : "" });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.roles.length === 0) return setError("Asigná al menos un rol.");
    if (!editing && form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    const base = {
      email: form.email.trim(),
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      roles: form.roles,
      id_localidad: form.id_localidad ? Number(form.id_localidad) : null,
    };
    try {
      if (editing) {
        await updateUsuario(editing.id_user, { ...base, ...(form.password ? { password: form.password } : {}) });
        toast.success("Usuario actualizado");
      } else {
        await createUsuario({ ...base, password: form.password });
        toast.success("Usuario creado");
      }
      reset();
      usuarios.reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (u: Usuario) => {
    if (!(await confirm({ title: "Eliminar usuario", message: `¿Eliminar a ${u.nombre} ${u.apellido} (${u.email})?`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await deleteUsuario(u.id_user);
      toast.success("Usuario eliminado");
      usuarios.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Usuarios" subtitle="Alta, edición y asignación de roles." />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card title={editing ? `Editar: ${editing.email}` : "Nuevo usuario"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set("email")} required />
            </Field>
            <Field label={editing ? "Nueva contraseña (opcional)" : "Contraseña"}>
              <Input type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required={!editing} minLength={6} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre">
                <Input value={form.nombre} onChange={set("nombre")} required />
              </Field>
              <Field label="Apellido">
                <Input value={form.apellido} onChange={set("apellido")} required />
              </Field>
            </div>
            <Field label="Localidad">
              <Select value={form.id_localidad} onChange={set("id_localidad")}>
                <option value="">Sin localidad</option>
                {localidades.data?.map((l) => (
                  <option key={l.id_localidad} value={l.id_localidad}>
                    {l.nombre}
                    {l.provincia ? ` (${l.provincia.nombre})` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <fieldset>
              <legend className="mb-1 block text-xs font-medium text-slate-300">Roles</legend>
              <div className="flex flex-wrap gap-4">
                {ALL_ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} className="accent-emerald-500" />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>
            </fieldset>
            {error && <Alert kind="error">{error}</Alert>}
            <div className="flex gap-2">
              <Button type="submit">{editing ? "Guardar" : "Crear usuario"}</Button>
              {editing && (
                <Button type="button" variant="ghost" onClick={reset}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card title="Listado">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Input placeholder="Buscar por nombre o email" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={role} onChange={(e) => setRole(e.target.value as RoleName | "")}>
              <option value="">Todos los roles</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          {usuarios.loading ? (
            <PageSpinner />
          ) : usuarios.error ? (
            <Alert kind="error">{usuarios.error}</Alert>
          ) : !usuarios.data?.length ? (
            <EmptyState>Sin resultados.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Usuario</Th>
                  <Th>Roles</Th>
                  <Th>Localidad</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usuarios.data.map((u) => (
                  <tr key={u.id_user} className="hover:bg-slate-800/40">
                    <Td>
                      <span className="font-medium">
                        {u.nombre} {u.apellido}
                      </span>
                      <span className="block text-xs text-slate-500">{u.email}</span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <RoleBadge key={r} role={r} />
                        ))}
                      </div>
                    </Td>
                    <Td>{u.localidad?.nombre ?? "-"}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(u)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(u)} disabled={u.id_user === me?.id_user}>
                          Eliminar
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
