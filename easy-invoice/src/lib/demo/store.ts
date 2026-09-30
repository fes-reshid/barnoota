/**
 * A tiny localStorage-backed "database" that stands in for Firestore in demo
 * mode. Same shape of operations (collections of documents per business,
 * live subscriptions, atomic-enough counters) but entirely client-side and
 * scoped to one browser — there is no server, so there is nothing to secure
 * and nothing shared between visitors.
 */

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function subscribeKey(key: string, fn: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => listeners.get(key)?.delete(fn);
}

function readRaw<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeRaw(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  notify(key);
}

const collectionKey = (businessId: string, name: string) => `easy-invoice-demo:${businessId}:${name}`;
const counterKey = (businessId: string, name: string) => `easy-invoice-demo:${businessId}:counter:${name}`;

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function listCollection<T>(businessId: string, name: string): T[] {
  return readRaw<T[]>(collectionKey(businessId, name), []);
}

function saveCollection<T>(businessId: string, name: string, items: T[]) {
  writeRaw(collectionKey(businessId, name), items);
}

export function subscribeCollection<T>(businessId: string, name: string, cb: (items: T[]) => void): () => void {
  const emit = () => cb(listCollection<T>(businessId, name));
  emit();
  return subscribeKey(collectionKey(businessId, name), emit);
}

export function getDocById<T extends { id: string }>(businessId: string, name: string, id: string): T | null {
  return listCollection<T>(businessId, name).find((d) => d.id === id) ?? null;
}

export function subscribeDoc<T extends { id: string }>(businessId: string, name: string, id: string, cb: (doc: T | null) => void): () => void {
  const emit = () => cb(getDocById<T>(businessId, name, id));
  emit();
  return subscribeKey(collectionKey(businessId, name), emit);
}

export function addDoc<T extends object>(businessId: string, name: string, data: T, id = newId()): T & { id: string } {
  const items = listCollection<T & { id: string }>(businessId, name);
  const doc = { ...data, id };
  items.push(doc);
  saveCollection(businessId, name, items);
  return doc;
}

export function updateDoc<T extends { id: string }>(businessId: string, name: string, id: string, patch: Partial<T>): T {
  const items = listCollection<T>(businessId, name);
  const idx = items.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error(`Demo document not found: ${name}/${id}`);
  items[idx] = { ...items[idx], ...patch };
  saveCollection(businessId, name, items);
  return items[idx];
}

export function deleteDoc<T extends { id: string }>(businessId: string, name: string, id: string) {
  const items = listCollection<T>(businessId, name).filter((d) => d.id !== id);
  saveCollection(businessId, name, items);
}

/** JS is single-threaded, so a plain read-increment-write here is already atomic. */
export function nextCounter(businessId: string, name: string): number {
  const key = counterKey(businessId, name);
  const current = readRaw<number>(key, 0);
  const next = current + 1;
  localStorage.setItem(key, JSON.stringify(next));
  return next;
}

export function clearBusiness(businessId: string) {
  const prefix = `easy-invoice-demo:${businessId}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) toRemove.push(key);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  toRemove.forEach((k) => notify(k));
}
