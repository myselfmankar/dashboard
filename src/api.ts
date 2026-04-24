/**
 * Dashboard data layer.
 *
 * Read-only Firestore queries, cached for one day (TTL.day). Data in
 * `mvp-notivo` is batch-processed nightly, so we don't need fresher reads.
 *
 * Caller contract is identical to the previous json-server version, so views
 * don't need to change. Anything we cannot compute from the current schema
 * returns an empty array / zero — see `FIXME_SCHEMA_*` comments below for the
 * exact backend data we're still missing.
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { cache, TTL } from './lib/cache';

// ── Fallback defaults (used when Firestore is unreachable) ────────────────────
// These are zero/empty values — views gracefully show empty states.
const FALLBACK = {
  kpis: {
    totalStudents: 0,
    totalStudentsChange: '',
    totalTeachers: 0,
    totalTeachersChange: '',
    penSessionsToday: 0,
    penSessionsLive: 0,
    studentsAtRisk: 0,
  },
  alerts:              [] as never[],
  demographics:        [] as never[],
  teachers:            [] as never[],
  students:            [] as never[],
  weakConceptAnalytics: [] as never[],
};

// ── Runtime config (set at login from the signed-in user's Firestore doc) ──────
let _instituteId = 'inst_001'; // fallback until App.tsx calls setApiConfig

export function setApiConfig(cfg: { instituteId: string }) {
  if (cfg.instituteId) _instituteId = cfg.instituteId;
}

// ── Raw Firestore types (narrow views of schema) ─────────────────────────────
type ClassDoc = {
  className: string;
  subject: string;
  teacherUid: string;
  studentIds: string[];
  coveredTopics: string[];
  instituteId: string;
  createdAt: Timestamp;
};

type EvoInsightDoc = {
  studentUid: string;
  classId: string;
  notebookId: string;
  notebookName: string;
  flag: 'at_risk' | 'ok' | string;
  evoSummary: string;
  errorTags: string[];
  mistakeCount: number;
  timestamp: Timestamp;
};

type UserDoc = {
  // All name variants observed in Firestore schema dump
  fullName?: string;
  displayName?: string;
  name?: string;
  email?: string;
  uid?: string;
  plan?: string;
  accountType?: string;
  role?: 'admin' | 'teacher' | 'parent';
  instituteId?: string;
  // Parent-specific
  childName?: string;
  childUid?: string;
  createdAt?: number;
  lastActiveAt?: number;
};

/** Consistent display name: fullName > displayName > name > email > uid fallback */
function resolveDisplayName(u: UserDoc | undefined, fallback: string): string {
  if (!u) return fallback;
  return u.fullName || u.displayName || u.name || u.email || fallback;
}

type PenSessionDoc = {
  sessionId: string;
  studentUid: string;
  classId: string | null;
  subject: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | string;
  createdAt: Timestamp;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function docData<T>(d: QueryDocumentSnapshot<DocumentData>): T & { id: string } {
  return { id: d.id, ...(d.data() as T) };
}

async function fetchClasses(): Promise<Array<ClassDoc & { id: string }>> {
  const q = query(collection(firestore, 'classes'), where('instituteId', '==', _instituteId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docData<ClassDoc>(d));
}

async function fetchUsersByUid(uids: string[]): Promise<Map<string, UserDoc>> {
  // Firestore `in` queries are capped at 30 values — chunk it.
  const unique = Array.from(new Set(uids)).filter(Boolean);
  const out = new Map<string, UserDoc>();
  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    // `__name__` lets us filter by document id.
    const q = query(collection(firestore, 'users'), where('__name__', 'in', chunk));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => out.set(d.id, d.data() as UserDoc));
  }
  return out;
}

async function fetchEvoInsights(): Promise<Array<EvoInsightDoc & { id: string }>> {
  const q = query(collection(firestore, 'evo_insights'), orderBy('timestamp', 'desc'), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docData<EvoInsightDoc>(d));
}

async function fetchPenSessions(): Promise<Array<PenSessionDoc & { id: string }>> {
  const q = query(collection(firestore, 'penSessions'), orderBy('createdAt', 'desc'), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docData<PenSessionDoc>(d));
}

