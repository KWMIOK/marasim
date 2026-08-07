import { execSync } from "node:child_process";

const port = process.env.PORT ?? "3000";
const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;

console.log(`Setting up USB dev bridge on port ${port}…`);

try {
  execSync(`"${adb}" reverse tcp:${port} tcp:${port}`, { stdio: "inherit" });
  execSync(`"${adb}" reverse --list`, { stdio: "inherit" });
} catch {
  console.error("\nadb reverse failed. Connect the phone with USB debugging enabled.");
  process.exit(1);
}

try {
  execSync(`curl -s -o NUL -w "%{http_code}" http://127.0.0.1:${port}`, {
    stdio: "pipe",
    shell: true,
  });
  console.log(`\nDev server is reachable at http://127.0.0.1:${port}`);
} catch {
  console.warn(`\nWARNING: No dev server on http://127.0.0.1:${port}`);
  console.warn("Start it in another terminal: npm run dev");
  console.warn("Then relaunch the app on your phone.");
}
