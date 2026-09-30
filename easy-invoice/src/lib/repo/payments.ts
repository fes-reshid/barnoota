import { onSnapshot, orderBy, query } from "firebase/firestore";
import { bizCollection, withId } from "./common";
import type { Payment } from "../types";
import { isDemoMode } from "../firebase";
import { demoSubscribePayments } from "../demo/repo";

export function subscribePayments(businessId: string, cb: (payments: Payment[]) => void) {
  if (isDemoMode) return demoSubscribePayments(cb);
  const q = query(bizCollection(businessId, "payments"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Payment>(d))));
}
