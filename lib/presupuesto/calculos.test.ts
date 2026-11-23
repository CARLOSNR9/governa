// Pruebas del consolidado. Ejecutar con: npm run test:presupuesto
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularDescuento, calcularResumen, totalSeccion, brutoSeccion, valorConcepto, totalFilas } from "./calculos";
import { presupuestoInicial } from "./datos-iniciales";
import { formatCOP, parseEntero } from "./tipos";
import { esquemaPresupuesto } from "./validacion";

const sec = (p: ReturnType<typeof presupuestoInicial>, id: string) => p.secciones.find((s) => s.id === id)!;
const con = (p: ReturnType<typeof presupuestoInicial>, nombre: string) =>
    p.secciones.flatMap((s) => s.conceptos).find((c) => c.nombre.startsWith(nombre))!;

test("disponibilidad: 240.000.000 − 20 % = 192.000.000", () => {
    const r = calcularResumen(presupuestoInicial());
    assert.equal(r.bolsaInicial, 240_000_000);
    assert.equal(r.descuento, 48_000_000);
    assert.equal(r.disponibilidad, 192_000_000);
});

test("si la bolsa cambia a 250.000.000 el sistema se ajusta solo", () => {
    const p = presupuestoInicial();
    p.bolsaInicial = 250_000_000;
    const r = calcularResumen(p);
    assert.equal(r.descuento, 50_000_000);
    assert.equal(r.disponibilidad, 200_000_000);
    assert.equal(calcularDescuento(237_500_000, 2000), 47_500_000);
});

test("deportes: compromisos 99.900.000, menos CDP 37.805.000 = 62.095.000 a la bolsa", () => {
    const p = presupuestoInicial();
    assert.equal(brutoSeccion(sec(p, "deportes")), 99_900_000);
    assert.equal(totalSeccion(sec(p, "deportes")), 62_095_000);
});

test("cultura: cada actividad cuadra con su desglose", () => {
    const p = presupuestoInicial();
    assert.equal(valorConcepto(con(p, "Concurso de afiche")), 2_500_000);
    assert.equal(valorConcepto(con(p, "Alumbrado de Navidad")), 10_120_000);
    assert.equal(valorConcepto(con(p, "Actividad del 7")), 330_000);
    assert.equal(valorConcepto(con(p, "Novenas")), 18_290_000);
    assert.equal(valorConcepto(con(p, "Actividad del 28")), 4_650_000);
    assert.equal(valorConcepto(con(p, "Año Viejo")), 13_400_000);
    // 49.290.000 de actividades + regalos 1.550 × 20.000 = 31.000.000
    assert.equal(valorConcepto(con(p, "Compra de regalos")), 31_000_000);
    assert.equal(totalSeccion(sec(p, "cultura")), 80_290_000);
});

test("gobierno: 44.100.000 sin Tienda Ortega y 49.100.000 con ella", () => {
    const p = presupuestoInicial();
    assert.equal(totalSeccion(sec(p, "gobierno")), 44_100_000);
    con(p, "Tienda Ortega").incluido = true;
    assert.equal(totalSeccion(sec(p, "gobierno")), 49_100_000);
    con(p, "Menajes escolares").incluido = true; // sin valor: no suma
    assert.equal(totalSeccion(sec(p, "gobierno")), 49_100_000);
});

test("resumen general: gastos 186.485.000 y saldo 5.515.000", () => {
    const r = calcularResumen(presupuestoInicial());
    assert.equal(r.totalGastos, 62_095_000 + 80_290_000 + 44_100_000);
    assert.equal(r.totalGastos, 186_485_000);
    assert.equal(r.saldo, 5_515_000);
});

test("quitar Talento de Barrio libera 30.000.000", () => {
    const p = presupuestoInicial();
    const antes = calcularResumen(p).saldo;
    con(p, "Campeonato Nacional Talento").incluido = false;
    assert.equal(calcularResumen(p).saldo - antes, 30_000_000);
});

test("sonido del 28 de diciembre de 400.000 a 500.000 suma 100.000", () => {
    const p = presupuestoInicial();
    const antes = calcularResumen(p).totalGastos;
    con(p, "Actividad del 28").detalles!.find((d) => d.nombre === "Sonido")!.valor = 500_000;
    assert.equal(valorConcepto(con(p, "Actividad del 28")), 4_750_000);
    assert.equal(calcularResumen(p).totalGastos - antes, 100_000);
});

test("regalos: 1.700 niños × 20.000 = 34.000.000", () => {
    const p = presupuestoInicial();
    con(p, "Compra de regalos").calculo!.cantidad = 1_700;
    assert.equal(valorConcepto(con(p, "Compra de regalos")), 34_000_000);
});

test("quitar una actividad completa o una línea del desglose", () => {
    const p = presupuestoInicial();
    const antes = calcularResumen(p).totalGastos;
    con(p, "Año Viejo").incluido = false;
    assert.equal(antes - calcularResumen(p).totalGastos, 13_400_000);
    con(p, "Novenas").detalles!.find((d) => d.nombre === "Incentivo calles iluminadas")!.incluido = false;
    assert.equal(valorConcepto(con(p, "Novenas")), 13_290_000);
});

test("CDP, Víctimas y conceptos por confirmar no afectan la bolsa", () => {
    const p = presupuestoInicial();
    const r = calcularResumen(p);
    assert.equal(r.totalCdp, 60_285_000);
    assert.equal(r.saldoVictimas, 15_505_200);
    assert.equal(totalFilas(p.porConfirmar), 34_000_000);
    p.cdp[0].valor = 99_000_000;
    p.victimas.recursos = 1;
    assert.equal(calcularResumen(p).saldo, r.saldo);
});

test("formato colombiano y lectura de valores", () => {
    assert.equal(formatCOP(192_000_000), "$192.000.000");
    assert.equal(formatCOP(-9_485_000), "-$9.485.000");
    assert.equal(formatCOP(null), "Por definir");
    assert.equal(parseEntero("$2.182.500"), 2_182_500);
    assert.equal(parseEntero(""), null);
});

test("los datos iniciales cumplen la validación del servidor", () => {
    assert.ok(esquemaPresupuesto.safeParse(presupuestoInicial()).success);
    const malo = presupuestoInicial();
    malo.bolsaInicial = -5;
    assert.equal(esquemaPresupuesto.safeParse(malo).success, false);
});

test("observaciones en las líneas del desglose (y documentos guardados sin ellas)", () => {
    const p = presupuestoInicial();
    const linea = con(p, "Concurso de afiche").detalles![0];
    linea.nota = "Pago al ganador el 15 de diciembre";
    assert.ok(esquemaPresupuesto.safeParse(p).success);
    delete linea.nota; // formato anterior, sin el campo
    assert.ok(esquemaPresupuesto.safeParse(p).success);
    assert.equal(valorConcepto(con(p, "Concurso de afiche")), 2_500_000);
});
