// Pruebas del motor de cálculo del simulador.
// Ejecutar con: npm run test:simulador
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    aplicarCambio,
    calcularResumen,
    compararEscenarios,
    descuentoDesdePorcentaje,
    formatCOP,
    parseCOP,
} from "./calculos";
import type { SimEscenarioDTO, SimGastoDTO } from "./constantes";
import {
    BOLSA_INICIAL,
    DESCUENTO_INICIAL,
    ESCENARIOS_INICIALES,
    GASTOS_INICIALES,
    VICTIMAS_MESA,
    VICTIMAS_RECURSOS,
} from "./datos-iniciales";
import { itemsParaEscenario } from "./semilla";

const gastos: SimGastoDTO[] = GASTOS_INICIALES.map((g, i) => ({
    id: g.clave,
    nombre: g.nombre,
    categoria: g.categoria,
    grupo: g.grupo,
    valorReferencia: g.valorReferencia,
    descripcion: g.descripcion ?? null,
    observaciones: g.observaciones ?? null,
    prioridad: g.prioridad ?? "MEDIA",
    orden: i,
    creadoPor: null,
    modificadoPor: null,
    updatedAt: "",
    desglose: [],
}));
const ids = gastos.map((g) => ({ id: g.id, clave: g.id }));

function escenario(n: number): SimEscenarioDTO {
    const e = ESCENARIOS_INICIALES[n];
    return {
        id: `e${n}`,
        nombre: e.nombre,
        descripcion: e.descripcion,
        observaciones: null,
        bolsaInicial: BOLSA_INICIAL,
        descuento: DESCUENTO_INICIAL,
        bloqueado: e.bloqueado,
        orden: n,
        creadoPor: null,
        modificadoPor: null,
        createdAt: "",
        updatedAt: "",
        items: itemsParaEscenario(ids, e.decisiones),
    };
}

const sumaCategoria = (cat: string) =>
    GASTOS_INICIALES.filter((g) => g.categoria === cat && g.grupo === "PENDIENTE").reduce((a, g) => a + (g.valorReferencia ?? 0), 0);

test("disponibilidad: 240.000.000 - 20 % = 192.000.000", () => {
    assert.equal(descuentoDesdePorcentaje(BOLSA_INICIAL, 20), DESCUENTO_INICIAL);
    const r = calcularResumen(escenario(0), gastos);
    assert.equal(r.bolsaInicial, 240_000_000);
    assert.equal(r.descuento, 48_000_000);
    assert.equal(r.disponibilidadNeta, 192_000_000);
    assert.equal(r.porcentajeDescuento, 20);
});

test("totales de referencia por categoría", () => {
    assert.equal(sumaCategoria("DEPORTES"), 62_095_000);
    assert.equal(sumaCategoria("CULTURA"), 49_290_000);
    assert.equal(sumaCategoria("REGALOS_NAVIDAD"), 46_000_000);
    assert.equal(sumaCategoria("GOBIERNO_SOCIAL"), 11_600_000);
    assert.equal(sumaCategoria("INFRAESTRUCTURA"), 15_000_000);
    assert.equal(sumaCategoria("LOGISTICA"), 6_500_000);
    assert.equal(sumaCategoria("PERSONAL"), 11_000_000);
});

test("escenario inicial: total 201.485.000 y déficit 9.485.000", () => {
    const r = calcularResumen(escenario(0), gastos);
    assert.equal(r.totalSeleccionado, 201_485_000);
    assert.equal(r.totalReferencia, 201_485_000);
    assert.equal(r.saldo, -9_485_000);
    assert.equal(r.deficit, 9_485_000);
    assert.equal(r.superavit, 0);
    assert.equal(r.seleccionados, 17);
    assert.equal(r.pendientes, 17);
    assert.equal(r.aprobados, 0);
    assert.equal(r.totalExcluido, 0);
    // Tienda Ortega fuera del escenario; menajes sin valor.
    assert.equal(r.totalPorConfirmar, 5_000_000);
    assert.equal(r.porConfirmarSinValor, 1);
    assert.ok(Math.abs(r.porcentajeEjecucion - (201_485_000 / 192_000_000) * 100) < 1e-9);
    const sumaCats = r.porCategoria.reduce((a, c) => a + c.seleccionado, 0);
    assert.equal(sumaCats, r.totalSeleccionado);
    const sumaPct = r.porCategoria.reduce((a, c) => a + c.porcentaje, 0);
    assert.ok(Math.abs(sumaPct - 100) < 1e-9);
});

