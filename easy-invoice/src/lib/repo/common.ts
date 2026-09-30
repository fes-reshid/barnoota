import {
  collection,
  doc,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export function bizDoc(businessId: string) {
  return doc(db, "businesses", businessId);
}

export function bizCollection(businessId: string, name: string) {
  return collection(db, "businesses", businessId, name);
}

export function bizSubDoc(businessId: string, name: string, id: string) {
  return doc(db, "businesses", businessId, name, id);
}

export function withId<T>(snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...(snap.data() as object) } as T;
}

export const nowStamp = () => serverTimestamp();

export function newLineItemId(): string {
  return crypto.randomUUID();
}
