"use client";

import { useState, useTransition } from "react";
import { processNotes } from "@/app/actions/magic-desktop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Wand2, Save, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export function MagicEditor() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<any>(null);

    async function handleSubmit(formData: FormData) {
        const notes = formData.get("notes") as string;
        if (!notes.trim()) {
            toast.error("Por favor escribe algunas notas primero.");
            return;
        }

        startTransition(async () => {
            const response = await processNotes(formData);
            if (response.error) {
                toast.error(response.error);
            } else {
                setResult(response);
                toast.success("¡Acta generada y guardada exitosamente!");
                // Here we could redirect: router.push(/agenda/${response.id})
            }
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
            {/* Input Area */}
            <Card className="flex flex-col h-full border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <Wand2 className="w-5 h-5 text-indigo-600" />
                        Lienzo de Notas
                    </CardTitle>
                    <CardDescription>
                        Escribe o pega tus apuntes rápidos aquí. Usa tu lápiz óptico.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative">
                    <form action={handleSubmit} className="h-full flex flex-col">
                        <Textarea
                            name="notes"
                            placeholder="Ej: Reunión con bomberos sobre incendios forestales. Acordamos comprar 50 mangueras nuevas. El comandante Pérez se encarga de la cotización para el viernes..."
                            className="flex-1 resize-none border-0 focus-visible:ring-0 p-6 text-lg leading-relaxed bg-white/50 dark:bg-slate-950/50 font-handwriting placeholder:text-slate-400"
                            style={{ fontFamily: '"Inter", sans-serif' }} // Placeholder for actual handwriting font if available
                        />
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-b-xl flex justify-end">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando con IA...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Convertir a Acta Formal
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Output Area */}
            <div className="h-full">
                {result ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full"
                    >
                        <Card className="h-full flex flex-col border-indigo-100 dark:border-indigo-900 bg-white dark:bg-slate-950 shadow-xl">
                            <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/50 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant="outline" className="mb-2 bg-indigo-100 text-indigo-700 border-indigo-200">
                                            Generado por Gemini Pro
                                        </Badge>
                                        <CardTitle className="text-xl text-indigo-950 dark:text-indigo-100">
                                            {result.titulo}
                                        </CardTitle>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => toast.info("Función de guardar en desarrollo")}>
                                        <Save className="h-5 w-5 text-slate-500" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <Tabs defaultValue="acta" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-6 pt-4">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="acta">Acta Formal</TabsTrigger>
                                        <TabsTrigger value="compromisos">Compromisos</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="acta" className="flex-1 p-0 m-0 overflow-hidden">
                                    <ScrollArea className="h-full p-6">
                                        <div className="prose prose-slate dark:prose-invert max-w-none">
                                            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-7">
                                                {result.acta}
                                            </p>
                                        </div>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="compromisos" className="flex-1 p-0 m-0 overflow-hidden">
                                    <ScrollArea className="h-full p-6">
                                        <ul className="space-y-4">
                                            {result.compromisos?.map((comp: string, i: number) => (
                                                <li key={i} className="flex gap-3 items-start p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{comp}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </motion.div>
                ) : (
                    <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-center">
                        <div className="max-w-xs text-slate-400">
                            <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Esperando tus notas...</p>
                            <p className="text-sm mt-2">La magia sucederá aquí cuando presiones el botón de convertir.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
