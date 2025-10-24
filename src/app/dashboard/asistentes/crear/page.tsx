
'use client'

import { useState } from "react";
import { ArrowLeft, Check, Fingerprint, Milestone, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const steps = [
    { name: "Nombre del Asistente", icon: Wand2 },
    { name: "Personalidad", icon: Fingerprint },
    { name: "Conocimiento", icon: Milestone },
];

const namingCriteria = {
    approved: [
        "Coincide con el nombre legal o de marca.",
        "Se muestra igual en tu sitio web o redes.",
        "Está relacionado con la cuenta que usará el número (coherencia comercial)."
    ],
    rejected: [
        "Usa palabras restringidas: “WhatsApp”, “Meta”, “Facebook”, “Oficial”, “Verified”, etc.",
        "Es genérico o engañoso (por ejemplo: “Servicios”, “Tienda”, “Soporte”).",
        "Tiene símbolos, emojis o mayúsculas inapropiadas.",
    ]
};

export default function CreateAssistantPage() {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/asistentes">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Volver a asistentes</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Crear Nuevo Asistente</h1>
                    <p className="text-muted-foreground text-sm">Sigue los pasos para configurar tu nuevo bot.</p>
                </div>
            </header>
            
            <div className="grid md:grid-cols-4 gap-8 flex-1">
                <aside className="hidden md:flex flex-col gap-2">
                    <nav className="flex flex-col gap-1">
                        {steps.map((step, index) => (
                            <Button
                                key={step.name}
                                variant={currentStep === index ? "secondary" : "ghost"}
                                className="justify-start gap-3"
                                onClick={() => setCurrentStep(index)}
                                disabled={index > 0} // For now, only step 1 is active
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep > index ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {currentStep > index ? <Check className="h-4 w-4"/> : index + 1}
                                </div>
                                <step.icon className="h-4 w-4" />
                                <span>{step.name}</span>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <main className="md:col-span-3">
                    {currentStep === 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Paso 1: Define el nombre de tu asistente</CardTitle>
                                <CardDescription>Este será el nombre público de tu bot en WhatsApp. Asegúrate de seguir las políticas de Meta.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="assistant-name">Nombre del Asistente (Display Name)</Label>
                                    <Input id="assistant-name" placeholder="Ej: Soporte Hey Manito" />
                                </div>

                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger>🔒 Protocolo de Meta para nombres en WhatsApp Business</AccordionTrigger>
                                        <AccordionContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground">
                                                Meta revisa que el nombre visible (Display Name) cumpla con sus políticas de marca y autenticidad. El nombre debe representar claramente a tu empresa o producto.
                                            </p>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Check className="h-5 w-5 text-green-500"/>Criterios de Aprobación</h4>
                                                    <ul className="space-y-2 text-sm list-disc pl-5 text-muted-foreground">
                                                        {namingCriteria.approved.map(item => <li key={item}>{item}</li>)}
                                                    </ul>
                                                </div>
                                                <div>
                                                     <h4 className="font-semibold mb-2 flex items-center gap-2"><X className="h-5 w-5 text-red-500"/>Causas de Rechazo</h4>
                                                    <ul className="space-y-2 text-sm list-disc pl-5 text-muted-foreground">
                                                        {namingCriteria.rejected.map(item => <li key={item}>{item}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
                                                <strong>Revisión y Decisión:</strong> Meta analiza la solicitud. Si el nombre no cumple, será rechazado y podrás volver a aplicar corrigiendo los puntos observados. Meta puede volver a revisar el nombre si detecta inconsistencias.
                                            </p>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                <div className="flex justify-end">
                                     <Button size="lg" className="btn-shiny animated-gradient text-white font-bold">
                                        <span className="btn-shiny-content flex items-center">
                                            Siguiente Paso
                                            <Sparkles className="ml-2 h-4 w-4" />
                                        </span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* Placeholder for other steps */}
                </main>
            </div>
        </div>
    );
}
