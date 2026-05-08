export function PageHeadSkeleton({ withSub = true }: { withSub?: boolean }) {
  return (
    <div className="cw-page-head">
      <div className="cw-skel" style={{ height: 36, width: 180, marginBottom: 8 }} />
      {withSub && <div className="cw-skel" style={{ height: 16, width: 320 }} />}
    </div>
  );
}

export function StatsBarSkeleton() {
  return (
    <div className="cw-stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="cw-stat">
          <div className="cw-skel" style={{ height: 32, width: 56, marginBottom: 8 }} />
          <div className="cw-skel" style={{ height: 11, width: 80 }} />
        </div>
      ))}
    </div>
  );
}

export function VideoRowSkeleton() {
  return (
    <div className="cw-video">
      <div className="cw-skel" style={{ width: 18, height: 18, borderRadius: 4 }} />
      <div className="cw-skel cw-thumb" style={{ borderRadius: 6 }} />
      <div className="cw-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="cw-skel" style={{ height: 16, width: '70%' }} />
        <div className="cw-skel" style={{ height: 12, width: '40%' }} />
        <div className="cw-skel" style={{ height: 12, width: '55%' }} />
      </div>
      <div className="cw-actions" style={{ display: 'flex', gap: 8 }}>
        <div className="cw-skel" style={{ width: 24, height: 24, borderRadius: 6 }} />
        <div className="cw-skel" style={{ width: 24, height: 24, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export function ThreadCardSkeleton() {
  return (
    <div className="cw-thread-card">
      <div className="cw-thread-head">
        <div className="cw-skel" style={{ width: 36, height: 24, borderRadius: 6 }} />
        <div className="cw-thread-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="cw-skel" style={{ height: 16, width: '50%' }} />
          <div className="cw-skel" style={{ height: 12, width: '80%' }} />
          <div className="cw-thread-thumbs" style={{ marginTop: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="cw-skel" style={{ width: 64, height: 36, borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsRowSkeleton() {
  return (
    <div className="cw-source">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="cw-skel" style={{ height: 14, width: '60%' }} />
        <div className="cw-skel" style={{ height: 11, width: '35%' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="cw-skel" style={{ width: 28, height: 28, borderRadius: 6 }} />
        <div className="cw-skel" style={{ width: 28, height: 28, borderRadius: 6 }} />
      </div>
    </div>
  );
}
