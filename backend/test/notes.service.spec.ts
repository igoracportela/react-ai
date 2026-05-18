import { NoteStatus } from '../src/database/entities/note-status.enum';
import { Note } from '../src/database/entities/note.entity';
import { NoteErrorCode, NoteValidationError } from '../src/notes/note.errors';
import { validateUploadedAudio } from '../src/notes/audio-validation';

describe('NoteValidationError', () => {
  it('rejects empty upload', () => {
    expect(() => validateUploadedAudio(undefined as unknown as Express.Multer.File)).toThrow(
      NoteValidationError,
    );
  });

  it('rejects zero-byte file', () => {
    expect(() =>
      validateUploadedAudio({
        size: 0,
        mimetype: 'audio/wav',
        originalname: 'empty.wav',
      } as Express.Multer.File),
    ).toThrow(NoteValidationError);
  });
});

describe('Note preview logic', () => {
  const buildPreview = (note: Partial<Note>): string => {
    if (note.status === NoteStatus.ERROR) {
      return note.errorMessage ?? 'Processing failed';
    }
    if (note.status === NoteStatus.PENDING || note.status === NoteStatus.PROCESSING) {
      return 'Processing…';
    }
    const source = note.processedNote ?? note.rawTranscription ?? '';
    return source.length > 120 ? `${source.slice(0, 120)}…` : source;
  };

  it('shows error message in preview when status is error', () => {
    expect(
      buildPreview({
        status: NoteStatus.ERROR,
        errorMessage: 'Transcription failed',
      }),
    ).toBe('Transcription failed');
  });

  it('truncates long processed note for list preview', () => {
    const long = 'a'.repeat(150);
    expect(
      buildPreview({
        status: NoteStatus.DONE,
        processedNote: long,
      }),
    ).toHaveLength(121);
  });
});

describe('NoteErrorCode', () => {
  it('defines stable codes for client handling', () => {
    expect(NoteErrorCode.EMPTY_TEXT).toBe('EMPTY_TEXT_INPUT');
    expect(NoteErrorCode.INVALID_AUDIO).toBe('INVALID_AUDIO_FILE');
  });
});
