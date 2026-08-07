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

            {/* Client Component for the Data Table & Form */}
            <GastosClient initialData={transacciones} proyectos={proyectos || []} globalSummary={summary} />
        </div>
    );
}
