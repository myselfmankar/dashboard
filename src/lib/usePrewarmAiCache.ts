import { useEffect, useRef } from 'react';
import { api } from '../api';
import { generateRealtimeAi } from './realtimeAi';
import type { HeatmapStudent } from '../types';

/**
 * Fire-and-forget hook that pre-warms the localStorage AI cache for every
 * student in the heatmap. Runs once per browser per student lifetime — uses
 * the same `generateRealtimeAi` function with cache-hit short-circuit, so
 * it costs **0 Gemini calls** on second load.
 *
 * Used to eliminate awkward spinners during a live demo: by the time the
 * teacher clicks any cell, fresh AI is already on disk.
 *
 * Concurrency is capped at 2 to avoid burst rate-limits.
 */

const CONCURRENCY = 2;

export function usePrewarmAiCache(students: HeatmapStudent[], enabled = true): void {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (startedRef.current) return;
    if (students.length === 0) return;
    if (!import.meta.env.VITE_GEMINI_API_KEY) return;
    startedRef.current = true;

    const queue = students.filter((s): s is HeatmapStudent & { uid: string } => !!s.uid);
    if (queue.length === 0) return;

    let cancelled = false;
    const log = (msg: string, ...rest: unknown[]) => console.log(`[ai-prewarm] ${msg}`, ...rest);

    async function worker() {
      while (!cancelled) {
        const next = queue.shift();
        if (!next) return;
        try {
          // Fetch detail then call generateRealtimeAi (which short-circuits
          // on localStorage cache hit, so this is free after first run).
          const d = await api.getStudentDetail(next.uid);
          if (cancelled) return;
          await generateRealtimeAi(next.uid, {
            name: d.name,
            className: d.className,
            overall: d.overall,
            subjects: d.subjects,
            weakTopics: d.weakTopics.map((w) => ({
              topic: w.topic, subject: w.subject, severity: w.severity,
            })),
          });
        } catch (err) {
          log(`failed for ${next.uid}`, err);
        }
      }
    }

    log(`warming cache for ${queue.length} students…`);
    Promise.all(Array.from({ length: CONCURRENCY }, worker))
      .then(() => { if (!cancelled) log('done.'); });

    return () => { cancelled = true; };
  }, [students, enabled]);
}
