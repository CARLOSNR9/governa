"use client";

import { useState, type ComponentType } from "react";

/**
 * Vuelve a montar el formulario cada vez que el diálogo se abre, para que
 * siempre arranque con los datos actuales (sin sincronizar estado en efectos).
 */
function conReinicioAlAbrir<P extends { open: boolean }>(Interno: ComponentType<P>) {
    return function DialogoReiniciable(props: P) {
        const [apertura, setApertura] = useState(0);
        const [abiertoAntes, setAbiertoAntes] = useState(props.open);
        if (props.open !== abiertoAntes) {
            setAbiertoAntes(props.open);
            if (props.open) setApertura((n) => n + 1);
        }
        return <Interno key={apertura} {...props} />;
    };
}
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { descuentoDesdePorcentaje, formatCOP, formatPorcentaje } from "@/lib/simulador/calculos";
import {
    CATEGORIAS,
    ESTADOS,
    ESTADO_LABEL,
    GRUPOS,
    GRUPO_LABEL,
    PRIORIDADES,
    PRIORIDAD_LABEL,
    type EstadoDecision,
    type GrupoGasto,
    type Prioridad,
    type SimEscenarioDTO,
    type SimGastoDTO,
} from "@/lib/simulador/constantes";
import { MoneyInput } from "./comunes";

// ─── Gasto ──────────────────────────────────────────────────────────────────

export interface GastoForm {
    nombre: string;
    categoria: string;
    grupo: GrupoGasto;
    valorReferencia: number | null;
    descripcion: string;
    observaciones: string;
    prioridad: Prioridad;
    estado: EstadoDecision;
    incluir: boolean;
}

const VACIO: GastoForm = {
    nombre: "",
    categoria: "OTROS",
    grupo: "PENDIENTE",
    valorReferencia: null,
    descripcion: "",
    observaciones: "",
    prioridad: "MEDIA",
    estado: "PENDIENTE",
    incluir: true,
};

