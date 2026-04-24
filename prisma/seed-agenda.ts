import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const records = [
  {
    cedula: "1004599005",
    telefono: "3151124229",
    nombres: "LUIS FELIPE MORA SOLARTE",
    vereda: "-",
    solicitud: "Registro general",
  },
  {
    cedula: "98145051",
    telefono: "3234613496",
    nombres: "CARLOS HERNAN JURADO RUALES",
    vereda: "Tambillo",
    solicitud: "Citador",
  },
  {
    cedula: "98146273",
    telefono: "3218821424",
    nombres: "JOSE RICARDO CALVACHE",
    vereda: "Tabiles",
    solicitud: "Citador",
  },
  {
    cedula: "98145550",
    telefono: "3172776721",
    nombres: "JOSE GERARDO MELO",
    vereda: "Bellavista",
    solicitud: "Citador",
  },
  {
    cedula: "30712070",
    telefono: "3164986846",
    nombres: "MARIA AURELIZA ANDRADE JIMENEZ",
    vereda: "Divino Niño",
    solicitud: "Apoyo / Gestión",
  },
  {
    cedula: "1087046106",
    telefono: "3136734050",
    nombres: "MODESTO SOLARTE ERAZO",
    vereda: "Tambillo Bravos",
    solicitud: "Registro / Gestión",
  },
  {
    cedula: null,
    telefono: "3146513068",
    nombres: "DAVID RUIZ BASTANE",
    vereda: "Llanogrande Bajo",
    solicitud: "Mejoramiento de baño",
  },
  {
    cedula: null,
    telefono: "3113634570",
    nombres: "PATRICIA LOPEZ",
    vereda: "Llanogrande Alto",
    solicitud: "Maquinaria",
  },
  {
    cedula: null,
    telefono: "3106915285",
    nombres: "BISMAR DANILO ERASO",
    vereda: "San Francisco",
    solicitud: "Ruta Vendeahuja / Palma",
  },
  {
    cedula: null,
    telefono: "3217000637",
    nombres: "RUTH MARGARET MUÑOZ",
    vereda: "Llanogrande",
    solicitud: "Citadora",
  },
  {
    cedula: null,
    telefono: "3135166348",
    nombres: "HERNAN AUDELO PORTILLO",
    vereda: "-",
    solicitud: "Trabajo",
  },
  {
    cedula: null,
    telefono: "3122173907",
    nombres: "LUIS ANTONIO PEREZ",
    vereda: "-",
    solicitud: "Transporte Alto de Aranda",
  },
];

async function main() {
  console.log(`Start seeding ${records.length} records...`);

  for (const record of records) {
    let cedulaToUse = record.cedula;

    if (!cedulaToUse) {
      const uniqueSuffix = Math.random().toString(36).substring(7);
      cedulaToUse = `SIN-CEDULA-${Date.now()}-${uniqueSuffix}`;
    }

    // 1. Upsert Citizen
    const ciudadano = await prisma.ciudadano.upsert({
      where: { cedula: cedulaToUse },
      update: {
        nombres: record.nombres,
        vereda: record.vereda,
        telefono: record.telefono,
      },
      create: {
        cedula: cedulaToUse,
        nombres: record.nombres,
        vereda: record.vereda,
        telefono: record.telefono,
      },
    });

    console.log(`Processed citizen: ${ciudadano.nombres} (${ciudadano.cedula})`);

    // 2. Create Petition linked to Citizen
    await prisma.peticion.create({
      data: {
        asunto: record.solicitud,
        estado: "PENDIENTE",
        ciudadanoId: ciudadano.id,
      },
    });

    // 3. Upsert Contact (Agenda) - NEW
    const contacto = await prisma.contacto.upsert({
      where: { cedula: record.cedula || cedulaToUse },
      update: {
        nombre: record.nombres,
        celular: record.telefono,
        direccion: record.vereda,
        notas: record.solicitud,
      },
      create: {
        nombre: record.nombres,
        cedula: record.cedula || cedulaToUse,
        celular: record.telefono,
        direccion: record.vereda,
        notas: record.solicitud,
      },
    });

    console.log(`Processed contact: ${contacto.nombre} (${contacto.cedula})`);
  }

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
