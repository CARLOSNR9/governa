import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("--- CIUDADANOS ---");
    const citizenCount = await prisma.ciudadano.count();
    console.log(`Total citizens: ${citizenCount}`);

    const recentCitizens = await prisma.ciudadano.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { peticiones: true }
    });

    for (const c of recentCitizens) {
        console.log(`- ${c.nombres} (${c.cedula}) - Requests: ${c.peticiones.length}`);
    }

    console.log("\n--- CONTACTOS (AGENDA) ---");
    const contactCount = await prisma.contacto.count();
    console.log(`Total contacts: ${contactCount}`);

    const recentContacts = await prisma.contacto.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    for (const c of recentContacts) {
        console.log(`- ${c.nombre} (${c.cedula || 'N/A'}) - Cel: ${c.celular || 'N/A'}`);
    }
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
