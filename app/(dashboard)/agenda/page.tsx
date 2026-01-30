import { getMoralSupport, getUpcomingMeetings } from "@/app/actions/agenda";
import { AgendaView } from "@/components/modules/agenda/AgendaView";

export default async function AgendaPage() {
    const [meetings, moralSupport] = await Promise.all([
        getUpcomingMeetings(),
        getMoralSupport()
    ]);

    return (
        <div className="space-y-6 h-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Agenda Inteligente
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Gestiona tus compromisos con contexto y recordatorios estratégicos.
                </p>
            </div>

            <AgendaView initialMeetings={meetings} moralSupport={moralSupport} />
        </div>
    );
}
