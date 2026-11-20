import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  LogIn,
  MapPin,
  Star,
  XCircle,
} from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { doc, onSnapshot } from 'firebase/firestore';
import { SetupRequiredBanner } from '../components/SetupRequiredBanner';
import { StatusTag } from '../components/StatusTag';
import { useAuth } from '../context/AuthContext';
import {
  cancelBookingByStudent,
  submitCompletedBookingReview,
} from '../lib/bookings';
import { db, getReadableFirebaseError, isFirebaseConfigured } from '../lib/firebase';
import type { BookingRequest, ServiceReview } from '../types/campusfix';

interface RequestDetailPageProps {
  bookingId: string;
  justCreated?: boolean;
  onNavigate: (path: string) => void;
}

function formatTs(ts: Timestamp | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  return ts.toDate().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function RequestDetailPage({
  bookingId,
  justCreated,
  onNavigate,
}: RequestDetailPageProps) {
  const { firebaseUser, authReady, signInWithGoogle, authBusy } = useAuth();
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [review, setReview] = useState<ServiceReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !authReady) return;
    if (!firebaseUser) {
      setBooking(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const bookingRef = doc(db, 'bookings', bookingId);
    const unsubBooking = onSnapshot(
      bookingRef,
      (snap) => {
        if (!snap.exists()) {
          setBooking(null);
          setError('Booking request not found.');
        } else {
          setBooking(snap.data() as BookingRequest);
        }
        setLoading(false);
      },
      (err) => {
        setError(getReadableFirebaseError(err));
        setLoading(false);
      },
    );

    const reviewRef = doc(db, 'reviews', bookingId);
    const unsubReview = onSnapshot(
      reviewRef,
      (snap) => {
        if (snap.exists()) {
          setReview(snap.data() as ServiceReview);
        } else {
          setReview(null);
        }
      },
      () => {
        // Review may not exist yet
      },
    );

    return () => {
      unsubBooking();
      unsubReview();
    };
  }, [bookingId, firebaseUser, authReady]);

  if (!isFirebaseConfigured) {
    return <SetupRequiredBanner />;
  }

  if (authReady && !firebaseUser) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-bold text-[#0F1F3D]">
          Sign in to track this request
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Only the student who created this request, the assigned provider, or an administrator can read it.
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

  const canCancel =
    booking !== null &&
    firebaseUser?.uid === booking.studentUid &&
    (booking.status === 'Requested' || booking.status === 'Accepted');

  const canReview =
    booking !== null &&
    firebaseUser?.uid === booking.studentUid &&
    booking.status === 'Completed' &&
    !booking.reviewSubmitted &&
    !review;

  async function handleCancelConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !booking || cancelling) return;
    setActionError(null);
    setCancelling(true);
    try {
      await cancelBookingByStudent(db, booking.id, cancelReason);
      setCancelOpen(false);
    } catch (err) {
      setActionError(getReadableFirebaseError(err));
    } finally {
      setCancelling(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !booking || submittingReview) return;
    setActionError(null);
    setSubmittingReview(true);
    try {
      await submitCompletedBookingReview(db, booking, rating, comment);
      setReviewSuccess(true);
    } catch (err) {
      setActionError(getReadableFirebaseError(err));
    } finally {
      setSubmittingReview(false);
    }
  }

  const mainSteps: {
    key: 'Requested' | 'Accepted' | 'In Progress' | 'Completed';
    label: string;
    ts: Timestamp | null | undefined;
  }[] = booking
    ? [
        { key: 'Requested', label: 'Requested', ts: booking.createdAt },
        { key: 'Accepted', label: 'Accepted', ts: booking.acceptedAt },
        { key: 'In Progress', label: 'In Progress', ts: booking.inProgressAt },
        { key: 'Completed', label: 'Completed', ts: booking.completedAt },
      ]
    : [];

  const stepOrder = ['Requested', 'Accepted', 'In Progress', 'Completed'];
  const reachedIndex = booking ? stepOrder.indexOf(booking.status) : -1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/requests')}
          className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 hover:border-slate-300 flex items-center justify-center text-[#0F1F3D] cursor-pointer"
          aria-label="Back to My Requests"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F1F3D]">
            Request tracking
          </h1>
          {booking && (
            <p className="text-xs font-mono text-slate-600 tabular-nums">
              Reference {booking.referenceCode}
            </p>
          )}
        </div>
      </div>

      {justCreated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2.5 text-sm text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Booking request submitted</p>
            <p className="text-xs mt-0.5">
              Your request is saved with status Requested. Keep this page or My Requests open to see provider updates.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-24 w-full bg-slate-100 rounded-xl" />
          <div className="h-24 w-full bg-slate-100 rounded-xl" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-sm text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to open booking</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {!loading && booking && (
        <>
          {/* Summary Card */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono font-semibold text-slate-500 tabular-nums">
                  {booking.referenceCode}
                </p>
                <h2 className="font-display text-xl font-bold text-[#0F1F3D] mt-0.5">
                  {booking.serviceTitle}
                </h2>
                <p className="text-sm font-medium text-teal-800 mt-0.5">
                  {booking.providerName}
                </p>
              </div>
              <StatusTag status={booking.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Scheduled window</p>
                <p className="font-medium text-[#0F1F3D] inline-flex items-center gap-1.5 tabular-nums">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {booking.scheduledDate} · {booking.timeWindow}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Hostel / PG location</p>
                <p className="font-medium text-[#0F1F3D] inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  {booking.building}, {booking.roomOrPickupPoint}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">
                  Illustrative price basis
                </p>
                <p className="font-mono text-sm font-semibold text-[#0F1F3D] tabular-nums">
                  {booking.priceBasisSnapshot}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Payment note</p>
                <p className="text-xs text-slate-600">
                  Settled directly with provider. Prototype does not process payments.
                </p>
              </div>
            </div>

            {booking.category === 'printing' && booking.printingDescription && (
              <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-4 text-sm space-y-1">
                <p className="text-xs font-semibold text-slate-500">Printing specifications</p>
                <p className="font-medium text-[#0F1F3D]">{booking.printingDescription}</p>
                <p className="text-xs text-slate-600 tabular-nums">
                  Pages: {booking.printingPageCount} · Preference:{' '}
                  {booking.printingColor === 'color' ? 'Colour' : 'Black & White'}
                </p>
              </div>
            )}

            {booking.instructions && (
              <div className="text-sm">
                <p className="text-xs font-semibold text-slate-500">Your instructions</p>
                <p className="mt-1 text-slate-700">{booking.instructions}</p>
              </div>
            )}
          </section>

          {/* Status Timeline */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#0F1F3D]">Progress timeline</h3>

            <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {mainSteps.map((step, index) => {
                const reached =
                  Boolean(step.ts) || (reachedIndex >= 0 && index <= reachedIndex);
                const isCurrent = booking.status === step.key;
                return (
                  <li
                    key={step.key}
                    className={`rounded-xl border p-3.5 ${
                      isCurrent
                        ? 'border-teal-600 bg-teal-50/50'
                        : reached
                        ? 'border-slate-200 bg-[#F6F8FB]'
                        : 'border-slate-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {reached ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-[#0F1F3D]">
                        {step.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
                      {step.ts ? formatTs(step.ts) : 'Pending'}
                    </p>
                  </li>
                );
              })}
            </ol>

            {booking.status === 'Rejected' && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-2.5 text-sm text-rose-900">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700" />
                <div>
                  <p className="font-semibold">
                    Request rejected {booking.rejectedAt ? `· ${formatTs(booking.rejectedAt)}` : ''}
                  </p>
                  {booking.statusNote && (
                    <p className="mt-1 text-xs">{booking.statusNote}</p>
                  )}
                </div>
              </div>
            )}

            {booking.status === 'Cancelled' && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-2.5 text-sm text-rose-900">
                <Ban className="w-5 h-5 shrink-0 mt-0.5 text-rose-700" />
                <div>
                  <p className="font-semibold">
                    Request cancelled {booking.cancelledAt ? `· ${formatTs(booking.cancelledAt)}` : ''}
                  </p>
                  {booking.cancellationReason && (
                    <p className="mt-1 text-xs">{booking.cancellationReason}</p>
                  )}
                </div>
              </div>
            )}

            {booking.statusNote && booking.status !== 'Rejected' && (
              <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#0F1F3D]">Provider note: </span>
                  {booking.statusNote}
                </div>
              </div>
            )}
          </section>

          {actionError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Cancellation Section (Strictly before In Progress) */}
          {firebaseUser?.uid === booking.studentUid && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F1F3D]">
                    Need to cancel this request?
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {canCancel
                      ? 'Requests can be cancelled before the provider marks them In Progress.'
                      : 'Cancellation is closed once a request reaches In Progress or a final outcome.'}
                  </p>
                </div>
                {canCancel && !cancelOpen && (
                  <button
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Cancel request
                  </button>
                )}
              </div>

              {canCancel && cancelOpen && (
                <form onSubmit={handleCancelConfirm} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <label
                    htmlFor="cancel-reason"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Reason for cancelling (optional)
                  </label>
                  <input
                    id="cancel-reason"
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    maxLength={300}
                    placeholder="e.g. Rescheduling to weekend"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D]"
                  />
                  <div className="flex items-center gap-2.5">
                    <button
                      type="submit"
                      disabled={cancelling}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                    >
                      {cancelling ? 'Cancelling...' : 'Confirm cancellation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelOpen(false)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-[#0F1F3D] cursor-pointer"
                    >
                      Keep request
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* Review Section (Strictly after Completed, max 1 per booking) */}
          {canReview && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#0F1F3D]">
                Rate your completed service
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Submit one 1–5 star rating and optional feedback for this completed booking.
              </p>

              <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} out of 5 stars`}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:border-amber-400 flex items-center justify-center cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-[#0F1F3D] tabular-nums">
                    {rating} / 5
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Optional comment
                  </label>
                  <textarea
                    id="review-comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    placeholder="Share arrival punctuality or quality feedback..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                >
                  {submittingReview ? 'Submitting review...' : 'Submit review'}
                </button>
              </form>
            </section>
          )}

          {review && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0F1F3D]">
                  {reviewSuccess ? 'Review submitted' : 'Your review'}
                </h3>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[#0F1F3D] tabular-nums">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  {review.rating} / 5
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600">{review.comment}</p>
              )}
              <p className="text-xs text-slate-400">
                One review per completed booking · Submitted {formatTs(review.createdAt)}
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
