import Link from 'next/link';
import { api } from '@/lib/api';
import { NotesTable } from '@/components/NotesTable';

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  let notes: Awaited<ReturnType<typeof api.getNotes>> = [];
  let error: string | null = null;

  try {
    notes = await api.getNotes();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load notes';
  }

  return (
    <div className="container">
      <h1 className="page-title">Clinical Notes</h1>
      <p className="page-subtitle">
        AI-generated notes associated with patients. Search, paginate, and click a row to
        open details.
      </p>

      <p style={{ marginBottom: '1rem' }}>
        <Link href="/notes/new" className="btn btn-primary">
          + New Note
        </Link>
      </p>

      {error && <div className="error-banner">{error}</div>}

      {!error && notes.length === 0 && (
        <div className="card empty-state">
          <p>No notes yet.</p>
          <p style={{ marginTop: '0.5rem' }}>
            <Link href="/notes/new">Create your first note</Link>
          </p>
        </div>
      )}

      {!error && notes.length > 0 && <NotesTable notes={notes} />}
    </div>
  );
}
