import { useEffect, useMemo, useState } from 'react';
import { Layers, Users, TrendingUp, BookOpen, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import { KpiItem } from '../components/KpiItem';
import { KpiDetailModal, KpiTable, KpiRow, KpiCell, KpiPill, KpiBar } from '../components/KpiDetailModal';
import { api } from '../api';

type CourseRow = Awaited<ReturnType<typeof api.getCoursesOverview>>[number];

const SUBJECT_PALETTE = [
  { bg: 'bg-blue-50',   text: 'text-blue-700',   fill: 'bg-blue-500',   border: 'border-blue-200',   tag: '#3b82f6' },
  { bg: 'bg-purple-50', text: 'text-purple-700', fill: 'bg-purple-500', border: 'border-purple-200', tag: '#8b5cf6' },
  { bg: 'bg-emerald-50',text: 'text-emerald-700',fill: 'bg-emerald-500',border: 'border-emerald-200',tag: '#10b981' },
  { bg: 'bg-orange-50', text: 'text-orange-700', fill: 'bg-orange-500', border: 'border-orange-200', tag: '#f47b20' },
  { bg: 'bg-cyan-50',   text: 'text-cyan-700',   fill: 'bg-cyan-500',   border: 'border-cyan-200',   tag: '#06b6d4' },
  { bg: 'bg-pink-50',   text: 'text-pink-700',   fill: 'bg-pink-500',   border: 'border-pink-200',   tag: '#ec4899' },
];

function paletteForSubject(subject: string) {
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) | 0;
  return SUBJECT_PALETTE[Math.abs(h) % SUBJECT_PALETTE.length];
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 65) return '#3b82f6';
  if (score >= 50) return '#f47b20';
  return '#ef4444';
}

export function CoursesView() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<CourseRow | null>(null);

  useEffect(() => {
    api.getCoursesOverview()
      .then((rows) => setCourses(rows))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const aggregate = useMemo(() => {
    if (courses.length === 0) return { totalEnrol: 0, avgScore: 0, atRisk: 0 };
    const totalEnrol = courses.reduce((s, c) => s + c.enrollments, 0);
    const scored = courses.filter((c) => c.avgScore > 0);
    const avgScore = scored.length === 0
      ? 0
      : Math.round(scored.reduce((s, c) => s + c.avgScore, 0) / scored.length);
    const atRisk = courses.reduce((s, c) => s + c.atRiskCount, 0);
    return { totalEnrol, avgScore, atRisk };
  }, [courses]);

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Courses</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">
            {courses.length} active classes &bull; powered by notivo pen analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiItem
          title="Active Courses"
          mtc="blue"
          value={courses.length}
          trend="This term"
          icon={<Layers/>}
        />
        <KpiItem
          title="Total Enrollments"
          mtc="green"
          value={aggregate.totalEnrol}
          trend="Across all classes"
          icon={<Users/>}
        />
        <KpiItem
          title="Avg Class Score"
          mtc={aggregate.avgScore >= 75 ? 'green' : aggregate.avgScore >= 60 ? 'blue' : 'orange'}
          value={aggregate.avgScore > 0 ? `${aggregate.avgScore}%` : '—'}
          trend={aggregate.atRisk > 0 ? `${aggregate.atRisk} at-risk students` : 'On track'}
          icon={<TrendingUp/>}
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-s400 font-mono text-sm">Loading courses…</div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-dashed border-s200 rounded-2xl p-10 text-center">
          <BookOpen className="mx-auto text-s300 mb-3" size={32} />
          <p className="text-sm text-s500">No classes found for this institute.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((c) => (
            <CourseCard key={c.classId} course={c} onOpen={() => setActive(c)} />
          ))}
        </div>
      )}

      <CourseDetailModal active={active} onClose={() => setActive(null)} />
    </div>
  );
}

// ── Course card ────────────────────────────────────────────────────────────

