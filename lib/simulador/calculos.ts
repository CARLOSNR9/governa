// Motor de cálculo del simulador. Funciones puras, con aritmética de enteros.
import {
    CATEGORIAS,
    GRUPOS_ACTIVOS,
    VALOR_MAXIMO,
    categoriaInfo,
    type EstadoDecision,
    type GrupoGasto,
    type SimEscenarioDTO,
    type SimGastoDTO,
    type SimItemDTO,
} from "./constantes";

// ─── Formato colombiano ─────────────────────────────────────────────────────

/** Formatea pesos enteros como $192.000.000 (separador de miles con punto). */
export function formatCOP(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return "Por definir";
    const negativo = valor < 0;
    const abs = Math.abs(Math.trunc(valor));
    const conPuntos = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${negativo ? "-" : ""}$${conPuntos}`;
}

/** Formato compacto para ejes de gráficos: $192 M */
export function formatCOPCorto(valor: number): string {
    const abs = Math.abs(valor);
    if (abs >= 1_000_000) {
        const m = valor / 1_000_000;
        return `$${m.toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
    }
    return formatCOP(valor);
}

/** Convierte un texto ("$8.000.000", "8000000", "8 000 000") a entero. Devuelve null si está vacío. */
export function parseCOP(texto: string): number | null {
    const digitos = (texto ?? "").replace(/[^\d]/g, "");
    if (digitos === "") return null;
    const n = Number.parseInt(digitos, 10);
    return Number.isSafeInteger(n) ? n : null;
}

