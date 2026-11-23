import type { Concepto, Detalle, FilaInfo, Presupuesto, Seccion } from "./tipos";

/** Descuento entero (redondeado al peso) a partir de la bolsa y el porcentaje en puntos básicos. */
export function calcularDescuento(bolsa: number, descuentoPb: number): number {
    return Math.round((bolsa * descuentoPb) / 10_000);
}

export function sumaDetalles(detalles: Detalle[]): number {
    return detalles.reduce((a, d) => a + (d.incluido && d.valor !== null ? d.valor : 0), 0);
}

/** Valor del concepto antes de decidir si se incluye (null = por definir). */
export function valorConcepto(c: Concepto): number | null {
    if (c.detalles && c.detalles.length > 0) return sumaDetalles(c.detalles);
    if (c.calculo) return c.calculo.cantidad * c.calculo.valorUnitario;
    return c.valor;
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
