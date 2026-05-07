"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { createTransaccion, deleteTransaccion } from "@/app/actions/gastos";

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
import { Card, CardContent } from "@/components/ui/card";

export default function GastosClient({ initialData }: { initialData: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        concepto: "",
        monto: "",
        tipo: "EGRESO",
        categoria: "",
    });

    const filteredData = initialData.filter(
        (t) =>
            t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.categoria && t.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCreate = async () => {
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
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Transacción registrada correctamente");
            setIsDialogOpen(false);
            setFormData({ concepto: "", monto: "", tipo: "EGRESO", categoria: "" });
        } else {
            toast.error(res.error || "Error al registrar la transacción");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este registro?")) return;

        const res = await deleteTransaccion(id);
        if (res.success) {
            toast.success("Transacción eliminada");
        } else {
            toast.error(res.error || "Error al eliminar");
        }
    };

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por concepto o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Registro
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Registrar Transacción</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
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
                                        onChange={(e) =>
                                            setFormData({ ...formData, concepto: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Monto ($)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.monto}
                                        onChange={(e) =>
                                            setFormData({ ...formData, monto: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoría (Opcional)</Label>
                                    <Input
                                        placeholder="Ej: Suministros"
                                        value={formData.categoria}
                                        onChange={(e) =>
                                            setFormData({ ...formData, categoria: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {isSubmitting ? "Guardando..." : "Guardar Registro"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-md border border-slate-200 dark:border-slate-800">
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
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No hay registros que mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((t) => (
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
                                                onClick={() => handleDelete(t.id)}
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
            </CardContent>
        </Card>
    );
}
