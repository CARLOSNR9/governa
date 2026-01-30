import { MagicEditor } from "@/components/modules/magic-desktop/MagicEditor";

export default function MagicDesktopPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Escritorio Mágico
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Convierte tus apuntes rápidos en documentos oficiales al instante.
                </p>
            </div>

            <MagicEditor />
        </div>
    );
}
