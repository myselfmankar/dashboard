/**
 * Firestore full-schema introspection script.
 *
 * Fetches EVERY document in every collection (and subcollection) and produces:
 *   scripts/firestore-schema.json  — field-level schema with all observed types
 *                                    and up to 3 sample values per field
 *   scripts/firestore-full-dump.json — complete raw data for every document
 *                                      (useful for debugging / schema design)
 *
 * Run: npx tsx scripts/introspect-firestore.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import serviceAccount from './service-account.json' with { type: 'json' };

const SCHEMA_OUTPUT = resolve(process.cwd(), 'scripts', 'firestore-schema.json');
const DUMP_OUTPUT   = resolve(process.cwd(), 'scripts', 'firestore-full-dump.json');

initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

// ── Type helpers ─────────────────────────────────────────────────────────────
type FieldInfo = {
  types: Set<string>;
  sampleValues: unknown[];
  nullable: boolean;
};

type CollectionSummary = {
  path: string;
  docCount: number;
  allDocIds: string[];
  fields: Record<string, { types: string[]; nullable: boolean; sampleValues: unknown[] }>;
  subcollections: string[];
};

type DocDump = {
  path: string;
  id: string;
  data: Record<string, unknown>;
};

function inferType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'array<unknown>';
    const inner = new Set(value.map(inferType));
    return `array<${Array.from(inner).join('|')}>`;
  }
  if (value instanceof Timestamp) return 'timestamp';
  if (value instanceof FieldValue) return 'fieldvalue';
  if (typeof value === 'object') {
    if ((value as any).latitude !== undefined && (value as any).longitude !== undefined) return 'geopoint';
    if ((value as any)._path) return 'reference';
    return 'map';
  }
  return typeof value;
}

function serialize(v: unknown): unknown {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(serialize);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) out[k] = serialize(val);
    return out;
  }
  return v;
}

// ── Core walker ───────────────────────────────────────────────────────────────
async function inspectCollection(
  path: string,
  schemaSummaries: CollectionSummary[],
  docDumps: DocDump[],
): Promise<void> {
  const colRef = db.collection(path);

  // Fetch ALL documents (paginate in batches of 500 to stay within limits)
  const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  while (true) {
    let q: FirebaseFirestore.Query = colRef.orderBy('__name__').limit(500);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    allDocs.push(...snap.docs);
    if (snap.docs.length < 500) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }

  const fields: Record<string, FieldInfo> = {};
  const subcolSet = new Set<string>();
  const allDocIds: string[] = [];

  for (const docSnap of allDocs) {
    allDocIds.push(docSnap.id);
    const data = docSnap.data();

    // Record raw dump
    docDumps.push({ path, id: docSnap.id, data: serialize(data) as Record<string, unknown> });

    // Accumulate field schema
    for (const [k, v] of Object.entries(data)) {
      if (!fields[k]) fields[k] = { types: new Set(), sampleValues: [], nullable: false };
      fields[k].types.add(inferType(v));
      if (v === null) fields[k].nullable = true;
      if (fields[k].sampleValues.length < 3) fields[k].sampleValues.push(serialize(v));
    }

    // Discover subcollections (only need to check once per doc — break after first that has subs)
    if (subcolSet.size === 0) {
      const subs = await docSnap.ref.listCollections();
      for (const sub of subs) subcolSet.add(sub.id);
    }
  }

  schemaSummaries.push({
    path,
    docCount: allDocs.length,
    allDocIds,
    fields: Object.fromEntries(
      Object.entries(fields).map(([k, info]) => [
        k,
        { types: Array.from(info.types), nullable: info.nullable, sampleValues: info.sampleValues },
      ]),
    ),
    subcollections: Array.from(subcolSet),
  });

  // Recurse into subcollections — use all sampled docs as anchors
  for (const sub of subcolSet) {
    for (const docSnap of allDocs) {
      const subRef = docSnap.ref.collection(sub);
      const firstSub = await subRef.limit(1).get();
      if (!firstSub.empty) {
        await inspectCollection(`${path}/${docSnap.id}/${sub}`, schemaSummaries, docDumps);
        break;
      }
    }
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  const rootCollections = await db.listCollections();
  const schemaSummaries: CollectionSummary[] = [];
  const docDumps: DocDump[] = [];

  for (const col of rootCollections) {
    console.log(`Inspecting /${col.id} ...`);
    await inspectCollection(col.id, schemaSummaries, docDumps);
    console.log(`  → ${schemaSummaries[schemaSummaries.length - 1].docCount} docs`);
  }

  // ── Write schema summary ──
  const schemaResult = {
    projectId: (serviceAccount as any).project_id,
    generatedAt: new Date().toISOString(),
    rootCollections: rootCollections.map((c) => c.id),
    totalDocs: docDumps.length,
    collections: schemaSummaries,
  };
  writeFileSync(SCHEMA_OUTPUT, JSON.stringify(schemaResult, null, 2), 'utf8');
  console.log(`\nSchema written  → ${SCHEMA_OUTPUT}`);

  // ── Write full dump ──
  const dumpResult = {
    projectId: (serviceAccount as any).project_id,
    exportedAt: new Date().toISOString(),
    totalDocs: docDumps.length,
    documents: docDumps,
  };
  writeFileSync(DUMP_OUTPUT, JSON.stringify(dumpResult, null, 2), 'utf8');
  console.log(`Full dump written → ${DUMP_OUTPUT}`);

  console.log(`\nSummary:`);
  for (const col of schemaSummaries) {
    console.log(`  /${col.path.padEnd(20)} ${col.docCount} docs   fields: ${Object.keys(col.fields).join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
