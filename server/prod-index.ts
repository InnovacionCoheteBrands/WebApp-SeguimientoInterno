import { runServer } from "./bootstrap";
import { serveStatic, log } from "./serve-static";

void runServer(async (app, _server) => {
  serveStatic(app);
}, log);
