"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, Copy, FileDown, GitCompareArrows, Lock, MoreVertical, Pencil, PlayCircle, Plus, Trash2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { calcularResumen, compararEscenarios, formatCOP, type TipoCambio } from "@/lib/simulador/calculos";
import { ESTADO_LABEL, categoriaInfo, type SimEscenarioDTO, type SimGastoDTO } from "@/lib/simulador/constantes";
import { SaldoTexto } from "./comunes";

const fecha = (iso: string) => format(new Date(iso), "d MMM yyyy, h:mm a", { locale: es });

const TIPO: Record<TipoCambio, { label: string; clase: string }> = {
    IGUAL: { label: "Se mantiene", clase: "border-slate-200 text-slate-500" },
    AGREGADO: { label: "Se agrega", clase: "border-emerald-300 bg-emerald-50 text-emerald-700" },
    RETIRADO: { label: "Se retira", clase: "border-red-300 bg-red-50 text-red-700" },
    AUMENTA: { label: "Aumenta", clase: "border-orange-300 bg-orange-50 text-orange-700" },
    DISMINUYE: { label: "Disminuye", clase: "border-sky-300 bg-sky-50 text-sky-700" },
    ESTADO: { label: "Cambia estado", clase: "border-violet-300 bg-violet-50 text-violet-700" },
};

