"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Verify credentials against DB
    const user = await prisma.usuario.findUnique({
        where: { email },
    });

    if (!user) {
        return { error: "Credenciales inválidas" };
    }

    // Ideally, use bcrypt.compare
    const passwordsMatch = await bcrypt.compare(password, user.password || "");

    if (!passwordsMatch) {
        return { error: "Credenciales inválidas" };
    }

    // 2. Create Session
    const session = await encrypt({ user: { id: user.id, email: user.email, name: user.nombre, role: user.rol } });

    // 3. Set Cookie
    (await cookies()).set("session", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        path: "/",
    });

    redirect("/");
}

export async function logout() {
    (await cookies()).delete("session");
    redirect("/login");
}