// Parse "Newton's Laws (HIGH)" → { topic, severity }
function parseErrorTag(tag: string): { topic: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' } {
  const match = /^(.*?)\s*\((HIGH|MEDIUM|LOW)\)\s*$/i.exec(tag);
  if (match) return { topic: match[1].trim(), severity: match[2].toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW' };
  return { topic: tag.trim(), severity: 'UNKNOWN' };
}

function severityToScore(sev: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'): number {
  // Higher score == stronger understanding. We invert severity of mistakes.
  switch (sev) {
    case 'HIGH': return 35;
    case 'MEDIUM': return 55;
    case 'LOW': return 75;
    default: return 65;
  }
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ── Public API ───────────────────────────────────────────────────────────────
export const api = {
  /**
   * Aggregate KPIs for the dashboard header cards.
   *
   * - totalStudents: unique studentUids across this institute's classes.
   * - totalTeachers: unique teacherUids across this institute's classes.
   * - penSessionsToday: pen sessions created today.
   * - penSessionsLive: pen sessions currently active.
   * - studentsAtRisk: distinct studentUids flagged `at_risk` in evo_insights.
   */
  getKpis: () =>
    cache.getOrFetch('kpis', TTL.day, async () => {
      // Use allSettled so one denied collection (e.g. penSessions without admin
      // read rules) doesn't zero out every KPI. Each sub-query degrades
      // independently.
      const [classesRes, insightsRes, sessionsRes] = await Promise.allSettled([
        fetchClasses(),
        fetchEvoInsights(),
        fetchPenSessions(),
      ]);

      if (classesRes.status === 'rejected') {
        console.error('getKpis: fetchClasses failed', classesRes.reason);
      }
      if (insightsRes.status === 'rejected') {
        console.error('getKpis: fetchEvoInsights failed', insightsRes.reason);
      }
      if (sessionsRes.status === 'rejected') {
        console.error('getKpis: fetchPenSessions failed', sessionsRes.reason);
      }

      const classes  = classesRes.status  === 'fulfilled' ? classesRes.value  : [];
      const insights = insightsRes.status === 'fulfilled' ? insightsRes.value : [];
      const sessions = sessionsRes.status === 'fulfilled' ? sessionsRes.value : [];

      const studentSet = new Set<string>();
      const teacherSet = new Set<string>();
      for (const c of classes) {
        c.studentIds?.forEach((s) => studentSet.add(s));
        if (c.teacherUid) teacherSet.add(c.teacherUid);
      }

      const todayStart = startOfTodayMs();
      const penSessionsToday = sessions.filter(
        (s) => (s.createdAt?.toMillis?.() ?? s.startTime ?? 0) >= todayStart,
      ).length;
      const penSessionsLive = sessions.filter((s) => s.status === 'active').length;

      const atRiskStudents = new Set(
        insights.filter((i) => i.flag === 'at_risk').map((i) => i.studentUid),
      );

      return {
        totalStudents: studentSet.size,
        // FIXME_SCHEMA_GROWTH: no historical snapshot to compute real % change yet.
        totalStudentsChange: '',
        totalTeachers: teacherSet.size,
        totalTeachersChange: '',
        penSessionsToday,
        penSessionsLive,
        studentsAtRisk: atRiskStudents.size,
      };
    }),

  /**
   * Latest at-risk evo_insights mapped to the UI alert shape.
   */
  getAlerts: () =>
    cache.getOrFetch('alerts', TTL.day, async () => {
      try {
        const insights = await fetchEvoInsights();
        const atRisk = insights.filter((i) => i.flag === 'at_risk').slice(0, 20);

        // Join student UIDs → display names
        const studentUids = Array.from(new Set(atRisk.map((i) => i.studentUid)));
        const users = await fetchUsersByUid(studentUids);

        return atRisk.map((i) => ({
          id: i.id,
          studentName: resolveDisplayName(users.get(i.studentUid), i.studentUid),
          issue: i.evoSummary,
          context: `${i.notebookName} • ${i.mistakeCount} mistakes`,
          timestamp: i.timestamp?.toDate?.().toISOString() ?? '',
          severity: 'critical' as const,
        }));
      } catch (err) {
        console.error('getAlerts failed, using empty fallback', err);
        return FALLBACK.alerts;
      }
    }),

  /**
   * Student gender / section demographics.
   * FIXME_SCHEMA_DEMOGRAPHICS: users docs have no gender/section field. Ask
   * backend to add `gender` (and optionally `grade`, `section`) on `users`
   * docs where `role == "student"`.
   */
  getDemographics: () =>
    cache.getOrFetch('demographics', TTL.day, async () => {
      try {
        const classes = await fetchClasses();
        const total = classes.reduce((n, c) => n + (c.studentIds?.length ?? 0), 0);
        return [{ label: 'Students', value: total }];
      } catch {
        return FALLBACK.demographics;
      }
    }),

  /**
   * Teacher roster for this institute. Joins `classes.teacherUid` with `users`.
   */
  getTeachers: () =>
    cache.getOrFetch('teachers', TTL.day, async () => {
      try {
        const classes = await fetchClasses();
        const teacherUids = Array.from(new Set(classes.map((c) => c.teacherUid).filter(Boolean)));
        const users = await fetchUsersByUid(teacherUids);

        return classes.map((c) => {
          const u = users.get(c.teacherUid);
          const name = resolveDisplayName(u, c.teacherUid);
          const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
          return {
            name,
            av: initials,
            col: '#8b5cf6',
            sub: c.subject ?? '',
            cls: c.className ?? '',
            joined: u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
            email: u?.email ?? '',
            sal: '', // FIXME_SCHEMA_SALARY: not stored.
            status: 'Active' as const,
          };
        });
      } catch (err) {
        console.error('getTeachers failed, using empty fallback', err);
        return FALLBACK.teachers;
      }
    }),

  /**
   * Student roster derived from classes.studentIds joined with users.
   */
  getStudents: () =>
    cache.getOrFetch('students', TTL.day, async () => {
      try {
        const classes = await fetchClasses();
        const studentUids = Array.from(new Set(classes.flatMap((c) => c.studentIds ?? [])));
        const users = await fetchUsersByUid(studentUids);

        return classes.flatMap((c, ci) =>
          (c.studentIds ?? []).map((uid, si) => {
            const u = users.get(uid);
            return {
              name: resolveDisplayName(u, uid),
              roll: `${ci + 1}-${si + 1}`, // FIXME_SCHEMA_ROLL: no real roll number stored.
              class: c.className,
              parent: '', // FIXME_SCHEMA_PARENT: parent linkage not stored.
              feeStatus: 'Paid' as const, // FIXME_SCHEMA_FEES: not stored.
            };
          }),
        );
      } catch (err) {
        console.error('getStudents failed, using empty fallback', err);
        return FALLBACK.students;
      }
    }),

  /**
   * Per-student risk heatmap data derived from evo_insights + users join.
   * Returns HeatmapStudent[] sorted by risk desc, then score asc.
   */
  getStudentsWithRisk: () =>
    cache.getOrFetch('studentsWithRisk', TTL.day, async () => {
      try {
        const [classes, insights] = await Promise.all([fetchClasses(), fetchEvoInsights()]);
        const allStudentUids = Array.from(new Set(classes.flatMap((c) => c.studentIds ?? [])));
        const users = await fetchUsersByUid(allStudentUids);

        const insightMap = new Map<string, { atRiskCount: number; sevTotal: number; sevCount: number }>();
        for (const ins of insights) {
          const uid = ins.studentUid;
          const entry = insightMap.get(uid) ?? { atRiskCount: 0, sevTotal: 0, sevCount: 0 };
          if (ins.flag === 'at_risk') entry.atRiskCount++;
          for (const tag of ins.errorTags ?? []) {
            const { severity } = parseErrorTag(tag);
            entry.sevTotal += severityToScore(severity);
            entry.sevCount++;
          }
          insightMap.set(uid, entry);
        }

        const result = allStudentUids.map((uid) => {
          const u = users.get(uid);
          const name = resolveDisplayName(u, uid);
          const ins = insightMap.get(uid);
          const score = ins && ins.sevCount > 0 ? Math.round(ins.sevTotal / ins.sevCount) : 75;
          const atRisk = ins?.atRiskCount ?? 0;
          let risk: 0 | 1 | 2 | 3 | 4 | 5;
          if (score >= 80 && atRisk === 0) risk = 0;
          else if (score >= 70 && atRisk === 0) risk = 1;
          else if (score >= 60 || atRisk === 1) risk = 2;
          else if (score >= 50 || atRisk <= 2) risk = 3;
          else if (score >= 40 || atRisk <= 3) risk = 4;
          else risk = 5;
          return { name, risk, score };
        });

        return result.sort((a, b) => b.risk - a.risk || a.score - b.score);
      } catch (err) {
        console.error('getStudentsWithRisk failed', err);
        return [];
      }
    }),

  /**
   * Non-teaching staff.
   * FIXME_SCHEMA_EMPLOYEES: no `employees` collection. Ask backend to add one
   * (or a `role: "staff"` convention on `users`).
   */
  getEmployees: () =>
    cache.getOrFetch('employees', TTL.day, async () => {
      return [];
    }),

  /**
   * Weekly class timetable.
   * FIXME_SCHEMA_TIMETABLE: no `timetables` collection. Ask backend to add one
   * keyed by classId with per-period subject/teacher entries.
   */
  getTimetable: () =>
    cache.getOrFetch('timetable', TTL.day, async () => {
      return [];
    }),

  /**
   * Weak-concept analytics derived from `evo_insights.errorTags[]`.
   * Aggregates across all at-risk insights and surfaces the worst topics.
   */
  getWeakConcepts: () =>
    cache.getOrFetch('weakConcepts', TTL.day, async () => {
      try {
        const insights = await fetchEvoInsights();
        const counts = new Map<string, { hits: number; sevTotal: number }>();

        for (const ins of insights) {
          for (const raw of ins.errorTags ?? []) {
            const { topic, severity } = parseErrorTag(raw);
            if (!topic) continue;
            const entry = counts.get(topic) ?? { hits: 0, sevTotal: 0 };
            entry.hits += 1;
            entry.sevTotal += severityToScore(severity);
            counts.set(topic, entry);
          }
        }

        return Array.from(counts.entries())
          .map(([topic, { hits, sevTotal }]) => ({
            topic,
            score: Math.round(sevTotal / hits),
            subject: '', // FIXME_SCHEMA_TOPIC_SUBJECT: errorTags don't carry subject, would need join with classes via classId.
            grade: '',
          }))
          .sort((a, b) => a.score - b.score)
          .slice(0, 12);
      } catch (err) {
        console.error('getWeakConcepts failed, using empty fallback', err);
        return FALLBACK.weakConceptAnalytics;
      }
    }),
};

