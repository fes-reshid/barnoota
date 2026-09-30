import { addDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { bizCollection, withId } from "./common";
import type { AuditAction, AuditEntry } from "../types";
import { isDemoMode } from "../firebase";
import { demoSubscribeAuditForEntity, demoSubscribeRecentAudit } from "../demo/repo";

export async function logAudit(
  businessId: string,
  entry: {
    entityType: AuditEntry["entityType"];
    entityId: string;
    action: AuditAction;
    summary: string;
    performedBy: string;
    performedByEmail: string;
  },
) {
  // Demo-mode callers (invoices.ts / quotes.ts) branch out before reaching
  // this — see demoLogAudit in src/lib/demo/repo.ts — so this always talks
  // to Firestore.
  await addDoc(bizCollection(businessId, "auditLog"), { ...entry, at: new Date() });
}

export function subscribeAuditForEntity(businessId: string, entityId: string, cb: (entries: AuditEntry[]) => void) {
  if (isDemoMode) return demoSubscribeAuditForEntity(entityId, cb);
  const q = query(bizCollection(businessId, "auditLog"), where("entityId", "==", entityId), orderBy("at", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<AuditEntry>(d))));
}

export function subscribeRecentAudit(businessId: string, cb: (entries: AuditEntry[]) => void) {
  if (isDemoMode) return demoSubscribeRecentAudit(cb);
  const q = query(bizCollection(businessId, "auditLog"), orderBy("at", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.slice(0, 50).map((d) => withId<AuditEntry>(d))));
}
