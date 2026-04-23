/**
 * One-off migration: rename the "role " (trailing space) field to "role"
 * on all documents in the `users` collection.
 *
 * Run: npx tsx scripts/fix-role-field.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import serviceAccount from './service-account.json' with { type: 'json' };

initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

async function main() {
  const usersRef = db.collection('users');
  const snap = await usersRef.get();

  let fixed = 0;
  let skipped = 0;

  const batch = db.batch();

  for (const doc of snap.docs) {
    const data = doc.data();
    const badRole = data['role '];   // trailing-space key
    const goodRole = data['role'];   // correct key

    if (badRole === undefined) {
      skipped++;
      continue;
    }

    console.log(`  Fixing ${doc.id}: "role " = "${badRole}"  →  "role" (current clean value: "${goodRole ?? 'none'}")`);

    // Only set "role" if it isn't already clean, then delete the bad key.
    const update: Record<string, unknown> = { 'role ': FieldValue.delete() };
    if (!goodRole) {
      update['role'] = badRole;
    }

    batch.update(doc.ref, update);
    fixed++;

    // Firestore batches are capped at 500 ops — flush and start fresh.
    if (fixed % 499 === 0) {
      await batch.commit();
      console.log(`  Flushed batch of 499`);
    }
  }

  if (fixed > 0) {
    await batch.commit();
  }

  console.log(`\nDone. Fixed: ${fixed}  Skipped (no bad field): ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
