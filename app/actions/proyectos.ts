"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProyectos() {
    try {
        const proyectos = await prisma.proyecto.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                transacciones: true,
            },
        });

        const proyectosConSaldos = proyectos.map(p => {
            const gastos = p.transacciones
                .filter(t => t.tipo === "EGRESO")
                .reduce((sum, t) => sum + t.monto, 0);
            
            const ingresos = p.transacciones
                .filter(t => t.tipo === "INGRESO")
                .reduce((sum, t) => sum + t.monto, 0);

            // El saldo es el presupuesto inicial + ingresos (si aplica) - gastos
            const saldo = p.presupuesto + ingresos - gastos;

            return {
                ...p,
                gastos,
                ingresos,
                saldo,
            };
        });

        return { success: true, data: proyectosConSaldos };
    } catch (error) {
        console.error("Error al obtener proyectos:", error);
        return { success: false, error: "Error al obtener proyectos" };
    }
}

export async function createProyecto(data: {
    nombre: string;
    descripcion?: string;
    presupuesto: number;
}) {
    try {
        const nuevoProyecto = await prisma.proyecto.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion || null,
                presupuesto: data.presupuesto,
            },
        });

        revalidatePath("/gastos");
        return { success: true, data: nuevoProyecto };
    } catch (error) {
        console.error("Error al crear proyecto:", error);
        return { success: false, error: "Error al crear proyecto" };
    }
}

export async function deleteProyecto(id: string) {
    try {
        // Al eliminar en cascada, si se requiere. 
        // Como no pusimos onDelete: Cascade, las transacciones podrían quedar huérfanas
        // o dar error. Primero desvinculamos o eliminamos transacciones?
        // En este caso, asumiremos que se pueden eliminar las transacciones.
        await prisma.transaccion.deleteMany({
            where: { proyectoId: id },
        });

        await prisma.proyecto.delete({
            where: { id },
        });

        revalidatePath("/gastos");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar proyecto:", error);
        return { success: false, error: "Error al eliminar proyecto" };
    }
}
