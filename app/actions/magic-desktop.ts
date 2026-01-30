"use server";

import { generateContent } from "@/lib/gemini";

export async function processNotes(formData: FormData) {
    const notes = formData.get("notes") as string;

    if (!notes) {
        return { error: "No se proporcionaron notas." };
    }

    const prompt = `
    Como Asistente de Gobierno experto, tu tarea es convertir estas notas informales o manuscritas en un Acta de Reunión formal y profesional.
    
    NOTAS ORIGINALES:
    "${notes}"
    
    INSTRUCCIONES:
    1. Genera un título adecuado para la reunión basado en el contenido.
    2. Redacta un resumen ejecutivo claro de lo discutido.
    3. Extrae una lista de "Compromisos" o tareas pendientes, asignando responsables si se mencionan.
    4. El tono debe ser formal, gubernamental y cortés.
    5. Devuelve la respuesta SOLAMENTE en formato JSON con la siguiente estructura (sin bloques de código extra):
    {
      "titulo": "Título de la Reunión",
      "acta": "Texto completo del acta...",
      "compromisos": ["Compromiso 1", "Compromiso 2"]
    }
  `;

    try {
        const response = await generateContent(prompt);

        if (!response) {
            return { error: "No se obtuvo respuesta de la IA." };
        }

        // Limpiar response de posibles bloques de código markdown
        const cleanResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanResponse);
    } catch (error) {
        console.error("Error processing notes:", error);
        return { error: "Error al procesar las notas." };
    }
}
