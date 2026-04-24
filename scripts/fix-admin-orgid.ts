/**
 * One-time patch: mirror `instituteId` onto `orgId` for admin users so that
 * the `isAdminOfOrg()` Firestore rule predicate matches.
 *
 * Run: npx tsx scripts/fix-admin-orgid.ts
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './service-account.json' with { type: 'json' };

initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

async function main() {
  const snap = await db.collection('users').where('role', '==', 'admin').get();
  console.log(`Found ${snap.size} admin user(s).`);
  for (const doc of snap.docs) {
    const d = doc.data();
    const orgId = d.orgId ?? d.instituteId;
    if (!orgId) { console.log(`  SKIP ${doc.id} — no orgId/instituteId`); continue; }
    await doc.ref.set({ orgId, instituteId: orgId }, { merge: true });
    console.log(`  OK   ${doc.id} -> orgId="${orgId}"`);
  }
  console.log('Done.');
}
main().catch((e) => { console.error(e); process.exit(1); });
