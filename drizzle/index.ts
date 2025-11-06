import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

// Lazy initialization - only create connection when actually used (not during build)
let clientInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getClient() {
    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined. Please set it in your environment variables.');
    }

    if (!clientInstance) {
        // Disable prefetch as it is not supported for "Transaction" pool mode
        clientInstance = postgres(connectionString, { prepare: false, ssl: { rejectUnauthorized: false } });
    }

    return clientInstance;
}

function getDb() {
    if (!dbInstance) {
        dbInstance = drizzle(getClient());
    }

    return dbInstance;
}

// Export getters instead of direct instances
export const client = new Proxy({} as ReturnType<typeof postgres>, {
    get: (target, prop) => {
        return getClient()[prop as keyof ReturnType<typeof postgres>];
    },
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get: (target, prop) => {
        return getDb()[prop as keyof ReturnType<typeof drizzle>];
    },
});
