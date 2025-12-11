
import express from "express";
import { registerRoutes } from "./server/routes";

async function startTestServer() {
    const app = express();
    app.use(express.json());

    // Minimal setup
    const server = await registerRoutes(app);

    server.listen(5001, "0.0.0.0", () => {
        console.log("Test server running on port 5001");
    });
}

startTestServer();
