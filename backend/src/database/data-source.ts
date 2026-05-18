import { DataSource } from 'typeorm';
import { join } from 'path';
import { Patient } from './entities/patient.entity';
import { Note } from './entities/note.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'scribe_user',
  password: process.env.DB_PASSWORD ?? 'scribe_pass',
  database: process.env.DB_NAME ?? 'ai_scribe_db',
  entities: [Patient, Note],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});
