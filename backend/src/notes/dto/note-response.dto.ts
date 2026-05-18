import { Note } from '../../database/entities/note.entity';
import { NoteStatus } from '../../database/entities/note-status.enum';
import { PatientSummaryDto } from './patient-summary.dto';

export class NoteListItemDto {
  id!: string;
  patientId!: string;
  patientName!: string;
  status!: NoteStatus;
  preview!: string;
  inputType!: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class NoteResponseDto {
  id!: string;
  patientId!: string;
  patient!: PatientSummaryDto;
  status!: NoteStatus;
  inputType!: 'text' | 'audio';
  rawTranscription?: string | null;
  processedNote?: string | null;
  audioPath?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(note: Note, preview?: string): NoteResponseDto | NoteListItemDto {
    const base = {
      id: note.id,
      patientId: note.patientId,
      status: note.status,
      inputType: note.inputType,
      errorCode: note.errorCode ?? null,
      errorMessage: note.errorMessage ?? null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };

    if (preview !== undefined && !note.patient) {
      return { ...base, patientName: '', preview } as NoteListItemDto;
    }

    if (preview !== undefined) {
      return {
        ...base,
        patientName: note.patient.name,
        preview,
      } as NoteListItemDto;
    }

    return {
      ...base,
      patient: PatientSummaryDto.fromEntity(note.patient),
      rawTranscription: note.rawTranscription ?? null,
      processedNote: note.processedNote ?? null,
      audioPath: note.audioPath ?? null,
    } as NoteResponseDto;
  }
}
