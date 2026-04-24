import { getContacts } from "@/app/actions/directorio";
import { DirectorioView } from "@/components/modules/directorio/DirectorioView";
import { BookUser } from "lucide-react";

export default async function DirectorioPage() {
    const contacts = await getContacts();

    return (
        <div className="space-y-6 h-full pb-20">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-600">
                        <BookUser className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Directorio de Contactos
                    </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                    Gestiona tu red de contactos, líderes comunitarios y ciudadanos con información detallada y acceso rápido.
                </p>
            </div>

            <DirectorioView initialContacts={contacts} />
        </div>
    );
}
