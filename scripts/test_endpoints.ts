


async function testEndpoints() {
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const username = process.env.AUTH_USERNAME;
    const password = process.env.AUTH_PASSWORD;
    if (!username || !password) {
        throw new Error("AUTH_USERNAME and AUTH_PASSWORD are required.");
    }

    // 1. Login
    console.log("Logging in...");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (!loginRes.ok) {
        console.error("Login failed:", loginRes.status, await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Login successful. Token obtained.");

    // 2. Test /api/team
    console.log("Testing /api/team...");
    const teamRes = await fetch(`${baseUrl}/api/team`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    console.log("Status:", teamRes.status);
    if (!teamRes.ok) {
        console.error("Error body:", await teamRes.text());
    } else {
        const data = await teamRes.json();
        console.log("Data type:", Array.isArray(data) ? "Array" : typeof data);
        console.log("Data preview:", JSON.stringify(data).substring(0, 200));

        if (!Array.isArray(data)) {
            console.error("CRITICAL: /api/team did NOT return an array!");
        }
    }

    // 3. Test /api/metrics (since Dashboard works)
    console.log("Testing /api/metrics...");
    const metricsRes = await fetch(`${baseUrl}/api/metrics`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("Metrics Status:", metricsRes.status);
}

testEndpoints().catch(console.error);
