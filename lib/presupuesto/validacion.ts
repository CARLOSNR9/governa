import { z } from "zod";
import { CANTIDAD_MAXIMA, VALOR_MAXIMO } from "./tipos";

const valor = z.number().int().min(0).max(VALOR_MAXIMO);
const id = z.string().min(1).max(80);
const texto = (max: number) => z.string().max(max);
const notaLarga = z.string().max(3000).optional();
const cantidad = z.number().int().min(0).max(CANTIDAD_MAXIMA).optional();
// El total puede superar el valor máximo de un campo (cantidad × unitario), pero no el rango seguro.
const total = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

const detalle = z.object({ id, nombre: texto(200), valor: total.nullable(), incluido: z.boolean(), nota: texto(500).optional(), notaDetallada: notaLarga, cantidad, valorUnitario: valor.nullable().optional() });

const concepto = z.object({
    id,
    nombre: texto(250),
    incluido: z.boolean(),
    valor: total.nullable(),
    cantidad,
    valorUnitario: valor.nullable().optional(),
    nota: texto(500),
    notaDetallada: notaLarga,
    detalles: z.array(detalle).max(100).optional(),
    calculo: z
        .object({
            cantidad: z.number().int().min(0).max(1_000_000),
            valorUnitario: valor,
            etiquetaCantidad: texto(40),
            etiquetaUnitario: texto(40),
        })
        .optional(),
    deduccion: z.boolean().optional(),
});

const fila = z.object({ id, nombre: texto(250), valor: valor.nullable(), nota: texto(500), notaDetallada: notaLarga });

export const esquemaPresupuesto = z.object({
    bolsaInicial: valor,
    descuentoPb: z.number().int().min(0).max(10_000),
    secciones: z.array(z.object({ id, titulo: texto(200), nota: texto(1000), notaGeneral: notaLarga, conceptos: z.array(concepto).max(200) })).max(20),
    cdp: z.array(fila).max(100),
    victimas: z.object({ recursos: valor, mesa: valor, nota: texto(1000) }),
    porConfirmar: z.array(fila).max(100),
    retirados: z.array(fila).max(100),
    notaGeneral: notaLarga,
});
