import { closeSync, openSync, readSync, statSync } from 'fs';
import { NoteErrorCode, NoteValidationError } from './note.errors';

const MAX_BYTES = 25 * 1024 * 1024;

/** Magic-byte signatures for common audio containers */
const AUDIO_SIGNATURES: { bytes: number[]; offset?: number }[] = [
  { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF / WAV
  { bytes: [0x49, 0x44, 0x33] }, // ID3 / MP3
  { bytes: [0xff, 0xfb] }, // MP3 frame
  { bytes: [0xff, 0xf3] },
  { bytes: [0xff, 0xf2] },
  { bytes: [0x4f, 0x67, 0x67, 0x53] }, // Ogg
  { bytes: [0x66, 0x4c, 0x61, 0x43] }, // FLAC
  { bytes: [0x1a, 0x45, 0xdf, 0xa3] }, // WebM/Matroska
];

const ALLOWED_MIME_PREFIXES = ['audio/'];

export function validateUploadedAudio(file: Express.Multer.File): void {
  if (!file) {
    throw new NoteValidationError('No audio file was uploaded.', NoteErrorCode.INVALID_AUDIO);
  }

  if (file.size === 0) {
    throw new NoteValidationError('The uploaded audio file is empty.', NoteErrorCode.EMPTY_AUDIO);
  }

  if (file.size > MAX_BYTES) {
    throw new NoteValidationError(
      `Audio file exceeds the ${MAX_BYTES / (1024 * 1024)}MB limit.`,
      NoteErrorCode.AUDIO_TOO_LARGE,
    );
  }

  const mime = file.mimetype?.toLowerCase() ?? '';
  const allowedMime =
    ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p)) ||
    mime === 'application/octet-stream';

  if (!allowedMime) {
    throw new NoteValidationError(
      `Unsupported file type: ${mime || 'unknown'}. Please upload a standard audio recording.`,
      NoteErrorCode.UNSUPPORTED_AUDIO_TYPE,
    );
  }
}

export function validateAudioFileOnDisk(filePath: string): void {
  let size: number;
  try {
    size = statSync(filePath).size;
  } catch {
    throw new NoteValidationError(
      'The uploaded audio file could not be read. It may be corrupted or incomplete.',
      NoteErrorCode.INVALID_AUDIO,
    );
  }

  if (size === 0) {
    throw new NoteValidationError('The uploaded audio file is empty.', NoteErrorCode.EMPTY_AUDIO);
  }

  if (size > MAX_BYTES) {
    throw new NoteValidationError(
      `Audio file exceeds the ${MAX_BYTES / (1024 * 1024)}MB limit.`,
      NoteErrorCode.AUDIO_TOO_LARGE,
    );
  }

  const buffer = readHead(filePath, 12);
  const looksLikeAudio = AUDIO_SIGNATURES.some(({ bytes, offset = 0 }) =>
    bytes.every((byte, i) => buffer[offset + i] === byte),
  );

  if (!looksLikeAudio) {
    throw new NoteValidationError(
      'The file does not appear to be a valid audio recording. Please upload WAV, MP3, WebM, OGG, or M4A.',
      NoteErrorCode.INVALID_AUDIO,
    );
  }
}

function readHead(filePath: string, length: number): Buffer {
  const fd = openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    readSync(fd, buffer, 0, length, 0);
    return buffer;
  } finally {
    closeSync(fd);
  }
}
