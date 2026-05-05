import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchProjects, fetchClientAccounts } from "@/lib/api";

export default function ProyectosSimplified() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterClient, setFilterClient] = useState<string>("all");
    const [filterService, setFilterService] = useState<string>("all");

    const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
    });

    const { data: clients = [], isLoading: isLoadingClients } = useQuery({
        queryKey: ["client-accounts"],
        queryFn: fetchClientAccounts,
    });

    if (isLoadingProjects || isLoadingClients) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="outline" size="icon" className="rounded-sm h-11 w-11">
                            <ArrowLeft className="size-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Proyectos (Simplified)</h1>
                        <p className="text-sm text-muted-foreground">Test version</p>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-3">
                            <Input
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Select value={filterClient} onValueChange={setFilterClient}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterService} onValueChange={setFilterService}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="SEO">SEO</SelectItem>
                                    <SelectItem value="Web">Web</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                    {projects.map((p) => (
                        <Card key={p.id}>
                            <CardHeader>
                                <CardTitle className="text-sm">{p.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge>{p.status}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
