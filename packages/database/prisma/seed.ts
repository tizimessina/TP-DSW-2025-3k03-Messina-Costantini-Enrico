/**
 * Seed idempotente: roles, ubicación, catálogos y datos demo del negocio.
 * Ejecutar con `pnpm db:seed` (o automáticamente tras `prisma migrate reset`).
 *
 * Credenciales demo (documentadas en docs/deploy.md):
 *   admin@agroapp.dev          / Admin123!
 *   productor@agroapp.dev      / Productor123!     (Carlos Ferreyra, Pergamino)
 *   productora2@agroapp.dev    / Productor123!     (Lucía Bianchi, Rafaela)
 *   contratista@agroapp.dev    / Contratista123!   (Pedro Molina, Venado Tuerto)
 *   contratista2@agroapp.dev   / Contratista123!   (Marta Giménez, Río Cuarto)
 *   contratista3@agroapp.dev   / Contratista123!   (Julián Sosa, Pergamino)
 */
import { PrismaClient, type solicitud_estado } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ROLES = [
  { id_role: 1, name: "ADMIN" },
  { id_role: 2, name: "PRODUCTOR" },
  { id_role: 3, name: "CONTRATISTA" },
] as const;
type RoleName = (typeof ROLES)[number]["name"];

const PROVINCIAS: Record<string, { nombre: string; codigo_postal: string }[]> = {
  "Santa Fe": [
    { nombre: "Rosario", codigo_postal: "2000" },
    { nombre: "Santa Fe", codigo_postal: "3000" },
    { nombre: "Rafaela", codigo_postal: "2300" },
    { nombre: "Venado Tuerto", codigo_postal: "2600" },
    { nombre: "Casilda", codigo_postal: "2170" },
  ],
  Córdoba: [
    { nombre: "Córdoba", codigo_postal: "5000" },
    { nombre: "Río Cuarto", codigo_postal: "5800" },
    { nombre: "Villa María", codigo_postal: "5900" },
    { nombre: "Marcos Juárez", codigo_postal: "2580" },
  ],
  "Buenos Aires": [
    { nombre: "La Plata", codigo_postal: "1900" },
    { nombre: "Pergamino", codigo_postal: "2700" },
    { nombre: "Junín", codigo_postal: "6000" },
    { nombre: "Tandil", codigo_postal: "7000" },
  ],
};

const CATEGORIAS = [
  { nombre: "Siembra", descripcion: "Siembra directa y convencional" },
  { nombre: "Cosecha", descripcion: "Cosecha de granos y forrajes" },
  { nombre: "Pulverización", descripcion: "Aplicación de agroquímicos terrestre" },
  { nombre: "Fertilización", descripcion: "Aplicación de fertilizantes sólidos y líquidos" },
  { nombre: "Laboreo", descripcion: "Rastra, cincel y preparación de suelo" },
  { nombre: "Confección de forraje", descripcion: "Rollos, fardos y silo" },
];

const INSUMOS = [
  { nombre: "Semilla de soja", descripcion: "Bolsa de 40 kg", unidad: "bolsa", precio_referencia: 38000 },
  { nombre: "Semilla de maíz", descripcion: "Bolsa de 80.000 semillas", unidad: "bolsa", precio_referencia: 165000 },
  { nombre: "Semilla de trigo", descripcion: "Bolsa de 40 kg", unidad: "bolsa", precio_referencia: 24000 },
  { nombre: "Glifosato", descripcion: "Herbicida, bidón de 20 L", unidad: "bidón", precio_referencia: 42000 },
  { nombre: "Urea", descripcion: "Fertilizante nitrogenado granulado", unidad: "tonelada", precio_referencia: 620000 },
  { nombre: "Fosfato diamónico", descripcion: "Fertilizante fosforado", unidad: "tonelada", precio_referencia: 890000 },
  { nombre: "Gasoil", descripcion: "Combustible", unidad: "litro", precio_referencia: 1250 },
];

type DemoUser = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  roles: RoleName[];
  localidad: string;
  domicilio: string;
  telefono: string;
  cuil_cuit: string;
  productor?: { razon_social?: string };
  contratista?: { descripcion: string; anios_experiencia: number };
};

