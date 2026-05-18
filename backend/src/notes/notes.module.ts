import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '../database/entities/note.entity';
import { PatientsModule } from '../patients/patients.module';
import { AiModule } from '../ai/ai.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

@Module({
  imports: [
    TypeOrmModule.forFeature([Note]),
    PatientsModule,
    AiModule,
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const unique = `${uuidv4()}${extname(file.originalname) || '.webm'}`;
          cb(null, unique);
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
          cb(null, true);
        } else {
          cb(new Error('Only audio files are allowed'), false);
        }
      },
    }),
  ],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