test("conceptos cubiertos con CDP, otra vigencia y retirados no afectan el saldo", () => {
    const base = calcularResumen(escenario(0), gastos);
    const sinInformativos = gastos.filter((g) => g.grupo === "PENDIENTE" || g.grupo === "POR_CONFIRMAR");
    const r = calcularResumen(escenario(0), sinInformativos);
    assert.equal(r.totalSeleccionado, base.totalSeleccionado);
    assert.equal(r.saldo, base.saldo);
    // El Interveredal (37.805.000) está registrado pero no se descuenta.
    const inter = gastos.find((g) => g.id === "exc_interveredal")!;
    assert.equal(inter.grupo, "CUBIERTO_CDP");
    assert.equal(inter.valorReferencia, 37_805_000);
});

test("víctimas: saldo de referencia 15.505.200 y separado de la bolsa", () => {
    assert.equal(VICTIMAS_RECURSOS - VICTIMAS_MESA, 15_505_200);
    const r = calcularResumen(escenario(0), gastos);
    assert.equal(r.disponibilidadNeta, 192_000_000);
});

test("desactivar Talento de Barrio aumenta el saldo en 30.000.000", () => {
    const e = escenario(0);
    const g = gastos.find((x) => x.id === "dep_talento")!;
    const antes = calcularResumen(e, gastos);
    e.items = e.items.map((i) => (i.gastoId === g.id ? aplicarCambio(i, { incluido: false }, g) : i));
    const despues = calcularResumen(e, gastos);
    assert.equal(despues.saldo - antes.saldo, 30_000_000);
    assert.equal(despues.saldo, 20_515_000);
    assert.equal(despues.totalExcluido, 30_000_000);
    assert.equal(e.items.find((i) => i.gastoId === g.id)!.estado, "DESCARTADO");
});

test("reducir alumbrado de 10.120.000 a 8.000.000 aumenta el saldo en 2.120.000", () => {
    const e = escenario(0);
    const g = gastos.find((x) => x.id === "cul_alumbrado")!;
    const antes = calcularResumen(e, gastos);
    e.items = e.items.map((i) => (i.gastoId === g.id ? aplicarCambio(i, { valor: 8_000_000 }, g) : i));
    const despues = calcularResumen(e, gastos);
    assert.equal(despues.saldo - antes.saldo, 2_120_000);
    assert.equal(despues.ahorroReducciones, 2_120_000);
    assert.equal(e.items.find((i) => i.gastoId === g.id)!.estado, "REDUCIDO");
});

test("incorporar Tienda Ortega con un clic suma 5.000.000", () => {
    const e = escenario(0);
    const g = gastos.find((x) => x.id === "conf_ortega")!;
    e.items = e.items.map((i) => (i.gastoId === g.id ? aplicarCambio(i, { incluido: true }, g) : i));
    const r = calcularResumen(e, gastos);
    assert.equal(r.totalSeleccionado, 206_485_000);
    assert.equal(r.deficit, 14_485_000);
    assert.equal(r.totalPorConfirmar, 0);
    // Retirarla de nuevo la devuelve a "pendiente de confirmación", no a descartada.
    e.items = e.items.map((i) => (i.gastoId === g.id ? aplicarCambio(i, { incluido: false }, g) : i));
    assert.equal(e.items.find((i) => i.gastoId === g.id)!.estado, "PENDIENTE");
    assert.equal(calcularResumen(e, gastos).totalPorConfirmar, 5_000_000);
});

