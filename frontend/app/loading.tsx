export default function Loading() {
  return (
    <div className="container">
      <div className="skeleton" style={{ height: 28, width: 180, marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ height: 16, width: 340, marginBottom: '1.5rem' }} />
      <div className="skeleton" style={{ height: 38, width: 120, borderRadius: 8, marginBottom: '1.25rem' }} />
      <div className="card notes-table-card">
        <div className="notes-table-toolbar" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div className="skeleton" style={{ height: 38, flex: 1, minWidth: 220, borderRadius: 8 }} />
        </div>
        {[60, 45, 70, 50, 65].map((w, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton-circle" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton skeleton-line" style={{ width: `${w}%` }} />
              <div className="skeleton skeleton-line" style={{ width: `${w - 15}%` }} />
            </div>
            <div className="skeleton skeleton-line" style={{ width: 72 }} />
            <div className="skeleton skeleton-line" style={{ width: 130 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
