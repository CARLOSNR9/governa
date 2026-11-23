// PDF del consolidado (mismo contenido de la hoja), con jsPDF del proyecto.
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { brutoSeccion, calcularResumen, totalFilas, totalSeccion, valorConcepto } from "@/lib/presupuesto/calculos";
import { AVISO, ENTIDAD, TITULO, formatCOP, formatPorcentajePb, type FilaInfo, type Presupuesto } from "@/lib/presupuesto/tipos";

const AZUL: [number, number, number] = [30, 41, 99];
const GRIS: [number, number, number] = [148, 163, 184];

export function descargarPDF(p: Presupuesto, usuario: string) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const ancho = doc.internal.pageSize.getWidth();
    const ahora = new Date();
    const r = calcularResumen(p);
    const base = {
        theme: "grid" as const,
        styles: { fontSize: 8.5, cellPadding: 1.6, lineColor: [203, 213, 225] as [number, number, number], lineWidth: 0.2, textColor: [15, 23, 42] as [number, number, number] },
        headStyles: { fillColor: [241, 245, 249] as [number, number, number], textColor: [51, 65, 85] as [number, number, number], fontStyle: "bold" as const },
        footStyles: { fillColor: [238, 242, 255] as [number, number, number], textColor: AZUL, fontStyle: "bold" as const },
        margin: { left: 14, right: 14, bottom: 18 },
        showFoot: "lastPage" as const,
    };
    let y = 0;
    const siguiente = (extra = 8) => ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? y) + extra;
    const titulo = (t: string, nota?: string) => {
        if (y > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            y = 18;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...AZUL);
        doc.text(t, 14, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        y += 2;
        if (nota) {
            doc.setFontSize(8);
            const lineas = doc.splitTextToSize(nota, ancho - 28);
            doc.text(lineas, 14, y + 3);
            y += lineas.length * 3.4 + 1;
        }
        doc.setTextColor(15, 23, 42);
        y += 1;
    };

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(ENTIDAD.toUpperCase(), 14, 16);
    doc.setFontSize(15);
    doc.setTextColor(...AZUL);
    doc.text(TITULO.toUpperCase(), 14, 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el ${format(ahora, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })} por ${usuario}`, 14, 28);
    y = 37;

    let num = 1;
    titulo(`${num++}. Disponibilidad presupuestal general`);
    autoTable(doc, {
        ...base,
        startY: y,
        head: [["Concepto", "Valor"]],
        body: [
            ["Bolsa inicial anunciada", formatCOP(r.bolsaInicial)],
            [`Descuento del ${formatPorcentajePb(p.descuentoPb)} (impuestos, estampillas, papelería y otros)`, formatCOP(r.descuento)],
        ],
        foot: [["Disponibilidad neta confirmada", formatCOP(r.disponibilidad)]],
        columnStyles: { 1: { halign: "right", cellWidth: 40 } },
    });
    y = siguiente(10);

    for (const s of p.secciones) {
        titulo(`${num++}. ${s.titulo}`, s.nota);
        const filas: RowInput[] = [];
        let n = 0;
        for (const c of s.conceptos) {
            const v = valorConcepto(c);
            const fuera = !c.incluido;
            const nombre = c.calculo ? `${c.nombre} (${c.calculo.cantidad.toLocaleString("es-CO")} ${c.calculo.etiquetaCantidad} × ${formatCOP(c.calculo.valorUnitario)})` : c.nombre;
            const estiloFila = fuera ? { textColor: GRIS, fontStyle: "italic" as const } : c.detalles?.length ? { fontStyle: "bold" as const } : {};
            filas.push([
                { content: c.deduccion ? "" : String(++n), styles: { halign: "center", ...estiloFila } },
                { content: nombre, styles: estiloFila },
                { content: v === null ? "Por definir" : `${c.deduccion ? "-" : ""}${formatCOP(v)}`, styles: { halign: "right", ...estiloFila } },
                { content: fuera ? `NO INCLUIDO${c.nota ? ` · ${c.nota}` : ""}` : c.nota, styles: estiloFila },
            ]);
            if (c.detalles?.length && c.incluido) {
                for (const d of c.detalles) {
                    const e = d.incluido ? { textColor: [71, 85, 105] as [number, number, number] } : { textColor: GRIS, fontStyle: "italic" as const };
                    filas.push([
                        "",
                        { content: `    ${d.nombre}`, styles: e },
                        { content: d.valor === null ? "Por definir" : formatCOP(d.valor), styles: { halign: "right", ...e } },
                        { content: d.incluido ? d.nota ?? "" : `No incluido${d.nota ? ` · ${d.nota}` : ""}`, styles: e },
                    ]);
                }
            }
        }
        const pie: RowInput[] = [];
        if (s.conceptos.some((c) => c.deduccion)) pie.push(["", "Total compromisos", { content: formatCOP(brutoSeccion(s)), styles: { halign: "right" } }, ""]);
        pie.push(["", s.conceptos.some((c) => c.deduccion) ? "Total a cargo de la bolsa general" : "Total", { content: formatCOP(totalSeccion(s)), styles: { halign: "right" } }, ""]);
        autoTable(doc, {
            ...base,
            startY: y,
            head: [["N.º", "Concepto", "Valor", "Estado / observación"]],
            body: filas,
            foot: pie,
            columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 30 }, 3: { cellWidth: 50 } },
        });
        y = siguiente(10);
    }

    titulo(`${num++}. Resumen general`);
    autoTable(doc, {
        ...base,
        startY: y,
        body: [
            [{ content: "Disponibilidad neta confirmada", styles: { fontStyle: "bold" } }, { content: formatCOP(r.disponibilidad), styles: { fontStyle: "bold" } }],
            ...r.secciones.map((s) => [`   Menos: ${s.titulo}`, `-${formatCOP(s.total)}`]),
            [{ content: "Total gastos", styles: { fontStyle: "bold" } }, { content: formatCOP(r.totalGastos), styles: { fontStyle: "bold" } }],
        ],
        foot: [[r.saldo < 0 ? "DÉFICIT (faltan recursos)" : "SALDO DISPONIBLE", formatCOP(Math.abs(r.saldo))]],
        footStyles: { ...base.footStyles, fillColor: r.saldo < 0 ? [254, 226, 226] : [220, 252, 231], textColor: r.saldo < 0 ? [185, 28, 28] : [4, 120, 87], fontSize: 10 },
        columnStyles: { 1: { halign: "right", cellWidth: 40 } },
    });
    y = siguiente(10);

    const info = (t: string, nota: string, filas: FilaInfo[], col: string, totalTxt?: string) => {
        titulo(t, nota);
        autoTable(doc, {
            ...base,
            startY: y,
            head: [["N.º", "Concepto", "Valor", col]],
            body: filas.map((f, i) => [String(i + 1), f.nombre, { content: formatCOP(f.valor), styles: { halign: "right" } }, f.nota]),
            foot: totalTxt ? [["", totalTxt, { content: formatCOP(totalFilas(filas)), styles: { halign: "right" } }, ""]] : undefined,
            columnStyles: { 0: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 30 }, 3: { cellWidth: 60 } },
        });
        y = siguiente(10);
    };

    info(`${num++}. Gastos que ya tienen CDP`, "Ya están presupuestados y listos para ejecutarse. No se toman de la bolsa general.", p.cdp, "Observación", "Total de CDP relacionados");

    titulo(`${num++}. Recursos de destinación independiente – Víctimas`, p.victimas.nota);
    autoTable(doc, {
        ...base,
        startY: y,
        head: [["Concepto", "Valor"]],
        body: [
            ["Recursos de Víctimas", formatCOP(p.victimas.recursos)],
            ["Actividades de la Mesa Municipal de Víctimas", formatCOP(p.victimas.mesa)],
        ],
        foot: [["Saldo de referencia", formatCOP(r.saldoVictimas)]],
        columnStyles: { 1: { halign: "right", cellWidth: 40 } },
    });
    y = siguiente(10);
    if (p.porConfirmar.length) info("Por confirmar (no se suman a la bolsa)", "", p.porConfirmar, "Observación");
    info(`${num++}. Conceptos retirados o aplazados`, "Se mencionaron, pero no son pendientes activos de la bolsa general.", p.retirados, "Situación");

    // Pie de página
    const total = doc.getNumberOfPages();
    const alto = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(AVISO, 14, alto - 9, { maxWidth: ancho - 50 });
        doc.text(`Página ${i} de ${total}`, ancho - 14, alto - 9, { align: "right" });
    }

    doc.save(`Consolidado_Gastos_Cierre_2026_${format(ahora, "yyyyMMdd_HHmm")}.pdf`);
}
