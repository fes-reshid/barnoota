import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { doc, getDoc, runTransaction, setDoc, type Firestore } from "firebase/firestore";
import { getTestEnv } from "./env";

/**
 * Exercises the exact allocation pattern used by allocateNumber()
 * (src/lib/repo/numbering.ts) against the real Firestore emulator, proving
 * concurrent invoice creation can never produce two invoices with the same
 * number — Firestore's transaction layer serializes the conflicting writes
 * and retries the losers automatically.
 *
 * Run with: firebase emulators:start   (in one terminal)
 *           npm run test:emulator      (in another)
 */
async function allocate(db: Firestore, businessId: string) {
  const counterRef = doc(db, "businesses", businessId, "counters", "invoice");
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? ((snap.data().seq as number) ?? 0) : 0;
    const next = current + 1;
    if (snap.exists()) tx.update(counterRef, { seq: next });
    else tx.set(counterRef, { seq: next });
    return next;
  });
}

describe("Firestore invoice numbering — real concurrency", () => {
  const businessId = "biz-concurrency";

  beforeEach(async () => {
    const env = await getTestEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "businesses", businessId), { name: "Concurrency Co", members: { owner: "owner" } });
    });
  });

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  // Deliberately no env.cleanup() here: the RulesTestEnvironment is a
  // process-wide singleton (see ./env.ts) shared with the other emulator
  // test file, and tearing it down in one file's afterAll would invalidate
  // it for whichever file runs next. The emulator process itself is
  // ephemeral per test run (see `firebase emulators:exec` in package.json),
  // so nothing needs an explicit teardown here.

  it("never allocates the same sequence number twice under real concurrent load", async () => {
    const env = await getTestEnv();
    const db = env.authenticatedContext("owner").firestore();

    // Sanity-check the fixture actually committed before hammering it —
    // isolates a flaky "business not found" from a genuine rules bug.
    const bizSnap = await getDoc(doc(db, "businesses", businessId));
    expect(bizSnap.exists()).toBe(true);

    const CONCURRENCY = 25;
    const results = await Promise.all(Array.from({ length: CONCURRENCY }, () => allocate(db, businessId)));

    expect(new Set(results).size).toBe(CONCURRENCY);
    expect([...results].sort((a, b) => a - b)).toEqual(Array.from({ length: CONCURRENCY }, (_, i) => i + 1));
  });
});
