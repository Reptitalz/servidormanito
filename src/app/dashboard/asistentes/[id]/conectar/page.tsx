
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const GATEWAY_URL = 'https://servidormanito-722319793837.europe-west1.run.app';
const GATEWAY_SECRET = process.env.NEXT_PUBLIC_GATEWAY_SECRET;

type GatewayStatus = 'loading' | 'qr' | 'connected' | 'disconnected' | 'error' | 'not_found';

interface GatewayStatusResponse {
    status: GatewayStatus;
    qr?: string;
}

export default function ConectarPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();
    const params = useParams();
    const assistantId = params.id as string;
    
    const { user } = useUser();
    const firestore = useFirestore();

    const assistantRef = useMemoFirebase(() => {
        if (!user || !assistantId) return null;
        return doc(firestore, 'users', user.uid, 'assistants', assistantId);
    }, [user, assistantId, firestore]);

    const { data: assistant, isLoading: isAssistantLoading } = useDoc(assistantRef);
    const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>('loading');
    const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("Inicializando conexión...");
    
    useEffect(() => {
        if (!assistantId) return;

        if (!GATEWAY_SECRET) {
            console.error("Gateway secret is not configured in the frontend.");
            setGatewayStatus('error');
            setLoadingMessage("Error de configuración. Contacta a soporte.");
            return;
        }

        const pollStatus = async () => {
            try {
                const headers = new Headers({ 'X-Gateway-Secret': GATEWAY_SECRET });
                const statusRes = await fetch(`${GATEWAY_URL}/status?assistantId=${assistantId}`, { headers, cache: 'no-store' });
                
                if (!statusRes.ok) {
                    if (statusRes.status === 403) throw new Error('Acceso denegado al gateway.');
                    throw new Error(`Error del gateway: ${statusRes.statusText}`);
                }
                
                const { status, qr } = await statusRes.json() as GatewayStatusResponse;
                
                setGatewayStatus(status);

                if (status === 'qr' && qr) {
                    setLoadingMessage("¡Escanea el código para conectar!");
                    setQrCodeValue(qr);
                } else if (status === 'connected') {
                    setLoadingMessage("¡Conectado! Redirigiendo al dashboard...");
                    setTimeout(() => router.push('/dashboard/asistentes'), 2000);
                } else if (status === 'not_found' || status === 'loading' || status === 'disconnected') {
                    setLoadingMessage("Creando sesión y esperando el código QR de WhatsApp...");
                }

            } catch (error: any) {
                console.error("Error polling gateway status:", error);
                setGatewayStatus('error');
                setLoadingMessage(error.message || "Error de conexión con el gateway.");
            }
        };

        const intervalId = setInterval(pollStatus, 3000);
        pollStatus(); // Run once immediately

        return () => clearInterval(intervalId);

    }, [assistantId, router]);

    useEffect(() => {
        if (qrCodeValue && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, qrCodeValue, { width: 256, errorCorrectionLevel: 'H' }, (error) => {
                if (error) console.error("Error generating QR code canvas:", error);
            });
        }
    }, [qrCodeValue]);


    const getTitle = () => {
        if (isAssistantLoading) return <Skeleton className="h-6 w-48" />;
        if (assistant) return `Conectar: ${assistant.name}`;
        return "Conectar Asistente";
    }

    const renderStatusContent = () => {
        // Prioritize showing the QR code if we have it
        if (gatewayStatus === 'qr' && qrCodeValue) {
             return (
                <div className="flex flex-col items-center gap-4">
                    <canvas ref={canvasRef} className="rounded-lg bg-white p-2" />
                    <p className="text-sm text-muted-foreground text-center max-w-xs pt-4 font-semibold">
                        {loadingMessage}
                    </p>
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                        Abre WhatsApp en tu teléfono, ve a `Configuración` {'>'} `Dispositivos vinculados` y escanea el código.
                    </p>
                </div>
            );
        }

        // Otherwise, show the current status indicator
        switch (gatewayStatus) {
            case 'connected':
                 return (
                    <div className="flex flex-col items-center gap-4 text-green-600">
                        <Wifi className="h-24 w-24 animate-pulse" />
                        <p className="font-semibold text-lg">{loadingMessage}</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center gap-4 text-destructive text-center">
                        <WifiOff className="h-24 w-24" />
                        <p className="font-semibold text-lg">{loadingMessage}</p>
                        <p className="text-xs max-w-xs">No se pudo comunicar con el servidor del gateway. Puede estar reiniciándose o tener un problema. Inténtalo de nuevo en unos minutos.</p>
                    </div>
                );
            case 'loading':
            case 'disconnected':
            case 'not_found':
            default:
                return (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground w-64 text-center">
                         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                        <p className="text-sm font-semibold">{loadingMessage}</p>
                        <Progress value={50} className="w-full h-2 animate-pulse" />
                        <p className="text-xs pt-2">Esto puede tardar hasta 30 segundos mientras se establece la conexión con WhatsApp.</p>
                    </div>
                );
        }
    }


    return (
        <div className="flex items-center justify-center w-full min-h-screen">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex items-center gap-4">
                         <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboard/asistentes">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <CardTitle>{getTitle()}</CardTitle>
                             <CardDescription>
                                Gestiona la conexión de tu asistente con WhatsApp.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 gap-4 min-h-[350px]">
                    {renderStatusContent()}
                </CardContent>
            </Card>
        </div>
    );
}
