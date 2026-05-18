import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { PatientsModule } from './patients/patients.module';
import { NotesModule } from './notes/notes.module';
import { AiModule } from './ai/ai.module';
import { Patient } from './database/entities/patient.entity';
import { SeedService } from './database/seed.service';
import { getDatabaseConfig } from './database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '..', '.env'),
        join(__dirname, '..', '.env'),
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getDatabaseConfig(config),
    }),
    TypeOrmModule.forFeature([Patient]),
    PatientsModule,
    NotesModule,
    AiModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
