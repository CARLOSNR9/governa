"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getContacts() {
    try {
        const contacts = await prisma.contacto.findMany({
            orderBy: { nombre: "asc" },
        });
        return contacts;
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return [];
    }
}

export async function createContact(formData: FormData) {
    const nombre = formData.get("nombre") as string;
    const cedula = formData.get("cedula") as string;
    const celular = formData.get("celular") as string;
    const direccion = formData.get("direccion") as string;
    const notas = formData.get("notas") as string;

    if (!nombre) {
        return { error: "El nombre es obligatorio." };
    }

    try {
        await prisma.contacto.create({
            data: {
                nombre,
                cedula: cedula || null,
                celular: celular || null,
                direccion: direccion || null,
                notas: notas || null,
            },
        });

        revalidatePath("/directorio");
        return { success: true, message: "Contacto guardado correctamente." };
    } catch (error: any) {
        console.error("Error creating contact:", error);
        if (error.code === 'P2002') {
            return { error: "Ya existe un contacto con esa cédula." };
        }
        return { error: "Error al guardar el contacto." };
    }
}

export async function updateContact(id: string, formData: FormData) {
    const nombre = formData.get("nombre") as string;
    const cedula = formData.get("cedula") as string;
    const celular = formData.get("celular") as string;
    const direccion = formData.get("direccion") as string;
    const notas = formData.get("notas") as string;

    if (!id || !nombre) {
        return { error: "El ID y el nombre son obligatorios." };
    }

    try {
        await prisma.contacto.update({
            where: { id },
            data: {
                nombre,
                cedula: cedula || null,
                celular: celular || null,
                direccion: direccion || null,
                notas: notas || null,
            },
        });

        revalidatePath("/directorio");
        return { success: true, message: "Contacto actualizado correctamente." };
    } catch (error: any) {
        console.error("Error updating contact:", error);
        if (error.code === 'P2002') {
            return { error: "Ya existe un contacto con esa cédula." };
        }
        return { error: "Error al actualizar el contacto." };
    }
}

export async function deleteContact(id: string) {
    if (!id) {
        return { error: "ID de contacto no proporcionado." };
    }

    try {
        await prisma.contacto.delete({
            where: { id },
        });

        revalidatePath("/directorio");
        return { success: true, message: "Contacto eliminado correctamente." };
    } catch (error) {
        console.error("Error deleting contact:", error);
        return { error: "Error al eliminar el contacto." };
    }
}
