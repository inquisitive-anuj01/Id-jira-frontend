export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: 6 }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card ${className}`} style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="60%" height={12} />
          <div style={{ marginTop: 6 }}>
            <SkeletonLine width="40%" height={10} />
          </div>
        </div>
      </div>
      <SkeletonLine height={12} style={{ marginBottom: 8 }} />
      <SkeletonLine width="80%" height={12} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5].map(i => (
        <td key={i} style={{ padding: '10px 12px' }}>
          <div className="skeleton" style={{ height: 12, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <SkeletonLine width="60%" height={9} />
      <div style={{ marginTop: 8 }}>
        <SkeletonLine width="40%" height={26} />
      </div>
      <div style={{ marginTop: 6 }}>
        <SkeletonLine width="55%" height={9} />
      </div>
    </div>
  );
}
