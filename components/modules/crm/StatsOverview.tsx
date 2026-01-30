import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Map } from "lucide-react";

interface StatsOverviewProps {
    stats: {
        totalCitizens: number;
        pendingPetitions: number;
        byVereda: any[];
    };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ciudadanos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCitizens}</div>
                    <p className="text-xs text-muted-foreground">
                        Registrados en el sistema
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Peticiones Pendientes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingPetitions}</div>
                    <p className="text-xs text-muted-foreground">
                        Requieren atención
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Vereda</CardTitle>
                    <Map className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.byVereda[0]?.vereda || "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.byVereda[0]?._count.id || 0} ciudadanos registrados
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