export function EscenariosView({
    escenarios,
    gastos,
    activoId,
    puedeEditar,
    onActivar,
    onNuevo,
    onDuplicar,
    onEditar,
    onBloqueo,
    onEliminar,
    onPDF,
    onPDFComparacion,
}: {
    escenarios: SimEscenarioDTO[];
    gastos: SimGastoDTO[];
    activoId: string;
    puedeEditar: boolean;
    onActivar: (id: string) => void;
    onNuevo: () => void;
    onDuplicar: (e: SimEscenarioDTO) => void;
    onEditar: (e: SimEscenarioDTO) => void;
    onBloqueo: (e: SimEscenarioDTO) => void;
    onEliminar: (e: SimEscenarioDTO) => void;
    onPDF: (e: SimEscenarioDTO) => void;
    onPDFComparacion: (a: SimEscenarioDTO, b: SimEscenarioDTO) => void;
}) {
    const [aId, setAId] = useState(escenarios[0]?.id ?? "");
    const [bId, setBId] = useState(escenarios.find((e) => e.id === activoId && e.id !== escenarios[0]?.id)?.id ?? escenarios[1]?.id ?? "");
    const [soloCambios, setSoloCambios] = useState(true);

    const a = escenarios.find((e) => e.id === aId);
    const b = escenarios.find((e) => e.id === bId);
    const comp = useMemo(() => (a && b ? compararEscenarios(a, b, gastos) : null), [a, b, gastos]);

    return (
        <div className="space-y-8">
            {/* Lista de escenarios */}
            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Escenarios guardados</h2>
                        <p className="text-sm text-slate-500">Cada escenario guarda sus propias decisiones. Modificar uno no altera los demás.</p>
                    </div>
                    <Button onClick={onNuevo} disabled={!puedeEditar} className="bg-indigo-600 text-white hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo escenario
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {escenarios.map((e) => {
                        const r = calcularResumen(e, gastos);
                        const activo = e.id === activoId;
                        return (
                            <Card key={e.id} className={cn("gap-3 py-5 shadow-sm transition", activo && "ring-2 ring-indigo-500")}>
                                <CardHeader className="px-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <CardTitle className="flex items-center gap-2 text-base leading-snug">
                                                {e.bloqueado && <Lock className="h-4 w-4 shrink-0 text-amber-600" aria-label="Protegido" />}
                                                {e.nombre}
                                            </CardTitle>
                                            {e.descripcion && <CardDescription className="mt-1 line-clamp-2">{e.descripcion}</CardDescription>}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" aria-label="Acciones del escenario">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onPDF(e)}>
                                                    <FileDown className="mr-2 h-4 w-4" /> Informe PDF
                                                </DropdownMenuItem>
                                                {puedeEditar && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => onDuplicar(e)}>
                                                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onEditar(e)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar nombre y observaciones
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onBloqueo(e)}>
                                                            {e.bloqueado ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                                            {e.bloqueado ? "Desbloquear" : "Proteger contra cambios"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" disabled={e.bloqueado || escenarios.length <= 1} onClick={() => onEliminar(e)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 px-5">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-500">Gastos seleccionados</p>
                                            <p className="font-semibold tabular-nums">{formatCOP(r.totalSeleccionado)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">{r.saldo < 0 ? "Déficit" : "Saldo disponible"}</p>
                                            <SaldoTexto saldo={r.saldo} className="font-semibold" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {r.seleccionados} actividades · {r.aprobados} aprobadas · {r.descartados} descartadas
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Creado {fecha(e.createdAt)}
                                        {e.creadoPor && ` por ${e.creadoPor}`} · Modificado {fecha(e.updatedAt)}
                                        {e.modificadoPor && ` por ${e.modificadoPor}`}
                                    </p>
                                    {e.observaciones && <p className="rounded-md bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">{e.observaciones}</p>}
                                    <Button variant={activo ? "secondary" : "outline"} className="w-full" disabled={activo} onClick={() => onActivar(e.id)}>
                                        <PlayCircle className="mr-2 h-4 w-4" /> {activo ? "Escenario en pantalla" : "Abrir en el simulador"}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Comparador */}
            <section className="space-y-4">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                        <GitCompareArrows className="h-5 w-5 text-indigo-600" /> Comparar escenarios
                    </h2>
                    <p className="text-sm text-slate-500">Vea qué gastos cambian, cuánto varía el gasto y el saldo final de cada alternativa.</p>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Select value={aId} onValueChange={setAId}>
                        <SelectTrigger className="h-10 w-full md:flex-1">
                            <span className="mr-1 font-semibold text-indigo-700">A:</span>
                            <SelectValue placeholder="Escenario A" />
                        </SelectTrigger>
                        <SelectContent>
                            {escenarios.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                    {e.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-400 md:block" />
                    <Select value={bId} onValueChange={setBId}>
                        <SelectTrigger className="h-10 w-full md:flex-1">
                            <span className="mr-1 font-semibold text-indigo-700">B:</span>
                            <SelectValue placeholder="Escenario B" />
                        </SelectTrigger>
                        <SelectContent>
                            {escenarios.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                    {e.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-10" disabled={!a || !b} onClick={() => a && b && onPDFComparacion(a, b)}>
                        <FileDown className="mr-2 h-4 w-4" /> PDF
                    </Button>
                </div>

                {comp && a && b && (
                    <>
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                { t: `A · ${a.nombre}`, r: comp.resumenA },
                                { t: `B · ${b.nombre}`, r: comp.resumenB },
                            ].map(({ t, r }) => (
                                <Card key={t} className="gap-2 py-4 shadow-sm">
                                    <CardContent className="space-y-1 px-5 text-sm">
                                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100" title={t}>
                                            {t}
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="text-slate-500">Disponibilidad</span>
                                            <span className="tabular-nums">{formatCOP(r.disponibilidadNeta)}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="text-slate-500">Gastos</span>
                                            <span className="tabular-nums">{formatCOP(r.totalSeleccionado)}</span>
                                        </p>
                                        <p className="flex justify-between font-semibold">
                                            <span>{r.saldo < 0 ? "Déficit" : "Saldo final"}</span>
                                            <SaldoTexto saldo={r.saldo} />
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                            <Card className="gap-2 border-indigo-200 bg-indigo-50/60 py-4 shadow-sm dark:bg-indigo-900/10">
                                <CardContent className="space-y-1 px-5 text-sm">
                                    <p className="font-semibold text-indigo-900 dark:text-indigo-200">Diferencia (B frente a A)</p>
                                    <p className="flex justify-between">
                                        <span className="text-slate-500">Gasto</span>
                                        <span className={cn("font-semibold tabular-nums", comp.diferenciaGasto > 0 ? "text-orange-700" : comp.diferenciaGasto < 0 ? "text-sky-700" : "")}>
                                            {comp.diferenciaGasto > 0 ? "+" : ""}
                                            {formatCOP(comp.diferenciaGasto)}
                                        </span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-slate-500">Saldo</span>
                                        <span className="font-semibold">
                                            {comp.diferenciaSaldo > 0 ? "+" : ""}
                                            <SaldoTexto saldo={comp.diferenciaSaldo} />
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-500">{comp.cambios} gastos con cambios</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="gap-0 overflow-hidden py-0 shadow-sm">
                            <div className="flex items-center justify-between border-b px-4 py-3">
                                <span className="font-medium">Detalle por gasto</span>
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <Checkbox checked={soloCambios} onCheckedChange={(v) => setSoloCambios(!!v)} /> Mostrar solo los cambios
                                </label>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Concepto</th>
                                            <th className="px-4 py-2 text-right font-medium">Escenario A</th>
                                            <th className="px-4 py-2 text-right font-medium">Escenario B</th>
                                            <th className="px-4 py-2 text-right font-medium">Diferencia</th>
                                            <th className="px-4 py-2 text-left font-medium">Cambio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {comp.filas
                                            .filter((f) => !soloCambios || f.tipo !== "IGUAL")
                                            .map((f) => (
                                                <tr key={f.gasto.id}>
                                                    <td className="px-4 py-2.5">
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">{f.gasto.nombre}</p>
                                                        <p className="text-xs text-slate-500">{categoriaInfo(f.gasto.categoria).label}</p>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums">
                                                        {f.a.cuenta ? formatCOP(f.a.valor) : <span className="text-slate-400">No incluido</span>}
                                                        {f.a.estado && <p className="text-xs text-slate-400">{ESTADO_LABEL[f.a.estado]}</p>}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums">
                                                        {f.b.cuenta ? formatCOP(f.b.valor) : <span className="text-slate-400">No incluido</span>}
                                                        {f.b.estado && <p className="text-xs text-slate-400">{ESTADO_LABEL[f.b.estado]}</p>}
                                                    </td>
                                                    <td className={cn("px-4 py-2.5 text-right font-semibold tabular-nums", f.diferencia > 0 ? "text-orange-700" : f.diferencia < 0 ? "text-sky-700" : "text-slate-400")}>
                                                        {f.diferencia === 0 ? "—" : `${f.diferencia > 0 ? "+" : ""}${formatCOP(f.diferencia)}`}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <Badge variant="outline" className={TIPO[f.tipo].clase}>
                                                            {TIPO[f.tipo].label}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        {soloCambios && comp.cambios === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                                    Los dos escenarios tienen las mismas decisiones.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-semibold dark:bg-slate-900">
                                        <tr>
                                            <td className="px-4 py-2.5">Total seleccionado</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums">{formatCOP(comp.resumenA.totalSeleccionado)}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums">{formatCOP(comp.resumenB.totalSeleccionado)}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums">
                                                {comp.diferenciaGasto > 0 ? "+" : ""}
                                                {formatCOP(comp.diferenciaGasto)}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>
                    </>
                )}
            </section>
        </div>
    );
}
