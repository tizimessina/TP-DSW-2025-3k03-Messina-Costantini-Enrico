/**
 * E2E del caso de uso principal, con los usuarios del seed:
 *   1. El prestamista publica un servicio con precio.
 *   2. El cliente registra un campo y solicita ese servicio.
 *   3. El prestamista acepta la solicitud.
 * Al final se borran los datos creados vía API (como ADMIN).
 */
import { expect, test, type Page } from "@playwright/test";

const API = "http://localhost:3000";
const USERS = {
  admin: { email: "admin@agroapp.dev", password: "Admin123!" },
  cliente: { email: "cliente@agroapp.dev", password: "Cliente123!" },
  prestamista: { email: "prestamista@agroapp.dev", password: "Prestamista123!" },
};

const stamp = Date.now().toString().slice(-6);
const SERVICIO = `E2E Fumigación ${stamp}`;
const COORDS = `-30.${stamp}, -60.1`;

let solicitudId: number | undefined;

async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/auth");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("link", { name: "Ingresar" })).toHaveCount(0);
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Salir" }).first().click();
  await expect(page.getByRole("link", { name: "Ingresar" }).first()).toBeVisible();
}

test.describe.serial("Publicar, solicitar y aceptar un servicio", () => {
  test("el prestamista publica un servicio con precio inicial", async ({ page }) => {
    await login(page, USERS.prestamista);
    await page.goto("/mis-servicios");

    await page.getByLabel("Nombre").fill(SERVICIO);
    await page.getByLabel("Categoría").selectOption({ label: "Fumigación" });
    await page.getByLabel(/Precio inicial/).fill("1000");
    await page.getByRole("button", { name: "Publicar servicio" }).click();

    await expect(page.getByText("Servicio publicado")).toBeVisible();
    const row = page.getByRole("row", { name: new RegExp(SERVICIO) });
    await expect(row).toContainText("Fumigación");
    await expect(row).toContainText("1.000,00");
    await logout(page);
  });

  test("el cliente registra un campo y solicita el servicio", async ({ page }) => {
    await login(page, USERS.cliente);

    // Campo propio
    await page.goto("/campos");
    await page.getByLabel(/Coordenadas/).fill(COORDS);
    await page.getByLabel("Hectáreas").fill("10");
    await page.getByRole("button", { name: "Registrar campo" }).click();
    await expect(page.getByText("Campo registrado")).toBeVisible();
    await expect(page.getByRole("link", { name: COORDS })).toBeVisible();

    // Buscar el servicio en el catálogo y entrar al detalle
    await page.goto("/servicios");
    await page.getByLabel("Buscar").fill(SERVICIO);
    await page.getByRole("link", { name: new RegExp(SERVICIO) }).click();
    await expect(page.getByRole("heading", { name: SERVICIO })).toBeVisible();
    await expect(page.getByText("Solicitar este servicio")).toBeVisible();

    // Solicitar: 5 hectáreas sobre el campo nuevo
    await page.getByLabel("Campo").selectOption({ label: `${COORDS} · 10 ha` });
    await page.getByLabel(/Hectáreas a trabajar/).fill("5");
    await expect(page.getByText("Total estimado").locator("..")).toContainText("5.000,00");
    await page.getByRole("button", { name: "Enviar solicitud" }).click();

    await expect(page).toHaveURL(/\/solicitudes\/\d+$/);
    solicitudId = Number(page.url().split("/").pop());
    await expect(page.getByText("Esperando respuesta del prestamista")).toBeVisible();
    await expect(page.getByText("Importes").locator("..")).toContainText("5.000,00");
    await logout(page);
  });

  test("el prestamista acepta la solicitud", async ({ page }) => {
    expect(solicitudId).toBeDefined();
    await login(page, USERS.prestamista);
    await page.goto(`/solicitudes/${solicitudId}`);

    await page.getByRole("button", { name: "Aceptar", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("El prestamista aceptó el trabajo")).toBeVisible();
    await expect(page.getByRole("button", { name: "Marcar completada" })).toBeVisible();

    // En el listado queda como aceptada
    await page.goto("/solicitudes");
    await expect(page.getByRole("row", { name: new RegExp(`#${solicitudId}`) })).toContainText("aceptada");
  });

  test("el cliente no puede cambiar el estado ni ver páginas de admin", async ({ page }) => {
    await login(page, USERS.cliente);
    await page.goto(`/solicitudes/${solicitudId}`);
    await expect(page.getByRole("button", { name: "Aceptar", exact: true })).toHaveCount(0);
    await page.goto("/admin/usuarios");
    await expect(page.getByText("No tenés permisos para ver esta página")).toBeVisible();
  });
});

test.afterAll(async ({ request }) => {
  const res = await request.post(`${API}/auth/login`, { data: USERS.admin });
  const { token } = await res.json();
  const auth = { Authorization: `Bearer ${token}` };

  if (solicitudId) await request.delete(`${API}/solicitudes/${solicitudId}`, { headers: auth });

  const servicios = await (await request.get(`${API}/servicios`, { params: { q: SERVICIO } })).json();
  for (const s of servicios) await request.delete(`${API}/servicios/${s.id_servicio}`, { headers: auth });

  const campos = await (await request.get(`${API}/campos`, { headers: auth, params: { q: COORDS } })).json();
  for (const c of campos) await request.delete(`${API}/campos/${c.id_campo}`, { headers: auth });
});
