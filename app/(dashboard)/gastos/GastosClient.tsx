"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle, Briefcase, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createTransaccion, deleteTransaccion } from "@/app/actions/gastos";
import { createProyecto, deleteProyecto } from "@/app/actions/proyectos";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GastosClient({ initialData, proyectos }: { initialData: any[], proyectos: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Vista de proyectos
    const [selectedProyecto, setSelectedProyecto] = useState<any | null>(null);

    const [formData, setFormData] = useState({
        concepto: "",
        monto: "",
        tipo: "EGRESO",
        categoria: "",
        proyectoId: "general", // "general" o id del proyecto
    });

    const [projectData, setProjectData] = useState({
        nombre: "",
        presupuesto: "",
        descripcion: "",
    });

    // Filtros
    const generalesData = initialData.filter(t => !t.proyectoId);
    
    const displayData = selectedProyecto 
        ? initialData.filter(t => t.proyectoId === selectedProyecto.id)
        : generalesData;

    const filteredData = displayData.filter(
        (t) =>
            t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.categoria && t.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCreateTransaccion = async () => {
        if (!formData.concepto || !formData.monto) {
            toast.error("Por favor completa los campos requeridos");
            return;
        }

        setIsSubmitting(true);
        const res = await createTransaccion({
            concepto: formData.concepto,
            monto: parseFloat(formData.monto),
            tipo: formData.tipo as "INGRESO" | "EGRESO",
            categoria: formData.categoria,
            proyectoId: formData.proyectoId === "general" ? undefined : formData.proyectoId,
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Transacción registrada correctamente");
            setIsDialogOpen(false);
            setFormData({ concepto: "", monto: "", tipo: "EGRESO", categoria: "", proyectoId: "general" });
            // Update selected project if active
            if (selectedProyecto) {
                // To keep it simple, rely on revalidation or next.js router refresh if needed, but since it's server actions revalidating, page will reload.
            }
        } else {
            toast.error(res.error || "Error al registrar la transacción");
        }
    };

    const handleCreateProject = async () => {
        if (!projectData.nombre || !projectData.presupuesto) {
            toast.error("Nombre y presupuesto son obligatorios");
            return;
        }

        setIsSubmitting(true);
        const res = await createProyecto({
            nombre: projectData.nombre,
            descripcion: projectData.descripcion,
            presupuesto: parseFloat(projectData.presupuesto),
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Proyecto creado correctamente");
            setIsProjectDialogOpen(false);
            setProjectData({ nombre: "", presupuesto: "", descripcion: "" });
        } else {
            toast.error(res.error || "Error al crear proyecto");
        }
    };

    const handleDeleteTransaccion = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este registro?")) return;
        const res = await deleteTransaccion(id);
        if (res.success) toast.success("Transacción eliminada");
        else toast.error(res.error || "Error al eliminar");
    };

    const handleDeleteProyecto = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este proyecto y todos sus gastos?")) return;
        const res = await deleteProyecto(id);
        if (res.success) {
            toast.success("Proyecto eliminado");
            setSelectedProyecto(null);
        } else {
            toast.error(res.error || "Error al eliminar proyecto");
        }
    };

    // Componente de tabla reutilizable
    const renderTable = (data: any[]) => (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 mt-6">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                No hay registros que mostrar.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium text-slate-600 dark:text-slate-300">
                                    {format(new Date(t.fecha), "dd MMM yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>{t.concepto}</TableCell>
                                <TableCell>
                                    {t.categoria ? (
                                        <Badge variant="outline" className="text-slate-500 bg-slate-50">
                                            {t.categoria}
                                        </Badge>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {t.tipo === "INGRESO" ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none flex w-fit items-center gap-1">
                                            <ArrowUpCircle className="h-3 w-3" /> Ingreso
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none flex w-fit items-center gap-1">
                                            <ArrowDownCircle className="h-3 w-3" /> Egreso
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell
                                    className={`text-right font-semibold ${
                                        t.tipo === "INGRESO"
                                            ? "text-emerald-600"
                                            : "text-slate-900 dark:text-slate-100"
                                    }`}
                                >
                                    {t.tipo === "INGRESO" ? "+" : "-"}$
                                    {t.monto.toLocaleString("es-CO")}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTransaccion(t.id)}
                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <Tabs defaultValue="generales" className="w-full" onValueChange={() => setSelectedProyecto(null)}>
            <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
                <TabsTrigger value="generales">Gastos Generales</TabsTrigger>
                <TabsTrigger value="proyectos">Mis Proyectos</TabsTrigger>
            </TabsList>

            <TabsContent value="generales">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar por concepto o categoría..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Button onClick={() => {
                                setFormData({...formData, proyectoId: "general"});
                                setIsDialogOpen(true);
                            }} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Registro General
                            </Button>
                        </div>
                        {renderTable(filteredData)}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="proyectos">
                {!selectedProyecto ? (
                    // Vista de lista de proyectos
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Crear Nuevo Proyecto
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Nuevo Proyecto</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Nombre del Proyecto</Label>
                                            <Input
                                                placeholder="Ej: Minga con la comunidad"
                                                value={projectData.nombre}
                                                onChange={(e) => setProjectData({ ...projectData, nombre: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Presupuesto Asignado ($)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={projectData.presupuesto}
                                                onChange={(e) => setProjectData({ ...projectData, presupuesto: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Descripción (Opcional)</Label>
                                            <Input
                                                placeholder="Detalles adicionales..."
                                                value={projectData.descripcion}
                                                onChange={(e) => setProjectData({ ...projectData, descripcion: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancelar</Button>
                                        <Button onClick={handleCreateProject} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                                            Guardar Proyecto
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {proyectos.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 border rounded-xl border-dashed">
                                <Briefcase className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-lg font-medium text-slate-900 mb-1">No hay proyectos</h3>
                                <p>Crea un proyecto para gestionar sus recursos de manera independiente.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {proyectos.map(p => {
                                    const porcentaje = p.presupuesto > 0 ? (p.gastos / p.presupuesto) * 100 : 0;
                                    return (
                                        <Card key={p.id} className="cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setSelectedProyecto(p)}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex justify-between items-start">
                                                    {p.nombre}
                                                    <Badge variant={p.saldo >= 0 ? "default" : "destructive"} className={p.saldo >= 0 ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""}>
                                                        {p.estado}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription>{p.descripcion || "Sin descripción"}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 mt-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Presupuesto</span>
                                                        <span className="font-medium">${p.presupuesto.toLocaleString("es-CO")}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Gastado</span>
                                                        <span className="font-medium text-rose-600">${p.gastos.toLocaleString("es-CO")}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${porcentaje > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                                                        <span>Saldo</span>
                                                        <span className={p.saldo < 0 ? "text-rose-600" : "text-emerald-600"}>
                                                            ${p.saldo.toLocaleString("es-CO")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    // Vista detallada de un proyecto
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedProyecto(null)}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <CardTitle>{selectedProyecto.nombre}</CardTitle>
                                    <CardDescription>Detalle de movimientos del proyecto</CardDescription>
                                </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProyecto(selectedProyecto.id)}>
                                Eliminar Proyecto
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <p className="text-sm text-slate-500">Presupuesto</p>
                                    <p className="text-xl font-bold">${selectedProyecto.presupuesto.toLocaleString("es-CO")}</p>
                                </div>
                                <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                                    <p className="text-sm text-rose-600">Total Gastos</p>
                                    <p className="text-xl font-bold text-rose-700">${selectedProyecto.gastos.toLocaleString("es-CO")}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                                    <p className="text-sm text-emerald-600">Saldo Disponible</p>
                                    <p className="text-xl font-bold text-emerald-700">${selectedProyecto.saldo.toLocaleString("es-CO")}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <h3>Movimientos</h3>
                                <Button onClick={() => {
                                    setFormData({...formData, proyectoId: selectedProyecto.id});
                                    setIsDialogOpen(true);
                                }} className="bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Registrar Gasto del Proyecto
                                </Button>
                            </div>

                            {renderTable(filteredData)}
                        </CardContent>
                    </Card>
                )}
            </TabsContent>

            {/* Modal para Registrar Transacción compartido */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Transacción</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Asignar a</Label>
                            <Select
                                value={formData.proyectoId}
                                onValueChange={(val) => setFormData({ ...formData, proyectoId: val })}
                                disabled={selectedProyecto !== null} // Si está en la vista de proyecto, no puede cambiarlo aquí
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">Gastos Generales</SelectItem>
                                    {proyectos.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Movimiento</Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={(val) => setFormData({ ...formData, tipo: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INGRESO">Ingreso (+)</SelectItem>
                                    <SelectItem value="EGRESO">Egreso (-)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Concepto</Label>
                            <Input
                                placeholder="Ej: Pago de papelería"
                                value={formData.concepto}
                                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Monto ($)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.monto}
                                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoría (Opcional)</Label>
                            <Input
                                placeholder="Ej: Suministros"
                                value={formData.categoria}
                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateTransaccion} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                            {isSubmitting ? "Guardando..." : "Guardar Registro"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}
