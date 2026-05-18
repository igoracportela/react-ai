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
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Clinical Notes</h1>
          <p className="page-subtitle">
            AI-generated notes associated with patients. Search, paginate, and click a row to open
            details.
          </p>
        </div>
        <Link href="/notes/new" className="btn btn-primary">
          + New Note
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!error && <NotesTable notes={notes} />}

      <Link href="/notes/new" className="fab" aria-label="New note">
        +
      </Link>
    </div>
  );
}
