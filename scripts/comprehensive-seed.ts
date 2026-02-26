import 'dotenv/config';
import { storage } from "../server/storage";
import {
    INCOME_CATEGORIES,
    EXPENSE_CATEGORIES,
    LEAD_ORIGINS,
    LEAD_STATUSES,
    LEAD_PRIORITIES,
    SUPPLIER_SPECIALTIES
} from "../shared/schema";

async function comprehensiveSeed() {
    console.log("🚀 Starting Comprehensive Database Seed...");

    try {
        // 1. SERVICES CATALOG (The Foundation)
        console.log("📦 Seeding Service Catalog...");
        const services = [
            { name: "Iguala Marketing 360", category: "Marketing", defaultPrice: "25000", description: "Gestión mensual completa de redes, pauta y diseño." },
            { name: "Desarrollo Landing Page", category: "Desarrollo", defaultPrice: "12000", description: "Diseño y programación de landing page optimizada." },
            { name: "Identidad Corporativa Premium", category: "Diseño", defaultPrice: "18000", description: "Logo, manual de identidad y papelería básica." },
            { name: "Gestión Pauta Digital (Ads)", category: "Marketing", defaultPrice: "8000", description: "Configuración y optimización de campañas Meta/Google." },
            { name: "E-commerce Entry", category: "Desarrollo", defaultPrice: "35000", description: "Tienda en línea completa con pasarela de pagos." },
            { name: "Producción Video Reels (4pack)", category: "Marketing", defaultPrice: "6500", description: "Grabación y edición de 4 videos cortos para redes." },
        ];

        const createdServices = [];
        for (const s of services) {
            createdServices.push(await storage.createServiceCatalog(s));
        }

        // 2. SUPPLIERS
        console.log("🏭 Seeding Suppliers...");
        const suppliersData = [
            { name: "Print Master GDL", specialty: "Impresión" as any, contactName: "Roberto Pérez", email: "contacto@printmaster.mx" },
            { name: "DevLogic Solutions", specialty: "Desarrollo Web" as any, contactName: "Sonia Iturbe", email: "sonia@devlogic.com" },
            { name: "Focus Studio", specialty: "Fotografía / Video" as any, contactName: "Héctor Cano", email: "hector@focus.mx" },
        ];
        for (const sup of suppliersData) {
            await storage.createSupplier(sup);
        }

        // 3. TEAM MEMBERS (The Talent)
        console.log("👥 Seeding Team Members...");
        const teamMembers = [
            { firstName: "Sofía", lastName: "Valdez", email: "sofia.valdez@cohete.mx", payrollType: "Fija" as any, name: "Sofía Valdez" },
            { firstName: "Andrés", lastName: "Mendoza", email: "andres.mendoza@cohete.mx", payrollType: "Fija" as any, name: "Andrés Mendoza" },
            { firstName: "Lucía", lastName: "Torres", email: "lucia.torres@cohete.mx", payrollType: "Variable" as any, name: "Lucía Torres" },
            { firstName: "Roberto", lastName: "Velasco", email: "roberto.v@cohete.mx", payrollType: "Fija" as any, name: "Roberto Velasco" },
            { firstName: "Camila", lastName: "Ríos", email: "camila.rios@cohete.mx", payrollType: "Fija" as any, name: "Camila Ríos" },
        ];
        const createdTeam = [];
        for (const t of teamMembers) {
            createdTeam.push(await storage.createTeam(t));
        }

        // 4. CLIENTS (The Revenue)
        console.log("🏢 Seeding Client Accounts...");
        const clientsData = [
            { companyName: "Restaurante El Fogón", industry: "Alimentos y Bebidas", monthlyBudget: 15000, currentSpend: 12000, healthScore: 95, status: "Active" },
            { companyName: "TechNova Solutions", industry: "Tecnología", monthlyBudget: 45000, currentSpend: 38000, healthScore: 88, status: "Active" },
            { companyName: "Boutique L'Elegance", industry: "Retail", monthlyBudget: 12000, currentSpend: 5000, healthScore: 70, status: "Active" },
            { companyName: "Clínica Dental San Ángel", industry: "Salud", monthlyBudget: 25000, currentSpend: 25000, healthScore: 92, status: "Active" },
            { companyName: "Inmobiliaria Vértice", industry: "Real Estate", monthlyBudget: 60000, currentSpend: 15000, healthScore: 100, status: "Active" },
        ];
        const createdClients = [];
        for (const c of clientsData) {
            createdClients.push(await storage.createClientAccount(c));
        }

        // 5. PROJECTS & DEALS
        console.log("🚀 Seeding Projects & Deals...");
        const projectsData = [
            { clientId: createdClients[0].id, name: "Iguala Marketing Mensual", serviceType: "Marketing", status: "En Desarrollo", startDate: new Date() },
            { clientId: createdClients[1].id, name: "Nueva Plataforma E-commerce", serviceType: "Web", status: "Planificación", startDate: new Date() },
            { clientId: createdClients[3].id, name: "Campaña Ads Especializada", serviceType: "Ads", status: "En Desarrollo", startDate: new Date() },
            { clientId: createdClients[4].id, name: "Branding Nueva Torre Residencial", serviceType: "Branding", status: "Pausa", startDate: new Date() },
        ];
        const createdProjects = [];
        for (const p of projectsData) {
            createdProjects.push(await storage.createProject(p));
        }

        // 6. FINANCES - TRANSACTIONS (Past 3 months)
        console.log("💰 Seeding Transactions...");
        const now = new Date();
        const categories = INCOME_CATEGORIES as any;
        const expenseCaps = EXPENSE_CATEGORIES as any;

        const transactionData = [
            // Income
            { type: "Ingreso" as any, category: categories[0], amount: "25000", date: new Date(now.getFullYear(), now.getMonth() - 1, 5), isPaid: true, clientId: createdClients[0].id, provider: "Manual Sync" },
            { type: "Ingreso" as any, category: categories[1], amount: "25000", date: new Date(now.getFullYear(), now.getMonth() - 1, 15), isPaid: true, clientId: createdClients[1].id, provider: "Manual Sync" },
            { type: "Ingreso" as any, category: categories[3], amount: "15000", date: new Date(now.getFullYear(), now.getMonth(), 2), isPaid: true, clientId: createdClients[0].id, provider: "Manual Sync" },

            // Expenses
            { type: "Gasto" as any, category: "Renta", amount: "12000", date: new Date(now.getFullYear(), now.getMonth() - 1, 1), isPaid: true, provider: "Inmobiliaria Central" },
            { type: "Gasto" as any, category: "Software", amount: "4500", date: new Date(now.getFullYear(), now.getMonth() - 1, 10), isPaid: true, provider: "Adobe / Microsoft" },
            { type: "Gasto" as any, category: "Nómina", amount: "65000", date: new Date(now.getFullYear(), now.getMonth() - 1, 28), isPaid: true, provider: "Dispersión Bancaria" },
            { type: "Gasto" as any, category: "Internet", amount: "1200", date: new Date(now.getFullYear(), now.getMonth(), 5), isPaid: true, provider: "Izzi" },
        ];
        for (const t of transactionData) {
            await storage.createTransaction(t);
        }

        // 7. LEADS (Sales Pipeline)
        console.log("🎯 Seeding CRM Leads...");
        const leadsData = [
            { name: "Juan Escutia", company: "Muebles Clásicos", origin: "LinkedIn" as any, status: "Contactado" as any, estimatedValue: "18000", probability: 40, priority: "Media" as any },
            { name: "Karla Romero", company: "Aseguradora Atlas", origin: "Google" as any, status: "En Negociación" as any, estimatedValue: "45000", probability: 70, priority: "Alta" as any },
            { name: "Pedro Infante", company: "Producciones GDL", origin: "Referido" as any, status: "Nuevo" as any, estimatedValue: "8000", probability: 20, priority: "Baja" as any },
            { name: "María Elena", company: "Pastelería Suspiros", origin: "Instagram" as any, status: "Propuesta Enviada" as any, estimatedValue: "12500", probability: 85, priority: "Alta" as any },
        ];
        for (const l of leadsData) {
            await storage.createLead(l);
        }

        console.log("✨ Seeding Complete! Data populated successfully.");
    } catch (error) {
        console.error("❌ Error during seeding:", error);
        process.exit(1);
    }
}

comprehensiveSeed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
