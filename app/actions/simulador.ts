"use server";

// Server actions del Simulador Presupuestal – Cierre de Vigencia 2026.
// Todas validan la sesión; las que modifican datos exigen un rol autorizado.
import { randomUUID } from "crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { aplicarCambio } from "@/lib/simulador/calculos";
import {
    CATEGORIA_KEYS,
    ESTADOS,
    GRUPOS,
    GRUPOS_ACTIVOS,
    PRIORIDADES,
    VALOR_MAXIMO,
    type EstadoDecision,
    type GrupoGasto,
    type Prioridad,
    type SimDatos,
    type SimEscenarioDTO,
    type SimGastoDTO,
    type SimItemDTO,
    type SimPermisos,
} from "@/lib/simulador/constantes";
import {
    BOLSA_INICIAL,
    DESCUENTO_INICIAL,
    ESCENARIOS_INICIALES,
    GASTOS_INICIALES,
    VICTIMAS_MESA,
    VICTIMAS_RECURSOS,
} from "@/lib/simulador/datos-iniciales";
import { itemsParaEscenario } from "@/lib/simulador/semilla";
import { obtenerPermisos } from "@/lib/simulador/permisos";

type Resultado<T = undefined> = { success: true; data: T } | { success: false; error: string };

// ─── Validaciones ───────────────────────────────────────────────────────────

const zValor = z.number().int("El valor debe ser un número entero de pesos").min(0, "El valor no puede ser negativo").max(VALOR_MAXIMO, "El valor excede el máximo permitido");
const zTexto = (max: number) => z.string().trim().max(max).nullable().optional();
const zId = z.string().min(1).max(64);

const zGasto = z.object({
    nombre: z.string().trim().min(2, "El nombre es obligatorio").max(200),
    categoria: z.enum(CATEGORIA_KEYS as [string, ...string[]]),
    grupo: z.enum(GRUPOS),
    valorReferencia: zValor.nullable(),
    descripcion: zTexto(2000),
    observaciones: zTexto(2000),
    prioridad: z.enum(PRIORIDADES),
});

const zCambioItem = z.object({
    incluido: z.boolean().optional(),
    valor: zValor.nullable().optional(),
    estado: z.enum(ESTADOS).optional(),
    observaciones: zTexto(2000),
});

function mensajeError(e: unknown): string {
    if (e instanceof z.ZodError) return e.issues[0]?.message ?? "Datos inválidos";
    if (e instanceof Error && e.message.startsWith("SIM:")) return e.message.slice(4);
    console.error("[simulador]", e);
    return "Ocurrió un error inesperado. Intente nuevamente.";
}

async function requerirLectura(): Promise<SimPermisos> {
    const p = await obtenerPermisos();
    if (!p) throw new Error("SIM:Su sesión expiró. Inicie sesión nuevamente.");
    return p;
}

async function requerirEdicion(): Promise<SimPermisos> {
    const p = await requerirLectura();
    if (!p.puedeEditar) throw new Error("SIM:Su usuario no tiene permisos para modificar el simulador.");
    return p;
}

async function escenarioEditable(id: string) {
    const esc = await prisma.simEscenario.findUnique({ where: { id } });
    if (!esc) throw new Error("SIM:El escenario no existe.");
    if (esc.bloqueado) throw new Error("SIM:El escenario está protegido. Desbloquéelo o duplíquelo para modificarlo.");
    return esc;
}

const limpiar = (s: string | null | undefined) => (s && s.trim() !== "" ? s.trim() : null);

// ─── Carga e inicialización ─────────────────────────────────────────────────

