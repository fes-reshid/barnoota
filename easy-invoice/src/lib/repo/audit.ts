import { addDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { bizCollection, withId } from "./common";
import type { AuditAction, AuditEntry } from "../types";

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
  await addDoc(bizCollection(businessId, "auditLog"), { ...entry, at: new Date() });
}

export function subscribeAuditForEntity(businessId: string, entityId: string, cb: (entries: AuditEntry[]) => void) {
  const q = query(bizCollection(businessId, "auditLog"), where("entityId", "==", entityId), orderBy("at", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<AuditEntry>(d))));
}

export function subscribeRecentAudit(businessId: string, cb: (entries: AuditEntry[]) => void) {
  const q = query(bizCollection(businessId, "auditLog"), orderBy("at", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.slice(0, 50).map((d) => withId<AuditEntry>(d))));
}
