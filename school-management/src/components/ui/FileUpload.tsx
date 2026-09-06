import { useRef, useState } from 'react';
import { Loader2, Paperclip } from 'lucide-react';
import { uploadFile, type UploadedFile } from '@/lib/fileStorage';
import { useToast } from './Toast';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB — keep in step with storage.rules

interface FileUploadProps {
  /** Storage path to upload to, given the chosen file's name. */
  buildPath: (fileName: string) => string;
  onUploaded: (file: UploadedFile) => void;
  label?: string;
  accept?: string;
}

export function FileUpload({ buildPath, onUploaded, label = 'Attach a file', accept }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      showToast(`"${file.name}" is larger than 15MB — choose a smaller file.`, 'error');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadFile(buildPath(file.name), file);
      onUploaded(uploaded);
      showToast(`"${file.name}" uploaded.`);
    } catch {
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      <button type="button" className="btn-secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {uploading ? 'Uploading…' : label}
      </button>
    </>
  );
}
