"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, FileDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { guardarPresupuesto, restablecerPresupuesto } from "@/app/actions/presupuesto";
import { brutoSeccion, calcularResumen, totalFilas, totalItem, totalSeccion, usaCantidad, valorConcepto } from "@/lib/presupuesto/calculos";
import { CANTIDAD_MAXIMA, ENTIDAD, TITULO, formatCOP, formatPorcentajePb, nuevoId, type ConCantidad, type Concepto, type FilaInfo, type Permisos, type Presupuesto, type PresupuestoGuardado } from "@/lib/presupuesto/tipos";
import { Casilla, CeldaTexto, CeldaValor } from "./Celdas";
import { NotaGeneral, NotaItem } from "./Notas";
import { descargarPDF } from "./pdf";

type EstadoGuardado = "guardado" | "pendiente" | "guardando" | "error" | "conflicto";

// Estilos de la hoja
const TH = "border border-slate-300 bg-slate-100 px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";
const TD = "border border-slate-200 px-2 py-1 align-middle";
const TITULO_SECCION = "mt-8 mb-2 text-lg font-bold text-slate-900";

export function ConsolidadoView({ inicial, permisos }: { inicial: PresupuestoGuardado; permisos: Permisos }) {
    const [doc, setDoc] = useState<Presupuesto>(inicial.datos);
    const [estado, setEstado] = useState<EstadoGuardado>("guardado");
    const [contraidos, setContraidos] = useState<Set<string>>(new Set());
    const [confirmar, setConfirmar] = useState<{ titulo: string; texto: string; accion: () => void } | null>(null);
    const editable = permisos.puedeEditar && estado !== "conflicto";
    const r = useMemo(() => calcularResumen(doc), [doc]);

    // ─── Guardado automático (agrupa cambios seguidos y los envía en orden) ──
    const docRef = useRef(doc);
    const versionRef = useRef(inicial.version);
    const enVuelo = useRef(false);
    const sucio = useRef(false);
    const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

    const enviar = useCallback(async () => {
        if (enVuelo.current) {
            sucio.current = true;
            return;
        }
        enVuelo.current = true;
        sucio.current = false;
        setEstado("guardando");
        try {
            const res = await guardarPresupuesto(docRef.current, versionRef.current);
            if (res.success) {
                versionRef.current = res.data.version;
                setEstado(sucio.current ? "pendiente" : "guardado");
            } else {
                setEstado(res.conflicto ? "conflicto" : "error");
                toast.error(res.error);
            }
        } catch {
            setEstado("error");
            toast.error("No fue posible guardar. Verifique su conexión.");
        } finally {
            enVuelo.current = false;
            if (sucio.current) void enviar();
        }
    }, []);

    const mutar = useCallback(
        (fn: (d: Presupuesto) => void) => {
            if (!permisos.puedeEditar) return;
            const copia = structuredClone(docRef.current);
            fn(copia);
            docRef.current = copia;
            setDoc(copia);
            setEstado("pendiente");
            if (temporizador.current) clearTimeout(temporizador.current);
            temporizador.current = setTimeout(() => void enviar(), 600);
        },
        [enviar, permisos.puedeEditar]
    );

    // Avisar si se intenta cerrar la página con cambios sin guardar.
    useEffect(() => {
        const aviso = (e: BeforeUnloadEvent) => {
            if (estado === "pendiente" || estado === "guardando") e.preventDefault();
        };
        window.addEventListener("beforeunload", aviso);
        return () => window.removeEventListener("beforeunload", aviso);
    }, [estado]);

    const buscarConcepto = (d: Presupuesto, sId: string, cId: string) => d.secciones.find((s) => s.id === sId)!.conceptos.find((c) => c.id === cId)!;
    const cambiarConcepto = (sId: string, cId: string, fn: (c: Concepto) => void) => mutar((d) => fn(buscarConcepto(d, sId, cId)));
    const listaInfo = (d: Presupuesto, clave: "cdp" | "porConfirmar" | "retirados") => d[clave];
    /** Cambia cantidad o valor unitario y recalcula el total del ítem. */
    const fijar = (x: ConCantidad & { valor: number | null }, campo: "cantidad" | "valorUnitario", v: number | null) => {
        if (campo === "cantidad") x.cantidad = Math.min(v ?? 0, CANTIDAD_MAXIMA);
        else x.valorUnitario = v;
        if (x.cantidad === undefined) x.cantidad = 1;
        if (x.valorUnitario === undefined) x.valorUnitario = null;
        x.valor = totalItem(x);
    };

    const pedirConfirmacion = (titulo: string, texto: string, accion: () => void) => setConfirmar({ titulo, texto, accion });

    const alternar = (id: string) =>
        setContraidos((p) => {
            const n = new Set(p);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    // ─── Render de una tabla informativa (CDP, por confirmar, retirados) ────
    const tablaInfo = (clave: "cdp" | "porConfirmar" | "retirados", columnas: { nombre: string; valor: string; nota: string }, total?: string) => {
        const filas: FilaInfo[] = doc[clave];
        return (
            <>
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className={cn(TH, "w-12 text-center")}>N.º</th>
                            <th className={TH}>{columnas.nombre}</th>
                            <th className={cn(TH, "w-40 text-right")}>{columnas.valor}</th>
                            <th className={cn(TH, "hidden md:table-cell")}>{columnas.nota}</th>
                            <th className={cn(TH, "w-16")} />
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((f, i) => (
                            <tr key={f.id} className="bg-white">
                                <td className={cn(TD, "text-center text-slate-500")}>{i + 1}</td>
                                <td className={TD}>
                                    <CeldaTexto etiqueta="Concepto" valor={f.nombre} editable={editable} onCambio={(v) => mutar((d) => void (listaInfo(d, clave)[i].nombre = v))} />
                                    <div className="md:hidden">
                                        <CeldaTexto etiqueta={columnas.nota} valor={f.nota} editable={editable} className="text-xs text-slate-500" onCambio={(v) => mutar((d) => void (listaInfo(d, clave)[i].nota = v))} />
                                    </div>
                                </td>
                                <td className={TD}>
                                    <CeldaValor etiqueta={`Valor de ${f.nombre}`} valor={f.valor} editable={editable} onCambio={(v) => mutar((d) => void (listaInfo(d, clave)[i].valor = v))} />
                                </td>
                                <td className={cn(TD, "hidden text-slate-600 md:table-cell")}>
                                    <CeldaTexto etiqueta={columnas.nota} valor={f.nota} editable={editable} onCambio={(v) => mutar((d) => void (listaInfo(d, clave)[i].nota = v))} />
                                </td>
                                <td className={cn(TD, "text-center")}>
                                    <div className="flex items-center justify-center gap-0.5">
                                        <NotaItem titulo={f.nombre} nota={f.notaDetallada ?? ""} editable={editable} onGuardar={(t) => mutar((d) => void (listaInfo(d, clave)[i].notaDetallada = t))} />
                                        {editable && (
                                            <BotonBorrar
                                                onClick={() =>
                                                    pedirConfirmacion("¿Eliminar esta fila?", `Se eliminará "${f.nombre}".`, () => mutar((d) => void listaInfo(d, clave).splice(i, 1)))
                                                }
                                            />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {total && (
                        <tfoot>
                            <tr className="bg-slate-50 font-semibold">
                                <td className={TD} />
                                <td className={TD}>{total}</td>
                                <td className={cn(TD, "px-4 text-right tabular-nums")}>{formatCOP(totalFilas(filas))}</td>
                                <td className={cn(TD, "hidden md:table-cell")} />
                                <td className={TD} />
                            </tr>
                        </tfoot>
                    )}
                </table>
                {editable && (
                    <BotonAgregar onClick={() => mutar((d) => void listaInfo(d, clave).push({ id: nuevoId(), nombre: "Nuevo concepto", valor: null, nota: "" }))}>Agregar fila</BotonAgregar>
                )}
            </>
        );
    };

    let numero = 1;

    return (
        <div className="mx-auto max-w-[1150px] pb-10">
            {/* Encabezado */}
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{ENTIDAD}</p>
                    <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 md:text-3xl">{TITULO}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <EstadoTexto estado={estado} puedeEditar={permisos.puedeEditar} />
                    <Button variant="outline" className="bg-white" onClick={() => descargarPDF(doc, permisos.usuario)}>
                        <FileDown className="mr-2 h-4 w-4" /> Descargar PDF
                    </Button>
                    {permisos.puedeEditar && (
                        <Button
                            variant="outline"
                            className="bg-white"
                            title="Volver a los valores de la reunión financiera"
                            onClick={() =>
                                pedirConfirmacion("¿Restablecer los valores iniciales?", "Se perderán todos los cambios hechos en el consolidado y se cargarán de nuevo los valores de la reunión financiera.", async () => {
                                    const res = await restablecerPresupuesto();
                                    if (!res.success) return void toast.error(res.error);
                                    docRef.current = res.data.datos;
                                    versionRef.current = res.data.version;
                                    setDoc(res.data.datos);
                                    setEstado("guardado");
                                    toast.success("Valores iniciales restablecidos");
                                })
                            }
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Restablecer
                        </Button>
                    )}
                </div>
            </div>

            {estado === "conflicto" && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Otra persona modificó el consolidado mientras usted lo editaba.
                    <Button size="sm" onClick={() => window.location.reload()}>
                        Recargar
                    </Button>
                </div>
            )}

            {/* Franja de saldo siempre visible */}
            <div data-presupuesto="saldo" className="sticky top-0 z-10 mt-4 grid grid-cols-3 border border-slate-300 bg-white text-center shadow-sm">
                <div className="border-r border-slate-200 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 md:text-[11px]">Disponibilidad neta</p>
                    <p className="text-sm font-bold tabular-nums text-slate-900 md:text-lg">{formatCOP(r.disponibilidad)}</p>
                </div>
                <div className="border-r border-slate-200 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 md:text-[11px]">Total gastos</p>
                    <p className="text-sm font-bold tabular-nums text-slate-900 md:text-lg">{formatCOP(r.totalGastos)}</p>
                </div>
                <div className={cn("px-2 py-2", r.saldo < 0 ? "bg-red-50" : "bg-emerald-50")}>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 md:text-[11px]">{r.saldo < 0 ? "Déficit" : "Nos queda"}</p>
                    <p className={cn("text-sm font-bold tabular-nums md:text-lg", r.saldo < 0 ? "text-red-700" : "text-emerald-700")}>{formatCOP(Math.abs(r.saldo))}</p>
                </div>
            </div>

            {/* 1. Disponibilidad */}
            <h2 className={TITULO_SECCION}>{numero++}. Disponibilidad presupuestal general</h2>
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        <th className={TH}>Concepto</th>
                        <th className={cn(TH, "w-44 text-right")}>Valor</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    <tr>
                        <td className={TD}>Bolsa inicial anunciada</td>
                        <td className={TD}>
                            <CeldaValor etiqueta="Bolsa inicial" valor={doc.bolsaInicial} editable={editable} className="font-semibold" onCambio={(v) => mutar((d) => void (d.bolsaInicial = v ?? 0))} />
                        </td>
                    </tr>
                    <tr>
                        <td className={TD}>
                            <span className="inline-flex flex-wrap items-center gap-1">
                                Descuento del
                                {editable ? <PorcentajeEditable pb={doc.descuentoPb} onCambio={(pb) => mutar((d) => void (d.descuentoPb = pb))} /> : <b>{formatPorcentajePb(doc.descuentoPb)}</b>}
                                (impuestos, estampillas, papelería y otros)
                            </span>
                        </td>
                        <td className={cn(TD, "px-4 text-right tabular-nums")}>{formatCOP(r.descuento)}</td>
                    </tr>
                    <tr className="bg-indigo-50 font-bold">
                        <td className={TD}>Disponibilidad neta confirmada</td>
                        <td className={cn(TD, "px-4 text-right tabular-nums")}>{formatCOP(r.disponibilidad)}</td>
                    </tr>
                </tbody>
            </table>

            {/* 2-4. Secciones de gasto */}
            {doc.secciones.map((s) => {
                const tieneDeduccion = s.conceptos.some((c) => c.deduccion);
                let n = 0;
                return (
                    <section key={s.id}>
                        <h2 className={TITULO_SECCION}>
                            {numero++}.{" "}
                            <CeldaTexto
                                etiqueta="Título de la sección"
                                valor={s.titulo}
                                editable={editable}
                                className="inline w-auto text-lg font-bold"
                                onCambio={(v) => mutar((d) => void (d.secciones.find((x) => x.id === s.id)!.titulo = v))}
                            />
                        </h2>
                        {(s.nota || editable) && (
                            <div className="mb-2 text-sm text-slate-600">
                                <CeldaTexto
                                    etiqueta={`Nota de la sección ${s.titulo}`}
                                    valor={s.nota}
                                    editable={editable}
                                    placeholder="Agregar nota de la sección"
                                    onCambio={(t) => mutar((d) => void (d.secciones.find((x) => x.id === s.id)!.nota = t))}
                                />
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th className={cn(TH, "w-10 text-center")} title="Incluir en la suma">✓</th>
                                        <th className={cn(TH, "w-12 text-center")}>N.º</th>
                                        <th className={TH}>Concepto</th>
                                        <th className={cn(TH, "w-24 text-right")}>Cant.</th>
                                        <th className={cn(TH, "w-32 text-right")}>Valor unitario</th>
                                        <th className={cn(TH, "w-36 text-right")}>Total</th>
                                        <th className={cn(TH, "w-56")}>Estado / observación</th>
                                        <th className={cn(TH, "w-16")} title="Nota y eliminar" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {s.conceptos.map((c) => {
                                        const v = valorConcepto(c);
                                        const conDesglose = !!c.detalles?.length;
                                        const abierto = conDesglose && !contraidos.has(c.id);
                                        const num = c.deduccion ? "" : String(++n);
                                        return (
                                            <Fragment key={c.id}>
                                                <tr className={cn(c.incluido ? "bg-white" : "bg-slate-50 text-slate-400", c.deduccion && "italic", conDesglose && "font-semibold")}>
                                                    <td className={cn(TD, "text-center")}>
                                                        <Casilla etiqueta={`Incluir ${c.nombre}`} marcado={c.incluido} editable={editable} onCambio={(m) => cambiarConcepto(s.id, c.id, (x) => void (x.incluido = m))} />
                                                    </td>
                                                    <td className={cn(TD, "text-center text-slate-500")}>{num}</td>
                                                    <td className={TD}>
                                                        <div className="flex items-start gap-1">
                                                            {conDesglose && (
                                                                <button type="button" onClick={() => alternar(c.id)} className="mt-1 text-slate-500 hover:text-indigo-600" aria-label={abierto ? "Ocultar desglose" : "Ver desglose"}>
                                                                    {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                                </button>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <CeldaTexto etiqueta="Concepto" valor={c.nombre} editable={editable} className={cn(!c.incluido && "line-through")} onCambio={(t) => cambiarConcepto(s.id, c.id, (x) => void (x.nombre = t))} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {usaCantidad(c) ? (
                                                        <>
                                                            <td className={cn(TD, "font-normal")}>
                                                                <CeldaValor
                                                                    sinMoneda
                                                                    etiqueta={`Cantidad de ${c.nombre}`}
                                                                    valor={c.cantidad ?? 1}
                                                                    editable={editable}
                                                                    onCambio={(q) => cambiarConcepto(s.id, c.id, (x) => fijar(x, "cantidad", q))}
                                                                />
                                                            </td>
                                                            <td className={cn(TD, "font-normal")}>
                                                                <CeldaValor
                                                                    etiqueta={`Valor unitario de ${c.nombre}`}
                                                                    valor={c.valorUnitario === undefined ? c.valor : c.valorUnitario}
                                                                    editable={editable}
                                                                    onCambio={(q) => cambiarConcepto(s.id, c.id, (x) => fijar(x, "valorUnitario", q))}
                                                                />
                                                            </td>
                                                            <td className={TD}>
                                                                <span className={cn("block px-2 text-right font-semibold tabular-nums", v === null && "font-normal italic text-slate-400", !c.incluido && "line-through")}>
                                                                    {formatCOP(v)}
                                                                </span>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className={TD} />
                                                            <td className={TD} />
                                                            <td className={TD}>
                                                                {c.deduccion ? (
                                                                    <CeldaValor
                                                                        etiqueta={`Valor de ${c.nombre}`}
                                                                        valor={c.valor}
                                                                        negativo
                                                                        editable={editable}
                                                                        className={cn(!c.incluido && "line-through")}
                                                                        onCambio={(x) => cambiarConcepto(s.id, c.id, (y) => void (y.valor = x))}
                                                                    />
                                                                ) : (
                                                                    <span className={cn("block px-2 text-right tabular-nums", !c.incluido && "line-through")}>{formatCOP(v)}</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className={cn(TD, "font-normal text-slate-600")}>
                                                        <CeldaTexto etiqueta="Estado u observación" valor={c.nota} editable={editable} className="text-sm" onCambio={(t) => cambiarConcepto(s.id, c.id, (x) => void (x.nota = t))} />
                                                    </td>
                                                    <td className={cn(TD, "text-center font-normal not-italic")}>
                                                        <div className="flex items-center justify-center gap-0.5">
                                                            <NotaItem
                                                                titulo={c.nombre}
                                                                nota={c.notaDetallada ?? ""}
                                                                editable={editable}
                                                                onGuardar={(t) => cambiarConcepto(s.id, c.id, (x) => void (x.notaDetallada = t))}
                                                            />
                                                            {editable && (
                                                                <BotonBorrar
                                                                    onClick={() =>
                                                                        pedirConfirmacion("¿Eliminar este gasto?", `Se eliminará "${c.nombre}" del consolidado. Si solo quiere quitarlo de la suma, desmarque la casilla.`, () =>
                                                                            mutar((d) => {
                                                                                const sec = d.secciones.find((x) => x.id === s.id)!;
                                                                                sec.conceptos = sec.conceptos.filter((x) => x.id !== c.id);
                                                                            })
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {abierto &&
                                                    c.detalles!.map((dt) => (
                                                        <tr key={dt.id} className={cn("text-[13px]", c.incluido && dt.incluido ? "bg-white text-slate-700" : "bg-slate-50 text-slate-400")}>
                                                            <td className={cn(TD, "text-center")}>
                                                                <Casilla
                                                                    etiqueta={`Incluir ${dt.nombre}`}
                                                                    marcado={dt.incluido}
                                                                    editable={editable && c.incluido}
                                                                    onCambio={(m) => cambiarConcepto(s.id, c.id, (x) => void (x.detalles!.find((y) => y.id === dt.id)!.incluido = m))}
                                                                />
                                                            </td>
                                                            <td className={TD} />
                                                            <td className={cn(TD, "pl-9")}>
                                                                <CeldaTexto
                                                                    etiqueta="Detalle"
                                                                    valor={dt.nombre}
                                                                    editable={editable}
                                                                    className={cn(!dt.incluido && "line-through")}
                                                                    onCambio={(t) => cambiarConcepto(s.id, c.id, (x) => void (x.detalles!.find((y) => y.id === dt.id)!.nombre = t))}
                                                                />
                                                            </td>
                                                            <td className={TD}>
                                                                <CeldaValor
                                                                    sinMoneda
                                                                    etiqueta={`Cantidad de ${dt.nombre} (${c.nombre})`}
                                                                    valor={dt.cantidad ?? 1}
                                                                    editable={editable}
                                                                    onCambio={(q) => cambiarConcepto(s.id, c.id, (y) => fijar(y.detalles!.find((z) => z.id === dt.id)!, "cantidad", q))}
                                                                />
                                                            </td>
                                                            <td className={TD}>
                                                                <CeldaValor
                                                                    etiqueta={`Valor unitario de ${dt.nombre} (${c.nombre})`}
                                                                    valor={dt.valorUnitario === undefined ? dt.valor : dt.valorUnitario}
                                                                    editable={editable}
                                                                    onCambio={(q) => cambiarConcepto(s.id, c.id, (y) => fijar(y.detalles!.find((z) => z.id === dt.id)!, "valorUnitario", q))}
                                                                />
                                                            </td>
                                                            <td className={TD}>
                                                                <span className={cn("block px-2 text-right tabular-nums", totalItem(dt) === null && "italic text-slate-400", !dt.incluido && "line-through")}>
                                                                    {formatCOP(totalItem(dt))}
                                                                </span>
                                                            </td>
                                                            <td className={cn(TD, "text-slate-600")}>
                                                                <CeldaTexto
                                                                    etiqueta={`Observación de ${dt.nombre} (${c.nombre})`}
                                                                    valor={dt.nota ?? ""}
                                                                    editable={editable}
                                                                    placeholder={editable ? "Agregar observación" : "—"}
                                                                    className="text-[13px]"
                                                                    onCambio={(t) => cambiarConcepto(s.id, c.id, (y) => void (y.detalles!.find((z) => z.id === dt.id)!.nota = t))}
                                                                />
                                                            </td>
                                                            <td className={cn(TD, "text-center")}>
                                                                <div className="flex items-center justify-center gap-0.5">
                                                                    <NotaItem
                                                                        titulo={`${dt.nombre} (${c.nombre})`}
                                                                        nota={dt.notaDetallada ?? ""}
                                                                        editable={editable}
                                                                        onGuardar={(t) => cambiarConcepto(s.id, c.id, (y) => void (y.detalles!.find((z) => z.id === dt.id)!.notaDetallada = t))}
                                                                    />
                                                                    {editable && (
                                                                        <BotonBorrar
                                                                            onClick={() =>
                                                                                cambiarConcepto(s.id, c.id, (x) => {
                                                                                    x.detalles = x.detalles!.filter((y) => y.id !== dt.id);
                                                                                })
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {abierto && editable && (
                                                    <tr className="bg-white">
                                                        <td className={TD} />
                                                        <td className={TD} />
                                                        <td className={cn(TD, "pl-9")} colSpan={6}>
                                                            <button
                                                                type="button"
                                                                className="text-xs text-indigo-600 hover:underline"
                                                                onClick={() => cambiarConcepto(s.id, c.id, (x) => void x.detalles!.push({ id: nuevoId(), nombre: "Nuevo ítem", cantidad: 1, valorUnitario: null, valor: null, incluido: true, nota: "" }))}
                                                            >
                                                                + Agregar ítem a “{c.nombre}”
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    {tieneDeduccion && (
                                        <tr className="bg-slate-50 text-slate-600">
                                            <td className={TD} colSpan={5}>
                                                Total compromisos
                                            </td>
                                            <td className={cn(TD, "px-4 text-right tabular-nums")}>{formatCOP(brutoSeccion(s))}</td>
                                            <td className={TD} colSpan={2} />
                                        </tr>
                                    )}
                                    <tr className="bg-indigo-50 font-bold">
                                        <td className={TD} colSpan={5}>
                                            {tieneDeduccion ? "Total a cargo de la bolsa general" : "Total"}
                                        </td>
                                        <td className={cn(TD, "px-4 text-right tabular-nums")}>{formatCOP(totalSeccion(s))}</td>
                                        <td className={TD} colSpan={2} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {editable && (
                            <BotonAgregar
                                onClick={() =>
                                    mutar((d) => {
                                        const lista = d.secciones.find((x) => x.id === s.id)!.conceptos;
                                        const nuevo: Concepto = { id: nuevoId(), nombre: "Nuevo gasto", incluido: true, cantidad: 1, valorUnitario: null, valor: null, nota: "" };
                                        // Los gastos nuevos van antes de la fila de deducción (CDP), si existe.
                                        const iDeduccion = lista.findIndex((x) => x.deduccion);
                                        if (iDeduccion >= 0) lista.splice(iDeduccion, 0, nuevo);
                                        else lista.push(nuevo);
                                    })
                                }
                            >
                                Agregar gasto
                            </BotonAgregar>
                        )}
                        <NotaGeneral
                            titulo={`Nota general de ${s.titulo.split(/\s+[–-]\s+/)[0]}`}
                            nota={s.notaGeneral ?? ""}
                            editable={editable}
                            onGuardar={(t) => mutar((d) => void (d.secciones.find((x) => x.id === s.id)!.notaGeneral = t))}
                        />
                    </section>
                );
            })}

            {/* Resumen */}
            <h2 className={TITULO_SECCION}>{numero++}. Resumen general</h2>
            <table className="w-full border-collapse text-sm">
                <tbody className="bg-white">
                    <tr className="font-semibold">
                        <td className={TD}>Disponibilidad neta confirmada</td>
                        <td className={cn(TD, "w-44 px-4 text-right tabular-nums")}>{formatCOP(r.disponibilidad)}</td>
                    </tr>
                    {r.secciones.map((s) => (
                        <tr key={s.id}>
                            <td className={cn(TD, "pl-6")}>Menos: {s.titulo}</td>
                            <td className={cn(TD, "px-4 text-right tabular-nums")}>-{formatCOP(s.total)}</td>
                        </tr>
                    ))}
                    <tr className="font-semibold">
                        <td className={TD}>Total gastos</td>
                        <td className={cn(TD, "px-4 text-right tabular-nums")}>{formatCOP(r.totalGastos)}</td>
                    </tr>
                    <tr className={cn("text-base font-bold", r.saldo < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
                        <td className={TD}>{r.saldo < 0 ? "DÉFICIT (faltan recursos)" : "SALDO DISPONIBLE (nos queda)"}</td>
                        <td className={cn(TD, "px-4 text-right tabular-nums")}>{formatCOP(Math.abs(r.saldo))}</td>
                    </tr>
                </tbody>
            </table>

            {/* CDP */}
            <h2 className={TITULO_SECCION}>{numero++}. Gastos que ya tienen CDP</h2>
            <p className="mb-2 text-sm text-slate-600">Ya están presupuestados y listos para ejecutarse. No se toman de la bolsa general.</p>
            {tablaInfo("cdp", { nombre: "Concepto", valor: "Valor CDP", nota: "Observación" }, "Total de CDP relacionados")}

            {/* Destinación independiente */}
            <h2 className={TITULO_SECCION}>{numero++}. Recursos de destinación independiente</h2>
            <h3 className="mb-1 font-semibold text-slate-800">Víctimas</h3>
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        <th className={TH}>Concepto</th>
                        <th className={cn(TH, "w-44 text-right")}>Valor</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    <tr>
                        <td className={TD}>Recursos de Víctimas</td>
                        <td className={TD}>
                            <CeldaValor etiqueta="Recursos de Víctimas" valor={doc.victimas.recursos} editable={editable} onCambio={(v) => mutar((d) => void (d.victimas.recursos = v ?? 0))} />
                        </td>
                    </tr>
                    <tr>
                        <td className={TD}>Actividades de la Mesa Municipal de Víctimas</td>
                        <td className={TD}>
                            <CeldaValor etiqueta="Mesa Municipal de Víctimas" valor={doc.victimas.mesa} editable={editable} onCambio={(v) => mutar((d) => void (d.victimas.mesa = v ?? 0))} />
                        </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                        <td className={TD}>Saldo de referencia</td>
                        <td className={cn(TD, "px-4 text-right tabular-nums")}>{formatCOP(r.saldoVictimas)}</td>
                    </tr>
                </tbody>
            </table>
            <div className="mt-1 text-sm text-slate-600">
                <CeldaTexto etiqueta="Nota de Víctimas" valor={doc.victimas.nota} editable={editable} placeholder="Agregar observación" onCambio={(t) => mutar((d) => void (d.victimas.nota = t))} />
            </div>

            <h3 className="mb-1 mt-5 font-semibold text-slate-800">Por confirmar (no se suman a la bolsa)</h3>
            {tablaInfo("porConfirmar", { nombre: "Concepto", valor: "Valor", nota: "Observación" })}

            {/* Retirados */}
            <h2 className={TITULO_SECCION}>{numero++}. Conceptos retirados o aplazados</h2>
            <p className="mb-2 text-sm text-slate-600">Se mencionaron, pero no son pendientes activos de la bolsa general.</p>
            {tablaInfo("retirados", { nombre: "Concepto", valor: "Valor", nota: "Situación" })}

            {/* Nota general de todo el presupuesto */}
            <h2 className={TITULO_SECCION}>{numero++}. Nota general del presupuesto</h2>
            <NotaGeneral
                destacada
                titulo="Nota general (todo el presupuesto 2026)"
                nota={doc.notaGeneral ?? ""}
                editable={editable}
                onGuardar={(t) => mutar((d) => void (d.notaGeneral = t))}
            />
            {!editable && !doc.notaGeneral && <p className="text-sm text-slate-400">Sin nota general.</p>}

            <p className="mt-8 border-t border-slate-200 pt-3 text-center text-xs text-slate-500">
                Documento de trabajo para la toma de decisiones. No constituye certificado de disponibilidad presupuestal ni autorización de gasto.
                {permisos.puedeEditar && " Haga clic sobre cualquier valor o texto para editarlo; desmarque la casilla para quitar un gasto de la suma."}
            </p>

            <Dialog open={!!confirmar} onOpenChange={(o) => !o && setConfirmar(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{confirmar?.titulo}</DialogTitle>
                        <DialogDescription>{confirmar?.texto}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmar(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                confirmar?.accion();
                                setConfirmar(null);
                            }}
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function EstadoTexto({ estado, puedeEditar }: { estado: EstadoGuardado; puedeEditar: boolean }) {
    if (!puedeEditar) return <span className="text-xs text-slate-500">Solo consulta</span>;
    const textos: Record<EstadoGuardado, string> = {
        guardado: "✓ Cambios guardados",
        pendiente: "Guardando…",
        guardando: "Guardando…",
        error: "⚠ No se pudo guardar",
        conflicto: "⚠ Versión desactualizada",
    };
    return <span className={cn("text-xs", estado === "error" || estado === "conflicto" ? "text-red-600" : "text-slate-500")}>{textos[estado]}</span>;
}

function PorcentajeEditable({ pb, onCambio }: { pb: number; onCambio: (pb: number) => void }) {
    const [editando, setEditando] = useState(false);
    const [texto, setTexto] = useState("");
    if (!editando)
        return (
            <button
                type="button"
                className="rounded px-1 font-semibold hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200"
                title="Clic para cambiar el porcentaje"
                onClick={() => {
                    setTexto(String(pb / 100).replace(".", ","));
                    setEditando(true);
                }}
            >
                {formatPorcentajePb(pb)}
            </button>
        );
    const confirmar = () => {
        setEditando(false);
        const n = Number.parseFloat(texto.replace(",", "."));
        if (Number.isFinite(n) && n >= 0 && n <= 100) onCambio(Math.round(n * 100));
    };
    return (
        <input
            autoFocus
            aria-label="Porcentaje de descuento"
            inputMode="decimal"
            className="w-16 rounded border border-indigo-400 px-1 text-right outline-none ring-2 ring-indigo-200"
            value={texto}
            onChange={(e) => setTexto(e.target.value.replace(/[^\d,\.]/g, ""))}
            onBlur={confirmar}
            onKeyDown={(e) => {
                if (e.key === "Enter") confirmar();
                if (e.key === "Escape") setEditando(false);
            }}
        />
    );
}

function BotonBorrar({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar" title="Eliminar">
            <Trash2 className="h-4 w-4" />
        </button>
    );
}

function BotonAgregar({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} className="mt-1.5 inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-indigo-600 hover:bg-indigo-50">
            <Plus className="h-4 w-4" /> {children}
        </button>
    );
}
