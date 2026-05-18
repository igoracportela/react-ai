export enum AiErrorCode {
  SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  STRUCTURING_FAILED = 'STRUCTURING_FAILED',
  INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
}

export class AiProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiProcessingError';
  }
}
