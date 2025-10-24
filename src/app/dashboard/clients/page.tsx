import { FilePlus2, Filter, MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function ClientsPage() {
    const clients = [
        { id: "USR-001", name: "Juan Pérez", phone: "+52 1 55 1234 5678", email: "juan.perez@example.com", status: "Contactado", lastContact: "Hace 2 días", tags: ["Lead Caliente"] },
        { id: "USR-002", name: "María García", phone: "+52 1 81 8765 4321", email: "maria.garcia@example.com", status: "No Interesado", lastContact: "Hace 1 semana", tags: [] },
        { id: "USR-003", name: "Carlos Sánchez", phone: "+52 1 33 9876 5432", email: "carlos.sanchez@example.com", status: "Nuevo", lastContact: "N/A", tags: [] },
        { id: "USR-004", name: "Ana Martínez", phone: "+52 1 55 2345 6789", email: "ana.martinez@example.com", status: "Seguimiento", lastContact: "Hace 3 horas", tags: ["VIP", "Proyecto A"] },
        { id: "USR-005", name: "Luis Hernández", phone: "+52 1 81 3456 7890", email: "luis.hernandez@example.com", status: "Contactado", lastContact: "Ayer", tags: ["Lead Frío"] },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Contactado": return <Badge variant="secondary">Contactado</Badge>;
            case "No Interesado": return <Badge variant="destructive">No Interesado</Badge>;
            case "Nuevo": return <Badge>Nuevo</Badge>;
            case "Seguimiento": return <Badge className="bg-yellow-500 text-white">Seguimiento</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };


    return (
        <>
            <div className="flex flex-col items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Clientes</h1>
                    <p className="text-sm text-muted-foreground">Gestiona y organiza tu base de datos de clientes.</p>
                </div>
            </div>

            <Tabs defaultValue="all">
                <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all">Todos</TabsTrigger>
                        <TabsTrigger value="active">Activos</TabsTrigger>
                        <TabsTrigger value="archived" className="hidden sm:flex">
                            Archivados
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                                    <FilePlus2 className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only">Exportar</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Exportar a CSV</DropdownMenuItem>
                                <DropdownMenuItem>Exportar a Excel</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" className="h-7 gap-1 text-sm">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only">Añadir Cliente</span>
                        </Button>
                    </div>
                </div>
                <TabsContent value="all">
                    <Card>
                        <CardHeader>
                            <CardTitle>Listado de Clientes</CardTitle>
                            <CardDescription>
                                Un listado de todos los clientes en tu base de datos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead className="hidden sm:table-cell">Estado</TableHead>
                                        <TableHead className="hidden md:table-cell">Último Contacto</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell>
                                                <div className="font-medium">{client.name}</div>
                                                <div className="text-sm text-muted-foreground md:hidden">
                                                    {client.phone}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {getStatusBadge(client.status)}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{client.lastContact}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                                                        <DropdownMenuItem>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem>Enviar Mensaje</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            Eliminar Cliente
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}