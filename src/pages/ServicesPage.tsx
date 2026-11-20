import { useMemo, useState } from 'react';
import { CalendarClock, MapPin, Search, Star, Shield, AlertCircle } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { SetupRequiredBanner } from '../components/SetupRequiredBanner';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  CATEGORY_META,
  type ServiceCatalogItem,
  type ServiceCategory,
} from '../types/campusfix';

interface ServicesPageProps {
  initialCategory?: string;
  onNavigate: (path: string) => void;
}

const FILTER_OPTIONS: { id: 'all' | ServiceCategory; label: string }[] = [
  { id: 'all', label: 'All Services' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'repairs', label: 'Repairs' },
  { id: 'printing', label: 'Printing' },
  { id: 'housekeeping', label: 'Housekeeping' },
];

export function ServicesPage({ initialCategory, onNavigate }: ServicesPageProps) {
  const { isAdmin } = useAuth();
  const { providers, services, reviews, loading, error } = useCatalog();
  const validInitial: 'all' | ServiceCategory =
    initialCategory === 'laundry' ||
    initialCategory === 'repairs' ||
    initialCategory === 'printing' ||
    initialCategory === 'housekeeping'
      ? initialCategory
      : 'all';

  const [category, setCategory] = useState<'all' | ServiceCategory>(validInitial);
  const [searchQuery, setSearchQuery] = useState('');

  const providerMap = useMemo(() => {
    const map = new Map<string, (typeof providers)[number]>();
    providers.forEach((p) => map.set(p.id, p));
    return map;
  }, [providers]);

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
      if (category !== 'all' && svc.category !== category) return false;
      if (!q) return true;
      return (
        svc.title.toLowerCase().includes(q) ||
        svc.description.toLowerCase().includes(q) ||
        svc.providerName.toLowerCase().includes(q)
      );
    });
  }, [services, category, searchQuery]);

  if (!isFirebaseConfigured) {
    return <SetupRequiredBanner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1F3D]">
            Campus service catalog
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Browse active services around DGU hostels and nearby Dehradun PGs. Seeded items are labeled as demo examples with illustrative pricing only.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search laundry, fan, print..."
            aria-label="Search services"
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D] placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div
        role="tablist"
        aria-label="Service category filters"
        className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto"
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = category === opt.id;
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

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to load service catalog</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
            >
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-6 w-2/3 bg-slate-200 rounded" />
              <div className="h-12 w-full bg-slate-100 rounded" />
              <div className="h-10 w-36 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredServices.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-base font-bold text-[#0F1F3D]">
            {services.length === 0
              ? 'No services have been published yet'
              : 'No matching services found'}
          </p>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            {services.length === 0
              ? 'Catalog data is seeded explicitly by a verified administrator rather than auto-written during page load.'
              : 'Try switching to All Services or clearing your search query.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {services.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setSearchQuery('');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-[#0F1F3D] cursor-pointer"
              >
                Reset filters
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Seed demo catalog in Admin Console</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Services Grid */}
      {!loading && !error && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredServices.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              providerArea={providerMap.get(svc.providerId)?.areaServed}
              ratingStats={ratingByProvider.get(svc.providerId)}
              onBook={() => onNavigate(`/book?serviceId=${encodeURIComponent(svc.id)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  providerArea,
  ratingStats,
  onBook,
}: {
  service: ServiceCatalogItem;
  providerArea?: string;
  ratingStats?: { sum: number; count: number };
  onBook: () => void;
}) {
  const catMeta = CATEGORY_META[service.category];
  const avgRating =
    ratingStats && ratingStats.count > 0
      ? (ratingStats.sum / ratingStats.count).toFixed(1)
      : null;

  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-5">
      <div className="space-y-3">
        {/* Clean unboxed metadata row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700">
            <CategoryIcon category={service.category} className="w-3.5 h-3.5" />
            {catMeta.shortLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span>{service.turnaroundText}</span>
          {service.isDemoExample && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-800">Demo Example</span>
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-[#0F1F3D]">
            {service.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="font-medium text-[#1E3354]">{service.providerName}</span>
            {avgRating && (
              <span className="inline-flex items-center gap-1 font-medium text-[#0F1F3D] tabular-nums">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                {avgRating} ({ratingStats!.count})
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>

        <div className="space-y-1.5 pt-2 text-xs text-slate-600">
          {providerArea && (
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{providerArea}</span>
            </p>
          )}
          <p className="flex items-center gap-2">
            <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Windows: {service.availableWindows.join(' · ')}</span>
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Illustrative pricing (settled directly)</p>
          <p className="text-sm font-bold text-[#0F1F3D] tabular-nums">
            {service.priceBasis}
          </p>
        </div>
        <button
          type="button"
          onClick={onBook}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          Request booking
        </button>
      </div>
    </article>
  );
}
