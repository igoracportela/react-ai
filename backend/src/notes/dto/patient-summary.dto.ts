import { Patient } from '../../database/entities/patient.entity';

/** Patient fields exposed to clients — never mixed with note clinical content. */
export class PatientSummaryDto {
  id!: string;
  externalId!: string;
  name!: string;
  dateOfBirth!: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(patient: Patient): PatientSummaryDto {
    return {
      id: patient.id,
      externalId: patient.externalId,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      phoneNumber: patient.phoneNumber,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
    };
  }
}
