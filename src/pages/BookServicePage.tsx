import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Info, LogIn } from 'lucide-react';
import { SetupRequiredBanner } from '../components/SetupRequiredBanner';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import {
  createBookingRequest,
  getTomorrowIsoDate,
  isStrictlyFutureDate,
} from '../lib/bookings';
import { db, getReadableFirebaseError, isFirebaseConfigured } from '../lib/firebase';
import {
  CATEGORY_META,
  DGU_HOSTEL_SUGGESTIONS,
  VALIDATION_LIMITS,
  type PrintingColorOption,
  type ServiceCategory,
} from '../types/campusfix';

interface BookServicePageProps {
  initialServiceId?: string;
  onNavigate: (path: string) => void;
}

export function BookServicePage({
  initialServiceId,
  onNavigate,
}: BookServicePageProps) {
  const { firebaseUser, profile, signInWithGoogle, authBusy } = useAuth();
  const { services, loading: catalogLoading, error: catalogError } = useCatalog();

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId ?? '');
  const [scheduledDate, setScheduledDate] = useState<string>(getTomorrowIsoDate());
  const [timeWindow, setTimeWindow] = useState<string>('');
  const [building, setBuilding] = useState<string>('');
  const [roomOrPickupPoint, setRoomOrPickupPoint] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [printingDescription, setPrintingDescription] = useState<string>('');
  const [printingPageCount, setPrintingPageCount] = useState<string>('10');
  const [printingColor, setPrintingColor] = useState<PrintingColorOption>('bw');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill hostel/room from signed-in student profile once available
  useEffect(() => {
    if (profile) {
      if (!building && profile.hostelBuilding) {
        setBuilding(profile.hostelBuilding);
      }
      if (!roomOrPickupPoint && profile.roomNumber) {
        setRoomOrPickupPoint(profile.roomNumber);
      }
    }
  }, [profile]);

  // Select initial service cleanly once catalog arrives
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  useEffect(() => {
    if (services.length === 0) return;
    if (initialServiceId) {
      const match = services.find((s) => s.id === initialServiceId);
      if (match) {
        setSelectedServiceId(match.id);
        setSelectedCategory(match.category);
        return;
      }
    }
    if (!selectedServiceId || !filteredServices.some((s) => s.id === selectedServiceId)) {
      const first = filteredServices[0];
      if (first) setSelectedServiceId(first.id);
    }
  }, [services, filteredServices, initialServiceId, selectedServiceId]);

  const activeService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  // Sync default time window when service changes
  useEffect(() => {
    if (activeService && activeService.availableWindows.length > 0) {
      if (!activeService.availableWindows.includes(timeWindow)) {
        setTimeWindow(activeService.availableWindows[0]);
      }
    }
  }, [activeService, timeWindow]);

  if (!isFirebaseConfigured) {
    return <SetupRequiredBanner />;
  }

  const tomorrowDate = getTomorrowIsoDate();
  const isPrinting = activeService?.category === 'printing';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!firebaseUser || !db) {
      setFormError('Please sign in with Google to submit a service request.');
      return;
    }
    if (!activeService) {
      setFormError('Please choose an active service before submitting.');
      return;
    }
    if (!isStrictlyFutureDate(scheduledDate)) {
      setFormError('Please select tomorrow or a future date for your service window.');
      return;
    }
    if (!timeWindow || !activeService.availableWindows.includes(timeWindow)) {
      setFormError('Please pick one of the provider’s offered time windows.');
      return;
    }
    if (building.trim().length < VALIDATION_LIMITS.buildingMin) {
      setFormError('Please enter your hostel or PG building name.');
      return;
    }
    if (roomOrPickupPoint.trim().length < VALIDATION_LIMITS.roomMin) {
      setFormError('Please enter your room number or campus pickup point.');
      return;
    }

    let parsedPages = 0;
    if (isPrinting) {
      if (printingDescription.trim().length < 3) {
        setFormError('Please describe the document or assignment you need printed.');
        return;
      }
      parsedPages = Number(printingPageCount);
      if (!Number.isFinite(parsedPages) || parsedPages < 1 || parsedPages > 5000) {
        setFormError('Page count must be between 1 and 5000.');
        return;
      }
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const { bookingId } = await createBookingRequest(db, {
        studentUid: firebaseUser.uid,
        studentName:
          profile?.displayName || firebaseUser.displayName || 'DGU Student',
        studentEmail: firebaseUser.email || '',
        service: activeService,
        scheduledDate,
        timeWindow,
        building,
        roomOrPickupPoint,
        instructions,
        printingDescription,
        printingPageCount: parsedPages,
        printingColor: isPrinting ? (printingColor === 'color' ? 'color' : 'bw') : 'none',
      });
      onNavigate(`/requests/${encodeURIComponent(bookingId)}?created=1`);
    } catch (err) {
      setFormError(getReadableFirebaseError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/services')}
          className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 hover:border-slate-300 flex items-center justify-center text-[#0F1F3D] cursor-pointer"
          aria-label="Back to services"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1F3D]">
            Request a campus service
          </h1>
          <p className="text-sm text-slate-600">
            Submit a request for a preferred future window. Providers confirm availability directly.
          </p>
        </div>
      </div>

      {!firebaseUser && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0F1F3D]">
              Sign in with Google to book
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Requests are saved privately under your student account so you can track updates and cancel or review later.
            </p>
          </div>
          <button
            type="button"
            disabled={authBusy}
            onClick={() => signInWithGoogle()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{authBusy ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        </div>
      )}

      {catalogError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{catalogError}</span>
        </div>
      )}

      {!catalogLoading && services.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
          No active services are available in the catalog yet. Ask the project administrator to seed the demo catalog first.
        </div>
      )}

      {services.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6"
        >
          {/* Step 1: Service Selection */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0F1F3D]">
              1. Choose service &amp; provider
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="book-category"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Category
                </label>
                <select
                  id="book-category"
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as ServiceCategory | 'all')
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] focus:outline-none focus:border-teal-600"
                >
                  <option value="all">All categories</option>
                  {(Object.keys(CATEGORY_META) as ServiceCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_META[cat].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="book-service"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Service &amp; Provider
                </label>
                <select
                  id="book-service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] focus:outline-none focus:border-teal-600"
                >
                  {filteredServices.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.title} — {svc.providerName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeService && (
              <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-4 text-sm space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[#0F1F3D]">
                    {activeService.providerName}
                  </span>
                  <span className="font-mono text-xs font-semibold text-teal-800 tabular-nums">
                    {activeService.priceBasis}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {activeService.description}
                </p>
                {activeService.isDemoExample && (
                  <p className="text-xs text-amber-800 font-medium">
                    Demo Example: Illustrative provider and quote only. Availability is requested, not guaranteed.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Schedule & Hostel Location */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-[#0F1F3D]">
              2. Schedule &amp; DGU hostel / PG location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="book-date"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Preferred date (future date required)
                </label>
                <input
                  id="book-date"
                  type="date"
                  min={tomorrowDate}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] focus:outline-none focus:border-teal-600 tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="book-window"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Offered time window
                </label>
                <select
                  id="book-window"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] focus:outline-none focus:border-teal-600 tabular-nums"
                >
                  {(activeService?.availableWindows ?? []).map((win) => (
                    <option key={win} value={win}>
                      {win}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="book-building"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Hostel or PG building
                </label>
                <input
                  id="book-building"
                  type="text"
                  list="dgu-hostels"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  maxLength={VALIDATION_LIMITS.buildingMax}
                  placeholder="e.g. DGU Boys Hostel — Block A"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
                />
                <datalist id="dgu-hostels">
                  {DGU_HOSTEL_SUGGESTIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="book-room"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Room number or pickup point
                </label>
                <input
                  id="book-room"
                  type="text"
                  value={roomOrPickupPoint}
                  onChange={(e) => setRoomOrPickupPoint(e.target.value)}
                  maxLength={VALIDATION_LIMITS.roomMax}
                  placeholder="e.g. Room 214 or Hostel Reception"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Step 2b: Printing Specific Details */}
          {isPrinting && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2.5 bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-900">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal-700" />
                <span>
                  File upload is outside this first version. Describe your print job below and share the PDF/document directly with the provider after your request is accepted.
                </span>
              </div>

              <div>
                <label
                  htmlFor="print-desc"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Document / print job description
                </label>
                <input
                  id="print-desc"
                  type="text"
                  value={printingDescription}
                  onChange={(e) => setPrintingDescription(e.target.value)}
                  maxLength={VALIDATION_LIMITS.printingDescriptionMax}
                  placeholder="e.g. MBA Operations Case Study PDF, double-sided with spiral bind"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="print-pages"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Estimated page count
                  </label>
                  <input
                    id="print-pages"
                    type="number"
                    min={1}
                    max={5000}
                    value={printingPageCount}
                    onChange={(e) => setPrintingPageCount(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] tabular-nums focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Colour preference
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'bw' as const, label: 'Black & White' },
                      { id: 'color' as const, label: 'Colour' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrintingColor(opt.id)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                          printingColor === opt.id
                            ? 'bg-teal-50 border-teal-600 text-teal-900 font-semibold'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Instructions & Payment Basis */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label
                htmlFor="book-instructions"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Instructions for provider (optional)
              </label>
              <textarea
                id="book-instructions"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                maxLength={VALIDATION_LIMITS.instructionsMax}
                placeholder="e.g. Call at hostel gate upon arrival, or bring extra 6A plug socket."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-4 flex items-start gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>
                No online payment is taken here. Final charges are settled directly with the provider; demo figures shown are illustrative estimates only.
              </span>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-sm text-rose-800 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/services')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-sm font-semibold text-[#0F1F3D] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !firebaseUser}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? 'Submitting request...' : 'Submit booking request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
