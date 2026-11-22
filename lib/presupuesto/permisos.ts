import { getSession } from "@/lib/auth";
import type { Permisos } from "./tipos";

/**
 * Roles autorizados para MODIFICAR el consolidado. Los demás usuarios
 * autenticados solo pueden consultarlo. Se ajusta con la variable de entorno
 * PRESUPUESTO_ROLES_EDICION (lista separada por comas).
 */
const ROLES_POR_DEFECTO = ["ADMIN", "ALCALDE", "HACIENDA", "FINANCIERO"];

export function rolesEdicion(): string[] {
    const env = process.env.PRESUPUESTO_ROLES_EDICION ?? process.env.SIMULADOR_ROLES_EDICION;
    if (!env) return ROLES_POR_DEFECTO;
    return env
        .split(",")
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean);
}

export async function obtenerPermisos(): Promise<Permisos | null> {
    const session = await getSession();
    const user = session?.user;
    if (!user) return null;
    const rol = String(user.role ?? "").toUpperCase();
    return { puedeEditar: rolesEdicion().includes(rol), usuario: String(user.name || user.email || "Usuario") };
}
