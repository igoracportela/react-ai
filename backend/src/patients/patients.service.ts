import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../database/entities/patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  findAll(): Promise<Patient[]> {
    return this.patientRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    return patient;
  }
}
