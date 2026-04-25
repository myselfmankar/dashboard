import { useEffect, useState } from 'react';
import type { StudentDetail, AlertEntry } from '../types';
import { api } from '../api';
import { generateRealtimeAi, clearRealtimeAiCache } from '../lib/realtimeAi';

/**
 * Student Detail side-panel — slides in from the right when a heatmap cell is
 * clicked. Layout mirrors the prototype's Pen Analytics panel:
 *
 *   ┌── Header: avatar · name · grade · pen-id · tier badge ──┐
 *   │  [PEN BEHAVIOUR · TODAY'S SESSION]                       │
 *   │  ┌──┐ ┌──┐ ┌──┐ ┌──┐                                     │
 *   │  │  │ │  │ │  │ │  │  Hesitation / Cross-outs / Speed   │
 *   │  └──┘ └──┘ └──┘ └──┘  drop / Pages                       │
 *   │  Session timeline ──── 3-segment bar                     │
 *   │  ┌── NOTIVO AI ──────────────────────────────────────┐  │
 *   │  │ ✨ Real-time evoSummary                            │  │
 *   │  └────────────────────────────────────────────────────┘  │
 *   │  AI Improvement Plan / Strengths / Weak topics          │
 *   │  Subject performance / Live Alert Feed                  │
 *   └──────────────────────────────────────────────────────────┘
 *
 * AI copy (goodAt / improvementPlan / evoSummary) is regenerated in real
 * time via Gemini on every open. The cached `ai_insights/{uid}` doc shows
 * instantly while the fresh response streams in.
 *
 * Responsive: full-width on mobile, 540px on desktop. Uses inner scrolling
 * so the panel never overflows the viewport.
 */

interface StudentDetailModalProps {
  uid: string | null;
  onClose: () => void;
}

const TIER_META = {
  best: { label: 'On Track', bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  good: { label: 'Watch',    bg: '#fef9c3', fg: '#854d0e', dot: '#eab308' },
  risk: { label: 'Critical', bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
} as const;

const SEVERITY_META = {
  HIGH:    { bg: '#fee2e2', fg: '#991b1b', label: 'High',   dot: '#ef4444' },
  MEDIUM:  { bg: '#ffedd5', fg: '#9a3412', label: 'Medium', dot: '#f97316' },
  LOW:     { bg: '#fef9c3', fg: '#854d0e', label: 'Low',    dot: '#eab308' },
  UNKNOWN: { bg: '#f1f5f9', fg: '#475569', label: '—',      dot: '#94a3b8' },
} as const;

const KIND_ICON: Record<string, string> = {
  practice: '🎯',
  concept:  '💡',
  support:  '🤝',
  habit:    '⏱️',
};

export function StudentDetailModal({ uid, onClose }: StudentDetailModalProps) {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRefreshing, setAiRefreshing] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!uid) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [uid, onClose]);

  // Fetch on uid change. After cached load, kick off real-time Gemini refresh.
  useEffect(() => {
    if (!uid) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getStudentDetail(uid)
      .then(async (d) => {
        if (cancelled) return;
        setData(d as StudentDetail);
        setLoading(false);
        if (cancelled) return;
        await refreshAi(uid, d as StudentDetail, false, () => cancelled);
      })
      .catch((e) => {
        if (cancelled) return;
        setError((e as Error).message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [uid]);

  /**
   * Refresh AI copy for the current student. Uses localStorage cache by
   * default; pass `force=true` to bypass cache and call Gemini again.
   */
  async function refreshAi(
    studentUid: string,
    base: StudentDetail,
    force: boolean,
    isCancelled: () => boolean = () => false,
  ) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) return;
    if (force) clearRealtimeAiCache(studentUid);
    setAiRefreshing(true);
    try {
      const fresh = await generateRealtimeAi(studentUid, {
        name: base.name,
        className: base.className,
        overall: base.overall,
        subjects: base.subjects,
        weakTopics: base.weakTopics.map((w) => ({
          topic: w.topic, subject: w.subject, severity: w.severity,
        })),
      }, { force });
      if (isCancelled()) return;
      setData((prev) => prev && {
        ...prev,
        goodAt: fresh.goodAt,
        improvementPlan: fresh.improvementPlan,
        evoSummary: fresh.evoSummary,
        modelVersion: fresh.modelVersion,
        generatedAt: fresh.generatedAt,
      });
    } catch (err) {
      console.warn('[StudentDetail] real-time AI failed, keeping cached', err);
    } finally {
      if (!isCancelled()) setAiRefreshing(false);
    }
  }

  function handleRegenerate() {
    if (!uid || !data || aiRefreshing) return;
    refreshAi(uid, data, true);
  }

  if (!uid) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.32)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 99,
          animation: 'fadeIn 0.2s ease',
        }}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Student detail"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(540px, 100vw)',
          background: '#ffffff',
          boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.12)',
          zIndex: 100,
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          animation: 'slideInRight 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
        }}
      >
        {loading && <PanelSkeleton onClose={onClose} />}
        {error && <PanelError message={error} onClose={onClose} />}
        {!loading && !error && data && (
          <PanelContent data={data} aiRefreshing={aiRefreshing} onClose={onClose} onRegenerate={handleRegenerate} />
        )}
      </aside>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── Panel content ───────────────────────────────────────────────────────────

