// Standalone migration script for Docker production containers.
// Runs drizzle-orm migrations before the server starts.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
    console.error('[migrate] Running database migrations...');
    await migrate(db, { migrationsFolder: join(__dirname, '..', 'drizzle', 'migrations') });
    console.error('[migrate] Migrations complete');
    await sql.end();
}

main().catch((err) => {
    console.error('[migrate] Migration failed:', err);
    process.exit(1);
});
