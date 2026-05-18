import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, ApiError, NoteDetail } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let note: NoteDetail;
  let loadError: string | null = null;

  try {
    note = await api.getNote(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
    loadError = e instanceof Error ? e.message : 'Failed to load note';
    return (
      <div className="container">
        <p style={{ marginBottom: '1rem' }}>
          <Link href="/">← Back to notes</Link>
        </p>
        <div className="error-banner">{loadError}</div>
      </div>
    );
  }

  const patient = note.patient;
  const isError = note.status === 'error';
  const isProcessing = note.status === 'pending' || note.status === 'processing';

  return (
    <div className="container">
      <p style={{ marginBottom: '1rem' }}>
        <Link href="/">← Back to notes</Link>
      </p>

      <h1 className="page-title">Clinical note</h1>
      <p className="page-subtitle">
        <StatusBadge status={note.status} /> · {note.inputType} · Created{' '}
        {formatDate(note.createdAt)}
        {note.updatedAt !== note.createdAt && (
          <> · Updated {formatDate(note.updatedAt)}</>
        )}
      </p>

      {isError && (
        <div className="error-banner" role="alert">
          <strong>Processing failed</strong>
          {note.errorCode && (
            <p className="meta-line" style={{ marginTop: '0.35rem' }}>
              Code: {note.errorCode}
            </p>
          )}
          <p style={{ marginTop: '0.5rem' }}>
            {note.errorMessage ??
              'This note could not be transcribed or structured. You may retry by creating a new note.'}
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="warning-banner">
          This note is still being processed. Refresh the page in a moment.
        </div>
      )}

      {note.status === 'done' && (
        <div className="warning-banner">
          AI-generated content requires clinician review before clinical use. Do not treat
          as a final medical record.
        </div>
      )}

      <div className="detail-layout">
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Processed note (SOAP)</h2>
          {note.processedNote ? (
            <div className="raw-block">{note.processedNote}</div>
          ) : (
            <p className="meta-line">No processed note available for this status.</p>
          )}

          <h2 style={{ fontSize: '1.1rem', margin: '1.5rem 0 0.5rem' }}>Raw transcription</h2>
          {note.rawTranscription ? (
            <div className="raw-block">{note.rawTranscription}</div>
          ) : (
            <p className="meta-line">
              No raw transcription — processing did not complete successfully.
            </p>
          )}
        </div>

        <aside className="card patient-panel">
          <h2>Patient</h2>
          <p className="meta-line" style={{ marginBottom: '0.75rem' }}>
            Demographics only — clinical content is stored on the note record.
          </p>
          <div className="patient-field">
            <strong>Name</strong>
            {patient.name}
          </div>
          <div className="patient-field">
            <strong>Medical record ID</strong>
            {patient.externalId}
          </div>
          <div className="patient-field">
            <strong>Date of birth</strong>
            {patient.dateOfBirth}
          </div>
          {patient.gender && (
            <div className="patient-field">
              <strong>Gender</strong>
              {patient.gender}
            </div>
          )}
          {patient.phoneNumber && (
            <div className="patient-field">
              <strong>Phone</strong>
              {patient.phoneNumber}
            </div>
          )}
          {patient.address && (
            <div className="patient-field">
              <strong>Address</strong>
              {patient.address}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
