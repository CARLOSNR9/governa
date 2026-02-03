import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "carlosnr9@gmail.com";
    const password = await bcrypt.hash("Linares33*", 10);

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

    console.log({ user });
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
