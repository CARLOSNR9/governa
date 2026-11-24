// Ejecutar con: npm run test:gastos
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarTipo, resumirProyecto } from "./proyectos";

test("proyecto acumulado sin pagos: todo falta por pagar", () => {
    const r = resumirProyecto(0, "ACUMULADO", [
        { tipo: "EGRESO", monto: 6_000_000, montoAbonado: 0 },
        { tipo: "EGRESO", monto: 6_700_000, montoAbonado: 0 },
    ]);
    assert.equal(r.gastos, 12_700_000);
    assert.equal(r.pagado, 0);
    assert.equal(r.pendiente, 12_700_000);
    assert.equal(r.estadoPago, "PENDIENTE");
    assert.equal(r.egresosPendientes, 2);
});

test("abonos parciales y pago total", () => {
    const movs = [
        { tipo: "EGRESO", monto: 6_000_000, montoAbonado: 6_000_000 },
        { tipo: "EGRESO", monto: 6_700_000, montoAbonado: 2_000_000 },
    ];
    let r = resumirProyecto(0, "ACUMULADO", movs);
    assert.equal(r.pagado, 8_000_000);
    assert.equal(r.pendiente, 4_700_000);
    assert.equal(r.estadoPago, "PENDIENTE");
    assert.equal(r.egresosPendientes, 1);
    movs[1].montoAbonado = 6_700_000;
    r = resumirProyecto(0, "ACUMULADO", movs);
    assert.equal(r.pendiente, 0);
    assert.equal(r.estadoPago, "PAGADO");
    assert.equal(r.porcentajePagado, 100);
});

test("proyecto con presupuesto: saldo y falta por pagar", () => {
    const r = resumirProyecto(3_488_000, "PRESUPUESTO", [
        { tipo: "EGRESO", monto: 3_484_000, montoAbonado: 3_484_000 },
    ]);
    assert.equal(r.saldo, 4_000);
    assert.equal(r.pendiente, 0);
    assert.equal(r.estadoPago, "PAGADO");
});

test("sin gastos y valores decimales sin residuos", () => {
    assert.equal(resumirProyecto(0, "ACUMULADO", []).estadoPago, "SIN_GASTOS");
    const r = resumirProyecto(0, "ACUMULADO", [
        { tipo: "EGRESO", monto: 0.1, montoAbonado: 0.1 },
        { tipo: "EGRESO", monto: 0.2, montoAbonado: 0.2 },
    ]);
    assert.equal(r.gastos, 0.3);
    assert.equal(r.pendiente, 0);
    assert.equal(r.estadoPago, "PAGADO");
});

test("tipo de proyectos existentes: según el presupuesto", () => {
    assert.equal(normalizarTipo(undefined, 3_488_000), "PRESUPUESTO");
    assert.equal(normalizarTipo(undefined, 0), "ACUMULADO");
    assert.equal(normalizarTipo("ACUMULADO", 500), "ACUMULADO");
});
