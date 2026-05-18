import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { Note } from '../database/entities/note.entity';
import { NoteStatus } from '../database/entities/note-status.enum';
import { PatientsService } from '../patients/patients.service';
import { AiService } from '../ai/ai.service';
import { AiProcessingError } from '../ai/ai.errors';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteListItemDto, NoteResponseDto } from './dto/note-response.dto';
import { NoteErrorCode, NoteValidationError } from './note.errors';
import { validateAudioFileOnDisk, validateUploadedAudio } from './audio-validation';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectRepository(Note)
    private readonly noteRepo: Repository<Note>,
    private readonly patientsService: PatientsService,
    private readonly aiService: AiService,
  ) {}

  async findAll(): Promise<NoteListItemDto[]> {
    const notes = await this.noteRepo.find({
      relations: ['patient'],
      order: { createdAt: 'DESC' },
    });

    return notes.map((note) =>
      NoteResponseDto.fromEntity(note, this.buildPreview(note)) as NoteListItemDto,
    );
  }

  async findOne(id: string): Promise<NoteResponseDto> {
    const note = await this.noteRepo.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (!note) {
      throw new NotFoundException(`Note ${id} not found`);
    }
    return NoteResponseDto.fromEntity(note) as NoteResponseDto;
  }

  async createFromText(dto: CreateNoteDto): Promise<NoteResponseDto> {
    const text = dto.text?.trim();
    if (!text) {
      throw new NoteValidationError(
        'Clinical note text is required.',
        NoteErrorCode.EMPTY_TEXT,
      );
    }

    await this.patientsService.findOne(dto.patientId);
    const note = await this.createPendingNote(dto.patientId, 'text');

    return this.processNote(note.id, async (noteId) => {
      await this.noteRepo.update(noteId, { rawTranscription: text });
      const processedNote = await this.aiService.structureAsSoap(text);
      return { rawTranscription: text, processedNote };
    });
  }

  async createFromAudio(
    patientId: string,
    file: Express.Multer.File,
  ): Promise<NoteResponseDto> {
    validateUploadedAudio(file);
    await this.patientsService.findOne(patientId);

    const note = await this.createPendingNote(patientId, 'audio', file.filename);
    const filePath = join(process.env.UPLOAD_DIR ?? 'uploads', file.filename);

    return this.processNote(note.id, async (noteId) => {
      validateAudioFileOnDisk(filePath);
      const rawTranscription = await this.aiService.transcribeAudio(filePath);
      await this.noteRepo.update(noteId, { rawTranscription });

      const processedNote = await this.aiService.structureAsSoap(rawTranscription);
      return { rawTranscription, processedNote, audioPath: file.filename };
    });
  }

  private async createPendingNote(
    patientId: string,
    inputType: 'text' | 'audio',
    audioPath?: string,
  ): Promise<Note> {
    const note = this.noteRepo.create({
      patientId,
      status: NoteStatus.PENDING,
      inputType,
      audioPath: audioPath ?? null,
      rawTranscription: null,
      processedNote: null,
      errorCode: null,
      errorMessage: null,
    });
    return this.noteRepo.save(note);
  }

  private async processNote(
    noteId: string,
    work: (noteId: string) => Promise<{
      rawTranscription: string;
      processedNote: string;
      audioPath?: string;
    }>,
  ): Promise<NoteResponseDto> {
    await this.noteRepo.update(noteId, { status: NoteStatus.PROCESSING });

    try {
      const result = await work(noteId);
      await this.noteRepo.update(noteId, {
        status: NoteStatus.DONE,
        rawTranscription: result.rawTranscription,
        processedNote: result.processedNote,
        audioPath: result.audioPath ?? undefined,
        errorCode: null,
        errorMessage: null,
      });
    } catch (error) {
      const { code, message } = this.mapProcessingError(error);
      this.logger.warn(`Note ${noteId} failed: ${code} — ${message}`);

      await this.noteRepo.update(noteId, {
        status: NoteStatus.ERROR,
        errorCode: code,
        errorMessage: message,
      });
    }

    return this.findOne(noteId);
  }

  private mapProcessingError(error: unknown): { code: string; message: string } {
    if (error instanceof NoteValidationError) {
      return { code: error.code, message: error.message };
    }
    if (error instanceof AiProcessingError) {
      return { code: error.code, message: error.message };
    }
    return {
      code: 'PROCESSING_FAILED',
      message:
        'Note processing failed due to an unexpected error. Please try again or contact support if the problem persists.',
    };
  }

  private buildPreview(note: Note): string {
    if (note.status === NoteStatus.ERROR) {
      return note.errorMessage ?? 'Processing failed';
    }
    if (note.status === NoteStatus.PENDING || note.status === NoteStatus.PROCESSING) {
      return 'Processing…';
    }
    const source = note.processedNote ?? note.rawTranscription ?? '';
    return source.length > 120 ? `${source.slice(0, 120)}…` : source;
  }
}
