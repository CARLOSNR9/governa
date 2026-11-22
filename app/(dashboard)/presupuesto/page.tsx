import { FileSpreadsheet } from "lucide-react";
import { getPresupuesto } from "@/app/actions/presupuesto";
import { ConsolidadoView } from "@/components/modules/presupuesto/ConsolidadoView";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Presupuesto 2026 | GOVERNA",
};

export default async function PresupuestoPage() {
    const res = await getPresupuesto();

    if (!res.success) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center">
                <FileSpreadsheet className="mb-4 h-16 w-16 text-slate-300" />
                <h2 className="text-xl font-semibold text-slate-700">No fue posible cargar el consolidado</h2>
                <p className="text-slate-500">{res.error}</p>
            </div>
        );
    }

    return <ConsolidadoView inicial={res.data.guardado} permisos={res.data.permisos} />;
}
