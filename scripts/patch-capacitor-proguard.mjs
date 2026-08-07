import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const targets = [
  "node_modules/@capacitor-community/contacts/android/build.gradle",
];

const from = "getDefaultProguardFile('proguard-android.txt')";
const to = "getDefaultProguardFile('proguard-android-optimize.txt')";

let patched = 0;

for (const relativePath of targets) {
  const absolutePath = join(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) continue;

  const content = readFileSync(absolutePath, "utf8");
  if (!content.includes(from)) continue;

  writeFileSync(absolutePath, content.replaceAll(from, to));
  patched += 1;
  console.log(`Patched ProGuard defaults in ${relativePath}`);
}

if (patched === 0) {
  console.log("No Capacitor ProGuard patches needed.");
}
