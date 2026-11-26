"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { aMayusculas } from "@/lib/gastos/texto";
import { normalizarTipo, resumirProyecto, type TipoProyecto } from "@/lib/gastos/proyectos";

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

        // gastos, ingresos, saldo (presupuesto + ingresos - gastos), pagado,
        // pendiente (falta por pagar) y estado de pago de cada proyecto.
        const proyectosConSaldos = proyectos.map(p => ({
            ...p,
            ...resumirProyecto(p.presupuesto, p.tipo, p.transacciones),
        }));

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
    tipo?: TipoProyecto;
}) {
    try {
        const tipo = normalizarTipo(data.tipo, data.presupuesto);
        const nuevoProyecto = await prisma.proyecto.create({
            data: {
                nombre: aMayusculas(data.nombre.trim()),
                descripcion: data.descripcion ? aMayusculas(data.descripcion.trim()) : null,
                // Un proyecto de gasto acumulado no tiene valor inicial.
                presupuesto: tipo === "ACUMULADO" ? 0 : Math.max(data.presupuesto || 0, 0),
                tipo,
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

export async function updateProyecto(id: string, data: {
    nombre?: string;
    descripcion?: string;
    presupuesto?: number;
    tipo?: TipoProyecto;
}) {
    try {
        const cambios: { nombre?: string; descripcion?: string; presupuesto?: number; tipo?: TipoProyecto } = {
            nombre: data.nombre === undefined ? undefined : aMayusculas(data.nombre.trim()),
            descripcion: data.descripcion === undefined ? undefined : aMayusculas(data.descripcion.trim()),
            presupuesto: data.presupuesto === undefined ? undefined : Math.max(data.presupuesto || 0, 0),
        };
        if (data.tipo !== undefined) {
            cambios.tipo = normalizarTipo(data.tipo, data.presupuesto ?? 0);
            if (cambios.tipo === "ACUMULADO") cambios.presupuesto = 0;
        }
        const proyectoActualizado = await prisma.proyecto.update({
            where: { id },
            data: cambios,
        });

        revalidatePath("/gastos");
        return { success: true, data: proyectoActualizado };
    } catch (error) {
        console.error("Error al actualizar proyecto:", error);
        return { success: false, error: "Error al actualizar proyecto" };
    }
}
