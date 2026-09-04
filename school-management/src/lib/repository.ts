import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase/config';
import type { BaseRecord } from '@/types';

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export interface Repository<T extends BaseRecord> {
  list(schoolId: string): Promise<T[]>;
  listWhere(schoolId: string, field: keyof T, value: unknown): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<void>;
  remove(id: string): Promise<void>;
  seedIfEmpty(schoolId: string, seed: () => T[]): Promise<void>;
}

/**
 * Creates a data-access repository for a single "collection" of records.
 *
 * When Firebase credentials are configured it reads/writes Firestore under
 * `collectionName`. Otherwise it transparently falls back to a namespaced
 * localStorage array with an identical async API, so every screen in the
 * app works immediately in demo mode and needs no changes to go live.
 */
export function createRepository<T extends BaseRecord>(collectionName: string): Repository<T> {
  const localKey = `sms:${collectionName}`;

  return {
    async list(schoolId) {
      if (isFirebaseConfigured && db) {
        const q = query(collection(db, collectionName), where('schoolId', '==', schoolId));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      }
      return readLocal<T>(localKey).filter((r) => r.schoolId === schoolId);
    },

    async listWhere(schoolId, field, value) {
      if (isFirebaseConfigured && db) {
        const q = query(
          collection(db, collectionName),
          where('schoolId', '==', schoolId),
          where(field as string, '==', value),
          orderBy('createdAt', 'desc'),
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      }
      return readLocal<T>(localKey).filter(
        (r) => r.schoolId === schoolId && (r as Record<string, unknown>)[field as string] === value,
      );
    },

    async get(id) {
      if (isFirebaseConfigured && db) {
        const snap = await getDoc(doc(db, collectionName, id));
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
      }
      return readLocal<T>(localKey).find((r) => r.id === id) ?? null;
    },

    async create(data) {
      const record = { ...data, createdAt: now(), updatedAt: now() } as Omit<T, 'id'>;
      if (isFirebaseConfigured && db) {
        const ref = await addDoc(collection(db, collectionName), record);
        return { id: ref.id, ...record } as T;
      }
      const items = readLocal<T>(localKey);
      const withId = { ...record, id: uid() } as T;
      items.push(withId);
      writeLocal(localKey, items);
      return withId;
    },

    async update(id, data) {
      const patch = { ...data, updatedAt: now() };
      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, collectionName, id), patch as Record<string, unknown>);
        return;
      }
      const items = readLocal<T>(localKey);
      const idx = items.findIndex((r) => r.id === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...patch };
        writeLocal(localKey, items);
      }
    },

    async remove(id) {
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, collectionName, id));
        return;
      }
      const items = readLocal<T>(localKey).filter((r) => r.id !== id);
      writeLocal(localKey, items);
    },

    async seedIfEmpty(schoolId, seed) {
      if (isFirebaseConfigured && db) return; // never auto-seed a real project
      const items = readLocal<T>(localKey);
      if (items.some((r) => r.schoolId === schoolId)) return;
      writeLocal(localKey, [...items, ...seed()]);
    },
  };
}

// A helper for writing a document with a known id (used for the demo-mode
// current-user profile, and for Firestore docs that should be keyed by
// Firebase Auth UID).
export async function setById<T extends BaseRecord>(
  collectionName: string,
  id: string,
  data: Omit<T, 'id'>,
): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, collectionName, id), data as Record<string, unknown>, { merge: true });
    return;
  }
  const key = `sms:${collectionName}`;
  const items = readLocal<T>(key);
  const idx = items.findIndex((r) => r.id === id);
  const record = { ...data, id } as T;
  if (idx >= 0) items[idx] = { ...items[idx], ...record };
  else items.push(record);
  writeLocal(key, items);
}
