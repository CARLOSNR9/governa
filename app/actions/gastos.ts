"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTransacciones() {
    try {
        const transacciones = await prisma.transaccion.findMany({
            orderBy: {
                fecha: "desc",
            },
        });

        const totalIngresos = transacciones
            .filter((t: any) => t.tipo === "INGRESO")
            .reduce((acc: number, t: any) => acc + t.monto, 0);

        const totalEgresos = transacciones
            .filter((t: any) => t.tipo === "EGRESO")
            .reduce((acc: number, t: any) => acc + t.monto, 0);

        const saldo = totalIngresos - totalEgresos;

        return {
            success: true,
            data: transacciones,
            summary: {
                totalIngresos,
                totalEgresos,
                saldo,
            },
        };
    } catch (error) {
        console.error("Error al obtener transacciones:", error);
        return { success: false, error: "Error al obtener transacciones" };
    }
}

export async function createTransaccion(data: {
    concepto: string;
    monto: number;
    tipo: "INGRESO" | "EGRESO";
    categoria?: string;
    fecha?: Date;
    proyectoId?: string;
}) {
    try {
        const nuevaTransaccion = await prisma.transaccion.create({
            data: {
                concepto: data.concepto,
                monto: data.monto,
                tipo: data.tipo,
                categoria: data.categoria || null,
                fecha: data.fecha || new Date(),
                proyectoId: data.proyectoId || null,
            },
        });

        revalidatePath("/gastos");
        return { success: true, data: nuevaTransaccion };
    } catch (error) {
        console.error("Error al crear transacción:", error);
        return { success: false, error: "Error al crear transacción" };
    }
}

export async function deleteTransaccion(id: string) {
    try {
        await prisma.transaccion.delete({
            where: { id },
        });

        revalidatePath("/gastos");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar transacción:", error);
        return { success: false, error: "Error al eliminar transacción" };
    }
}
