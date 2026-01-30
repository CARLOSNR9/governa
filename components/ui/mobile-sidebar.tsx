"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, PenTool, Users, Calendar, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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

export const MobileSidebar = () => {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar when route changes
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 w-72">
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
                            <img
                                src="/logo.jpg"
                                alt="GOVERNA Logo"
                                className="h-10 w-auto object-contain rounded-md"
                            />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                    GOVERNA
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                                    Linares Digital
                                </span>
                            </div>
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
            </SheetContent>
        </Sheet>
    );
};
