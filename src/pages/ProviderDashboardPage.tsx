import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { SetupRequiredBanner } from '../components/SetupRequiredBanner';
import { StatusTag } from '../components/StatusTag';
import { useAuth } from '../context/AuthContext';
import { transitionBookingByProvider } from '../lib/bookings';
import { db, getReadableFirebaseError, isFirebaseConfigured } from '../lib/firebase';
import type { BookingRequest } from '../types/campusfix';

export function ProviderDashboardPage() {
  const { firebaseUser, providerAccount, isProvider, authReady } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesByBooking, setNotesByBooking] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !authReady) return;
    if (!firebaseUser || !isProvider || !providerAccount) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', providerAccount.providerId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as BookingRequest);
        rows.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setBookings(rows);
        setLoading(false);
      },
      (err) => {
        setError(getReadableFirebaseError(err));
        setLoading(false);
      },
    );

    return () => unsub();
  }, [firebaseUser, isProvider, providerAccount, authReady]);

  if (!isFirebaseConfigured) {
    return <SetupRequiredBanner />;
  }

  if (authReady && (!firebaseUser || !isProvider || !providerAccount)) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-[#0F1F3D]">
              Provider access required
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              This console is restricted by Firestore security rules to accounts mapped in <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">providerAccounts/{'{uid}'}</code>. Ordinary student accounts cannot read or modify provider queues.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function handleTransition(
    bookingId: string,
    nextStatus: 'Accepted' | 'Rejected' | 'In Progress' | 'Completed',
  ) {
    if (!db || busyId) return;
    setActionError(null);
    setBusyId(bookingId);
    try {
      await transitionBookingByProvider(
        db,
        bookingId,
        nextStatus,
        notesByBooking[bookingId] ?? '',
      );
    } catch (err) {
      setActionError(getReadableFirebaseError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <p className="text-xs font-semibold text-teal-700">Assigned provider workspace</p>
        <h1 className="font-display text-2xl font-bold text-[#0F1F3D] mt-0.5">
          {providerAccount?.providerName}
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-1">
          Provider ID: {providerAccount?.providerId}
        </p>
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
          Loading assigned requests...
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-base font-bold text-[#0F1F3D]">No assigned requests yet</p>
          <p className="text-sm text-slate-600 mt-1">
            When students request services under {providerAccount?.providerName}, they will appear here in real time.
          </p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isBusy = busyId === b.id;
            return (
              <article
                key={b.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono font-semibold text-slate-500 tabular-nums">
                      {b.referenceCode} · Student: {b.studentName}
                    </p>
                    <h2 className="font-display text-lg font-bold text-[#0F1F3D] mt-0.5">
                      {b.serviceTitle}
                    </h2>
                  </div>
                  <StatusTag status={b.status} />
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {b.scheduledDate} · {b.timeWindow}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {b.building}, {b.roomOrPickupPoint}
                  </span>
                  <span className="font-mono font-semibold text-[#0F1F3D]">
                    {b.priceBasisSnapshot}
                  </span>
                </div>

                {b.category === 'printing' && b.printingDescription && (
                  <p className="text-xs bg-[#F6F8FB] border border-slate-200 rounded-xl p-3 text-slate-700">
                    Print job: {b.printingDescription} ({b.printingPageCount} pages,{' '}
                    {b.printingColor === 'color' ? 'Colour' : 'B&W'})
                  </p>
                )}

                {b.instructions && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-[#0F1F3D]">Student instructions: </span>
                    {b.instructions}
                  </p>
                )}

                {(b.status === 'Requested' ||
                  b.status === 'Accepted' ||
                  b.status === 'In Progress') && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <input
                      type="text"
                      value={notesByBooking[b.id] ?? b.statusNote ?? ''}
                      onChange={(e) =>
                        setNotesByBooking((prev) => ({
                          ...prev,
                          [b.id]: e.target.value,
                        }))
                      }
                      maxLength={300}
                      placeholder="Optional note for student (e.g. Arriving at 5:15 PM)"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D]"
                    />

                    <div className="flex flex-wrap gap-2.5">
                      {b.status === 'Requested' && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleTransition(b.id, 'Accepted')}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                          >
                            {isBusy ? 'Updating...' : 'Accept request'}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleTransition(b.id, 'Rejected')}
                            className="min-h-[44px] px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-60 text-sm font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {b.status === 'Accepted' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTransition(b.id, 'In Progress')}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F1F3D] hover:bg-[#1E3354] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                        >
                          {isBusy ? 'Updating...' : 'Mark In Progress'}
                        </button>
                      )}

                      {b.status === 'In Progress' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTransition(b.id, 'Completed')}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                        >
                          {isBusy ? 'Updating...' : 'Mark Completed'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
