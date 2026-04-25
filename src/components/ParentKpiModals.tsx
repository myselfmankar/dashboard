import { KpiDetailModal, KpiTable, KpiRow, KpiCell, KpiPill } from './KpiDetailModal';
import {
  resolveSchoolEvents, formatShortDate, relativeDayLabel, relDateShort, EVENT_TYPE_THEME,
} from '../lib/schoolEvents';

/**
 * The 3 KPI drill-down modals shown when a parent clicks a top KPI card on
 * the ParentsView:
 *   1. Upcoming Events    → school events (sample, schema gap)
 *   2. Upcoming Exams     → exam schedule (sample, schema gap)
 *   3. Result Published   → recent published results (sample, schema gap)
 *
 * All three are sample data because the corresponding Firestore collections
 * (events / exams / results) don't exist yet. Data is rendered identically
 * to the Teacher / Admin drill-downs for visual consistency.
 */

export type ParentKpi = 'events' | 'exams' | 'results';

interface Props {
  active: ParentKpi | null;
  onClose: () => void;
}

export function ParentKpiModals({ active, onClose }: Props) {
  const upcoming = resolveSchoolEvents().filter((e) => !e.isPast);
  return (
    <>
      <KpiDetailModal
        open={active === 'events'}
        title="Upcoming School Events"
        subtitle={`${upcoming.length} events scheduled`}
        onClose={onClose}
      >
        <KpiTable headers={['Date', 'Event', 'Type', 'Venue', 'When']}>
          {upcoming.map((e, i) => {
            const theme = EVENT_TYPE_THEME[e.type];
            return (
              <KpiRow key={i}>
                <KpiCell><KpiPill bg="#fff7ed" fg="#c2410c">{formatShortDate(e.date)}</KpiPill></KpiCell>
                <KpiCell color="#1e293b" bold>{e.title}</KpiCell>
                <KpiCell><KpiPill bg={`${theme.dot}1f`} fg={theme.dot}>{theme.label}</KpiPill></KpiCell>
                <KpiCell color="#64748b">{e.venue}</KpiCell>
                <KpiCell color="#64748b" mono>{relativeDayLabel(e.date)}</KpiCell>
              </KpiRow>
            );
          })}
        </KpiTable>
      </KpiDetailModal>

      <KpiDetailModal
        open={active === 'exams'}
        title="Upcoming Exams"
        subtitle={`${UPCOMING_EXAMS.length} exams scheduled • Term Final`}
        onClose={onClose}
      >
        <KpiTable headers={['Date', 'Subject', 'Class', 'Duration', 'Status']}>
          {UPCOMING_EXAMS.map((e, i) => (
            <KpiRow key={i}>
              <KpiCell><KpiPill bg="#ecfdf5" fg="#065f46">{e.date}</KpiPill></KpiCell>
              <KpiCell color="#1e293b" bold>{e.subject}</KpiCell>
              <KpiCell color="#64748b">{e.className}</KpiCell>
              <KpiCell color="#64748b" mono>{e.duration}</KpiCell>
              <KpiCell>
                <KpiPill bg="#fef3c7" fg="#92400e">{e.status}</KpiPill>
              </KpiCell>
            </KpiRow>
          ))}
        </KpiTable>
      </KpiDetailModal>

      <KpiDetailModal
        open={active === 'results'}
        title="Recently Published Results"
        subtitle={`${PUBLISHED_RESULTS.length} results published this month`}
        onClose={onClose}
      >
        <KpiTable headers={['Date', 'Subject', 'Test', 'Score', 'Grade']}>
          {PUBLISHED_RESULTS.map((r, i) => (
            <KpiRow key={i}>
              <KpiCell color="#64748b" mono>{r.date}</KpiCell>
              <KpiCell color="#1e293b" bold>{r.subject}</KpiCell>
              <KpiCell color="#64748b">{r.test}</KpiCell>
              <KpiCell color={r.score >= 80 ? '#22c55e' : r.score >= 60 ? '#f59e0b' : '#ef4444'} bold mono>{r.score}%</KpiCell>
              <KpiCell><KpiPill bg={`${gradeColor(r.grade)}22`} fg={gradeColor(r.grade)}>{r.grade}</KpiPill></KpiCell>
            </KpiRow>
          ))}
        </KpiTable>
      </KpiDetailModal>
    </>
  );
}

function gradeColor(g: string): string {
  if (g === 'A' || g === 'A+') return '#22c55e';
  if (g === 'B') return '#3b82f6';
  if (g === 'C') return '#f59e0b';
  return '#ef4444';
}

// ── Sample data (schema gaps) ──────────────────────────────────────────────

const UPCOMING_EXAMS = [
  { date: relDateShort(14), subject: 'Mathematics', className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: relDateShort(16), subject: 'Physics',     className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: relDateShort(18), subject: 'Chemistry',   className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: relDateShort(20), subject: 'Biology',     className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: relDateShort(22), subject: 'English',     className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: relDateShort(24), subject: 'Hindi',       className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: relDateShort(26), subject: 'Soc. Sci.',   className: 'Grade 10-A', duration: '3 hrs',  status: 'Tentative' },
  { date: relDateShort(28), subject: 'Comp. Sci.',  className: 'Grade 10-A', duration: '2 hrs',  status: 'Tentative' },
];

const PUBLISHED_RESULTS = [
  { date: relDateShort(-2),  subject: 'Mathematics', test: 'Unit Test 4',     score: 88, grade: 'A'  },
  { date: relDateShort(-5),  subject: 'Physics',     test: 'Practical Lab',   score: 92, grade: 'A+' },
  { date: relDateShort(-8),  subject: 'Chemistry',   test: 'Unit Test 4',     score: 76, grade: 'B'  },
  { date: relDateShort(-12), subject: 'Biology',     test: 'Surprise Quiz',   score: 81, grade: 'A'  },
  { date: relDateShort(-15), subject: 'English',     test: 'Essay Writing',   score: 85, grade: 'A'  },
  { date: relDateShort(-18), subject: 'Mathematics', test: 'Mid-term Mock',   score: 68, grade: 'C'  },
  { date: relDateShort(-22), subject: 'Comp. Sci.',  test: 'Project Eval',    score: 94, grade: 'A+' },
  { date: relDateShort(-26), subject: 'Hindi',       test: 'Unit Test 3',     score: 72, grade: 'B'  },
];
