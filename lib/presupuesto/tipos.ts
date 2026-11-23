// Consolidado general de gastos – Cierre 2026.
// Una sola hoja editable. Todos los valores son pesos colombianos ENTEROS.

export const TITULO = "Consolidado general de gastos – Cierre 2026";
export const ENTIDAD = "Alcaldía Municipal de Linares, Nariño";
export const AVISO = "Documento de trabajo para la toma de decisiones. No constituye certificado de disponibilidad presupuestal ni autorización de gasto.";
export const VALOR_MAXIMO = 2_000_000_000;

/** Línea de desglose de un concepto (p. ej. "Sonido" dentro de la Actividad del 28 de diciembre). */
export interface Detalle {
    id: string;
    nombre: string;
    valor: number | null;
    incluido: boolean;
}

/** Concepto de gasto dentro de una sección de la bolsa general. */
export interface Concepto {
    id: string;
    nombre: string;
    incluido: boolean;
    /** Valor directo (se ignora si el concepto tiene desglose o cálculo). null = por definir. */
    valor: number | null;
    /** Texto libre: estado, fecha u observación. */
    nota: string;
    /** Si tiene desglose, el valor del concepto es la suma de las líneas incluidas. */
    detalles?: Detalle[];
    /** Concepto calculado: cantidad × valor unitario (p. ej. regalos de Navidad por niño). */
    calculo?: { cantidad: number; valorUnitario: number; etiquetaCantidad: string; etiquetaUnitario: string };
    /** Resta en lugar de sumar (p. ej. la parte cubierta con un CDP existente). */
    deduccion?: boolean;
}

export interface Seccion {
    id: string;
    titulo: string;
    nota: string;
    conceptos: Concepto[];
}

/** Fila informativa (no afecta la bolsa general). */
export interface FilaInfo {
    id: string;
    nombre: string;
    valor: number | null;
    nota: string;
}

export interface Presupuesto {
    bolsaInicial: number;
    /** Porcentaje de descuento en puntos básicos: 2000 = 20,00 %. */
    descuentoPb: number;
    secciones: Seccion[];
    cdp: FilaInfo[];
    victimas: { recursos: number; mesa: number; nota: string };
    porConfirmar: FilaInfo[];
    retirados: FilaInfo[];
}

export interface PresupuestoGuardado {
    datos: Presupuesto;
    version: number;
    modificadoPor: string | null;
    updatedAt: string;
}

export interface Permisos {
    puedeEditar: boolean;
    usuario: string;
}

// ─── Formato colombiano ─────────────────────────────────────────────────────

export function formatCOP(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return "Por definir";
    const abs = Math.abs(Math.trunc(valor)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${valor < 0 ? "-" : ""}$${abs}`;
}

export function parseEntero(texto: string): number | null {
    const d = (texto ?? "").replace(/[^\d]/g, "");
    if (d === "") return null;
    const n = Number.parseInt(d, 10);
    return Number.isSafeInteger(n) ? Math.min(n, VALOR_MAXIMO) : null;
}

export function formatPorcentajePb(pb: number): string {
    return `${(pb / 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })} %`;
}

export function nuevoId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
