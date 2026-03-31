import { runServer } from "./bootstrap";
import { serveStatic, log } from "./serve-static";

void runServer(async (app, server) => {
  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
}, log);
