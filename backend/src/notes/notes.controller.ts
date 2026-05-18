import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll() {
    return this.notesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('audio'))
  async create(
    @Body() dto: CreateNoteDto,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (audio) {
      return this.notesService.createFromAudio(dto.patientId, audio);
    }
    return this.notesService.createFromText(dto);
  }
}
