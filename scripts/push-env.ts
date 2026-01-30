import { file } from "bun";
import { execSync } from "child_process";

const envFile = file(".env");
const text = await envFile.text();

const lines = text.split("\n");

console.log("🚀 Starting to push environment variables to Vercel...");

for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=");

    if (!key || !value) continue;

    const cleanValue = value.replace(/^["']|["']$/g, ""); // Remove quotes if present

    console.log(`\n👉 Adding ${key}...`);

    try {
        // Pipe the value to vercel env add
        // Format: printf "value" | vercel env add KEY production preview development
        const targets = "production preview development";
        const command = `printf "${cleanValue}" | vercel env add ${key} ${targets}`;

        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`❌ Failed to add ${key}`);
    }
}

console.log("\n✅ Done!");
