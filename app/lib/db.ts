import { DatabaseAdapter } from './db-adapter';
import { SqliteAdapter } from './db-sqlite';
import { PostgresAdapter } from './db-postgres';

let db: DatabaseAdapter;

if (process.env.POSTGRES_URL) {
  db = new PostgresAdapter();
} else {
  db = new SqliteAdapter();
}

export default db;