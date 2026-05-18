import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;
}
