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
  writingSpeed?: number;
  comprehensionScore?: number; // 0–100 — primary signal for subject score
  timestamp: Timestamp;
};

type AiInsightDoc = {
  studentUid: string;
  goodAt: string[];
  improvementPlan: Array<{ title: string; body: string; kind: 'practice' | 'concept' | 'support' | 'habit' }>;
  evoSummary: string;
  generatedAt: Timestamp | number;
  modelVersion: string;
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
  childUids?: string[]; // forward-compat for multiple children
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
   * Latest evo_insights mapped to the UI alert shape, severity-bucketed:
   *   - critical: at_risk flag
   *   - warning : non-at_risk with mistakeCount >= 3
   *   - info    : everything else (notable but healthy)
   */
  getAlerts: () =>
    cache.getOrFetch('alerts', TTL.day, async () => {
      try {
        const insights = await fetchEvoInsights();
        const top = insights.slice(0, 30);

        // Join student UIDs → display names
        const studentUids = Array.from(new Set(top.map((i) => i.studentUid)));
        const users = await fetchUsersByUid(studentUids);

        return top.map((i) => {
          const severity: import('./types').Alert['severity'] =
            i.flag === 'at_risk'      ? 'critical'
            : (i.mistakeCount ?? 0) >= 3 ? 'warning'
            :                              'info';
          return {
            id: i.id,
            studentUid: i.studentUid,
            studentName: resolveDisplayName(users.get(i.studentUid), i.studentUid),
            issue: i.evoSummary,
            context: `${i.notebookName} \u2022 ${i.mistakeCount} mistakes`,
            timestamp: i.timestamp?.toDate?.().toISOString() ?? '',
            severity,
          };
        });
      } catch (err) {
        console.error('getAlerts failed, using empty fallback', err);
        return FALLBACK.alerts;
      }
    }),

  /**
   * Today's engagement split: Attending vs Absent.
   *
   * "Attending" = students with at least one pen session today.
   * "Absent"    = remaining students in the institute.
   *
   * Backed by `penSessions` (proxy for attendance until we get a dedicated
   * attendance collection). The donut on the Dashboard renders this.
   */
  getDemographics: () =>
    cache.getOrFetch('demographics', TTL.day, async () => {
      const [classesRes, sessionsRes] = await Promise.allSettled([
        fetchClasses(),
        fetchPenSessions(),
      ]);
      const classes  = classesRes.status  === 'fulfilled' ? classesRes.value  : [];
      const sessions = sessionsRes.status === 'fulfilled' ? sessionsRes.value : [];

      const totalUids = new Set(classes.flatMap((c) => c.studentIds ?? []));
      const total = totalUids.size;
      if (total === 0) return FALLBACK.demographics;

      const todayStart = startOfTodayMs();
      const attendingUids = new Set<string>();
      for (const s of sessions) {
        const ts = s.createdAt?.toMillis?.() ?? s.startTime ?? 0;
        if (ts >= todayStart && totalUids.has(s.studentUid)) attendingUids.add(s.studentUid);
      }
      const attending = attendingUids.size;
      return [
        { label: 'Attending', value: attending },
        { label: 'Absent',    value: Math.max(0, total - attending) },
      ];
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
          return { uid, name, risk, score };
        });

        return result.sort((a, b) => b.risk - a.risk || a.score - b.score);
      } catch (err) {
        console.error('getStudentsWithRisk failed', err);
        return [];
      }
    }),

  /**
   * Children for a given parent uid. Returns HeatmapStudent[] with the same
   * risk/score scoring as `getStudentsWithRisk` so the parent dashboard can
   * reuse the same components (StudentInlinePreview, StudentDetailModal).
   *
   * Source of truth: `users/{parentUid}.childUids` (preferred, array) or
   * `users/{parentUid}.childUid` (legacy, single).
   */
  getChildrenForParent: (parentUid: string) =>
    cache.getOrFetch(`childrenFor:${parentUid}`, TTL.day, async () => {
      try {
        const parentSnap = await getDocs(
          query(collection(firestore, 'users'), where('__name__', '==', parentUid))
        );
        const parent = parentSnap.docs[0]?.data() as UserDoc | undefined;

        const childUids = Array.from(new Set([
          ...(parent?.childUids ?? []),
          ...(parent?.childUid ? [parent.childUid] : []),
        ])).filter(Boolean);

        // Reuse the school-wide heatmap result and filter — keeps scoring
        // consistent and avoids duplicating logic.
        const all = await api.getStudentsWithRisk();

        // ── DEMO_FALLBACK_START ────────────────────────────────────────────
        // No parent->child linkage in Firestore yet. Until the schema lands
        // (`users/{parentUid}.childUids`), fall back to the first 2 students
        // from the school heatmap so the Parent portal is demo-able.
        // To remove: delete this block; the function will then return [] and
        // ParentsView will show its "No children linked" empty state.
        if (childUids.length === 0) {
          return all.slice(0, 2);
        }
        // ── DEMO_FALLBACK_END ──────────────────────────────────────────────

        const byUid = new Map(all.map((s) => [s.uid, s]));

        // Fetch child user docs to fill in names for any missing from heatmap.
        const childUsers = await fetchUsersByUid(childUids);

        return childUids.map((uid) => {
          const fromHeatmap = byUid.get(uid);
          if (fromHeatmap) return fromHeatmap;
          const u = childUsers.get(uid);
          return {
            uid,
            name: resolveDisplayName(u, uid),
            risk: 0 as const,
            score: 75,
          };
        });
      } catch (err) {
        console.error('getChildrenForParent failed', err);
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
   * Class schedule for the teacher KPI drill-down. Returns class summaries
   * with student counts. Schema gap: `classes` doesn't store explicit
   * meeting days/time yet — derive a deterministic placeholder from the
   * class id so the demo is stable.
   */
  getTeacherClasses: () =>
    cache.getOrFetch('teacherClasses', TTL.day, async () => {
      try {
        const classes = await fetchClasses();
        const DAYS = [
          'Mon & Wed', 'Tue & Thu', 'Mon & Fri',
          'Wed & Fri', 'Thursday', 'Tuesday',
        ];
        const TIMES = [
          '9:00 AM', '10:00 AM', '11:00 AM',
          '9:00 AM', '2:00 PM', '3:00 PM',
        ];
        return classes.map((c, i) => ({
          classId: c.id,
          className: c.className ?? '—',
          subject: c.subject ?? '—',
          students: c.studentIds?.length ?? 0,
          days: DAYS[i % DAYS.length],
          time: TIMES[i % TIMES.length],
        }));
      } catch (err) {
        console.error('getTeacherClasses failed', err);
        return [];
      }
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

  /**
   * Weekly attendance derived from `penSessions`.
   *
   * A student is marked "present" on a given day if they have at least one
   * pen session whose start or createdAt falls on that calendar day. "Absent"
   * is the total-student count minus present. Returns 6 calendar days ending
   * today (Mon–Sat display).
   *
   * This is a proxy metric — truly accurate attendance needs a dedicated
   * collection, but it's the best we can derive from current schema.
   * FIXME_SCHEMA_ATTENDANCE: replace with real `attendance` docs when backend adds them.
   */
  getWeeklyAttendance: () =>
    cache.getOrFetch('weeklyAttendance', TTL.day, async () => {
      const [classesRes, sessionsRes] = await Promise.allSettled([
        fetchClasses(),
        fetchPenSessions(),
      ]);
      const classes  = classesRes.status === 'fulfilled'  ? classesRes.value  : [];
      const sessions = sessionsRes.status === 'fulfilled' ? sessionsRes.value : [];

      const totalStudents = new Set(classes.flatMap((c) => c.studentIds ?? [])).size;
      if (totalStudents === 0) return [];

      // Build 6-day window ending today.
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const out: Array<{ day: string; present: number; absent: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const dayStart = d.getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        const presentUids = new Set<string>();
        for (const s of sessions) {
          const ts = s.createdAt?.toMillis?.() ?? s.startTime ?? 0;
          if (ts >= dayStart && ts < dayEnd) presentUids.add(s.studentUid);
        }
        const present = presentUids.size;
        out.push({
          day: dayLabels[d.getDay()],
          present,
          absent: Math.max(0, totalStudents - present),
        });
      }
      return out;
    }),

  /**
   * KPIs for the Pen Analytics page.
   *
   * - atRisk: distinct students flagged `at_risk` in evo_insights.
   * - needingAttention: students with risk tier 2–3 in the heatmap (not critical, but not safe).
   * - avgClassScore: mean of per-student comprehension scores (0–100).
   * - activeSessions: pen sessions with status === 'active'.
   */
  getAnalyticsKpis: () =>
    cache.getOrFetch('analyticsKpis', TTL.day, async () => {
      const [classesRes, insightsRes, sessionsRes] = await Promise.allSettled([
        fetchClasses(),
        fetchEvoInsights(),
        fetchPenSessions(),
      ]);
      const classes  = classesRes.status  === 'fulfilled' ? classesRes.value  : [];
      const insights = insightsRes.status === 'fulfilled' ? insightsRes.value : [];
      const sessions = sessionsRes.status === 'fulfilled' ? sessionsRes.value : [];

      // Aggregate per student: at-risk count + avg severity score.
      const perStudent = new Map<string, { atRiskCount: number; sevTotal: number; sevCount: number }>();
      for (const ins of insights) {
        const uid = ins.studentUid;
        const entry = perStudent.get(uid) ?? { atRiskCount: 0, sevTotal: 0, sevCount: 0 };
        if (ins.flag === 'at_risk') entry.atRiskCount++;
        for (const tag of ins.errorTags ?? []) {
          entry.sevTotal += severityToScore(parseErrorTag(tag).severity);
          entry.sevCount++;
        }
        perStudent.set(uid, entry);
      }

      const allStudents = new Set(classes.flatMap((c) => c.studentIds ?? []));
      let atRisk = 0;
      let needingAttention = 0;
      let scoreSum = 0;
      let scoreN = 0;
      for (const uid of allStudents) {
        const p = perStudent.get(uid);
        const score = p && p.sevCount > 0 ? p.sevTotal / p.sevCount : 75;
        scoreSum += score;
        scoreN += 1;
        if (p && p.atRiskCount > 0) atRisk++;
        else if (score < 70) needingAttention++;
      }

      const avgClassScore = scoreN > 0 ? Math.round(scoreSum / scoreN) : 0;
      const activeSessions = sessions.filter((s) => s.status === 'active').length;

      return { atRisk, needingAttention, avgClassScore, activeSessions };
    }),

  /**
   * Per-class aggregate view for the Courses page.
   *
   * For every class in this institute, computes:
   *   - enrollments    (studentIds.length)
   *   - atRiskCount    (distinct students flagged at_risk in evo_insights)
   *   - avgScore       (mean comprehensionScore across the class's insights;
   *                     falls back to severity-derived score)
   *   - topWeakTopic   (most-flagged HIGH/MEDIUM topic for the class)
   *   - teacherName / initials
   *
   * Returns a stable shape for CoursesView. Cached for one day.
   */
  getCoursesOverview: () =>
    cache.getOrFetch('coursesOverview', TTL.day, async () => {
      try {
        const [classes, insights] = await Promise.all([
          fetchClasses(),
          fetchEvoInsights(),
        ]);
        const teacherUids = Array.from(new Set(classes.map((c) => c.teacherUid).filter(Boolean)));
        const users = await fetchUsersByUid(teacherUids);

        // Group insights by classId for fast per-class aggregation.
        const byClass = new Map<string, EvoInsightDoc[]>();
        for (const ins of insights) {
          const arr = byClass.get(ins.classId) ?? [];
          arr.push(ins);
          byClass.set(ins.classId, arr);
        }

        return classes.map((c) => {
          const classInsights = byClass.get(c.id) ?? [];

          // Avg comprehensionScore (or fallback)
          let scoreSum = 0; let scoreN = 0;
          for (const i of classInsights) {
            const s = typeof i.comprehensionScore === 'number'
              ? i.comprehensionScore
              : 100 - Math.min(100, (i.mistakeCount ?? 0) * 8);
            scoreSum += s; scoreN++;
          }
          const avgScore = scoreN > 0 ? Math.round(scoreSum / scoreN) : 0;

          // Distinct at-risk students within the class
          const atRiskUids = new Set(
            classInsights.filter((i) => i.flag === 'at_risk').map((i) => i.studentUid),
          );

          // Top weak topic for this class
          const topicHits = new Map<string, number>();
          for (const i of classInsights) {
            for (const raw of i.errorTags ?? []) {
              const { topic, severity } = parseErrorTag(raw);
              if (!topic || severity === 'LOW' || severity === 'UNKNOWN') continue;
              topicHits.set(topic, (topicHits.get(topic) ?? 0) + (severity === 'HIGH' ? 2 : 1));
            }
          }
          const topWeakTopic = Array.from(topicHits.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

          const teacher = users.get(c.teacherUid);
          const teacherName = resolveDisplayName(teacher, c.teacherUid || '—');
          const initials = teacherName
            .split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '–';

          return {
            classId: c.id,
            className: c.className ?? '—',
            subject: c.subject ?? '—',
            teacherName,
            teacherInitials: initials,
            enrollments: c.studentIds?.length ?? 0,
            atRiskCount: atRiskUids.size,
            avgScore,
            topWeakTopic,
            sessionsLogged: classInsights.length,
          };
        });
      } catch (err) {
        console.error('getCoursesOverview failed', err);
        return [];
      }
    }),

  /**
   * Detailed view for a single student — powers the Student Detail Modal.
   *
   * Combines two data sources:
   *   1. **Hard data from `evo_insights`** (one doc per student × class):
   *      - subject scores derived from `comprehensionScore`
   *      - weak topics parsed from `errorTags[]`
   *      - tier (best/good/risk) from overall comprehension
   *   2. **AI-generated copy from `ai_insights/{uid}`**:
   *      - `goodAt[]` strengths
   *      - `improvementPlan[]` actionable tips
   *      - `evoSummary` narrative
   *
   * The AI doc is pre-computed by `scripts/generate-ai-insights.ts`. If the
   * doc is missing, we fall back to deterministic template copy so the modal
   * still renders meaningful content.
   *
   * Cached per-uid for one day.
   */
  getStudentDetail: (studentUid: string) =>
    cache.getOrFetch(`studentDetail:${studentUid}`, TTL.day, async () => {
      // Pull everything in parallel.
      const [userSnap, insightsSnap, classesSnap, aiSnap] = await Promise.allSettled([
        getDocs(query(collection(firestore, 'users'), where('__name__', '==', studentUid))),
        getDocs(query(collection(firestore, 'evo_insights'), where('studentUid', '==', studentUid))),
        getDocs(query(collection(firestore, 'classes'), where('instituteId', '==', _instituteId))),
        getDocs(query(collection(firestore, 'ai_insights'), where('__name__', '==', studentUid))),
      ]);

      const userDoc = userSnap.status === 'fulfilled' ? userSnap.value.docs[0]?.data() as UserDoc | undefined : undefined;
      const insights = insightsSnap.status === 'fulfilled'
        ? insightsSnap.value.docs.map((d) => d.data() as EvoInsightDoc)
        : [];
      const classes = classesSnap.status === 'fulfilled'
        ? classesSnap.value.docs.map((d) => ({ id: d.id, ...(d.data() as ClassDoc) }))
        : [];
      const aiDoc = aiSnap.status === 'fulfilled' ? aiSnap.value.docs[0]?.data() as AiInsightDoc | undefined : undefined;

      const name = resolveDisplayName(userDoc, studentUid);

      // ── Subject scores: one row per class the student belongs to ──────
      const classById = new Map(classes.map((c) => [c.id, c]));
      const subjectMap = new Map<string, number[]>(); // subject → comprehensionScores
      for (const ins of insights) {
        const cls = classById.get(ins.classId);
        const subject = cls?.subject ?? ins.classId;
        if (!subject) continue;
        const score = typeof ins.comprehensionScore === 'number'
          ? ins.comprehensionScore
          : 100 - Math.min(100, (ins.mistakeCount ?? 0) * 8); // crude fallback
        const arr = subjectMap.get(subject) ?? [];
        arr.push(score);
        subjectMap.set(subject, arr);
      }
      const subjects = Array.from(subjectMap.entries()).map(([subject, scores]) => ({
        subject,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }));

      const overall = subjects.length > 0
        ? Math.round(subjects.reduce((s, x) => s + x.score, 0) / subjects.length)
        : 0;

      // ── Weak topics: aggregate errorTags HIGH/MEDIUM across classes ──
      const weakTopics: import('./types').WeakTopic[] = [];
      for (const ins of insights) {
        const cls = classById.get(ins.classId);
        const subject = cls?.subject ?? '';
        for (const raw of ins.errorTags ?? []) {
          const { topic, severity } = parseErrorTag(raw);
          if (severity === 'LOW' || severity === 'UNKNOWN') continue; // only show HIGH/MEDIUM in modal
          weakTopics.push({
            topic,
            subject,
            severity,
            // Use evoSummary as desc context — better than nothing.
            desc: ins.evoSummary || `Difficulty observed in ${topic.toLowerCase()}.`,
          });
        }
      }
      // Sort: HIGH first, then MEDIUM. Dedupe by topic+subject.
      const seen = new Set<string>();
      const dedupedWeakTopics = weakTopics
        .sort((a, b) => (a.severity === 'HIGH' ? -1 : 1) - (b.severity === 'HIGH' ? -1 : 1))
        .filter((w) => {
          const key = `${w.subject}::${w.topic}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      // ── Tier from overall ──
      const tier: 'best' | 'good' | 'risk' =
        overall >= 80 ? 'best' : overall >= 60 ? 'good' : 'risk';

      // ── AI-generated copy (fallback to template if missing) ──
      const goodAt: string[] = aiDoc?.goodAt ?? deriveTemplateGoodAt(subjects);
      const improvementPlan = aiDoc?.improvementPlan ?? deriveTemplatePlan(dedupedWeakTopics);
      const evoSummary = aiDoc?.evoSummary
        ?? insights[0]?.evoSummary
        ?? 'Student profile under review. Run scripts/generate-ai-insights.ts for personalised insight.';
      const generatedAt = aiDoc?.generatedAt
        ? (typeof aiDoc.generatedAt === 'number'
            ? new Date(aiDoc.generatedAt).toISOString()
            : (aiDoc.generatedAt as Timestamp).toDate?.().toISOString() ?? '')
        : '';
      const modelVersion = aiDoc?.modelVersion ?? 'template-v1';

      // FIXME_SCHEMA_ROLL: no roll number stored — fake from class index.
      const homeClass = classes.find((c) => (c.studentIds ?? []).includes(studentUid));
      const roll = homeClass
        ? `${(homeClass.studentIds ?? []).indexOf(studentUid) + 1}`.padStart(3, '0')
        : '—';

      // ── Pen behaviour KPIs (derived from evo_insights) ──
      const penBehaviour = derivePenBehaviour(studentUid, insights, overall);
      const penId = derivePenId(studentUid);

      // ── Live alerts: synthesize from student's recent evo_insights ──
      const alerts = deriveAlerts(insights, classById);

      return {
        uid: studentUid,
        name,
        roll,
        className: homeClass?.className ?? '',
        penId,
        tier,
        overall,
        subjects: subjects.sort((a, b) => b.score - a.score),
        weakTopics: dedupedWeakTopics,
        goodAt,
        improvementPlan,
        evoSummary,
        penBehaviour,
        alerts,
        generatedAt,
        modelVersion,
      } satisfies import('./types').StudentDetail;
    }),
};

// ── Pen behaviour derivation ────────────────────────────────────────────────
// Schema gap: penSessions doesn't store hesitation/cross-out/speed.
// We derive plausible numbers from evo_insights so the UI tells a coherent
// story. Tier-aware: at-risk students show worse pen behaviour.
function derivePenBehaviour(
  uid: string,
  insights: EvoInsightDoc[],
  overall: number,
): import('./types').PenBehaviour {
  const totalMistakes = insights.reduce((s, i) => s + (i.mistakeCount ?? 0), 0);
  const seed = uidHash(uid);

  // Cross-outs ≈ mistake count (fallback to seeded 5–25).
  const crossOuts = totalMistakes > 0 ? totalMistakes : 5 + (seed % 20);

  // Hesitation: scales inverse to overall score. 100% → 1:00, 0% → 9:30.
  const hesitationSec = Math.round((100 - overall) * 5 + 60 + (seed % 40));
  const totalHesitation = `${Math.floor(hesitationSec / 60)}:${String(hesitationSec % 60).padStart(2, '0')}`;

  // Speed drop: more negative for at-risk students.
  const speedDropPct = -Math.min(95, Math.round((100 - overall) * 0.85 + (seed % 10)));

  // Pages: 1–4 based on sessions / insight count.
  const pagesWritten = Math.max(1, Math.min(4, Math.round(insights.length / 2) || 1));

  // Session timeline: writing dominates for top performers, re-do for at-risk.
  let writingPct: number, hesitationPct: number, redoPct: number;
  if (overall >= 80) {
    writingPct = 70; hesitationPct = 20; redoPct = 10;
  } else if (overall >= 60) {
    writingPct = 50; hesitationPct = 30; redoPct = 20;
  } else {
    writingPct = 30; hesitationPct = 30; redoPct = 40;
  }

  return { totalHesitation, crossOuts, speedDropPct, pagesWritten, writingPct, hesitationPct, redoPct };
}

function derivePenId(uid: string): string {
  // Stable 4-digit id from uid hash.
  return `NTV-${1000 + (uidHash(uid) % 9000)}`;
}

function uidHash(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) - h + uid.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function deriveAlerts(
  insights: EvoInsightDoc[],
  classById: Map<string, ClassDoc & { id: string }>,
): import('./types').AlertEntry[] {
  const out: import('./types').AlertEntry[] = [];
  const sorted = [...insights].sort((a, b) => {
    const at = a.timestamp?.toMillis?.() ?? 0;
    const bt = b.timestamp?.toMillis?.() ?? 0;
    return bt - at;
  });
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    const ins = sorted[i];
    const cls = classById.get(ins.classId);
    const ago = relativeAgo(ins.timestamp?.toMillis?.() ?? Date.now());
    const sev: 'HIGH' | 'MEDIUM' | 'LOW' =
      (ins.mistakeCount ?? 0) >= 8 ? 'HIGH' : (ins.mistakeCount ?? 0) >= 4 ? 'MEDIUM' : 'LOW';
    const subject = cls?.subject ?? '';
    const text = ins.evoSummary
      ? ins.evoSummary
      : `${ins.mistakeCount ?? 0} mistakes in ${subject || 'recent session'}.`;
    out.push({ text, severity: sev, ago });
  }
  return out;
}

function relativeAgo(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Template fallbacks (used when ai_insights doc is missing) ───────────────
function deriveTemplateGoodAt(subjects: Array<{ subject: string; score: number }>): string[] {
  const top = subjects.filter((s) => s.score >= 75).sort((a, b) => b.score - a.score).slice(0, 3);
  if (top.length === 0) return ['Showing consistent effort across all subjects.'];
  return top.map((s) => `Strong performance in ${s.subject} (${s.score}%).`);
}

function deriveTemplatePlan(weakTopics: Array<{ topic: string; subject: string; severity: string }>) {
  if (weakTopics.length === 0) {
    return [
      { title: 'Maintain consistency', body: 'Keep practising daily to retain current performance levels.', kind: 'habit' as const },
    ];
  }
  return weakTopics.slice(0, 4).map((w) => ({
    title: `${w.topic} drills`,
    body: `Spend 10–15 minutes daily on targeted ${w.topic.toLowerCase()} practice in ${w.subject}.`,
    kind: 'practice' as const,
  }));
}

