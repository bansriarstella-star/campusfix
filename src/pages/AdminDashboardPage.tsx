import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Plus,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { SetupRequiredBanner } from '../components/SetupRequiredBanner';
import { StatusTag } from '../components/StatusTag';
import { useAuth } from '../context/AuthContext';
import {
  db,
  getReadableFirebaseError,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
} from '../lib/firebase';
import { seedDemoCatalogIdempotent, type SeedResult } from '../lib/seedData';
import {
  CATEGORY_META,
  VALIDATION_LIMITS,
  type BookingRequest,
  type ProviderPublic,
  type ServiceCatalogItem,
  type ServiceCategory,
} from '../types/campusfix';

export function AdminDashboardPage() {
  const { firebaseUser, isAdmin, authReady } = useAuth();
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);

  // Assign provider UID form
  const [assignUid, setAssignUid] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignProviderId, setAssignProviderId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);

  // Add new service form
  const [svcTitle, setSvcTitle] = useState('');
  const [svcProviderId, setSvcProviderId] = useState('');
  const [svcPriceBasis, setSvcPriceBasis] = useState('');
  const [svcMin, setSvcMin] = useState('100');
  const [svcMax, setSvcMax] = useState('250');
  const [svcDesc, setSvcDesc] = useState('');
  const [creatingSvc, setCreatingSvc] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !authReady) return;
    if (!firebaseUser || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubProv = onSnapshot(
      collection(db, 'providers'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as ProviderPublic);
        setProviders(list);
        if (list.length > 0 && !assignProviderId) {
          setAssignProviderId(list[0].id);
          setSvcProviderId(list[0].id);
        }
        setLoading(false);
      },
      (err) => {
        setError(getReadableFirebaseError(err));
        setLoading(false);
      },
    );

    const unsubSvc = onSnapshot(
      collection(db, 'services'),
      (snap) => {
        setServices(snap.docs.map((d) => d.data() as ServiceCatalogItem));
      },
      (err) => setError(getReadableFirebaseError(err)),
    );

    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as BookingRequest);
        rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setBookings(rows);
      },
      (err) => setError(getReadableFirebaseError(err)),
    );

    return () => {
      unsubProv();
      unsubSvc();
      unsubBookings();
    };
  }, [firebaseUser, isAdmin, authReady]);

  if (!isFirebaseConfigured) {
    return <SetupRequiredBanner />;
  }

  if (authReady && (!firebaseUser || !isAdmin)) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-[#0F1F3D]">
              Administrator access required
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              Catalog seeding, provider management, and cross-student request oversight are restricted by Firestore security rules to verified administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function handleSeedCatalog() {
    if (!db || seeding) return;
    setError(null);
    setSeeding(true);
    try {
      const res = await seedDemoCatalogIdempotent(db);
      setSeedResult(res);
    } catch (err) {
      setError(getReadableFirebaseError(err));
    } finally {
      setSeeding(false);
    }
  }

  async function handleToggleProvider(prov: ProviderPublic) {
    if (!db) return;
    setError(null);
    try {
      await updateDoc(doc(db, 'providers', prov.id), {
        active: !prov.active,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(getReadableFirebaseError(err));
    }
  }

  async function handleToggleService(svc: ServiceCatalogItem) {
    if (!db) return;
    setError(null);
    try {
      await updateDoc(doc(db, 'services', svc.id), {
        active: !svc.active,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(getReadableFirebaseError(err));
    }
  }

  async function handleAssignProviderAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!db || assigning) return;
    setAssignFeedback(null);
    setError(null);

    const uid = assignUid.trim();
    const email = assignEmail.trim();
    const prov = providers.find((p) => p.id === assignProviderId);

    if (!VALIDATION_LIMITS.idPattern.test(uid)) {
      setError('Firebase Auth UID must contain only letters, digits, underscores, or hyphens.');
      return;
    }
    if (!prov) {
      setError('Select a valid provider first.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter the provider Google account email.');
      return;
    }

    setAssigning(true);
    try {
      await setDoc(doc(db, 'providerAccounts', uid), {
        uid,
        providerId: prov.id,
        providerName: prov.name,
        email,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setAssignFeedback(`Linked UID ${uid} to ${prov.name}.`);
      setAssignUid('');
      setAssignEmail('');
    } catch (err) {
      setError(getReadableFirebaseError(err));
    } finally {
      setAssigning(false);
    }
  }

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    if (!db || creatingSvc) return;
    setError(null);

    const prov = providers.find((p) => p.id === svcProviderId);
    if (!prov) {
      setError('Seed or create a provider before adding a service.');
      return;
    }
    const minVal = Number(svcMin);
    const maxVal = Number(svcMax);
    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || maxVal < minVal) {
      setError('Estimated max INR must be greater than or equal to min INR.');
      return;
    }
    if (svcDesc.trim().length < 10) {
      setError('Service description must be at least 10 characters.');
      return;
    }

    setCreatingSvc(true);
    const svcRef = doc(collection(db, 'services'));
    try {
      await setDoc(svcRef, {
        id: svcRef.id,
        providerId: prov.id,
        providerName: prov.name,
        category: prov.category as ServiceCategory,
        title: svcTitle.trim().slice(0, VALIDATION_LIMITS.serviceTitleMax),
        description: svcDesc.trim().slice(0, VALIDATION_LIMITS.serviceDescriptionMax),
        priceBasis: svcPriceBasis.trim().slice(0, VALIDATION_LIMITS.priceBasisMax),
        estimatedMinInr: minVal,
        estimatedMaxInr: maxVal,
        turnaroundText: 'Scheduled window',
        availableWindows: prov.availableWindows,
        active: true,
        isDemoExample: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSvcTitle('');
      setSvcPriceBasis('');
      setSvcDesc('');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `services/${svcRef.id}`);
      } catch (wrapped) {
        setError(getReadableFirebaseError(wrapped));
      }
    } finally {
      setCreatingSvc(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1F3D]">
            Admin Console
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Seed the demo catalog once, manage active providers/services, and review incoming bookings.
          </p>
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedCatalog}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Database className="w-4 h-4" />
          <span>{seeding ? 'Seeding catalog...' : 'Seed demo catalog (idempotent)'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {seedResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Catalog seed check complete</p>
            <p className="text-xs mt-0.5 tabular-nums">
              Created {seedResult.createdProviders} providers ({seedResult.skippedProviders} existing skipped) and {seedResult.createdServices} services ({seedResult.skippedServices} existing skipped).
            </p>
          </div>
        </div>
      )}

      {/* Assign Provider Account */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#0F1F3D] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-700" />
            Authorize a provider Google account
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Have the provider sign in once with Google and copy their UID from Profile, then link them to a provider here (or create <code className="font-mono">providerAccounts/{'{uid}'}</code> directly in Firebase Console).
          </p>
        </div>

        <form onSubmit={handleAssignProviderAccount} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={assignUid}
            onChange={(e) => setAssignUid(e.target.value)}
            placeholder="Provider Firebase UID"
            required
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-[#0F1F3D]"
          />
          <input
            type="email"
            value={assignEmail}
            onChange={(e) => setAssignEmail(e.target.value)}
            placeholder="Provider Google email"
            required
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-[#0F1F3D]"
          />
          <select
            value={assignProviderId}
            onChange={(e) => setAssignProviderId(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-[#0F1F3D]"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={assigning || providers.length === 0}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F1F3D] hover:bg-[#1E3354] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
          >
            {assigning ? 'Linking...' : 'Link provider UID'}
          </button>
        </form>

        {assignFeedback && (
          <p className="text-xs font-semibold text-emerald-700">{assignFeedback}</p>
        )}
      </section>

      {/* Providers & Services Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0F1F3D]">
            Providers ({providers.length})
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : providers.length === 0 ? (
            <p className="text-sm text-slate-600">
              No providers yet. Click &ldquo;Seed demo catalog&rdquo; above to add the 4 DGU demo providers.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {providers.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F1F3D] truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {CATEGORY_META[p.category]?.shortLabel} · {p.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleProvider(p)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer shrink-0 ${
                      p.active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {p.active ? 'Active' : 'Paused'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0F1F3D]">
            Services ({services.length})
          </h2>
          {services.length > 0 && (
            <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {services.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F1F3D] truncate">{s.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {s.providerName} · {s.priceBasis}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleService(s)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer shrink-0 ${
                      s.active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {s.active ? 'Active' : 'Hidden'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Quick Add Service */}
          <form onSubmit={handleCreateService} className="pt-4 border-t border-slate-100 space-y-3">
            <p className="text-xs font-bold text-[#0F1F3D] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              Add demo service offering
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={svcTitle}
                onChange={(e) => setSvcTitle(e.target.value)}
                placeholder="Service title"
                required
                className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
              <select
                value={svcProviderId}
                onChange={(e) => setSvcProviderId(e.target.value)}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={svcPriceBasis}
                onChange={(e) => setSvcPriceBasis(e.target.value)}
                placeholder="Demo estimate: ₹150 / visit"
                required
                className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={svcMin}
                  onChange={(e) => setSvcMin(e.target.value)}
                  min={0}
                  placeholder="Min INR"
                  className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm tabular-nums"
                />
                <input
                  type="number"
                  value={svcMax}
                  onChange={(e) => setSvcMax(e.target.value)}
                  min={0}
                  placeholder="Max INR"
                  className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm tabular-nums"
                />
              </div>
            </div>
            <input
              type="text"
              value={svcDesc}
              onChange={(e) => setSvcDesc(e.target.value)}
              placeholder="Short description (min 10 chars)"
              required
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              disabled={creatingSvc || providers.length === 0}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
            >
              {creatingSvc ? 'Adding...' : 'Add service'}
            </button>
          </form>
        </section>
      </div>

      {/* All Requests Table */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0F1F3D]">
          All booking requests ({bookings.length})
        </h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-600">No student booking requests recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">Reference</th>
                  <th className="py-2.5 pr-4 font-semibold">Student</th>
                  <th className="py-2.5 pr-4 font-semibold">Service / Provider</th>
                  <th className="py-2.5 pr-4 font-semibold">Schedule</th>
                  <th className="py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#0F1F3D] tabular-nums whitespace-nowrap">
                      {b.referenceCode}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[#0F1F3D]">{b.studentName}</p>
                      <p className="text-xs text-slate-500">{b.building}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[#0F1F3D]">{b.serviceTitle}</p>
                      <p className="text-xs text-slate-500">{b.providerName}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {b.scheduledDate} · {b.timeWindow}
                    </td>
                    <td className="py-3">
                      <StatusTag status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
