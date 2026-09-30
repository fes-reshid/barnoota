import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, isDemoMode, storage } from "../firebase";
import { bizDoc, withId } from "./common";
import type { Business } from "../types";
import { EMPTY_ADDRESS } from "../types";
import { demoGetBusiness, demoSubscribeBusiness, demoUpdateBusiness, demoUploadLogo } from "../demo/repo";

export function defaultBusiness(name: string, ownerId: string, ownerEmail: string, isDemo = false): Omit<Business, "id"> {
  return {
    name,
    logoUrl: null,
    email: ownerEmail,
    phone: "",
    address: { ...EMPTY_ADDRESS },
    abn: "",
    currency: "AUD",
    gstRegistered: false,
    taxRatePercent: 10,
    pricesIncludeTax: true,
    invoicePrefix: "INV-",
    quotePrefix: "QUO-",
    defaultPaymentTermsDays: 14,
    bank: { bankName: "", accountName: "", bsb: "", accountNumber: "" },
    defaultInvoiceNotes: "Thank you for your business!",
    defaultPaymentInstructions: "",
    members: { [ownerId]: "owner" },
    isDemo,
  } as Omit<Business, "id">;
}

export async function createBusiness(businessId: string, name: string, ownerId: string, ownerEmail: string, isDemo = false) {
  const data = defaultBusiness(name, ownerId, ownerEmail, isDemo);
  await setDoc(bizDoc(businessId), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function getBusiness(businessId: string): Promise<Business | null> {
  if (isDemoMode) return demoGetBusiness();
  const snap = await getDoc(bizDoc(businessId));
  if (!snap.exists()) return null;
  return withId<Business>(snap);
}

export function subscribeBusiness(businessId: string, cb: (b: Business | null) => void) {
  if (isDemoMode) return demoSubscribeBusiness(cb);
  return onSnapshot(bizDoc(businessId), (snap) => {
    cb(snap.exists() ? withId<Business>(snap) : null);
  });
}

export async function updateBusiness(businessId: string, patch: Partial<Business>) {
  if (isDemoMode) return demoUpdateBusiness(patch);
  await updateDoc(bizDoc(businessId), { ...patch, updatedAt: new Date() });
}

export async function uploadBusinessLogo(businessId: string, file: File): Promise<string> {
  if (isDemoMode) return demoUploadLogo(file);
  const path = `businesses/${businessId}/logo-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateBusiness(businessId, { logoUrl: url });
  return url;
}

export async function getUserBusinessIds(uid: string): Promise<string[]> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return [];
  return (snap.data().businessIds as string[]) ?? [];
}

export async function linkUserToBusiness(uid: string, businessId: string) {
  await setDoc(doc(db, "users", uid), { businessIds: [businessId] }, { merge: true });
}
