// ── Auth & Roles ──

export type UserRole = 'admin' | 'teacher' | 'parent';

export interface AuthUser {
  name: string;
  role: UserRole;
  avatar?: string;
}

// ── Core Data Models ──

export interface Kpi {
  totalStudents: number;
  totalStudentsChange: string;
  totalTeachers: number;
  totalTeachersChange: string;
  penSessionsToday: number;
  penSessionsLive: number;
  studentsAtRisk: number;
}

export interface Alert {
  id: string;
  studentName: string;
  issue: string;
  context: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface Demographics {
  label: string;
  value: number;
}

export interface Student {
  name: string;
  roll: string;
  class: string;
  parent: string;
  feeStatus: 'Paid' | 'Due' | 'Partial';
}

export interface Teacher {
  name: string;
  av: string;
  col: string;
  sub: string;
  cls: string;
  joined: string;
  email: string;
  sal: string;
  status: 'Active' | 'On Leave' | 'Pending';
}

export interface Employee {
  name: string;
  role: string;
  department: string;
  email: string;
  status: 'Active' | 'On Leave';
}

export interface TimetableEntry {
  period: number;
  startTime: string;
  endTime: string;
  subject?: string;
  teacher?: string;
}

export interface WeakConcept {
  topic: string;
  score: number;
  subject?: string;
  grade?: string;
}

export interface HeatmapStudent {
  uid?: string;            // Firestore studentUid — needed to open detail modal
  name: string;
  risk: 0 | 1 | 2 | 3 | 4 | 5;
  score: number;
  hesitation?: string;
  crossouts?: number;
  speedDrop?: number;
  pages?: number;
  insight?: string;
}

// ── Student Detail Modal ──

export interface SubjectScore {
  subject: string;
  score: number; // 0–100, derived from comprehensionScore in evo_insights
}

export interface WeakTopic {
  topic: string;
  subject: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  desc: string;
}

export interface ImprovementTip {
  title: string;        // short action label, e.g. "Algebra drills"
  body: string;         // 1–2 sentence elaboration
  kind: 'practice' | 'concept' | 'support' | 'habit';
}

export interface PenBehaviour {
  totalHesitation: string; // formatted "M:SS"
  crossOuts: number;
  speedDropPct: number;    // negative integer, e.g. -72
  pagesWritten: number;
  writingPct: number;      // session timeline %, sums to 100
  hesitationPct: number;
  redoPct: number;
}

export interface AlertEntry {
  text: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  ago: string;
}

export interface StudentDetail {
  uid: string;
  name: string;
  roll: string;
  className: string;
  penId: string;                       // synthetic, e.g. "NTV-1013"
  tier: 'best' | 'good' | 'risk';
  overall: number;                     // 0–100, mean of subject scores
  subjects: SubjectScore[];
  weakTopics: WeakTopic[];             // sorted by severity desc
  goodAt: string[];                    // 2–3 strengths (LLM-generated)
  improvementPlan: ImprovementTip[];   // 3–4 actionable tips (LLM-generated)
  evoSummary: string;                  // 1–2 sentence narrative (LLM-generated)
  penBehaviour: PenBehaviour;
  alerts: AlertEntry[];
  generatedAt: string;                 // ISO timestamp of last AI run
  modelVersion: string;                // e.g. "gemini-2.5-flash" or "template-v1"
}

export interface Course {
  name: string;
  code: string;
  teacher: string;
  students: number;
  progress: number;
  color: string;
}

export interface SchoolEvent {
  date: string;
  month: string;
  title: string;
  time: string;
  theme: string;
  badge: string;
}

export interface ChildProfile {
  title: string;
  name: string;
  gender: string;
  roll: string;
  admissionId: string;
  admissionDate: string;
  class: string;
  section: string;
}

export interface SubjectPerformance {
  subject: string;
  score: number;
  grade: 'good' | 'fair' | 'weak';
}

export interface TeacherPerformance {
  name: string;
  issues: number;
  total: number;
  avgScore: number;
}

// ── Attendance Data ──

export interface AttendanceDay {
  day: string;
  present: number;
  absent: number;
}

// ── Dashboard aggregate ──

export interface DashboardData {
  kpis: Kpi;
  alerts: Alert[];
  demographics: Demographics[];
}
