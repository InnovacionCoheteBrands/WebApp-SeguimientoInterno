import { Briefcase, Shield } from "lucide-react";
import { RoleCatalogPanel } from "@/components/services/role-catalog-panel";
import { ServiceCatalogPanel } from "@/components/services/service-catalog-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ServicesPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="border-b border-border/50 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Configuración de Servicios</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los servicios y perfiles disponibles para tus proyectos.
            </p>
          </div>
        </div>

        <Tabs defaultValue="services" className="mt-6">
          <TabsList className="border border-border/50 bg-muted/50 p-1">
            <TabsTrigger value="services" className="gap-2 px-4">
              <Briefcase className="size-4" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2 px-4">
              <Shield className="size-4" />
              Catálogo de Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-0 outline-none">
            <ServiceCatalogPanel />
          </TabsContent>
          <TabsContent value="roles" className="mt-0 outline-none">
            <RoleCatalogPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
