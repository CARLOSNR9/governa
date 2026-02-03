import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
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

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
