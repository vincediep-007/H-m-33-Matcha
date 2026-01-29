import { DatabaseAdapter } from './db-adapter';
import { SqliteAdapter } from './db-sqlite';
import { PostgresAdapter } from './db-postgres';

let db: DatabaseAdapter;

const isPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (isPostgres) {
  console.log('Database: Initializing PostgresAdapter');
  db = new PostgresAdapter();
} else {
  console.log('Database: Initializing SqliteAdapter');
  db = new SqliteAdapter();
}

export default db;
