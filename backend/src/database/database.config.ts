import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { Patient } from './entities/patient.entity';
import { Note } from './entities/note.entity';

export function getDatabaseConfig(config?: ConfigService): TypeOrmModuleOptions {
  const env = (key: string, fallback: string) =>
    config?.get<string>(key) ?? process.env[key] ?? fallback;

  const database = env('DB_NAME', 'ai_scribe_db');
  const migrationsPath = join(__dirname, 'migrations', '*.{js,ts}');

  const shared = {
    type: 'postgres' as const,
    entities: [Patient, Note],
    migrations: [migrationsPath],
    migrationsRun: true,
    synchronize: false,
    logging: env('NODE_ENV', 'development') === 'development',
  };

  const url = env('DATABASE_URL', '').trim();
  if (url) {
    try {
      const parsed = new URL(url);
      const pathDb = parsed.pathname.replace(/^\//, '').split('?')[0];
      return {
        ...shared,
        host: parsed.hostname,
        port: parseInt(parsed.port || '5432', 10),
        username: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: pathDb || database,
      };
    } catch {
      // fall through
    }
  }

  return {
    ...shared,
    host: env('DB_HOST', 'localhost'),
    port: parseInt(env('DB_PORT', '5432'), 10),
    username: env('DB_USER', 'scribe_user'),
    password: env('DB_PASSWORD', 'scribe_pass'),
    database,
  };
}
