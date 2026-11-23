import type { ConCantidad, Concepto, Detalle, FilaInfo, Presupuesto, Seccion } from "./tipos";

/** Descuento entero (redondeado al peso) a partir de la bolsa y el porcentaje en puntos básicos. */
export function calcularDescuento(bolsa: number, descuentoPb: number): number {
    return Math.round((bolsa * descuentoPb) / 10_000);
}

/** Total de un ítem: cantidad × valor unitario (null = valor por definir). */
export function totalItem(x: ConCantidad & { valor: number | null }): number | null {
    if (x.valorUnitario === undefined) return x.valor;
    if (x.valorUnitario === null) return null;
    return (x.cantidad ?? 1) * x.valorUnitario;
}

export function sumaDetalles(detalles: Detalle[]): number {
    return detalles.reduce((a, d) => a + (d.incluido ? totalItem(d) ?? 0 : 0), 0);
}

/** Valor del concepto antes de decidir si se incluye (null = por definir). */
export function valorConcepto(c: Concepto): number | null {
    if (c.detalles && c.detalles.length > 0) return sumaDetalles(c.detalles);
    if (c.calculo) return c.calculo.cantidad * c.calculo.valorUnitario;
    return totalItem(c);
}

/** ¿El concepto se maneja con cantidad × valor unitario? (no los que tienen desglose ni las deducciones). */
export function usaCantidad(c: Concepto): boolean {
    return !c.deduccion && !(c.detalles && c.detalles.length > 0);
}

/**
 * Completa cantidad y valor unitario en documentos guardados con el formato
 * anterior, sin cambiar ningún total: cantidad 1 y valor unitario = valor.
 */
export function normalizarPresupuesto(p: Presupuesto): Presupuesto {
    const copia: Presupuesto = structuredClone(p);
    const completar = (x: ConCantidad & { valor: number | null }) => {
        if (x.valorUnitario === undefined) {
            x.cantidad = 1;
            x.valorUnitario = x.valor;
        }
        if (x.cantidad === undefined) x.cantidad = 1;
        x.valor = totalItem(x);
    };
    for (const s of copia.secciones) {
        for (const c of s.conceptos) {
            if (c.calculo) {
                c.cantidad = c.calculo.cantidad;
                c.valorUnitario = c.calculo.valorUnitario;
                c.valor = c.cantidad * c.valorUnitario;
                delete c.calculo;
            }
            if (c.detalles) for (const d of c.detalles) completar(d);
            if (usaCantidad(c)) completar(c);
        }
    }
    return copia;
}

/** Efecto del concepto sobre la bolsa: positivo suma gasto, negativo lo descuenta. */
export function aporteConcepto(c: Concepto): number {
    if (!c.incluido) return 0;
    const v = valorConcepto(c) ?? 0;
    return c.deduccion ? -v : v;
}

export function totalSeccion(s: Seccion): number {
    return s.conceptos.reduce((a, c) => a + aporteConcepto(c), 0);
}

/** Total de conceptos de gasto incluidos, sin contar deducciones. */
export function brutoSeccion(s: Seccion): number {
    return s.conceptos.reduce((a, c) => a + (c.deduccion ? 0 : aporteConcepto(c)), 0);
}

export function totalFilas(filas: FilaInfo[]): number {
    return filas.reduce((a, f) => a + (f.valor ?? 0), 0);
}

export interface Resumen {
    bolsaInicial: number;
    descuento: number;
    disponibilidad: number;
    secciones: { id: string; titulo: string; total: number }[];
    totalGastos: number;
    saldo: number; // negativo = déficit
    totalCdp: number;
    saldoVictimas: number;
}

export function calcularResumen(p: Presupuesto): Resumen {
    const descuento = calcularDescuento(p.bolsaInicial, p.descuentoPb);
    const disponibilidad = p.bolsaInicial - descuento;
    const secciones = p.secciones.map((s) => ({ id: s.id, titulo: s.titulo, total: totalSeccion(s) }));
    const totalGastos = secciones.reduce((a, s) => a + s.total, 0);
    return {
        bolsaInicial: p.bolsaInicial,
        descuento,
        disponibilidad,
        secciones,
        totalGastos,
        saldo: disponibilidad - totalGastos,
        totalCdp: totalFilas(p.cdp),
        saldoVictimas: p.victimas.recursos - p.victimas.mesa,
    };
}
