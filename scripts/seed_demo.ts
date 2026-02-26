import 'dotenv/config';
import { storage } from "../server/storage";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

async function seed() {
    console.log("🌱 [seed_demo] Iniciando seed de datos de demostración...\n");

    // ─────────────────────────────────────────────
    // 1. CAMPAÑAS
    // ─────────────────────────────────────────────
    let campaigns = await storage.getCampaigns();
    if (campaigns.length < 5) {
        console.log("📣 Creando campañas...");
        const campaignData = [
            { campaignCode: "CB-META-Q1", name: "Campaña Temporada Alta Q1 2025", clientName: "Grupo Inmobiliario Nexo", channel: "Meta", status: "Active", priority: "Critical", progress: 72, budget: 85000, spend: 61200, targetAudience: "Compradores de vivienda 30-55" },
            { campaignCode: "CB-GADS-FEB", name: "Google Search – Lanzamiento App Fintech", clientName: "Fintech MXN Pay", channel: "Google Ads", status: "Active", priority: "High", progress: 58, budget: 45000, spend: 26100, targetAudience: "Usuarios mobile 25-40 CDMX/GDL" },
            { campaignCode: "CB-TKTK-003", name: "Brand Awareness TikTok – Colección Primavera", clientName: "Moda Cohete Studio", channel: "TikTok", status: "Active", priority: "Medium", progress: 41, budget: 18000, spend: 7380, targetAudience: "Gen Z mujeres 18-28" },
            { campaignCode: "CB-EMAIL-EDU", name: "Nurturing Email – Curso Online", clientName: "Instituto Avanza Digital", channel: "Email", status: "In Progress", priority: "Medium", progress: 65, budget: 9500, spend: 6175, targetAudience: "Profesionistas 28-45 interesados en upskilling" },
            { campaignCode: "CB-LI-B2B", name: "Lead Gen LinkedIn – Servicios Corporativos", clientName: "Corporativo Bravo SA", channel: "LinkedIn", status: "Planning", priority: "High", progress: 15, budget: 30000, spend: 4500, targetAudience: "Directores y Gerentes B2B" },
            { campaignCode: "CB-META-RMK", name: "Remarketing Meta – Carrito Abandonado", clientName: "Tienda Online Cohete", channel: "Meta", status: "Active", priority: "High", progress: 88, budget: 12000, spend: 10560, targetAudience: "Visitantes del sitio últimos 30 días" },
        ];
        for (const c of campaignData) await storage.createCampaign(c);
        campaigns = await storage.getCampaigns();
        console.log(`   ✓ ${campaigns.length} campañas creadas`);
    }

    // ─────────────────────────────────────────────
    // 2. CLIENTES (ClientAccounts)
    // ─────────────────────────────────────────────
    let clients = await storage.getClientAccounts();
    if (clients.length < 5) {
        console.log("🏢 Creando clientes...");
        const clientData = [
            { companyName: "Grupo Inmobiliario Nexo", industry: "Real Estate", monthlyBudget: 120000, currentSpend: 87400, healthScore: 88, nextMilestone: "Presentación de resultados Q1", status: "Active" as const, lastContact: daysAgo(3) },
            { companyName: "Fintech MXN Pay", industry: "Finance", monthlyBudget: 75000, currentSpend: 52000, healthScore: 92, nextMilestone: "Revisión de KPIs – Abril", status: "Active" as const, lastContact: daysAgo(7) },
            { companyName: "Moda Cohete Studio", industry: "Retail", monthlyBudget: 35000, currentSpend: 28500, healthScore: 75, nextMilestone: "Shoot campaña Verano 2025", status: "Active" as const, lastContact: daysAgo(5) },
            { companyName: "Instituto Avanza Digital", industry: "Education", monthlyBudget: 22000, currentSpend: 15400, healthScore: 80, nextMilestone: "Lanzamiento nuevo curso UX", status: "Active" as const, lastContact: daysAgo(10) },
            { companyName: "Corporativo Bravo SA", industry: "Finance", monthlyBudget: 60000, currentSpend: 12000, healthScore: 65, nextMilestone: "Kick-off campaña LinkedIn", status: "Planning" as const, lastContact: daysAgo(2) },
            { companyName: "Tienda Online Cohete", industry: "Retail", monthlyBudget: 18000, currentSpend: 16200, healthScore: 95, nextMilestone: "Black Friday Planning 2025", status: "Active" as const, lastContact: daysAgo(1) },
            { companyName: "SaludPlus Clínicas", industry: "Health", monthlyBudget: 40000, currentSpend: 8000, healthScore: 70, nextMilestone: "Inducción al proyecto", status: "Paused" as const, lastContact: daysAgo(21) },
        ];
        for (const c of clientData) await storage.createClientAccount(c);
        clients = await storage.getClientAccounts();
        console.log(`   ✓ ${clients.length} clientes creados`);
    }

    // ─────────────────────────────────────────────
    // 3. EQUIPO (Team Members)
    // ─────────────────────────────────────────────
    let team = await storage.getTeam();
    if (team.length < 4) {
        console.log("👥 Creando equipo...");
        const teamData = [
            { firstName: "Sofía", lastName: "Ramírez", name: "Sofía Ramírez", email: "sofia.ramirez@cohete.mx", phone: "+52 55 1001 0001", role: "Creative Director", seniority: "Director", payrollType: "Fija" as const, employeeStatus: "Activo" as const, monthlySalary: "75000", internalCostHour: "469", billableRate: "1200", weeklyCapacity: 40, workHoursStart: "09:00", workHoursEnd: "18:00", status: "Available", startDate: new Date("2022-03-15") },
            { firstName: "Andrés", lastName: "Villanueva", name: "Andrés Villanueva", email: "andres.villanueva@cohete.mx", phone: "+52 55 1001 0002", role: "Paid Media Specialist", seniority: "Senior", payrollType: "Fija" as const, employeeStatus: "Activo" as const, monthlySalary: "45000", internalCostHour: "281", billableRate: "750", weeklyCapacity: 40, workHoursStart: "09:00", workHoursEnd: "18:00", status: "Available", startDate: new Date("2023-01-10") },
            { firstName: "Camila", lastName: "Torres", name: "Camila Torres", email: "camila.torres@cohete.mx", phone: "+52 55 1001 0003", role: "Diseñadora Gráfica", seniority: "Mid-Level", payrollType: "Fija" as const, employeeStatus: "Activo" as const, monthlySalary: "32000", internalCostHour: "200", billableRate: "500", weeklyCapacity: 40, workHoursStart: "10:00", workHoursEnd: "19:00", status: "Available", startDate: new Date("2023-06-01") },
            { firstName: "Roberto", lastName: "Medina", name: "Roberto Medina", email: "roberto.medina@cohete.mx", phone: "+52 55 1001 0004", role: "Copywriter", seniority: "Senior", payrollType: "Fija" as const, employeeStatus: "Activo" as const, monthlySalary: "38000", internalCostHour: "238", billableRate: "600", weeklyCapacity: 40, workHoursStart: "09:00", workHoursEnd: "18:00", status: "Available", startDate: new Date("2022-09-20") },
            { firstName: "Valeria", lastName: "Gutiérrez", name: "Valeria Gutiérrez", email: "valeria.gutierrez@cohete.mx", phone: "+52 55 1001 0005", role: "Social Media Manager", seniority: "Mid-Level", payrollType: "Variable" as const, employeeStatus: "Activo" as const, monthlySalary: "28000", internalCostHour: "175", billableRate: "450", weeklyCapacity: 40, workHoursStart: "10:00", workHoursEnd: "19:00", status: "Available", startDate: new Date("2024-02-01") },
            { firstName: "Diego", lastName: "Arias", name: "Diego Arias", email: "diego.arias@cohete.mx", phone: "+52 55 1001 0006", role: "SEO & Analytics", seniority: "Junior", payrollType: "Fija" as const, employeeStatus: "Activo" as const, monthlySalary: "22000", internalCostHour: "138", billableRate: "350", weeklyCapacity: 40, workHoursStart: "09:00", workHoursEnd: "18:00", status: "Available", startDate: new Date("2024-08-15") },
        ];
        for (const m of teamData) await storage.createTeam(m);
        team = await storage.getTeam();
        console.log(`   ✓ ${team.length} miembros del equipo creados`);
    }

    // ─────────────────────────────────────────────
    // 4. PROYECTOS
    // ─────────────────────────────────────────────
    let projects = await storage.getProjects();
    if (projects.length < 4) {
        console.log("📁 Creando proyectos...");
        const projectData = [
            {
                name: "Identidad de Marca + Sitio Web – MXN Pay",
                clientId: clients.find(c => c.companyName.includes("Fintech"))?.id || clients[0].id,
                serviceType: "Diseño Web",
                status: "En Progreso",
                type: "Diseño Web",
                startDate: daysAgo(45),
                endDate: daysFromNow(30),
                budget: "185000",
                currency: "MXN",
                description: "Rediseño completo de identidad visual y desarrollo de landing page + dashboard público para MXN Pay. Incluye sistema de diseño y componentes reutilizables.",
                priority: "Alta",
                healthStatus: "on_track",
                completionPercentage: 55,
            },
            {
                name: "Campaña Integral Q2 – Grupo Nexo",
                clientId: clients.find(c => c.companyName.includes("Nexo"))?.id || clients[0].id,
                serviceType: "Campaña Digital",
                status: "En Progreso",
                type: "Campaña Digital",
                startDate: daysAgo(20),
                endDate: daysFromNow(70),
                budget: "320000",
                currency: "MXN",
                description: "Estrategia de medios digitales Q2 para Grupo Nexo. Incluye Meta Ads, Google Ads, contenido orgánico RRSS y email marketing.",
                priority: "Crítica",
                healthStatus: "on_track",
                completionPercentage: 28,
            },
            {
                name: "Contenido TikTok – Colección Primavera",
                clientId: clients.find(c => c.companyName.includes("Moda"))?.id || clients[1].id,
                serviceType: "Contenido Social",
                status: "En Revisión",
                type: "Contenido Social",
                startDate: daysAgo(30),
                endDate: daysFromNow(15),
                budget: "48000",
                currency: "MXN",
                description: "Producción y edición de 20 videos para TikTok. Estrategia de sonidos virales y colaboraciones con micro-influencers.",
                priority: "Media",
                healthStatus: "at_risk",
                completionPercentage: 78,
            },
            {
                name: "Estrategia SEO + Blog – Instituto Avanza",
                clientId: clients.find(c => c.companyName.includes("Instituto"))?.id || clients[2].id,
                serviceType: "SEO",
                status: "Activo",
                type: "SEO",
                startDate: daysAgo(60),
                endDate: daysFromNow(90),
                budget: "72000",
                currency: "MXN",
                description: "Auditoría SEO, optimización on-page, linkbuilding y producción de 12 artículos mensuales para el blog educativo.",
                priority: "Media",
                healthStatus: "on_track",
                completionPercentage: 40,
            },
            {
                name: "Setup LinkedIn Ads – Corporativo Bravo",
                clientId: clients.find(c => c.companyName.includes("Bravo"))?.id || clients[3].id,
                serviceType: "Paid Media",
                status: "Planificación",
                type: "Paid Media",
                startDate: daysFromNow(7),
                endDate: daysFromNow(97),
                budget: "95000",
                currency: "MXN",
                description: "Configuración inicial de cuenta LinkedIn Ads, creación de audiencias y primeras campañas de lead generation para servicios corporativos.",
                priority: "Alta",
                healthStatus: "on_track",
                completionPercentage: 5,
            },
        ];
        for (const p of projectData) await storage.createProject(p as any);
        projects = await storage.getProjects();
        console.log(`   ✓ ${projects.length} proyectos creados`);
    }

    // ─────────────────────────────────────────────
    // 5. TRANSACCIONES FINANCIERAS
    // ─────────────────────────────────────────────
    let transactions = await storage.getTransactions();
    if (transactions.length < 10) {
        console.log("💰 Creando transacciones...");
        const txData = [
            // Ingresos
            { type: "income" as const, category: "Servicios de Agencia", amount: "85000", subtotal: "73275.86", iva: "11724.14", description: "Pago mensual Grupo Nexo – Febrero", date: daysAgo(28), status: "Pagado", provider: "Grupo Inmobiliario Nexo" },
            { type: "income" as const, category: "Servicios de Agencia", amount: "45000", subtotal: "38793.10", iva: "6206.90", description: "Fee mensual Fintech MXN Pay – Febrero", date: daysAgo(25), status: "Pagado", provider: "Fintech MXN Pay" },
            { type: "income" as const, category: "Producción Creativa", amount: "22000", subtotal: "18965.52", iva: "3034.48", description: "Videos TikTok Colección Primavera – Entrega parcial", date: daysAgo(18), status: "Pagado", provider: "Moda Cohete Studio" },
            { type: "income" as const, category: "Consultoría", amount: "15000", subtotal: "12931.03", iva: "2068.97", description: "Consultoría SEO inicial Instituto Avanza", date: daysAgo(14), status: "Pagado", provider: "Instituto Avanza Digital" },
            { type: "income" as const, category: "Servicios de Agencia", amount: "85000", subtotal: "73275.86", iva: "11724.14", description: "Pago mensual Grupo Nexo – Marzo", date: daysAgo(5), status: "Pagado", provider: "Grupo Inmobiliario Nexo" },
            { type: "income" as const, category: "Servicios de Agencia", amount: "45000", subtotal: "38793.10", iva: "6206.90", description: "Fee mensual Fintech MXN Pay – Marzo", date: daysAgo(3), status: "Pendiente", provider: "Fintech MXN Pay" },
            { type: "income" as const, category: "Servicios de Agencia", amount: "18000", subtotal: "15517.24", iva: "2482.76", description: "Tienda Online Cohete – Gestión Paid Media Marzo", date: daysAgo(2), status: "Pendiente", provider: "Tienda Online Cohete" },
            // Egresos
            { type: "expense" as const, category: "Nómina", amount: "240000", subtotal: "240000", iva: "0", description: "Nómina mensual equipo – Febrero 2025", date: daysAgo(27), status: "Pagado", provider: "Empleados internos" },
            { type: "expense" as const, category: "Software & Herramientas", amount: "8500", subtotal: "7327.59", iva: "1172.41", description: "Suite Adobe CC (6 licencias) + Figma Team", date: daysAgo(20), status: "Pagado", provider: "Adobe / Figma" },
            { type: "expense" as const, category: "Servicios de Nube", amount: "3200", subtotal: "2758.62", iva: "441.38", description: "AWS + hosting proyectos – Febrero", date: daysAgo(15), status: "Pagado", provider: "Amazon Web Services" },
            { type: "expense" as const, category: "Publicidad en Medios", amount: "15000", subtotal: "15000", iva: "0", description: "Presupuesto Meta Ads – Cuenta agencia Marzo", date: daysAgo(10), status: "Pagado", provider: "Meta Business" },
            { type: "expense" as const, category: "Proveedores", amount: "12000", subtotal: "10344.83", iva: "1655.17", description: "Fotógrafo freelance – Shoot Moda Cohete", date: daysAgo(8), status: "Pagado", provider: "Studio Lens MX" },
            { type: "expense" as const, category: "Nómina", amount: "240000", subtotal: "240000", iva: "0", description: "Nómina mensual equipo – Marzo 2025", date: daysAgo(1), status: "Pendiente", provider: "Empleados internos" },
        ];
        for (const t of txData) await storage.createTransaction(t as any);
        transactions = await storage.getTransactions();
        console.log(`   ✓ ${transactions.length} transacciones creadas`);
    }

    // ─────────────────────────────────────────────
    // 6. TRANSACCIONES RECURRENTES
    // ─────────────────────────────────────────────
    let recurring = await storage.getRecurringTransactions();
    if (recurring.length < 4) {
        console.log("🔄 Creando transacciones recurrentes...");
        const nextMonth = daysFromNow(30);
        const recurringData = [
            { name: "Nómina Mensual Equipo", type: "Gasto" as const, category: "Nómina", amount: "240000", subtotal: "240000", iva: "0", frequency: "monthly" as const, dayOfMonth: 25, nextExecutionDate: nextMonth, isActive: true, description: "Pago de nómina fija al equipo interno", provider: "Empleados Cohete Brands" },
            { name: "Adobe Creative Cloud – 6 licencias", type: "Gasto" as const, category: "Software & Herramientas", amount: "8500", subtotal: "7327.59", iva: "1172.41", frequency: "monthly" as const, dayOfMonth: 1, nextExecutionDate: nextMonth, isActive: true, description: "Suscripción mensual Adobe CC + Figma", provider: "Adobe Systems" },
            { name: "Servicios AWS + Hosting", type: "Gasto" as const, category: "Servicios de Nube", amount: "3200", subtotal: "2758.62", iva: "441.38", frequency: "monthly" as const, dayOfMonth: 5, nextExecutionDate: nextMonth, isActive: true, description: "Infraestructura cloud para proyectos de clientes", provider: "Amazon Web Services" },
            { name: "Renta Oficina zona Rosa CDMX", type: "Gasto" as const, category: "Renta / Instalaciones", amount: "28000", subtotal: "28000", iva: "0", frequency: "monthly" as const, dayOfMonth: 1, nextExecutionDate: nextMonth, isActive: true, description: "Renta mensual oficina coworking premium 8 personas", provider: "WeWork México" },
            { name: "Spotify + Notion Team", type: "Gasto" as const, category: "Software & Herramientas", amount: "1200", subtotal: "1034.48", iva: "165.52", frequency: "monthly" as const, dayOfMonth: 10, nextExecutionDate: nextMonth, isActive: true, description: "Herramientas colaborativas del equipo", provider: "Notion Labs / Spotify" },
            { name: "Retainer Fee – Grupo Nexo", type: "Ingreso" as const, category: "Servicios de Agencia", amount: "85000", subtotal: "73275.86", iva: "11724.14", frequency: "monthly" as const, dayOfMonth: 28, nextExecutionDate: nextMonth, isActive: true, description: "Fee mensual fijo de retainer – Grupo Inmobiliario Nexo", provider: "Grupo Inmobiliario Nexo" },
            { name: "Retainer Fee – MXN Pay", type: "Ingreso" as const, category: "Servicios de Agencia", amount: "45000", subtotal: "38793.10", iva: "6206.90", frequency: "monthly" as const, dayOfMonth: 28, nextExecutionDate: nextMonth, isActive: true, description: "Fee mensual fijo de retainer – Fintech MXN Pay", provider: "Fintech MXN Pay" },
            { name: "Retainer Fee – Tienda Online Cohete", type: "Ingreso" as const, category: "Servicios de Agencia", amount: "18000", subtotal: "15517.24", iva: "2482.76", frequency: "monthly" as const, dayOfMonth: 5, nextExecutionDate: nextMonth, isActive: true, description: "Gestión mensual de paid media y social", provider: "Tienda Online Cohete" },
        ];
        for (const r of recurringData) await storage.createRecurringTransaction(r as any);
        recurring = await storage.getRecurringTransactions();
        console.log(`   ✓ ${recurring.length} recurrentes creadas`);
    }

    // ─────────────────────────────────────────────
    // 7. LEADS (CRM Kanban)
    // ─────────────────────────────────────────────
    let leads = await storage.getLeads();
    if (leads.length < 6) {
        console.log("🎯 Creando leads...");
        const leadData = [
            { name: "Clínica Dental Sonrisas", contactName: "Dr. Marco Fuentes", email: "marco.fuentes@sonrisas.mx", phone: "+52 55 3300 1122", origin: "Referido", status: "Nuevo", estimatedValue: "35000", notes: "Interesado en manejo de RRSS y Google Ads.", source: "Referral" },
            { name: "Constructora BV Capital", contactName: "Ing. Berenice Vargas", email: "berenice@bvcapital.mx", phone: "+52 33 2244 5566", origin: "LinkedIn", status: "Contactado", estimatedValue: "120000", notes: "Empresa de desarrollos residenciales en Jalisco. Busca agencia para campaña de preventa.", source: "LinkedIn" },
            { name: "Restaurant Fusion TACO+", contactName: "Chef Luis Altamirano", email: "luis@tacomasplus.mx", phone: "+52 55 9988 7766", origin: "Instagram", status: "Propuesta", estimatedValue: "18000", notes: "Cadena de 3 restaurantes. Quiere manejo de contenido orgánico y paid local.", source: "Social Media" },
            { name: "EduTech Aprende Más", contactName: "Lic. Patricia Soto", email: "patricia.soto@aprendemas.edu", phone: "+52 55 4455 6677", origin: "Google", status: "Negociación", estimatedValue: "55000", notes: "Plataforma de cursos en línea. Busca estrategia de adquisición de estudiantes vía paid media.", source: "Inbound" },
            { name: "Farmacia del Ahorro Plus", contactName: "Gerardo Reyes", email: "g.reyes@fahplus.mx", phone: "+52 55 8877 5544", origin: "Evento", status: "Nuevo", estimatedValue: "80000", notes: "Cadena regional de farmacias. Interesados en expansión digital.", source: "Event" },
            { name: "Studio Fit Gym Chain", contactName: "Alejandra Montoya", email: "amontoya@studiofit.mx", phone: "+52 33 1122 4433", origin: "Cold Outreach", status: "Contactado", estimatedValue: "25000", notes: "Cadena de 5 gimnasios. Quieren campañas Meta + TikTok.", source: "Outbound" },
            { name: "Hotel Boutique Aborígen", contactName: "Fernando Leal", email: "floal@hotelaborigen.com", phone: "+52 984 123 4567", origin: "Referido", status: "Propuesta", estimatedValue: "42000", notes: "Hotel en Tulum. Interesado en contenido UGC, Meta Ads y Google Hotel Ads.", source: "Referral" },
            { name: "Bufete Jurídico Méndez & Asociados", contactName: "Lic. Arturo Méndez", email: "amendez@mendezyasoc.mx", phone: "+52 55 5566 7788", origin: "LinkedIn", status: "Nuevo", estimatedValue: "30000", notes: "Firma legal. Quieren posicionamiento de marca personal del socio fundador.", source: "LinkedIn" },
        ];
        for (const l of leadData) await storage.createLead(l as any);
        leads = await storage.getLeads();
        console.log(`   ✓ ${leads.length} leads creados`);
    }

    // ─────────────────────────────────────────────
    // 8. ACTIVOS DIGITALES
    // ─────────────────────────────────────────────
    if (clients.length > 0) {
        const nexoClient = clients.find(c => c.companyName.includes("Nexo")) || clients[0];
        const fintechClient = clients.find(c => c.companyName.includes("Fintech")) || clients[1];
        const modaClient = clients.find(c => c.companyName.includes("Moda")) || clients[2];

        // Check if assets already exist
        const existingAssets = await storage.getDigitalAssetsByClientId(nexoClient.id);
        if (existingAssets.length === 0) {
            console.log("🌐 Creando activos digitales...");
            const assetData = [
                { clientId: nexoClient.id, assetType: "domain", name: "grupoinmobiliarionexo.mx", provider: "GoDaddy", cost: "1200", autoRenew: true, status: "active", expirationDate: daysFromNow(210), files: [] },
                { clientId: nexoClient.id, assetType: "hosting", name: "Hosting VPS – SiteGround Business", provider: "SiteGround", cost: "4800", autoRenew: true, status: "active", expirationDate: daysFromNow(180), files: [] },
                { clientId: nexoClient.id, assetType: "ssl", name: "SSL Wildcard – grupo*.mx", provider: "Let's Encrypt", cost: "0", autoRenew: true, status: "active", expirationDate: daysFromNow(75), files: [] },
                { clientId: fintechClient.id, assetType: "domain", name: "mxnpay.io", provider: "Cloudflare", cost: "1800", autoRenew: true, status: "active", expirationDate: daysFromNow(310), files: [] },
                { clientId: fintechClient.id, assetType: "hosting", name: "Vercel Pro – mxnpay.io", provider: "Vercel", cost: "3600", autoRenew: true, status: "active", expirationDate: daysFromNow(220), files: [] },
                { clientId: modaClient.id, assetType: "domain", name: "modacohete.studio", provider: "Namecheap", cost: "950", autoRenew: false, status: "active", expirationDate: daysFromNow(28), files: [] },
                { clientId: modaClient.id, assetType: "email", name: "G Suite – modacohete.studio (5 cuentas)", provider: "Google", cost: "2400", autoRenew: true, status: "active", expirationDate: daysFromNow(60), files: [] },
            ];
            for (const a of assetData) await storage.createDigitalAsset(a as any);
            console.log(`   ✓ ${assetData.length} activos digitales creados`);
        }
    }

    // ─────────────────────────────────────────────
    // 9. ENTREGABLES DE PROYECTOS
    // ─────────────────────────────────────────────
    if (projects.length > 0) {
        const mxnProject = projects.find(p => p.name.includes("MXN Pay")) || projects[0];
        const existingDeliverables = await storage.getProjectDeliverables(mxnProject.id);
        if (existingDeliverables.length === 0) {
            console.log("📋 Creando entregables del proyecto MXN Pay...");
            const deliverables = [
                { projectId: mxnProject.id, name: "Auditoría de marca actual", type: "research", status: "completed" as const, dueDate: daysAgo(30), description: "Análisis del branding existente y benchmark competitivo" },
                { projectId: mxnProject.id, name: "Moodboard + Guía de estilo", type: "design", status: "completed" as const, dueDate: daysAgo(20), description: "Propuesta de paleta de color, tipografía y elementos visuales" },
                { projectId: mxnProject.id, name: "Logotipo + Manual de Marca", type: "design", status: "completed" as const, dueDate: daysAgo(10), description: "Logotipo principal + variaciones + manual de uso de marca" },
                { projectId: mxnProject.id, name: "Wireframes Landing Page", type: "design", status: "in_progress" as const, dueDate: daysFromNow(7), description: "UX/UI Wireframes para landing page y dashboard" },
                { projectId: mxnProject.id, name: "Desarrollo Frontend Landing", type: "development", status: "pending" as const, dueDate: daysFromNow(20), description: "Código HTML/CSS/JS responsivo + integración CMS" },
                { projectId: mxnProject.id, name: "QA y Publicación", type: "review", status: "pending" as const, dueDate: daysFromNow(28), description: "Testing multidispositivo, revisión de cliente y pase a producción" },
            ];
            for (const d of deliverables) await storage.createProjectDeliverable(d as any);
            console.log(`   ✓ ${deliverables.length} entregables creados`);
        }
    }

    // ─────────────────────────────────────────────
    // 10. RECURSOS / DATA CENTER
    // ─────────────────────────────────────────────
    let resources = await storage.getResources();
    if (resources.length < 5) {
        console.log("💾 Creando recursos...");
        const resourceData = [
            { name: "Brand Manual – Grupo Nexo 2025", type: "Document", format: "PDF", fileSize: "28", status: "Aprobado", campaignId: null, lastModified: daysAgo(15).toISOString() },
            { name: "Pack Creativos Meta – Q1 Nexo", type: "Creative", format: "AI", fileSize: "380", status: "En Uso", campaignId: campaigns[0]?.id || null, lastModified: daysAgo(8).toISOString() },
            { name: "Video Hero 15s – MXN Pay Launch", type: "Video", format: "MP4", fileSize: "650", status: "En Revisión", campaignId: campaigns[1]?.id || null, lastModified: daysAgo(3).toISOString() },
            { name: "Photography Pack – Moda Primavera", type: "Asset", format: "PNG", fileSize: "910", status: "Aprobado", campaignId: campaigns[2]?.id || null, lastModified: daysAgo(12).toISOString() },
            { name: "Copy Maestro – Email Avanza Digital", type: "Copy", format: "DOC", fileSize: "5", status: "En Revisión", campaignId: campaigns[3]?.id || null, lastModified: daysAgo(5).toISOString() },
            { name: "Presentación Resultados Q1", type: "Document", format: "PDF", fileSize: "18", status: "Disponible", campaignId: null, lastModified: daysAgo(1).toISOString() },
            { name: "Fonts + Icons Pack Corporativo Bravo", type: "Asset", format: "AI", fileSize: "45", status: "Disponible", campaignId: null, lastModified: daysAgo(20).toISOString() },
        ];
        for (const r of resourceData) await storage.createResource(r as any);
        resources = await storage.getResources();
        console.log(`   ✓ ${resources.length} recursos creados`);
    }

    // ─────────────────────────────────────────────
    // RESUMEN FINAL
    // ─────────────────────────────────────────────
    console.log("\n✅ ¡Seed de demostración completado!\n");
    console.log("📊 Resumen:");
    console.log(`   🏢 Clientes:               ${(await storage.getClientAccounts()).length}`);
    console.log(`   📣 Campañas:               ${(await storage.getCampaigns()).length}`);
    console.log(`   📁 Proyectos:              ${(await storage.getProjects()).length}`);
    console.log(`   👥 Equipo:                 ${(await storage.getTeam()).length}`);
    console.log(`   💰 Transacciones:          ${(await storage.getTransactions()).length}`);
    console.log(`   🔄 Recurrentes:            ${(await storage.getRecurringTransactions()).length}`);
    console.log(`   🎯 Leads:                  ${(await storage.getLeads()).length}`);
    console.log(`   💾 Recursos:               ${(await storage.getResources()).length}`);
}

seed()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error en seed:", error);
        process.exit(1);
    });
