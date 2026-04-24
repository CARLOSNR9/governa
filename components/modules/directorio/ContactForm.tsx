"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createContact, updateContact } from "@/app/actions/directorio";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    nombre: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    cedula: z.string().optional(),
    celular: z.string().optional(),
    direccion: z.string().optional(),
    notas: z.string().optional(),
});

interface ContactFormProps {
    contact?: any;
    onSuccess: () => void;
}

export function ContactForm({ contact, onSuccess }: ContactFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: contact?.nombre || "",
            cedula: contact?.cedula || "",
            celular: contact?.celular || "",
            direccion: contact?.direccion || "",
            notas: contact?.notas || "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (value) formData.append(key, value);
        });

        try {
            let result;
            if (contact?.id) {
                result = await updateContact(contact.id, formData);
            } else {
                result = await createContact(formData);
            }

            if (result.success) {
                toast.success(result.message);
                onSuccess();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre Completo *</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="cedula"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cédula</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. 12345678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="celular"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Celular</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. 310 123 4567" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="direccion"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dirección / Vereda</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Vereda Tambillo" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notas"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Información adicional..." 
                                    className="resize-none" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {contact ? "Actualizar Contacto" : "Guardar Contacto"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
