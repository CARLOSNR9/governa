"use server";

// Consolidado general de gastos – Cierre 2026: lectura y guardado.
import prisma from "@/lib/prisma";
import { normalizarPresupuesto } from "@/lib/presupuesto/calculos";
import { presupuestoInicial } from "@/lib/presupuesto/datos-iniciales";
import { obtenerPermisos } from "@/lib/presupuesto/permisos";
import type { Permisos, Presupuesto, PresupuestoGuardado } from "@/lib/presupuesto/tipos";
import { esquemaPresupuesto } from "@/lib/presupuesto/validacion";

const ID = "cierre-2026";

type Resultado<T> = { success: true; data: T } | { success: false; error: string; conflicto?: boolean };

function serializar(r: { datos: unknown; version: number; modificadoPor: string | null; updatedAt: Date }): PresupuestoGuardado {
    // Documentos guardados con el formato anterior reciben cantidad 1 y valor unitario = total.
    return { datos: normalizarPresupuesto(r.datos as Presupuesto), version: r.version, modificadoPor: r.modificadoPor, updatedAt: r.updatedAt.toISOString() };
}

export async function getPresupuesto(): Promise<Resultado<{ guardado: PresupuestoGuardado; permisos: Permisos }>> {
    try {
        const permisos = await obtenerPermisos();
        if (!permisos) return { success: false, error: "Su sesión expiró. Inicie sesión nuevamente." };
        let fila = await prisma.presupuestoCierre.findUnique({ where: { id: ID } });
        if (!fila) {
            // upsert evita duplicados si dos personas abren la página al mismo tiempo la primera vez.
            fila = await prisma.presupuestoCierre.upsert({
                where: { id: ID },
                create: { id: ID, datos: presupuestoInicial() as object, modificadoPor: permisos.usuario },
                update: {},
            });
        }
        return { success: true, data: { guardado: serializar(fila), permisos } };
    } catch (e) {
        console.error("[presupuesto]", e);
        return { success: false, error: "No fue posible cargar el consolidado." };
    }
}

/** Guarda el documento completo. Rechaza el cambio si otra persona guardó una versión más nueva. */
export async function guardarPresupuesto(datos: Presupuesto, versionEsperada: number): Promise<Resultado<PresupuestoGuardado>> {
    try {
        const permisos = await obtenerPermisos();
        if (!permisos) return { success: false, error: "Su sesión expiró. Inicie sesión nuevamente." };
        if (!permisos.puedeEditar) return { success: false, error: "Su usuario solo tiene permisos de consulta." };

        const valido = esquemaPresupuesto.safeParse(datos);
        if (!valido.success) return { success: false, error: "Los datos no son válidos: revise que los valores sean números enteros positivos." };

        const res = await prisma.presupuestoCierre.updateMany({
            where: { id: ID, version: versionEsperada },
            data: { datos: valido.data as object, version: { increment: 1 }, modificadoPor: permisos.usuario },
        });
        if (res.count === 0) {
            return { success: false, conflicto: true, error: "Otra persona modificó el consolidado. Recargue la página para ver la versión más reciente." };
        }
        const fila = await prisma.presupuestoCierre.findUniqueOrThrow({ where: { id: ID } });
        return { success: true, data: serializar(fila) };
    } catch (e) {
        console.error("[presupuesto]", e);
        return { success: false, error: "No fue posible guardar los cambios." };
    }
}

/** Restablece los valores iniciales de la reunión financiera. */
export async function restablecerPresupuesto(): Promise<Resultado<PresupuestoGuardado>> {
    try {
        const permisos = await obtenerPermisos();
        if (!permisos?.puedeEditar) return { success: false, error: "Su usuario solo tiene permisos de consulta." };
        const fila = await prisma.presupuestoCierre.upsert({
            where: { id: ID },
            create: { id: ID, datos: presupuestoInicial() as object, modificadoPor: permisos.usuario },
            update: { datos: presupuestoInicial() as object, version: { increment: 1 }, modificadoPor: permisos.usuario },
        });
        return { success: true, data: serializar(fila) };
    } catch (e) {
        console.error("[presupuesto]", e);
        return { success: false, error: "No fue posible restablecer el consolidado." };
    }
}
