import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";

async function forceSeed() {
    console.log("🚀 Starting RAW SQL Database Seed...");

    try {
        // 1. SERVICE CATALOG (Manual Insert to avoid missing column errors)
        console.log("📦 Seeding Service Catalog (Raw SQL)...");
        const services = [
            ["Iguala Marketing 360", "Marketing", "25000", "Gestión mensual completa de redes, pauta y diseño."],
            ["Desarrollo Landing Page", "Desarrollo", "12000", "Diseño y programación de landing page optimizada."],
            ["Identidad Corporativa Premium", "Diseño", "18000", "Logo, manual de identidad y papelería básica."],
            ["Gestión Pauta Digital (Ads)", "Marketing", "8000", "Configuración y optimización de campañas Meta/Google."],
            ["E-commerce Entry", "Desarrollo", "35000", "Tienda en línea completa con pasarela de pagos."],
            ["Producción Video Reels (4pack)", "Marketing", "6500", "Grabación y edición de 4 videos cortos para redes."]
        ];

        for (const s of services) {
            try {
                await db.execute(sql`
                    INSERT INTO service_catalog (name, category, default_price, description)
                    VALUES (${s[0]}, ${s[1]}, ${s[2]}, ${s[3]})
                `);
            } catch (e) {
                console.log(`|-- Note: Service ${s[0]} might already exist or failed:`, (e as any).message);
            }
        }

        // 2. TEAM MEMBERS
        console.log("👥 Seeding Team Members (Raw SQL)...");
        const team = [
            ["Sofía Valdez", "Sofía", "Valdez", "sofia.valdez@cohete.mx", "Fija"],
            ["Andrés Mendoza", "Andrés", "Mendoza", "andres.mendoza@cohete.mx", "Fija"],
            ["Lucía Torres", "Lucía", "Torres", "lucia.torres@cohete.mx", "Variable"],
            ["Roberto Velasco", "Roberto", "Velasco", "roberto.v@cohete.mx", "Fija"],
            ["Camila Ríos", "Camila", "Ríos", "camila.rios@cohete.mx", "Fija"]
        ];
        for (const t of team) {
            try {
                await db.execute(sql`
                    INSERT INTO team (name, first_name, last_name, email, payroll_type)
                    VALUES (${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}, ${t[4]})
                `);
            } catch (e) {
                console.log(`|-- Note: Team member ${t[0]} might already exist or failed.`);
            }
        }

        // 3. CLIENTS
        console.log("🏢 Seeding Client Accounts (Raw SQL)...");
        const clients = [
            ["Restaurante El Fogón", "Alimentos y Bebidas", 15000, 12000, 95, "Active"],
            ["TechNova Solutions", "Tecnología", 45000, 38000, 88, "Active"],
            ["Boutique L'Elegance", "Retail", 12000, 5000, 70, "Active"],
            ["Clínica Dental San Ángel", "Salud", 25000, 25000, 92, "Active"],
            ["Inmobiliaria Vértice", "Real Estate", 60000, 15000, 100, "Active"]
        ];
        for (const c of clients) {
            try {
                await db.execute(sql`
                    INSERT INTO client_accounts (company_name, industry, monthly_budget, current_spend, health_score, status)
                    VALUES (${c[0]}, ${c[1]}, ${c[2]}, ${c[3]}, ${c[4]}, ${c[5]})
                `);
            } catch (e) {
                console.log(`|-- Note: Client ${c[0]} might already exist or failed.`);
            }
        }

        // 4. PROJECTS
        console.log("🚀 Seeding Projects (Minimalist)...");
        const clientIds = await db.execute(sql`SELECT id FROM client_accounts LIMIT 5`);
        const cIds = (clientIds as any).map((r: any) => r.id);

        if (cIds.length >= 4) {
            try {
                await db.execute(sql`INSERT INTO projects (client_id, name, service_type, status) VALUES (${cIds[0]}, 'Iguala Marketing Mensual', 'Marketing', 'En Desarrollo')`);
                await db.execute(sql`INSERT INTO projects (client_id, name, service_type, status) VALUES (${cIds[1]}, 'Nueva Plataforma E-commerce', 'Web', 'Planificación')`);
                await db.execute(sql`INSERT INTO projects (client_id, name, service_type, status) VALUES (${cIds[2]}, 'Campaña Ads Especializada', 'Ads', 'En Desarrollo')`);
                await db.execute(sql`INSERT INTO projects (client_id, name, service_type, status) VALUES (${cIds[3]}, 'Branding Nueva Torre Residencial', 'Branding', 'Pausa')`);
            } catch (e) {
                console.log("|-- Note: Projects might already exist.");
            }
        }

        // 5. TRANSACTIONS
        console.log("💰 Seeding Transactions...");
        const trans = [
            ["Ingreso", "Iguala", "25000", "2026-01-05", true, "Manual Sync"],
            ["Ingreso", "Pauta", "25000", "2026-01-15", true, "Manual Sync"],
            ["Gasto", "Renta", "12000", "2026-01-01", true, "Inmobiliaria Central"],
            ["Gasto", "Software", "4500", "2026-01-10", true, "Adobe / Microsoft"]
        ];
        for (const t of trans) {
            await db.execute(sql`
                INSERT INTO transactions (type, category, amount, date, is_paid, provider)
                VALUES (${t[0]}, ${t[1]}, ${t[2]}, CAST(${t[3]} AS TIMESTAMP), ${t[4]}, ${t[5]})
            `);
        }

        // 6. LEADS
        console.log("🎯 Seeding CRM Leads...");
        const leadsData = [
            ["Juan Escutia", "Muebles Clásicos", "LinkedIn", "Contactado", "18000", 40, "Media"],
            ["Karla Romero", "Aseguradora Atlas", "Google", "En Negociación", "45000", 70, "Alta"]
        ];
        for (const l of leadsData) {
            await db.execute(sql`
                INSERT INTO leads (name, company, origin, status, estimated_value, probability, priority)
                VALUES (${l[0]}, ${l[1]}, ${l[2]}, ${l[3]}, ${l[4]}, ${l[5]}, ${l[6]})
            `);
        }

        console.log("✨ RAW Seeding Complete!");
    } catch (err) {
        console.error("❌ Fatal Error during RAW seeding:", (err as any).message);
        process.exit(1);
    }
}

forceSeed().then(() => process.exit(0));
