"use server";

import prisma from "@/lib/prisma";

export async function getAnalyticsData() {
    try {
        // 1. Total Citizens (KPI)
        const totalCitizens = await prisma.ciudadano.count();

        // 2. Citizens by Month (Chart)
        // SQLite doesn't have great date functions, so we fetch dates and process in JS
        // For a large app, we'd use raw SQL or a better DB, but this scales to ~10k easily.
        const citizens = await prisma.ciudadano.findMany({
            select: { createdAt: true },
        });

        const citizensByMonthMap = new Map<string, number>();
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        // Initialize last 6 months
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = monthNames[d.getMonth()];
            citizensByMonthMap.set(key, 0);
        }

        citizens.forEach((c) => {
            const d = new Date(c.createdAt);
            const key = monthNames[d.getMonth()];
            if (citizensByMonthMap.has(key)) {
                citizensByMonthMap.set(key, (citizensByMonthMap.get(key) || 0) + 1);
            }
        });

        const citizensByMonth = Array.from(citizensByMonthMap.entries()).map(([name, total]) => ({ name, total }));


        // 3. Petitions by Status (Pie Chart)
        const petitionsByStatusRaw = await prisma.peticion.groupBy({
            by: ['estado'],
            _count: {
                estado: true,
            },
        });

        const statusMap: Record<string, { label: string, fill: string }> = {
            "PENDIENTE": { label: "Pendiente", fill: "#f59e0b" }, // Amber
            "EN_GESTION": { label: "En Gestión", fill: "#3b82f6" }, // Blue
            "CUMPLIDO": { label: "Cumplido", fill: "#22c55e" }, // Green
            "RECHAZADO": { label: "Rechazado", fill: "#ef4444" } // Red
        };

        const petitionsByStatus = petitionsByStatusRaw.map((item) => ({
            name: statusMap[item.estado]?.label || item.estado,
            value: item._count.estado,
            fill: statusMap[item.estado]?.fill || "#94a3b8"
        }));


        // 4. Petitions by Type (Radar Chart)
        // We're using 'asunto' as the type/category for now.
        // In a real app, 'asunto' might be free text, so we'd need a separate 'categoria' field.
        // For this demo, we assume 'asunto' holds the category.
        const petitionsByTypeRaw = await prisma.peticion.groupBy({
            by: ['asunto'],
            _count: {
                asunto: true
            }
        });

        // Top 6 categories
        const petitionsByType = petitionsByTypeRaw
            .sort((a, b) => b._count.asunto - a._count.asunto)
            .slice(0, 6)
            .map(item => ({
                subject: item.asunto,
                A: item._count.asunto,
                fullMark: Math.max(...petitionsByTypeRaw.map(i => i._count.asunto)) * 1.2 // Scale chart dynamically
            }));


        // 5. KPIs
        // Satisfaction: Mocked for now (no field in DB)
        // Response Time: Mocked (no closedAt field in DB)
        const kpis = {
            satisfaccion: "94%",
            tiempoRespuesta: "2.5 días",
            totalAtendidos: totalCitizens
        };

        return {
            citizensByMonth,
            petitionsByStatus,
            petitionsByType,
            kpis
        };

    } catch (error) {
        console.error("Error fetching analytics:", error);
        // Fallback to empty structure to prevent UI crash
        return {
            citizensByMonth: [],
            petitionsByStatus: [],
            petitionsByType: [],
            kpis: { satisfaccion: "0%", tiempoRespuesta: "N/A", totalAtendidos: 0 }
        };
    }
}
