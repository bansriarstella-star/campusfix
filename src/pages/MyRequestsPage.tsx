import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  LogIn,
  MapPin,
  Plus,
} from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { SetupRequiredBanner } from '../components/SetupRequiredBanner';
import { StatusTag } from '../components/StatusTag';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, getReadableFirebaseError, isFirebaseConfigured } from '../lib/firebase';
import type { BookingRequest } from '../types/campusfix';

interface MyRequestsPageProps {
  onNavigate: (path: string) => void;
}

type FilterBucket = 'all' | 'active' | 'completed' | 'closed';

export function MyRequestsPage({ onNavigate }: MyRequestsPageProps) {
  const { firebaseUser, authReady, signInWithGoogle, authBusy } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterBucket>('all');

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !authReady) {
      return;
    }
    if (!firebaseUser) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'bookings'),
      where('studentUid', '==', firebaseUser.uid),
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
  }, [firebaseUser, authReady]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === 'all') return true;
      if (filter === 'active') {
        return ['Requested', 'Accepted', 'In Progress'].includes(b.status);
      }
      if (filter === 'completed') return b.status === 'Completed';
      return b.status === 'Rejected' || b.status === 'Cancelled';
    });
  }, [bookings, filter]);

  if (!isFirebaseConfigured) {
    return <SetupRequiredBanner />;
  }

  if (authReady && !firebaseUser) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-bold text-[#0F1F3D]">
          Sign in to view your requests
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your booking requests and timelines are stored privately under your Google account.
        </p>
        <button
          type="button"
          disabled={authBusy}
          onClick={() => signInWithGoogle()}
          className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>{authBusy ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1F3D]">
            My service requests
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Live status updates from your assigned campus providers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/book')}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New booking request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'closed', label: 'Rejected / Cancelled' },
          ] as { id: FilterBucket; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              filter === tab.id
                ? 'bg-white text-[#0F1F3D] shadow-sm font-semibold'
                : 'text-slate-600 hover:text-[#0F1F3D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5"
            >
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-5 w-1/2 bg-slate-200 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filteredBookings.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-base font-bold text-[#0F1F3D]">
            {bookings.length === 0
              ? 'You have not requested any services yet'
              : 'No requests in this filter'}
          </p>
          <p className="mt-1.5 text-sm text-slate-600">
            {bookings.length === 0
              ? 'Choose laundry, repairs, printing, or housekeeping to submit your first request.'
              : 'Switch to All to see your complete request history.'}
          </p>
          {bookings.length === 0 && (
            <button
              type="button"
              onClick={() => onNavigate('/book')}
              className="mt-4 min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold cursor-pointer"
            >
              Book a service
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredBookings.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredBookings.map((booking) => (
            <button
              key={booking.id}
              type="button"
              onClick={() => onNavigate(`/requests/${encodeURIComponent(booking.id)}`)}
              className="text-left bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-5 shadow-sm transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-[#0F1F3D] tabular-nums">
                    {booking.referenceCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                    <CategoryIcon category={booking.category} className="w-3.5 h-3.5 text-teal-700" />
                    {booking.providerName}
                  </span>
                </div>

                <h2 className="font-display text-base sm:text-lg font-bold text-[#0F1F3D] truncate">
                  {booking.serviceTitle}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {booking.scheduledDate} · {booking.timeWindow}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {booking.building}, {booking.roomOrPickupPoint}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                <StatusTag status={booking.status} />
                <span className="text-xs font-semibold text-teal-700 inline-flex items-center gap-1">
                  Track details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
