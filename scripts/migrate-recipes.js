const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('matcha.db');

db.serialize(() => {
    console.log("Migrating Recipes Schema...");

    // Ingredients Table
    db.run(`CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cost_per_gram REAL NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log("Verified 'ingredients' table.");

    // Product Recipes Table
    db.run(`CREATE TABLE IF NOT EXISTS product_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        ingredient_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY(ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    )`);
    console.log("Verified 'product_recipes' table.");
});