function CourseCard({ course, onOpen }: { course: CourseRow; onOpen: () => void }) {
  const t = paletteForSubject(course.subject);
  const score = course.avgScore;
  const sc = scoreColor(score);

  return (
    <button
      onClick={onOpen}
      className="text-left bg-white border border-s200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-accent/40 transition-all cursor-pointer flex flex-col group focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${t.bg} ${t.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <BookOpen size={22} />
        </div>
        <div className="flex items-center gap-2">
          {course.atRiskCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full">
              <AlertTriangle size={10} /> {course.atRiskCount}
            </span>
          )}
          <span className="font-mono text-[10px] bg-s100 text-s600 px-2 py-1 rounded border border-s200">{course.className}</span>
        </div>
      </div>

      <h3 className="font-serif font-bold text-lg text-s900 tracking-tight leading-tight mb-1">
        {course.subject}
      </h3>
      <p className="text-[11px] text-s500 uppercase tracking-wide font-semibold mb-4">
        By {course.teacherName}
      </p>

      {course.topWeakTopic && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-amber-700 mb-0.5">
            <Sparkles size={10} /> Notivo AI &bull; weakest topic
          </div>
          <div className="text-[12px] font-semibold text-amber-900 truncate">{course.topWeakTopic}</div>
        </div>
      )}

      <div className="mt-auto">
        <div className="flex justify-between items-center text-[10px] font-bold text-s500 mb-2 font-mono uppercase">
          <span className="flex items-center gap-1"><Users size={12} className="text-s400"/> {course.enrollments} students</span>
          <span style={{ color: sc }}>{score > 0 ? `${score}%` : '—'}</span>
        </div>
        <div className="w-full bg-s100 h-1.5 rounded-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${Math.max(0, Math.min(100, score))}%`, background: sc }} />
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] font-mono uppercase tracking-widest text-s400 group-hover:text-accent transition-colors">
          <span>{course.sessionsLogged} insights logged</span>
          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
}

// ── Course drill-down modal ────────────────────────────────────────────────

function CourseDetailModal({ active, onClose }: { active: CourseRow | null; onClose: () => void }) {
  if (!active) return null;
  const sc = scoreColor(active.avgScore);

  return (
    <KpiDetailModal
      open
      title={active.subject}
      subtitle={`${active.className} \u2022 ${active.teacherName}`}
      onClose={onClose}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <Stat label="Enrollments" value={String(active.enrollments)} />
        <Stat label="At Risk"    value={String(active.atRiskCount)} color={active.atRiskCount > 0 ? '#dc2626' : undefined} />
        <Stat label="Avg Score"  value={active.avgScore > 0 ? `${active.avgScore}%` : '—'} color={sc} />
      </div>

      <KpiTable headers={['Metric', 'Value', 'Status']}>
        <KpiRow>
          <KpiCell bold>Comprehension</KpiCell>
          <KpiCell><KpiBar pct={active.avgScore} color={sc} /></KpiCell>
          <KpiCell>
            <KpiPill
              bg={active.avgScore >= 75 ? '#dcfce7' : active.avgScore >= 60 ? '#dbeafe' : '#fee2e2'}
              fg={active.avgScore >= 75 ? '#166534' : active.avgScore >= 60 ? '#1e40af' : '#991b1b'}
            >
              {active.avgScore >= 75 ? 'Strong' : active.avgScore >= 60 ? 'Steady' : 'Needs focus'}
            </KpiPill>
          </KpiCell>
        </KpiRow>
        <KpiRow>
          <KpiCell bold>Sessions Logged</KpiCell>
          <KpiCell mono>{active.sessionsLogged}</KpiCell>
          <KpiCell>
            <KpiPill bg="#f1f5f9" fg="#475569">Pen Insights</KpiPill>
          </KpiCell>
        </KpiRow>
        <KpiRow>
          <KpiCell bold>Students Flagged</KpiCell>
          <KpiCell mono color={active.atRiskCount > 0 ? '#dc2626' : undefined}>
            {active.atRiskCount}
          </KpiCell>
          <KpiCell>
            <KpiPill
              bg={active.atRiskCount > 0 ? '#fee2e2' : '#dcfce7'}
              fg={active.atRiskCount > 0 ? '#991b1b' : '#166534'}
            >
              {active.atRiskCount > 0 ? 'Attention' : 'Healthy'}
            </KpiPill>
          </KpiCell>
        </KpiRow>
      </KpiTable>

      {active.topWeakTopic && (
        <div style={{
          marginTop: 18, padding: 16, borderRadius: 12,
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
        }}>
          <div style={{
            fontFamily: '"Roboto Mono", monospace', fontSize: 10,
            color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 6, fontWeight: 600,
          }}>
            ⚡ Notivo AI &bull; Class-wide weak topic
          </div>
          <div style={{ fontFamily: '"Lora", serif', fontSize: 16, fontWeight: 700, color: '#78350f' }}>
            {active.topWeakTopic}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
            Most-flagged HIGH/MEDIUM mistake topic across {active.sessionsLogged} pen sessions in this class.
            Consider a targeted re-teach or peer-led recap.
          </div>
        </div>
      )}
    </KpiDetailModal>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      padding: 12, borderRadius: 12, background: '#f8fafc',
      border: '1px solid #e2e8f0',
    }}>
      <div style={{
        fontFamily: '"Roboto Mono", monospace', fontSize: 9,
        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: 4, fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? '#1e293b', fontFamily: '"Lora", serif' }}>
        {value}
      </div>
    </div>
  );
}
