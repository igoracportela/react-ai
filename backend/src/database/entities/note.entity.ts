import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { NoteStatus } from './note-status.enum';

@Entity('notes')
@Index(['patientId', 'createdAt'])
@Index(['status'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, (patient) => patient.notes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @Column({
    type: 'enum',
    enum: NoteStatus,
    enumName: 'note_status_enum',
    default: NoteStatus.PENDING,
  })
  status!: NoteStatus;

  @Column({ name: 'input_type', length: 20 })
  inputType!: 'text' | 'audio';

  /** Verbatim transcription or typed input before AI structuring. */
  @Column({ name: 'raw_transcription', type: 'text', nullable: true })
  rawTranscription?: string | null;

  /** SOAP-structured / summarized clinical note (AI output). */
  @Column({ name: 'processed_note', type: 'text', nullable: true })
  processedNote?: string | null;

  @Column({ name: 'audio_path', type: 'varchar', length: 500, nullable: true })
  audioPath?: string | null;

  @Column({ name: 'error_code', type: 'varchar', length: 64, nullable: true })
  errorCode?: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
