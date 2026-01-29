const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../matcha.db');
const db = new sqlite3.Database(dbPath);
const outputPath = path.resolve(__dirname, 'schema_dump.txt');

async function run() {
    return new Promise((resolve) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, tables) => {
            if (err) {
                fs.appendFileSync(outputPath, err.toString());
                resolve();
                return;
            }

            let output = `Found ${tables.length} tables.\n`;
            let completed = 0;
            if (tables.length === 0) resolve();

            tables.forEach(table => {
                db.all(`PRAGMA table_info("${table.name}")`, [], (err, columns) => {
                    if (err) {
                        output += `Error reading ${table.name}: ${err}\n`;
                    } else {
                        output += `\nTable: ${table.name}\n`;
                        columns.forEach(col => {
                            output += `  - ${col.name} (${col.type})\n`;
                        });
                    }
                    completed++;
                    if (completed === tables.length) {
                        fs.writeFileSync(outputPath, output);
                        resolve();
                    }
                });
            });
        });
    });
}

run().then(() => {
    db.close();
});
