


const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const USERNAME = process.env.AUTH_USERNAME;
const PASSWORD = process.env.AUTH_PASSWORD;

async function run() {
    if (!USERNAME || !PASSWORD) {
        throw new Error("AUTH_USERNAME and AUTH_PASSWORD are required.");
    }
    console.log("🚀 Starting Debug Script for Team Allocation...");

    // 1. Login
    console.log("🔑 Logging in...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    if (!loginRes.ok) {
        console.error("❌ Login failed:", await loginRes.text());
        return;
    }

    const cookie = loginRes.headers.get("set-cookie");
    console.log("✅ Login successful. Cookie received.");

    const headers = {
        "Content-Type": "application/json",
        "Cookie": cookie || "",
    };

    // 2. Fetch Team
    console.log("👥 Fetching Team...");
    const teamRes = await fetch(`${BASE_URL}/api/team`, { headers });
    const team = await teamRes.json();
    if (!team || team.length === 0) {
        console.error("❌ No team members found.");
        return;
    }
    const member = team[0];
    console.log(`✅ Found team member: ${member.id} (${member.firstName} ${member.lastName})`);

    // 3. Fetch Projects
    console.log("📁 Fetching Projects...");
    const projectsRes = await fetch(`${BASE_URL}/api/projects`, { headers });
    const projects = await projectsRes.json();
    if (!projects || projects.length === 0) {
        console.error("❌ No projects found.");
        return;
    }
    const project = projects[0];
    console.log(`✅ Found project: ${project.id} (${project.name})`);

    // 4. Attempt Assignment
    console.log("📝 Attempting Assignment...");
    const payload = {
        teamId: member.id,
        projectId: project.id,
        hoursAllocated: 5
    };
    console.log("Payload:", payload);

    const assignRes = await fetch(`${BASE_URL}/api/team/assignments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (assignRes.ok) {
        console.log("✅ Assignment successful!", await assignRes.json());
    } else {
        console.error("❌ Assignment failed!");
        console.error("Status:", assignRes.status);
        console.error("Response:", await assignRes.text());
    }
}

run().catch(console.error);
