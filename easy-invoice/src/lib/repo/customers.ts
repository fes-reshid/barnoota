import { addDoc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { bizCollection, bizSubDoc, withId } from "./common";
import type { Customer } from "../types";
import { EMPTY_ADDRESS } from "../types";

export function blankCustomer(): Omit<Customer, "id"> {
  return {
    type: "business",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    billingAddress: { ...EMPTY_ADDRESS },
    abn: "",
    notes: "",
    archived: false,
    isDemo: false,
  };
}

export async function createCustomer(businessId: string, data: Omit<Customer, "id">): Promise<string> {
  const ref = await addDoc(bizCollection(businessId, "customers"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
}

export async function updateCustomer(businessId: string, customerId: string, patch: Partial<Customer>) {
  await updateDoc(bizSubDoc(businessId, "customers", customerId), { ...patch, updatedAt: new Date() });
}

export async function archiveCustomer(businessId: string, customerId: string, archived: boolean) {
  await updateCustomer(businessId, customerId, { archived });
}

export async function getCustomer(businessId: string, customerId: string): Promise<Customer | null> {
  const snap = await getDoc(bizSubDoc(businessId, "customers", customerId));
  return snap.exists() ? withId<Customer>(snap) : null;
}

export function subscribeCustomers(businessId: string, cb: (customers: Customer[]) => void) {
  const q = query(bizCollection(businessId, "customers"), orderBy("name"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Customer>(d))));
}
