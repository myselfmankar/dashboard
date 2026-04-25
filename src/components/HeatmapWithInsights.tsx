import { useState } from 'react';
import type { HeatmapStudent } from '../types';
import { ClassStruggleHeatmap } from './ClassStruggleHeatmap';
import { StudentInlinePreview } from './StudentInlinePreview';
import { StudentDetailModal } from './StudentDetailModal';

/**
 * One-line drop-in: heatmap + inline insight panel + full side panel modal.
 * Owns its own selection state so any view can use it without plumbing.
 *
 *   <HeatmapWithInsights students={students} />
 *
 * Pass `rightSlot` to render extra content (e.g. an alert feed) below the
 * inline preview when no student is selected.
 */

interface HeatmapWithInsightsProps {
  students: HeatmapStudent[];
  title?: string | null;
  subtitle?: string | null;
  showLive?: boolean;
  /** Custom slot rendered in the right column when nothing is selected. */
  emptyRightSlot?: React.ReactNode;
  /** Wrap the whole widget in a card. Set false to render flat. */
  card?: boolean;
}

export function HeatmapWithInsights({
  students,
  title = 'Class Struggle Heatmap',
  subtitle = 'Real-time pen behaviour • Today',
  showLive = true,
  emptyRightSlot,
  card = true,
}: HeatmapWithInsightsProps) {
  const [previewUid, setPreviewUid] = useState<string | null>(null);
  const [activeUid, setActiveUid] = useState<string | null>(null);

  const wrapperClass = card
    ? 'bg-white border border-s200 rounded-2xl p-5 shadow-sm'
    : '';

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <ClassStruggleHeatmap
            students={students}
            selectedUid={previewUid}
            onSelectStudent={setPreviewUid}
            title={title}
            subtitle={subtitle}
            showLive={showLive}
          />
        </div>

        <div className="w-full md:w-[340px] flex flex-col gap-4 shrink-0">
          {previewUid ? (
            <StudentInlinePreview
              uid={previewUid}
              onViewMore={() => setActiveUid(previewUid)}
              onClose={() => setPreviewUid(null)}
            />
          ) : (
            emptyRightSlot ?? (
              <div className="bg-s50 border border-s100 rounded-xl p-4 flex-1 flex flex-col justify-center items-center text-center text-xs text-s400">
                Click any student cell to view pen analytics
              </div>
            )
          )}
        </div>
      </div>

      <StudentDetailModal uid={activeUid} onClose={() => setActiveUid(null)} />
    </div>
  );
}
