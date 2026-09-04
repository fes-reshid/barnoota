import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
        <GraduationCap className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-500">The page you're looking for doesn't exist or you don't have access to it.</p>
      <Link to="/" className="btn-primary">Go home</Link>
    </div>
  );
}
