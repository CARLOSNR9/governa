// Cálculos de los proyectos de Control de Gastos (funciones puras).

export const TIPOS_PROYECTO = ["PRESUPUESTO", "ACUMULADO"] as const;
export type TipoProyecto = (typeof TIPOS_PROYECTO)[number];

export const TIPO_PROYECTO_LABEL: Record<TipoProyecto, string> = {
    PRESUPUESTO: "Con presupuesto asignado",
    ACUMULADO: "Gasto acumulado",
};

export function normalizarTipo(tipo: unknown, presupuesto = 0): TipoProyecto {
    if (tipo === "PRESUPUESTO" || tipo === "ACUMULADO") return tipo;
    return presupuesto > 0 ? "PRESUPUESTO" : "ACUMULADO";
}

interface Movimiento {
    tipo: string; // INGRESO | EGRESO
    monto: number;
    montoAbonado?: number | null;
}

export type EstadoPago = "SIN_GASTOS" | "PENDIENTE" | "PAGADO";

export interface ResumenProyecto {
    tipo: TipoProyecto;
    gastos: number; // total de egresos (lo gastado / acumulado)
    ingresos: number;
    saldo: number; // presupuesto + ingresos - gastos (solo tiene sentido con presupuesto)
    pagado: number; // abonado a los egresos
    pendiente: number; // falta por pagar
    egresos: number; // cantidad de egresos
    egresosPendientes: number; // egresos que no están pagados por completo
    estadoPago: EstadoPago;
    porcentajePagado: number;
}

/** Redondeo a centavos para evitar residuos de coma flotante (p. ej. 0,0000001). */
const r2 = (n: number) => Math.round(n * 100) / 100;

export function resumirProyecto(presupuesto: number, tipo: unknown, movimientos: Movimiento[]): ResumenProyecto {
    const egresos = movimientos.filter((t) => t.tipo === "EGRESO");
    const gastos = r2(egresos.reduce((a, t) => a + t.monto, 0));
    const ingresos = r2(movimientos.filter((t) => t.tipo === "INGRESO").reduce((a, t) => a + t.monto, 0));
    const pagado = r2(egresos.reduce((a, t) => a + Math.min(Math.max(t.montoAbonado ?? 0, 0), t.monto), 0));
    const pendiente = r2(Math.max(gastos - pagado, 0));
    const egresosPendientes = egresos.filter((t) => Math.min(t.montoAbonado ?? 0, t.monto) < t.monto).length;
    const estadoPago: EstadoPago = egresos.length === 0 ? "SIN_GASTOS" : egresosPendientes === 0 ? "PAGADO" : "PENDIENTE";
    return {
        tipo: normalizarTipo(tipo, presupuesto),
        gastos,
        ingresos,
        saldo: r2(presupuesto + ingresos - gastos),
        pagado,
        pendiente,
        egresos: egresos.length,
        egresosPendientes,
        estadoPago,
        porcentajePagado: gastos > 0 ? (pagado / gastos) * 100 : 0,
    };
}
