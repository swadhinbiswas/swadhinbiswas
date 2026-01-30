import { createClient } from "@libsql/client";

const url = import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

export const turso = createClient({
    url: url!,
    authToken: authToken,
});

export async function getGlobalClicks(): Promise<number> {
    try {
        const result = await turso.execute("SELECT count FROM clicks WHERE id = 'global'");
        if (result.rows.length === 0) {
            // Initialize if not exists
            const startVal = 152162;
            await turso.execute({
                sql: "INSERT INTO clicks (id, count) VALUES ('global', ?)",
                args: [startVal]
            });
            return startVal;
        }
        return Number(result.rows[0].count);
    } catch (e) {
        // Table might not exist
        console.error("Turso Error (get):", e);
        // Try creating table if error implies missing table? 
        // Better to handle that in initialization or explicit setup.
        // For now, let's try to create table if it fails
        try {
            await turso.execute(`
                CREATE TABLE IF NOT EXISTS clicks (
                    id TEXT PRIMARY KEY,
                    count INTEGER
                )
            `);
            // Retry get/insert
            const result = await turso.execute("SELECT count FROM clicks WHERE id = 'global'");
            if (result.rows.length === 0) {
                const startVal = 152162;
                await turso.execute({
                    sql: "INSERT INTO clicks (id, count) VALUES ('global', ?)",
                    args: [startVal]
                });
                return startVal;
            }
            return Number(result.rows[0].count);
        } catch (e2) {
            console.error("Turso Critical Error:", e2);
            return 152162; // Fallback
        }
    }
}

export async function incrementGlobalClicks(amount: number): Promise<number> {
    try {
        // Atomic increment
        const result = await turso.execute({
            sql: "UPDATE clicks SET count = count + ? WHERE id = 'global' RETURNING count",
            args: [amount]
        });

        if (result.rows.length > 0) {
            return Number(result.rows[0].count);
        }
        return await getGlobalClicks(); // Fallback if update missed (row didn't exist?)
    } catch (e) {
        console.error("Turso Error (incr):", e);
        return 0;
    }
}
