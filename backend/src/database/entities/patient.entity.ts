import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Note } from './note.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'external_id', length: 50 })
  externalId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth!: string;

  @Column({ length: 20, nullable: true })
  gender?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'phone_number', length: 30, nullable: true })
  phoneNumber?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Note, (note) => note.patient)
  notes!: Note[];
}
