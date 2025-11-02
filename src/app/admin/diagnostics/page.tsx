
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Server, Smartphone, CheckCircle2, AlertTriangle, XCircle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Status = 'online' | 'degraded' | 'offline' | 'loading';

const statusConfig: Record<Status, { text: string; color: string; icon: React.ElementType }> = {
    loading: { text: 'Verificando...', color: 'text-yellow-500', icon: Loader },
    online: { text: 'Operativo', color: 'text-green-500', icon: CheckCircle2 },
    degraded: { text: 'Degradado', color: 'text-yellow-500', icon: AlertTriangle },
    offline: { text: 'Fuera de Línea', color: 'text-red-500', icon: XCircle },
};

const StatusCard = ({ title, status, description, icon: Icon }: { title: string; status: Status; description: string, icon: React.ElementType }) => {
    const config = statusConfig[status];
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>Estado actual del servicio.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3">
                    <config.icon className={cn("h-6 w-6", config.color, status === 'loading' && 'animate-spin')} />
                    <span className={cn("text-lg font-semibold", config.color)}>{config.text}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{description}</p>
            </CardContent>
        </Card>
    )
}

export default function DiagnosticsPage() {
    const [frontendStatus, setFrontendStatus] = useState<Status>('loading');
    const [gatewayStatus, setGatewayStatus] = useState<Status>('loading');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/status');
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();

                setFrontendStatus(data.frontend === 'online' ? 'online' : 'offline');

                switch (data.gateway) {
                    case 'connected': setGatewayStatus('online'); break;
                    case 'qr': setGatewayStatus('degraded'); break;
                    case 'disconnected':
                    case 'error': setGatewayStatus('offline'); break;
                    default: setGatewayStatus('loading');
                }
            } catch (error) {
                console.error("Failed to fetch system status:", error);
                setFrontendStatus('offline');
                setGatewayStatus('offline');
            } finally {
                setLastUpdated(new Date().toLocaleString());
            }
        };

        fetchStatus();
        const intervalId = setInterval(fetchStatus, 15000); // Poll every 15 seconds

        return () => clearInterval(intervalId);
    }, []);
    
    const getGatewayDescription = () => {
        switch (gatewayStatus) {
            case 'online': return "El gateway de WhatsApp está conectado y operativo. Los mensajes se procesarán normalmente.";
            case 'degraded': return "El gateway está en funcionamiento pero necesita atención. Se requiere escanear un código QR para (re)conectar una sesión de WhatsApp.";
            case 'offline': return "El gateway de WhatsApp no está conectado o ha encontrado un error. Los mensajes no se pueden enviar ni recibir. Revisa los logs del servicio.";
            case 'loading': return "Verificando el estado del gateway de WhatsApp...";
            default: return "Estado desconocido.";
        }
    }

    const getFrontendDescription = () => {
        switch (frontendStatus) {
            case 'online': return "La aplicación principal (Next.js) está funcionando correctamente y respondiendo a las solicitudes.";
            case 'offline': return "La aplicación no puede comunicarse con su propio servidor. Esto puede indicar un problema de despliegue o de red.";
            case 'loading': return "Verificando el estado de la aplicación web...";
            default: return "Estado desconocido.";
        }
    }

    if (frontendStatus === 'loading' && gatewayStatus === 'loading') {
        return (
             <div className="flex flex-col gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
                    <Activity className="h-8 w-8 text-primary" />
                    Diagnóstico del Sistema
                </h1>
                <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <header>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
                    <Activity className="h-8 w-8 text-primary" />
                    Diagnóstico del Sistema
                </h1>
                <p className="text-muted-foreground text-sm">
                    Un resumen detallado del estado de los servicios principales.
                    {lastUpdated && ` (Última actualización: ${lastUpdated})`}
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-6 pt-4">
                <StatusCard 
                    title="Frontend (App)" 
                    status={frontendStatus} 
                    description={getFrontendDescription()}
                    icon={Server}
                />
                <StatusCard 
                    title="Gateway (Baileys)" 
                    status={gatewayStatus}
                    description={getGatewayDescription()}
                    icon={Smartphone}
                />
            </div>
        </div>
    );
}

