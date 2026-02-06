"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createMeeting, updateMeetingNotes, addMeetingTask, toggleMeetingTask, deleteMeetingTask, deleteMeeting, updateMeeting } from "@/app/actions/agenda";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Plus, Lightbulb, FileText, Save, CheckCircle2, Trash2, AlertTriangle, Edit, Square, CheckSquare } from "lucide-react";
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AgendaViewProps {
    initialMeetings: any[];
    moralSupport: any[];
}

export function AgendaView({ initialMeetings, moralSupport }: AgendaViewProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [meetings, setMeetings] = useState(initialMeetings);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Detailed View State
    const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [newTask, setNewTask] = useState("");
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Filter meetings
    const selectedDateMeetings = meetings.filter(m =>
        date && new Date(m.fecha).toDateString() === date.toDateString()
    );

    // Helpers for local input formatting
    const formatDateForInput = (d: Date | string | undefined) => {
        if (!d) return "";
        const dateObj = typeof d === 'string' ? new Date(d) : d;
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTimeForInput = (d: Date | string) => {
        const dateObj = typeof d === 'string' ? new Date(d) : d;
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Initialize notes when a meeting is selected
    useEffect(() => {
        if (selectedMeeting) {
            setNotes(selectedMeeting.notas || "");
            setShowDeleteConfirm(false); // Reset confirm state
        }
    }, [selectedMeeting]);

    async function handleCreateMeeting(formData: FormData) {
        const result = await createMeeting(formData);
        if (result.success) {
            toast.success(result.message);
            setIsDialogOpen(false);
            window.location.reload();
        } else {
            toast.error(result.error);
        }
    }

    async function handleUpdateMeeting(formData: FormData) {
        const result = await updateMeeting(formData);
        if (result.success) {
            toast.success(result.message);
            setIsEditOpen(false);
            window.location.reload();
        } else {
            toast.error(result.error);
        }
    }

    async function handleSaveNotes() {
        if (!selectedMeeting) return;
        setIsSavingNotes(true);
        const result = await updateMeetingNotes(selectedMeeting.id, notes);
        if (result.success) {
            toast.success("Notas guardadas correctamente");
            setMeetings(meetings.map(m => m.id === selectedMeeting.id ? { ...m, notas: notes } : m));
            setSelectedMeeting({ ...selectedMeeting, notas: notes });
        } else {
            toast.error(result.error);
        }
        setIsSavingNotes(false);
    }

    async function handleAddTask(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedMeeting || !newTask.trim()) return;

        const result = await addMeetingTask(selectedMeeting.id, newTask);
        if (result.success) {
            const updatedMeeting = {
                ...selectedMeeting,
                tareas: [...(selectedMeeting.tareas || []), result.tarea]
            };
            setSelectedMeeting(updatedMeeting);
            setMeetings(meetings.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));
            setNewTask("");
            toast.success("Tarea agregada");
        } else {
            toast.error(result.error);
        }
    }

    async function handleToggleTask(taskId: string, currentStatus: boolean) {
        if (!selectedMeeting) return;

        // Optimistic update
        const updatedTasks = selectedMeeting.tareas.map((t: any) =>
            t.id === taskId ? { ...t, completado: !currentStatus } : t
        );
        const updatedMeeting = { ...selectedMeeting, tareas: updatedTasks };

        setSelectedMeeting(updatedMeeting);
        setMeetings(meetings.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));

        const result = await toggleMeetingTask(taskId, !currentStatus);
        if (!result.success) {
            toast.error("Error al actualizar la tarea");
            // Revert on failure (could be improved)
        }
    }

    async function handleDeleteTask(taskId: string) {
        if (!selectedMeeting) return;

        const updatedTasks = selectedMeeting.tareas.filter((t: any) => t.id !== taskId);
        const updatedMeeting = { ...selectedMeeting, tareas: updatedTasks };

        setSelectedMeeting(updatedMeeting);
        setMeetings(meetings.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));

        const result = await deleteMeetingTask(taskId);
        if (!result.success) {
            toast.error("Error al eliminar la tarea");
        }
    }

    async function handleDeleteMeeting() {
        if (!selectedMeeting) return;
        setIsDeleting(true);
        const result = await deleteMeeting(selectedMeeting.id);

        if (result.success) {
            toast.success(result.message);
            setSelectedMeeting(null);
            // Optimistic update
            setMeetings(meetings.filter(m => m.id !== selectedMeeting.id));
        } else {
            toast.error(result.error);
        }
        setIsDeleting(false);
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
                            modifiers={{
                                hasMeeting: (d) => meetings.some(m => new Date(m.fecha).toDateString() === d.toDateString())
                            }}
                            modifiersClassNames={{
                                hasMeeting: "bg-indigo-100 text-indigo-900 font-bold hover:bg-indigo-200 cursor-pointer"
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Moral Support / Context */}
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <Lightbulb className="w-4 h-4" />
                            Estrategia Diaria (IA)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {moralSupport.map((item, i) => (
                                <div key={i} className="text-sm p-3 bg-white dark:bg-amber-950/40 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                                            {item.tipo.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-amber-900 dark:text-amber-100 leading-snug font-medium">
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
                                            <Label htmlFor="titulo" className="text-right">Título</Label>
                                            <Input id="titulo" name="titulo" className="col-span-3" required />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="fecha" className="text-right">Fecha</Label>
                                            <Input id="fecha" name="fecha" type="date" defaultValue={formatDateForInput(date)} className="col-span-3" required />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="hora" className="text-right">Hora</Label>
                                            <Input id="hora" name="hora" type="time" className="col-span-3" required />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Guardar</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>

                    <CardContent className="flex-1 p-6 overflow-y-auto">
                        {selectedDateMeetings.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDateMeetings.map((meeting) => (
                                    <div
                                        key={meeting.id}
                                        onClick={() => setSelectedMeeting(meeting)}
                                        className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer group"
                                    >
                                        <div className="flex flex-col items-center justify-center min-w-[80px] p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-100 transition-colors">
                                            <Clock className="w-5 h-5 mb-1" />
                                            <span className="font-bold">
                                                {new Date(meeting.fecha).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 transition-colors">
                                                    {meeting.titulo}
                                                </h3>
                                                {meeting.acta && <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50"><CheckCircle2 className="w-3 h-3 mr-1" /> Acta Lista</Badge>}
                                            </div>
                                            <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                                                {meeting.notas || "Haz clic para añadir notas y generar acta..."}
                                            </p>
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

            {/* Meeting Details Sheet */}
            <Sheet open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    {selectedMeeting && (
                        <>
                            <SheetHeader className="mb-6">
                                <Badge className="w-fit mb-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none">
                                    {new Date(selectedMeeting.fecha).toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Badge>
                                <div className="flex justify-between items-start gap-4">
                                    <SheetTitle className="text-2xl">{selectedMeeting.titulo}</SheetTitle>
                                    <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Editar Reunión</DialogTitle>
                                                <DialogDescription>
                                                    Modifica los detalles de la reunión.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form action={handleUpdateMeeting}>
                                                <input type="hidden" name="id" value={selectedMeeting.id} />
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="edit-titulo" className="text-right">Título</Label>
                                                        <Input id="edit-titulo" name="titulo" defaultValue={selectedMeeting.titulo} className="col-span-3" required />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="edit-fecha" className="text-right">Fecha</Label>
                                                        <Input id="edit-fecha" name="fecha" type="date" defaultValue={formatDateForInput(selectedMeeting.fecha)} className="col-span-3" required />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="edit-hora" className="text-right">Hora</Label>
                                                        <Input id="edit-hora" name="hora" type="time" defaultValue={formatTimeForInput(selectedMeeting.fecha)} className="col-span-3" required />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit">Actualizar</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <SheetDescription>
                                    Gestiona los detalles, notas y actas de esta reunión.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-6">
                                {/* Notes Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Notas de la Reunión
                                        </Label>
                                        <Button size="sm" variant="ghost" onClick={handleSaveNotes} disabled={isSavingNotes}>
                                            <Save className="w-4 h-4 mr-2" />
                                            {isSavingNotes ? "Guardando..." : "Guardar Notas"}
                                        </Button>
                                    </div>
                                    <Textarea
                                        placeholder="Escribe aquí los puntos clave, discusiones y acuerdos..."
                                        className="min-h-[150px] resize-y"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500">
                                        Estas notas son la base para que la IA genere el acta oficial.
                                    </p>
                                </div>

                                {/* Task Manager Section */}
                                <div className="space-y-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/50">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-lg flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                                            <CheckSquare className="w-5 h-5" /> Pendientes
                                        </h4>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                            {selectedMeeting.tareas?.filter((t: any) => !t.completado).length || 0} pendientes
                                        </Badge>
                                    </div>

                                    {/* Add Task Form */}
                                    <form onSubmit={handleAddTask} className="flex gap-2">
                                        <Input
                                            placeholder="Agregar nueva tarea..."
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button type="submit" size="sm" disabled={!newTask.trim()}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </form>

                                    {/* Task List */}
                                    <div className="space-y-2">
                                        {selectedMeeting.tareas?.length > 0 ? (
                                            selectedMeeting.tareas.map((task: any) => (
                                                <div
                                                    key={task.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${task.completado
                                                            ? "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-900/50 dark:border-slate-800"
                                                            : "bg-white border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800"
                                                        }`}
                                                >
                                                    <button
                                                        onClick={() => handleToggleTask(task.id, task.completado)}
                                                        className={`flex-shrink-0 transition-colors ${task.completado ? "text-slate-400" : "text-indigo-600 hover:text-indigo-700"
                                                            }`}
                                                    >
                                                        {task.completado ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                    </button>

                                                    <span className={`flex-1 text-sm ${task.completado ? "line-through" : ""}`}>
                                                        {task.descripcion}
                                                    </span>

                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                                                <p className="text-sm">No hay tareas pendientes</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Delete Zone */}
                                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                                    {!showDeleteConfirm ? (
                                        <Button
                                            variant="ghost"
                                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Eliminar Reunión
                                        </Button>
                                    ) : (
                                        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900 flex flex-col gap-3">
                                            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium text-sm">
                                                <AlertTriangle className="w-4 h-4" />
                                                ¿Estás seguro de eliminar esta reunión?
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={handleDeleteMeeting}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    disabled={isDeleting}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
