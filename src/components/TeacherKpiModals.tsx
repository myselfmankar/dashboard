import { useEffect, useState } from 'react';
import { KpiDetailModal, KpiTable, KpiRow, KpiCell, KpiPill, KpiBar } from './KpiDetailModal';
import { api } from '../api';
import { relDateShort } from '../lib/schoolEvents';
import type { HeatmapStudent } from '../types';

/**
 * The 4 KPI drill-down modals shown when a teacher clicks a top KPI card:
 *   1. My Classes      → class schedule (real Firestore data)
 *   2. Attendance Rate → per-class attendance overview (sample, schema gap)
 *   3. Avg Score       → score-distribution buckets (derived from heatmap)
 *   4. Pending Reviews → list of pending review items (sample, schema gap)
 *
 * Centralised here so TeachersView stays clean and the modal copy can evolve
 * without touching the view layout.
 */

export type TeacherKpi = 'classes' | 'attendance' | 'scores' | 'reviews';

interface Props {
  active: TeacherKpi | null;
  students: HeatmapStudent[];
  onClose: () => void;
}

interface ClassRow {
  classId: string; className: string; subject: string;
  students: number; days: string; time: string;
}

export function TeacherKpiModals({ active, students, onClose }: Props) {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);

  useEffect(() => {
    if (active !== 'classes' || classes !== null) return;
    api.getTeacherClasses().then(setClasses).catch(() => setClasses([]));
  }, [active, classes]);

  return (
    <>
      <KpiDetailModal
        open={active === 'classes'}
        title="My Class Schedule"
        subtitle={`${classes?.length ?? '—'} active classes this term`}
        onClose={onClose}
      >
        {classes === null ? (
          <Loading text="Loading classes…" />
        ) : classes.length === 0 ? (
          <Empty text="No classes assigned yet." />
        ) : (
          <KpiTable headers={['Class', 'Subject', 'Students', 'Days', 'Time']}>
            {classes.map((c) => (
              <KpiRow key={c.classId}>
                <KpiCell><KpiPill bg="#f1f5f9" fg="#334155">{c.className}</KpiPill></KpiCell>
                <KpiCell color="#1e293b" bold>{c.subject}</KpiCell>
                <KpiCell color="#F47B20" bold mono>{c.students}</KpiCell>
                <KpiCell color="#64748b">{c.days}</KpiCell>
                <KpiCell color="#F47B20" bold>{c.time}</KpiCell>
              </KpiRow>
            ))}
          </KpiTable>
        )}
      </KpiDetailModal>

      <KpiDetailModal
        open={active === 'attendance'}
        title="Attendance Overview"
        subtitle="Live attendance feed not connected — sample data"
        onClose={onClose}
      >
        <KpiTable headers={['Class', 'Total', 'Present', 'Absent', 'Rate']}>
          {ATTENDANCE_SAMPLE.map((r) => (
            <KpiRow key={r.className}>
              <KpiCell><KpiPill bg="#f1f5f9" fg="#334155">{r.className}</KpiPill></KpiCell>
              <KpiCell color="#64748b">{r.total}</KpiCell>
              <KpiCell color="#22c55e" bold>{r.present}</KpiCell>
              <KpiCell color="#ef4444" bold>{r.absent}</KpiCell>
              <KpiCell color="#F47B20" bold mono>{r.rate}</KpiCell>
            </KpiRow>
          ))}
        </KpiTable>
      </KpiDetailModal>

      <KpiDetailModal
        open={active === 'scores'}
        title="Student Score Distribution"
        subtitle={`${students.length} students across this teacher's classes`}
        onClose={onClose}
      >
        <KpiTable headers={['Score Range', 'Students', 'Grade', 'Distribution']}>
          {bucketScores(students).map((b) => (
            <KpiRow key={b.label}>
              <KpiCell color="#1e293b" bold>{b.label}</KpiCell>
              <KpiCell color="#1e293b" bold mono>{b.count}</KpiCell>
              <KpiCell><KpiPill bg={`${b.color}22`} fg={b.color}>{b.grade}</KpiPill></KpiCell>
              <KpiCell><KpiBar pct={b.pct} color={b.color} /></KpiCell>
            </KpiRow>
          ))}
        </KpiTable>
      </KpiDetailModal>

      <KpiDetailModal
        open={active === 'reviews'}
        title="Pending Reviews"
        subtitle={`${PENDING_REVIEWS.length} items require your attention`}
        onClose={onClose}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PENDING_REVIEWS.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 14, background: t.bg, borderRadius: 12,
            }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.title}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{t.meta}</div>
              </div>
              <KpiPill bg="#fef3c7" fg="#92400e">Pending</KpiPill>
            </div>
          ))}
        </div>
      </KpiDetailModal>
    </>
  );
}

// ── Score-distribution helper ──────────────────────────────────────────────

function bucketScores(students: HeatmapStudent[]) {
  const total = students.length || 1;
  const buckets = [
    { label: '90–100',   grade: 'A+', color: '#22c55e', test: (s: number) => s >= 90 },
    { label: '80–89',    grade: 'A',  color: '#3b82f6', test: (s: number) => s >= 80 && s < 90 },
    { label: '70–79',    grade: 'B+', color: '#8b5cf6', test: (s: number) => s >= 70 && s < 80 },
    { label: '60–69',    grade: 'B',  color: '#f59e0b', test: (s: number) => s >= 60 && s < 70 },
    { label: '50–59',    grade: 'C',  color: '#f97316', test: (s: number) => s >= 50 && s < 60 },
    { label: 'Below 50', grade: 'F',  color: '#ef4444', test: (s: number) => s < 50 },
  ];
  return buckets.map((b) => {
    const count = students.filter((s) => b.test(s.score)).length;
    return { ...b, count, pct: Math.round((count / total) * 100) };
  });
}

// ── Sample fallbacks (schema gaps) ─────────────────────────────────────────

const ATTENDANCE_SAMPLE = [
  { className: 'Grade 10-A', total: 32, present: 31, absent: 1, rate: '96.9%' },
  { className: 'Grade 9-B',  total: 28, present: 26, absent: 2, rate: '92.9%' },
  { className: 'Grade 11-C', total: 24, present: 23, absent: 1, rate: '95.8%' },
  { className: 'Grade 8-A',  total: 30, present: 28, absent: 2, rate: '93.3%' },
  { className: 'Grade 10-B', total: 18, present: 17, absent: 1, rate: '94.4%' },
];

const PENDING_REVIEWS = [
  { icon: '📝', title: 'Grammar Test — Grade 10-A',     meta: `Submitted ${relDateShort(-3)} · 32 papers pending`, bg: '#FFF5EE' },
  { icon: '📚', title: 'Essay Assignment — Grade 9-B',  meta: `Submitted ${relDateShort(-2)} · 28 papers pending`, bg: '#f5f3ff' },
  { icon: '🎙️', title: 'Speaking Evaluation — Club',    meta: `Recorded ${relDateShort(-1)} · 18 audio clips`,     bg: '#f0fdf4' },
];

// ── States ──────────────────────────────────────────────────────────────────

function Loading({ text }: { text: string }) {
  return (
    <div style={{
      padding: 32, textAlign: 'center',
      fontSize: 12, color: '#94a3b8', fontFamily: '"Roboto Mono", monospace',
    }}>{text}</div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      padding: 32, textAlign: 'center',
      fontSize: 13, color: '#64748b',
    }}>{text}</div>
  );
}