function PanelContent({ data, aiRefreshing, onClose, onRegenerate }: {
  data: StudentDetail; aiRefreshing: boolean; onClose: () => void; onRegenerate: () => void;
}) {
  const tier = TIER_META[data.tier];
  const initials = data.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const pen = data.penBehaviour;

  return (
    <>
      {/* Sticky Header */}
      <header style={{
        padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, background: '#fff',
      }}>
        <Avatar initials={initials} tier={data.tier} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.2 }}>{data.name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            {data.className || 'Class —'} · Pen ID #{data.penId}
          </div>
        </div>
        <div style={{
          padding: '5px 11px', borderRadius: 999, background: tier.bg, color: tier.fg,
          fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: tier.dot }} />
          {tier.label}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 32, height: 32, borderRadius: 10, border: 'none', background: '#f1f5f9',
            color: '#475569', cursor: 'pointer', fontSize: 18, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>
      </header>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>

        {/* PEN BEHAVIOUR · TODAY'S SESSION */}
        <SectionLabel>
          <span>PEN BEHAVIOUR</span>
          <span style={{ color: '#cbd5e1', margin: '0 8px' }}>·</span>
          <span>TODAY'S SESSION</span>
        </SectionLabel>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 8, marginBottom: 18,
        }}>
          <KpiCard label="Total hesitation" value={pen.totalHesitation}    tone="orange" />
          <KpiCard label="Cross-outs"       value={`${pen.crossOuts}x`}    tone="amber" />
          <KpiCard label="Speed drop"       value={`${pen.speedDropPct}%`} tone="red" />
          <KpiCard label="Pages written"    value={pen.pagesWritten}       tone="blue" />
        </div>

        <SectionLabel>Session timeline</SectionLabel>
        <SessionTimeline writing={pen.writingPct} hesitation={pen.hesitationPct} redo={pen.redoPct} />

        {/* NOTIVO AI evoSummary */}
        <div style={{
          marginTop: 20, padding: 16, borderRadius: 14,
          background: 'linear-gradient(135deg, #fff8f3, #fff5ee)',
          border: '1px solid #FFD4A8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 7, background: '#F47B20',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              color: '#fff', fontSize: 13, fontWeight: 700,
            }}>+</div>
            <div style={{
              fontFamily: '"Roboto Mono", monospace', fontSize: 11, fontWeight: 700,
              color: '#F47B20', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>NOTIVO AI</div>
            {aiRefreshing && <Spinner />}
            <button
              onClick={onRegenerate}
              disabled={aiRefreshing}
              title="Regenerate insights"
              style={{
                marginLeft: 'auto', width: 26, height: 26, borderRadius: 8,
                border: '1px solid #FFD4A8', background: '#fff',
                color: '#F47B20', cursor: aiRefreshing ? 'not-allowed' : 'pointer',
                fontSize: 13, lineHeight: 1, opacity: aiRefreshing ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >↻</button>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#7c2d12', lineHeight: 1.55 }}>
            {data.evoSummary}
          </p>
        </div>

        {/* Improvement Plan */}
        {data.improvementPlan.length > 0 && (
          <>
            <SectionLabel sparkle>AI Improvement Plan</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.improvementPlan.map((t, i) => (
                <div key={i} style={{
                  padding: 12, borderRadius: 12, background: '#fafaf9',
                  border: '1px solid #f1f5f9',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, background: '#fff', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    border: '1px solid #f1f5f9',
                  }}>{KIND_ICON[t.kind] ?? '•'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{t.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Strengths */}
        {data.goodAt.length > 0 && (
          <>
            <SectionLabel>Strengths</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.goodAt.map((g, i) => (
                <span key={i} style={{
                  padding: '6px 12px', borderRadius: 999, background: '#f0fdf4', color: '#166534',
                  fontSize: 12, lineHeight: 1.4, border: '1px solid #bbf7d0',
                }}>{g}</span>
              ))}
            </div>
          </>
        )}

        {/* Weak topics */}
        {data.weakTopics.length > 0 && (
          <>
            <SectionLabel>Weak Topics</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.weakTopics.map((w, i) => {
                const sev = SEVERITY_META[w.severity] ?? SEVERITY_META.UNKNOWN;
                return (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 10, background: '#fafaf9',
                    border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: sev.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{w.topic}</div>
                      {w.subject && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{w.subject}</div>}
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 999, background: sev.bg, color: sev.fg,
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{sev.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Subjects */}
        {data.subjects.length > 0 && (
          <>
            <SectionLabel>Subject Performance</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.subjects.map((s) => <SubjectBar key={s.subject} subject={s.subject} score={s.score} />)}
            </div>
          </>
        )}

        {/* Live Alert Feed */}
        {data.alerts.length > 0 && (
          <>
            <SectionLabel>Live Alert Feed</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.alerts.map((a, i) => <AlertRow key={i} entry={a} last={i === data.alerts.length - 1} />)}
            </div>
          </>
        )}

        {/* Footer meta */}
        <div style={{
          marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9',
          fontSize: 10, color: '#94a3b8', fontFamily: '"Roboto Mono", monospace',
        }}>
          {data.modelVersion}
          {data.generatedAt && ` · generated ${new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ initials, tier }: { initials: string; tier: 'best' | 'good' | 'risk' }) {
  const bg = tier === 'best'
    ? 'linear-gradient(135deg, #22c55e, #4ade80)'
    : tier === 'good'
    ? 'linear-gradient(135deg, #eab308, #facc15)'
    : 'linear-gradient(135deg, #ef4444, #f87171)';
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 999, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
    }}>{initials}</div>
  );
}

function SectionLabel({ children, sparkle }: { children: React.ReactNode; sparkle?: boolean }) {
  return (
    <div style={{
      fontFamily: '"Roboto Mono", monospace',
      fontSize: 10, fontWeight: 600,
      color: sparkle ? '#F47B20' : '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      margin: '20px 0 10px',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {sparkle && <span>✨</span>}
      {children}
    </div>
  );
}

const TONE = {
  orange: { bg: '#fff7ed', fg: '#9a3412', border: '#fed7aa' },
  amber:  { bg: '#fefce8', fg: '#854d0e', border: '#fde68a' },
  red:    { bg: '#fef2f2', fg: '#991b1b', border: '#fecaca' },
  blue:   { bg: '#eff6ff', fg: '#1e40af', border: '#bfdbfe' },
} as const;

function KpiCard({ label, value, tone }: { label: string; value: string | number; tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <div style={{
      padding: '12px 8px', borderRadius: 12, background: t.bg, border: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 0,
    }}>
      <div style={{
        fontFamily: '"Roboto Mono", monospace',
        fontSize: 17, fontWeight: 700, color: t.fg, lineHeight: 1.1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
      }}>{value}</div>
      <div style={{
        fontSize: 9.5, color: '#64748b', marginTop: 4, textAlign: 'center', lineHeight: 1.2,
      }}>{label}</div>
    </div>
  );
}

function SessionTimeline({ writing, hesitation, redo }: { writing: number; hesitation: number; redo: number }) {
  const total = writing + hesitation + redo || 1;
  const w = (writing / total) * 100;
  const h = (hesitation / total) * 100;
  const r = (redo / total) * 100;
  return (
    <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        width: `${w}%`, background: '#bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, color: '#166534',
      }}>{w >= 12 && 'Writing'}</div>
      <div style={{
        width: `${h}%`, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, color: '#854d0e',
      }}>{h >= 12 && 'Hesitation'}</div>
      <div style={{
        width: `${r}%`, background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, color: '#991b1b',
      }}>{r >= 12 && 'Re-do'}</div>
    </div>
  );
}

function AlertRow({ entry, last }: { entry: AlertEntry; last: boolean }) {
  const sev = SEVERITY_META[entry.severity] ?? SEVERITY_META.UNKNOWN;
  return (
    <div style={{
      padding: '10px 0', borderBottom: last ? 'none' : '1px solid #f1f5f9',
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: sev.dot,
        marginTop: 6, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#1A1A1A', lineHeight: 1.5 }}>{entry.text}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontFamily: '"Roboto Mono", monospace' }}>
          {entry.ago}
        </div>
      </div>
    </div>
  );
}

function SubjectBar({ subject, score }: { subject: string; score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{subject}</span>
        <span style={{ fontSize: 12, color: '#1A1A1A', fontWeight: 600, fontFamily: '"Roboto Mono", monospace' }}>{score}</span>
      </div>
      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 12, height: 12, marginLeft: 4,
      border: '2px solid #FFD4A8', borderTopColor: '#F47B20',
      borderRadius: '50%', display: 'inline-block',
      animation: 'spin 0.8s linear infinite',
    }} />
  );
}

function PanelSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <>
      <header style={{
        padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <Shimmer w={44} h={44} r={999} />
        <div style={{ flex: 1 }}>
          <Shimmer w="60%" h={16} r={4} />
          <div style={{ height: 6 }} />
          <Shimmer w="40%" h={11} r={3} />
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: 10, border: 'none', background: '#f1f5f9',
          color: '#475569', cursor: 'pointer', fontSize: 18,
        }}>×</button>
      </header>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {[0, 1, 2, 3].map((i) => <Shimmer key={i} w="100%" h={64} r={12} />)}
        </div>
        <Shimmer w="100%" h={32} r={8} />
        <div style={{ height: 16 }} />
        <Shimmer w="100%" h={84} r={14} />
        <div style={{ height: 16 }} />
        <Shimmer w="100%" h={140} r={12} />
      </div>
    </>
  );
}

function Shimmer({ w, h, r }: { w: number | string; h: number; r: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

function PanelError({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{
      padding: 32, textAlign: 'center', flex: 1,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>Could not load student</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{message}</div>
      <button onClick={onClose} style={{
        padding: '10px 20px', borderRadius: 10, border: 'none',
        background: '#1A1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        alignSelf: 'center',
      }}>Close</button>
    </div>
  );
}
