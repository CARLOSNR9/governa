// Constantes y tipos del Simulador Presupuestal – Cierre de Vigencia 2026.
// Este archivo no depende de React ni de Prisma: lo usan cliente, servidor y pruebas.

export const SIM_TITULO = "Simulador Presupuestal 2026";
export const SIM_SUBTITULO = "Cierre de vigencia – Priorización de gastos y disponibilidad de recursos.";
export const SIM_ENTIDAD = "Alcaldía Municipal de Linares, Nariño";
export const SIM_TITULO_INFORME = "Simulación Presupuestal – Cierre de Vigencia 2026";
export const SIM_AVISO_LEGAL =
    "Este documento es una simulación para apoyar la toma de decisiones. No constituye certificado de disponibilidad presupuestal (CDP), registro presupuestal, ni autorización de gasto.";

/** Valor máximo admitido para cualquier cifra (columna INTEGER de PostgreSQL). */
export const VALOR_MAXIMO = 2_000_000_000;

export const ESTADOS = ["PENDIENTE", "APROBADO", "DESCARTADO", "REDUCIDO"] as const;
export type EstadoDecision = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<EstadoDecision, string> = {
    PENDIENTE: "Pendiente de decidir",
    APROBADO: "Aprobado",
    DESCARTADO: "Descartado",
    REDUCIDO: "Reducido",
};

/**
 * Grupos de gasto:
 * - PENDIENTE: gastos pendientes de cubrir (participan en la simulación).
 * - POR_CONFIRMAR: necesidades registradas que solo cuentan si se incorporan.
 * - CUBIERTO_CDP / OTRA_VIGENCIA / RETIRADO: informativos, nunca afectan el saldo.
 */
export const GRUPOS = ["PENDIENTE", "POR_CONFIRMAR", "CUBIERTO_CDP", "OTRA_VIGENCIA", "RETIRADO"] as const;
export type GrupoGasto = (typeof GRUPOS)[number];

export const GRUPO_LABEL: Record<GrupoGasto, string> = {
    PENDIENTE: "Gasto pendiente de cubrir",
    POR_CONFIRMAR: "Pendiente de confirmación",
    CUBIERTO_CDP: "Ya cuenta con CDP",
    OTRA_VIGENCIA: "Para otra vigencia",
    RETIRADO: "Retirado de la simulación",
};

/** Grupos que participan en el cálculo del saldo. */
export const GRUPOS_ACTIVOS: GrupoGasto[] = ["PENDIENTE", "POR_CONFIRMAR"];
export const GRUPOS_INFORMATIVOS: GrupoGasto[] = ["CUBIERTO_CDP", "OTRA_VIGENCIA", "RETIRADO"];

export const PRIORIDADES = ["ALTA", "MEDIA", "BAJA"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];
export const PRIORIDAD_LABEL: Record<Prioridad, string> = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };

export interface CategoriaInfo {
    key: string;
    label: string;
    color: string;
}

// Colores: paleta categórica validada (orden fijo, el color sigue a la categoría).
export const CATEGORIAS: CategoriaInfo[] = [
    { key: "DEPORTES", label: "Deportes", color: "#2a78d6" },
    { key: "CULTURA", label: "Cultura – Navidad y fin de año", color: "#eb6834" },
    { key: "REGALOS_NAVIDAD", label: "Regalos de Navidad (niños)", color: "#1baf7a" },
    { key: "GOBIERNO_SOCIAL", label: "Gobierno y atención social", color: "#eda100" },
    { key: "INFRAESTRUCTURA", label: "Infraestructura y servicios", color: "#e87ba4" },
    { key: "LOGISTICA", label: "Actividades y logística", color: "#008300" },
    { key: "PERSONAL", label: "Personal", color: "#6250d6" },
    { key: "OTRAS_NECESIDADES", label: "Otras necesidades", color: "#e34948" },
    { key: "OTROS", label: "Otros conceptos", color: "#8a8984" },
];

export const CATEGORIA_KEYS = CATEGORIAS.map((c) => c.key);

export function categoriaInfo(key: string): CategoriaInfo {
    return CATEGORIAS.find((c) => c.key === key) ?? { key, label: key, color: "#64748b" };
}

// ─── Tipos de datos serializables (cliente ⇄ servidor) ──────────────────────

export interface SimDesgloseDTO {
    id: string;
    concepto: string;
    valor: number | null;
    orden: number;
}

export interface SimGastoDTO {
    id: string;
    nombre: string;
    categoria: string;
    grupo: GrupoGasto;
    valorReferencia: number | null;
    descripcion: string | null;
    observaciones: string | null;
    prioridad: Prioridad;
    orden: number;
    creadoPor: string | null;
    modificadoPor: string | null;
    updatedAt: string;
    desglose: SimDesgloseDTO[];
}

export interface SimItemDTO {
    gastoId: string;
    incluido: boolean;
    valor: number | null;
    estado: EstadoDecision;
    observaciones: string | null;
}

export interface SimEscenarioDTO {
    id: string;
    nombre: string;
    descripcion: string | null;
    observaciones: string | null;
    bolsaInicial: number;
    descuento: number;
    bloqueado: boolean;
    orden: number;
    creadoPor: string | null;
    modificadoPor: string | null;
    createdAt: string;
    updatedAt: string;
    items: SimItemDTO[];
}

export interface SimConfigDTO {
    victimasRecursos: number;
    victimasMesa: number;
    victimasNotas: string | null;
    modificadoPor: string | null;
    updatedAt: string;
}

export interface SimPermisos {
    puedeEditar: boolean;
    usuario: string;
    rol: string;
}

export interface SimDatos {
    config: SimConfigDTO;
    gastos: SimGastoDTO[];
    escenarios: SimEscenarioDTO[];
    permisos: SimPermisos;
}
