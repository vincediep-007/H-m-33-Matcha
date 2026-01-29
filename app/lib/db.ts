import { DatabaseAdapter } from './db-adapter';

let dbInstance: DatabaseAdapter | null = null;

class DatabaseProxy implements DatabaseAdapter {
  async ensureInitialized() {
    if (dbInstance) return;

    const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION;

    console.log(`DB Init: Environment=${isVercel ? 'Vercel' : 'Local'}, URL=${pgUrl ? 'Detected' : 'Missing'}`);

    if (pgUrl) {
      console.log('DB Init: Loading PostgresAdapter...');
      const { PostgresAdapter } = await import('./db-postgres');
      dbInstance = new PostgresAdapter();
      if (dbInstance.ensureTables) {
        console.log('DB Init: Ensuring tables exist...');
        await dbInstance.ensureTables();
      }
    } else if (isVercel) {
      // CRITICAL: We should NEVER use SQLite on Vercel
      throw new Error('DATABASE ERROR: Environment is Vercel but no POSTGRES_URL was found. Please check your Vercel Environment Variables.');
    } else {
      console.log('DB Init: Loading SqliteAdapter (Local Only)...');
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

