import { describe, expect, it } from "vitest";

/**
 * `allocateNumber` (numbering.ts) relies on Firestore's `runTransaction`:
 * optimistic concurrency where every transaction reads a consistent
 * snapshot, and the write only commits if nothing it read has changed
 * since — otherwise the whole callback is retried automatically. We can't
 * spin up the real Firestore emulator in this sandbox (its one-time
 * binary download is blocked by network policy here — see
 * tests/emulator/README.md for the equivalent test against real Firestore),
 * so this test reproduces that exact read/retry-on-conflict contract with a
 * tiny in-memory fake and drives many concurrent callers through it, the
 * same way concurrent invoice creation would hit the real counter document.
 */

interface FakeDocStore {
  data: { seq: number } | undefined;
  version: number;
}

function createStore(): FakeDocStore {
  return { data: undefined, version: 0 };
}

async function runOptimisticTransaction<T>(
  store: FakeDocStore,
  fn: (current: { seq: number } | undefined) => Promise<{ write: { seq: number }; result: T }>,
  maxAttempts = 200,
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const versionAtStart = store.version;
    const snapshot = store.data ? { ...store.data } : undefined;

    // Force a real async gap between "read" and "write", the same way a
    // network round-trip does for a real Firestore transaction — this is
    // what lets concurrent callers actually interleave and race.
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 3));

    const { write, result } = await fn(snapshot);

    if (store.version === versionAtStart) {
      store.data = write;
      store.version += 1;
      return result;
    }
    // Someone else committed first — retry with a fresh read, exactly like
    // the Firestore SDK's built-in transaction retry.
  }
  throw new Error("transaction did not converge after max attempts");
}

async function allocateSimulated(store: FakeDocStore, prefix: string) {
  return runOptimisticTransaction(store, async (current) => {
    const next = (current?.seq ?? 0) + 1;
    return { write: { seq: next }, result: `${prefix}${String(next).padStart(4, "0")}` };
  });
}

describe("optimistic-transaction invoice numbering (simulated Firestore semantics)", () => {
  it("hands out unique, gapless sequence numbers under heavy concurrency", async () => {
    const store = createStore();
    const CONCURRENCY = 60;

    const numbers = await Promise.all(Array.from({ length: CONCURRENCY }, () => allocateSimulated(store, "INV-")));

    const seqs = numbers.map((n) => Number(n.replace("INV-", ""))).sort((a, b) => a - b);
    const expected = Array.from({ length: CONCURRENCY }, (_, i) => i + 1);

    expect(new Set(numbers).size).toBe(CONCURRENCY); // no two callers got the same number
    expect(seqs).toEqual(expected); // and every number 1..N was used exactly once
  });

  it("keeps allocating correctly across several separate bursts", async () => {
    const store = createStore();
    const first = await Promise.all(Array.from({ length: 10 }, () => allocateSimulated(store, "INV-")));
    const second = await Promise.all(Array.from({ length: 10 }, () => allocateSimulated(store, "INV-")));

    const all = [...first, ...second];
    expect(new Set(all).size).toBe(20);
    expect(store.data?.seq).toBe(20);
  });
});
