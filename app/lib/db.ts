import { DatabaseAdapter } from './db-adapter';

let dbInstance: DatabaseAdapter | null = null;

class DatabaseProxy implements DatabaseAdapter {
  async ensureInitialized() {
    if (dbInstance) return;

    const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    console.log(`Database: Initializing (Detected URL: ${pgUrl ? 'Present' : 'Missing'})`);

    if (pgUrl) {
      console.log('Database: Loading PostgresAdapter...');
      const { PostgresAdapter } = await import('./db-postgres');
      dbInstance = new PostgresAdapter();
      if (dbInstance.ensureTables) {
        console.log('Database: Ensuring tables exist...');
        await dbInstance.ensureTables();
      }
    } else {
      console.log('Database: Loading SqliteAdapter (Fallback)...');
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

