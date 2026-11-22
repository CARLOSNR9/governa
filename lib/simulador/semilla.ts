// Construcción determinística de los datos iniciales (compartida por el servidor y las pruebas).
import { aplicarCambio, itemPorDefecto } from "./calculos";
import type { SimItemDTO } from "./constantes";
import { ESCENARIOS_INICIALES, GASTOS_INICIALES, type DecisionInicial } from "./datos-iniciales";

export function itemsParaEscenario(
    gastos: { id: string; clave: string }[],
    decisiones: Record<string, DecisionInicial>
): SimItemDTO[] {
    const porClave = new Map(GASTOS_INICIALES.map((g) => [g.clave, g]));
    const items: SimItemDTO[] = [];
    for (const { id, clave } of gastos) {
        const def = porClave.get(clave);
        if (!def || (def.grupo !== "PENDIENTE" && def.grupo !== "POR_CONFIRMAR")) continue;
        const gasto = { id, grupo: def.grupo, valorReferencia: def.valorReferencia };
        let item = itemPorDefecto(gasto);
        const d = decisiones[clave];
        if (d) {
            if (d.valor !== undefined) item = aplicarCambio(item, { valor: d.valor }, gasto);
            if (d.estado !== undefined) item = aplicarCambio(item, { estado: d.estado }, gasto);
            if (d.incluido !== undefined) item = aplicarCambio(item, { incluido: d.incluido }, gasto);
            if (d.observaciones !== undefined) item = { ...item, observaciones: d.observaciones };
        }
        items.push(item);
    }
    return items;
}

export { ESCENARIOS_INICIALES, GASTOS_INICIALES };
