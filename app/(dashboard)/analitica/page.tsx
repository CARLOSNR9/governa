import { getAnalyticsData } from "@/app/actions/analytics";
import { AnalyticsDashboard } from "@/components/modules/analytics/AnalyticsDashboard";

export default async function AnalyticsPage() {
    const data = await getAnalyticsData();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Transparencia y Analítica
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Datos reales para la toma de decisiones estratégicas.
                </p>
            </div>

            <AnalyticsDashboard data={data} />
        </div>
    );
}
