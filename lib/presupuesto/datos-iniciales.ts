// Valores iniciales del consolidado (reunión financiera de cierre 2026).
import type { Concepto, Detalle, FilaInfo, Presupuesto } from "./tipos";

let n = 0;
const id = (p: string) => `${p}-${++n}`;
const det = (lineas: [string, number][]): Detalle[] => lineas.map(([nombre, valor]) => ({ id: id("d"), nombre, valor, incluido: true, nota: "" }));
const con = (nombre: string, valor: number | null, nota = "", extra: Partial<Concepto> = {}): Concepto => ({
    id: id("c"),
    nombre,
    incluido: true,
    valor,
    nota,
    ...extra,
});
const fila = (nombre: string, valor: number | null, nota = ""): FilaInfo => ({ id: id("f"), nombre, valor, nota });

export function presupuestoInicial(): Presupuesto {
    n = 0;
    return {
        bolsaInicial: 240_000_000,
        descuentoPb: 2000, // 20 %
        secciones: [
            {
                id: "deportes",
                titulo: "Deportes – compromisos pendientes",
                nota: "El presupuesto original de Deportes era de $99.900.000. El Campeonato Interveredal tiene CDP por $37.805.000, que ya está reservado y no se toma de la bolsa general.",
                conceptos: [
                    con("Premiación Torneo Interveredal", 22_400_000, "Incluido en compromisos del campeonato"),
                    con("Árbitros, planilleros, pasabolas y camilleros", 21_000_000, "Incluido en compromisos del campeonato"),
                    con("Uniformes para equipos participantes del Interveredal", 13_500_000, "Incluido en compromisos del campeonato"),
                    con("Torneo Futsala – Coliseo Municipal", 13_000_000, "Pendiente"),
                    con("Campeonato Nacional Talento de Barrio", 30_000_000, "Pendiente"),
                    con("Menos: valor cubierto con el CDP del Campeonato Interveredal", 37_805_000, "Ya reservado, no sale de la bolsa", { deduccion: true }),
                ],
            },
            {
                id: "cultura",
                titulo: "Cultura – Navidad y remate de fin de año",
                nota: "Presupuesto actualizado de Cultura, incluidos los regalos de Navidad para los niños.",
                conceptos: [
                    con("Concurso de afiche Carnaval 2027", null, "", {
                        detalles: det([
                            ["Afiche ganador", 1_000_000],
                            ["Incentivos participantes", 1_000_000],
                            ["Jurado calificador", 400_000],
                            ["Refrigerios", 100_000],
                        ]),
                    }),
                    con("Alumbrado de Navidad", null, "", {
                        detalles: det([
                            ["Figuras", 7_500_000],
                            ["Transporte", 2_000_000],
                            ["Cargueros", 300_000],
                            ["Bolas de Navidad para barrios", 320_000],
                        ]),
                    }),
                    con("Actividad del 7 de diciembre", null, "", {
                        detalles: det([
                            ["Refrigerios para bandas", 180_000],
                            ["Sonido", 150_000],
                        ]),
                    }),
                    con("Novenas de Navidad (16 al 24 de diciembre)", null, "", {
                        detalles: det([
                            ["Estibas", 600_000],
                            ["Casetas", 495_000],
                            ["Sonido", 2_250_000],
                            ["Ofrenda", 250_000],
                            ["Refrigerios de mañana", 875_000],
                            ["Refrigerios de noche", 2_250_000],
                            ["Bandas", 1_800_000],
                            ["Dulces novenas", 2_500_000],
                            ["Bolsas de dulces para niños", 800_000],
                            ["Material pesebre Alcaldía", 500_000],
                            ["Incentivo calles iluminadas", 5_000_000],
                            ["Sonido pase mañanas", 270_000],
                            ["Detalles rifas", 700_000],
                        ]),
                    }),
                    con("Actividad del 28 de diciembre", null, "", {
                        detalles: det([
                            ["Aguinaldos", 3_000_000],
                            ["Sonido", 400_000],
                            ["Botellas", 1_250_000],
                        ]),
                    }),
                    con("Año Viejo – 31 de diciembre", null, "", {
                        detalles: det([
                            ["Años viejos (carrozas)", 10_000_000],
                            ["Botellas para artesanos", 500_000],
                            ["Banda", 2_400_000],
                            ["Jurados", 400_000],
                            ["Gaseosas para artesanos", 100_000],
                        ]),
                    }),
                    con("Compra de regalos de Navidad para niños", null, "Número de niños por confirmar (puede subir a 1.600 o más)", {
                        calculo: { cantidad: 1_550, valorUnitario: 20_000, etiquetaCantidad: "niños", etiquetaUnitario: "por regalo" },
                    }),
                ],
            },
            {
                id: "gobierno",
                titulo: "Gobierno, atención social y otras necesidades",
                nota: "La capacitación de adulto mayor y los demás refrigerios corresponden a la distribución de los $3.500.000 inicialmente previstos.",
                conceptos: [
                    con("Alimentación para personas desplazadas", 5_600_000, "Sin fecha especificada"),
                    con("Transporte de fallecidos por hechos relacionados con el conflicto", 6_000_000, "Sin fecha especificada"),
                    con("Lámparas solares", 15_000_000, "Sin fecha especificada"),
                    con("Capacitación adulto mayor – Camila (refrigerios y almuerzos)", 2_182_500, "Sin fecha especificada"),
                    con("Otros refrigerios y almuerzos", 1_317_500, "Sin fecha especificada"),
                    con("Programa No a la Pólvora", 3_000_000, "Sin fecha especificada"),
                    con("Salarios de empleados", 7_000_000, "Pendiente de precisar"),
                    con("Despedida de empleados", 4_000_000, "Sin fecha especificada"),
                    con("Tienda Ortega", 5_000_000, "Por confirmar", { incluido: false }),
                    con("Menajes escolares", null, "Valor por definir", { incluido: false }),
                ],
            },
        ],
        cdp: [
            fila("Campeonato Interveredal", 37_805_000),
            fila("Mercado Campesino", 5_002_000),
            fila("Conmemoración de Juntas de Acción Comunal", 11_978_000),
            fila("Día del Río Guáitara – Agricultura", 5_500_000),
        ],
        victimas: {
            recursos: 33_005_200,
            mesa: 17_500_000,
            nota: "Estos recursos se manejan por separado y no se suman a la bolsa general.",
        },
        porConfirmar: [
            fila(
                "Alumbrado navideño (mencionado en la reunión financiera)",
                34_000_000,
                "Confirmar si es una fuente independiente o si está relacionado con los $10.120.000 de Cultura. No se suma hasta aclararlo."
            ),
        ],
        retirados: [
            fila("Comisaría de Familia", 20_000_000, "Retirado de la bolsa"),
            fila("Señalización Inspección de Convivencia y Paz", 2_600_000, "Se deja para 2027"),
            fila("Día del Río Guáitara", 5_500_000, "Ya tiene CDP"),
            fila("Mercado Campesino", 5_002_000, "Ya tiene CDP"),
            fila("Conmemoración Juntas de Acción Comunal", 11_978_000, "Ya tiene CDP"),
            fila("Campeonato Interveredal", 37_805_000, "Ya tiene CDP"),
        ],
    };
}
