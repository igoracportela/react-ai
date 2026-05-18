import { NOTE_STATUS_LABELS, NoteStatus } from '@/lib/api';

const STATUS_CLASS: Record<NoteStatus, string> = {
  pending: 'status-pending',
  processing: 'status-processing',
  done: 'status-done',
  error: 'status-error',
};

export function StatusBadge({ status }: { status: NoteStatus }) {
  return (
    <span className={`status-badge ${STATUS_CLASS[status]}`}>
      {NOTE_STATUS_LABELS[status]}
    </span>
  );
}
