/**
 * Browser-side real-time AI insight generator.
 *
 * Calls Gemini directly from the browser using `VITE_GEMINI_API_KEY`. Used by
 * the Student Detail panel to refresh AI copy on demand instead of relying
 * exclusively on the offline pre-generation script.
 *
 * SECURITY NOTE: `VITE_GEMINI_API_KEY` IS visible in the production JS bundle.
 * For a real deployment, replace this with a Cloud Function call (see TODO in
 * scripts/generate-ai-insights.ts). For the MVP demo this trade-off is
 * acceptable — the offline script is still the canonical source of truth.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import type { ImprovementTip } from '../types';

export interface RealtimeAiResult {
  goodAt: string[];
  improvementPlan: ImprovementTip[];
  evoSummary: string;
  modelVersion: string;
  generatedAt: string;
}

const MODEL = 'gemini-2.5-flash';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    goodAt: {
      type: Type.ARRAY,
      description: '2-3 short sentences highlighting genuine strengths.',
      items: { type: Type.STRING },
    },
    improvementPlan: {
      type: Type.ARRAY,
      description: '3-4 specific, actionable tips.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          body:  { type: Type.STRING },
          kind:  { type: Type.STRING, enum: ['practice', 'concept', 'support', 'habit'] },
        },
        required: ['title', 'body', 'kind'],
      },
    },
    evoSummary: { type: Type.STRING },
  },
  required: ['goodAt', 'improvementPlan', 'evoSummary'],
};

interface PromptCtx {
  name: string;
  className: string;
  overall: number;
  subjects: Array<{ subject: string; score: number }>;
  weakTopics: Array<{ topic: string; subject: string; severity: string }>;
}

function buildPrompt(ctx: PromptCtx): string {
  const subjLines = ctx.subjects.map((s) => `  - ${s.subject}: ${s.score}/100`).join('\n');
  const weakLines = ctx.weakTopics.length > 0
    ? ctx.weakTopics.map((w) => `  - ${w.topic} (${w.subject}, ${w.severity})`).join('\n')
    : '  - none flagged';

  return `You are an experienced teacher writing a brief progress note.

Student: ${ctx.name}${ctx.className ? ` (${ctx.className})` : ''}
Overall comprehension: ${ctx.overall}/100

Subject scores:
${subjLines}

Weak topics observed:
${weakLines}

Generate a JSON object:
1. "goodAt" — 2-3 SHORT sentences (≤ 15 words each) highlighting genuine strengths visible in the data.
2. "improvementPlan" — 3-4 specific tips, each with title (≤4 words), body (1-2 sentences, mention exact topic + duration), kind (practice/concept/support/habit).
3. "evoSummary" — 1-2 sentences capturing the student's current academic state.

Tone: warm, professional. Reference actual subjects and topics — do not generalise.`;
}

// ── localStorage cache ─────────────────────────────────────────────────────
//
// First view of each student calls Gemini once; the result is then cached in
// localStorage indefinitely. Subsequent opens of the same student return
// instantly with zero API cost.
//
// MVP scaling note: with ~10 students this means at most 10 lifetime Gemini
// calls per browser. When the dataset grows to 10k students, swap this for a
// Cloud Function + Firestore cache (see TODO in generate-ai-insights.ts).

const CACHE_PREFIX = 'notivo.ai.v1:';
const CACHE_VERSION = 1;

interface CachedEntry {
  v: number;
  result: RealtimeAiResult;
  cachedAt: string;
}

function readCache(uid: string): RealtimeAiResult | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + uid);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry;
    if (parsed.v !== CACHE_VERSION) return null;
    return parsed.result;
  } catch {
    return null;
  }
}

function writeCache(uid: string, result: RealtimeAiResult): void {
  try {
    const entry: CachedEntry = { v: CACHE_VERSION, result, cachedAt: new Date().toISOString() };
    localStorage.setItem(CACHE_PREFIX + uid, JSON.stringify(entry));
  } catch (err) {
    console.warn('[realtime-ai] localStorage write failed', err);
  }
}

/** Clear cached AI for a single student — used by the "Regenerate" button. */
export function clearRealtimeAiCache(uid: string): void {
  try { localStorage.removeItem(CACHE_PREFIX + uid); } catch { /* noop */ }
}

/**
 * Generate fresh AI insights for a student in real time.
 *
 * - If a localStorage cache hit exists for this uid, returns it instantly
 *   (zero API cost). Pass `force: true` to bypass.
 * - Otherwise calls Gemini, persists to both localStorage and Firestore
 *   (`ai_insights/{uid}`), and returns the fresh result.
 *
 * Throws if VITE_GEMINI_API_KEY is missing or the API call fails. Callers
 * should fall back to the cached `ai_insights` doc on error.
 */
export async function generateRealtimeAi(
  uid: string,
  ctx: PromptCtx,
  opts: { force?: boolean } = {},
): Promise<RealtimeAiResult> {
  if (!opts.force) {
    const cached = readCache(uid);
    if (cached) return cached;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not set');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(ctx),
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.7,
    },
  });
  const text = response.text;
  if (!text) throw new Error('Empty Gemini response');

  const parsed = JSON.parse(text) as Omit<RealtimeAiResult, 'modelVersion' | 'generatedAt'>;
  const generatedAt = new Date().toISOString();

  // Write back to Firestore so the offline cache reflects the latest run.
  // Best-effort — don't fail the whole call if this errors (e.g. rules deny).
  try {
    await setDoc(
      doc(firestore, 'ai_insights', uid),
      {
        studentUid: uid,
        goodAt: parsed.goodAt,
        improvementPlan: parsed.improvementPlan,
        evoSummary: parsed.evoSummary,
        generatedAt: serverTimestamp(),
        modelVersion: MODEL,
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('[realtime-ai] could not persist to Firestore (rules?)', err);
  }

  const result: RealtimeAiResult = {
    goodAt: parsed.goodAt,
    improvementPlan: parsed.improvementPlan,
    evoSummary: parsed.evoSummary,
    modelVersion: MODEL,
    generatedAt,
  };
  writeCache(uid, result);
  return result;
}
