import { sql } from '@vercel/postgres';
import { DatabaseAdapter } from './db-adapter';

export class PostgresAdapter implements DatabaseAdapter {
  constructor() {
    // Ideally we would run migrations properly, but for this simple app
    // we'll try to ensure tables exist on first use.
  }

  // Helper to ensure tables exist (simple/naive approach for this specific hobby project)
  async ensureTables() {
    // Removed DROP statements to prevent data loss on production.
    // We only create tables if they don't exist.

    // Settings
    await sql`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )`;

    // Categories
    await sql`CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            is_visible INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            image_url TEXT
        )`;



    // Products
    await sql`CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            category_id INTEGER REFERENCES categories(id),
            name TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            is_available INTEGER DEFAULT 1,
            is_visible INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;


    // Product Sizes
    await sql`CREATE TABLE IF NOT EXISTS product_sizes (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            size_name TEXT NOT NULL,
            price INTEGER NOT NULL
        )`;

    // Option Groups
    await sql`CREATE TABLE IF NOT EXISTS option_groups (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            is_multi_select INTEGER DEFAULT 0,
            is_required INTEGER DEFAULT 0,
            is_visible INTEGER DEFAULT 1
        )`;


    // Options
    await sql`CREATE TABLE IF NOT EXISTS options (
            id SERIAL PRIMARY KEY,
            group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            price_modifier INTEGER DEFAULT 0,
            is_available INTEGER DEFAULT 1,
            is_visible INTEGER DEFAULT 1,
            image_url TEXT,
            price_modifiers_json TEXT,
            sort_order INTEGER DEFAULT 0,
            image_focus TEXT,
            crop_data TEXT
        )`;



    // Ingredients
    await sql`CREATE TABLE IF NOT EXISTS ingredients (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            cost_per_gram REAL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

    // Product Option Links
    await sql`CREATE TABLE IF NOT EXISTS product_option_links (
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
            PRIMARY KEY (product_id, group_id)
        )`;

    // Orders
    await sql`CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            items TEXT,
            total INTEGER,
            details TEXT,
            worker_id INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            display_id INTEGER
        )`;


    // Product Recipes
    await sql`CREATE TABLE IF NOT EXISTS product_recipes (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            ingredient_id INTEGER,
            quantity REAL NOT NULL,
            size_name TEXT
        )`;

    // Surveys
    await sql`CREATE TABLE IF NOT EXISTS surveys (
            id SERIAL PRIMARY KEY,
            order_id INTEGER,
            worker_id INTEGER,
            quality INTEGER,
            time INTEGER,
            manner INTEGER,
            overall INTEGER,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
  }


  async query<T = any>(text: string, params: any[] = []): Promise<T[]> {
    try {
      const { text: newText, values } = this.convertQuery(text, params);
      const result = await sql.query(newText, values);
      return result.rows as T[];
    } catch (err: any) {
      console.error(`Postgres Query Error: ${text}`, err);
      throw err;
    }
  }

  async run(text: string, params: any[] = []): Promise<{ id?: number | string }> {
    try {
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
    } catch (err: any) {
      console.error(`Postgres Run Error: ${text}`, err);
      throw err;
    }
  }


  private convertQuery(text: string, params: any[]) {
    // Simple regex to replace ? with $1, $2, etc.
    let index = 1;
    const newText = text.replace(/\?/g, () => `$${index++}`);
    return { text: newText, values: params };
  }
}
