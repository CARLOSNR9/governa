import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SECRET_KEY = process.env.JWT_SECRET_KEY || "super-secret-key-change-this";
const key = new TextEncoder().encode(SECRET_KEY);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h") // Session lasts 24 hours
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function login(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Verify credentials against DB
    const user = await prisma.usuario.findUnique({
        where: { email },
    });

    if (!user) {
        return { error: "Credenciales inválidas" };
    }

    // If password was stored as plain text (legacy), we might need to handle that, 
    // but for this implementation we assume hashed.
    // Ideally, use bcrypt.compare
    const passwordsMatch = await bcrypt.compare(password, user.password || "");

    // Fallback for development if you manually inserted a user without hashing:
    // const passwordsMatch = password === user.password; 

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
    "use server";
    (await cookies()).delete("session");
    redirect("/login");
}

export async function getSession() {
    const session = (await cookies()).get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
}
