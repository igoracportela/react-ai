'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { TableColumn } from 'react-data-table-component';
import 'react-data-table-component/css';
import { NoteListItem } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const columns: TableColumn<NoteListItem>[] = [
  {
    name: 'Patient',
    selector: (row) => row.patientName,
    sortable: true,
    grow: 1.2,
  },
  {
    name: 'Status',
    cell: (row) => <StatusBadge status={row.status} />,
    sortable: true,
    sortFunction: (a, b) => a.status.localeCompare(b.status),
    width: '130px',
  },
  {
    name: 'Created',
    selector: (row) => row.createdAt,
    format: (row) => formatDate(row.createdAt),
    sortable: true,
    width: '180px',
  },
  {
    name: 'Type',
    selector: (row) => row.inputType,
    sortable: true,
    width: '90px',
    cell: (row) => <span className="badge">{row.inputType}</span>,
  },
  {
    name: 'Preview',
    selector: (row) => row.preview,
    grow: 2,
    wrap: true,
    cell: (row) => (
      <span className="notes-table-preview" title={row.preview}>
        {row.preview}
      </span>
    ),
  },
];

const customStyles = {
  table: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  headRow: {
    style: {
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      minHeight: '48px',
    },
  },
  headCells: {
    style: {
      fontSize: '0.8rem',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
      color: '#64748b',
    },
  },
  rows: {
    style: {
      minHeight: '56px',
      fontSize: '0.92rem',
      cursor: 'pointer',
    },
    highlightOnHoverStyle: {
      backgroundColor: '#f0fdfa',
    },
  },
  pagination: {
    style: {
      borderTop: '1px solid #e2e8f0',
      minHeight: '52px',
    },
  },
};

type NotesTableProps = {
  notes: NoteListItem[];
};

export function NotesTable({ notes }: NotesTableProps) {
  const router = useRouter();
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const filteredItems = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter((note) => {
      const haystack = [
        note.patientName,
        note.preview,
        note.status,
        note.inputType,
        note.errorMessage ?? '',
        formatDate(note.createdAt),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [filterText, notes]);

  return (
    <div className="card notes-table-card">
      <div className="notes-table-toolbar">
        <label className="notes-table-search">
          <span className="sr-only">Search notes</span>
          <input
            type="search"
            placeholder="Search patient, preview, status, type…"
            value={filterText}
            onChange={(e) => {
              setResetPaginationToggle((v) => !v);
              setFilterText(e.target.value);
            }}
          />
        </label>
        {filterText && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFilterText('');
              setResetPaginationToggle((v) => !v);
            }}
          >
            Clear
          </button>
        )}
        <span className="notes-table-count meta-line">
          {filteredItems.length} of {notes.length} notes
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        customStyles={customStyles}
        pagination
        paginationResetDefaultPage={resetPaginationToggle}
        paginationPerPage={10}
        paginationRowsPerPageOptions={[5, 10, 15, 20, 50]}
        paginationComponentOptions={{
          rowsPerPageText: 'Rows per page:',
          rangeSeparatorText: 'of',
        }}
        persistTableHead
        highlightOnHover
        pointerOnHover
        responsive
        onRowClicked={(row) => router.push(`/notes/${row.id}`)}
        noDataComponent={
          <p className="notes-table-empty">
            {filterText ? 'No notes match your search.' : 'No notes yet.'}
          </p>
        }
      />
    </div>
  );
}
