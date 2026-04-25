import { useEffect } from 'react';

/**
 * Generic detail modal opened by clicking a KPI card. Centered, scrollable,
 * Esc-to-close. Body content is provided by the caller — typically a table
 * or a list of rows.
 *
 * Used by TeachersView to surface drill-down data for the 4 top KPIs:
 * My Classes, Attendance, Avg Score, Pending Reviews.
 */

interface KpiDetailModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function KpiDetailModal({ open, title, subtitle, children, onClose }: KpiDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9999, animation: 'kpiFade 0.2s ease',
        }}
      />
      <div
        role="dialog"
        aria-label={title}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff', borderRadius: 20, padding: 26,
          width: 720, maxWidth: '93vw', maxHeight: '82vh',
          overflowY: 'auto', zIndex: 10000,
          boxShadow: '0 24px 64px rgba(0,0,0,.18)',
          animation: 'kpiPop 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16,
          paddingBottom: 14, borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: 0, fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 700,
              color: '#1A1A1A', lineHeight: 1.2,
            }}>{title}</h2>
            {subtitle && (
              <p style={{
                margin: '6px 0 0', fontSize: 12, color: '#64748b',
              }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 10, border: 'none',
              background: '#f1f5f9', color: '#475569', cursor: 'pointer',
              fontSize: 18, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes kpiFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes kpiPop {
          from { transform: translate(-50%, -45%) scale(0.97); opacity: 0; }
          to   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Reusable row primitives for KPI tables ─────────────────────────────────

export function KpiTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={{
              textAlign: 'left', padding: '10px 12px',
              fontFamily: '"Roboto Mono", monospace', fontSize: 10,
              fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase',
              letterSpacing: '0.08em', borderBottom: '1px solid #f1f5f9',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <tr style={{ borderBottom: '1px solid #f8fafc' }}>{children}</tr>
  );
}

export function KpiCell({
  children, color, bold, mono, align = 'left',
}: {
  children: React.ReactNode;
  color?: string;
  bold?: boolean;
  mono?: boolean;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <td style={{
      padding: '12px',
      color: color ?? '#334155',
      fontWeight: bold ? 700 : 500,
      fontFamily: mono ? '"Roboto Mono", monospace' : undefined,
      textAlign: align,
    }}>{children}</td>
  );
}

export function KpiPill({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, background: bg, color: fg,
      fontSize: 11, fontWeight: 600, display: 'inline-block',
    }}>{children}</span>
  );
}

export function KpiBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`,
          background: color, borderRadius: 3, transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        minWidth: 36, fontSize: 11, color: '#64748b',
        fontFamily: '"Roboto Mono", monospace', textAlign: 'right',
      }}>{pct}%</span>
    </div>
  );
}
