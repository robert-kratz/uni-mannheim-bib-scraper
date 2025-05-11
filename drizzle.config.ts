// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './drizzle/schema.ts', // deine Schema-Definitionen
    dialect: 'postgresql',
    out: './drizzle/migrations', // Auto-Migrations
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
