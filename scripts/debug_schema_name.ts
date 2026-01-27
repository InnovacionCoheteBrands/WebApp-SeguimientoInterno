
import { projects } from "../shared/schema";

console.log("--------------------------------------------------");
console.log("DEBUG: Inspecting Schema Column Name");
console.log("--------------------------------------------------");
try {
    const colName = projects.clientId.name;
    console.log(`Column Name for 'clientId': [${colName}]`);
} catch (e) {
    console.error("Error inspecting schema:", e);
}
console.log("--------------------------------------------------");
