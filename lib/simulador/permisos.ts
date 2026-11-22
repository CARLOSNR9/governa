import { getSession } from "@/lib/auth";
import type { SimPermisos } from "./constantes";

/**
 * Roles autorizados para MODIFICAR el simulador. Los demás usuarios autenticados
 * solo pueden consultarlo. Se puede ajustar con la variable de entorno
 * SIMULADOR_ROLES_EDICION (lista separada por comas), p. ej. "ADMIN,ALCALDE,HACIENDA".
 */
const ROLES_EDICION_POR_DEFECTO = ["ADMIN", "ALCALDE", "HACIENDA", "FINANCIERO"];

export function rolesEdicion(): string[] {
    const env = process.env.SIMULADOR_ROLES_EDICION;
    if (!env) return ROLES_EDICION_POR_DEFECTO;
    return env
        .split(",")
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean);
}

export async function obtenerPermisos(): Promise<SimPermisos | null> {
    const session = await getSession();
    const user = session?.user;
    if (!user) return null;
    const rol = String(user.role ?? "").toUpperCase();
    return {
        puedeEditar: rolesEdicion().includes(rol),
        usuario: String(user.name || user.email || "Usuario"),
        rol,
    };
}
