"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCOP, parseCOP } from "@/lib/simulador/calculos";
import { ESTADO_LABEL, PRIORIDAD_LABEL, VALOR_MAXIMO, type EstadoDecision, type Prioridad } from "@/lib/simulador/constantes";

/** Muestra los miles con punto mientras se escribe: 8.000.000 */
function conPuntos(n: number | null): string {
    if (n === null) return "";
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Campo de valor en pesos colombianos (entero). Confirma el valor al salir del
 * campo o al pulsar Enter; Escape descarta los cambios.
 */
export function MoneyInput({
    value,
    onCommit,
    disabled,
    className,
    placeholder = "Por definir",
    commitOnChange = false,
    id,
    "aria-label": ariaLabel,
}: {
    value: number | null;
    onCommit: (v: number | null) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    commitOnChange?: boolean;
    id?: string;
    "aria-label"?: string;
}) {
    const [texto, setTexto] = useState(conPuntos(value));
    const [enfocado, setEnfocado] = useState(false);
    // Mientras no se está editando, el campo refleja siempre el valor externo.
    const mostrado = enfocado ? texto : conPuntos(value);

    const confirmar = () => {
        let n = parseCOP(texto);
        if (n !== null && n > VALOR_MAXIMO) n = VALOR_MAXIMO;
        setTexto(conPuntos(n));
        if (n !== value) onCommit(n);
    };

    return (
        <div className={cn("relative", className)}>
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <Input
                id={id}
                aria-label={ariaLabel}
                inputMode="numeric"
                disabled={disabled}
                placeholder={placeholder}
                value={mostrado}
                className="pl-6 text-right tabular-nums font-medium"
                onFocus={(e) => {
                    setTexto(conPuntos(value));
                    setEnfocado(true);
                    e.target.select();
                }}
                onChange={(e) => {
                    const n = parseCOP(e.target.value);
                    setTexto(conPuntos(n));
                    if (commitOnChange) onCommit(n);
                }}
                onBlur={() => {
                    setEnfocado(false);
                    if (!commitOnChange) confirmar();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") {
                        setTexto(conPuntos(value));
                        setEnfocado(false);
                        requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
                    }
                }}
            />
        </div>
    );
}

export function ConfirmDialog({
    open,
    onOpenChange,
    titulo,
    descripcion,
    textoConfirmar = "Confirmar",
    destructivo = true,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    titulo: string;
    descripcion: React.ReactNode;
    textoConfirmar?: string;
    destructivo?: boolean;
    onConfirm: () => void | Promise<void>;
}) {
    const [cargando, setCargando] = useState(false);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className={cn("h-5 w-5", destructivo ? "text-red-600" : "text-amber-500")} />
                        {titulo}
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{descripcion}</div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cargando}>
                        Cancelar
                    </Button>
                    <Button
                        variant={destructivo ? "destructive" : "default"}
                        disabled={cargando}
                        onClick={async () => {
                            setCargando(true);
                            try {
                                await onConfirm();
                            } finally {
                                setCargando(false);
                                onOpenChange(false);
                            }
                        }}
                    >
                        {textoConfirmar}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const ESTADO_ESTILO: Record<EstadoDecision, string> = {
    PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    APROBADO: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    DESCARTADO: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    REDUCIDO: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800",
};

export function EstadoBadge({ estado, className }: { estado: EstadoDecision; className?: string }) {
    return (
        <Badge variant="outline" className={cn(ESTADO_ESTILO[estado], className)}>
            {ESTADO_LABEL[estado]}
        </Badge>
    );
}

const PRIORIDAD_ESTILO: Record<Prioridad, string> = {
    ALTA: "bg-red-500",
    MEDIA: "bg-amber-400",
    BAJA: "bg-slate-300",
};

export function PrioridadDot({ prioridad }: { prioridad: Prioridad }) {
    return (
        <span
            title={`Prioridad ${PRIORIDAD_LABEL[prioridad].toLowerCase()}`}
            aria-label={`Prioridad ${PRIORIDAD_LABEL[prioridad].toLowerCase()}`}
            className={cn("inline-block h-2.5 w-2.5 rounded-full shrink-0", PRIORIDAD_ESTILO[prioridad])}
        />
    );
}

/** Cifra con color según signo: verde superávit, rojo déficit. */
export function SaldoTexto({ saldo, className }: { saldo: number; className?: string }) {
    return (
        <span className={cn("tabular-nums", saldo < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400", className)}>
            {formatCOP(saldo)}
        </span>
    );
}
