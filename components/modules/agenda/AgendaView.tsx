"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createMeeting } from "@/app/actions/agenda";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Plus, Lightbulb } from "lucide-react";
import { es } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgendaViewProps {
    initialMeetings: any[];
    moralSupport: any[];
}

export function AgendaView({ initialMeetings, moralSupport }: AgendaViewProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [meetings, setMeetings] = useState(initialMeetings);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filter meetings for selected date (simple client-side filter for demo)
    const selectedDateMeetings = meetings.filter(m =>
        date && new Date(m.fecha).toDateString() === date.toDateString()
    );

    async function handleCreateMeeting(formData: FormData) {
        const result = await createMeeting(formData);
        if (result.success) {
            toast.success(result.message);
            setIsDialogOpen(false);
            // In a real app we'd re-fetch or use optimist update. For now, reload.
            window.location.reload();
        } else {
            toast.error(result.error);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
            {/* Calendar Column */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-indigo-950 dark:text-indigo-100">
                            Calendario
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center p-2">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border shadow p-4"
                            locale={es}
                        />
                    </CardContent>
                </Card>

                {/* Moral Support / Context */}
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <Lightbulb className="w-4 h-4" />
                            Ayuda Moral
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {moralSupport.map((item, i) => (
                                <div key={i} className="text-sm p-3 bg-white dark:bg-amber-950/40 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                                    <p className="text-amber-900 dark:text-amber-100 leading-snug">
                                        {item.mensaje}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Schedule Column */}
            <div className="lg:col-span-8 xl:col-span-9">
                <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50 dark:bg-slate-900/50 pb-4">
                        <div>
                            <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                                Agenda del Día
                            </CardTitle>
                            <CardDescription className="capitalize">
                                {date?.toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'long' })}
                            </CardDescription>
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nueva Reunión
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Agendar Reunión</DialogTitle>
                                    <DialogDescription>
                                        Crea un nuevo compromiso en tu agenda oficial.
                                    </DialogDescription>
                                </DialogHeader>
                                <form action={handleCreateMeeting}>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="titulo" className="text-right">
                                                Título
                                            </Label>
                                            <Input id="titulo" name="titulo" className="col-span-3" required />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="fecha" className="text-right">
                                                Fecha
                                            </Label>
                                            <Input
                                                id="fecha"
                                                name="fecha"
                                                type="date"
                                                defaultValue={date?.toISOString().split('T')[0]}
                                                className="col-span-3"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="hora" className="text-right">
                                                Hora
                                            </Label>
                                            <Input
                                                id="hora"
                                                name="hora"
                                                type="time"
                                                className="col-span-3"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Guardar</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex-1 p-6">
                        {selectedDateMeetings.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDateMeetings.map((meeting) => (
                                    <div key={meeting.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <div className="flex flex-col items-center justify-center min-w-[80px] p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-700 dark:text-indigo-300">
                                            <Clock className="w-5 h-5 mb-1" />
                                            <span className="font-bold">
                                                {new Date(meeting.fecha).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                                {meeting.titulo}
                                            </h3>
                                            <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                                                {meeting.notas || "Sin notas previas."}
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <Badge variant="secondary">Oficial</Badge>
                                                {meeting.acta && <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Con Acta</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg">No hay reuniones para este día.</p>
                                <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                                    ¡Agendar algo ahora!
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
