import { Sidebar } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 font-sans">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-w-[1600px]">
                {children}
            </main>
            <Toaster />
        </div>
    );
}
