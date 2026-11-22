"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Clock, Landmark, ListChecks, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCOP, formatCOPCorto, formatPorcentaje, type ResumenEscenario } from "@/lib/simulador/calculos";
import type { SimConfigDTO } from "@/lib/simulador/constantes";

const COLOR_SELECCIONADO = "#2a78d6";
const COLOR_EXCLUIDO = "#a8a7a2";
const COLOR_DISPONIBLE = "#1baf7a";

function Kpi({
    titulo,
    valor,
    detalle,
    icono: Icono,
    tono = "neutro",
    destacado = false,
}: {
    titulo: string;
    valor: string;
    detalle?: React.ReactNode;
    icono: React.ComponentType<{ className?: string }>;
    tono?: "neutro" | "positivo" | "negativo" | "info" | "alerta";
    destacado?: boolean;
}) {
    const tonos = {
        neutro: "text-slate-900 dark:text-slate-100",
        positivo: "text-emerald-700 dark:text-emerald-400",
        negativo: "text-red-700 dark:text-red-400",
        info: "text-indigo-700 dark:text-indigo-300",
        alerta: "text-amber-700 dark:text-amber-400",
    };
    const iconos = {
        neutro: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        positivo: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30",
        negativo: "bg-red-50 text-red-600 dark:bg-red-900/30",
        info: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30",
        alerta: "bg-amber-50 text-amber-600 dark:bg-amber-900/30",
    };
    return (
        <Card className={cn("gap-3 py-5 shadow-sm", destacado && "bg-gradient-to-br from-indigo-700 to-indigo-900 text-white border-none shadow-lg")}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 px-5">
                <CardTitle className={cn("text-sm font-medium", destacado ? "text-indigo-100" : "text-slate-500 dark:text-slate-400")}>{titulo}</CardTitle>
                <div className={cn("rounded-lg p-2", destacado ? "bg-white/15 text-white" : iconos[tono])}>
                    <Icono className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent className="px-5">
                <div className={cn("text-2xl xl:text-3xl font-bold tracking-tight tabular-nums break-words", destacado ? "text-white" : tonos[tono])}>{valor}</div>
                {detalle && <div className={cn("mt-1 text-xs", destacado ? "text-indigo-200" : "text-slate-500 dark:text-slate-400")}>{detalle}</div>}
            </CardContent>
        </Card>
    );
}

interface TooltipEntrada {
    dataKey?: string | number;
    name?: string;
    value?: number;
    color?: string;
    fill?: string;
    payload?: { color?: string };
}

function TooltipCOP({ active, payload, label }: { active?: boolean; payload?: TooltipEntrada[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
            {label && <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{label}</p>}
            {payload.map((p) => (
                <p key={p.dataKey ?? p.name} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.payload?.color ?? p.color ?? p.fill }} />
                    {p.name}: <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatCOP(p.value ?? 0)}</span>
                </p>
            ))}
        </div>
    );
}

/** Barra horizontal de disponibilidad frente a compromisos, con marca en el límite disponible. */
function BarraDisponibilidad({ r }: { r: ResumenEscenario }) {
    const maximo = Math.max(r.disponibilidadNeta, r.totalSeleccionado, 1);
    const pctSel = (Math.min(r.totalSeleccionado, r.disponibilidadNeta) / maximo) * 100;
    const pctExceso = (r.deficit / maximo) * 100;
    const pctLimite = (r.disponibilidadNeta / maximo) * 100;
    return (
        <div className="space-y-3">
            <div className="relative h-10 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                <div className="absolute inset-y-0 left-0 rounded-l-lg transition-all duration-500" style={{ width: `${pctSel}%`, background: COLOR_SELECCIONADO }} />
                {pctExceso > 0 && (
                    <div
                        className="absolute inset-y-0 transition-all duration-500"
                        style={{
                            left: `calc(${pctLimite}% + 2px)`,
                            width: `calc(${pctExceso}% - 2px)`,
                            background: "repeating-linear-gradient(135deg, #d03b3b 0 6px, #e66767 6px 12px)",
                        }}
                    />
                )}
                <div className="absolute inset-y-0 w-0.5 bg-slate-900 dark:bg-white" style={{ left: `${pctLimite}%` }} title="Límite de disponibilidad" />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_SELECCIONADO }} /> Gastos seleccionados: <b className="tabular-nums text-slate-900 dark:text-slate-100">{formatCOP(r.totalSeleccionado)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-3 w-0.5 bg-slate-900 dark:bg-white" /> Disponibilidad neta: <b className="tabular-nums text-slate-900 dark:text-slate-100">{formatCOP(r.disponibilidadNeta)}</b>
                </span>
                {r.deficit > 0 ? (
                    <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> Excede en <b className="tabular-nums">{formatCOP(r.deficit)}</b>
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Queda libre <b className="tabular-nums">{formatCOP(r.superavit)}</b>
                    </span>
                )}
            </div>
        </div>
    );
}

