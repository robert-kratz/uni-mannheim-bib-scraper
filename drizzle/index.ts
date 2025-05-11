import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is not defined. Please set it in your environment variables.');

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false, ssl: { rejectUnauthorized: false } });
export const db = drizzle(client);
