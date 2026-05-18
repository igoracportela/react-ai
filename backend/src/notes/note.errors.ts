export enum NoteErrorCode {
  INVALID_AUDIO = 'INVALID_AUDIO_FILE',
  EMPTY_AUDIO = 'EMPTY_AUDIO_FILE',
  EMPTY_TEXT = 'EMPTY_TEXT_INPUT',
  AUDIO_TOO_LARGE = 'AUDIO_FILE_TOO_LARGE',
  UNSUPPORTED_AUDIO_TYPE = 'UNSUPPORTED_AUDIO_TYPE',
}

export class NoteValidationError extends Error {
  constructor(
    message: string,
    public readonly code: NoteErrorCode,
  ) {
    super(message);
    this.name = 'NoteValidationError';
  }
}
