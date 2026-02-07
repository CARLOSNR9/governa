"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, MoreHorizontal, Loader2, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { updateCitizen, deleteCitizen } from "@/app/actions/crm";

const VEREDAS = [
    "Casco Urbano",
    "Balsal",
    "Bella Florida",
    "Bellavista",
    "El Guaitara",
    "Higueronal",
    "La Arboleda",
    "La Ensillada",
    "La Mina",
    "La Palma",
    "La Tola",
    "Laguna del Pueblo",
    "Las Dosquebradas",
    "Llanogrande Alto",
    "Llanogrande Bajo",
    "Nachao",
    "Poroto",
    "Pozuelos",
    "San Antonio",
    "San Francisco",
    "Tabiles",
    "Tambillo de Acostas",
    "Tambillo de Bravos",
    "Vendeahuja"
];

interface CitizenListProps {
    citizens: any[];
}

export function CitizenList({ citizens }: CitizenListProps) {
    const [selectedCitizen, setSelectedCitizen] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    async function handleUpdate(formData: FormData) {
        setIsPending(true);
        const result = await updateCitizen(formData);

        if (result.success) {
            toast.success(result.message);
            setIsEditOpen(false);
        } else {
            toast.error(result.error);
        }
        setIsPending(false);
    }

    async function handleDelete() {
        if (!selectedCitizen) return;
        setIsPending(true);
        const result = await deleteCitizen(selectedCitizen.id);

        if (result.success) {
            toast.success(result.message);
            setIsDeleteOpen(false);
        } else {
            toast.error(result.error);
        }
        setIsPending(false);
    }

    const openEdit = (citizen: any) => {
        setSelectedCitizen(citizen);
        setIsEditOpen(true);
    };

    const openDelete = (citizen: any) => {
        setSelectedCitizen(citizen);
        setIsDeleteOpen(true);
    };

    return (
        <div className="rounded-md border border-slate-200 dark:border-slate-800">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Ciudadano</TableHead>
                        <TableHead>Vereda</TableHead>
                        <TableHead>Última Petición</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Registro</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {citizens.map((citizen) => {
                        const lastPetition = citizen.peticiones[0];
                        return (
                            <TableRow key={citizen.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 bg-indigo-100 text-indigo-700">
                                            <AvatarFallback>
                                                {citizen.nombres.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span>{citizen.nombres}</span>
                                            <span className="text-xs text-slate-500">{citizen.cedula}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{citizen.vereda}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={lastPetition?.asunto}>
                                    {lastPetition?.asunto || "Sin peticiones"}
                                </TableCell>
                                <TableCell>
                                    {lastPetition ? (
                                        <Badge variant={
                                            lastPetition.estado === "CUMPLIDO" ? "default" :
                                                lastPetition.estado === "EN_GESTION" ? "secondary" : "outline"
                                        }>
                                            {lastPetition.estado}
                                        </Badge>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-slate-500">
                                    {formatDistanceToNow(new Date(citizen.updatedAt), { addSuffix: true, locale: es })}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(citizen)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openDelete(citizen)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Ciudadano</DialogTitle>
                        <DialogDescription>
                            Modifica la información del ciudadano.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCitizen && (
                        <form action={handleUpdate} className="space-y-4 py-4">
                            <input type="hidden" name="id" value={selectedCitizen.id} />
                            <div className="space-y-2">
                                <Label htmlFor="edit-nombres">Nombre Completo</Label>
                                <Input id="edit-nombres" name="nombres" defaultValue={selectedCitizen.nombres} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-vereda">Vereda / Barrio</Label>
                                <Select name="vereda" defaultValue={selectedCitizen.vereda} required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VEREDAS.map(v => (
                                            <SelectItem key={v} value={v}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-telefono">Teléfono</Label>
                                <Input id="edit-telefono" name="telefono" defaultValue={selectedCitizen.telefono} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Guardar Cambios"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-red-600 gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Eliminar Ciudadano
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar a <strong>{selectedCitizen?.nombres}</strong>? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
