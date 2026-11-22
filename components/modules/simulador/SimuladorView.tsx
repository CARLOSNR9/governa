"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
    Calculator,
    Copy,
    FileDown,
    FileSpreadsheet,
    Layers,
    LayoutDashboard,
    ListChecks,
    Lock,
    Maximize2,
    Minimize2,
    Pencil,
    ShieldCheck,
    Unlock,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    actualizarDecision,
    actualizarDisponibilidad,
    actualizarEscenario,
    actualizarGasto,
    actualizarVictimas,
    crearEscenario,
    crearGasto,
    eliminarEscenario,
    eliminarGasto,
    guardarDesglose,
} from "@/app/actions/simulador";
import { aplicarCambio, calcularResumen, formatCOP, formatPorcentaje, type CambioItem } from "@/lib/simulador/calculos";
import { SIM_SUBTITULO, SIM_TITULO, type SimDatos, type SimEscenarioDTO, type SimGastoDTO } from "@/lib/simulador/constantes";
import { PanelEjecutivo } from "./PanelEjecutivo";
import { TablaGastos } from "./TablaGastos";
import { EscenariosView } from "./EscenariosView";
import { InformativosView } from "./InformativosView";
import { DesgloseDialog, DisponibilidadDialog, EscenarioDialog, GastoDialog, type EscenarioForm, type GastoForm } from "./Dialogos";
import { ConfirmDialog } from "./comunes";
import { exportarExcelEscenario, generarPDFComparacion, generarPDFEscenario } from "./informes";

const CLAVE_ESCENARIO = "governa:simulador2026:escenario";

type Res<T> = { success: true; data: T } | { success: false; error: string };

