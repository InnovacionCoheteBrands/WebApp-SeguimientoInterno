import axios from 'axios';

const BASE_URL = `${process.env.BASE_URL || 'http://localhost:5000'}/api`;

async function runTests() {
  const adminUsername = process.env.AUTH_USERNAME;
  const adminPassword = process.env.AUTH_PASSWORD;
  const userUsername = process.env.QA_USER_USERNAME;
  const userPassword = process.env.QA_USER_PASSWORD;
  if (!adminUsername || !adminPassword || !userUsername || !userPassword) {
    throw new Error("AUTH_USERNAME, AUTH_PASSWORD, QA_USER_USERNAME and QA_USER_PASSWORD are required.");
  }

  console.log("== Setting up tokens ==");
  
  let adminToken = '';
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { username: adminUsername, password: adminPassword });
    adminToken = loginRes.data.token;
  } catch (err: any) {
    console.error("Failed to login as admin:", err.response?.data || err.message);
    process.exit(1);
  }

  let userToken = '';
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { username: userUsername, password: userPassword });
    userToken = loginRes.data.token;
  } catch (err: any) {
    console.error("Failed to login as normal user:", err.response?.data || err.message);
    process.exit(1);
  }

  console.log("Tokens obtained. Running test cases...\n");

  const runTest = async (name: string, url: string, token: string, expectedStatus: number) => {
    try {
      const res = await axios.get(`${BASE_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { status: res.status, data: res.data, expectedStatus, name };
    } catch (err: any) {
      if (err.response) {
        return { status: err.response.status, data: err.response.data, expectedStatus, name };
      }
      return { status: 500, data: err.message, expectedStatus, name };
    }
  };

  const results = [];

  // Caso 1: Sin parámetros
  results.push(await runTest('Caso 1: Sin parámetros', '/finance/payment-calendar', adminToken, 400));
  
  // Caso 2: startDate > endDate
  results.push(await runTest('Caso 2: startDate > endDate', '/finance/payment-calendar?startDate=2026-04-30&endDate=2026-04-01', adminToken, 400));
  
  // Caso 3: Rango > 24 meses
  results.push(await runTest('Caso 3: Rango > 24 meses', '/finance/payment-calendar?startDate=2024-01-01&endDate=2026-06-01', adminToken, 400));
  
  // Caso 4: Usuario no admin
  results.push(await runTest('Caso 4: Usuario no admin', '/finance/payment-calendar?startDate=2026-04-01&endDate=2026-04-30', userToken, 403));
  
  // Caso 5: Rango válido
  results.push(await runTest('Caso 5: Rango válido', '/finance/payment-calendar?startDate=2026-04-01&endDate=2026-04-30', adminToken, 200));

  console.log(JSON.stringify(results, null, 2));
}

runTests();
