const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);
const outputPath = path.resolve(__dirname, '../postgres_seed.sql');

const tables = [
    'categories',
    'options',
    'option_groups',
    'products',
    'product_sizes',
    'product_option_links',
    'product_recipes',
    'ingredients'
    // 'orders', 'order_items' // Skip sales data for clean deploy? Or include? Let's skip for now, usually users want menu.
];

const stream = fs.createWriteStream(outputPath);

db.serialize(() => {
    console.log("Exporting data to postgres_seed.sql...");

    // 1. Drop and Create Tables (Schema)
    // We'll generate generic CREATE TABLE statements compatible with Postgres

    stream.write(`
-- PostgreSQL Seed File
-- Generated from SQLite

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_recipes;
DROP TABLE IF EXISTS product_option_links;
DROP TABLE IF EXISTS product_sizes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS option_groups;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE options (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  image_url TEXT,
  is_available INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  image_focus TEXT,
  crop_data TEXT
);

CREATE TABLE option_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_required INTEGER DEFAULT 0,
  max_select INTEGER DEFAULT 1
);

CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cost_per_gram REAL DEFAULT 0
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  description TEXT,
  image_url TEXT,
  is_available INTEGER DEFAULT 1,
  is_visible INTEGER DEFAULT 1
);

CREATE TABLE product_sizes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    size_name TEXT NOT NULL,
    price INTEGER NOT NULL
);

CREATE TABLE product_option_links (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    group_id INTEGER REFERENCES option_groups(id)
);

CREATE TABLE product_recipes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    ingredient_id INTEGER REFERENCES ingredients(id),
    quantity REAL NOT NULL,
    size_name TEXT
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT,
  total_amount INTEGER,
  status TEXT DEFAULT 'pending',
  items_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_number INTEGER
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_name TEXT,
    size_name TEXT,
    quantity INTEGER,
    price INTEGER,
    options_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`);

    // 2. Export Data
    let completed = 0;

    tables.forEach(table => {
        db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
            if (err) {
                console.error(`Error reading ${table}:`, err);
                return;
            }

            if (rows.length > 0) {
                stream.write(`\n-- Data for ${table}\n`);
                rows.forEach(row => {
                    const columns = Object.keys(row).join(', ');
                    const values = Object.values(row).map(v => {
                        if (v === null) return 'NULL';
                        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                        return v;
                    }).join(', ');
                    stream.write(`INSERT INTO ${table} (${columns}) VALUES (${values});\n`);
                });
            }

            completed++;
            if (completed === tables.length) {
                console.log("Export complete!");
                stream.end();
            }
        });
    });
});
