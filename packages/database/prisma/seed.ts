/**
 * Seed idempotente: roles, catálogos y usuarios demo.
 * Ejecutar con `pnpm --filter @repo/db db:seed` (o automáticamente tras `prisma migrate reset`).
 *
 * Credenciales demo (también documentadas en docs/deploy.md):
 *   admin@agroapp.dev        / Admin123!
 *   cliente@agroapp.dev      / Cliente123!
 *   prestamista@agroapp.dev  / Prestamista123!
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ROLES = [
  { id_role: 1, name: "ADMIN" },
  { id_role: 2, name: "CLIENTE" },
  { id_role: 3, name: "PRESTAMISTA" },
] as const;

const PROVINCIAS: Record<string, { nombre: string; codigo_postal: string }[]> = {
  "Santa Fe": [
    { nombre: "Rosario", codigo_postal: "2000" },
    { nombre: "Santa Fe", codigo_postal: "3000" },
    { nombre: "Rafaela", codigo_postal: "2300" },
    { nombre: "Venado Tuerto", codigo_postal: "2600" },
  ],
  Córdoba: [
    { nombre: "Córdoba", codigo_postal: "5000" },
    { nombre: "Río Cuarto", codigo_postal: "5800" },
    { nombre: "Villa María", codigo_postal: "5900" },
  ],
  "Buenos Aires": [
    { nombre: "La Plata", codigo_postal: "1900" },
    { nombre: "Pergamino", codigo_postal: "2700" },
    { nombre: "Junín", codigo_postal: "6000" },
  ],
};

const CATEGORIAS = [
  { nombre: "Siembra", descripcion: "Siembra directa y convencional" },
  { nombre: "Cosecha", descripcion: "Cosecha de granos y forrajes" },
  { nombre: "Fumigación", descripcion: "Aplicación de agroquímicos terrestre" },
  { nombre: "Fertilización", descripcion: "Aplicación de fertilizantes" },
  { nombre: "Laboreo", descripcion: "Rastra, cincel y preparación de suelo" },
];

const INSUMOS = [
  { nombre: "Semilla de soja", descripcion: "Bolsa de 40 kg" },
  { nombre: "Semilla de maíz", descripcion: "Bolsa de 80.000 semillas" },
  { nombre: "Glifosato", descripcion: "Herbicida, bidón de 20 L" },
  { nombre: "Urea", descripcion: "Fertilizante nitrogenado, tonelada" },
  { nombre: "Gasoil", descripcion: "Combustible, litro" },
];

async function seedRoles() {
  for (const r of ROLES) {
    await prisma.roles.upsert({
      where: { id_role: r.id_role },
      update: { name: r.name },
      create: r,
    });
  }
  console.log(`✔ roles (${ROLES.length})`);
}

async function seedGeografia() {
  const localidades = new Map<string, bigint>();
  for (const [provNombre, locs] of Object.entries(PROVINCIAS)) {
    const prov = await prisma.provincia.upsert({
      where: { nombre: provNombre },
      update: {},
      create: { nombre: provNombre },
    });
    for (const l of locs) {
      const loc = await prisma.localidad.upsert({
        where: { id_provincia_nombre: { id_provincia: prov.id_provincia, nombre: l.nombre } },
        update: { codigo_postal: l.codigo_postal },
        create: { id_provincia: prov.id_provincia, nombre: l.nombre, codigo_postal: l.codigo_postal },
      });
      localidades.set(l.nombre, loc.id_localidad);
    }
  }
  console.log(`✔ provincias (${Object.keys(PROVINCIAS).length}) y localidades (${localidades.size})`);
  return localidades;
}

async function seedCatalogos() {
  const categorias = new Map<string, bigint>();
  for (const c of CATEGORIAS) {
    const row = await prisma.categoria.upsert({
      where: { nombre: c.nombre },
      update: { descripcion: c.descripcion },
      create: c,
    });
    categorias.set(c.nombre, row.id_categoria);
  }
  const insumos = new Map<string, bigint>();
  for (const i of INSUMOS) {
    const row = await prisma.insumo.upsert({
      where: { nombre: i.nombre },
      update: { descripcion: i.descripcion },
      create: i,
    });
    insumos.set(i.nombre, row.id_insumo);
  }
  console.log(`✔ categorías (${categorias.size}) e insumos (${insumos.size})`);
  return { categorias, insumos };
}

type DemoUser = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  roles: (typeof ROLES)[number]["name"][];
  localidad: string;
  domicilio: string;
  cuil_cuit: string;
};

async function seedUsuario(u: DemoUser, localidades: Map<string, bigint>) {
  const password_hash = await bcrypt.hash(u.password, 10);
  const user = await prisma.users.upsert({
    where: { email: u.email },
    update: {
      nombre: u.nombre,
      apellido: u.apellido,
      domicilio: u.domicilio,
      cuil_cuit: u.cuil_cuit,
      id_localidad: localidades.get(u.localidad) ?? null,
    },
    create: {
      email: u.email,
      password_hash,
      nombre: u.nombre,
      apellido: u.apellido,
      domicilio: u.domicilio,
      cuil_cuit: u.cuil_cuit,
      id_localidad: localidades.get(u.localidad) ?? null,
    },
  });

  const roleIds = ROLES.filter((r) => u.roles.includes(r.name)).map((r) => r.id_role);
  await prisma.user_roles.deleteMany({ where: { id_user: user.id_user } });
  await prisma.user_roles.createMany({
    data: roleIds.map((id_role) => ({ id_user: user.id_user, id_role })),
    skipDuplicates: true,
  });

  if (u.roles.includes("ADMIN")) {
    await prisma.admin_profile.upsert({
      where: { id_user: user.id_user },
      update: {},
      create: { id_user: user.id_user },
    });
  }
  if (u.roles.includes("CLIENTE")) {
    await prisma.cliente_profile.upsert({
      where: { id_user: user.id_user },
      update: { cuit: u.cuil_cuit },
      create: { id_user: user.id_user, cuit: u.cuil_cuit },
    });
  }
  if (u.roles.includes("PRESTAMISTA")) {
    await prisma.prestamista_profile.upsert({
      where: { id_user: user.id_user },
      update: { cuit: u.cuil_cuit },
      create: { id_user: user.id_user, cuit: u.cuil_cuit },
    });
  }
  return user;
}

async function seedUsuarios(localidades: Map<string, bigint>) {
  const admin = await seedUsuario(
    {
      email: "admin@agroapp.dev",
      password: "Admin123!",
      nombre: "Ana",
      apellido: "Administradora",
      roles: ["ADMIN"],
      localidad: "Rosario",
      domicilio: "Zeballos 1341",
      cuil_cuit: "27-30111222-3",
    },
    localidades,
  );
  const cliente = await seedUsuario(
    {
      email: "cliente@agroapp.dev",
      password: "Cliente123!",
      nombre: "Carlos",
      apellido: "Productor",
      roles: ["CLIENTE"],
      localidad: "Pergamino",
      domicilio: "Ruta 8 km 60",
      cuil_cuit: "20-28333444-5",
    },
    localidades,
  );
  const prestamista = await seedUsuario(
    {
      email: "prestamista@agroapp.dev",
      password: "Prestamista123!",
      nombre: "Pedro",
      apellido: "Contratista",
      roles: ["PRESTAMISTA"],
      localidad: "Venado Tuerto",
      domicilio: "Av. Casey 850",
      cuil_cuit: "20-25555666-7",
    },
    localidades,
  );
  console.log("✔ usuarios demo (admin, cliente, prestamista)");
  return { admin, cliente, prestamista };
}

async function seedNegocio(
  cliente: { id_user: bigint },
  prestamista: { id_user: bigint },
  categorias: Map<string, bigint>,
  insumos: Map<string, bigint>,
) {
  // Campo del cliente
  let campo = await prisma.campo.findFirst({ where: { id_cliente: cliente.id_user } });
  if (!campo) {
    campo = await prisma.campo.create({
      data: { id_cliente: cliente.id_user, coordenadas: "-33.8912, -60.5731", hectareas: 120.5 },
    });
  }

  // Servicios del prestamista con precio vigente
  const serviciosDemo = [
    { nombre: "Siembra directa de soja", categoria: "Siembra", valor: 45000 },
    { nombre: "Cosecha de maíz", categoria: "Cosecha", valor: 60000 },
    { nombre: "Fumigación terrestre", categoria: "Fumigación", valor: 12000 },
  ];
  const servicios: { id_servicio: bigint }[] = [];
  for (const s of serviciosDemo) {
    let servicio = await prisma.servicio.findFirst({
      where: { nombre: s.nombre, id_prestamista: prestamista.id_user },
    });
    if (!servicio) {
      servicio = await prisma.servicio.create({
        data: {
          nombre: s.nombre,
          descripcion: `${s.nombre} (precio por hectárea)`,
          id_categoria: categorias.get(s.categoria)!,
          id_prestamista: prestamista.id_user,
        },
      });
    }
    await prisma.precio.upsert({
      where: { id_servicio_fecha_desde: { id_servicio: servicio.id_servicio, fecha_desde: new Date("2026-01-01") } },
      update: { valor: s.valor },
      create: { id_servicio: servicio.id_servicio, fecha_desde: new Date("2026-01-01"), valor: s.valor },
    });
    servicios.push(servicio);
  }

  // Una solicitud pendiente de ejemplo con un insumo
  const existente = await prisma.solicitud.findFirst({ where: { id_cliente: cliente.id_user } });
  if (!existente) {
    const hectareas = 50;
    const precioServicio = 45000 * hectareas;
    const insumoCant = 40;
    const insumoPrecio = 38000;
    const costoInsumos = insumoCant * insumoPrecio;
    await prisma.solicitud.create({
      data: {
        id_servicio: servicios[0].id_servicio,
        id_cliente: cliente.id_user,
        id_prestamista: prestamista.id_user,
        id_campo: campo.id_campo,
        hectareas_trabajadas: hectareas,
        precio_servicio: precioServicio,
        costo_insumos: costoInsumos,
        precio_total: precioServicio + costoInsumos,
        estado: "pendiente",
        solicitud_insumo: {
          create: [
            {
              id_insumo: insumos.get("Semilla de soja")!,
              cantidad: insumoCant,
              precio_unit: insumoPrecio,
              proveedor: "PRESTAMISTA",
            },
          ],
        },
      },
    });
  }
  console.log("✔ campo, servicios con precio y solicitud demo");
}

async function main() {
  await seedRoles();
  const localidades = await seedGeografia();
  const { categorias, insumos } = await seedCatalogos();
  const { cliente, prestamista } = await seedUsuarios(localidades);
  await seedNegocio(cliente, prestamista, categorias, insumos);
}

main()
  .then(() => console.log("Seed completado."))
  .catch((e) => {
    console.error("Seed falló:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
