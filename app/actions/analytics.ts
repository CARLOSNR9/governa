"use server";

export async function getAnalyticsData() {
    // En un caso real, esto haría consultas complejas de agregación con Prisma
    // Como estamos en SQLite y es un demo, simularemos algunos datos basados en patrones realistas

    return {
        citizensByMonth: [
            { name: "Ene", total: 45 },
            { name: "Feb", total: 52 },
            { name: "Mar", total: 38 },
            { name: "Abr", total: 65 },
            { name: "May", total: 48 },
            { name: "Jun", total: 60 },
        ],
        petitionsByStatus: [
            { name: "Pendiente", value: 12, fill: "#f59e0b" }, // Amber
            { name: "En Gestión", value: 25, fill: "#3b82f6" }, // Blue
            { name: "Cumplido", value: 63, fill: "#22c55e" }, // Green
        ],
        petitionsByType: [
            { subject: "Vías", A: 120, fullMark: 150 },
            { subject: "Seguridad", A: 98, fullMark: 150 },
            { subject: "Salud", A: 86, fullMark: 150 },
            { subject: "Educación", A: 99, fullMark: 150 },
            { subject: "Cultura", A: 85, fullMark: 150 },
            { subject: "Deporte", A: 65, fullMark: 150 },
        ],
        kpis: {
            satisfaccion: "94%",
            tiempoRespuesta: "2.5 días",
            totalAtendidos: 350
        }
    };
}
