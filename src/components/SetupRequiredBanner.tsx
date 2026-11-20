import { AlertCircle } from 'lucide-react';

export function SetupRequiredBanner({ reason }: { reason?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto my-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0F1F3D]">
            Firebase Configuration Required
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            {reason ||
              'CampusFix uses Firebase Authentication and Cloud Firestore for real sign-in, booking requests, and tracking. No Firebase configuration was detected in this build.'}
          </p>
          <ol className="mt-4 space-y-1.5 text-sm text-slate-700 list-decimal list-inside">
            <li>Copy <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.env.example</code> to <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.env.local</code> (or set <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">VITE_FIREBASE_*</code> variables in Vercel).</li>
            <li>Enable Google Sign-In in Firebase Authentication and create a Cloud Firestore database.</li>
            <li>Publish <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">firestore.rules</code> and <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">firestore.indexes.json</code>, then reload.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