export function PanelEjecutivo({ resumen: r, config, nombreEscenario }: { resumen: ResumenEscenario; config: SimConfigDTO; nombreEscenario: string }) {
    const categorias = r.porCategoria.filter((c) => c.seleccionado > 0 || c.excluido > 0);
    const conSeleccion = categorias.filter((c) => c.seleccionado > 0);
    const datosBarras = categorias.map((c) => ({ name: c.label, Seleccionado: c.seleccionado, Excluido: c.excluido }));
    const datosComparacion = [
        { name: "Disponibilidad neta", valor: r.disponibilidadNeta, color: COLOR_DISPONIBLE },
        { name: "Gastos seleccionados", valor: r.totalSeleccionado, color: COLOR_SELECCIONADO },
        { name: "Excluidos / descartados", valor: r.totalExcluido, color: COLOR_EXCLUIDO },
    ];
    const saldoVictimas = config.victimasRecursos - config.victimasMesa;

    return (
        <div className="space-y-6">
            {/* Tarjetas principales */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Kpi
                    destacado
                    titulo="Disponibilidad neta"
                    valor={formatCOP(r.disponibilidadNeta)}
                    icono={Landmark}
                    detalle={
                        <>
                            Bolsa {formatCOP(r.bolsaInicial)} − descuentos {formatCOP(r.descuento)} ({formatPorcentaje(r.porcentajeDescuento)})
                        </>
                    }
                />
                <Kpi
                    titulo="Gastos seleccionados"
                    valor={formatCOP(r.totalSeleccionado)}
                    icono={Wallet}
                    tono="info"
                    detalle={<>{formatPorcentaje(r.porcentajeEjecucion)} de ejecución proyectada · {r.seleccionados} actividades</>}
                />
                <Kpi
                    titulo="Saldo disponible"
                    valor={formatCOP(r.superavit)}
                    icono={r.saldo >= 0 ? PiggyBank : CircleDollarSign}
                    tono={r.saldo >= 0 ? "positivo" : "neutro"}
                    detalle={r.saldo >= 0 ? "Superávit frente a la disponibilidad" : "Sin saldo: los gastos superan la disponibilidad"}
                />
                <Kpi
                    titulo="Déficit"
                    valor={r.deficit > 0 ? formatCOP(r.deficit) : "$0"}
                    icono={r.deficit > 0 ? TrendingDown : TrendingUp}
                    tono={r.deficit > 0 ? "negativo" : "positivo"}
                    detalle={r.deficit > 0 ? "Debe reducir o descartar gastos" : "Sin déficit: el escenario es viable"}
                />
                <Kpi titulo="Actividades aprobadas" valor={String(r.aprobados)} icono={ListChecks} tono="positivo" detalle={`${r.reducidos} reducidas · ${r.descartados} descartadas`} />
                <Kpi titulo="Pendientes de decisión" valor={String(r.pendientes)} icono={Clock} tono="alerta" detalle="Incluidas, aún sin aprobar" />
            </div>

            {/* Disponibilidad vs compromisos */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Disponibilidad frente a compromisos</CardTitle>
                    <CardDescription>
                        {nombreEscenario} · ejecución proyectada de la bolsa: <b className="tabular-nums">{formatPorcentaje(r.porcentajeEjecucion)}</b>
                        {r.ahorroReducciones > 0 && <> · ahorro por reducciones: <b className="tabular-nums">{formatCOP(r.ahorroReducciones)}</b></>}
                        {r.incrementos > 0 && <> · incrementos: <b className="tabular-nums">{formatCOP(r.incrementos)}</b></>}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <BarraDisponibilidad r={r} />
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datosComparacion} layout="vertical" margin={{ left: 8, right: 110 }} barCategoryGap={10}>
                                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" tickFormatter={formatCOPCorto} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="name" width={160} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<TooltipCOP />} cursor={{ fill: "#f1f5f9" }} />
                                <Bar dataKey="valor" name="Valor" radius={[0, 4, 4, 0]} maxBarSize={28}>
                                    {datosComparacion.map((d) => (
                                        <Cell key={d.name} fill={d.color} />
                                    ))}
                                    <LabelList dataKey="valor" position="right" formatter={(v: unknown) => formatCOP(Number(v))} fontSize={12} fill="#334155" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Distribución por categoría */}
                <Card className="lg:col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Distribución de gastos por categoría</CardTitle>
                        <CardDescription>Seleccionados frente a excluidos o descartados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div style={{ height: Math.max(260, datosBarras.length * 52) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={datosBarras} layout="vertical" margin={{ left: 8, right: 24 }} barGap={2}>
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" tickFormatter={formatCOPCorto} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" width={170} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<TooltipCOP />} cursor={{ fill: "#f1f5f9" }} />
                                    <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="Seleccionado" stackId="a" fill={COLOR_SELECCIONADO} maxBarSize={26} />
                                    <Bar dataKey="Excluido" name="Excluido / descartado" stackId="a" fill={COLOR_EXCLUIDO} radius={[0, 4, 4, 0]} maxBarSize={26} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Participación porcentual */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Participación por categoría</CardTitle>
                        <CardDescription>Porcentaje sobre el total seleccionado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {conSeleccion.length === 0 ? (
                            <p className="py-12 text-center text-sm text-slate-500">No hay gastos seleccionados en este escenario.</p>
                        ) : (
                            <>
                                <div className="h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={conSeleccion} dataKey="seleccionado" nameKey="label" isAnimationActive={false} innerRadius="58%" outerRadius="92%" paddingAngle={1} stroke="#ffffff" strokeWidth={2}>
                                                {conSeleccion.map((c) => (
                                                    <Cell key={c.key} fill={c.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<TooltipCOP />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <ul className="space-y-1.5">
                                    {conSeleccion.map((c) => (
                                        <li key={c.key} className="flex items-center gap-2 text-sm">
                                            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: c.color }} />
                                            <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{c.label}</span>
                                            <span className="tabular-nums text-slate-500">{formatCOP(c.seleccionado)}</span>
                                            <span className="w-14 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatPorcentaje(c.porcentaje)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recordatorios informativos */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="gap-2 py-4 shadow-sm border-amber-200 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-900/40">
                    <CardContent className="px-5 text-sm text-amber-900 dark:text-amber-200">
                        <p className="font-semibold">Necesidades por confirmar (fuera del escenario)</p>
                        <p className="mt-1">
                            {formatCOP(r.totalPorConfirmar)} con valor conocido
                            {r.porConfirmarSinValor > 0 && <> · {r.porConfirmarSinValor} sin valor definido</>}. Se incorporan desde la pestaña de gastos.
                        </p>
                    </CardContent>
                </Card>
                <Card className="gap-2 py-4 shadow-sm border-teal-200 bg-teal-50/60 dark:bg-teal-900/10 dark:border-teal-900/40">
                    <CardContent className="px-5 text-sm text-teal-900 dark:text-teal-200">
                        <p className="font-semibold">Recursos de Víctimas (destinación específica, fuera de la bolsa)</p>
                        <p className="mt-1">
                            {formatCOP(config.victimasRecursos)} − Mesa Municipal {formatCOP(config.victimasMesa)} = saldo de referencia <b>{formatCOP(saldoVictimas)}</b>. Requiere validación.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
