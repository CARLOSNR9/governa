import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CitizenListProps {
    citizens: any[];
}

export function CitizenList({ citizens }: CitizenListProps) {
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
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
