"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// const prisma = new PrismaClient(); removed

export async function getUpcomingMeetings() {
    try {
        // Allow fetching meetings from Feb 1, 2026 as per user request
        const startDate = new Date(2026, 1, 1); // Month is 0-indexed (1 = February)
        startDate.setHours(0, 0, 0, 0);

        const meetings = await prisma.reunion.findMany({
            where: {
                fecha: {
                    gte: startDate,
                },
            },
            orderBy: {
                fecha: "asc",
            },
            take: 100,
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

        // Force GMT-5 (Colombia time) construction to avoid server timezone issues
        // Create an ISO string: YYYY-MM-DDTHH:mm:00-05:00
        const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`;
        const fecha = new Date(isoString);

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
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch today's meetings to give context
        const meetings = await prisma.reunion.findMany({
            where: {
                fecha: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // End of today
                },
            },
            select: { titulo: true, fecha: true },
        });

        if (meetings.length === 0) {
            return [{
                tipo: "general",
                mensaje: "Hoy no tienes reuniones programadas. Es un buen día para avanzar en tareas administrativas pendientes o revisar la planificación semanal.",
                prioridad: "baja"
            }];
        }

        // Construct prompt for Gemini
        const meetingsList = meetings.map(m => `- ${m.titulo} a las ${m.fecha.toLocaleTimeString()}`).join("\n");
        const prompt = `
        Eres un asesor político y personal experto para un gobernante. Basado en la siguiente agenda del día:
        ${meetingsList}

        Genera 2 o 3 consejos breves, estratégicos o de "ayuda moral" para afrontar el día.
        Pueden ser recordatorios de tacto político, preparación mental, o puntos clave a no olvidar.
        
        Devuelve la respuesta en formato JSON puramente, un array de objetos con esta estructura:
        [
            { "tipo": "consejo" | "advertencia" | "estrategia", "mensaje": "texto del consejo", "prioridad": "alta" | "media" | "baja" }
        ]
        `;

        const { generateContent } = await import("@/lib/gemini");
        const responseText = await generateContent(prompt);

        if (!responseText) return [];

        const cleanResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanResponse);

    } catch (error: any) {
        console.error("Error generating moral support:", error);
        // Fallback static support if AI fails or rate limited
        const isRateLimited = error.status === 429 || error.message?.includes("429");
        return [
            {
                tipo: "error",
                mensaje: isRateLimited
                    ? "La IA está descansando un momento (Límite de cuota alcanzado). Intenta más tarde."
                    : "El sistema de inteligencia está calibrando sus sensores. Recuerda mantener la calma y escuchar activamente en todas tus reuniones.",
                prioridad: "media"
            }
        ];
    }
}

export async function updateMeetingNotes(meetingId: string, notes: string) {
    try {
        await prisma.reunion.update({
            where: { id: meetingId },
            data: { notas: notes },
        });
        revalidatePath("/agenda");
        return { success: true };
    } catch (error) {
        console.error("Error updating notes:", error);
        return { success: false, error: "Error al guardar las notas." };
    }
}

export async function generateMeetingMinutes(meetingId: string) {
    try {
        const meeting = await prisma.reunion.findUnique({
            where: { id: meetingId },
        });

        if (!meeting || !meeting.notas) {
            return { success: false, error: "No hay notas para procesar." };
        }

        const prompt = `
        Genera un Acta de Reunión formal y una lista de Compromisos basada en estas notas crudas de la reunión "${meeting.titulo}":
        
        "${meeting.notas}"

        Devuelve un objeto JSON con:
        {
            "acta": "Texto redactado formalmente del acta...",
            "compromisos": ["Compromiso 1", "Compromiso 2", ...]
        }
        `;

        const { generateContent } = await import("@/lib/gemini");
        let responseText;
        try {
            responseText = await generateContent(prompt);
        } catch (error: any) {
            if (error.status === 429 || error.message?.includes("429")) {
                return { success: false, error: "El sistema de IA está saturado. Por favor, intenta de nuevo en 1 minuto." };
            }
            throw error;
        }

        if (!responseText) {
            return { success: false, error: "No se pudo generar el acta." };
        }

        const cleanResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanResponse);

        await prisma.reunion.update({
            where: { id: meetingId },
            data: {
                acta: data.acta,
                compromisos: JSON.stringify(data.compromisos),
            },
        });

        revalidatePath("/agenda");
        return { success: true };

    } catch (error) {
        console.error("Error generating minutes:", error);
        return { success: false, error: "Error al generar el acta." };
    }
}

export async function deleteMeeting(meetingId: string) {
    try {
        await prisma.reunion.delete({
            where: { id: meetingId },
        });
        revalidatePath("/agenda");
        return { success: true, message: "Reunión eliminada correctamente." };
    } catch (error) {
        console.error("Error deleting meeting:", error);
        return { error: "Error al eliminar la reunión." };
    }
}

export async function updateMeeting(formData: FormData) {
    const id = formData.get("id") as string;
    const titulo = formData.get("titulo") as string;
    const fechaStr = formData.get("fecha") as string;
    const horaStr = formData.get("hora") as string;

    if (!id || !titulo || !fechaStr || !horaStr) {
        return { error: "Todos los campos son obligatorios" };
    }

    try {
        // Combine date and time
        const [year, month, day] = fechaStr.split("-").map(Number);
        const [hours, minutes] = horaStr.split(":").map(Number);

        // Force GMT-5 (Colombia time) construction to avoid server timezone issues
        // Create an ISO string: YYYY-MM-DDTHH:mm:00-05:00
        const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`;
        const fecha = new Date(isoString);

        await prisma.reunion.update({
            where: { id },
            data: {
                titulo,
                fecha,
            },
        });

        revalidatePath("/agenda");
        return { success: true, message: "Reunión actualizada exitosamente." };
    } catch (error) {
        console.error("Error updating meeting:", error);
        return { error: "Error al actualizar la reunión." };
    }
}
