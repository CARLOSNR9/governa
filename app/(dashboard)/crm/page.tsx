import { getRecentCitizens, getStats } from "@/app/actions/crm";
import { CitizenList } from "@/components/modules/crm/CitizenList";
import { CitizenRegistrationForm } from "@/components/modules/crm/CitizenRegistrationForm";
import { StatsOverview } from "@/components/modules/crm/StatsOverview";

export default async function CrmPage() {
    const [citizens, stats] = await Promise.all([
        getRecentCitizens(),
        getStats()
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Atención Ciudadana
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Gestión de ciudadanos, peticiones y "Escudo de Memoria".
                </p>
            </div>

            <StatsOverview stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <CitizenRegistrationForm />
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Últimas Visitas
                    </h2>
                    <CitizenList citizens={citizens} />
                </div>
            </div>
        </div>
    );
}
