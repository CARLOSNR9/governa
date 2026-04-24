"use client";

import { useState, useMemo } from "react";
import { 
    Plus, 
    Search, 
    UserPlus, 
    MoreHorizontal, 
    Edit2, 
    Trash2, 
    Phone, 
    MapPin, 
    User,
    BookUser
} from "lucide-react";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "./ContactForm";
import { deleteContact } from "@/app/actions/directorio";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface DirectorioViewProps {
    initialContacts: any[];
}

export function DirectorioView({ initialContacts }: DirectorioViewProps) {
    const [contacts, setContacts] = useState(initialContacts);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);

    const filteredContacts = useMemo(() => {
        return contacts.filter((contact) =>
            contact.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (contact.cedula && contact.cedula.includes(searchQuery)) ||
            (contact.celular && contact.celular.includes(searchQuery))
        );
    }, [contacts, searchQuery]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este contacto?")) return;
        
        try {
            const result = await deleteContact(id);
            if (result.success) {
                toast.success(result.message);
                setContacts(contacts.filter(c => c.id !== id));
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al eliminar el contacto.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre, cédula o celular..."
                        className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                            <UserPlus className="h-4 w-4" />
                            Nuevo Contacto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Agregar Nuevo Contacto</DialogTitle>
                            <DialogDescription>
                                Completa la información para agregar un contacto a tu directorio personal.
                            </DialogDescription>
                        </DialogHeader>
                        <ContactForm 
                            onSuccess={() => {
                                setIsAddDialogOpen(false);
                                // Refresh logic would go here, for now relying on revalidatePath
                                window.location.reload(); 
                            }} 
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                            <TableRow>
                                <TableHead className="w-[300px] font-semibold text-slate-900 dark:text-slate-100">Nombre</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Identificación</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Contacto</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Dirección</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredContacts.length > 0 ? (
                                    filteredContacts.map((contact) => (
                                        <motion.tr
                                            key={contact.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                        >
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{contact.nombre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-400">
                                                {contact.cedula || <span className="text-slate-400 italic text-xs">Sin cédula</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Phone className="h-3 w-3" />
                                                    {contact.celular || "N/A"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                                                    <MapPin className="h-3 w-3" />
                                                    {contact.direccion || "N/A"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem 
                                                            className="gap-2 cursor-pointer"
                                                            onClick={() => setEditingContact(contact)}
                                                        >
                                                            <Edit2 className="h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                                            onClick={() => handleDelete(contact.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <BookUser className="h-12 w-12 mb-4 opacity-20" />
                                                <p>No se encontraron contactos</p>
                                                <p className="text-sm opacity-60">Intenta con otra búsqueda o agrega uno nuevo</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Contacto</DialogTitle>
                        <DialogDescription>
                            Modifica la información del contacto seleccionado.
                        </DialogDescription>
                    </DialogHeader>
                    {editingContact && (
                        <ContactForm 
                            contact={editingContact} 
                            onSuccess={() => {
                                setEditingContact(null);
                                window.location.reload();
                            }} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
