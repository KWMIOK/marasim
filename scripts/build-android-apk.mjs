import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const jdkCandidates = [
  process.env.JAVA_HOME,
  path.join(process.env.USERPROFILE ?? "", ".jdks", "temurin-24.0.2"),
  path.join(process.env["ProgramFiles"] ?? "", "Android", "Android Studio", "jbr"),
].filter(Boolean);

const javaHome = jdkCandidates.find((candidate) => candidate && existsSync(candidate));
if (!javaHome) {
  console.error("Could not find JDK 17+. Install Android Studio or Temurin 17+.");
  process.exit(1);
}

const androidHome =
  process.env.ANDROID_HOME ??
  process.env.ANDROID_SDK_ROOT ??
  path.join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk");

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidHome,
};

const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const androidDir = path.join(root, "android");

console.log(`Using JAVA_HOME=${javaHome}`);

if (process.platform !== "win32") {
  execSync("chmod +x gradlew", { cwd: androidDir, stdio: "inherit" });
}

execSync(`${gradle} assembleDebug`, { cwd: androidDir, stdio: "inherit", env });

const apkPath = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
console.log(`\nAPK ready: ${apkPath}`);
