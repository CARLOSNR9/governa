import { getTransacciones } from "@/app/actions/gastos";
import { getProyectos } from "@/app/actions/proyectos";
import GastosClient from "./GastosClient";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function GastosPage() {
    const response = await getTransacciones();
    const proyectosResponse = await getProyectos();

    if (!response.success || !proyectosResponse.success) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Wallet className="h-16 w-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-700">Error al cargar datos</h2>
                <p className="text-slate-500">No se pudieron obtener las transacciones.</p>
            </div>
        );
    }

    const { data: transacciones, summary } = response;
    const { data: proyectos } = proyectosResponse;

    if (!summary || !transacciones) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Wallet className="h-8 w-8 text-indigo-600" />
                    Control de Gastos
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Gestiona los ingresos y egresos de la secretaría.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            ${summary.totalIngresos.toLocaleString("es-CO")}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Egresos Totales</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            ${summary.totalEgresos.toLocaleString("es-CO")}
                        </p>
                    </div>
                </div>

                <div className="bg-indigo-600 dark:bg-indigo-900 p-6 rounded-xl border border-indigo-700 dark:border-indigo-800 shadow-sm flex items-center gap-4 text-white">
                    <div className="p-3 bg-indigo-500 dark:bg-indigo-800 rounded-lg">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-indigo-100">Saldo Actual</p>
                        <p className="text-2xl font-bold">
                            ${summary.saldo.toLocaleString("es-CO")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Client Component for the Data Table & Form */}
            <GastosClient initialData={transacciones} proyectos={proyectos || []} />
        </div>
    );
}
