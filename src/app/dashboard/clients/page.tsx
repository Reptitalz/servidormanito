import { Users, ShieldCheck, ShoppingCart, CreditCard, Image, FilePlus2, MoreHorizontal, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const managementSections = [
    { id: "clients", label: "Clientes", icon: Users },
    { id: "authorizations", label: "Autorizaciones", icon: ShieldCheck },
    { id: "sales", label: "Ventas", icon: ShoppingCart },
    { id: "payments", label: "Pagos", icon: CreditCard },
    { id: "images", label: "Imágenes", icon: Image },
];

export default function GestorPage() {
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
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Gestor de Recursos</h1>
                    <p className="text-sm text-muted-foreground">Administra clientes, ventas, pagos y más desde un solo lugar.</p>
                </div>
            </div>

            <Tabs defaultValue="clients" className="pt-4">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
                    {managementSections.map(section => (
                        <TabsTrigger key={section.id} value={section.id} className="flex-col sm:flex-row gap-2 h-auto py-2">
                            <section.icon className="h-5 w-5" />
                            <span>{section.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="clients">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Listado de Clientes</CardTitle>
                                    <CardDescription>
                                        Un listado de todos los clientes en tu base de datos.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button size="sm" className="h-8 gap-1 text-sm">
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="sr-only sm:not-sr-only">Añadir</span>
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 gap-1 text-sm">
                                                <FilePlus2 className="h-4 w-4" />
                                                <span className="sr-only sm:not-sr-only">Exportar</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Exportar a CSV</DropdownMenuItem>
                                            <DropdownMenuItem>Exportar a Excel</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
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
                
                {managementSections.filter(s => s.id !== 'clients').map(section => (
                    <TabsContent key={section.id} value={section.id}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{section.label}</CardTitle>
                                <CardDescription>Gestiona {section.label.toLowerCase()} desde aquí.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-60 flex items-center justify-center">
                                <p className="text-muted-foreground">Contenido de {section.label} próximamente.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </>
    );
}