const USERS: DemoUser[] = [
  {
    email: "admin@agroapp.dev", password: "Admin123!", nombre: "Ana", apellido: "Administradora", roles: ["ADMIN"],
    localidad: "Rosario", domicilio: "Zeballos 1341", telefono: "341-4000000", cuil_cuit: "27-30111222-3",
  },
  {
    email: "productor@agroapp.dev", password: "Productor123!", nombre: "Carlos", apellido: "Ferreyra", roles: ["PRODUCTOR"],
    localidad: "Pergamino", domicilio: "Ruta 8 km 60", telefono: "2477-410000", cuil_cuit: "20-28333444-5",
    productor: { razon_social: "Establecimiento La Esperanza" },
  },
  {
    email: "productora2@agroapp.dev", password: "Productor123!", nombre: "Lucía", apellido: "Bianchi", roles: ["PRODUCTOR"],
    localidad: "Rafaela", domicilio: "Bv. Santa Fe 220", telefono: "3492-420000", cuil_cuit: "27-31222333-4",
    productor: { razon_social: "Agropecuaria Bianchi Hnos." },
  },
  {
    email: "contratista@agroapp.dev", password: "Contratista123!", nombre: "Pedro", apellido: "Molina", roles: ["CONTRATISTA"],
    localidad: "Venado Tuerto", domicilio: "Av. Casey 850", telefono: "3462-430000", cuil_cuit: "20-25555666-7",
    contratista: { descripcion: "Siembra directa y cosecha con equipos John Deere de última generación. Trabajamos en el sur de Santa Fe y norte de Buenos Aires.", anios_experiencia: 15 },
  },
  {
    email: "contratista2@agroapp.dev", password: "Contratista123!", nombre: "Marta", apellido: "Giménez", roles: ["CONTRATISTA"],
    localidad: "Río Cuarto", domicilio: "Sobremonte 1500", telefono: "358-4600000", cuil_cuit: "27-26666777-8",
    contratista: { descripcion: "Pulverizaciones terrestres con pulverizadora autopropulsada y fertilización variable.", anios_experiencia: 9 },
  },
  {
    email: "contratista3@agroapp.dev", password: "Contratista123!", nombre: "Julián", apellido: "Sosa", roles: ["CONTRATISTA"],
    localidad: "Pergamino", domicilio: "Av. de Mayo 980", telefono: "2477-440000", cuil_cuit: "20-33444555-6",
    contratista: { descripcion: "Laboreo, siembra y confección de rollos. Atención a pequeños y medianos productores.", anios_experiencia: 6 },
  },
];

async function seedRoles() {
  for (const r of ROLES) {
    await prisma.roles.upsert({ where: { id_role: r.id_role }, update: { name: r.name }, create: r });
  }
  console.log(`✔ roles (${ROLES.length})`);
}

async function seedGeografia() {
  const localidades = new Map<string, bigint>(); // "Provincia/Localidad" → id
  let count = 0;
  for (const [provNombre, locs] of Object.entries(PROVINCIAS)) {
    const prov = await prisma.provincia.upsert({ where: { nombre: provNombre }, update: {}, create: { nombre: provNombre } });
    for (const l of locs) {
      const loc = await prisma.localidad.upsert({
        where: { id_provincia_nombre: { id_provincia: prov.id_provincia, nombre: l.nombre } },
        update: { codigo_postal: l.codigo_postal },
        create: { id_provincia: prov.id_provincia, nombre: l.nombre, codigo_postal: l.codigo_postal },
      });
      localidades.set(l.nombre, loc.id_localidad);
      count++;
    }
  }
  console.log(`✔ provincias (${Object.keys(PROVINCIAS).length}) y localidades (${count})`);
  return localidades;
}

async function seedCatalogos() {
  const categorias = new Map<string, bigint>();
  for (const c of CATEGORIAS) {
    const row = await prisma.categoria.upsert({ where: { nombre: c.nombre }, update: { descripcion: c.descripcion }, create: c });
    categorias.set(c.nombre, row.id_categoria);
  }
  const insumos = new Map<string, bigint>();
  for (const i of INSUMOS) {
    const row = await prisma.insumo.upsert({
      where: { nombre: i.nombre },
      update: { descripcion: i.descripcion, unidad: i.unidad, precio_referencia: i.precio_referencia },
      create: i,
    });
    insumos.set(i.nombre, row.id_insumo);
  }
  console.log(`✔ categorías (${categorias.size}) e insumos (${insumos.size})`);
  return { categorias, insumos };
}

