// Datos iniciales del Simulador Presupuestal 2026 (reunión financiera de cierre de vigencia).
// Se cargan automáticamente la primera vez que se abre el módulo.
import type { EstadoDecision, GrupoGasto, Prioridad } from "./constantes";

export const BOLSA_INICIAL = 240_000_000;
export const DESCUENTO_INICIAL = 48_000_000; // 20 %: impuestos, estampillas, papelería y otros
export const VICTIMAS_RECURSOS = 33_005_200;
export const VICTIMAS_MESA = 17_500_000;

export interface GastoInicial {
    clave: string;
    nombre: string;
    categoria: string;
    grupo: GrupoGasto;
    valorReferencia: number | null;
    descripcion?: string;
    observaciones?: string;
    prioridad?: Prioridad;
    desglose?: { concepto: string; valor: number | null }[];
}

export const GASTOS_INICIALES: GastoInicial[] = [
    // A. DEPORTES
    {
        clave: "dep_otros",
        nombre: "Otros compromisos de Deportes pendientes",
        categoria: "DEPORTES",
        grupo: "PENDIENTE",
        valorReferencia: 32_095_000,
        descripcion:
            "Incluye los compromisos de premiación, arbitraje, planilleros, pasabolas, camilleros, uniformes y Torneo Futsala.",
        observaciones: "Distribución exacta sujeta a verificación.",
        desglose: [
            { concepto: "Premiación", valor: null },
            { concepto: "Arbitraje", valor: null },
            { concepto: "Planilleros", valor: null },
            { concepto: "Pasabolas", valor: null },
            { concepto: "Camilleros", valor: null },
            { concepto: "Uniformes", valor: null },
            { concepto: "Torneo Futsala", valor: null },
        ],
    },
    { clave: "dep_talento", nombre: "Campeonato Nacional Talento de Barrio", categoria: "DEPORTES", grupo: "PENDIENTE", valorReferencia: 30_000_000 },

    // B. CULTURA – NAVIDAD Y REMATE DE FIN DE AÑO
    { clave: "cul_afiche", nombre: "Concurso afiche del Carnaval 2027", categoria: "CULTURA", grupo: "PENDIENTE", valorReferencia: 2_500_000 },
    { clave: "cul_alumbrado", nombre: "Alumbrado de Navidad", categoria: "CULTURA", grupo: "PENDIENTE", valorReferencia: 10_120_000 },
    { clave: "cul_7dic", nombre: "Actividad del 7 de diciembre", categoria: "CULTURA", grupo: "PENDIENTE", valorReferencia: 330_000 },
    { clave: "cul_novenas", nombre: "Novenas de Navidad (16 al 24 de diciembre)", categoria: "CULTURA", grupo: "PENDIENTE", valorReferencia: 18_290_000 },
    { clave: "cul_28dic", nombre: "Actividad del 28 de diciembre", categoria: "CULTURA", grupo: "PENDIENTE", valorReferencia: 4_650_000 },
    { clave: "cul_anoviejo", nombre: "Año Viejo (31 de diciembre)", categoria: "CULTURA", grupo: "PENDIENTE", valorReferencia: 13_400_000 },

    // C. REGALOS DE NAVIDAD PARA LOS NIÑOS (bolsa independiente de Cultura)
    {
        clave: "reg_ninos",
        nombre: "Regalos de Navidad para los niños",
        categoria: "REGALOS_NAVIDAD",
        grupo: "PENDIENTE",
        valorReferencia: 46_000_000,
        descripcion: "Bolsa independiente del presupuesto de Cultura, mencionada en la reunión financiera.",
    },

    // D. GOBIERNO Y ATENCIÓN SOCIAL
    { clave: "gob_desplazados", nombre: "Alimentación para personas desplazadas", categoria: "GOBIERNO_SOCIAL", grupo: "PENDIENTE", valorReferencia: 5_600_000, prioridad: "ALTA" },
    { clave: "gob_fallecidos", nombre: "Transporte de fallecidos por hechos relacionados con el conflicto", categoria: "GOBIERNO_SOCIAL", grupo: "PENDIENTE", valorReferencia: 6_000_000, prioridad: "ALTA" },

    // E. INFRAESTRUCTURA Y SERVICIOS
    { clave: "inf_lamparas", nombre: "Adquisición de lámparas solares", categoria: "INFRAESTRUCTURA", grupo: "PENDIENTE", valorReferencia: 15_000_000 },

    // F. ACTIVIDADES Y LOGÍSTICA
    { clave: "log_adulto_mayor", nombre: "Capacitación de adulto mayor – Camila (refrigerios y almuerzos)", categoria: "LOGISTICA", grupo: "PENDIENTE", valorReferencia: 2_182_500 },
    { clave: "log_refrigerios", nombre: "Otros refrigerios y almuerzos", categoria: "LOGISTICA", grupo: "PENDIENTE", valorReferencia: 1_317_500 },
    { clave: "log_polvora", nombre: "Programa No a la Pólvora", categoria: "LOGISTICA", grupo: "PENDIENTE", valorReferencia: 3_000_000 },

    // G. PERSONAL
    { clave: "per_salarios", nombre: "Salarios de empleados", categoria: "PERSONAL", grupo: "PENDIENTE", valorReferencia: 7_000_000, prioridad: "ALTA" },
    { clave: "per_despedida", nombre: "Actividad de despedida de empleados", categoria: "PERSONAL", grupo: "PENDIENTE", valorReferencia: 4_000_000 },

    // H. NECESIDADES POR CONFIRMAR (no suman hasta que se incorporen)
    { clave: "conf_ortega", nombre: "Tienda Ortega", categoria: "OTRAS_NECESIDADES", grupo: "POR_CONFIRMAR", valorReferencia: 5_000_000, observaciones: "Pendiente de confirmación." },
    { clave: "conf_menajes", nombre: "Menajes escolares", categoria: "OTRAS_NECESIDADES", grupo: "POR_CONFIRMAR", valorReferencia: null, observaciones: "Valor pendiente por definir." },

    // I. CONCEPTOS RETIRADOS O YA CUBIERTOS (no afectan el saldo)
    { clave: "exc_interveredal", nombre: "Campeonato Interveredal", categoria: "DEPORTES", grupo: "CUBIERTO_CDP", valorReferencia: 37_805_000, observaciones: "Ya cuenta con CDP. No se descuenta de la bolsa." },
    { clave: "exc_rio", nombre: "Día del Río Guáitara", categoria: "OTROS", grupo: "CUBIERTO_CDP", valorReferencia: 5_500_000, observaciones: "Ya cuenta con CDP." },
    { clave: "exc_mercado", nombre: "Mercado Campesino", categoria: "OTROS", grupo: "CUBIERTO_CDP", valorReferencia: 5_002_000, observaciones: "Ya cuenta con CDP." },
    { clave: "exc_jac", nombre: "Conmemoración de Juntas de Acción Comunal", categoria: "GOBIERNO_SOCIAL", grupo: "CUBIERTO_CDP", valorReferencia: 11_978_000, observaciones: "Ya cuenta con CDP." },
    { clave: "exc_senalizacion", nombre: "Señalización de la Inspección de Convivencia y Paz", categoria: "GOBIERNO_SOCIAL", grupo: "OTRA_VIGENCIA", valorReferencia: 2_600_000, observaciones: "Se deja para la vigencia 2027." },
    { clave: "exc_comisaria", nombre: "Comisaría de Familia", categoria: "GOBIERNO_SOCIAL", grupo: "RETIRADO", valorReferencia: 20_000_000, observaciones: "Se retiró de esta simulación." },
];

