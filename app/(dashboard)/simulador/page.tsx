import { Calculator } from "lucide-react";
import { getSimuladorData } from "@/app/actions/simulador";
import { SimuladorView } from "@/components/modules/simulador/SimuladorView";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Simulador Presupuestal 2026 | GOVERNA",
};

export default async function SimuladorPage() {
    const res = await getSimuladorData();

    if (!res.success) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center">
                <Calculator className="mb-4 h-16 w-16 text-slate-300" />
                <h2 className="text-xl font-semibold text-slate-700">No fue posible cargar el simulador</h2>
                <p className="text-slate-500">{res.error}</p>
            </div>
        );
    }

    return <SimuladorView inicial={res.data} />;
}
