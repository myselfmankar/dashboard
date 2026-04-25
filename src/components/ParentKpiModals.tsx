import { KpiDetailModal, KpiTable, KpiRow, KpiCell, KpiPill } from './KpiDetailModal';

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
  return (
    <>
      <KpiDetailModal
        open={active === 'events'}
        title="Upcoming School Events"
        subtitle={`${UPCOMING_EVENTS.length} events scheduled this term`}
        onClose={onClose}
      >
        <KpiTable headers={['Date', 'Event', 'Venue', 'Time', 'Audience']}>
          {UPCOMING_EVENTS.map((e, i) => (
            <KpiRow key={i}>
              <KpiCell><KpiPill bg="#fff7ed" fg="#c2410c">{e.date}</KpiPill></KpiCell>
              <KpiCell color="#1e293b" bold>{e.title}</KpiCell>
              <KpiCell color="#64748b">{e.venue}</KpiCell>
              <KpiCell color="#64748b" mono>{e.time}</KpiCell>
              <KpiCell><KpiPill bg="#f1f5f9" fg="#334155">{e.audience}</KpiPill></KpiCell>
            </KpiRow>
          ))}
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

const UPCOMING_EVENTS = [
  { date: '20 Mar', title: 'Parent-Teacher Meeting', venue: 'School Hall',     time: '9:00 AM – 1:00 PM',  audience: 'All Parents' },
  { date: '28 Mar', title: 'Annual Sports Day',      venue: 'Sports Ground',   time: '8:00 AM – 5:00 PM',  audience: 'School-wide' },
  { date: '05 Apr', title: 'Science Exhibition',     venue: 'Lab Block',       time: '10:00 AM – 4:00 PM', audience: 'Grade 8–12' },
  { date: '14 Apr', title: 'Cultural Fest',          venue: 'Auditorium',      time: 'All Day',            audience: 'School-wide' },
  { date: '22 Apr', title: 'Earth Day Plantation',   venue: 'School Garden',   time: '7:00 AM – 9:00 AM',  audience: 'Volunteers' },
  { date: '02 May', title: 'Inter-School Debate',    venue: 'Auditorium',      time: '11:00 AM – 3:00 PM', audience: 'Grade 11–12' },
];

const UPCOMING_EXAMS = [
  { date: '04 May', subject: 'Mathematics', className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: '06 May', subject: 'Physics',     className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: '08 May', subject: 'Chemistry',   className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: '10 May', subject: 'Biology',     className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: '12 May', subject: 'English',     className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: '14 May', subject: 'Hindi',       className: 'Grade 10-A', duration: '3 hrs',  status: 'Scheduled' },
  { date: '16 May', subject: 'Soc. Sci.',   className: 'Grade 10-A', duration: '3 hrs',  status: 'Tentative' },
  { date: '18 May', subject: 'Comp. Sci.',  className: 'Grade 10-A', duration: '2 hrs',  status: 'Tentative' },
];

const PUBLISHED_RESULTS = [
  { date: '18 Apr', subject: 'Mathematics', test: 'Unit Test 4',     score: 88, grade: 'A'  },
  { date: '15 Apr', subject: 'Physics',     test: 'Practical Lab',   score: 92, grade: 'A+' },
  { date: '12 Apr', subject: 'Chemistry',   test: 'Unit Test 4',     score: 76, grade: 'B'  },
  { date: '08 Apr', subject: 'Biology',     test: 'Surprise Quiz',   score: 81, grade: 'A'  },
  { date: '05 Apr', subject: 'English',     test: 'Essay Writing',   score: 85, grade: 'A'  },
  { date: '02 Apr', subject: 'Mathematics', test: 'Mid-term Mock',   score: 68, grade: 'C'  },
  { date: '28 Mar', subject: 'Comp. Sci.',  test: 'Project Eval',    score: 94, grade: 'A+' },
  { date: '25 Mar', subject: 'Hindi',       test: 'Unit Test 3',     score: 72, grade: 'B'  },
];
