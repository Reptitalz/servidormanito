
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bot, MessageSquare, Mic, AudioLines, BrainCircuit, Check, X, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ProcessStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
type ProcessStep = {
    id: number;
    name: string;
    status: ProcessStatus;
    log: string;
    icon: React.ElementType;
};
type AssistantActivity = {
    assistantId: string;
    assistantName: string;
    userName: string;
    lastActivity: string;
    processes: ProcessStep[];
};

const initialAssistants: AssistantActivity[] = [
    { assistantId: "asst_1", assistantName: "Asistente de Ventas", userName: "Juan Pérez", lastActivity: "Ahora mismo", processes: [] },
    { assistantId: "asst_3", assistantName: "Recordatorios de Citas", userName: "Ana Martínez", lastActivity: "Hace 2 minutos", processes: [] },
    { assistantId: "asst_6", assistantName: "Gestor de Pedidos", userName: "Carlos Sánchez", lastActivity: "Hace 5 minutos", processes: [] },
];

const processTemplates: Omit<ProcessStep, 'id' | 'status' | 'log'>[] = [
    { name: "Mensaje de voz recibido", icon: Mic },
    { name: "Transcribiendo audio...", icon: AudioLines },
    { name: "Analizando texto...", icon: FileText },
    { name: "Generando respuesta IA...", icon: BrainCircuit },
    { name: "Enviando respuesta...", icon: MessageSquare },
];

// Component for the circular status indicator
const StatusIndicator = ({ status }: { status: ProcessStatus }) => {
    const baseClasses = "flex items-center justify-center h-8 w-8 rounded-full text-white";
    
    if (status === 'in_progress') {
        return (
            <div className={cn(baseClasses, "bg-blue-500")}>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    if (status === 'completed') {
        return <div className={cn(baseClasses, "bg-green-500")}><Check className="h-5 w-5" /></div>;
    }
    if (status === 'failed') {
        return <div className={cn(baseClasses, "bg-destructive")}><X className="h-5 w-5" /></div>;
    }
    return <div className={cn(baseClasses, "bg-gray-400")}></div>;
};

export default function MonitorPage() {
    const [activities, setActivities] = useState<AssistantActivity[]>(initialAssistants);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const interval = setInterval(() => {
            setActivities(prevActivities => {
                const randomAssistantIndex = Math.floor(Math.random() * prevActivities.length);
                
                return prevActivities.map((activity, index) => {
                    if (index === randomAssistantIndex) {
                        const newProcessId = activity.processes.length;

                        // If it's the start of a new chain or the last one completed
                        if (newProcessId === 0 || activity.processes[newProcessId - 1].status === 'completed' || activity.processes[newProcessId - 1].status === 'failed') {
                            const newProcess: ProcessStep = {
                                ...processTemplates[0],
                                id: newProcessId,
                                status: 'in_progress',
                                log: "Recibiendo paquete de audio..."
                            };
                            return { ...activity, lastActivity: "Ahora mismo", processes: [...activity.processes, newProcess] };
                        }
                        
                        // If there's a process in progress, advance it
                        const currentProcessIndex = activity.processes.findIndex(p => p.status === 'in_progress');
                        if (currentProcessIndex !== -1) {
                             const shouldFail = Math.random() < 0.05; // 5% chance to fail
                             const updatedProcesses = [...activity.processes];

                             // Complete current step
                             updatedProcesses[currentProcessIndex] = {
                                 ...updatedProcesses[currentProcessIndex],
                                 status: 'completed',
                                 log: updatedProcesses[currentProcessIndex].log + " -> ¡Completado!"
                             };

                             // Start next step if not the end
                             if (currentProcessIndex < processTemplates.length - 1) {
                                 const nextStepTemplate = processTemplates[currentProcessIndex + 1];
                                 updatedProcesses.push({
                                     ...nextStepTemplate,
                                     id: updatedProcesses.length,
                                     status: shouldFail ? 'failed' : 'in_progress',
                                     log: shouldFail ? 'Error: Fallo en la red' : `Iniciando ${nextStepTemplate.name.toLowerCase()}`
                                 });
                             }
                            
                             return { ...activity, processes: updatedProcesses };
                        }
                    }
                    // Update last activity time for others
                    if (activity.lastActivity === "Ahora mismo") return {...activity, lastActivity: "Hace 1 minuto" };
                    return activity;
                });
            });
        }, 2500); // Update every 2.5 seconds

        return () => clearInterval(interval);
    }, []);

    if (!isClient) return null;

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                        Monitor del Cerebro
                    </h1>
                    <p className="text-muted-foreground text-sm">Visualización en tiempo real de los procesos de la IA.</p>
                </div>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto">
                <AnimatePresence>
                    {activities.map((activity) => (
                        <motion.div key={activity.assistantId} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Bot className="h-5 w-5" /> {activity.assistantName}
                                            </CardTitle>
                                            <CardDescription>
                                                Propietario: {activity.userName} <Badge variant="secondary" className="ml-2">{activity.lastActivity}</Badge>
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="space-y-4">
                                        {activity.processes.length > 0 ? (
                                            <AnimatePresence>
                                                {activity.processes.map((process, index) => (
                                                    <motion.div
                                                        key={process.id}
                                                        layout
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg"
                                                    >
                                                        <StatusIndicator status={process.status} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <process.icon className="h-5 w-5 text-primary" />
                                                                <p className="font-semibold">{process.name}</p>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground font-mono">{process.log}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        ) : (
                                            <div className="text-center text-muted-foreground py-8">
                                                <p>Esperando actividad...</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
