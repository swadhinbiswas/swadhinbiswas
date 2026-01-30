import { db, supportOptions } from "../src/db";
import { eq } from "drizzle-orm";

const options = [
    {
        name: "Support Kori",
        icon: "🎁",
        type: "link",
        value: "https://www.supportkori.com/",
        order: 0
    },
    {
        name: "Buy Me Coffee",
        icon: "☕",
        type: "link",
        value: "https://buymeacoffee.com/",
        order: 1
    },
    {
        name: "Binance (BNB)",
        icon: "🪙",
        type: "copy",
        value: "0xYOUR_BNB_ADDRESS",
        order: 2
    },
    {
        name: "Uniswap (ETH)",
        icon: "🦄",
        type: "copy",
        value: "0xYOUR_ETH_ADDRESS",
        order: 3
    }
];

async function seed() {
    console.log("Seeding Support Options...");

    // Clear existing (optional, but good for clean slate if re-running)
    // await db.delete(supportOptions);

    for (const o of options) {
        const existing = await db.select().from(supportOptions).where(eq(supportOptions.name, o.name));
        if (existing.length === 0) {
            await db.insert(supportOptions).values({
                name: o.name,
                icon: o.icon,
                type: o.type as any,
                value: o.value,
                order: o.order,
                createdAt: new Date().toISOString()
            });
            console.log(`Added ${o.name}`);
        } else {
            console.log(`Skipping ${o.name} (exists)`);
        }
    }
    console.log("Done!");
}

seed();
