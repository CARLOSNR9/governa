// Generación de informes del simulador (PDF institucional y archivo para Excel).
// Se ejecuta en el navegador, reutilizando jsPDF + jspdf-autotable del proyecto.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    calcularResumen,
    compararEscenarios,
    cuentaEnEscenario,
    formatCOP,
    formatPorcentaje,
    itemsPorGasto,
} from "@/lib/simulador/calculos";
import {
    CATEGORIAS,
    ESTADO_LABEL,
    GRUPO_LABEL,
    GRUPOS_INFORMATIVOS,
    SIM_AVISO_LEGAL,
    SIM_ENTIDAD,
    SIM_TITULO_INFORME,
    categoriaInfo,
    type SimConfigDTO,
    type SimEscenarioDTO,
    type SimGastoDTO,
} from "@/lib/simulador/constantes";

const AZUL: [number, number, number] = [30, 41, 99];
const AZUL_CLARO: [number, number, number] = [238, 242, 255];
const ROJO: [number, number, number] = [185, 28, 28];
const VERDE: [number, number, number] = [4, 120, 87];

const ordenCat = (k: string) => CATEGORIAS.findIndex((c) => c.key === k);
const nombreArchivo = (s: string) =>
    s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 60);

function encabezado(doc: jsPDF, subtitulo: string) {
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(...AZUL);
    doc.rect(0, 0, w, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(SIM_ENTIDAD.toUpperCase(), 14, 11);
    doc.setFontSize(15);
    doc.text(SIM_TITULO_INFORME, 14, 19);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(subtitulo, 14, 25.5);
    doc.setFontSize(8);
    doc.text("GOVERNA · Linares Digital", w - 14, 11, { align: "right" });
    doc.setTextColor(15, 23, 42);
}

function piePaginas(doc: jsPDF, generado: string) {
    const total = doc.getNumberOfPages();
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setDrawColor(203, 213, 225);
        doc.line(14, h - 14, w - 14, h - 14);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text("Simulación para toma de decisiones. No constituye certificación presupuestal ni autorización de gasto.", 14, h - 9);
        doc.text(`${generado} · Página ${i} de ${total}`, w - 14, h - 9, { align: "right" });
    }
}

function titulo(doc: jsPDF, texto: string, y: number): number {
    const h = doc.internal.pageSize.getHeight();
    if (y > h - 40) {
        doc.addPage();
        y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...AZUL);
    doc.text(texto, 14, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    return y + 3;
}

const ultimaY = (doc: jsPDF) => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

const estiloTabla = {
    theme: "grid" as const,
    styles: { fontSize: 8, cellPadding: 1.8, lineColor: [226, 232, 240] as [number, number, number], lineWidth: 0.2, textColor: [15, 23, 42] as [number, number, number] },
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: "bold" as const },
    footStyles: { fillColor: AZUL_CLARO, textColor: AZUL, fontStyle: "bold" as const },
    margin: { left: 14, right: 14, bottom: 20 },
};