async function seedUsuarios(localidades: Map<string, bigint>) {
  const ids = new Map<string, bigint>();
  for (const u of USERS) {
    const password_hash = await bcrypt.hash(u.password, 10);
    const data = {
      nombre: u.nombre, apellido: u.apellido, domicilio: u.domicilio, telefono: u.telefono,
      cuil_cuit: u.cuil_cuit, id_localidad: localidades.get(u.localidad) ?? null,
    };
    const user = await prisma.users.upsert({
      where: { email: u.email },
      update: data,
      create: { email: u.email, password_hash, ...data },
    });
    ids.set(u.email, user.id_user);

    const roleIds = ROLES.filter((r) => u.roles.includes(r.name)).map((r) => r.id_role);
    await prisma.user_roles.deleteMany({ where: { id_user: user.id_user } });
    await prisma.user_roles.createMany({ data: roleIds.map((id_role) => ({ id_user: user.id_user, id_role })) });

    if (u.roles.includes("PRODUCTOR")) {
      await prisma.productor_profile.upsert({
        where: { id_user: user.id_user },
        update: { razon_social: u.productor?.razon_social ?? null },
        create: { id_user: user.id_user, razon_social: u.productor?.razon_social ?? null },
      });
    }
    if (u.roles.includes("CONTRATISTA")) {
      await prisma.contratista_profile.upsert({
        where: { id_user: user.id_user },
        update: { descripcion: u.contratista?.descripcion, anios_experiencia: u.contratista?.anios_experiencia },
        create: { id_user: user.id_user, descripcion: u.contratista?.descripcion, anios_experiencia: u.contratista?.anios_experiencia },
      });
    }
  }
  console.log(`✔ usuarios demo (${USERS.length})`);
  return ids;
}

/** Fecha civil (YYYY-MM-DD) como Date UTC a medianoche, que es como Prisma guarda @db.Date. */
const civil = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return civil(d.toISOString().slice(0, 10));
};

