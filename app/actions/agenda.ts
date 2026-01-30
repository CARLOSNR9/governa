"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getUpcomingMeetings() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const meetings = await prisma.reunion.findMany({
            where: {
                fecha: {
                    gte: today, // Future or today meetings
                },
            },
            orderBy: {
                fecha: "asc",
            },
            take: 10,
        });
        return meetings;
    } catch (error) {
        console.error("Error fetching meetings:", error);
        return [];
    }
}

export async function createMeeting(formData: FormData) {
    const titulo = formData.get("titulo") as string;
    const fechaStr = formData.get("fecha") as string;
    const horaStr = formData.get("hora") as string;

    if (!titulo || !fechaStr || !horaStr) {
        return { error: "Todos los campos son obligatorios" };
    }

    try {
        // Combine date and time
        const [year, month, day] = fechaStr.split("-").map(Number);
        const [hours, minutes] = horaStr.split(":").map(Number);
        const fecha = new Date(year, month - 1, day, hours, minutes);

        await prisma.reunion.create({
            data: {
                titulo,
                fecha,
            },
        });

        revalidatePath("/agenda");
        return { success: true, message: "Reunión agendada exitosamente." };
    } catch (error) {
        console.error("Error creating meeting:", error);
        return { error: "Error al agendar la reunión." };
    }
}

export async function getMoralSupport() {
    // Mock "Ayuda Moral" / Contextual Intelligence
    // In a real app, this would check previous meetings with similar topics or people
    return [
        {
            tipo: "recordatorio",
            mensaje: "No olvides mencionar el tema de las vías en la reunión con Infraestructura.",
            prioridad: "alta"
        },
        {
            tipo: "contexto",
            mensaje: "La última vez que te reuniste con el Alcalde, quedó pendiente el presupuesto de Cultura.",
            prioridad: "media"
        }
    ];
}
