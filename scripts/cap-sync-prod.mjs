import { execSync } from "node:child_process";

const url = process.env.CAPACITOR_SERVER_URL ?? "https://marasim-ten.vercel.app";

console.log(`Capacitor server URL: ${url}`);
process.env.CAPACITOR_SERVER_URL = url;

execSync("npx cap sync android", { stdio: "inherit", env: process.env });
