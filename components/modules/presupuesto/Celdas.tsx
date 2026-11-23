"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCOP, parseEntero } from "@/lib/presupuesto/tipos";

const conPuntos = (n: number | null) => (n === null ? "" : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));

/**
 * Celda de valor en pesos, editable con un clic (o doble clic). Enter o salir
 * del campo guarda; Escape cancela.
 */
export function CeldaValor({
    valor,
    onCambio,
    editable,
    className,
    negativo = false,
    vacioComo = "Por definir",
    etiqueta,
}: {
    valor: number | null;
    onCambio: (v: number | null) => void;
    editable: boolean;
    className?: string;
    negativo?: boolean;
    vacioComo?: string;
    etiqueta: string;
}) {
    const [editando, setEditando] = useState(false);
    const [texto, setTexto] = useState("");

    if (editando) {
        const confirmar = () => {
            setEditando(false);
            const n = parseEntero(texto);
            if (n !== valor) onCambio(n);
        };
        return (
            <input
                autoFocus
                inputMode="numeric"
                aria-label={etiqueta}
                className={cn("w-full rounded border border-indigo-400 bg-white px-2 py-1 text-right tabular-nums outline-none ring-2 ring-indigo-200", className)}
                value={texto}
                onChange={(e) => setTexto(conPuntos(parseEntero(e.target.value)))}
                onFocus={(e) => e.target.select()}
                onBlur={confirmar}
                onKeyDown={(e) => {
                    if (e.key === "Enter") confirmar();
                    if (e.key === "Escape") setEditando(false);
                }}
            />
        );
    }

    const mostrado = valor === null ? vacioComo : `${negativo ? "-" : ""}${formatCOP(valor)}`;
    if (!editable) return <span className={cn("block text-right tabular-nums", valor === null && "italic text-slate-400", className)}>{mostrado}</span>;
    return (
        <button
            type="button"
            aria-label={`${etiqueta}: ${mostrado}. Clic para editar`}
            title="Clic para editar"
            className={cn(
                "group flex w-full items-center justify-end gap-1.5 rounded px-2 py-1 text-right tabular-nums hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200",
                valor === null && "italic text-slate-400",
                className
            )}
            onClick={() => {
                setTexto(conPuntos(valor));
                setEditando(true);
            }}
        >
            <Pencil className="h-3 w-3 shrink-0 text-indigo-400 opacity-0 group-hover:opacity-100" />
            {mostrado}
        </button>
    );
}

/** Celda de texto editable con un clic. */
export function CeldaTexto({
    valor,
    onCambio,
    editable,
    className,
    placeholder = "—",
    etiqueta,
}: {
    valor: string;
    onCambio: (v: string) => void;
    editable: boolean;
    className?: string;
    placeholder?: string;
    etiqueta: string;
}) {
    const [editando, setEditando] = useState(false);
    const [texto, setTexto] = useState("");

    if (editando) {
        const confirmar = () => {
            setEditando(false);
            const t = texto.trim();
            if (t !== valor) onCambio(t);
        };
        return (
            <input
                autoFocus
                aria-label={etiqueta}
                className={cn("w-full rounded border border-indigo-400 bg-white px-2 py-1 outline-none ring-2 ring-indigo-200", className)}
                value={texto}
                maxLength={250}
                onChange={(e) => setTexto(e.target.value)}
                onBlur={confirmar}
                onKeyDown={(e) => {
                    if (e.key === "Enter") confirmar();
                    if (e.key === "Escape") setEditando(false);
                }}
            />
        );
    }
    if (!editable) return <span className={cn(!valor && "text-slate-400", className)}>{valor || placeholder}</span>;
    return (
        <button
            type="button"
            aria-label={`${etiqueta}: ${valor || "vacío"}. Clic para editar`}
            title="Clic para editar"
            className={cn("w-full rounded px-1 py-1 text-left hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200", !valor && "text-slate-400", className)}
            onClick={() => {
                setTexto(valor);
                setEditando(true);
            }}
        >
            {valor || placeholder}
        </button>
    );
}

/** Casilla para incluir o quitar un gasto de la suma. */
export function Casilla({ marcado, onCambio, editable, etiqueta }: { marcado: boolean; onCambio: (v: boolean) => void; editable: boolean; etiqueta: string }) {
    return (
        <input
            type="checkbox"
            checked={marcado}
            disabled={!editable}
            aria-label={etiqueta}
            title={marcado ? "Incluido en la suma. Clic para quitarlo" : "No incluido. Clic para sumarlo"}
            onChange={(e) => onCambio(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-indigo-600 disabled:cursor-default"
        />
    );
}
