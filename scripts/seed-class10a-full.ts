/**
 * Full Class 10-A seed — multi-subject, realistic pen data.
 *
 * Adds:
 *   - 8 new student user docs (if not already present)
 *   - 5 new teacher docs (one per subject)
 *   - 5 new class docs (Math, Chem, Bio, English, Hindi)
 *   - Updates existing class_10A.studentIds to include all 10 students
 *   - pen_sessions with realistic pen hardware metrics
 *   - evo_insights per (student, class)
 *
 * SAFE: merge writes + arrayUnion + existence checks.  Does NOT delete anything.
 *
 * Run: npx tsx scripts/seed-class10a-full.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import serviceAccount from './service-account.json' with { type: 'json' };

initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

const INSTITUTE_ID = 'inst_001';

// ── Students (2 existing + 8 to seed) ──────────────────────────────────────
const EXISTING_STUDENT_UIDS = [
  'Yg6NZSXfjjUrqfr2d288WOgLnh12',   // Atharv
  'kHKkZoVTxoNt9kmYnrnznKqzirz2',   // Sakshi Harode
];

const NEW_STUDENTS = [
  { id: 'seed_stu_arjun_001',  fullName: 'Arjun Sharma',  email: 'arjun.sharma@notivo.edu',  gender: 'M' },
  { id: 'seed_stu_priya_002',  fullName: 'Priya Patel',   email: 'priya.patel@notivo.edu',   gender: 'F' },
  { id: 'seed_stu_rahul_003',  fullName: 'Rahul Verma',   email: 'rahul.verma@notivo.edu',   gender: 'M' },
  { id: 'seed_stu_ananya_004', fullName: 'Ananya Iyer',   email: 'ananya.iyer@notivo.edu',   gender: 'F' },
  { id: 'seed_stu_rohan_005',  fullName: 'Rohan Mehta',   email: 'rohan.mehta@notivo.edu',   gender: 'M' },
  { id: 'seed_stu_sneha_006',  fullName: 'Sneha Desai',   email: 'sneha.desai@notivo.edu',   gender: 'F' },
  { id: 'seed_stu_karan_007',  fullName: 'Karan Joshi',   email: 'karan.joshi@notivo.edu',   gender: 'M' },
  { id: 'seed_stu_divya_008',  fullName: 'Divya Nair',    email: 'divya.nair@notivo.edu',    gender: 'F' },
];

const ALL_STUDENTS = [...EXISTING_STUDENT_UIDS, ...NEW_STUDENTS.map((s) => s.id)];

const STUDENT_NAMES: Record<string, string> = {
  'Yg6NZSXfjjUrqfr2d288WOgLnh12': 'Atharv',
  'kHKkZoVTxoNt9kmYnrnznKqzirz2': 'Sakshi Harode',
  'seed_stu_arjun_001':  'Arjun Sharma',
  'seed_stu_priya_002':  'Priya Patel',
  'seed_stu_rahul_003':  'Rahul Verma',
  'seed_stu_ananya_004': 'Ananya Iyer',
  'seed_stu_rohan_005':  'Rohan Mehta',
  'seed_stu_sneha_006':  'Sneha Desai',
  'seed_stu_karan_007':  'Karan Joshi',
  'seed_stu_divya_008':  'Divya Nair',
};

// ── 5 new teachers — realistic Indian names ────────────────────────────────
const NEW_TEACHERS = [
  { id: 'seed_tea_math_001',  fullName: 'Vikram Nair',         email: 'vikram.nair@notivo.edu',   subject: 'Mathematics' },
  { id: 'seed_tea_chem_002',  fullName: 'Priya Krishnamurthy', email: 'priya.k@notivo.edu',       subject: 'Chemistry'   },
  { id: 'seed_tea_bio_003',   fullName: 'Sunita Reddy',        email: 'sunita.reddy@notivo.edu',  subject: 'Biology'     },
  { id: 'seed_tea_eng_004',   fullName: 'Ramesh Iyer',         email: 'ramesh.iyer@notivo.edu',   subject: 'English'     },
  { id: 'seed_tea_hindi_005', fullName: 'Kavita Sharma',       email: 'kavita.sharma@notivo.edu', subject: 'Hindi'       },
];

// ── 5 new subject classes (Physics already exists as 'class_10A') ──────────
const NEW_CLASSES = [
  { id: '10A_Mathematics', subject: 'Mathematics', className: 'Class 10-A — Mathematics', teacherId: 'seed_tea_math_001'  },
  { id: '10A_Chemistry',   subject: 'Chemistry',   className: 'Class 10-A — Chemistry',   teacherId: 'seed_tea_chem_002'  },
  { id: '10A_Biology',     subject: 'Biology',     className: 'Class 10-A — Biology',     teacherId: 'seed_tea_bio_003'   },
  { id: '10A_English',     subject: 'English',     className: 'Class 10-A — English',     teacherId: 'seed_tea_eng_004'   },
  { id: '10A_Hindi',       subject: 'Hindi',       className: 'Class 10-A — Hindi',       teacherId: 'seed_tea_hindi_005' },
];

// ── Pen session shape (mirrors raw hardware data) ──────────────────────────
function makePenSession(
  studentUid: string, classId: string, subject: string,
  daysBack: number, durationMins: number,
  totalStrokes: number, avgPressure: number,
  penLiftCount: number, pagesFilled: number,
) {
  const startMs = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  return {
    studentUid, classId, subject,
    notebookId:           `nb_${studentUid.slice(-6)}_${classId}`,
    startTime:            startMs,
    endTime:              startMs + durationMins * 60 * 1000,
    status:               'completed',
    durationMinutes:      durationMins,
    totalStrokes,
    avgPressure,                                                     // 0–1 normalised
    avgWritingSpeedSps:   parseFloat((totalStrokes / (durationMins * 60)).toFixed(2)),
    penLiftCount,
    pagesFilled,
    hesitationFlag:       penLiftCount > 80,
    lowPressureFlag:      avgPressure < 0.35,
    createdAt:            Timestamp.fromMillis(startMs),
  };
}

type InsightSeed = {
  flag: 'at_risk' | 'ok';
  evoSummary: string;
  errorTags: string[];
  mistakeCount: number;
  writingSpeed: number;
  comprehensionScore: number;
};

// classId → studentUid → insight
const NEW_INSIGHTS: Record<string, Record<string, InsightSeed>> = {
  '10A_Mathematics': {
    'Yg6NZSXfjjUrqfr2d288WOgLnh12': { flag:'ok',      evoSummary:'Atharv solves quadratic equations accurately. Minor errors in factorisation shortcuts.', errorTags:['Factorisation (LOW)'], mistakeCount:2, writingSpeed:3.1, comprehensionScore:82 },
    'kHKkZoVTxoNt9kmYnrnznKqzirz2': { flag:'at_risk', evoSummary:'Sakshi struggles with trigonometric identities and coordinate geometry basics.',       errorTags:['Trigonometric Identities (HIGH)', 'Coordinate Geometry (HIGH)', 'Quadratic Roots (MEDIUM)'], mistakeCount:8,  writingSpeed:1.8, comprehensionScore:41 },
    'seed_stu_arjun_001':            { flag:'ok',      evoSummary:'Arjun handles linear equations and polynomials confidently.',                          errorTags:['Remainder Theorem (LOW)'], mistakeCount:1, writingSpeed:3.4, comprehensionScore:88 },
    'seed_stu_priya_002':            { flag:'at_risk', evoSummary:'Priya repeatedly makes sign errors in quadratic formula application.',                 errorTags:['Quadratic Formula Sign Error (HIGH)', 'Discriminant (MEDIUM)'], mistakeCount:7, writingSpeed:1.9, comprehensionScore:45 },
    'seed_stu_rahul_003':            { flag:'ok',      evoSummary:'Rahul is consistent in arithmetic progressions. Some confusion in GP formulas.',       errorTags:['GP Formula (MEDIUM)'], mistakeCount:3, writingSpeed:2.8, comprehensionScore:74 },
    'seed_stu_ananya_004':           { flag:'ok',      evoSummary:'Ananya excels in statistics and probability. Very few mistakes overall.',              errorTags:['Conditional Probability (LOW)'], mistakeCount:1, writingSpeed:3.6, comprehensionScore:91 },
    'seed_stu_rohan_005':            { flag:'at_risk', evoSummary:'Rohan is at risk in trigonometry — sine/cosine rule applications are frequently wrong.', errorTags:['Sine Rule (HIGH)', 'Cosine Rule (HIGH)', 'Angle Identities (MEDIUM)'], mistakeCount:11, writingSpeed:1.6, comprehensionScore:38 },
    'seed_stu_sneha_006':            { flag:'ok',      evoSummary:'Sneha performs well in geometry proofs. Occasional mistakes in circle theorem statements.', errorTags:['Circle Theorems (MEDIUM)'], mistakeCount:2, writingSpeed:3.0, comprehensionScore:79 },
    'seed_stu_karan_007':            { flag:'at_risk', evoSummary:'Karan has significant gaps in algebra — incorrectly applying BODMAS and missing brackets.', errorTags:['BODMAS (HIGH)', 'Algebraic Expansion (HIGH)', 'Polynomial Division (MEDIUM)'], mistakeCount:13, writingSpeed:1.4, comprehensionScore:33 },
    'seed_stu_divya_008':            { flag:'ok',      evoSummary:'Divya writes neat and structured solutions. Minor gap in surface area formulae.',      errorTags:['Surface Area — Cone (LOW)'], mistakeCount:2, writingSpeed:3.2, comprehensionScore:83 },
  },
  '10A_Chemistry': {
    'Yg6NZSXfjjUrqfr2d288WOgLnh12': { flag:'ok',      evoSummary:'Atharv writes balanced chemical equations accurately. Mole concept is strong.', errorTags:['Mole Concept (LOW)'], mistakeCount:1, writingSpeed:2.9, comprehensionScore:85 },
    'kHKkZoVTxoNt9kmYnrnznKqzirz2': { flag:'ok',      evoSummary:'Sakshi handles periodic table questions well. Minor confusion in valency.',   errorTags:['Valency Rules (LOW)'], mistakeCount:2, writingSpeed:2.7, comprehensionScore:78 },
    'seed_stu_arjun_001':            { flag:'ok',      evoSummary:'Arjun balances equations correctly. Electrochemistry needs revision.',        errorTags:['Electrochemistry (MEDIUM)'], mistakeCount:3, writingSpeed:2.6, comprehensionScore:76 },
    'seed_stu_priya_002':            { flag:'at_risk', evoSummary:'Priya confuses oxidation and reduction definitions consistently.',           errorTags:['Oxidation-Reduction (HIGH)', 'Redox Reactions (HIGH)', 'Ionic Equations (MEDIUM)'], mistakeCount:9, writingSpeed:1.7, comprehensionScore:42 },
    'seed_stu_rahul_003':            { flag:'ok',      evoSummary:'Rahul understands acids-bases-salts well. Weak in naming organic compounds.', errorTags:['Organic Nomenclature (MEDIUM)', 'IUPAC Naming (LOW)'], mistakeCount:4, writingSpeed:2.5, comprehensionScore:72 },
    'seed_stu_ananya_004':           { flag:'ok',      evoSummary:'Ananya is excellent in chemical bonding and Lewis structures.',              errorTags:['Hydrogen Bonding (LOW)'], mistakeCount:1, writingSpeed:3.5, comprehensionScore:90 },
    'seed_stu_rohan_005':            { flag:'ok',      evoSummary:'Rohan handles stoichiometry problems confidently.',                          errorTags:['Limiting Reagent (LOW)'], mistakeCount:2, writingSpeed:3.1, comprehensionScore:80 },
    'seed_stu_sneha_006':            { flag:'at_risk', evoSummary:'Sneha is struggling with chemical kinetics and rate equations.',              errorTags:['Rate of Reaction (HIGH)', 'Activation Energy (HIGH)', 'Le Chatelier Principle (MEDIUM)'], mistakeCount:8, writingSpeed:1.9, comprehensionScore:44 },
    'seed_stu_karan_007':            { flag:'ok',      evoSummary:'Karan writes neat molecular diagrams. Some errors in organic reactions.',    errorTags:['Organic Reactions — Substitution (MEDIUM)'], mistakeCount:3, writingSpeed:2.8, comprehensionScore:73 },
    'seed_stu_divya_008':            { flag:'ok',      evoSummary:'Divya has strong analytical chemistry skills. Metal reactivity series well memorised.', errorTags:['Corrosion Prevention (LOW)'], mistakeCount:1, writingSpeed:3.3, comprehensionScore:87 },
  },
  '10A_English': {
    'Yg6NZSXfjjUrqfr2d288WOgLnh12': { flag:'ok',      evoSummary:'Atharv writes grammatically correct sentences. Essay structure needs more practice.', errorTags:['Essay Paragraph Structure (LOW)'], mistakeCount:2, writingSpeed:4.1, comprehensionScore:80 },
    'kHKkZoVTxoNt9kmYnrnznKqzirz2': { flag:'ok',      evoSummary:'Sakshi has good comprehension skills. Tense usage is mostly accurate.',                errorTags:['Passive Voice Conversion (LOW)'], mistakeCount:2, writingSpeed:3.9, comprehensionScore:78 },
    'seed_stu_arjun_001':            { flag:'ok',      evoSummary:'Arjun writes fluently. Occasional misuse of prepositions.',                            errorTags:['Preposition Usage (LOW)'], mistakeCount:3, writingSpeed:3.7, comprehensionScore:77 },
    'seed_stu_priya_002':            { flag:'ok',      evoSummary:'Priya has strong vocabulary. Struggles slightly with formal letter format.',           errorTags:['Formal Letter Format (MEDIUM)'], mistakeCount:4, writingSpeed:3.5, comprehensionScore:74 },
    'seed_stu_rahul_003':            { flag:'at_risk', evoSummary:'Rahul makes frequent spelling errors and has trouble with complex sentences.',         errorTags:['Spelling Errors (HIGH)', 'Complex Sentences (HIGH)', 'Punctuation (MEDIUM)'], mistakeCount:12, writingSpeed:2.1, comprehensionScore:40 },
    'seed_stu_ananya_004':           { flag:'ok',      evoSummary:'Ananya writes exceptionally well — coherent arguments and varied vocabulary.',         errorTags:[], mistakeCount:0, writingSpeed:4.8, comprehensionScore:95 },
    'seed_stu_rohan_005':            { flag:'ok',      evoSummary:'Rohan is good at reading comprehension but weak in creative writing structure.',       errorTags:['Narrative Structure (MEDIUM)'], mistakeCount:3, writingSpeed:3.6, comprehensionScore:76 },
    'seed_stu_sneha_006':            { flag:'ok',      evoSummary:'Sneha writes clean and concise answers. Minor issues with reported speech.',           errorTags:['Reported Speech (LOW)'], mistakeCount:2, writingSpeed:4.0, comprehensionScore:82 },
    'seed_stu_karan_007':            { flag:'at_risk', evoSummary:'Karan has very low writing speed and frequent grammatical errors throughout his notebook.', errorTags:['Subject-Verb Agreement (HIGH)', 'Tense Consistency (HIGH)', 'Article Usage (MEDIUM)'], mistakeCount:14, writingSpeed:1.8, comprehensionScore:36 },
    'seed_stu_divya_008':            { flag:'ok',      evoSummary:'Divya demonstrates excellent written communication. Minor hesitation in poetry analysis.', errorTags:['Poetry Analysis (LOW)'], mistakeCount:1, writingSpeed:4.3, comprehensionScore:89 },
  },
};

function daysAgo(n: number) { return Timestamp.fromMillis(Date.now() - n * 86400000); }

async function main() {
  console.log('=== Notivo Full Class 10-A Seed ===\n');

  // ── 1. Create student user docs ──────────────────────────────────────────
  console.log('Step 1: Upserting student docs...');
  const stuBatch = db.batch();
  for (const s of NEW_STUDENTS) {
    stuBatch.set(db.collection('users').doc(s.id), {
      fullName:    s.fullName,
      name:        s.fullName,
      email:       s.email,
      role:        'student',
      gender:      s.gender,
      instituteId: INSTITUTE_ID,
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
    }, { merge: true });
    console.log(`  OK  ${s.fullName}`);
  }
  await stuBatch.commit();

  // ── 2. Create teacher user docs ──────────────────────────────────────────
  console.log('\nStep 2: Upserting teacher docs...');
  const teaBatch = db.batch();
  for (const t of NEW_TEACHERS) {
    teaBatch.set(db.collection('users').doc(t.id), {
      fullName:    t.fullName,
      name:        t.fullName,
      email:       t.email,
      role:        'teacher',
      subject:     t.subject,
      instituteId: INSTITUTE_ID,
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
    }, { merge: true });
    console.log(`  OK  ${t.fullName.padEnd(24)} [${t.subject}]`);
  }
  await teaBatch.commit();

  // ── 3. Update existing class_10A with all 10 students ────────────────────
  console.log('\nStep 3: Updating existing class_10A.studentIds + fixing subject...');
  await db.collection('classes').doc('class_10A').set({
    studentIds:  FieldValue.arrayUnion(...ALL_STUDENTS),
    subject:     'Physics',
    className:   'Class 10-A — Physics',
    instituteId: INSTITUTE_ID,
  }, { merge: true });
  console.log(`  OK  class_10A now has ${ALL_STUDENTS.length} students`);

  // ── 4. Create 5 new class docs ───────────────────────────────────────────
  console.log('\nStep 4: Creating 5 new subject classes...');
  const classBatch = db.batch();
  for (const c of NEW_CLASSES) {
    classBatch.set(db.collection('classes').doc(c.id), {
      className:   c.className,
      subject:     c.subject,
      teacherUid:  c.teacherId,
      studentIds:  ALL_STUDENTS,
      instituteId: INSTITUTE_ID,
      createdAt:   Timestamp.now(),
    }, { merge: true });
    console.log(`  OK  ${c.id.padEnd(18)} [${c.subject.padEnd(12)}] -> ${ALL_STUDENTS.length} students`);
  }
  await classBatch.commit();

  // ── 5. Seed pen sessions ─────────────────────────────────────────────────
  console.log('\nStep 5: Seeding pen sessions...');
  const sessionSubjects: Array<{classId: string; subject: string}> = [
    { classId: 'class_10A',       subject: 'Physics'     },
    { classId: '10A_Mathematics', subject: 'Mathematics' },
    { classId: '10A_Chemistry',   subject: 'Chemistry'   },
  ];
  const sessionPresets = [
    // [daysBack, durationMins, totalStrokes, avgPressure, penLiftCount, pagesFilled]
    [0,  45, 420, 0.72, 34, 3],   // today — completed this morning
    [1,  45, 380, 0.65, 51, 3],   // yesterday
    [3,  45, 290, 0.41, 88, 2],   // 3 days ago, high pen-lifts = confusion
  ] as const;

  let sessionCount = 0;
  for (const uid of ALL_STUDENTS) {
    for (let i = 0; i < sessionSubjects.length; i++) {
      const { classId, subject } = sessionSubjects[i];
      const [daysBack, dur, strokes, pressure, lifts, pages] = sessionPresets[i];
      await db.collection('penSessions').doc().set(
        makePenSession(uid, classId, subject, daysBack, dur, strokes, pressure, lifts, pages)
      );
      sessionCount++;
    }
  }

  // Add a handful of "active" sessions so the Live Sessions KPI has a pulse.
  // These are in-progress writing sessions right now (no endTime, status=active).
  const liveStudents = ALL_STUDENTS.slice(0, 3);
  const liveSubjects = [
    { classId: '10A_Mathematics', subject: 'Mathematics' },
    { classId: '10A_Chemistry',   subject: 'Chemistry'   },
    { classId: 'class_10A',       subject: 'Physics'     },
  ];
  for (let i = 0; i < liveStudents.length; i++) {
    const uid = liveStudents[i];
    const { classId, subject } = liveSubjects[i];
    const startMs = Date.now() - (10 + i * 3) * 60 * 1000; // started 10-16 min ago
    await db.collection('penSessions').doc().set({
      studentUid:         uid,
      classId,
      subject,
      notebookId:         `nb_${uid.slice(-6)}_${classId}`,
      startTime:          startMs,
      status:             'active',
      durationMinutes:    null,
      totalStrokes:       120 + i * 40,
      avgPressure:        0.58 + i * 0.04,
      avgWritingSpeedSps: 1.8,
      penLiftCount:       12 + i * 3,
      pagesFilled:        1,
      hesitationFlag:     false,
      lowPressureFlag:    false,
      createdAt:          Timestamp.fromMillis(startMs),
    });
    sessionCount++;
  }
  console.log(`  OK  ${sessionCount} pen sessions created (incl. ${liveStudents.length} live)`);

  // ── 6. Seed evo_insights for new classes ─────────────────────────────────
  console.log('\nStep 6: Seeding evo_insights...');
  const existingSnap = await db.collection('evo_insights').get();
  const existingPairs = new Set(
    existingSnap.docs.map((d) => `${d.data().studentUid}__${d.data().classId}`)
  );

  let insightCount = 0;
  for (const [classId, studentMap] of Object.entries(NEW_INSIGHTS)) {
    const cls = NEW_CLASSES.find((c) => c.id === classId)!;
    for (const [uid, ins] of Object.entries(studentMap)) {
      const key = `${uid}__${classId}`;
      if (existingPairs.has(key)) {
        console.log(`  SKIP ${(STUDENT_NAMES[uid] ?? uid).padEnd(18)} / ${classId}`);
        continue;
      }
      await db.collection('evo_insights').doc().set({
        studentUid:          uid,
        classId,
        notebookId:          `nb_${uid.slice(-6)}_${classId}`,
        notebookName:        `${cls.subject} — Class 10-A Notebook`,
        flag:                ins.flag,
        evoSummary:          ins.evoSummary,
        errorTags:           ins.errorTags,
        mistakeCount:        ins.mistakeCount,
        writingSpeedSps:     ins.writingSpeed,
        comprehensionScore:  ins.comprehensionScore,
        timestamp:           daysAgo(2),
      });
      insightCount++;
      const badge = ins.flag === 'at_risk' ? 'AT_RISK' : 'OK     ';
      console.log(`  ${badge}  ${(STUDENT_NAMES[uid] ?? uid).padEnd(18)} / ${classId}`);
    }
  }

  console.log('\n=== Done ===');
  console.log(`  Students seeded   : ${NEW_STUDENTS.length}`);
  console.log(`  Teachers seeded   : ${NEW_TEACHERS.length}`);
  console.log(`  New class docs    : ${NEW_CLASSES.length}  (+existing class_10A = 6 total)`);
  console.log(`  Pen sessions      : ${sessionCount}`);
  console.log(`  Insights created  : ${insightCount}`);
  console.log('\n! Clear localStorage: DevTools > Console > localStorage.clear() > Ctrl+Shift+R');
}

main().catch((err) => { console.error(err); process.exit(1); });
