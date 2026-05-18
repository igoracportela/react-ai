'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { TableColumn } from 'react-data-table-component';
import 'react-data-table-component/css';
import { api, NoteListItem } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

function MicIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zM6.5 10.5A5.5 5.5 0 0 0 12 16a5.5 5.5 0 0 0 5.5-5.5H19A7 7 0 0 1 13 17.93V21h-2v-3.07A7 7 0 0 1 5 10.5z" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 5H5v-2h2v2zm10 0H7v-2h10v2zm0-3h-2v-2h2v2zm0-3h-2V8h2v2zm3 6h-2v-2h2v2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#6B7280">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateFull(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type ContextMenuState = { noteId: string; x: number; y: number } | null;

type NotesTableProps = { notes: NoteListItem[] };

export function NotesTable({ notes }: NotesTableProps) {
  const router = useRouter();
  const [filterText, setFilterText] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoteListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilter(filterText);
      setResetPaginationToggle((v) => !v);
    }, 300);
    return () => clearTimeout(t);
  }, [filterText]);

  useEffect(() => {
    if (!contextMenu) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [contextMenu]);

  const filteredItems = useMemo(() => {
    const q = debouncedFilter.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      [n.patientName, n.preview, n.status, n.inputType, formatDateShort(n.createdAt)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [debouncedFilter, notes]);

  function openMenu(e: React.MouseEvent, note: NoteListItem) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 164;
    const x = Math.min(rect.left, window.innerWidth - menuWidth - 8);
    setContextMenu({ noteId: note.id, x, y: rect.bottom + 4 });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteNote(deleteTarget.id);
      router.refresh();
    } catch {
      // refresh anyway so stale state doesn't linger
      router.refresh();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const columns: TableColumn<NoteListItem>[] = [
    {
      name: <span className="th-label">Patient ↕</span>,
      selector: (row) => row.patientName,
      sortable: true,
      grow: 1.4,
      cell: (row) => (
        <div className="nt-patient-cell">
          <div className="nt-avatar" aria-hidden="true">
            {getInitials(row.patientName)}
            <span className={`nt-type-badge nt-type-${row.inputType}`}>
              {row.inputType === 'audio' ? <MicIcon /> : <KeyboardIcon />}
            </span>
          </div>
          <span className="nt-patient-name">{row.patientName}</span>
        </div>
      ),
    },
    {
      name: <span className="th-label">Status</span>,
      cell: (row) => <StatusBadge status={row.status} />,
      sortable: true,
      sortFunction: (a, b) => a.status.localeCompare(b.status),
      width: '120px',
    },
    {
      name: <span className="th-label">Created ↕</span>,
      selector: (row) => row.createdAt,
      sortable: true,
      width: '165px',
      cell: (row) => (
        <span className="nt-date" data-tooltip={formatDateFull(row.createdAt)}>
          {formatDateShort(row.createdAt)}
        </span>
      ),
    },
    {
      name: <span className="th-label">Preview</span>,
      selector: (row) => row.preview,
      grow: 2.5,
      cell: (row) => <span className="nt-preview">{row.preview}</span>,
    },
    {
      name: '',
      width: '72px',
      cell: (row) => (
        <div className="nt-actions" onClick={(e) => e.stopPropagation()}>
          <span className="nt-chevron">
            <ChevronRightIcon />
          </span>
          <button className="nt-menu-btn" aria-label="Note actions" onClick={(e) => openMenu(e, row)}>
            <DotsIcon />
          </button>
        </div>
      ),
    },
  ];

  const customStyles = {
    table: { style: { backgroundColor: 'transparent' } },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        minHeight: '48px',
      },
    },
    headCells: {
      style: {
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        color: '#374151',
        paddingLeft: '12px',
        paddingRight: '12px',
      },
    },
    rows: {
      style: {
        minHeight: '64px',
        fontSize: '0.9rem',
        cursor: 'pointer',
        borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.1s',
      },
      highlightOnHoverStyle: {
        backgroundColor: '#F0FDFA',
        borderColor: '#ccfbf1',
        outline: 'none',
      },
    },
    cells: {
      style: { paddingLeft: '12px', paddingRight: '12px' },
    },
    pagination: {
      style: { borderTop: '1px solid #e2e8f0', minHeight: '52px' },
    },
  };

  const menuNote = contextMenu ? notes.find((n) => n.id === contextMenu.noteId) : null;

  return (
    <>
      <div className="card notes-table-card">
        <div className="notes-table-toolbar">
          <div className="nt-search-wrap">
            <span className="nt-search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              className="nt-search-input"
              placeholder="Search patient, preview, status…"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              aria-label="Search notes"
            />
            {filterText && (
              <button className="nt-search-clear" aria-label="Clear search" onClick={() => setFilterText('')}>
                ✕
              </button>
            )}
          </div>
          <span className="notes-table-count meta-line">
            {filteredItems.length} of {notes.length} notes
          </span>
        </div>

        {debouncedFilter && (
          <div className="nt-filter-chips">
            <span className="nt-chip">
              &ldquo;{debouncedFilter}&rdquo;
              <button onClick={() => setFilterText('')} aria-label="Remove filter">
                ✕
              </button>
            </span>
          </div>
        )}

        <DataTable
          columns={columns}
          data={filteredItems}
          customStyles={customStyles}
          pagination
          paginationResetDefaultPage={resetPaginationToggle}
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20, 50]}
          paginationComponentOptions={{ rowsPerPageText: 'Rows:', rangeSeparatorText: 'of' }}
          persistTableHead
          highlightOnHover
          pointerOnHover
          responsive
          onRowClicked={(row) => router.push(`/notes/${row.id}`)}
          noDataComponent={
            <div className="nt-empty">
              <ClipboardIcon />
              <p className="nt-empty-title">No notes found</p>
              <p className="nt-empty-sub">
                {debouncedFilter
                  ? 'Try adjusting your search or clear the filter.'
                  : 'Create your first note to get started.'}
              </p>
              {!debouncedFilter && (
                <a href="/notes/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  + New Note
                </a>
              )}
            </div>
          }
        />
      </div>

      {contextMenu && menuNote && (
        <div
          ref={menuRef}
          className="nt-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              router.push(`/notes/${menuNote.id}`);
              setContextMenu(null);
            }}
          >
            View
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(menuNote.preview).catch(() => {});
              setContextMenu(null);
            }}
          >
            Copy note
          </button>
          <button
            className="nt-menu-danger"
            onClick={() => {
              setDeleteTarget(menuNote);
              setContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}

      {deleteTarget && (
        <div className="nt-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="nt-modal-title">Delete note?</h3>
            <p className="nt-modal-body">
              This will permanently delete the note for <strong>{deleteTarget.patientName}</strong>.
              This action cannot be undone.
            </p>
            <div className="nt-modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
