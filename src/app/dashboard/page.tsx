
'use client';

import { Bot, Users, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

interface Assistant {
  id: string;
  name: string;
  status: 'Activo' | 'Inactivo' | 'Pausado';
  usage: {
    messagesUsed: number;
    messageLimit: number;
  };
}

interface Client {
    id: string;
    name: string;
}

export default function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const assistantsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'assistants');
  }, [user, firestore]);

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'clients');
  }, [user, firestore]);

  const { data: assistants, isLoading: isAssistantsLoading } = useCollection<Assistant>(assistantsQuery);
  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);

  const totalAssistants = assistants?.length || 0;
  const totalClients = clients?.length || 0;
  
  const { usedCredits, totalCredits } = useMemo(() => {
    if (!assistants) return { usedCredits: 0, totalCredits: 0 };
    
    const totalMessagesUsed = assistants.reduce((sum, assistant) => sum + (assistant.usage?.messagesUsed || 0), 0);
    const totalMessageLimit = assistants.reduce((sum, assistant) => sum + (assistant.usage?.messageLimit || 0), 0);
    
    // Assuming 1 credit = 1000 messages
    return {
      usedCredits: totalMessagesUsed / 1000,
      totalCredits: totalMessageLimit / 1000
    };
  }, [assistants]);


  const AssistantsCard = () => {
    if (isAssistantsLoading) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Asistentes Creados</CardTitle>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-full mt-4" />
          </CardContent>
        </Card>
      )
    }
    
    return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Asistentes Creados</CardTitle>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssistants}</div>
            <p className="text-xs text-muted-foreground">
              Crea todos los que necesites.
            </p>
            <Button asChild size="sm" className="mt-4 w-full">
              <Link href="/dashboard/asistentes">
                Gestionar Asistentes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
    )
  }

  const ClientsCard = () => {
    if (isClientsLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-9 w-full mt-4" />
                </CardContent>
            </Card>
        )
    }
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalClients}</div>
                <p className="text-xs text-muted-foreground">
                    Clientes registrados por tus asistentes.
                </p>
                <Button asChild size="sm" variant="secondary" className="mt-4 w-full">
                    <Link href="/dashboard/clients">
                        Ver Clientes <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
  }

  const CreditsCard = () => {
    if (isAssistantsLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Créditos Usados</CardTitle>
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-9 w-full mt-4" />
                </CardContent>
            </Card>
        )
    }
    return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Créditos Usados</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usedCredits.toFixed(1)}K / {totalCredits.toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              Tu ciclo se renueva pronto.
            </p>
             <Button asChild size="sm" variant="secondary" className="mt-4 w-full">
               <Link href="/dashboard/credits">
                Comprar Créditos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
    )
  }


  return (
    <>
      <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Un resumen de la actividad de tu cuenta.</p>
      </div>

      <div className="grid gap-4 md:gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
        <AssistantsCard />
        <ClientsCard />
        <CreditsCard />
      </div>

       <div className="pt-4">
            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-6">
                    <div className="mb-4 sm:mb-0 sm:mr-6 text-center sm:text-left">
                        <h3 className="text-lg font-semibold">Comienza a Crear</h3>
                        <p className="text-sm text-muted-foreground">
                            Crea un asistente para automatizar tus conversaciones.
                        </p>
                    </div>
                    <Button asChild className="btn-shiny animated-gradient text-white font-bold w-full sm:w-auto shrink-0">
                        <Link href="/dashboard/asistentes/crear">
                            <span className="btn-shiny-content">
                                Crear Asistente
                            </span>
                        </Link>
                    </Button>
                </div>
            </Card>
       </div>

    </>
  );
}