export function SimuladorView({ inicial }: { inicial: SimDatos }) {
    const [datos, setDatos] = useState<SimDatos>(inicial);
    const [activoId, setActivoId] = useState<string>(inicial.escenarios[0]?.id ?? "");
    const [tab, setTab] = useState("panel");
    const [presentacion, setPresentacion] = useState(false);

    const [gastoDialog, setGastoDialog] = useState<{ open: boolean; gasto: SimGastoDTO | null }>({ open: false, gasto: null });
    const [desglose, setDesglose] = useState<SimGastoDTO | null>(null);
    const [dispOpen, setDispOpen] = useState(false);
    const [escDialog, setEscDialog] = useState<{ open: boolean; escenario: SimEscenarioDTO | null; origen: string | null }>({ open: false, escenario: null, origen: null });
    const [borrarGasto, setBorrarGasto] = useState<SimGastoDTO | null>(null);
    const [borrarEscenario, setBorrarEscenario] = useState<SimEscenarioDTO | null>(null);
    const [guardando, setGuardando] = useState(0);
    const datosRef = useRef(datos);
    datosRef.current = datos;

    const { permisos, gastos, escenarios, config } = datos;
    const escenario = escenarios.find((e) => e.id === activoId) ?? escenarios[0];
    const editable = permisos.puedeEditar && !!escenario && !escenario.bloqueado;
    const resumen = useMemo(() => (escenario ? calcularResumen(escenario, gastos) : null), [escenario, gastos]);

    // Recordar el escenario abierto entre visitas.
    useEffect(() => {
        const guardado = window.localStorage.getItem(CLAVE_ESCENARIO);
        if (guardado && inicial.escenarios.some((e) => e.id === guardado)) setActivoId(guardado);
    }, [inicial.escenarios]);
    useEffect(() => {
        if (activoId) window.localStorage.setItem(CLAVE_ESCENARIO, activoId);
    }, [activoId]);

    // Modo presentación: pantalla completa del navegador + vista sin menú lateral.
    useEffect(() => {
        const salir = () => !document.fullscreenElement && setPresentacion(false);
        document.addEventListener("fullscreenchange", salir);
        return () => document.removeEventListener("fullscreenchange", salir);
    }, []);
    const alternarPresentacion = async () => {
        if (!presentacion) {
            setPresentacion(true);
            try {
                await document.documentElement.requestFullscreen?.();
            } catch {
                /* El navegador puede negar la pantalla completa; la vista amplia sigue activa. */
            }
        } else {
            setPresentacion(false);
            if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
        }
    };

    const ejecutar = useCallback(async <T,>(accion: () => Promise<Res<T>>, exito?: string): Promise<T | null> => {
        setGuardando((n) => n + 1);
        try {
            const res = await accion();
            if (!res.success) {
                toast.error(res.error);
                return null;
            }
            if (exito) toast.success(exito);
            return res.data;
        } catch {
            toast.error("No fue posible comunicarse con el servidor. Verifique su conexión.");
            return null;
        } finally {
            setGuardando((n) => n - 1);
        }
    }, []);

    // ─── Cambio de decisión (actualización inmediata + guardado) ────────────
    const cambiarDecision = useCallback(
        async (gastoId: string, cambio: CambioItem) => {
            const actual = datosRef.current;
            const esc = actual.escenarios.find((e) => e.id === activoId) ?? actual.escenarios[0];
            const gasto = actual.gastos.find((g) => g.id === gastoId);
            if (!esc || !gasto) return;
            if (!actual.permisos.puedeEditar) return void toast.error("Su usuario solo tiene permisos de consulta.");
            if (esc.bloqueado) return void toast.warning("Escenario protegido. Duplíquelo o desbloquéelo para hacer cambios.");

            const previo = esc.items.find((i) => i.gastoId === gastoId) ?? {
                gastoId,
                incluido: false,
                valor: gasto.valorReferencia,
                estado: "PENDIENTE" as const,
                observaciones: null,
            };
            const nuevo = aplicarCambio(previo, cambio, gasto);
            const reemplazar = (item: typeof nuevo) =>
                setDatos((d) => ({
                    ...d,
                    escenarios: d.escenarios.map((e) =>
                        e.id !== esc.id
                            ? e
                            : {
                                  ...e,
                                  items: e.items.some((i) => i.gastoId === gastoId) ? e.items.map((i) => (i.gastoId === gastoId ? item : i)) : [...e.items, item],
                                  updatedAt: new Date().toISOString(),
                                  modificadoPor: d.permisos.usuario,
                              }
                    ),
                }));

            reemplazar(nuevo);
            const ok = await ejecutar(() => actualizarDecision(esc.id, gastoId, cambio));
            if (ok === null) reemplazar(previo); // revertir si el servidor rechazó el cambio
        },
        [activoId, ejecutar]
    );

    // ─── Gastos ─────────────────────────────────────────────────────────────
    const guardarGasto = async (f: GastoForm) => {
        const payload = {
            nombre: f.nombre,
            categoria: f.categoria,
            grupo: f.grupo,
            valorReferencia: f.valorReferencia,
            descripcion: f.descripcion,
            observaciones: f.observaciones,
            prioridad: f.prioridad,
        };
        const g = gastoDialog.gasto;
        const res = g
            ? await ejecutar(() => actualizarGasto(g.id, payload), "Concepto actualizado")
            : await ejecutar(() => crearGasto({ ...payload, estado: f.estado }, escenario?.id ?? null, f.incluir), "Gasto registrado");
        if (res) setDatos(res);
        return !!res;
    };

    // ─── Escenarios ─────────────────────────────────────────────────────────
    const guardarEscenario = async (f: EscenarioForm) => {
        const e = escDialog.escenario;
        if (e) {
            const res = await ejecutar(() => actualizarEscenario(e.id, { nombre: f.nombre, descripcion: f.descripcion, observaciones: f.observaciones }), "Escenario actualizado");
            if (res) setDatos(res);
            return !!res;
        }
        const res = await ejecutar(() => crearEscenario({ nombre: f.nombre, descripcion: f.descripcion, observaciones: f.observaciones }, f.origenId), "Escenario creado");
        if (res) {
            setDatos(res.datos);
            setActivoId(res.id);
        }
        return !!res;
    };

    const alternarBloqueo = async (e: SimEscenarioDTO) => {
        const res = await ejecutar(
            () => actualizarEscenario(e.id, { nombre: e.nombre, descripcion: e.descripcion, observaciones: e.observaciones, bloqueado: !e.bloqueado }),
            e.bloqueado ? "Escenario desbloqueado" : "Escenario protegido contra cambios"
        );
        if (res) setDatos(res);
    };

    if (!escenario || !resumen) {
        return <p className="p-10 text-center text-slate-500">No hay escenarios disponibles.</p>;
    }

    const exportarPDF = (e: SimEscenarioDTO) => {
        try {
            generarPDFEscenario(e, gastos, config, permisos.usuario);
        } catch (err) {
            console.error(err);
            toast.error("No fue posible generar el PDF.");
        }
    };

    return (
        <div className={cn(presentacion && "fixed inset-0 z-40 overflow-y-auto bg-slate-100 p-4 md:p-8 dark:bg-slate-950")}>
            <div className={cn("mx-auto space-y-6", presentacion && "max-w-[1800px]")}>
                {/* Encabezado */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Alcaldía Municipal de Linares, Nariño</p>
                        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            <Calculator className="h-8 w-8 text-indigo-600" />
                            {SIM_TITULO}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">{SIM_SUBTITULO}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={escenario.id} onValueChange={setActivoId}>
                            <SelectTrigger className="h-10 w-full bg-white sm:w-[340px] dark:bg-slate-900" aria-label="Escenario en pantalla">
                                <Layers className="h-4 w-4 text-indigo-600" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {escenarios.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                        {e.bloqueado ? "🔒 " : ""}
                                        {e.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="h-10 bg-white dark:bg-slate-900" onClick={() => exportarPDF(escenario)}>
                            <FileDown className="mr-2 h-4 w-4" /> PDF
                        </Button>
                        <Button variant="outline" className="h-10 bg-white dark:bg-slate-900" onClick={() => exportarExcelEscenario(escenario, gastos, config, permisos.usuario)}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                        </Button>
                        <Button variant="outline" className="h-10 bg-white dark:bg-slate-900" onClick={alternarPresentacion} title="Modo presentación para reuniones">
                            {presentacion ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
                            {presentacion ? "Salir" : "Presentar"}
                        </Button>
                    </div>
                </div>

                {/* Avisos de estado */}
                {!permisos.puedeEditar && (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900">
                        <Eye className="h-4 w-4" /> Modo consulta: su usuario puede ver el simulador pero no modificarlo.
                    </div>
                )}
                {permisos.puedeEditar && escenario.bloqueado && (
                    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 md:flex-row md:items-center md:justify-between dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
                        <span className="flex items-center gap-2">
                            <Lock className="h-4 w-4 shrink-0" /> Este escenario está protegido como referencia. Para simular cambios, cree una copia.
                        </span>
                        <div className="flex gap-2">
                            <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => setEscDialog({ open: true, escenario: null, origen: escenario.id })}>
                                <Copy className="mr-1 h-4 w-4" /> Duplicar y editar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => alternarBloqueo(escenario)}>
                                <Unlock className="mr-1 h-4 w-4" /> Desbloquear
                            </Button>
                        </div>
                    </div>
                )}

                {/* Barra de resumen en vivo */}
                <div data-sim="resumen" className="sticky top-0 z-20 -mx-1 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-center">
                        <button
                            type="button"
                            className="group text-left"
                            onClick={() => (editable ? setDispOpen(true) : permisos.puedeEditar && toast.warning("Escenario protegido. Duplíquelo para cambiar la disponibilidad."))}
                            title={editable ? "Editar disponibilidad" : undefined}
                        >
                            <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Disponibilidad neta {editable && <Pencil className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />}
                            </p>
                            <p className="text-lg font-bold tabular-nums text-slate-900 md:text-xl dark:text-slate-100">{formatCOP(resumen.disponibilidadNeta)}</p>
                        </button>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Gastos seleccionados</p>
                            <p className="text-lg font-bold tabular-nums text-indigo-700 md:text-xl dark:text-indigo-300">{formatCOP(resumen.totalSeleccionado)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{resumen.deficit > 0 ? "Déficit" : "Saldo disponible"}</p>
                            <p className={cn("text-lg font-bold tabular-nums md:text-xl", resumen.deficit > 0 ? "text-red-600" : "text-emerald-600")}>
                                {formatCOP(resumen.deficit > 0 ? resumen.deficit : resumen.superavit)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Ejecución proyectada</p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-bold tabular-nums md:text-xl">{formatPorcentaje(resumen.porcentajeEjecucion)}</p>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-500", resumen.porcentajeEjecucion > 100 ? "bg-red-500" : "bg-indigo-600")}
                                        style={{ width: `${Math.min(100, resumen.porcentajeEjecucion)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 md:col-span-4 lg:col-span-1">
                            {resumen.deficit > 0 ? (
                                <Badge className="bg-red-600 text-white">Déficit</Badge>
                            ) : (
                                <Badge className="bg-emerald-600 text-white">Superávit</Badge>
                            )}
                            <span className="text-xs text-slate-400">{guardando > 0 ? "Guardando…" : "Cambios guardados"}</span>
                        </div>
                    </div>
                </div>

                <Tabs value={tab} onValueChange={setTab} className="gap-6">
                    <TabsList className="grid h-auto! w-full grid-cols-1 sm:grid-cols-2 gap-1 bg-white p-1 shadow-sm md:inline-flex md:w-fit dark:bg-slate-900">
                        <TabsTrigger value="panel" className="h-9 px-4">
                            <LayoutDashboard className="mr-1.5 h-4 w-4" /> Panel ejecutivo
                        </TabsTrigger>
                        <TabsTrigger value="gastos" className="h-9 px-4">
                            <ListChecks className="mr-1.5 h-4 w-4" /> Simulación de gastos
                        </TabsTrigger>
                        <TabsTrigger value="escenarios" className="h-9 px-4">
                            <Layers className="mr-1.5 h-4 w-4" /> Escenarios y comparación
                        </TabsTrigger>
                        <TabsTrigger value="informativos" className="h-9 px-4">
                            <ShieldCheck className="mr-1.5 h-4 w-4" /> Cubiertos y Víctimas
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="panel">
                        <PanelEjecutivo resumen={resumen} config={config} nombreEscenario={escenario.nombre} />
                    </TabsContent>

                    <TabsContent value="gastos">
                        <TablaGastos
                            gastos={gastos}
                            escenario={escenario}
                            editable={editable}
                            onCambio={cambiarDecision}
                            onEditar={(g) => (permisos.puedeEditar ? setGastoDialog({ open: true, gasto: g }) : toast.error("Su usuario solo tiene permisos de consulta."))}
                            onDesglose={setDesglose}
                            onEliminar={(g) => (permisos.puedeEditar ? setBorrarGasto(g) : toast.error("Su usuario solo tiene permisos de consulta."))}
                            onNuevo={() => setGastoDialog({ open: true, gasto: null })}
                        />
                    </TabsContent>

                    <TabsContent value="escenarios">
                        <EscenariosView
                            escenarios={escenarios}
                            gastos={gastos}
                            activoId={escenario.id}
                            puedeEditar={permisos.puedeEditar}
                            onActivar={(id) => {
                                setActivoId(id);
                                setTab("gastos");
                            }}
                            onNuevo={() => setEscDialog({ open: true, escenario: null, origen: escenario.id })}
                            onDuplicar={(e) => setEscDialog({ open: true, escenario: null, origen: e.id })}
                            onEditar={(e) => setEscDialog({ open: true, escenario: e, origen: null })}
                            onBloqueo={alternarBloqueo}
                            onEliminar={setBorrarEscenario}
                            onPDF={exportarPDF}
                            onPDFComparacion={(a, b) => generarPDFComparacion(a, b, gastos, permisos.usuario)}
                        />
                    </TabsContent>

                    <TabsContent value="informativos">
                        <InformativosView
                            gastos={gastos}
                            config={config}
                            puedeEditar={permisos.puedeEditar}
                            onEditarGasto={(g) => setGastoDialog({ open: true, gasto: g })}
                            onGuardarVictimas={async (r, m, n) => {
                                const res = await ejecutar(() => actualizarVictimas(r, m, n), "Recursos de Víctimas actualizados");
                                if (res) setDatos(res);
                                return !!res;
                            }}
                        />
                    </TabsContent>
                </Tabs>

                <p className="pb-4 text-center text-xs text-slate-400">
                    Herramienta de planeación y simulación para la toma de decisiones. No constituye certificación presupuestal ni autorización de gasto.
                </p>
            </div>

            {/* Diálogos */}
            <GastoDialog
                open={gastoDialog.open}
                onOpenChange={(o) => setGastoDialog((p) => ({ ...p, open: o }))}
                gasto={gastoDialog.gasto}
                nombreEscenario={escenario.nombre}
                escenarioBloqueado={escenario.bloqueado}
                onGuardar={guardarGasto}
            />
            <DesgloseDialog
                open={!!desglose}
                onOpenChange={(o) => !o && setDesglose(null)}
                gasto={desglose ? gastos.find((g) => g.id === desglose.id) ?? desglose : null}
                valorSimulado={desglose ? escenario.items.find((i) => i.gastoId === desglose.id)?.valor ?? null : null}
                editable={permisos.puedeEditar}
                onGuardar={async (filas) => {
                    if (!desglose) return false;
                    const res = await ejecutar(() => guardarDesglose(desglose.id, filas), "Desglose guardado");
                    if (res) setDatos(res);
                    return !!res;
                }}
            />
            <DisponibilidadDialog
                open={dispOpen}
                onOpenChange={setDispOpen}
                escenario={escenario}
                onGuardar={async (b, d) => {
                    const res = await ejecutar(() => actualizarDisponibilidad(escenario.id, b, d), "Disponibilidad actualizada");
                    if (res) setDatos(res);
                    return !!res;
                }}
            />
            <EscenarioDialog
                open={escDialog.open}
                onOpenChange={(o) => setEscDialog((p) => ({ ...p, open: o }))}
                escenario={escDialog.escenario}
                escenarios={escenarios}
                origenPorDefecto={escDialog.origen}
                onGuardar={guardarEscenario}
            />
            <ConfirmDialog
                open={!!borrarGasto}
                onOpenChange={(o) => !o && setBorrarGasto(null)}
                titulo="¿Eliminar este gasto del catálogo?"
                descripcion={
                    borrarGasto && (
                        <>
                            Se eliminará <b>{borrarGasto.nombre}</b> de <b>todos</b> los escenarios guardados. Si solo quiere quitarlo de este escenario, use
                            “Descartado”. Esta acción no se puede deshacer.
                        </>
                    )
                }
                textoConfirmar="Eliminar definitivamente"
                onConfirm={async () => {
                    if (!borrarGasto) return;
                    const res = await ejecutar(() => eliminarGasto(borrarGasto.id), "Gasto eliminado");
                    if (res) setDatos(res);
                }}
            />
            <ConfirmDialog
                open={!!borrarEscenario}
                onOpenChange={(o) => !o && setBorrarEscenario(null)}
                titulo="¿Eliminar este escenario?"
                descripcion={borrarEscenario && <>Se eliminará el escenario <b>{borrarEscenario.nombre}</b> con todas sus decisiones. Esta acción no se puede deshacer.</>}
                textoConfirmar="Eliminar escenario"
                onConfirm={async () => {
                    if (!borrarEscenario) return;
                    const res = await ejecutar(() => eliminarEscenario(borrarEscenario.id), "Escenario eliminado");
                    if (res) {
                        setDatos(res);
                        if (borrarEscenario.id === activoId) setActivoId(res.escenarios[0]?.id ?? "");
                    }
                }}
            />
        </div>
    );
}
