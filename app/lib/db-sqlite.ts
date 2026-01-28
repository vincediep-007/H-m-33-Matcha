import sqlite3 from 'sqlite3';
import { DatabaseAdapter } from './db-adapter';

// Initialize the database connection
const db = new sqlite3.Database('matcha.db');

export class SqliteAdapter implements DatabaseAdapter {
  constructor() {
    this.init();
  }

  private init() {
    db.serialize(() => {
      // REMOVED DROP STATEMENTS to ensure persistence.
      // Data will now stay unless manually deleted via Admin or script.

      db.run(`CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )`);

      db.run(`CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          is_visible BOOLEAN DEFAULT 1,
          sort_order INTEGER DEFAULT 0
        )`);

      db.run(`CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER,
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          is_available BOOLEAN DEFAULT 1, -- In Stock / Out of Stock
          is_visible BOOLEAN DEFAULT 1,   -- Show / Hide
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(category_id) REFERENCES categories(id)
        )`);

      db.run(`CREATE TABLE IF NOT EXISTS product_sizes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          size_name TEXT NOT NULL,
          price INTEGER NOT NULL,
          FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        )`);

      db.run(`CREATE TABLE IF NOT EXISTS option_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT, 
          is_multi_select BOOLEAN DEFAULT 0,
          is_required BOOLEAN DEFAULT 0,
          is_visible BOOLEAN DEFAULT 1
        )`);

      db.run(`CREATE TABLE IF NOT EXISTS options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price_modifier INTEGER DEFAULT 0,
          is_available BOOLEAN DEFAULT 1, -- In Stock / Out of Stock
          is_visible BOOLEAN DEFAULT 1,   -- Show / Hide
          FOREIGN KEY(group_id) REFERENCES option_groups(id) ON DELETE CASCADE
        )`);

      db.run(`CREATE TABLE IF NOT EXISTS product_option_links (
          product_id INTEGER NOT NULL,
          group_id INTEGER NOT NULL,
          PRIMARY KEY (product_id, group_id),
          FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY(group_id) REFERENCES option_groups(id) ON DELETE CASCADE
        )`);

      db.run(`CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          items TEXT,
          total INTEGER,
          details TEXT,
          worker_id INTEGER,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

      db.run(`CREATE TABLE IF NOT EXISTS surveys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER,
          worker_id INTEGER,
          quality INTEGER,
          time INTEGER,
          manner INTEGER,
          overall INTEGER,
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
  }

  query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  run(sql: string, params: any[] = []): Promise<{ id?: number }> {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }
}
