"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const prisma = new PrismaClient();

const citizenSchema = z.object({
    cedula: z.string().min(3, "La cédula es requerida"),
    nombres: z.string().min(1, "El nombre es requerido"),
    vereda: z.string().min(1, "La vereda es requerida"),
    telefono: z.string().optional(),
    asunto: z.string().min(1, "El asunto inicial es requerido"),
});

export async function createCitizenWithPetition(formData: FormData) {
    const rawData = {
        cedula: formData.get("cedula"),
        nombres: formData.get("nombres"),
        vereda: formData.get("vereda"),
        telefono: formData.get("telefono"),
        asunto: formData.get("asunto"),
    };

    const validatedFields = citizenSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Datos inválidos. Por favor revise el formulario." };
    }

    const { cedula, nombres, vereda, telefono, asunto } = validatedFields.data;

    try {
        // Check if citizen exists, if not create, if yes update
        let citizen = await prisma.ciudadano.findUnique({
            where: { cedula },
        });

        if (!citizen) {
            citizen = await prisma.ciudadano.create({
                data: {
                    cedula,
                    nombres,
                    vereda,
                    telefono,
                },
            });
        } else {
            // Update contact info if provided
            await prisma.ciudadano.update({
                where: { id: citizen.id },
                data: {
                    // Only update if not empty, or keep existing
                    nombres: nombres || citizen.nombres,
                    telefono: telefono || citizen.telefono,
                    vereda: vereda || citizen.vereda,
                },
            });
        }

        // Create the petition
        await prisma.peticion.create({
            data: {
                ciudadanoId: citizen.id,
                asunto: asunto,
                estado: "PENDIENTE",
            },
        });

        revalidatePath("/crm");
        return { success: true, message: "Ciudadano y petición registrados exitosamente." };
    } catch (error) {
        console.error("Error creating citizen record:", error);
        return { error: "Error de base de datos. Intente nuevamente." };
    }
}

export async function getRecentCitizens() {
    try {
        const citizens = await prisma.ciudadano.findMany({
            orderBy: { updatedAt: "desc" },
            take: 20,
            include: {
                peticiones: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });
        return citizens;
    } catch (error) {
        console.error("Error fetching citizens:", error);
        return [];
    }
}

export async function getStats() {
    try {
        const totalCitizens = await prisma.ciudadano.count();
        const pendingPetitions = await prisma.peticion.count({
            where: { estado: "PENDIENTE" }
        });

        // Group by Vereda for the map/stats
        const byVereda = await prisma.ciudadano.groupBy({
            by: ['vereda'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 5
        });

        return {
            totalCitizens,
            pendingPetitions,
            byVereda
        };
    } catch (error) {
        return {
            totalCitizens: 0,
            pendingPetitions: 0,
            byVereda: []
        };
    }
}

export async function updateCitizen(formData: FormData) {
    const id = formData.get("id") as string;
    const nombres = formData.get("nombres") as string;
    const vereda = formData.get("vereda") as string;
    const telefono = formData.get("telefono") as string;

    if (!id || !nombres || !vereda) {
        return { error: "Faltan datos requeridos" };
    }

    try {
        await prisma.ciudadano.update({
            where: { id },
            data: {
                nombres,
                vereda,
                telefono
            }
        });
        revalidatePath("/crm");
        return { success: true, message: "Ciudadano actualizado correctamente" };
    } catch (error) {
        console.error("Error updating citizen:", error);
        return { error: "Error al actualizar ciudadano" };
    }
}

export async function deleteCitizen(id: string) {
    if (!id) return { error: "ID requerido" };

    try {
        await prisma.ciudadano.delete({
            where: { id }
        });
        revalidatePath("/crm");
        return { success: true, message: "Ciudadano eliminado correctamente" };
    } catch (error) {
        console.error("Error deleting citizen:", error);
        return { error: "Error al eliminar ciudadano" };
    }
}
