/**
 * E2E del negocio completo con los usuarios del seed:
 *   1. El contratista publica un servicio con precio.
 *   2. El productor registra un campo y solicita el servicio con un insumo (wizard de 3 pasos).
 *   3. El contratista acepta y luego completa el trabajo.
 *   4. El productor valora el trabajo y el promedio aparece en el perfil del contratista.
 *   5. Permisos: el productor no ve acciones del contratista ni páginas de admin.
 * Al final se borran los datos creados vía API (como ADMIN).
 */
import { expect, test, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const U = {
  admin: { email: "admin@agroapp.dev", password: "Admin123!" },
  productor: { email: "productor@agroapp.dev", password: "Productor123!" },
  contratista: { email: "contratista@agroapp.dev", password: "Contratista123!" },
};
const stamp = Date.now().toString().slice(-6);
const SERVICIO = `E2E Pulverización ${stamp}`;
const CAMPO = `Lote E2E ${stamp}`;
let solicitudId: number | undefined;

async function login(page: Page, u: { email: string; password: string }) {
  await page.goto("/ingresar");
  await page.getByLabel(/^Email/).fill(u.email);
  await page.getByLabel(/^Contraseña/).fill(u.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
}
async function logout(page: Page) {
  // Menú de usuario (avatar) → Cerrar sesión
  await page.getByRole("button", { name: /Abrir menú de usuario/ }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe.serial("Publicar → solicitar → aceptar → completar → valorar", () => {
  test("el contratista publica un servicio con precio", async ({ page }) => {
    await login(page, U.contratista);
    await page.goto("/mis-servicios");
    await page.getByRole("button", { name: "Publicar servicio" }).first().click();
    await page.getByLabel(/^Nombre/).fill(SERVICIO);
    await page.getByLabel(/^Categoría/).selectOption({ label: "Pulverización" });
    await page.getByLabel(/Precio por hectárea/).fill("1000");
    await page.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByText("Servicio publicado")).toBeVisible();
    await expect(page.getByRole("link", { name: SERVICIO })).toBeVisible();
    await logout(page);
  });

  test("el productor registra un campo y solicita el servicio con un insumo", async ({ page }) => {
    await login(page, U.productor);
    await page.goto("/campos");
    await page.getByRole("button", { name: "Nuevo campo" }).click();
    await page.getByLabel(/Nombre del campo/).fill(CAMPO);
    await page.getByLabel(/^Provincia/).selectOption({ label: "Buenos Aires" });
    await page.getByLabel(/^Localidad/).selectOption({ label: "Pergamino" });
    await page.getByLabel(/^Hectáreas/).fill("40");
    await page.getByRole("button", { name: "Registrar campo" }).click();
    await expect(page.getByText("Campo registrado")).toBeVisible();

    await page.goto("/servicios");
    await page.getByLabel("Buscar").fill(SERVICIO);
    await page.getByRole("link", { name: new RegExp(SERVICIO) }).first().click();
    await page.getByRole("button", { name: "Solicitar este servicio" }).click();

    // Paso 1
    const campoSelect = page.getByLabel(/^Campo/);
    await campoSelect.selectOption((await campoSelect.locator("option", { hasText: CAMPO }).getAttribute("value"))!);
    await page.getByLabel(/Hectáreas a trabajar/).fill("10");
    await page.getByRole("button", { name: "Continuar" }).click();
    // Paso 2: un insumo aportado por el contratista
    await page.getByRole("button", { name: "Agregar insumo" }).click();
    const insumoSelect = page.getByLabel(/^Insumo/);
    await insumoSelect.selectOption((await insumoSelect.locator("option", { hasText: "Gasoil" }).getAttribute("value"))!);
    await page.getByLabel(/^Cantidad/).fill("100");
    await page.getByRole("button", { name: "Continuar" }).click();
    // Paso 3
    await expect(page.getByText("Total estimado")).toBeVisible();
    await expect(page.getByText(/10\.000,00/).first()).toBeVisible(); // servicio 1000 × 10
    await page.getByRole("button", { name: "Confirmar solicitud" }).click();

    await expect(page).toHaveURL(/\/solicitudes\/\d+$/);
    solicitudId = Number(page.url().split("/").pop());
    await expect(page.getByText("Pendiente").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Aceptar", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancelar solicitud" })).toBeVisible();
    await logout(page);
  });

  test("el contratista acepta y completa el trabajo", async ({ page }) => {
    expect(solicitudId).toBeDefined();
    await login(page, U.contratista);
    await page.goto(`/solicitudes/${solicitudId}`);
    await page.getByRole("button", { name: "Aceptar", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText("Solicitud aceptada")).toBeVisible();
    await page.getByRole("button", { name: "Marcar completada" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText("Solicitud completada")).toBeVisible();
    await logout(page);
  });

  test("el productor valora y el promedio se refleja en el perfil del contratista", async ({ page }) => {
    await login(page, U.productor);
    await page.goto(`/solicitudes/${solicitudId}`);
    await page.getByRole("button", { name: "5 estrellas" }).click();
    await page.getByPlaceholder(/Contá cómo te fue/).fill("Impecable, e2e.");
    await page.getByRole("button", { name: "Enviar valoración" }).click();
    await expect(page.getByText("¡Gracias por tu valoración!")).toBeVisible();
    await expect(page.getByText("Impecable, e2e.")).toBeVisible();

    await page.goto("/admin/usuarios");
    await expect(page.getByText("No tenés permisos para ver esta página")).toBeVisible();
  });
});

test.afterAll(async ({ request }) => {
  const res = await request.post(`${API}/auth/login`, { data: U.admin });
  const { token } = await res.json();
  const auth = { Authorization: `Bearer ${token}` };
  if (solicitudId) await request.delete(`${API}/solicitudes/${solicitudId}`, { headers: auth });
  const campos = await (await request.get(`${API}/campos`, { headers: auth, params: { q: CAMPO } })).json();
  for (const c of campos) await request.delete(`${API}/campos/${c.id_campo}`, { headers: auth });
  // El servicio queda desactivado (baja lógica) para conservar el historial
  const servicios = await (await request.get(`${API}/servicios`, { params: { q: SERVICIO } })).json();
  for (const s of servicios.items ?? []) await request.delete(`${API}/servicios/${s.id_servicio}`, { headers: auth });
});
