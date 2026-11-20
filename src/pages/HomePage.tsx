import { ArrowRight, CheckCircle2, Clock, Info, ShieldAlert } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { SetupRequiredBanner } from '../components/SetupRequiredBanner';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { CATEGORY_META, type ServiceCategory } from '../types/campusfix';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const CATEGORIES_ORDER: ServiceCategory[] = [
  'laundry',
  'repairs',
  'printing',
  'housekeeping',
];

export function HomePage({ onNavigate }: HomePageProps) {
  const { firebaseUser, signInWithGoogle, authBusy, offlineWarning } = useAuth();

  return (
    <div className="space-y-10 md:space-y-12">
      {!isFirebaseConfigured && <SetupRequiredBanner />}
      {offlineWarning && <SetupRequiredBanner reason={offlineWarning} />}

      {/* Hero Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-wide text-teal-700 mb-3">
                DBS Global University Hostel &amp; Nearby PG Cluster · Dehradun
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#0F1F3D] leading-[1.12] [text-wrap:balance]">
                Campus life, sorted.
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
                Stop chasing scattered WhatsApp groups and unanswered calls for hostel chores. CampusFix lets DGU hostel and nearby PG students request laundry, electrical or plumbing repairs, printing, and room housekeeping in one place—and track every step from request to completion.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/book')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Book a service</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/services')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-[#0F1F3D] text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Browse services</span>
              </button>
              {!firebaseUser && isFirebaseConfigured && (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => signInWithGoogle()}
                  className="min-h-[48px] px-4 py-3 text-sm font-medium text-teal-700 hover:text-teal-800 underline underline-offset-4 cursor-pointer"
                >
                  {authBusy ? 'Signing in...' : 'Sign in with Google'}
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#F6F8FB] border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[#0F1F3D]">
                How a CampusFix request works
              </h2>
              <ol className="mt-4 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#0F1F3D] text-white text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-[#0F1F3D]">Pick a service &amp; time window</p>
                    <p className="text-slate-600 mt-0.5">
                      Choose a category, review illustrative demo pricing, and submit your hostel/PG room details.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-[#0F1F3D]">Track status without follow-up calls</p>
                    <p className="text-slate-600 mt-0.5">
                      Follow live updates from Requested to Accepted, In Progress, and Completed in My Requests.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 text-[#0F1F3D] text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-[#0F1F3D]">Settle directly &amp; rate</p>
                    <p className="text-slate-600 mt-0.5">
                      Pay the service provider directly upon completion, then leave a 1–5 star rating for fellow students.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Scope: DGU campus hostels &amp; nearby Dehradun PG clusters</span>
            </div>
          </div>
        </div>
      </section>

      {/* Four Main Service Categories */}
      <section aria-labelledby="categories-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2
              id="categories-heading"
              className="font-display text-xl sm:text-2xl font-bold text-[#0F1F3D]"
            >
              Core campus service categories
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Focused v1 coverage for everyday DGU student needs. Select a category to view demo providers and booking windows.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/services')}
            className="text-sm font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View full catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onNavigate(`/services?category=${cat}`)}
                className="text-left bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-5 shadow-sm transition-colors flex flex-col justify-between gap-4 cursor-pointer group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                    <CategoryIcon category={cat} className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F1F3D] group-hover:text-teal-700 transition-colors">
                    {meta.label}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {meta.summary}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="truncate">{meta.exampleScope}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Prototype Transparency & MVP Scope Disclosure */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#0F1F3D]">
                Student Venture Prototype &amp; Demo Catalog Notice
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                CampusFix is an Entrepreneurship &amp; Innovation academic prototype built for DGU hostel and PG workflows—not an official DBS Global University service. Seeded providers and prices are clearly labeled <strong className="font-semibold text-[#0F1F3D]">Demo Example</strong> and do not imply actual university approval or verified vendor partnerships.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#0F1F3D] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#0F1F3D]">
                Direct Payment &amp; Version 1 Boundaries
              </h3>
              <ul className="mt-1.5 space-y-1 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <span>
                    Payment is arranged directly with the provider; this prototype does not process or verify payments.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <span>
                    The venture plan assumes ₹30 platform commission per completed booking (a planning assumption, not a service fee).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <span>
                    Excludes online checkout, live GPS tracking, file uploads, and off-campus areas outside the DGU cluster.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
