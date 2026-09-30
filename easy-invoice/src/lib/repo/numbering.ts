import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

export type CounterName = "invoice" | "quote";

/**
 * Atomically allocates the next sequence number for a business's invoices or
 * quotes. Firestore transactions are serializable with automatic
 * optimistic-concurrency retries, so two clients issuing documents at the
 * same instant can never be handed the same sequence number — this is what
 * stands in for a database unique-constraint + row lock in a SQL backend.
 */
export async function allocateNumber(
  businessId: string,
  counterName: CounterName,
  prefix: string,
  padWidth = 4,
): Promise<{ seq: number; number: string }> {
  const counterRef = doc(db, "businesses", businessId, "counters", counterName);
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? ((snap.data().seq as number) ?? 0) : 0;
    const value = current + 1;
    if (snap.exists()) {
      tx.update(counterRef, { seq: value });
    } else {
      tx.set(counterRef, { seq: value });
    }
    return value;
  });
  return { seq: next, number: `${prefix}${String(next).padStart(padWidth, "0")}` };
}