async function inicializarSiEsNecesario(usuario: string) {
    const existe = await prisma.simConfig.findUnique({ where: { id: "default" } });
    if (existe) return;

    try {
        await prisma.$transaction(
            async (tx) => {
                // La fila de configuración actúa como candado: si dos solicitudes
                // intentan inicializar a la vez, la segunda falla por llave duplicada.
                await tx.simConfig.create({
                    data: { id: "default", victimasRecursos: VICTIMAS_RECURSOS, victimasMesa: VICTIMAS_MESA, modificadoPor: usuario },
                });

                const gastos = GASTOS_INICIALES.map((g, i) => ({ id: randomUUID(), clave: g.clave, def: g, orden: i }));
                await tx.simGasto.createMany({
                    data: gastos.map(({ id, def, orden }) => ({
                        id,
                        nombre: def.nombre,
                        categoria: def.categoria,
                        grupo: def.grupo,
                        valorReferencia: def.valorReferencia,
                        descripcion: def.descripcion ?? null,
                        observaciones: def.observaciones ?? null,
                        prioridad: def.prioridad ?? "MEDIA",
                        orden,
                        creadoPor: usuario,
                    })),
                });
                await tx.simDesglose.createMany({
                    data: gastos.flatMap(({ id, def }) =>
                        (def.desglose ?? []).map((d, j) => ({ gastoId: id, concepto: d.concepto, valor: d.valor, orden: j }))
                    ),
                });

                for (const [orden, esc] of ESCENARIOS_INICIALES.entries()) {
                    const escId = randomUUID();
                    await tx.simEscenario.create({
                        data: {
                            id: escId,
                            nombre: esc.nombre,
                            descripcion: esc.descripcion,
                            observaciones: esc.observaciones ?? null,
                            bolsaInicial: BOLSA_INICIAL,
                            descuento: DESCUENTO_INICIAL,
                            bloqueado: esc.bloqueado,
                            orden,
                            creadoPor: usuario,
                        },
                    });
                    const items = itemsParaEscenario(gastos, esc.decisiones);
                    await tx.simEscenarioItem.createMany({ data: items.map((i) => ({ ...i, escenarioId: escId })) });
                }
            },
            { timeout: 30_000, maxWait: 15_000 }
        );
    } catch (e) {
        if ((e as { code?: string })?.code === "P2002") return; // Otra solicitud ya inicializó el módulo.
        throw e;
    }
}

async function cargarDatos(permisos: SimPermisos): Promise<SimDatos> {
    const [config, gastos, escenarios] = await Promise.all([
        prisma.simConfig.findUniqueOrThrow({ where: { id: "default" } }),
        prisma.simGasto.findMany({ orderBy: [{ orden: "asc" }, { createdAt: "asc" }], include: { desglose: { orderBy: { orden: "asc" } } } }),
        prisma.simEscenario.findMany({ orderBy: [{ orden: "asc" }, { createdAt: "asc" }], include: { items: true } }),
    ]);

    return {
        config: {
            victimasRecursos: config.victimasRecursos,
            victimasMesa: config.victimasMesa,
            victimasNotas: config.victimasNotas,
            modificadoPor: config.modificadoPor,
            updatedAt: config.updatedAt.toISOString(),
        },
        gastos: gastos.map(
            (g): SimGastoDTO => ({
                id: g.id,
                nombre: g.nombre,
                categoria: g.categoria,
                grupo: g.grupo as GrupoGasto,
                valorReferencia: g.valorReferencia,
                descripcion: g.descripcion,
                observaciones: g.observaciones,
                prioridad: g.prioridad as Prioridad,
                orden: g.orden,
                creadoPor: g.creadoPor,
                modificadoPor: g.modificadoPor,
                updatedAt: g.updatedAt.toISOString(),
                desglose: g.desglose.map((d) => ({ id: d.id, concepto: d.concepto, valor: d.valor, orden: d.orden })),
            })
        ),
        escenarios: escenarios.map(
            (e): SimEscenarioDTO => ({
                id: e.id,
                nombre: e.nombre,
                descripcion: e.descripcion,
                observaciones: e.observaciones,
                bolsaInicial: e.bolsaInicial,
                descuento: e.descuento,
                bloqueado: e.bloqueado,
                orden: e.orden,
                creadoPor: e.creadoPor,
                modificadoPor: e.modificadoPor,
                createdAt: e.createdAt.toISOString(),
                updatedAt: e.updatedAt.toISOString(),
                items: e.items.map((i) => ({
                    gastoId: i.gastoId,
                    incluido: i.incluido,
                    valor: i.valor,
                    estado: i.estado as EstadoDecision,
                    observaciones: i.observaciones,
                })),
            })
        ),
        permisos,
    };
}