export function generarPDFEscenario(escenario: SimEscenarioDTO, gastos: SimGastoDTO[], config: SimConfigDTO, usuario: string) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const ahora = new Date();
    const fecha = format(ahora, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
    const r = calcularResumen(escenario, gastos);
    const items = itemsPorGasto(escenario);
    const w = doc.internal.pageSize.getWidth();

    encabezado(doc, "Priorización de gastos y disponibilidad de recursos");

    // Datos del escenario
    let y = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Escenario: ${escenario.nombre}`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 5;
    doc.text(`Fecha de generación: ${fecha}   ·   Generado por: ${usuario}`, 14, y);
    if (escenario.descripcion) {
        y += 5;
        const lineas = doc.splitTextToSize(escenario.descripcion, w - 28);
        doc.text(lineas, 14, y);
        y += (lineas.length - 1) * 4;
    }

    // Resultado destacado
    y += 6;
    const enDeficit = r.deficit > 0;
    doc.setFillColor(...(enDeficit ? ([254, 242, 242] as [number, number, number]) : ([236, 253, 245] as [number, number, number])));
    doc.setDrawColor(...(enDeficit ? ROJO : VERDE));
    doc.roundedRect(14, y, w - 28, 16, 2, 2, "FD");
    doc.setTextColor(...(enDeficit ? ROJO : VERDE));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(enDeficit ? `DÉFICIT: ${formatCOP(r.deficit)}` : `SALDO DISPONIBLE: ${formatCOP(r.superavit)}`, 20, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
        `Gastos seleccionados ${formatCOP(r.totalSeleccionado)} frente a disponibilidad neta ${formatCOP(r.disponibilidadNeta)} · Ejecución proyectada ${formatPorcentaje(r.porcentajeEjecucion)}`,
        20,
        y + 12.5
    );
    doc.setTextColor(15, 23, 42);
    y += 24;

    // 1. Disponibilidad
    y = titulo(doc, "1. Disponibilidad presupuestal y resultado", y);
    autoTable(doc, {
        ...estiloTabla,
        startY: y,
        head: [["Concepto", "Valor"]],
        body: [
            ["Bolsa inicial anunciada", formatCOP(r.bolsaInicial)],
            [`Descuentos estimados (${formatPorcentaje(r.porcentajeDescuento)}): impuestos, estampillas, papelería y otros`, `- ${formatCOP(r.descuento)}`],
            ["Disponibilidad neta para el ejercicio", formatCOP(r.disponibilidadNeta)],
            [`Total gastos seleccionados (${r.seleccionados} actividades)`, formatCOP(r.totalSeleccionado)],
            ["Total gastos excluidos / descartados", formatCOP(r.totalExcluido)],
            ["Ahorro por reducciones frente al valor presupuestado", formatCOP(r.ahorroReducciones)],
            [enDeficit ? "Déficit" : "Saldo disponible (superávit)", formatCOP(enDeficit ? r.deficit : r.superavit)],
            ["Porcentaje de ejecución proyectada de la bolsa", formatPorcentaje(r.porcentajeEjecucion)],
            ["Decisiones: aprobadas / reducidas / pendientes / descartadas", `${r.aprobados} / ${r.reducidos} / ${r.pendientes} / ${r.descartados}`],
        ],
        columnStyles: { 1: { halign: "right", cellWidth: 45, fontStyle: "bold" } },
        didParseCell: (d) => {
            if (d.section === "body" && d.row.index === 6) d.cell.styles.textColor = enDeficit ? ROJO : VERDE;
            if (d.section === "body" && d.row.index === 2) d.cell.styles.fillColor = AZUL_CLARO;
        },
    });

    // 2. Por categoría
    y = titulo(doc, "2. Resumen por categoría", ultimaY(doc) + 9);
    autoTable(doc, {
        ...estiloTabla,
        startY: y,
        head: [["Categoría", "Actividades", "Seleccionado", "Excluido", "Participación"]],
        body: r.porCategoria.map((c) => [c.label, String(c.cantidad), formatCOP(c.seleccionado), formatCOP(c.excluido), formatPorcentaje(c.porcentaje)]),
        foot: [["Total", String(r.seleccionados), formatCOP(r.totalSeleccionado), formatCOP(r.totalExcluido), r.totalSeleccionado > 0 ? "100,0 %" : "0,0 %"]],
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    });

    // 3. Seleccionados
    const activos = gastos.filter((g) => g.grupo === "PENDIENTE" || g.grupo === "POR_CONFIRMAR").sort((a, b) => ordenCat(a.categoria) - ordenCat(b.categoria) || a.orden - b.orden);
    const seleccionados = activos.filter((g) => cuentaEnEscenario(g.grupo, items.get(g.id)));
    y = titulo(doc, "3. Gastos seleccionados", ultimaY(doc) + 9);
    autoTable(doc, {
        ...estiloTabla,
        startY: y,
        head: [["Categoría", "Concepto", "Presupuestado", "Valor simulado", "Estado", "Observaciones"]],
        body: seleccionados.map((g) => {
            const i = items.get(g.id)!;
            return [categoriaInfo(g.categoria).label, g.nombre, formatCOP(g.valorReferencia), formatCOP(i.valor), ESTADO_LABEL[i.estado], i.observaciones ?? ""];
        }),
        foot: [["", "Total seleccionado", "", formatCOP(r.totalSeleccionado), "", ""]],
        columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 52 }, 2: { halign: "right", cellWidth: 24 }, 3: { halign: "right", cellWidth: 24, fontStyle: "bold" }, 4: { cellWidth: 20 } },
    });

    // 4. Excluidos
    const excluidos = activos.filter((g) => g.grupo === "PENDIENTE" && !cuentaEnEscenario(g.grupo, items.get(g.id)));
    y = titulo(doc, "4. Gastos excluidos o descartados del escenario", ultimaY(doc) + 9);
    if (excluidos.length === 0) {
        doc.setFontSize(9);
        doc.text("Ningún gasto pendiente fue excluido en este escenario.", 14, y + 3);
        y += 8;
    } else {
        autoTable(doc, {
            ...estiloTabla,
            startY: y,
            head: [["Categoría", "Concepto", "Valor", "Estado", "Observaciones"]],
            body: excluidos.map((g) => {
                const i = items.get(g.id);
                return [categoriaInfo(g.categoria).label, g.nombre, formatCOP(i?.valor ?? g.valorReferencia), i ? ESTADO_LABEL[i.estado] : "Excluido", i?.observaciones ?? ""];
            }),
            foot: [["", "Total excluido", formatCOP(r.totalExcluido), "", ""]],
            columnStyles: { 2: { halign: "right" } },
        });
        y = ultimaY(doc);
    }

    // 5. Por confirmar
    const porConfirmar = activos.filter((g) => g.grupo === "POR_CONFIRMAR" && !cuentaEnEscenario(g.grupo, items.get(g.id)));
    if (porConfirmar.length > 0) {
        y = titulo(doc, "5. Necesidades pendientes de confirmación (no incluidas)", y + 9);
        autoTable(doc, {
            ...estiloTabla,
            startY: y,
            head: [["Concepto", "Valor", "Observaciones"]],
            body: porConfirmar.map((g) => [g.nombre, formatCOP(items.get(g.id)?.valor ?? g.valorReferencia), g.observaciones ?? ""]),
            columnStyles: { 1: { halign: "right", cellWidth: 30 } },
        });
        y = ultimaY(doc);
    }

    // 6. Informativos
    const informativos = gastos.filter((g) => GRUPOS_INFORMATIVOS.includes(g.grupo));
    if (informativos.length > 0) {
        y = titulo(doc, "6. Conceptos ya cubiertos o excluidos (no afectan el saldo)", y + 9);
        autoTable(doc, {
            ...estiloTabla,
            startY: y,
            head: [["Concepto", "Situación", "Valor", "Observaciones"]],
            body: informativos.map((g) => [g.nombre, GRUPO_LABEL[g.grupo], formatCOP(g.valorReferencia), g.observaciones ?? ""]),
            columnStyles: { 2: { halign: "right", cellWidth: 28 } },
        });
        y = ultimaY(doc);
    }

    // 7. Víctimas
    y = titulo(doc, "7. Recursos de Víctimas – destinación específica (fuera de la bolsa general)", y + 9);
    autoTable(doc, {
        ...estiloTabla,
        startY: y,
        head: [["Concepto", "Valor"]],
        body: [
            ["Recursos de Víctimas", formatCOP(config.victimasRecursos)],
            ["Actividades Mesa Municipal de Víctimas (valor mencionado)", formatCOP(config.victimasMesa)],
            ["Saldo de referencia", formatCOP(config.victimasRecursos - config.victimasMesa)],
        ],
        columnStyles: { 1: { halign: "right", cellWidth: 45, fontStyle: "bold" } },
    });
    y = ultimaY(doc) + 4;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const notaVict = doc.splitTextToSize(
        "Estos recursos no se suman a la disponibilidad general ni financian otras categorías. El saldo requiere validación de la destinación y acuerdos con la Mesa de Víctimas." +
            (config.victimasNotas ? ` ${config.victimasNotas}` : ""),
        w - 28
    );
    doc.text(notaVict, 14, y + 2);
    y += notaVict.length * 3.6 + 2;
    doc.setTextColor(15, 23, 42);

    // Observaciones del escenario
    if (escenario.observaciones) {
        y = titulo(doc, "Observaciones del escenario", y + 7);
        doc.setFontSize(9);
        const lineas = doc.splitTextToSize(escenario.observaciones, w - 28);
        doc.text(lineas, 14, y + 3);
        y += lineas.length * 4 + 3;
    }

    // Aviso legal
    const h = doc.internal.pageSize.getHeight();
    if (y > h - 45) {
        doc.addPage();
        y = 20;
    }
    y += 6;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(217, 119, 6);
    const aviso = doc.splitTextToSize(SIM_AVISO_LEGAL, w - 36);
    doc.roundedRect(14, y, w - 28, aviso.length * 4 + 9, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14);
    doc.text("IMPORTANTE", 18, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.text(aviso, 18, y + 10);
    doc.setTextColor(15, 23, 42);

    piePaginas(doc, `Generado el ${format(ahora, "dd/MM/yyyy HH:mm")}`);
    doc.save(`Simulacion_Presupuestal_2026_${nombreArchivo(escenario.nombre)}_${format(ahora, "yyyyMMdd_HHmm")}.pdf`);
}

export function generarPDFComparacion(a: SimEscenarioDTO, b: SimEscenarioDTO, gastos: SimGastoDTO[], usuario: string) {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const ahora = new Date();
    const c = compararEscenarios(a, b, gastos);
    encabezado(doc, "Comparación de escenarios");
    let y = 40;
    doc.setFontSize(9);
    doc.text(`Fecha de generación: ${format(ahora, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}   ·   Generado por: ${usuario}`, 14, y);
    y += 6;
    autoTable(doc, {
        ...estiloTabla,
        startY: y,
        head: [["Indicador", `A: ${a.nombre}`, `B: ${b.nombre}`, "Diferencia (B - A)"]],
        body: [
            ["Disponibilidad neta", formatCOP(c.resumenA.disponibilidadNeta), formatCOP(c.resumenB.disponibilidadNeta), formatCOP(c.resumenB.disponibilidadNeta - c.resumenA.disponibilidadNeta)],
            ["Gastos seleccionados", formatCOP(c.resumenA.totalSeleccionado), formatCOP(c.resumenB.totalSeleccionado), formatCOP(c.diferenciaGasto)],
            ["Saldo final (negativo = déficit)", formatCOP(c.resumenA.saldo), formatCOP(c.resumenB.saldo), formatCOP(c.diferenciaSaldo)],
            ["Actividades seleccionadas", String(c.resumenA.seleccionados), String(c.resumenB.seleccionados), String(c.resumenB.seleccionados - c.resumenA.seleccionados)],
        ],
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" } },
    });
    const etiqueta = { IGUAL: "Se mantiene", AGREGADO: "Se agrega en B", RETIRADO: "Se retira en B", AUMENTA: "Aumenta", DISMINUYE: "Disminuye", ESTADO: "Cambia estado" } as const;
    y = titulo(doc, `Detalle por gasto (${c.cambios} cambios)`, ultimaY(doc) + 9);
    autoTable(doc, {
        ...estiloTabla,
        startY: y,
        head: [["Categoría", "Concepto", "Valor en A", "Estado en A", "Valor en B", "Estado en B", "Diferencia", "Cambio"]],
        body: c.filas.map((f) => [
            categoriaInfo(f.gasto.categoria).label,
            f.gasto.nombre,
            f.a.cuenta ? formatCOP(f.a.valor) : "No incluido",
            f.a.estado ? ESTADO_LABEL[f.a.estado] : "-",
            f.b.cuenta ? formatCOP(f.b.valor) : "No incluido",
            f.b.estado ? ESTADO_LABEL[f.b.estado] : "-",
            f.diferencia === 0 ? "-" : formatCOP(f.diferencia),
            etiqueta[f.tipo],
        ]),
        columnStyles: { 2: { halign: "right" }, 4: { halign: "right" }, 6: { halign: "right", fontStyle: "bold" } },
        didParseCell: (d) => {
            if (d.section !== "body") return;
            const f = c.filas[d.row.index];
            if (f.tipo !== "IGUAL") d.cell.styles.fillColor = [255, 251, 235];
        },
    });
    piePaginas(doc, `Generado el ${format(ahora, "dd/MM/yyyy HH:mm")}`);
    doc.save(`Comparacion_Escenarios_${nombreArchivo(a.nombre)}_vs_${nombreArchivo(b.nombre)}.pdf`);
}

// ─── Excel (CSV compatible) ─────────────────────────────────────────────────

function celda(v: string | number | null | undefined): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return String(v);
    const s = String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Exporta el escenario en CSV con separador ";" y BOM UTF-8, formato que Excel en
 * configuración regional de Colombia abre directamente con tildes y columnas.
 * Los valores se exportan como enteros para poder sumarlos en Excel.
 */
export function exportarExcelEscenario(escenario: SimEscenarioDTO, gastos: SimGastoDTO[], config: SimConfigDTO, usuario: string) {
    const ahora = new Date();
    const r = calcularResumen(escenario, gastos);
    const items = itemsPorGasto(escenario);
    const filas: (string | number | null)[][] = [];

    filas.push([SIM_ENTIDAD]);
    filas.push([SIM_TITULO_INFORME]);
    filas.push(["Escenario", escenario.nombre]);
    filas.push(["Fecha de generación", format(ahora, "dd/MM/yyyy HH:mm")]);
    filas.push(["Generado por", usuario]);
    filas.push(["Aviso", SIM_AVISO_LEGAL]);
    filas.push([]);
    filas.push(["DISPONIBILIDAD", "Valor (COP)"]);
    filas.push(["Bolsa inicial", r.bolsaInicial]);
    filas.push(["Descuentos", r.descuento]);
    filas.push(["Disponibilidad neta", r.disponibilidadNeta]);
    filas.push(["Total gastos seleccionados", r.totalSeleccionado]);
    filas.push(["Total excluidos / descartados", r.totalExcluido]);
    filas.push(["Saldo final (negativo = déficit)", r.saldo]);
    filas.push(["Ejecución proyectada (%)", r.porcentajeEjecucion.toFixed(2).replace(".", ",")]);
    filas.push([]);
    filas.push(["DETALLE DE GASTOS"]);
    filas.push(["Categoría", "Concepto", "Tipo", "Valor presupuestado", "Valor simulado", "Incluido en el escenario", "Estado", "Prioridad", "Observaciones del escenario", "Descripción"]);
    const ordenados = [...gastos].sort((a, b) => ordenCat(a.categoria) - ordenCat(b.categoria) || a.orden - b.orden);
    for (const g of ordenados) {
        const i = items.get(g.id);
        const activo = g.grupo === "PENDIENTE" || g.grupo === "POR_CONFIRMAR";
        filas.push([
            categoriaInfo(g.categoria).label,
            g.nombre,
            GRUPO_LABEL[g.grupo],
            g.valorReferencia,
            activo ? i?.valor ?? null : null,
            activo ? (cuentaEnEscenario(g.grupo, i) ? "Sí" : "No") : "No aplica",
            activo && i ? ESTADO_LABEL[i.estado] : "",
            g.prioridad,
            i?.observaciones ?? "",
            g.descripcion ?? "",
        ]);
    }
    filas.push([]);
    filas.push(["RESUMEN POR CATEGORÍA"]);
    filas.push(["Categoría", "Actividades", "Seleccionado", "Excluido", "Participación (%)"]);
    for (const c of r.porCategoria) filas.push([c.label, c.cantidad, c.seleccionado, c.excluido, c.porcentaje.toFixed(2).replace(".", ",")]);
    filas.push([]);
    filas.push(["RECURSOS DE VÍCTIMAS (destinación específica, fuera de la bolsa)"]);
    filas.push(["Recursos de Víctimas", config.victimasRecursos]);
    filas.push(["Mesa Municipal de Víctimas", config.victimasMesa]);
    filas.push(["Saldo de referencia", config.victimasRecursos - config.victimasMesa]);
    if (escenario.observaciones) {
        filas.push([]);
        filas.push(["Observaciones del escenario", escenario.observaciones]);
    }

    const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Simulacion_Presupuestal_2026_${nombreArchivo(escenario.nombre)}_${format(ahora, "yyyyMMdd_HHmm")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