async function seedNegocio(ids: Map<string, bigint>, localidades: Map<string, bigint>, categorias: Map<string, bigint>, insumos: Map<string, bigint>) {
  const carlos = ids.get("productor@agroapp.dev")!;
  const lucia = ids.get("productora2@agroapp.dev")!;
  const pedro = ids.get("contratista@agroapp.dev")!;
  const marta = ids.get("contratista2@agroapp.dev")!;
  const julian = ids.get("contratista3@agroapp.dev")!;

  // Campos (coordenadas reales aproximadas de la zona)
  const campos = [
    { id_productor: carlos, nombre: "La Esperanza – Lote 1", localidad: "Pergamino", hectareas: 120.5, latitud: -33.8912, longitud: -60.5731 },
    { id_productor: carlos, nombre: "La Esperanza – Lote 2", localidad: "Pergamino", hectareas: 85, latitud: -33.9105, longitud: -60.6012 },
    { id_productor: lucia, nombre: "Campo Bianchi", localidad: "Rafaela", hectareas: 210, latitud: -31.2503, longitud: -61.4867 },
  ];
  const campoIds: bigint[] = [];
  for (const c of campos) {
    let row = await prisma.campo.findFirst({ where: { id_productor: c.id_productor, nombre: c.nombre } });
    const data = { id_localidad: localidades.get(c.localidad)!, hectareas: c.hectareas, latitud: c.latitud, longitud: c.longitud };
    row = row
      ? await prisma.campo.update({ where: { id_campo: row.id_campo }, data })
      : await prisma.campo.create({ data: { id_productor: c.id_productor, nombre: c.nombre, ...data } });
    campoIds.push(row.id_campo);
  }

  // Servicios con precio (histórico + vigente)
  const servicios = [
    { c: pedro, nombre: "Siembra directa de soja", categoria: "Siembra", precios: [[daysAgo(200), 38000], [daysAgo(30), 45000]] },
    { c: pedro, nombre: "Cosecha de maíz", categoria: "Cosecha", precios: [[daysAgo(90), 60000]] },
    { c: pedro, nombre: "Cosecha de soja", categoria: "Cosecha", precios: [[daysAgo(90), 55000]] },
    { c: marta, nombre: "Pulverización terrestre", categoria: "Pulverización", precios: [[daysAgo(60), 12000]] },
    { c: marta, nombre: "Fertilización sólida al voleo", categoria: "Fertilización", precios: [[daysAgo(60), 9500]] },
    { c: julian, nombre: "Laboreo con cincel", categoria: "Laboreo", precios: [[daysAgo(120), 21000]] },
    { c: julian, nombre: "Confección de rollos", categoria: "Confección de forraje", precios: [[daysAgo(45), 30000]] },
    { c: julian, nombre: "Siembra de trigo", categoria: "Siembra", precios: [] }, // sin precio: no solicitable
  ] as const;
  const servicioIds = new Map<string, bigint>();
  for (const s of servicios) {
    let row = await prisma.servicio.findFirst({ where: { nombre: s.nombre, id_contratista: s.c } });
    if (!row) {
      row = await prisma.servicio.create({
        data: { nombre: s.nombre, descripcion: `${s.nombre}. Precio por hectárea, incluye combustible y operario.`, id_categoria: categorias.get(s.categoria)!, id_contratista: s.c },
      });
    }
    for (const [fecha, valor] of s.precios) {
      await prisma.precio.upsert({
        where: { id_servicio_fecha_desde: { id_servicio: row.id_servicio, fecha_desde: fecha as Date } },
        update: { valor: valor as number },
        create: { id_servicio: row.id_servicio, fecha_desde: fecha as Date, valor: valor as number },
      });
    }
    servicioIds.set(s.nombre, row.id_servicio);
  }

  // Solicitudes en distintos estados (solo si no hay ninguna todavía)
  const existentes = await prisma.solicitud.count();
  if (existentes === 0) {
    const mk = async (o: {
      servicio: string; productor: bigint; contratista: bigint; campo: bigint; ha: number; estado: solicitud_estado;
      inicio?: Date; fin?: Date; motivo?: string; insumos?: { nombre: string; cantidad: number; proveedor: "PRODUCTOR" | "CONTRATISTA" }[]; valoracion?: { puntaje: number; comentario: string };
    }) => {
      const id_servicio = servicioIds.get(o.servicio)!;
      const precio = await prisma.precio.findFirst({ where: { id_servicio, fecha_desde: { lte: new Date() } }, orderBy: { fecha_desde: "desc" } });
      const precio_hectarea = Number(precio!.valor);
      const precio_servicio = Math.round(precio_hectarea * o.ha * 100) / 100;
      const rows = (o.insumos ?? []).map((i) => {
        const ref = INSUMOS.find((x) => x.nombre === i.nombre)!;
        return { id_insumo: insumos.get(i.nombre)!, cantidad: i.cantidad, proveedor: i.proveedor, precio_unit: i.proveedor === "CONTRATISTA" ? ref.precio_referencia : 0 };
      });
      const costo_insumos = rows.reduce((a, r) => a + r.cantidad * r.precio_unit, 0);
      await prisma.solicitud.create({
        data: {
          id_servicio, id_productor: o.productor, id_contratista: o.contratista, id_campo: o.campo,
          hectareas_trabajadas: o.ha, precio_hectarea, precio_servicio, costo_insumos, precio_total: precio_servicio + costo_insumos,
          estado: o.estado, fecha_inicio: o.inicio ?? null, fecha_fin: o.fin ?? null, motivo: o.motivo ?? null,
          solicitud_insumo: { create: rows },
          ...(o.valoracion ? { valoracion: { create: o.valoracion } } : {}),
        },
      });
    };

    await mk({ servicio: "Siembra directa de soja", productor: carlos, contratista: pedro, campo: campoIds[0], ha: 50, estado: "pendiente",
      insumos: [{ nombre: "Semilla de soja", cantidad: 40, proveedor: "CONTRATISTA" }, { nombre: "Gasoil", cantidad: 300, proveedor: "PRODUCTOR" }] });
    await mk({ servicio: "Cosecha de maíz", productor: carlos, contratista: pedro, campo: campoIds[1], ha: 85, estado: "aceptada", inicio: daysAgo(-7) });
    await mk({ servicio: "Laboreo con cincel", productor: carlos, contratista: julian, campo: campoIds[0], ha: 120.5, estado: "completada", inicio: daysAgo(40), fin: daysAgo(36),
      valoracion: { puntaje: 5, comentario: "Excelente trabajo, puntual y prolijo." } });
    await mk({ servicio: "Pulverización terrestre", productor: lucia, contratista: marta, campo: campoIds[2], ha: 210, estado: "completada", inicio: daysAgo(20), fin: daysAgo(19),
      insumos: [{ nombre: "Glifosato", cantidad: 25, proveedor: "CONTRATISTA" }], valoracion: { puntaje: 4, comentario: "Muy buena aplicación, llegó un día tarde." } });
    await mk({ servicio: "Confección de rollos", productor: lucia, contratista: julian, campo: campoIds[2], ha: 60, estado: "rechazada", motivo: "No tengo disponibilidad en esa fecha." });
    await mk({ servicio: "Cosecha de soja", productor: lucia, contratista: pedro, campo: campoIds[2], ha: 100, estado: "cancelada", motivo: "Se adelantó la cosecha con equipo propio." });
  }
  console.log(`✔ campos (${campos.length}), servicios (${servicios.length}) y solicitudes demo`);
}

async function main() {
  await seedRoles();
  const localidades = await seedGeografia();
  const { categorias, insumos } = await seedCatalogos();
  const ids = await seedUsuarios(localidades);
  await seedNegocio(ids, localidades, categorias, insumos);
}

main()
  .then(() => console.log("Seed completado."))
  .catch((e) => {
    console.error("Seed falló:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
