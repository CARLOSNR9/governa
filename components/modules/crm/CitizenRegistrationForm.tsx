"use client";

import { useRef, useState } from "react";
import { createCitizenWithPetition } from "@/app/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, UserPlus, MapPin } from "lucide-react";

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

export function CitizenRegistrationForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        const response = await createCitizenWithPetition(formData);
        setIsPending(false);

        if (response.error) {
            toast.error(response.error);
        } else {
            toast.success(response.message);
            formRef.current?.reset();
        }
    }

    return (
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
            <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 pb-4">
                <CardTitle className="text-xl flex items-center gap-2 text-indigo-950 dark:text-indigo-100">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    Registro Rápido
                </CardTitle>
                <CardDescription>
                    Registra una nueva visita o solicitud ciudadana.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form ref={formRef} action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cedula">Cédula</Label>
                            <Input id="cedula" name="cedula" placeholder="1.234.567" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input id="telefono" name="telefono" placeholder="300 123 4567" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombres">Nombre Completo</Label>
                        <Input id="nombres" name="nombres" placeholder="Juan Pérez" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vereda">Vereda / Barrio</Label>
                        <Select name="vereda" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione ubicación" />
                            </SelectTrigger>
                            <SelectContent>
                                {VEREDAS.map(v => (
                                    <SelectItem key={v} value={v}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="asunto">Asunto / Solicitud</Label>
                        <Input id="asunto" name="asunto" placeholder="Ej: Mantenimiento de vía..." required />
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                        {isPending ? <Loader2 className="animate-spin mr-2" /> : "Registrar Visita"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
