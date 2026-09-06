import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { isFirebaseConfigured, storage } from '@/firebase/config';
import { demoDeleteFile, demoGetFile, demoPutFile } from './demoFileStore';

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  contentType: string;
}

const DEMO_SCHEME = 'idb://';

/**
 * Uploads a file to Firebase Storage at `path` (see storage.rules — paths
 * are namespaced /schools/{schoolId}/... and only staff may write). In demo
 * mode it stores the file's bytes in IndexedDB instead and returns a
 * synthetic `idb://<id>` URL that resolveFileUrl() knows how to open, so
 * every screen that uploads a file works identically in both modes.
 */
export async function uploadFile(path: string, file: File): Promise<UploadedFile> {
  if (isFirebaseConfigured && storage) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const url = await getDownloadURL(storageRef);
    return { url, name: file.name, size: file.size, contentType: file.type };
  }

  const id = crypto.randomUUID();
  await demoPutFile(id, file);
  return { url: `${DEMO_SCHEME}${id}`, name: file.name, size: file.size, contentType: file.type };
}

/**
 * Resolves a stored file URL into something a browser can actually open —
 * a real Storage download URL is already usable as-is; a demo `idb://` URL
 * is turned into a fresh, short-lived object URL from the stored Blob.
 */
export async function resolveFileUrl(url: string): Promise<string> {
  if (url.startsWith(DEMO_SCHEME)) {
    const id = url.slice(DEMO_SCHEME.length);
    const blob = await demoGetFile(id);
    if (!blob) throw new Error('This file could not be found — it may have been uploaded in a different browser.');
    return URL.createObjectURL(blob);
  }
  return url;
}

export async function deleteFile(url: string): Promise<void> {
  if (url.startsWith(DEMO_SCHEME)) {
    await demoDeleteFile(url.slice(DEMO_SCHEME.length));
    return;
  }
  if (isFirebaseConfigured && storage) {
    await deleteObject(ref(storage, url)).catch(() => {});
  }
}

export function studentDocumentPath(schoolId: string, studentId: string, fileName: string): string {
  return `schools/${schoolId}/students/${studentId}/documents/${crypto.randomUUID()}-${fileName}`;
}

export function studentPhotoPath(schoolId: string, studentId: string, fileName: string): string {
  return `schools/${schoolId}/students/${studentId}/photo/${fileName}`;
}

export function teacherPhotoPath(schoolId: string, teacherId: string, fileName: string): string {
  return `schools/${schoolId}/teachers/${teacherId}/photo/${fileName}`;
}

export function homeworkAttachmentPath(schoolId: string, homeworkId: string, fileName: string): string {
  return `schools/${schoolId}/homework/${homeworkId}/${fileName}`;
}
