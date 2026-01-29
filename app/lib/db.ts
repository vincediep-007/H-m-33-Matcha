import { DatabaseAdapter } from './db-adapter';

let dbInstance: DatabaseAdapter | null = null;

const isPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;

class DatabaseProxy implements DatabaseAdapter {
  async ensureInitialized() {
    if (dbInstance) return;

    if (isPostgres) {
      console.log('Database: Loading PostgresAdapter...');
      const { PostgresAdapter } = await import('./db-postgres');
      dbInstance = new PostgresAdapter();
      if (dbInstance.ensureTables) await dbInstance.ensureTables();
    } else {
      console.log('Database: Loading SqliteAdapter...');
      const { SqliteAdapter } = await import('./db-sqlite');
      dbInstance = new SqliteAdapter();
    }
  }

  async query<T = any>(text: string, params: any[] = []): Promise<T[]> {
    await this.ensureInitialized();
    return dbInstance!.query<T>(text, params);
  }

  async run(text: string, params: any[] = []): Promise<{ id?: number | string }> {
    await this.ensureInitialized();
    return dbInstance!.run(text, params);
  }
}

const db = new DatabaseProxy();
export default db;

