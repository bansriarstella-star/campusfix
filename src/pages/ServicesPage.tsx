import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Info,
  MapPin,
  Search,
  Shield,
  Star,
  X,
} from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import {
  CATEGORY_META,
  PRIMARY_CATEGORIES,
  type RichServiceItem,
  type ServiceCategory,
} from '../types/campusfix';

interface ServicesPageProps {
  initialCategory?: string;
  onNavigate: (path: string) => void;
}

type CategoryFilter = 'all' | 'repairs' | ServiceCategory;

const FILTER_OPTIONS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All Services' },
  ...PRIMARY_CATEGORIES.map((cat) => ({
    id: cat,
    label: CATEGORY_META[cat].shortLabel,
  })),
];

function isValidCategoryParam(val?: string): CategoryFilter {
  if (!val) return 'all';
  if (val === 'repairs') return 'repairs';
  if (PRIMARY_CATEGORIES.includes(val as (typeof PRIMARY_CATEGORIES)[number])) {
    return val as ServiceCategory;
  }
  return 'all';
}

export function ServicesPage({ initialCategory, onNavigate }: ServicesPageProps) {
  const { isAdmin } = useAuth();
  const { services, reviews, loading, error, usingSampleFallback } = useCatalog();

  const [category, setCategory] = useState<CategoryFilter>(() =>
    isValidCategoryParam(initialCategory),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<RichServiceItem | null>(null);

  useEffect(() => {
    setCategory(isValidCategoryParam(initialCategory));
  }, [initialCategory]);

  const ratingByProvider = useMemo(() => {
    const stats = new Map<string, { sum: number; count: number }>();
    reviews.forEach((r) => {
      const prev = stats.get(r.providerId) ?? { sum: 0, count: 0 };
      stats.set(r.providerId, { sum: prev.sum + r.rating, count: prev.count + 1 });
    });
    return stats;
  }, [reviews]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return services.filter((svc) => {
      if (category === 'repairs') {
        if (
          svc.category !== 'plumbing' &&
          svc.category !== 'electrical' &&
          svc.category !== 'repairs'
        ) {
          return false;
        }
      } else if (category !== 'all' && svc.category !== category) {
        return false;
      }

      if (!q) return true;
      const catLabel = CATEGORY_META[svc.category]?.label.toLowerCase() ?? '';
      return (
        svc.title.toLowerCase().includes(q) ||
        svc.description.toLowerCase().includes(q) ||
        catLabel.includes(q) ||
        svc.highlights.some((h) => h.toLowerCase().includes(q))
      );
    });
  }, [services, category, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1F3D]">
            Campus service catalog
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Explore everyday services around DGU hostels and nearby Dehradun PGs. Sample prices and bookings are illustrative only—no real service providers are assigned.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search laundry, plumbing, laptop, print..."
            aria-label="Search services"
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Service category filters"
        className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl"
      >
        {FILTER_OPTIONS.map((opt) => {
          const active =
            category === opt.id ||
            (category === 'repairs' &&
              (opt.id === 'plumbing' || opt.id === 'electrical'));
          return (
            <button
              key={opt.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setCategory(opt.id)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-white text-[#0F1F3D] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-[#0F1F3D]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Illustrative Catalog Notice */}
      {usingSampleFallback && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>
              Showing <strong className="font-semibold text-[#0F1F3D]">illustrative sample services</strong> with sample INR starting prices. No real providers are connected or confirmed.
            </span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="inline-flex items-center gap-1.5 font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Seed to Firestore</span>
            </button>
          )}
        </div>
      )}

      {/* Non-blocking DB error notice if Firestore failed while sample fallback loaded */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Live database catalog unavailable ({error}). Displaying built-in sample services so you can still browse and test the booking flow.
          </span>
        </div>
      )}

      {/* Loading Skeleton (only brief when Firestore is actively loading) */}
      {loading && services.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
            >
              <div className="h-10 w-10 bg-slate-200 rounded-xl" />
              <div className="h-5 w-2/3 bg-slate-200 rounded" />
              <div className="h-12 w-full bg-slate-100 rounded" />
              <div className="h-10 w-32 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty Search / Filter State */}
      {filteredServices.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-base font-bold text-[#0F1F3D]">
            No matching services found
          </p>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            Try clearing your search term or switching back to All Services.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-[#0F1F3D] cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Responsive Service Cards Grid */}
      {filteredServices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              ratingStats={ratingByProvider.get(svc.providerId)}
              onSelectDetails={() => setSelectedService(svc)}
              onBookNow={() =>
                onNavigate(`/book?serviceId=${encodeURIComponent(svc.id)}`)
              }
            />
          ))}
        </div>
      )}

      {/* Service Details View Modal / Drawer */}
      {selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onBookNow={() => {
            const id = selectedService.id;
            setSelectedService(null);
            onNavigate(`/book?serviceId=${encodeURIComponent(id)}`);
          }}
        />
      )}
    </div>
  );
}

function ServiceCard({
  service,
  ratingStats,
  onSelectDetails,
  onBookNow,
}: {
  service: RichServiceItem;
  ratingStats?: { sum: number; count: number };
  onSelectDetails: () => void;
  onBookNow: () => void;
}) {
  const catMeta = CATEGORY_META[service.category];
  const avgRating =
    ratingStats && ratingStats.count > 0
      ? (ratingStats.sum / ratingStats.count).toFixed(1)
      : null;

  return (
    <article className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors flex flex-col justify-between gap-5">
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <CategoryIcon category={service.category} className="w-5 h-5" />
          </div>

          <div className="text-right">
            <p className="text-[11px] font-medium text-slate-500">
              Starting price (illustrative)
            </p>
            <p className="font-mono text-base font-bold text-[#0F1F3D] tabular-nums">
              {service.startingPriceLabel}
            </p>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-teal-700">
              {catMeta?.shortLabel ?? service.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>Illustrative Sample</span>
            {avgRating && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#0F1F3D] tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {avgRating} ({ratingStats!.count})
                </span>
              </>
            )}
          </div>

          <h2 className="mt-1 font-display text-lg font-bold text-[#0F1F3D]">
            <button
              type="button"
              onClick={onSelectDetails}
              className="text-left hover:text-teal-700 transition-colors cursor-pointer"
            >
              {service.title}
            </button>
          </h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>

        <div className="pt-1 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{service.areaServed}</span>
          </p>
          <p className="flex items-center gap-1.5 tabular-nums">
            <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Windows: {service.availableWindows.join(' · ')}</span>
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onSelectDetails}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-[#0F1F3D] text-sm font-semibold flex-1 transition-colors cursor-pointer"
        >
          View details
        </button>
        <button
          type="button"
          onClick={onBookNow}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold flex-1 transition-colors cursor-pointer"
        >
          Book Now
        </button>
      </div>
    </article>
  );
}

function ServiceDetailsModal({
  service,
  onClose,
  onBookNow,
}: {
  service: RichServiceItem;
  onClose: () => void;
  onBookNow: () => void;
}) {
  const catMeta = CATEGORY_META[service.category];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-detail-title"
      className="fixed inset-0 z-50 bg-[#0F1F3D]/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <CategoryIcon category={service.category} className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-700">
                {catMeta?.label ?? service.category} · Illustrative Sample
              </p>
              <h2
                id="service-detail-title"
                className="font-display text-xl font-bold text-[#0F1F3D]"
              >
                {service.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close service details"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>

        <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Illustrative starting price
            </p>
            <p className="font-mono font-bold text-[#0F1F3D] tabular-nums mt-0.5">
              {service.priceBasis}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Turnaround &amp; coverage
            </p>
            <p className="font-medium text-[#0F1F3D] mt-0.5">
              {service.turnaroundText}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-slate-500">
              Sample booking windows
            </p>
            <p className="font-medium text-[#0F1F3D] tabular-nums mt-0.5">
              {service.availableWindows.join(' · ')}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#0F1F3D] mb-2">
            Typical scope included
          </h3>
          <ul className="space-y-2">
            {service.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-slate-600"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
          <span>
            Prototype notice: Prices and booking slots are illustrative sample data. Submitting a request does not assign or confirm a real campus vendor.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-sm font-semibold text-[#0F1F3D] sm:flex-1 cursor-pointer"
          >
            Back to services
          </button>
          <button
            type="button"
            onClick={onBookNow}
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold sm:flex-1 cursor-pointer"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
