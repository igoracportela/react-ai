import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findOne(id);
  }
}
