import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
    console.error('[migrate] Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.error('[migrate] Migrations complete');
    await sql.end();
}

main().catch((err) => {
    console.error('[migrate] Migration failed:', err);
    process.exit(1);
});
