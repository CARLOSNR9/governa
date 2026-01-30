import { Sidebar } from "@/components/ui/sidebar";
import { MobileSidebar } from "@/components/ui/mobile-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 font-sans">
            {/* Desktop Sidebar */}
            <Sidebar />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <MobileSidebar />
                        <span className="font-bold text-lg text-slate-900 dark:text-slate-100">GOVERNA</span>
                    </div>
                </div>

                <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto w-full max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
            <Toaster />
        </div>
    );
}
