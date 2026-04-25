import { KpiDetailModal, KpiTable, KpiRow, KpiCell, KpiPill, KpiBar } from './KpiDetailModal';
import type { HeatmapStudent } from '../types';

/**
 * The 4 KPI drill-down modals shown when an admin clicks a top KPI card on
 * the AdminView:
 *   1. At-Risk Students    → risk ≥ 4 cohort with score / hesitation / issue
 *   2. Needing Attention   → risk 2–3 cohort (early warning)
 *   3. Avg Class Score     → score-distribution buckets across all students
 *   4. Active Sessions     → live pen sessions per class (sample, schema gap)
 *
 * Centralised so AdminView stays clean.
 */

export type AdminKpi = 'atrisk' | 'attention' | 'avgscore' | 'sessions';

interface Props {
  active: AdminKpi | null;
  students: HeatmapStudent[];
  onClose: () => void;
}

export function AdminKpiModals({ active, students, onClose }: Props) {
  const atRisk    = students.filter((s) => s.risk >= 4);
  const attention = students.filter((s) => s.risk === 2 || s.risk === 3);

  return (
    <>
      <KpiDetailModal
        open={active === 'atrisk'}
        title="At-Risk Students"
        subtitle={`${atRisk.length} students require immediate intervention`}
        onClose={onClose}
      >
        {atRisk.length === 0 ? (
          <Empty text="No students currently at high risk. 🎉" />
        ) : (
          <KpiTable headers={['Student', 'Risk', 'Score', 'Hesitation', 'Issue']}>
            {atRisk.map((s, i) => (
              <KpiRow key={s.uid ?? i}>
                <KpiCell color="#1e293b" bold>{s.name}</KpiCell>
                <KpiCell>
                  <KpiPill bg="#ef4444" fg="#ffffff">Tier {s.risk}</KpiPill>
                </KpiCell>
                <KpiCell color="#dc2626" bold mono>{s.score}%</KpiCell>
                <KpiCell color="#64748b" mono>{s.hesitation ?? '—'}</KpiCell>
                <KpiCell color="#475569">{s.insight ?? 'Pen-behaviour anomaly detected'}</KpiCell>
              </KpiRow>
            ))}
          </KpiTable>
        )}
      </KpiDetailModal>

      <KpiDetailModal
        open={active === 'attention'}
        title="Students Needing Attention"
        subtitle={`${attention.length} students with early warning signals`}
        onClose={onClose}
      >
        {attention.length === 0 ? (
          <Empty text="All students within healthy hesitation baseline." />
        ) : (
          <KpiTable headers={['Student', 'Risk', 'Score', 'Hesitation', 'Cross-outs']}>
            {attention.map((s, i) => (
              <KpiRow key={s.uid ?? i}>
                <KpiCell color="#1e293b" bold>{s.name}</KpiCell>
                <KpiCell>
                  <KpiPill bg="#f59e0b" fg="#ffffff">Tier {s.risk}</KpiPill>
                </KpiCell>
                <KpiCell color="#d97706" bold mono>{s.score}%</KpiCell>
                <KpiCell color="#64748b" mono>{s.hesitation ?? '—'}</KpiCell>
                <KpiCell color="#64748b" mono>{s.crossouts ?? 0}</KpiCell>
              </KpiRow>
            ))}
          </KpiTable>
        )}
      </KpiDetailModal>

      <KpiDetailModal
        open={active === 'avgscore'}
        title="School-wide Score Distribution"
        subtitle={`${students.length} students across all tracked classes`}
        onClose={onClose}
      >
        <KpiTable headers={['Score Range', 'Students', 'Grade', 'Distribution']}>
          {bucketScores(students).map((b) => (
            <KpiRow key={b.label}>
              <KpiCell color="#1e293b" bold>{b.label}</KpiCell>
              <KpiCell color="#1e293b" bold mono>{b.count}</KpiCell>
              <KpiCell><KpiPill bg={b.color} fg="#ffffff">{b.grade}</KpiPill></KpiCell>
              <KpiCell><KpiBar pct={b.pct} color={b.color} /></KpiCell>
            </KpiRow>
          ))}
        </KpiTable>
      </KpiDetailModal>

      <KpiDetailModal
        open={active === 'sessions'}
        title="Active Pen Sessions"
        subtitle="Live session feed not connected — sample data"
        onClose={onClose}
      >
        <KpiTable headers={['Class', 'Teacher', 'Subject', 'Students', 'Status']}>
          {ACTIVE_SESSIONS.map((r) => (
            <KpiRow key={r.className}>
              <KpiCell><KpiPill bg="#eef2ff" fg="#4338ca">{r.className}</KpiPill></KpiCell>
              <KpiCell color="#1e293b" bold>{r.teacher}</KpiCell>
              <KpiCell color="#64748b">{r.subject}</KpiCell>
              <KpiCell color="#F47B20" bold mono>{r.students}</KpiCell>
              <KpiCell>
                <KpiPill bg="#22c55e" fg="#ffffff">● {r.status}</KpiPill>
              </KpiCell>
            </KpiRow>
          ))}
        </KpiTable>
      </KpiDetailModal>
    </>
  );
}

// ── Score-distribution helper (mirrors TeacherKpiModals) ───────────────────

function bucketScores(students: HeatmapStudent[]) {
  const total = students.length || 1;
  const buckets = [
    { label: '90–100%', grade: 'A', color: '#22c55e', test: (n: number) => n >= 90 },
    { label: '80–89%',  grade: 'B', color: '#3b82f6', test: (n: number) => n >= 80 && n < 90 },
    { label: '70–79%',  grade: 'C', color: '#f59e0b', test: (n: number) => n >= 70 && n < 80 },
    { label: '60–69%',  grade: 'D', color: '#f97316', test: (n: number) => n >= 60 && n < 70 },
    { label: '< 60%',   grade: 'F', color: '#ef4444', test: (n: number) => n < 60 },
  ];
  return buckets.map((b) => {
    const count = students.filter((s) => b.test(s.score)).length;
    return { ...b, count, pct: Math.round((count / total) * 100) };
  });
}

// ── Sample data (schema gaps) ──────────────────────────────────────────────

const ACTIVE_SESSIONS = [
  { className: 'Grade 10-A', teacher: 'Ms. Verma',     subject: 'Mathematics', students: 32, status: 'LIVE' },
  { className: 'Grade 10-B', teacher: 'Mr. Iyer',      subject: 'Physics',     students: 28, status: 'LIVE' },
  { className: 'Grade 9-A',  teacher: 'Ms. Kapoor',    subject: 'Chemistry',   students: 30, status: 'LIVE' },
  { className: 'Grade 9-C',  teacher: 'Mr. Banerjee',  subject: 'Biology',     students: 27, status: 'LIVE' },
  { className: 'Grade 11-A', teacher: 'Ms. D\u2019Souza', subject: 'English',  students: 25, status: 'LIVE' },
];

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      padding: '32px 16px', textAlign: 'center', color: '#94a3b8',
      fontSize: 12, fontFamily: '"Roboto Mono", monospace',
    }}>{text}</div>
  );
}