test("menajes escolares sin valor no suman aunque se incorporen", () => {
    const e = escenario(0);
    const g = gastos.find((x) => x.id === "conf_menajes")!;
    e.items = e.items.map((i) => (i.gastoId === g.id ? aplicarCambio(i, { incluido: true }, g) : i));
    assert.equal(calcularResumen(e, gastos).totalSeleccionado, 201_485_000);
    e.items = e.items.map((i) => (i.gastoId === g.id ? aplicarCambio(i, { valor: 3_000_000 }, g) : i));
    assert.equal(calcularResumen(e, gastos).totalSeleccionado, 204_485_000);
});

test("reglas de estado coherentes", () => {
    const g = gastos.find((x) => x.id === "cul_novenas")!;
    let i = itemsParaEscenario(ids, {}).find((x) => x.gastoId === g.id)!;
    i = aplicarCambio(i, { estado: "DESCARTADO" }, g);
    assert.equal(i.incluido, false);
    i = aplicarCambio(i, { incluido: true }, g);
    assert.equal(i.estado, "PENDIENTE");
    i = aplicarCambio(i, { estado: "APROBADO" }, g);
    i = aplicarCambio(i, { valor: 20_000_000 }, g); // incremento: mantiene aprobado
    assert.equal(i.estado, "APROBADO");
    i = aplicarCambio(i, { valor: 10_000_000 }, g);
    assert.equal(i.estado, "REDUCIDO");
    i = aplicarCambio(i, { valor: 18_290_000 }, g);
    assert.equal(i.estado, "PENDIENTE");
});

test("escenarios precargados", () => {
    const r1 = calcularResumen(escenario(1), gastos);
    assert.equal(r1.totalSeleccionado, 171_485_000);
    assert.equal(r1.saldo, 20_515_000);

    const r2 = calcularResumen(escenario(2), gastos);
    // Reducciones: 2.120.000 + 3.290.000 + 1.150.000 + 2.400.000 + 2.000.000 = 10.960.000
    assert.equal(r2.ahorroReducciones, 10_960_000);
    assert.equal(r2.totalSeleccionado, 190_525_000);
    assert.equal(r2.saldo, 1_475_000);
    assert.equal(r2.reducidos, 5);

    const r3 = calcularResumen(escenario(3), gastos);
    assert.equal(r3.totalSeleccionado, 201_485_000 - 15_000_000 - 2_500_000);
    assert.equal(r3.saldo, 8_015_000);
    assert.equal(r3.aprobados, 8);
});

test("comparación entre escenarios", () => {
    const c = compararEscenarios(escenario(0), escenario(1), gastos);
    assert.equal(c.diferenciaGasto, -30_000_000);
    assert.equal(c.diferenciaSaldo, 30_000_000);
    assert.equal(c.cambios, 1);
    const fila = c.filas.find((f) => f.gasto.id === "dep_talento")!;
    assert.equal(fila.tipo, "RETIRADO");
    assert.equal(fila.diferencia, -30_000_000);

    const c2 = compararEscenarios(escenario(0), escenario(2), gastos);
    assert.equal(c2.diferenciaGasto, -10_960_000);
    assert.equal(c2.filas.filter((f) => f.tipo === "DISMINUYE").length, 5);
});

test("formato y lectura de pesos colombianos (enteros)", () => {
    assert.equal(formatCOP(192_000_000), "$192.000.000");
    assert.equal(formatCOP(2_182_500), "$2.182.500");
    assert.equal(formatCOP(-9_485_000), "-$9.485.000");
    assert.equal(formatCOP(null), "Por definir");
    assert.equal(parseCOP("$8.000.000"), 8_000_000);
    assert.equal(parseCOP("1.317.500"), 1_317_500);
    assert.equal(parseCOP(""), null);
    // Sin errores de coma flotante: 2.182.500 + 1.317.500 = 3.500.000 exacto.
    assert.equal(2_182_500 + 1_317_500, 3_500_000);
});
