"use client";

import { useState } from "react";
import { HandHeart, Info, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "@/lib/simulador/calculos";
import { GRUPO_LABEL, GRUPOS_INFORMATIVOS, categoriaInfo, type SimConfigDTO, type SimGastoDTO } from "@/lib/simulador/constantes";
import { MoneyInput } from "./comunes";

export function InformativosView({
    gastos,
    config,
    puedeEditar,
    onEditarGasto,
    onGuardarVictimas,
}: {
    gastos: SimGastoDTO[];
    config: SimConfigDTO;
    puedeEditar: boolean;
    onEditarGasto: (g: SimGastoDTO) => void;
    onGuardarVictimas: (recursos: number, mesa: number, notas: string | null) => Promise<boolean>;
}) {
    const informativos = gastos.filter((g) => GRUPOS_INFORMATIVOS.includes(g.grupo));
    const [editando, setEditando] = useState(false);
    const [recursos, setRecursos] = useState<number | null>(config.victimasRecursos);
    const [mesa, setMesa] = useState<number | null>(config.victimasMesa);
    const [notas, setNotas] = useState(config.victimasNotas ?? "");

    const iniciarEdicion = () => {
        setRecursos(config.victimasRecursos);
        setMesa(config.victimasMesa);
        setNotas(config.victimasNotas ?? "");
        setEditando(true);
    };

    const saldo = (recursos ?? 0) - (mesa ?? 0);

    return (
        <div className="grid gap-6 xl:grid-cols-2">
            {/* Excluidos / ya cubiertos */}
            <Card className="gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="border-b bg-slate-50 px-5 py-4 dark:bg-slate-900">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ShieldCheck className="h-5 w-5 text-slate-500" /> Excluidos / ya cubiertos
                    </CardTitle>
                    <CardDescription>
                        Conceptos con CDP existente, aplazados para otra vigencia o retirados. Se muestran como referencia y <b>no afectan el saldo</b>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="divide-y px-0">
                    {informativos.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay conceptos registrados.</p>}
                    {informativos.map((g) => (
                        <div key={g.id} className="flex items-start gap-3 px-5 py-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-900 dark:text-slate-100">{g.nombre}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <Badge
                                        variant="outline"
                                        className={
                                            g.grupo === "CUBIERTO_CDP"
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : g.grupo === "OTRA_VIGENCIA"
                                                  ? "border-sky-200 bg-sky-50 text-sky-700"
                                                  : "border-slate-200 bg-slate-100 text-slate-600"
                                        }
                                    >
                                        {GRUPO_LABEL[g.grupo]}
                                    </Badge>
                                    <span>{categoriaInfo(g.categoria).label}</span>
                                </div>
                                {g.observaciones && <p className="mt-1 text-xs text-slate-500">{g.observaciones}</p>}
                            </div>
                            <span className="text-sm font-semibold tabular-nums text-slate-500 line-through decoration-slate-300">{formatCOP(g.valorReferencia)}</span>
                            {puedeEditar && (
                                <Button variant="ghost" size="icon-sm" aria-label="Editar concepto" onClick={() => onEditarGasto(g)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {informativos.length > 0 && (
                        <div className="flex justify-between bg-slate-50 px-5 py-3 text-sm dark:bg-slate-900">
                            <span className="text-slate-600">Total informativo (no descontado de la bolsa)</span>
                            <span className="font-semibold tabular-nums">{formatCOP(informativos.reduce((a, g) => a + (g.valorReferencia ?? 0), 0))}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Víctimas */}
            <Card className="gap-0 overflow-hidden border-teal-200 py-0 shadow-sm dark:border-teal-900/50">
                <CardHeader className="border-b border-teal-200 bg-teal-50 px-5 py-4 dark:border-teal-900/50 dark:bg-teal-900/10">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg text-teal-900 dark:text-teal-200">
                                <HandHeart className="h-5 w-5" /> Recursos de Víctimas
                            </CardTitle>
                            <CardDescription className="text-teal-800/80 dark:text-teal-300/80">Destinación específica · sección independiente</CardDescription>
                        </div>
                        {puedeEditar && !editando && (
                            <Button variant="outline" size="sm" onClick={iniciarEdicion}>
                                <Pencil className="mr-1 h-4 w-4" /> Editar
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5 py-5">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <Label className="text-slate-600">Recursos de Víctimas</Label>
                            {editando ? <MoneyInput className="w-48" value={recursos} commitOnChange onCommit={setRecursos} /> : <b className="tabular-nums">{formatCOP(config.victimasRecursos)}</b>}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <Label className="text-slate-600">Actividades Mesa Municipal de Víctimas</Label>
                            {editando ? <MoneyInput className="w-48" value={mesa} commitOnChange onCommit={setMesa} /> : <b className="tabular-nums">− {formatCOP(config.victimasMesa)}</b>}
                        </div>
                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="font-semibold">Saldo de referencia</span>
                            <span className="text-xl font-bold tabular-nums text-teal-700 dark:text-teal-300">{formatCOP(editando ? saldo : config.victimasRecursos - config.victimasMesa)}</span>
                        </div>
                    </div>

                    {editando && (
                        <div className="space-y-1.5">
                            <Label>Notas</Label>
                            <Textarea rows={2} value={notas} maxLength={2000} onChange={(e) => setNotas(e.target.value)} />
                        </div>
                    )}
                    {!editando && config.victimasNotas && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900">{config.victimasNotas}</p>}

                    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            Estos recursos tienen <b>destinación específica</b>: no se suman a la disponibilidad general ni pueden financiar otras categorías. El saldo
                            requiere validación de la destinación y acuerdos con la Mesa de Víctimas.
                        </p>
                    </div>

                    {editando && (
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditando(false)}>
                                Cancelar
                            </Button>
                            <Button
                                disabled={recursos === null || mesa === null}
                                className="bg-teal-700 text-white hover:bg-teal-800"
                                onClick={async () => {
                                    const ok = await onGuardarVictimas(recursos ?? 0, mesa ?? 0, notas.trim() || null);
                                    if (ok) setEditando(false);
                                }}
                            >
                                Guardar
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
