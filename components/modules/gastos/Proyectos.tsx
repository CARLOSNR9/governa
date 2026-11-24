"use client";

import { CheckCircle2, Clock, Layers, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TIPO_PROYECTO_LABEL, type EstadoPago, type TipoProyecto } from "@/lib/gastos/proyectos";

const cop = (n: number) => `$${(n || 0).toLocaleString("es-CO")}`;

export interface ProyectoResumen {
    id: string;
    nombre: string;
    descripcion: string | null;
    presupuesto: number;
    tipo: TipoProyecto;
    gastos: number;
    ingresos: number;
    saldo: number;
    pagado: number;
    pendiente: number;
    egresos: number;
    egresosPendientes: number;
    estadoPago: EstadoPago;
    porcentajePagado: number;
}

function Fila({ etiqueta, valor, className }: { etiqueta: string; valor: string; className?: string }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-slate-500">{etiqueta}</span>
            <span className={cn("font-medium tabular-nums", className)}>{valor}</span>
        </div>
    );
}

/** Ficha de un proyecto: verde cuando todos sus gastos están pagados. */
export function FichaProyecto({ p, onClick }: { p: ProyectoResumen; onClick: () => void }) {
    const pagado = p.estadoPago === "PAGADO";
    const conPresupuesto = p.tipo === "PRESUPUESTO";
    const porcentajeGastado = conPresupuesto && p.presupuesto > 0 ? (p.gastos / p.presupuesto) * 100 : 0;

    return (
        <Card
            data-proyecto={p.nombre}
            onClick={onClick}
            className={cn(
                "cursor-pointer transition-colors",
                pagado ? "border-emerald-300 bg-emerald-50 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30" : "hover:border-indigo-300"
            )}
        >
            <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between gap-2 text-lg">
                    <span>{p.nombre}</span>
                    {pagado ? (
                        <Badge className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Pagado
                        </Badge>
                    ) : p.estadoPago === "PENDIENTE" ? (
                        <Badge className="shrink-0 bg-amber-100 text-amber-800 hover:bg-amber-100">
                            <Clock className="mr-1 h-3 w-3" /> Por pagar
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="shrink-0 text-slate-500">
                            Sin gastos
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        {conPresupuesto ? <Wallet className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                        {TIPO_PROYECTO_LABEL[p.tipo]}
                    </span>
                    {p.descripcion && <span className="text-xs">· {p.descripcion}</span>}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mt-2 space-y-2">
                    {conPresupuesto ? (
                        <>
                            <Fila etiqueta="Presupuesto" valor={cop(p.presupuesto)} />
                            <Fila etiqueta="Gastado" valor={cop(p.gastos)} className="text-rose-600" />
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className={cn("h-full", porcentajeGastado > 90 ? "bg-rose-500" : "bg-indigo-500")} style={{ width: `${Math.min(porcentajeGastado, 100)}%` }} />
                            </div>
                            <Fila etiqueta="Falta por pagar" valor={cop(p.pendiente)} className={p.pendiente > 0 ? "text-amber-700" : "text-emerald-700"} />
                            <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                                <span>{p.saldo < 0 ? "Sobrepasado" : "Disponible"}</span>
                                <span className={cn("tabular-nums", p.saldo < 0 ? "text-rose-600" : "text-emerald-600")}>{cop(p.saldo)}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <Fila etiqueta="Total acumulado" valor={cop(p.gastos)} />
                            <Fila etiqueta="Pagado" valor={cop(p.pagado)} className="text-emerald-700" />
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(p.porcentajePagado, 100)}%` }} />
                            </div>
                            <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                                <span>Falta por pagar</span>
                                <span className={cn("tabular-nums", p.pendiente > 0 ? "text-rose-600" : "text-emerald-600")}>{cop(p.pendiente)}</span>
                            </div>
                        </>
                    )}
                    {p.egresos > 0 && (
                        <p className="text-xs text-slate-500">
                            {pagado
                                ? p.egresos === 1
                                    ? "El gasto está pagado"
                                    : `Los ${p.egresos} gastos están pagados`
                                : `${p.egresosPendientes} de ${p.egresos} ${p.egresos === 1 ? "gasto" : "gastos"} por pagar · ${p.porcentajePagado.toFixed(0)} % pagado`}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/** Selector de la clase de proyecto en los formularios de crear y editar. */
export function SelectorTipoProyecto({ valor, onCambio }: { valor: TipoProyecto; onCambio: (t: TipoProyecto) => void }) {
    const opciones: { tipo: TipoProyecto; icono: typeof Wallet; texto: string }[] = [
        { tipo: "ACUMULADO", icono: Layers, texto: "Sin valor inicial: los gastos se van acumulando y se ve cuánto falta por pagar (Desplazados, Tienda Ortega…)." },
        { tipo: "PRESUPUESTO", icono: Wallet, texto: "Tiene un valor asignado o anticipado y se descuentan los gastos (p. ej. Día del SIDA, viaje con anticipo)." },
    ];
    return (
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de proyecto">
            {opciones.map(({ tipo, icono: Icono, texto }) => (
                <button
                    key={tipo}
                    type="button"
                    role="radio"
                    aria-checked={valor === tipo}
                    onClick={() => onCambio(tipo)}
                    className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        valor === tipo ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:bg-indigo-950/40" : "border-slate-200 hover:border-slate-300"
                    )}
                >
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <Icono className="h-4 w-4 text-indigo-600" /> {TIPO_PROYECTO_LABEL[tipo]}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">{texto}</span>
                </button>
            ))}
        </div>
    );
}