export interface DecisionInicial {
    valor?: number | null;
    estado?: EstadoDecision;
    incluido?: boolean;
    observaciones?: string;
}

export interface EscenarioInicial {
    nombre: string;
    descripcion: string;
    observaciones?: string;
    bloqueado: boolean;
    /** Decisiones que difieren del escenario de referencia (todos los gastos pendientes incluidos). */
    decisiones: Record<string, DecisionInicial>;
}

const NOTA_ILUSTRATIVA = "Propuesta ilustrativa precargada: ajústela según las decisiones de la reunión.";

export const ESCENARIOS_INICIALES: EscenarioInicial[] = [
    {
        nombre: "Escenario inicial – Todos los gastos propuestos",
        descripcion: "Escenario de referencia con todos los gastos pendientes a su valor presupuestado.",
        observaciones: "Escenario protegido. Para simular cambios, duplíquelo o use otro escenario.",
        bloqueado: true,
        decisiones: {},
    },
    {
        nombre: "Escenario 1 – Sin Talento de Barrio",
        descripcion: "Retira el Campeonato Nacional Talento de Barrio ($30.000.000).",
        observaciones: NOTA_ILUSTRATIVA,
        bloqueado: false,
        decisiones: {
            dep_talento: { estado: "DESCARTADO", observaciones: "Se retira del cierre de vigencia." },
        },
    },
    {
        nombre: "Escenario 2 – Reducción de actividades navideñas",
        descripcion: "Ajusta a la baja alumbrado, novenas, actividad del 28 de diciembre, Año Viejo y regalos.",
        observaciones: NOTA_ILUSTRATIVA,
        bloqueado: false,
        decisiones: {
            cul_alumbrado: { valor: 8_000_000 },
            cul_novenas: { valor: 15_000_000 },
            cul_28dic: { valor: 3_500_000 },
            cul_anoviejo: { valor: 11_000_000 },
            reg_ninos: { valor: 44_000_000 },
        },
    },
    {
        nombre: "Escenario 3 – Prioridad atención social y personal",
        descripcion: "Aprueba atención social, personal, infraestructura y logística; reduce Talento de Barrio y retira el concurso de afiche 2027.",
        observaciones: NOTA_ILUSTRATIVA,
        bloqueado: false,
        decisiones: {
            gob_desplazados: { estado: "APROBADO" },
            gob_fallecidos: { estado: "APROBADO" },
            per_salarios: { estado: "APROBADO" },
            per_despedida: { estado: "APROBADO" },
            inf_lamparas: { estado: "APROBADO" },
            log_adulto_mayor: { estado: "APROBADO" },
            log_refrigerios: { estado: "APROBADO" },
            log_polvora: { estado: "APROBADO" },
            dep_talento: { valor: 15_000_000 },
            cul_afiche: { estado: "DESCARTADO", observaciones: "Corresponde a la vigencia 2027." },
        },
    },
];
