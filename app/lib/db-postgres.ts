import { sql } from '@vercel/postgres';
import { DatabaseAdapter } from './db-adapter';

export class PostgresAdapter implements DatabaseAdapter {
    constructor() {
        // Ideally we would run migrations properly, but for this simple app
        // we'll try to ensure tables exist on first use.
    }

    // Helper to ensure tables exist (simple/naive approach for this specific hobby project)
    async ensureTables() {
        // Reset Schema (Drop old tables to clean state for new advanced schema)
        await sql`DROP TABLE IF EXISTS product_option_links CASCADE`;
        await sql`DROP TABLE IF EXISTS options CASCADE`;
        await sql`DROP TABLE IF EXISTS option_groups CASCADE`;
        await sql`DROP TABLE IF EXISTS product_sizes CASCADE`;
        await sql`DROP TABLE IF EXISTS products CASCADE`;
        await sql`DROP TABLE IF EXISTS categories CASCADE`;
        // await sql`DROP TABLE IF EXISTS settings`; 

        // Create New Schema
        await sql`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`;

        await sql`CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )`;

        await sql`CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      category_id INTEGER REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

        await sql`CREATE TABLE IF NOT EXISTS product_sizes (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      size_name TEXT NOT NULL,
      price INTEGER NOT NULL
    )`;

        await sql`CREATE TABLE IF NOT EXISTS option_groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      is_multi_select BOOLEAN DEFAULT false,
      is_required BOOLEAN DEFAULT false
    )`;

        await sql`CREATE TABLE IF NOT EXISTS options (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price_modifier INTEGER DEFAULT 0
    )`;

        await sql`CREATE TABLE IF NOT EXISTS product_option_links (
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, group_id)
    )`;

        // Keep Orders/Surveys
        await sql`CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      items TEXT,
      total INTEGER,
      details TEXT,
      worker_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

        await sql`CREATE TABLE IF NOT EXISTS surveys (
      id SERIAL PRIMARY KEY,
      order_id INTEGER,
      worker_id INTEGER,
      quality INTEGER,
      time INTEGER,
      manner INTEGER,
      overall INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    }

    async query<T = any>(text: string, params: any[] = []): Promise<T[]> {
        const { text: newText, values } = this.convertQuery(text, params);
        const result = await sql.query(newText, values);
        return result.rows as T[];
    }

    async run(text: string, params: any[] = []): Promise<{ id?: number | string }> {
        const { text: newText, values } = this.convertQuery(text, params);

        let finalText = newText;
        let isInsert = /^\s*INSERT/i.test(newText);

        if (isInsert && !/RETURNING/i.test(newText)) {
            finalText += ' RETURNING id';
        }

        const result = await sql.query(finalText, values);

        if (isInsert && result.rows.length > 0) {
            return { id: result.rows[0].id };
        }

        return {};
    }

    private convertQuery(text: string, params: any[]) {
        // Simple regex to replace ? with $1, $2, etc.
        let index = 1;
        const newText = text.replace(/\?/g, () => `$${index++}`);
        return { text: newText, values: params };
    }
}
