"use client";

import { useMemo, useState } from "react";
import { FileText, ListTree, MoreVertical, Pencil, PlusCircle, Search, Trash2, Undo2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { cuentaEnEscenario, formatCOP, type CambioItem } from "@/lib/simulador/calculos";
import {
    CATEGORIAS,
    ESTADOS,
    ESTADO_LABEL,
    categoriaInfo,
    type EstadoDecision,
    type SimEscenarioDTO,
    type SimGastoDTO,
    type SimItemDTO,
} from "@/lib/simulador/constantes";
import { ConfirmDialog, EstadoBadge, MoneyInput, PrioridadDot } from "./comunes";

type Filtro = "TODOS" | "INCLUIDOS" | "EXCLUIDOS" | EstadoDecision;

interface Props {
    gastos: SimGastoDTO[];
    escenario: SimEscenarioDTO;
    editable: boolean;
    onCambio: (gastoId: string, cambio: CambioItem) => void;
    onEditar: (g: SimGastoDTO) => void;
    onDesglose: (g: SimGastoDTO) => void;
    onEliminar: (g: SimGastoDTO) => void;
    onNuevo: () => void;
}

function ObservacionInput({ valor, disabled, onCommit }: { valor: string | null; disabled: boolean; onCommit: (v: string | null) => void }) {
    const [texto, setTexto] = useState(valor ?? "");
    const [enfocado, setEnfocado] = useState(false);
    const mostrado = enfocado ? texto : valor ?? "";
    return (
        <Input
            value={mostrado}
            disabled={disabled}
            placeholder={disabled ? "" : "Agregar observación…"}
            className="h-9 text-sm"
            aria-label="Observaciones del escenario"
            onFocus={() => {
                setTexto(valor ?? "");
                setEnfocado(true);
            }}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => {
                setEnfocado(false);
                const limpio = texto.trim() === "" ? null : texto.trim();
                if (limpio !== (valor ?? null)) onCommit(limpio);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
    );
}

function FilaGasto({
    gasto,
    item,
    editable,
    onCambio,
    pedirDescarte,
    onEditar,
    onDesglose,
    onEliminar,
}: {
    gasto: SimGastoDTO;
    item: SimItemDTO;
    editable: boolean;
    onCambio: Props["onCambio"];
    pedirDescarte: (g: SimGastoDTO) => void;
    onEditar: Props["onEditar"];
    onDesglose: Props["onDesglose"];
    onEliminar: Props["onEliminar"];
}) {
    const cuenta = cuentaEnEscenario(gasto.grupo, item);
    const ref = gasto.valorReferencia;
    const dif = item.valor !== null && ref !== null ? item.valor - ref : 0;

    return (
        <div
            className={cn(
                "grid gap-3 px-4 py-3 transition-colors lg:grid-cols-[auto_minmax(0,1fr)_130px_160px_205px_minmax(0,220px)_auto] lg:items-center",
                cuenta ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/60"
            )}
        >
            {/* Incluir / excluir */}
            <div className="flex items-start gap-3 lg:contents">
                <Checkbox
                    checked={item.incluido && item.estado !== "DESCARTADO"}
                    disabled={!editable}
                    aria-label={`Incluir ${gasto.nombre} en el escenario`}
                    className="mt-1 h-5 w-5 lg:mt-0"
                    onCheckedChange={(v) => {
                        if (v) onCambio(gasto.id, { incluido: true });
                        else pedirDescarte(gasto);
                    }}
                />
                {/* Nombre */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <PrioridadDot prioridad={gasto.prioridad} />
                        <span className={cn("font-medium leading-snug", cuenta ? "text-slate-900 dark:text-slate-100" : "text-slate-400 line-through decoration-slate-300")}>
                            {gasto.nombre}
                        </span>
                        {(gasto.descripcion || gasto.observaciones) && (
                            <HoverCard openDelay={150}>
                                <HoverCardTrigger asChild>
                                    <button type="button" className="text-slate-400 hover:text-indigo-600" aria-label="Ver descripción">
                                        <FileText className="h-4 w-4" />
                                    </button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 text-sm">
                                    {gasto.descripcion && <p className="text-slate-700 dark:text-slate-300">{gasto.descripcion}</p>}
                                    {gasto.observaciones && <p className="mt-2 text-xs text-slate-500">Nota: {gasto.observaciones}</p>}
                                </HoverCardContent>
                            </HoverCard>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="lg:hidden">Referencia: {formatCOP(ref)}</span>
                        {dif !== 0 && cuenta && (
                            <Badge variant="outline" className={cn("tabular-nums", dif < 0 ? "border-sky-200 text-sky-700" : "border-orange-200 text-orange-700")}>
                                {dif < 0 ? "Ahorro " : "Incremento +"}
                                {formatCOP(Math.abs(dif))}
                            </Badge>
                        )}
                        {gasto.desglose.length > 0 && (
                            <button type="button" onClick={() => onDesglose(gasto)} className="flex items-center gap-1 text-indigo-600 hover:underline">
                                <ListTree className="h-3.5 w-3.5" /> Desglose ({gasto.desglose.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Valor de referencia */}
            <div className="hidden text-right text-sm tabular-nums text-slate-500 lg:block">{formatCOP(ref)}</div>

            {/* Valor simulado + estado (en móvil van lado a lado) */}
            <div className="grid grid-cols-2 gap-2 lg:contents">
                <MoneyInput
                    value={item.valor}
                    disabled={!editable}
                    aria-label={`Valor de ${gasto.nombre}`}
                    onCommit={(v) => onCambio(gasto.id, { valor: v })}
                />
                <Select
                    value={item.estado}
                    disabled={!editable}
                    onValueChange={(v) => {
                        if (v === "DESCARTADO") pedirDescarte(gasto);
                        else onCambio(gasto.id, { estado: v as EstadoDecision });
                    }}
                >
                    <SelectTrigger className="h-9 w-full" aria-label="Estado de decisión">
                        <SelectValue>
                            <EstadoBadge estado={item.estado} />
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {ESTADOS.map((e) => (
                            <SelectItem key={e} value={e}>
                                {ESTADO_LABEL[e]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Observaciones del escenario */}
            <ObservacionInput valor={item.observaciones} disabled={!editable} onCommit={(v) => onCambio(gasto.id, { observaciones: v })} />

            {/* Acciones */}
            <div className="flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDesglose(gasto)}>
                            <ListTree className="mr-2 h-4 w-4" /> Ver / editar desglose
                        </DropdownMenuItem>
                        {editable && ref !== null && item.valor !== ref && (
                            <DropdownMenuItem onClick={() => onCambio(gasto.id, { valor: ref })}>
                                <Undo2 className="mr-2 h-4 w-4" /> Restaurar valor de referencia
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEditar(gasto)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar concepto
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => onEliminar(gasto)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar del catálogo
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export function TablaGastos({ gastos, escenario, editable, onCambio, onEditar, onDesglose, onEliminar, onNuevo }: Props) {
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState<Filtro>("TODOS");
    const [descartar, setDescartar] = useState<SimGastoDTO | null>(null);

    const items = useMemo(() => new Map(escenario.items.map((i) => [i.gastoId, i])), [escenario.items]);
    const itemDe = (g: SimGastoDTO): SimItemDTO =>
        items.get(g.id) ?? { gastoId: g.id, incluido: false, valor: g.valorReferencia, estado: "PENDIENTE", observaciones: null };

    const pendientes = gastos.filter((g) => g.grupo === "PENDIENTE");
    const porConfirmar = gastos.filter((g) => g.grupo === "POR_CONFIRMAR");

    const visibles = pendientes.filter((g) => {
        const i = itemDe(g);
        const txt = busqueda.trim().toLowerCase();
        if (txt && !g.nombre.toLowerCase().includes(txt) && !categoriaInfo(g.categoria).label.toLowerCase().includes(txt)) return false;
        const cuenta = cuentaEnEscenario(g.grupo, i);
        if (filtro === "INCLUIDOS") return cuenta;
        if (filtro === "EXCLUIDOS") return !cuenta;
        if (filtro !== "TODOS") return i.estado === filtro;
        return true;
    });

    const grupos = CATEGORIAS.map((c) => ({ cat: c, gastos: visibles.filter((g) => g.categoria === c.key) })).filter((x) => x.gastos.length > 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar gasto o categoría…" className="h-10 pl-9" />
                </div>
                <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
                    <SelectTrigger className="h-10 w-full md:w-56">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TODOS">Todos los gastos</SelectItem>
                        <SelectItem value="INCLUIDOS">Solo incluidos</SelectItem>
                        <SelectItem value="EXCLUIDOS">Solo excluidos</SelectItem>
                        {ESTADOS.map((e) => (
                            <SelectItem key={e} value={e}>
                                Estado: {ESTADO_LABEL[e]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={onNuevo} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!editable}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Nuevo gasto
                </Button>
            </div>

            {grupos.length === 0 && <p className="rounded-lg border border-dashed p-10 text-center text-slate-500">No hay gastos que coincidan con el filtro.</p>}

            {grupos.map(({ cat, gastos: gs }) => {
                const todos = pendientes.filter((g) => g.categoria === cat.key);
                const seleccionado = todos.reduce((a, g) => (cuentaEnEscenario(g.grupo, itemDe(g)) ? a + (itemDe(g).valor ?? 0) : a), 0);
                const referencia = todos.reduce((a, g) => a + (g.valorReferencia ?? 0), 0);
                return (
                    <Card key={cat.key} className="gap-0 overflow-hidden py-0 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50/80 px-4 py-3 dark:bg-slate-900" style={{ borderLeft: `4px solid ${cat.color}` }}>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{cat.label}</h3>
                                {cat.key === "REGALOS_NAVIDAD" && <p className="text-xs text-slate-500">Bolsa independiente del presupuesto de Cultura.</p>}
                            </div>
                            <div className="text-right text-sm">
                                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatCOP(seleccionado)}</span>
                                <span className="text-slate-500"> seleccionado de {formatCOP(referencia)}</span>
                            </div>
                        </div>
                        <div className="hidden grid-cols-[auto_minmax(0,1fr)_130px_160px_205px_minmax(0,220px)_auto] gap-3 border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 lg:grid">
                            <span className="w-5" />
                            <span>Concepto</span>
                            <span className="text-right">Presupuestado</span>
                            <span className="text-right">Valor simulado</span>
                            <span>Estado</span>
                            <span>Observaciones</span>
                            <span className="w-8" />
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {gs.map((g) => (
                                <FilaGasto
                                    key={g.id}
                                    gasto={g}
                                    item={itemDe(g)}
                                    editable={editable}
                                    onCambio={onCambio}
                                    pedirDescarte={setDescartar}
                                    onEditar={onEditar}
                                    onDesglose={onDesglose}
                                    onEliminar={onEliminar}
                                />
                            ))}
                        </div>
                    </Card>
                );
            })}

            {/* Necesidades por confirmar */}
            {porConfirmar.length > 0 && (
                <Card className="gap-0 overflow-hidden border-amber-200 py-0 shadow-sm dark:border-amber-900/50">
                    <CardHeader className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/10">
                        <CardTitle className="text-base text-amber-900 dark:text-amber-200">Necesidades pendientes de confirmación</CardTitle>
                        <CardDescription className="text-amber-800/80 dark:text-amber-300/80">
                            No suman al escenario hasta que se incorporen. Use “Incorporar” cuando se confirme la necesidad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y divide-amber-100 px-0 dark:divide-amber-900/40">
                        {porConfirmar.map((g) => {
                            const i = itemDe(g);
                            const cuenta = cuentaEnEscenario(g.grupo, i);
                            const sinValor = i.valor === null;
                            return (
                                <div key={g.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <PrioridadDot prioridad={g.prioridad} />
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{g.nombre}</span>
                                            {cuenta ? (
                                                <Badge className="bg-emerald-600 text-white">Incorporada</Badge>
                                            ) : i.incluido && sinValor ? (
                                                <Badge variant="outline" className="border-amber-300 text-amber-700">Incorporada · falta valor</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-amber-300 text-amber-700">Pendiente de confirmación</Badge>
                                            )}
                                        </div>
                                        {g.observaciones && <p className="mt-0.5 text-xs text-slate-500">{g.observaciones}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MoneyInput
                                            className="w-40"
                                            value={i.valor}
                                            disabled={!editable}
                                            placeholder="Por definir"
                                            aria-label={`Valor de ${g.nombre}`}
                                            onCommit={(v) => onCambio(g.id, { valor: v })}
                                        />
                                        {cuenta || i.incluido ? (
                                            <Button variant="outline" disabled={!editable} onClick={() => onCambio(g.id, { incluido: false })}>
                                                <XCircle className="mr-2 h-4 w-4" /> Retirar
                                            </Button>
                                        ) : (
                                            <Button
                                                disabled={!editable || sinValor}
                                                title={sinValor ? "Defina el valor para poder incorporarla" : undefined}
                                                className="bg-amber-600 text-white hover:bg-amber-700"
                                                onClick={() => onCambio(g.id, { incluido: true })}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" /> Incorporar
                                            </Button>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEditar(g)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar concepto
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => onEliminar(g)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar del catálogo
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            <ConfirmDialog
                open={!!descartar}
                onOpenChange={(o) => !o && setDescartar(null)}
                titulo="¿Descartar este gasto?"
                descripcion={
                    descartar && (
                        <>
                            <b>{descartar.nombre}</b> quedará marcado como <b>descartado</b> y su valor ({formatCOP(itemDe(descartar).valor)}) dejará de sumarse
                            en este escenario. Puede volver a incluirlo en cualquier momento.
                        </>
                    )
                }
                textoConfirmar="Sí, descartar"
                onConfirm={() => {
                    if (descartar) onCambio(descartar.id, { estado: "DESCARTADO" });
                }}
            />
        </div>
    );
}
