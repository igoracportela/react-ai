/**
 * Browser calls the public API URL (host machine).
 * Server components in Docker must use API_INTERNAL_URL (Docker service name).
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  }
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api'
  );
}

export type NoteStatus = 'pending' | 'processing' | 'done' | 'error';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Patient {
  id: string;
  externalId: string;
  name: string;
  dateOfBirth: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteListItem {
  id: string;
  patientId: string;
  patientName: string;
  status: NoteStatus;
  preview: string;
  inputType: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDetail {
  id: string;
  patientId: string;
  patient: Patient;
  status: NoteStatus;
  rawTranscription?: string | null;
  processedNote?: string | null;
  audioPath?: string | null;
  inputType: 'text' | 'audio';
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorBody {
  message?: string | string[];
  errorCode?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    let errorCode: string | undefined;
    try {
      const body = (await res.json()) as ApiErrorBody;
      const raw = body.message;
      message = Array.isArray(raw) ? raw.join(', ') : raw ?? message;
      errorCode = body.errorCode;
    } catch {
      message = (await res.text()) || message;
    }
    throw new ApiError(message, res.status, errorCode);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getPatients: () => request<Patient[]>('/patients'),
  getPatient: (id: string) => request<Patient>(`/patients/${id}`),
  getNotes: () => request<NoteListItem[]>('/notes'),
  getNote: (id: string) => request<NoteDetail>(`/notes/${id}`),
  createNoteFromText: (patientId: string, text: string) =>
    request<NoteDetail>('/notes', {
      method: 'POST',
      body: JSON.stringify({ patientId, text }),
    }),
  createNoteFromAudio: (patientId: string, audio: File) => {
    const form = new FormData();
    form.append('patientId', patientId);
    form.append('audio', audio);
    return request<NoteDetail>('/notes', { method: 'POST', body: form });
  },
};

export const NOTE_STATUS_LABELS: Record<NoteStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  done: 'Complete',
  error: 'Failed',
};
