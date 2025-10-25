
'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, PhoneCall, PhoneOutgoing, MessageSquare, UserCheck, CreditCard, Receipt, Sheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const allAssistants = [
    { id: "asst_1", name: "Asistente de Ventas", status: "Activo", messagesUsed: 250, lastUpdate: "Hace 2 horas", waId: "123456789", verified: true, skills: ["send-messages", "payment-auth", "billing"] },
    { id: "asst_2", name: "Soporte Técnico Nivel 1", status: "Inactivo", messagesUsed: 520, lastUpdate: "Ayer", waId: "987654321", verified: false, skills: ["receive-calls", "recognize-owner"] },
    { id: "asst_3", name: "Recordatorios de Citas", status: "Activo", messagesUsed: 890, lastUpdate: "Hace 5 minutos", waId: "112233445", verified: true, skills: ["send-messages"] },
    { id: "asst_4", name: "Bot de Bienvenida", status: "Activo", messagesUsed: 150, lastUpdate: "Hace 3 días", waId: "223344556", verified: false, skills: ["send-messages", "recognize-owner"] },
    { id: "asst_5", name: "Encuestas de Satisfacción", status: "Pausado", messagesUsed: 300, lastUpdate: "La semana pasada", waId: "334455667", verified: false, skills: ["send-messages"] },
    { id: "asst_6", name: "Gestor de Pedidos", status: "Activo", messagesUsed: 750, lastUpdate: "Hoy", waId: "445566778", verified: true, skills: ["payment-auth", "google-sheet"] },
];

const skillOptions = [
    { id: "receive-calls", label: "Recibir llamadas", icon: PhoneCall },
    { id: "make-calls", label: "Hacer llamadas", icon: PhoneOutgoing },
    { id: "send-messages", label: "Enviar mensajes a clientes", icon: MessageSquare },
    { id: "recognize-owner", label: "Reconocer al dueño", icon: UserCheck },
    { id: "payment-auth", label: "Autorizaciones de pagos", icon: CreditCard },
    { id: "billing", label: "Cobranza", icon: Receipt },
    { id: "google-sheet", label: "Inventario de Google Sheet", icon: Sheet },
];

export default function AssistantSkillsPage() {
    const params = useParams();
    const assistantId = params.id;
    const assistant = allAssistants.find(a => a.id === assistantId);

    if (!assistant) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Asistente no encontrado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>No se pudo encontrar un asistente con el ID proporcionado.</p>
                        <Button asChild className="mt-4">
                            <Link href="/dashboard/asistentes">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver a Asistentes
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const enabledSkills = skillOptions.filter(skill => assistant.skills.includes(skill.id));

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
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Habilidades de: {assistant.name}</h1>
                    <p className="text-muted-foreground text-sm">Estas son las habilidades activas para este asistente.</p>
                </div>
            </header>
            
            <Card>
                <CardHeader>
                    <CardTitle>Habilidades Activas</CardTitle>
                    <CardDescription>
                        Este bot tiene {enabledSkills.length} {enabledSkills.length === 1 ? 'habilidad' : 'habilidades'} activas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {enabledSkills.length > 0 ? (
                        <div className="space-y-3">
                            {enabledSkills.map(skill => (
                                <div key={skill.id} className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg">
                                    <skill.icon className="h-6 w-6 text-primary" />
                                    <p className="font-medium">{skill.label}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Este asistente no tiene habilidades activas.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
