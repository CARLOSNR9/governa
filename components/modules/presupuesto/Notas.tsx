"use client";

import { useState } from "react";
import { NotebookPen, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export const NOTA_MAXIMA = 3000;

/**
 * Notica de un ítem: ícono apagado si no hay nota y resaltado si la hay.
 * Al pasar el puntero muestra parte del texto; con un clic se abre para escribir.
 */
export function NotaItem({ nota, titulo, editable, onGuardar }: { nota: string; titulo: string; editable: boolean; onGuardar: (t: string) => void }) {
    const [abierto, setAbierto] = useState(false);
    const [texto, setTexto] = useState("");
    const tiene = nota.trim().length > 0;
    if (!tiene && !editable) return <span className="inline-block h-4 w-4" />;

    const vistaPrevia = nota.length > 220 ? `${nota.slice(0, 220).trimEnd()}…` : nota;

    return (
        <Popover
            open={abierto}
            onOpenChange={(o) => {
                if (o) setTexto(nota);
                setAbierto(o);
            }}
        >
            <HoverCard openDelay={150} closeDelay={50} open={abierto ? false : undefined}>
                <HoverCardTrigger asChild>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label={tiene ? `Nota de ${titulo} (tiene nota)` : `Agregar nota a ${titulo}`}
                            className={cn(
                                "rounded p-1 transition-colors",
                                tiene ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600" : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                            )}
                        >
                            <StickyNote className={cn("h-4 w-4", tiene && "fill-amber-100")} />
                        </button>
                    </PopoverTrigger>
                </HoverCardTrigger>
                <HoverCardContent side="left" className="w-72 text-sm">
                    {tiene ? (
                        <>
                            <p className="mb-1 text-xs font-semibold text-slate-500">{titulo}</p>
                            <p className="whitespace-pre-wrap text-slate-800">{vistaPrevia}</p>
                        </>
                    ) : (
                        <p className="text-slate-500">Clic para agregar una nota.</p>
                    )}
                </HoverCardContent>
            </HoverCard>
            <PopoverContent side="left" align="start" className="w-80">
                <p className="mb-2 text-sm font-semibold text-slate-900">Nota: {titulo}</p>
                {editable ? (
                    <>
                        <Textarea
                            autoFocus
                            rows={6}
                            maxLength={NOTA_MAXIMA}
                            value={texto}
                            placeholder="Escriba aquí la nota (p. ej. cuántos árbitros, de dónde sale el recurso…)"
                            aria-label={`Texto de la nota de ${titulo}`}
                            onChange={(e) => setTexto(e.target.value)}
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                            {tiene ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => {
                                        onGuardar("");
                                        setAbierto(false);
                                    }}
                                >
                                    Borrar nota
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setAbierto(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                    onClick={() => {
                                        if (texto.trim() !== nota.trim()) onGuardar(texto.trim());
                                        setAbierto(false);
                                    }}
                                >
                                    Guardar nota
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">{nota}</p>
                )}
            </PopoverContent>
        </Popover>
    );
}

/** Nota general de una sección o de todo el presupuesto (texto largo, editable con un clic). */
export function NotaGeneral({ titulo, nota, editable, onGuardar, destacada = false }: { titulo: string; nota: string; editable: boolean; onGuardar: (t: string) => void; destacada?: boolean }) {
    const [editando, setEditando] = useState(false);
    const [texto, setTexto] = useState("");
    const tiene = nota.trim().length > 0;
    if (!tiene && !editable) return null;

    return (
        <div className={cn("mt-3 rounded-md border-l-4 bg-white px-4 py-3 shadow-sm", destacada ? "border-indigo-500" : "border-amber-400")}>
            <p className={cn("mb-1 flex items-center gap-1.5 text-sm font-semibold", destacada ? "text-indigo-900" : "text-slate-800")}>
                <NotebookPen className="h-4 w-4" /> {titulo}
            </p>
            {editando ? (
                <Textarea
                    autoFocus
                    rows={4}
                    maxLength={NOTA_MAXIMA}
                    value={texto}
                    aria-label={titulo}
                    placeholder="Escriba la nota general…"
                    onChange={(e) => setTexto(e.target.value)}
                    onBlur={() => {
                        setEditando(false);
                        if (texto.trim() !== nota.trim()) onGuardar(texto.trim());
                    }}
                    onKeyDown={(e) => e.key === "Escape" && setEditando(false)}
                />
            ) : editable ? (
                <button
                    type="button"
                    aria-label={`${titulo}: ${tiene ? "editar" : "agregar"}`}
                    className={cn("w-full rounded px-1 py-1 text-left text-sm hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200", tiene ? "whitespace-pre-wrap text-slate-700" : "text-slate-400")}
                    onClick={() => {
                        setTexto(nota);
                        setEditando(true);
                    }}
                >
                    {tiene ? nota : "Clic para escribir una nota general…"}
                </button>
            ) : (
                <p className="whitespace-pre-wrap text-sm text-slate-700">{nota}</p>
            )}
        </div>
    );
}
