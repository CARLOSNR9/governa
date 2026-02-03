import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = "admin@governa.com";
    const password = await bcrypt.hash("admin123", 10);

    const user = await prisma.usuario.upsert({
        where: { email },
        update: {
            password: password,
            rol: "ADMIN"
        },
        create: {
            email,
            nombre: "Administrador Governa",
            password,
            rol: "ADMIN",
        },
    });

    console.log("Admin user seeded:", user);
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
