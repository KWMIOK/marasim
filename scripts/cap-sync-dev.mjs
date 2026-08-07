import { execSync } from "node:child_process";
import { networkInterfaces } from "node:os";

function resolveLanIp() {
  const nets = networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("169.254.")) {
        return entry.address;
      }
    }
  }
  return "192.168.100.7";
}

const port = process.env.PORT ?? "3000";
const url = `http://${resolveLanIp()}:${port}`;

console.log(`Capacitor dev server URL: ${url}`);
process.env.CAPACITOR_SERVER_URL = url;

execSync("npx cap sync android", { stdio: "inherit", env: process.env });
