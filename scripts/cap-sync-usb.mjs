import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const adb = path.join(
  process.env.LOCALAPPDATA ?? "",
  "Android",
  "Sdk",
  "platform-tools",
  "adb.exe"
);

const port = process.env.PORT ?? "3000";
const url = `http://127.0.0.1:${port}`;

console.log("USB dev mode: forwarding phone localhost:" + port + " → PC localhost:" + port);

try {
  execSync(`"${adb}" reverse tcp:${port} tcp:${port}`, { stdio: "inherit" });
  execSync(`"${adb}" reverse --list`, { stdio: "inherit" });
} catch {
  console.warn("adb reverse failed — connect the phone with USB debugging enabled.");
}

console.log(`Capacitor server URL: ${url}`);
process.env.CAPACITOR_SERVER_URL = url;

execSync("npx cap sync android", { cwd: root, stdio: "inherit", env: process.env });

console.log("\nDone. In Android Studio click Run ▶ (or reinstall the APK).");
console.log("Before launching the app:");
console.log("  1. npm run dev          (keep running)");
console.log("  2. npm run cap:prepare:usb");
