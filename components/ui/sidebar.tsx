"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PenTool, Users, Calendar, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
    href: string;
    label: string;
    icon: any;
    disabled?: boolean;
}

const navItems: NavItem[] = [
    { href: "/escritorio", label: "Escritorio Mágico", icon: PenTool },
    { href: "/crm", label: "Atención Ciudadana", icon: Users },
    { href: "/agenda", label: "Agenda Inteligente", icon: Calendar },
    { href: "/analitica", label: "Analítica", icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 lg:flex lg:flex-col lg:w-72 h-screen flex-shrink-0 sticky top-0">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        GOVERNA
                    </span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Button
                            key={item.label}
                            asChild
                            variant="ghost"
                            disabled={item.disabled}
                            className={cn(
                                "w-full justify-start gap-3 h-12 text-base font-medium",
                                pathname === item.href
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-100 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                                item.disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {item.disabled ? (
                                <span className="flex items-center gap-3">
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </span>
                            ) : (
                                <Link href={item.href}>
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            )}
                        </Button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Configuración</p>
                        <p className="text-xs text-slate-500">v0.1.0 Beta</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