export function formatPorcentaje(valor: number, decimales = 1): string {
    return `${valor.toLocaleString("es-CO", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
}

export function esValorValido(valor: unknown): valor is number {
    return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor <= VALOR_MAXIMO;
}

// ─── Reglas de decisión ─────────────────────────────────────────────────────

export interface CambioItem {
    incluido?: boolean;
    valor?: number | null;
    estado?: EstadoDecision;
    observaciones?: string | null;
}

/**
 * Aplica un cambio a la decisión de un gasto manteniendo la coherencia entre
 * "incluido", "estado" y "valor". La usan el cliente (respuesta inmediata) y el
 * servidor (validación), de modo que ambos producen exactamente el mismo resultado.
 */
export function aplicarCambio(
    item: SimItemDTO,
    cambio: CambioItem,
    gasto: Pick<SimGastoDTO, "valorReferencia" | "grupo">
): SimItemDTO {
    const nuevo: SimItemDTO = { ...item };
    const ref = gasto.valorReferencia;

    if (cambio.observaciones !== undefined) nuevo.observaciones = cambio.observaciones;

    if (cambio.valor !== undefined) {
        nuevo.valor = cambio.valor;
        if (cambio.estado === undefined && nuevo.valor !== null && ref !== null) {
            if (nuevo.valor < ref && (nuevo.estado === "PENDIENTE" || nuevo.estado === "APROBADO")) {
                nuevo.estado = "REDUCIDO";
            } else if (nuevo.valor >= ref && nuevo.estado === "REDUCIDO") {
                nuevo.estado = "PENDIENTE";
            }
        }
    }

    if (cambio.estado !== undefined) {
        nuevo.estado = cambio.estado;
        nuevo.incluido = cambio.estado !== "DESCARTADO";
    }

    if (cambio.incluido !== undefined && cambio.estado === undefined) {
        nuevo.incluido = cambio.incluido;
        if (!cambio.incluido) {
            // Una necesidad por confirmar que se retira vuelve a "pendiente"; un gasto activo queda descartado.
            nuevo.estado = gasto.grupo === "POR_CONFIRMAR" ? "PENDIENTE" : "DESCARTADO";
        } else if (nuevo.estado === "DESCARTADO") {
            nuevo.estado = nuevo.valor !== null && ref !== null && nuevo.valor < ref ? "REDUCIDO" : "PENDIENTE";
        }
    }

    return nuevo;
}

/** Un gasto suma al escenario solo si es activo, está incluido, no está descartado y tiene valor. */
export function cuentaEnEscenario(grupo: GrupoGasto, item: SimItemDTO | undefined): boolean {
    if (!item) return false;
    if (!GRUPOS_ACTIVOS.includes(grupo)) return false;
    return item.incluido && item.estado !== "DESCARTADO" && item.valor !== null;
}

/** Decisión por defecto de un gasto en un escenario nuevo construido desde la referencia. */
export function itemPorDefecto(gasto: Pick<SimGastoDTO, "id" | "grupo" | "valorReferencia">): SimItemDTO {
    return {
        gastoId: gasto.id,
        incluido: gasto.grupo === "PENDIENTE",
        valor: gasto.valorReferencia,
        estado: "PENDIENTE",
        observaciones: null,
    };
}

// ─── Resumen del escenario ──────────────────────────────────────────────────

export interface ResumenCategoria {
    key: string;
    label: string;
    color: string;
    seleccionado: number;
    excluido: number;
    referencia: number;
    porcentaje: number; // participación sobre el total seleccionado
    cantidad: number;
}

export interface ResumenEscenario {
    bolsaInicial: number;
    descuento: number;
    porcentajeDescuento: number;
    disponibilidadNeta: number;
    totalSeleccionado: number;
    totalExcluido: number; // gastos pendientes descartados / excluidos
    totalPorConfirmar: number; // necesidades por confirmar aún no incorporadas (con valor conocido)
    porConfirmarSinValor: number; // cantidad de necesidades sin valor definido
    totalReferencia: number; // suma de valores de referencia de los gastos pendientes
    ahorroReducciones: number; // diferencia por reducciones (referencia - valor) en gastos incluidos
    incrementos: number; // diferencia por incrementos (valor - referencia) en gastos incluidos
    saldo: number; // disponibilidad - seleccionado (negativo = déficit)
    deficit: number;
    superavit: number;
    porcentajeEjecucion: number;
    aprobados: number;
    pendientes: number;
    descartados: number;
    reducidos: number;
    seleccionados: number;
    porCategoria: ResumenCategoria[];
}

export function itemsPorGasto(escenario: Pick<SimEscenarioDTO, "items">): Map<string, SimItemDTO> {
    return new Map(escenario.items.map((i) => [i.gastoId, i]));
}

export function calcularResumen(
    escenario: Pick<SimEscenarioDTO, "bolsaInicial" | "descuento" | "items">,
    gastos: SimGastoDTO[]
): ResumenEscenario {
    const mapa = itemsPorGasto(escenario);
    const disponibilidadNeta = escenario.bolsaInicial - escenario.descuento;

    const cats = new Map<string, ResumenCategoria>();
    const obtenerCat = (key: string) => {
        let c = cats.get(key);
        if (!c) {
            const info = categoriaInfo(key);
            c = { key, label: info.label, color: info.color, seleccionado: 0, excluido: 0, referencia: 0, porcentaje: 0, cantidad: 0 };
            cats.set(key, c);
        }
        return c;
    };

    let totalSeleccionado = 0;
    let totalExcluido = 0;
    let totalPorConfirmar = 0;
    let porConfirmarSinValor = 0;
    let totalReferencia = 0;
    let ahorroReducciones = 0;
    let incrementos = 0;
    let aprobados = 0;
    let pendientes = 0;
    let descartados = 0;
    let reducidos = 0;
    let seleccionados = 0;

    for (const gasto of gastos) {
        if (!GRUPOS_ACTIVOS.includes(gasto.grupo)) continue;
        const item = mapa.get(gasto.id) ?? { ...itemPorDefecto(gasto), incluido: false };
        const cuenta = cuentaEnEscenario(gasto.grupo, item);
        const valor = item.valor ?? gasto.valorReferencia ?? 0;

        if (gasto.grupo === "PENDIENTE") totalReferencia += gasto.valorReferencia ?? 0;

        if (cuenta) {
            const v = item.valor as number;
            totalSeleccionado += v;
            seleccionados++;
            const c = obtenerCat(gasto.categoria);
            c.seleccionado += v;
            c.cantidad++;
            c.referencia += gasto.valorReferencia ?? 0;
            if (gasto.valorReferencia !== null) {
                if (v < gasto.valorReferencia) ahorroReducciones += gasto.valorReferencia - v;
                if (v > gasto.valorReferencia) incrementos += v - gasto.valorReferencia;
            }
            if (item.estado === "APROBADO") aprobados++;
            if (item.estado === "REDUCIDO") reducidos++;
            if (item.estado === "PENDIENTE") pendientes++;
        } else if (gasto.grupo === "POR_CONFIRMAR" && item.estado !== "DESCARTADO") {
            if (item.valor === null && gasto.valorReferencia === null) porConfirmarSinValor++;
            else totalPorConfirmar += valor;
        } else {
            totalExcluido += valor;
            descartados++;
            const c = obtenerCat(gasto.categoria);
            c.excluido += valor;
            if (gasto.grupo === "PENDIENTE") c.referencia += gasto.valorReferencia ?? 0;
        }
    }

    const orden = CATEGORIAS.map((c) => c.key);
    const porCategoria = [...cats.values()]
        .map((c) => ({ ...c, porcentaje: totalSeleccionado > 0 ? (c.seleccionado / totalSeleccionado) * 100 : 0 }))
        .sort((a, b) => orden.indexOf(a.key) - orden.indexOf(b.key));

    const saldo = disponibilidadNeta - totalSeleccionado;

    return {
        bolsaInicial: escenario.bolsaInicial,
        descuento: escenario.descuento,
        porcentajeDescuento: escenario.bolsaInicial > 0 ? (escenario.descuento / escenario.bolsaInicial) * 100 : 0,
        disponibilidadNeta,
        totalSeleccionado,
        totalExcluido,
        totalPorConfirmar,
        porConfirmarSinValor,
        totalReferencia,
        ahorroReducciones,
        incrementos,
        saldo,
        deficit: saldo < 0 ? -saldo : 0,
        superavit: saldo > 0 ? saldo : 0,
        porcentajeEjecucion: disponibilidadNeta > 0 ? (totalSeleccionado / disponibilidadNeta) * 100 : 0,
        aprobados,
        pendientes,
        descartados,
        reducidos,
        seleccionados,
        porCategoria,
    };
}

/** Descuento entero a partir de un porcentaje con hasta dos decimales (redondeo al peso). */
export function descuentoDesdePorcentaje(bolsa: number, porcentaje: number): number {
    const puntosBasicos = Math.round(porcentaje * 100); // 20,00 % → 2000
    return Math.round((bolsa * puntosBasicos) / 10_000);
}

// ─── Comparación de escenarios ──────────────────────────────────────────────

export type TipoCambio = "IGUAL" | "AGREGADO" | "RETIRADO" | "AUMENTA" | "DISMINUYE" | "ESTADO";

export interface FilaComparacion {
    gasto: SimGastoDTO;
    a: { cuenta: boolean; valor: number; estado: EstadoDecision | null };
    b: { cuenta: boolean; valor: number; estado: EstadoDecision | null };
    diferencia: number; // efecto en el gasto: (B - A)
    tipo: TipoCambio;
}

export interface Comparacion {
    filas: FilaComparacion[];
    resumenA: ResumenEscenario;
    resumenB: ResumenEscenario;
    diferenciaGasto: number;
    diferenciaSaldo: number;
    cambios: number;
}

export function compararEscenarios(a: SimEscenarioDTO, b: SimEscenarioDTO, gastos: SimGastoDTO[]): Comparacion {
    const ma = itemsPorGasto(a);
    const mb = itemsPorGasto(b);
    const filas: FilaComparacion[] = [];

    for (const gasto of gastos) {
        if (!GRUPOS_ACTIVOS.includes(gasto.grupo)) continue;
        const ia = ma.get(gasto.id);
        const ib = mb.get(gasto.id);
        const ca = cuentaEnEscenario(gasto.grupo, ia);
        const cb = cuentaEnEscenario(gasto.grupo, ib);
        const va = ca ? (ia!.valor as number) : 0;
        const vb = cb ? (ib!.valor as number) : 0;
        let tipo: TipoCambio = "IGUAL";
        if (ca && !cb) tipo = "RETIRADO";
        else if (!ca && cb) tipo = "AGREGADO";
        else if (vb > va) tipo = "AUMENTA";
        else if (vb < va) tipo = "DISMINUYE";
        else if ((ia?.estado ?? null) !== (ib?.estado ?? null) && (ca || cb)) tipo = "ESTADO";
        filas.push({
            gasto,
            a: { cuenta: ca, valor: va, estado: ia?.estado ?? null },
            b: { cuenta: cb, valor: vb, estado: ib?.estado ?? null },
            diferencia: vb - va,
            tipo,
        });
    }

    const resumenA = calcularResumen(a, gastos);
    const resumenB = calcularResumen(b, gastos);
    return {
        filas,
        resumenA,
        resumenB,
        diferenciaGasto: resumenB.totalSeleccionado - resumenA.totalSeleccionado,
        diferenciaSaldo: resumenB.saldo - resumenA.saldo,
        cambios: filas.filter((f) => f.tipo !== "IGUAL").length,
    };
}
