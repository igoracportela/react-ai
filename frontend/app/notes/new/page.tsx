'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, Patient } from '@/lib/api';

type InputMode = 'text' | 'audio';

export default function NewNotePage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPatients()
      .then((list) => {
        setPatients(list);
        if (list.length > 0) setPatientId(list[0].id);
      })
      .catch(() => setError('Could not load patients. Is the API running?'));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setError('Please select a patient');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const note =
        mode === 'audio' && audioFile
          ? await api.createNoteFromAudio(patientId, audioFile)
          : await api.createNoteFromText(patientId, text);

      router.push(`/notes/${note.id}`);
      if (note.status === 'error') {
        return;
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to create note';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">New Clinical Note</h1>
      <p className="page-subtitle">
        Select a patient and provide typed text or upload an audio recording for AI processing.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="patient">Patient</label>
            <select
              id="patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.externalId})
                </option>
              ))}
            </select>
          </div>

          <div className="tabs">
            <button
              type="button"
              className={`tab ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
            >
              Free text
            </button>
            <button
              type="button"
              className={`tab ${mode === 'audio' ? 'active' : ''}`}
              onClick={() => setMode('audio')}
            >
              Audio upload
            </button>
          </div>

          {mode === 'text' ? (
            <div className="form-group">
              <label htmlFor="text">Clinical note text</label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter visit notes, symptoms, vitals, plan..."
                required={mode === 'text'}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="audio">Audio file</label>
              <input
                id="audio"
                type="file"
                accept="audio/*,.wav,.mp3,.webm,.ogg,.m4a"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                required={mode === 'audio'}
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
                Supported: WAV, MP3, WebM, OGG, M4A (max 25MB). Audio is transcribed then structured as SOAP.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing…' : 'Submit note'}
            </button>
            <Link href="/" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
