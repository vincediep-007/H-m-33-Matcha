export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  run(sql: string, params?: any[]): Promise<{ id?: number | string }>;
  ensureTables?: () => Promise<void>;
}