function GastoDialogInterno({
    open,
    onOpenChange,
    gasto,
    nombreEscenario,
    escenarioBloqueado,
    onGuardar,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    gasto: SimGastoDTO | null; // null = nuevo
    nombreEscenario: string;
    escenarioBloqueado: boolean;
    onGuardar: (f: GastoForm) => Promise<boolean>;
}) {
    const [f, setF] = useState<GastoForm>(() =>
            gasto
                ? {
                      ...VACIO,
                      nombre: gasto.nombre,
                      categoria: gasto.categoria,
                      grupo: gasto.grupo,
                      valorReferencia: gasto.valorReferencia,
                      descripcion: gasto.descripcion ?? "",
                      observaciones: gasto.observaciones ?? "",
                      prioridad: gasto.prioridad,
                  }
                : { ...VACIO, incluir: !escenarioBloqueado }
    );
    const [guardando, setGuardando] = useState(false);
    const nuevo = !gasto;

    const set = <K extends keyof GastoForm>(k: K, v: GastoForm[K]) => setF((p) => ({ ...p, [k]: v }));
    const valido = f.nombre.trim().length >= 2 && (f.grupo === "POR_CONFIRMAR" || f.valorReferencia !== null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{nuevo ? "Registrar nuevo gasto" : "Editar concepto de gasto"}</DialogTitle>
                    <DialogDescription>
                        {nuevo
                            ? "El gasto se agrega al catálogo. En los demás escenarios guardados queda excluido para no alterar sus totales."
                            : "Los cambios de nombre, categoría y descripción aplican a todos los escenarios. Si cambia el valor presupuestado, se actualizan los escenarios no protegidos que conservaban el valor anterior."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="g-nombre">Nombre del gasto *</Label>
                        <Input id="g-nombre" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ej.: Refrigerios jornada de vacunación" maxLength={200} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Categoría</Label>
                        <Select value={f.categoria} onValueChange={(v) => set("categoria", v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIAS.map((c) => (
                                    <SelectItem key={c.key} value={c.key}>
                                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="g-valor">Valor presupuestado (COP) {f.grupo !== "POR_CONFIRMAR" && "*"}</Label>
                        <MoneyInput id="g-valor" value={f.valorReferencia} commitOnChange onCommit={(v) => set("valorReferencia", v)} placeholder="0" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Tipo de concepto</Label>
                        <Select value={f.grupo} onValueChange={(v) => set("grupo", v as GrupoGasto)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {GRUPOS.map((g) => (
                                    <SelectItem key={g} value={g}>
                                        {GRUPO_LABEL[g]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {(f.grupo === "CUBIERTO_CDP" || f.grupo === "OTRA_VIGENCIA" || f.grupo === "RETIRADO") && (
                            <p className="text-xs text-amber-700">Informativo: no afecta el saldo de ningún escenario.</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Prioridad</Label>
                        <Select value={f.prioridad} onValueChange={(v) => set("prioridad", v as Prioridad)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PRIORIDADES.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {PRIORIDAD_LABEL[p]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="g-desc">Descripción</Label>
                        <Textarea id="g-desc" rows={2} value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} maxLength={2000} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="g-obs">Observaciones</Label>
                        <Textarea id="g-obs" rows={2} value={f.observaciones} onChange={(e) => set("observaciones", e.target.value)} maxLength={2000} />
                    </div>

                    {nuevo && (f.grupo === "PENDIENTE" || f.grupo === "POR_CONFIRMAR") && (
                        <div className="rounded-lg border bg-slate-50 p-3 sm:col-span-2 dark:bg-slate-900">
                            <label className={cn("flex items-center gap-2 text-sm", escenarioBloqueado && "opacity-50")}>
                                <Checkbox checked={f.incluir} disabled={escenarioBloqueado} onCheckedChange={(v) => set("incluir", !!v)} />
                                Incluir en el escenario actual: <b>{nombreEscenario}</b>
                            </label>
                            {escenarioBloqueado && <p className="mt-1 text-xs text-amber-700">El escenario actual está protegido; el gasto se registrará excluido.</p>}
                            {f.incluir && !escenarioBloqueado && (
                                <div className="mt-3 max-w-xs space-y-1.5">
                                    <Label>Estado inicial</Label>
                                    <Select value={f.estado} onValueChange={(v) => set("estado", v as EstadoDecision)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ESTADOS.filter((e) => e !== "DESCARTADO").map((e) => (
                                                <SelectItem key={e} value={e}>
                                                    {ESTADO_LABEL[e]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        disabled={!valido || guardando}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={async () => {
                            setGuardando(true);
                            const ok = await onGuardar(f);
                            setGuardando(false);
                            if (ok) onOpenChange(false);
                        }}
                    >
                        {guardando ? "Guardando…" : nuevo ? "Registrar gasto" : "Guardar cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Desglose ───────────────────────────────────────────────────────────────

function DesgloseDialogInterno({
    open,
    onOpenChange,
    gasto,
    valorSimulado,
    editable,
    onGuardar,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    gasto: SimGastoDTO | null;
    valorSimulado: number | null;
    editable: boolean;
    onGuardar: (filas: { concepto: string; valor: number | null }[]) => Promise<boolean>;
}) {
    const [filas, setFilas] = useState<{ concepto: string; valor: number | null }[]>(() =>
        (gasto?.desglose ?? []).map((d) => ({ concepto: d.concepto, valor: d.valor }))
    );
    const [guardando, setGuardando] = useState(false);

    if (!gasto) return null;
    const suma = filas.reduce((a, f) => a + (f.valor ?? 0), 0);
    const sinValor = filas.filter((f) => f.valor === null).length;
    const ref = gasto.valorReferencia;
    const diferencia = ref !== null ? ref - suma : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Desglose interno</DialogTitle>
                    <DialogDescription>
                        <b>{gasto.nombre}</b> · presupuestado {formatCOP(ref)}
                        {valorSimulado !== null && valorSimulado !== ref && <> · simulado {formatCOP(valorSimulado)}</>}
                    </DialogDescription>
                </DialogHeader>
                {gasto.descripcion && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">{gasto.descripcion}</p>}

                <div className="space-y-2">
                    {filas.length === 0 && <p className="py-4 text-center text-sm text-slate-500">Esta actividad no tiene desglose registrado.</p>}
                    {filas.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                value={f.concepto}
                                disabled={!editable}
                                placeholder="Concepto"
                                onChange={(e) => setFilas((p) => p.map((x, j) => (j === i ? { ...x, concepto: e.target.value } : x)))}
                            />
                            <MoneyInput
                                className="w-44 shrink-0"
                                value={f.valor}
                                disabled={!editable}
                                commitOnChange
                                onCommit={(v) => setFilas((p) => p.map((x, j) => (j === i ? { ...x, valor: v } : x)))}
                            />
                            {editable && (
                                <Button variant="ghost" size="icon-sm" aria-label="Quitar línea" onClick={() => setFilas((p) => p.filter((_, j) => j !== i))}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {editable && (
                        <Button variant="outline" size="sm" onClick={() => setFilas((p) => [...p, { concepto: "", valor: null }])}>
                            <Plus className="mr-1 h-4 w-4" /> Agregar línea
                        </Button>
                    )}
                </div>

                <div className="grid gap-1 rounded-lg border p-3 text-sm">
                    <div className="flex justify-between">
                        <span>Suma del desglose</span>
                        <b className="tabular-nums">{formatCOP(suma)}</b>
                    </div>
                    {diferencia !== null && (
                        <div className={cn("flex justify-between", diferencia === 0 ? "text-emerald-700" : "text-amber-700")}>
                            <span>{diferencia === 0 ? "Cuadra con el valor presupuestado" : diferencia > 0 ? "Falta por distribuir" : "Excede el valor presupuestado"}</span>
                            <b className="tabular-nums">{formatCOP(Math.abs(diferencia))}</b>
                        </div>
                    )}
                    {sinValor > 0 && <p className="text-xs text-slate-500">{sinValor} línea(s) sin valor asignado (distribución por verificar).</p>}
                    <p className="text-xs text-slate-500">El desglose es informativo: el saldo se calcula con el valor simulado de la actividad.</p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                    {editable && (
                        <Button
                            disabled={guardando || filas.some((f) => f.concepto.trim() === "")}
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                            onClick={async () => {
                                setGuardando(true);
                                const ok = await onGuardar(filas);
                                setGuardando(false);
                                if (ok) onOpenChange(false);
                            }}
                        >
                            Guardar desglose
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Disponibilidad ─────────────────────────────────────────────────────────

function DisponibilidadDialogInterno({
    open,
    onOpenChange,
    escenario,
    onGuardar,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    escenario: SimEscenarioDTO;
    onGuardar: (bolsa: number, descuento: number) => Promise<boolean>;
}) {
    const [bolsa, setBolsa] = useState<number | null>(escenario.bolsaInicial);
    const [descuento, setDescuento] = useState<number | null>(escenario.descuento);
    const [pct, setPct] = useState(() =>
        escenario.bolsaInicial > 0 ? String(Math.round((escenario.descuento / escenario.bolsaInicial) * 10000) / 100).replace(".", ",") : ""
    );
    const [guardando, setGuardando] = useState(false);

    const b = bolsa ?? 0;
    const d = descuento ?? 0;
    const valido = bolsa !== null && descuento !== null && d <= b;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Disponibilidad presupuestal</DialogTitle>
                    <DialogDescription>Aplica al escenario “{escenario.nombre}”. Los demás escenarios conservan sus valores.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Bolsa inicial anunciada</Label>
                        <MoneyInput
                            value={bolsa}
                            commitOnChange
                            onCommit={(v) => {
                                setBolsa(v);
                                const p = Number.parseFloat(pct.replace(",", "."));
                                if (v !== null && Number.isFinite(p)) setDescuento(descuentoDesdePorcentaje(v, p));
                            }}
                        />
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div className="space-y-1.5">
                            <Label>Descuento %</Label>
                            <div className="relative">
                                <Input
                                    inputMode="decimal"
                                    value={pct}
                                    className="pr-7 text-right"
                                    onChange={(e) => {
                                        const t = e.target.value.replace(/[^\d,\.]/g, "");
                                        setPct(t);
                                        const p = Number.parseFloat(t.replace(",", "."));
                                        if (Number.isFinite(p) && p >= 0 && p <= 100) setDescuento(descuentoDesdePorcentaje(b, p));
                                    }}
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Descuentos (impuestos, estampillas, papelería, otros)</Label>
                            <MoneyInput
                                value={descuento}
                                commitOnChange
                                onCommit={(v) => {
                                    setDescuento(v);
                                    if (v !== null && b > 0) setPct(String(Math.round((v / b) * 10000) / 100).replace(".", ","));
                                }}
                            />
                        </div>
                    </div>
                    <div className={cn("rounded-lg border p-4", valido ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20" : "bg-red-50 border-red-200")}>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Disponibilidad neta para el ejercicio</p>
                        <p className="text-2xl font-bold tabular-nums text-indigo-800 dark:text-indigo-200">{formatCOP(b - d)}</p>
                        {b > 0 && <p className="text-xs text-slate-500">Descuento equivalente al {formatPorcentaje((d / b) * 100, 2)}</p>}
                        {!valido && <p className="text-xs text-red-600">Los descuentos no pueden superar la bolsa.</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        disabled={!valido || guardando}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={async () => {
                            setGuardando(true);
                            const ok = await onGuardar(b, d);
                            setGuardando(false);
                            if (ok) onOpenChange(false);
                        }}
                    >
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Escenario ──────────────────────────────────────────────────────────────

export interface EscenarioForm {
    nombre: string;
    descripcion: string;
    observaciones: string;
    origenId: string | null; // null = desde valores de referencia
}

function EscenarioDialogInterno({
    open,
    onOpenChange,
    escenario,
    escenarios,
    origenPorDefecto,
    onGuardar,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    escenario: SimEscenarioDTO | null; // null = nuevo
    escenarios: SimEscenarioDTO[];
    origenPorDefecto: string | null;
    onGuardar: (f: EscenarioForm) => Promise<boolean>;
}) {
    const [f, setF] = useState<EscenarioForm>(() => {
        if (escenario) return { nombre: escenario.nombre, descripcion: escenario.descripcion ?? "", observaciones: escenario.observaciones ?? "", origenId: null };
        const origen = escenarios.find((e) => e.id === origenPorDefecto);
        return { nombre: origen ? `Copia de ${origen.nombre}` : "Escenario personalizado", descripcion: "", observaciones: "", origenId: origenPorDefecto };
    });
    const [guardando, setGuardando] = useState(false);
    const nuevo = !escenario;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{nuevo ? "Nuevo escenario" : "Editar escenario"}</DialogTitle>
                    <DialogDescription>
                        {nuevo ? "El nuevo escenario es independiente: sus cambios no modifican los escenarios ya guardados." : "Actualice el nombre y las observaciones del escenario."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {nuevo && (
                        <div className="space-y-1.5">
                            <Label>Punto de partida</Label>
                            <Select value={f.origenId ?? "__referencia"} onValueChange={(v) => setF((p) => ({ ...p, origenId: v === "__referencia" ? null : v }))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__referencia">Valores de referencia (todos los gastos propuestos)</SelectItem>
                                    {escenarios.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                            Copiar decisiones de: {e.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label htmlFor="e-nombre">Nombre *</Label>
                        <Input id="e-nombre" value={f.nombre} maxLength={150} onChange={(e) => setF((p) => ({ ...p, nombre: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="e-desc">Descripción</Label>
                        <Textarea id="e-desc" rows={2} value={f.descripcion} maxLength={1000} onChange={(e) => setF((p) => ({ ...p, descripcion: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="e-obs">Observaciones</Label>
                        <Textarea id="e-obs" rows={3} value={f.observaciones} maxLength={3000} onChange={(e) => setF((p) => ({ ...p, observaciones: e.target.value }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        disabled={f.nombre.trim().length < 2 || guardando}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={async () => {
                            setGuardando(true);
                            const ok = await onGuardar(f);
                            setGuardando(false);
                            if (ok) onOpenChange(false);
                        }}
                    >
                        {nuevo ? "Crear escenario" : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const GastoDialog = conReinicioAlAbrir(GastoDialogInterno);
export const DesgloseDialog = conReinicioAlAbrir(DesgloseDialogInterno);
export const DisponibilidadDialog = conReinicioAlAbrir(DisponibilidadDialogInterno);
export const EscenarioDialog = conReinicioAlAbrir(EscenarioDialogInterno);