export async function getSimuladorData(): Promise<Resultado<SimDatos>> {
    try {
        const permisos = await requerirLectura();
        await inicializarSiEsNecesario(permisos.usuario);
        return { success: true, data: await cargarDatos(permisos) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

// ─── Decisiones dentro de un escenario ──────────────────────────────────────

export async function actualizarDecision(
    escenarioId: string,
    gastoId: string,
    cambio: { incluido?: boolean; valor?: number | null; estado?: EstadoDecision; observaciones?: string | null }
): Promise<Resultado<SimItemDTO>> {
    try {
        const p = await requerirEdicion();
        zId.parse(escenarioId);
        zId.parse(gastoId);
        const c = zCambioItem.parse(cambio);
        await escenarioEditable(escenarioId);

        const gasto = await prisma.simGasto.findUnique({ where: { id: gastoId } });
        if (!gasto) throw new Error("SIM:El gasto no existe.");
        if (!GRUPOS_ACTIVOS.includes(gasto.grupo as GrupoGasto)) throw new Error("SIM:Este concepto es informativo y no hace parte de la simulación.");

        const actual = await prisma.simEscenarioItem.findUnique({ where: { escenarioId_gastoId: { escenarioId, gastoId } } });
        const base: SimItemDTO = actual
            ? { gastoId, incluido: actual.incluido, valor: actual.valor, estado: actual.estado as EstadoDecision, observaciones: actual.observaciones }
            : { gastoId, incluido: false, valor: gasto.valorReferencia, estado: "PENDIENTE", observaciones: null };

        const nuevo = aplicarCambio(
            base,
            { ...c, observaciones: c.observaciones === undefined ? undefined : limpiar(c.observaciones) },
            { valorReferencia: gasto.valorReferencia, grupo: gasto.grupo as GrupoGasto }
        );

        await prisma.$transaction([
            prisma.simEscenarioItem.upsert({
                where: { escenarioId_gastoId: { escenarioId, gastoId } },
                create: { escenarioId, ...nuevo },
                update: { incluido: nuevo.incluido, valor: nuevo.valor, estado: nuevo.estado, observaciones: nuevo.observaciones },
            }),
            prisma.simEscenario.update({ where: { id: escenarioId }, data: { modificadoPor: p.usuario } }),
        ]);
        return { success: true, data: nuevo };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

export async function actualizarDisponibilidad(escenarioId: string, bolsaInicial: number, descuento: number): Promise<Resultado<SimDatos>> {
    try {
        const p = await requerirEdicion();
        zId.parse(escenarioId);
        zValor.parse(bolsaInicial);
        zValor.parse(descuento);
        if (descuento > bolsaInicial) throw new Error("SIM:Los descuentos no pueden superar la bolsa inicial.");
        await escenarioEditable(escenarioId);
        await prisma.simEscenario.update({ where: { id: escenarioId }, data: { bolsaInicial, descuento, modificadoPor: p.usuario } });
        return { success: true, data: await cargarDatos(p) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

// ─── Escenarios ─────────────────────────────────────────────────────────────

const zEscenario = z.object({
    nombre: z.string().trim().min(2, "El nombre del escenario es obligatorio").max(150),
    descripcion: zTexto(1000),
    observaciones: zTexto(3000),
});

/** Crea un escenario. Si se indica origen, copia sus decisiones; si no, parte de los valores de referencia. */
export async function crearEscenario(
    datos: { nombre: string; descripcion?: string | null; observaciones?: string | null },
    origenId?: string | null
): Promise<Resultado<{ datos: SimDatos; id: string }>> {
    try {
        const p = await requerirEdicion();
        const d = zEscenario.parse(datos);
        const gastos = await prisma.simGasto.findMany({ where: { grupo: { in: GRUPOS_ACTIVOS } } });
        const origen = origenId ? await prisma.simEscenario.findUnique({ where: { id: origenId }, include: { items: true } }) : null;
        if (origenId && !origen) throw new Error("SIM:El escenario de origen no existe.");
        const ultimo = await prisma.simEscenario.aggregate({ _max: { orden: true } });
        const id = randomUUID();

        const items = gastos.map((g) => {
            const previo = origen?.items.find((i) => i.gastoId === g.id);
            if (previo) {
                return { escenarioId: id, gastoId: g.id, incluido: previo.incluido, valor: previo.valor, estado: previo.estado, observaciones: previo.observaciones };
            }
            const enReferencia = g.grupo === "PENDIENTE";
            return { escenarioId: id, gastoId: g.id, incluido: enReferencia, valor: g.valorReferencia, estado: "PENDIENTE", observaciones: null };
        });

        await prisma.$transaction([
            prisma.simEscenario.create({
                data: {
                    id,
                    nombre: d.nombre,
                    descripcion: limpiar(d.descripcion),
                    observaciones: limpiar(d.observaciones),
                    bolsaInicial: origen?.bolsaInicial ?? BOLSA_INICIAL,
                    descuento: origen?.descuento ?? DESCUENTO_INICIAL,
                    bloqueado: false,
                    orden: (ultimo._max.orden ?? 0) + 1,
                    creadoPor: p.usuario,
                    modificadoPor: p.usuario,
                },
            }),
            prisma.simEscenarioItem.createMany({ data: items }),
        ]);
        return { success: true, data: { datos: await cargarDatos(p), id } };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

export async function actualizarEscenario(
    id: string,
    datos: { nombre: string; descripcion?: string | null; observaciones?: string | null; bloqueado?: boolean }
): Promise<Resultado<SimDatos>> {
    try {
        const p = await requerirEdicion();
        zId.parse(id);
        const d = zEscenario.extend({ bloqueado: z.boolean().optional() }).parse(datos);
        await prisma.simEscenario.update({
            where: { id },
            data: {
                nombre: d.nombre,
                descripcion: limpiar(d.descripcion),
                observaciones: limpiar(d.observaciones),
                ...(d.bloqueado !== undefined ? { bloqueado: d.bloqueado } : {}),
                modificadoPor: p.usuario,
            },
        });
        return { success: true, data: await cargarDatos(p) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

export async function eliminarEscenario(id: string): Promise<Resultado<SimDatos>> {
    try {
        const p = await requerirEdicion();
        zId.parse(id);
        const total = await prisma.simEscenario.count();
        if (total <= 1) throw new Error("SIM:Debe existir al menos un escenario.");
        const esc = await prisma.simEscenario.findUnique({ where: { id } });
        if (!esc) throw new Error("SIM:El escenario no existe.");
        if (esc.bloqueado) throw new Error("SIM:El escenario está protegido. Desbloquéelo antes de eliminarlo.");
        await prisma.simEscenario.delete({ where: { id } });
        return { success: true, data: await cargarDatos(p) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

// ─── Catálogo de gastos ─────────────────────────────────────────────────────

/**
 * Crea un gasto en el catálogo. En el escenario indicado queda incluido (si así
 * se pide); en los demás escenarios queda excluido para no alterar sus totales.
 */
export async function crearGasto(
    datos: z.input<typeof zGasto> & { estado?: EstadoDecision },
    escenarioId: string | null,
    incluirEnEscenario: boolean
): Promise<Resultado<SimDatos>> {
    try {
        const p = await requerirEdicion();
        const d = zGasto.parse(datos);
        const estado = datos.estado ? z.enum(ESTADOS).parse(datos.estado) : "PENDIENTE";
        const escenarios = await prisma.simEscenario.findMany();
        const ultimo = await prisma.simGasto.aggregate({ _max: { orden: true } });
        const id = randomUUID();
        const activo = GRUPOS_ACTIVOS.includes(d.grupo);

        const items = activo
            ? escenarios.map((e) => {
                  const incluir = e.id === escenarioId && !e.bloqueado && incluirEnEscenario && estado !== "DESCARTADO";
                  return {
                      escenarioId: e.id,
                      gastoId: id,
                      incluido: incluir,
                      valor: d.valorReferencia,
                      estado: incluir ? estado : d.grupo === "POR_CONFIRMAR" ? "PENDIENTE" : "DESCARTADO",
                      observaciones: incluir || d.grupo === "POR_CONFIRMAR" ? null : "Agregado después de crear este escenario.",
                  };
              })
            : [];

        await prisma.$transaction([
            prisma.simGasto.create({
                data: {
                    id,
                    nombre: d.nombre,
                    categoria: d.categoria,
                    grupo: d.grupo,
                    valorReferencia: d.valorReferencia,
                    descripcion: limpiar(d.descripcion),
                    observaciones: limpiar(d.observaciones),
                    prioridad: d.prioridad,
                    orden: (ultimo._max.orden ?? 0) + 1,
                    creadoPor: p.usuario,
                    modificadoPor: p.usuario,
                },
            }),
            prisma.simEscenarioItem.createMany({ data: items }),
        ]);
        return { success: true, data: await cargarDatos(p) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

/**
 * Edita los datos generales de un gasto. Si cambia el valor de referencia, los
 * escenarios no protegidos que conservaban el valor anterior se actualizan.
 */
export async function actualizarGasto(id: string, datos: z.input<typeof zGasto>): Promise<Resultado<SimDatos>> {
    try {
        const p = await requerirEdicion();
        zId.parse(id);
        const d = zGasto.parse(datos);
        const actual = await prisma.simGasto.findUnique({ where: { id } });
        if (!actual) throw new Error("SIM:El gasto no existe.");

        const ops: Prisma.PrismaPromise<unknown>[] = [
            prisma.simGasto.update({
                where: { id },
                data: {
                    nombre: d.nombre,
                    categoria: d.categoria,
                    grupo: d.grupo,
                    valorReferencia: d.valorReferencia,
                    descripcion: limpiar(d.descripcion),
                    observaciones: limpiar(d.observaciones),
                    prioridad: d.prioridad,
                    modificadoPor: p.usuario,
                },
            }),
        ];

        if (actual.valorReferencia !== d.valorReferencia) {
            ops.push(
                prisma.simEscenarioItem.updateMany({
                    where: {
                        gastoId: id,
                        escenario: { bloqueado: false },
                        OR: [{ valor: actual.valorReferencia }, { valor: null }],
                    },
                    data: { valor: d.valorReferencia },
                })
            );
        }

        // Si el gasto pasa a ser activo, garantizar que exista su decisión en cada escenario.
        if (GRUPOS_ACTIVOS.includes(d.grupo)) {
            const escenarios = await prisma.simEscenario.findMany({ select: { id: true } });
            ops.push(
                prisma.simEscenarioItem.createMany({
                    data: escenarios.map((e) => ({
                        escenarioId: e.id,
                        gastoId: id,
                        incluido: false,
                        valor: d.valorReferencia,
                        estado: d.grupo === "POR_CONFIRMAR" ? "PENDIENTE" : "DESCARTADO",
                    })),
                    skipDuplicates: true,
                })
            );
        }

        await prisma.$transaction(ops);
        return { success: true, data: await cargarDatos(p) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

export async function eliminarGasto(id: string): Promise<Resultado<SimDatos>> {
    try {
        const p = await requerirEdicion();
        zId.parse(id);
        const bloqueados = await prisma.simEscenarioItem.count({
            where: { gastoId: id, escenario: { bloqueado: true }, incluido: true },
        });
        if (bloqueados > 0) {
            throw new Error("SIM:El gasto hace parte de un escenario protegido. Desbloquee ese escenario o descarte el gasto en lugar de eliminarlo.");
        }
        await prisma.simGasto.delete({ where: { id } });
        return { success: true, data: await cargarDatos(p) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

export async function guardarDesglose(gastoId: string, filas: { concepto: string; valor: number | null }[]): Promise<Resultado<SimDatos>> {
    try {
        const p = await requerirEdicion();
        zId.parse(gastoId);
        const f = z
            .array(z.object({ concepto: z.string().trim().min(1, "Cada línea del desglose necesita un concepto").max(200), valor: zValor.nullable() }))
            .max(100)
            .parse(filas);
        await prisma.$transaction([
            prisma.simDesglose.deleteMany({ where: { gastoId } }),
            prisma.simDesglose.createMany({ data: f.map((x, orden) => ({ gastoId, concepto: x.concepto, valor: x.valor, orden })) }),
            prisma.simGasto.update({ where: { id: gastoId }, data: { modificadoPor: p.usuario } }),
        ]);
        return { success: true, data: await cargarDatos(p) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}

// ─── Víctimas (destinación específica) ──────────────────────────────────────

export async function actualizarVictimas(recursos: number, mesa: number, notas: string | null): Promise<Resultado<SimDatos>> {
    try {
        const p = await requerirEdicion();
        zValor.parse(recursos);
        zValor.parse(mesa);
        await prisma.simConfig.update({
            where: { id: "default" },
            data: { victimasRecursos: recursos, victimasMesa: mesa, victimasNotas: limpiar(z.string().max(2000).nullable().parse(notas)), modificadoPor: p.usuario },
        });
        return { success: true, data: await cargarDatos(p) };
    } catch (e) {
        return { success: false, error: mensajeError(e) };
    }
}
