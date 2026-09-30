import { addDoc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { bizCollection, bizSubDoc, withId } from "./common";
import type { Product } from "../types";

export function blankProduct(): Omit<Product, "id"> {
  return {
    name: "",
    description: "",
    unitPriceCents: 0,
    unit: "item",
    taxTreatment: "taxable",
    archived: false,
    isDemo: false,
  };
}

export async function createProduct(businessId: string, data: Omit<Product, "id">): Promise<string> {
  const ref = await addDoc(bizCollection(businessId, "products"), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
}

export async function updateProduct(businessId: string, productId: string, patch: Partial<Product>) {
  await updateDoc(bizSubDoc(businessId, "products", productId), { ...patch, updatedAt: new Date() });
}

export async function archiveProduct(businessId: string, productId: string, archived: boolean) {
  await updateProduct(businessId, productId, { archived });
}

export async function getProduct(businessId: string, productId: string): Promise<Product | null> {
  const snap = await getDoc(bizSubDoc(businessId, "products", productId));
  return snap.exists() ? withId<Product>(snap) : null;
}

export function subscribeProducts(businessId: string, cb: (products: Product[]) => void) {
  const q = query(bizCollection(businessId, "products"), orderBy("name"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Product>(d))));
}
