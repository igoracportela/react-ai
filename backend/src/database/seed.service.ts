import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';

const SEED_PATIENTS: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[] = [
  {
    externalId: 'MRN-10001',
    name: 'Maria Silva',
    dateOfBirth: '1958-03-14',
    gender: 'Female',
    address: '123 Oak Street, Austin, TX',
    phoneNumber: '+1-512-555-0101',
  },
  {
    externalId: 'MRN-10002',
    name: 'James Carter',
    dateOfBirth: '1972-11-02',
    gender: 'Male',
    address: '456 Maple Ave, Austin, TX',
    phoneNumber: '+1-512-555-0102',
  },
  {
    externalId: 'MRN-10003',
    name: 'Elena Rodriguez',
    dateOfBirth: '1985-07-28',
    gender: 'Female',
    address: '789 Pine Rd, Round Rock, TX',
    phoneNumber: '+1-512-555-0103',
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.patientRepo.count();
    if (count > 0) {
      this.logger.log(`Database already has ${count} patient(s), skipping seed`);
      return;
    }

    await this.patientRepo.save(SEED_PATIENTS);
    this.logger.log(`Seeded ${SEED_PATIENTS.length} mock patients`);
  }
}
