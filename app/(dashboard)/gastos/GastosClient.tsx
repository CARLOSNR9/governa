"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle, Briefcase, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Edit } from "lucide-react";
import { toast } from "sonner";
import { createTransaccion, deleteTransaccion } from "@/app/actions/gastos";
import { createProyecto, deleteProyecto, updateProyecto } from "@/app/actions/proyectos";

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

export default function GastosClient({ 
    initialData, 
    proyectos,
    globalSummary
}: { 
    initialData: any[], 
    proyectos: any[],
    globalSummary: { totalIngresos: number, totalEgresos: number, saldo: number }
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Vista de proyectos
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const selectedProyecto = proyectos.find(p => p.id === selectedProjectId) || null;
    
    const [projectToEdit, setProjectToEdit] = useState<any | null>(null);

    const [formData, setFormData] = useState({
        concepto: "",
        monto: "",
        tipo: "EGRESO",
        categoria: "",
        proyectoId: "general", // "general" o id del proyecto
        fecha: format(new Date(), "yyyy-MM-dd"), // Fecha por defecto: hoy
    });

    const [projectData, setProjectData] = useState({
        nombre: "",
        presupuesto: "0",
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
            fecha: new Date(formData.fecha + "T12:00:00"), // Parseamos la fecha evitando problemas de zona horaria
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Transacción registrada correctamente");
            setIsDialogOpen(false);
            setFormData({ concepto: "", monto: "", tipo: "EGRESO", categoria: "", proyectoId: "general", fecha: format(new Date(), "yyyy-MM-dd") });
        } else {
            toast.error(res.error || "Error al registrar la transacción");
        }
    };

    const handleCreateProject = async () => {
        if (!projectData.nombre) {
            toast.error("El nombre del proyecto es obligatorio");
            return;
        }

        const pres = projectData.presupuesto === "" ? 0 : parseFloat(projectData.presupuesto);

        setIsSubmitting(true);
        const res = await createProyecto({
            nombre: projectData.nombre,
            descripcion: projectData.descripcion,
            presupuesto: pres,
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Proyecto creado correctamente");
            setIsProjectDialogOpen(false);
            setProjectData({ nombre: "", presupuesto: "0", descripcion: "" });
        } else {
            toast.error(res.error || "Error al crear proyecto");
        }
    };

    const handleUpdateProject = async () => {
        if (!projectToEdit?.nombre) {
            toast.error("El nombre del proyecto es obligatorio");
            return;
        }

        const pres = projectToEdit.presupuesto === "" || projectToEdit.presupuesto === undefined ? 0 : parseFloat(projectToEdit.presupuesto);

        setIsSubmitting(true);
        const res = await updateProyecto(projectToEdit.id, {
            nombre: projectToEdit.nombre,
            descripcion: projectToEdit.descripcion,
            presupuesto: pres,
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Proyecto actualizado correctamente");
            setIsEditProjectDialogOpen(false);
            setProjectToEdit(null);
        } else {
            toast.error(res.error || "Error al actualizar proyecto");
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
            setSelectedProjectId(null);
        } else {
            toast.error(res.error || "Error al eliminar proyecto");
        }
    };

    // Componente de tabla reutilizable y responsivo
    const renderTable = (data: any[]) => (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border border-slate-200 dark:border-slate-800 mt-6">
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

            {/* Mobile Cards for Transactions */}
            <div className="md:hidden space-y-3 mt-4">
                {data.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border rounded-lg border-dashed">
                        No hay registros que mostrar.
                    </div>
                ) : (
                    data.map((t) => (
                        <div key={t.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{t.concepto}</p>
                                    <p className="text-xs text-slate-500 mt-1">{format(new Date(t.fecha), "dd MMM yyyy", { locale: es })}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${t.tipo === "INGRESO" ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"}`}>
                                        {t.tipo === "INGRESO" ? "+" : "-"}${t.monto.toLocaleString("es-CO")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex gap-2 flex-wrap">
                                    {t.tipo === "INGRESO" ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none flex w-fit items-center gap-1 text-[10px] px-2 py-0 h-5">
                                            <ArrowUpCircle className="h-3 w-3" /> Ingreso
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none flex w-fit items-center gap-1 text-[10px] px-2 py-0 h-5">
                                            <ArrowDownCircle className="h-3 w-3" /> Egreso
                                        </Badge>
                                    )}
                                    {t.categoria && (
                                        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 text-slate-500 bg-slate-50 border-slate-200">
                                            {t.categoria}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTransaccion(t.id)}
                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    // Determinar qué resumen mostrar arriba
    const activeSummary = selectedProyecto 
        ? {
            totalIngresos: selectedProyecto.ingresos || 0,
            totalEgresos: selectedProyecto.gastos || 0,
            saldo: selectedProyecto.saldo || 0,
            tituloSaldo: "Saldo del Proyecto",
            presupuesto: selectedProyecto.presupuesto
        }
        : {
            totalIngresos: globalSummary.totalIngresos,
            totalEgresos: globalSummary.totalEgresos,
            saldo: globalSummary.saldo,
            tituloSaldo: "Saldo General",
            presupuesto: null
        };

    return (
        <div className="space-y-6">
            {/* Dynamic Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            ${activeSummary.totalIngresos.toLocaleString("es-CO")}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Egresos Totales</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            ${activeSummary.totalEgresos.toLocaleString("es-CO")}
                        </p>
                    </div>
                </div>

                <div className="bg-indigo-600 dark:bg-indigo-900 p-6 rounded-xl border border-indigo-700 dark:border-indigo-800 shadow-sm flex items-center gap-4 text-white">
                    <div className="p-3 bg-indigo-500 dark:bg-indigo-800 rounded-lg">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-indigo-100">{activeSummary.tituloSaldo}</p>
                        <p className="text-2xl font-bold flex items-end gap-2">
                            ${activeSummary.saldo.toLocaleString("es-CO")}
                            {activeSummary.presupuesto !== null && activeSummary.presupuesto > 0 && (
                                <span className="text-xs font-normal text-indigo-200 mb-1">
                                    (Ppto: ${activeSummary.presupuesto.toLocaleString("es-CO")})
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="generales" className="w-full" onValueChange={() => setSelectedProjectId(null)}>
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
                                        <Card key={p.id} className="cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setSelectedProjectId(p.id)}>
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
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b gap-2">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedProjectId(null)}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="overflow-hidden">
                                    <CardTitle className="text-lg sm:text-xl leading-tight truncate">{selectedProyecto.nombre}</CardTitle>
                                    <CardDescription className="hidden sm:block mt-1">Detalle de movimientos</CardDescription>
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => {
                                    setProjectToEdit({ ...selectedProyecto });
                                    setIsEditProjectDialogOpen(true);
                                }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteProyecto(selectedProyecto.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 mt-2">
                                <h3 className="font-medium text-lg">Movimientos</h3>
                                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                                    setFormData({...formData, proyectoId: selectedProyecto.id});
                                    setIsDialogOpen(true);
                                }}>
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
                            <Label>Fecha</Label>
                            <Input
                                type="date"
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            />
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

            {/* Modal para Editar Proyecto */}
            <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Proyecto</DialogTitle>
                    </DialogHeader>
                    {projectToEdit && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre del Proyecto</Label>
                                <Input
                                    placeholder="Ej: Minga con la comunidad"
                                    value={projectToEdit.nombre}
                                    onChange={(e) => setProjectToEdit({ ...projectToEdit, nombre: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Presupuesto Asignado ($)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={projectToEdit.presupuesto}
                                    onChange={(e) => setProjectToEdit({ ...projectToEdit, presupuesto: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción (Opcional)</Label>
                                <Input
                                    placeholder="Detalles adicionales..."
                                    value={projectToEdit.descripcion || ""}
                                    onChange={(e) => setProjectToEdit({ ...projectToEdit, descripcion: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditProjectDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdateProject} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                            Actualizar Proyecto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
        </div>
    );
}
