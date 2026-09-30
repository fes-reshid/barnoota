import { afterEach, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getTestEnv } from "./env";

/**
 * Proves tenant isolation is enforced by Firestore itself (firestore.rules),
 * not merely by hiding UI. Run against the local emulator:
 *   firebase emulators:start
 *   npm run test:emulator
 */
describe("Firestore security rules — tenant isolation", () => {
  const bizA = "business-a";
  const bizB = "business-b";

  beforeEach(async () => {
    const env = await getTestEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "businesses", bizA), { name: "A Co", members: { "user-a": "owner" } });
      await setDoc(doc(db, "businesses", bizB), { name: "B Co", members: { "user-b": "owner" } });
      await setDoc(doc(db, "businesses", bizA, "customers", "cust-1"), { name: "Jane Doe", archived: false });
      await setDoc(doc(db, "businesses", bizA, "invoices", "inv-1"), {
        status: "issued",
        invoiceNumber: "INV-0001",
        totalCents: 10000,
        lineItems: [],
        customer: { name: "Jane Doe" },
      });
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

  it("lets a member read their own business's customers", async () => {
    const env = await getTestEnv();
    const db = env.authenticatedContext("user-a").firestore();
    await assertSucceeds(getDoc(doc(db, "businesses", bizA, "customers", "cust-1")));
  });

  it("blocks a member of one business from reading another business's customers", async () => {
    const env = await getTestEnv();
    const db = env.authenticatedContext("user-b").firestore();
    await assertFails(getDoc(doc(db, "businesses", bizA, "customers", "cust-1")));
  });

  it("blocks a member of one business from reading another business's invoices", async () => {
    const env = await getTestEnv();
    const db = env.authenticatedContext("user-b").firestore();
    await assertFails(getDoc(doc(db, "businesses", bizA, "invoices", "inv-1")));
  });

  it("blocks a signed-out (unauthenticated) client entirely", async () => {
    const env = await getTestEnv();
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "businesses", bizA, "customers", "cust-1")));
  });

  it("prevents editing the frozen line items of an issued invoice", async () => {
    const env = await getTestEnv();
    const db = env.authenticatedContext("user-a").firestore();
    await assertFails(
      setDoc(doc(db, "businesses", bizA, "invoices", "inv-1"), {
        status: "issued",
        totalCents: 99999, // tampering with a frozen, already-issued total
        lineItems: [],
        customer: { name: "Jane Doe" },
      }),
    );
  });

  it("allows a member to update payment/status bookkeeping fields on an issued invoice", async () => {
    const env = await getTestEnv();
    const db = env.authenticatedContext("user-a").firestore();
    await assertSucceeds(
      setDoc(
        doc(db, "businesses", bizA, "invoices", "inv-1"),
        { status: "paid", amountPaidCents: 10000, balanceDueCents: 0 },
        { merge: true },
      ),
    );
  });
});
