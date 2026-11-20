import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, getReadableFirebaseError, isFirebaseConfigured } from '../lib/firebase';
import {
  SAMPLE_SERVICES,
  SERVICE_HIGHLIGHTS_BY_CATEGORY,
} from '../lib/sampleServices';
import type {
  ProviderPublic,
  RichServiceItem,
  ServiceCatalogItem,
  ServiceReview,
} from '../types/campusfix';

export interface CatalogState {
  providers: ProviderPublic[];
  services: RichServiceItem[];
  reviews: ServiceReview[];
  loading: boolean;
  error: string | null;
  usingSampleFallback: boolean;
}

function enrichFirestoreService(
  svc: ServiceCatalogItem,
  providerMap: Map<string, ProviderPublic>,
): RichServiceItem {
  const area = providerMap.get(svc.providerId)?.areaServed || 'DGU Campus & Hostel Cluster';
  const highlights =
    SERVICE_HIGHLIGHTS_BY_CATEGORY[svc.category] ??
    SERVICE_HIGHLIGHTS_BY_CATEGORY.laundry;
  return {
    ...svc,
    startingPriceLabel: `₹${svc.estimatedMinInr}`,
    areaServed: area,
    highlights,
    source: 'firestore',
  };
}

export function useCatalog(): CatalogState {
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [firestoreServices, setFirestoreServices] = useState<ServiceCatalogItem[]>([]);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(isFirebaseConfigured);
  const [loadingServices, setLoadingServices] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoadingProviders(false);
      setLoadingServices(false);
      return;
    }

    const providersQuery = query(
      collection(db, 'providers'),
      where('active', '==', true),
    );
    const servicesQuery = query(
      collection(db, 'services'),
      where('active', '==', true),
    );
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('rating', '>=', 1),
    );

    const unsubProviders = onSnapshot(
      providersQuery,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as ProviderPublic);
        items.sort((a, b) => a.name.localeCompare(b.name));
        setProviders(items);
        setLoadingProviders(false);
      },
      (err) => {
        setError(getReadableFirebaseError(err));
        setLoadingProviders(false);
      },
    );

    const unsubServices = onSnapshot(
      servicesQuery,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as ServiceCatalogItem);
        items.sort((a, b) => a.title.localeCompare(b.title));
        setFirestoreServices(items);
        setLoadingServices(false);
      },
      (err) => {
        setError(getReadableFirebaseError(err));
        setLoadingServices(false);
      },
    );

    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snap) => {
        setReviews(snap.docs.map((d) => d.data() as ServiceReview));
      },
      () => {
        // Non-fatal
      },
    );

    return () => {
      unsubProviders();
      unsubServices();
      unsubReviews();
    };
  }, []);

  const { services, usingSampleFallback } = useMemo(() => {
    if (!isFirebaseConfigured || error || firestoreServices.length === 0) {
      return {
        services: SAMPLE_SERVICES,
        usingSampleFallback: true,
      };
    }

    const providerMap = new Map<string, ProviderPublic>();
    providers.forEach((p) => providerMap.set(p.id, p));

    const enriched = firestoreServices.map((s) =>
      enrichFirestoreService(s, providerMap),
    );

    // Ensure any of the 8 core categories not yet seeded in Firestore still appear as sample options
    const presentCategories = new Set(enriched.map((s) => s.category));
    const missingSamples = SAMPLE_SERVICES.filter(
      (sample) => !presentCategories.has(sample.category),
    );

    return {
      services: [...enriched, ...missingSamples],
      usingSampleFallback: missingSamples.length > 0,
    };
  }, [firestoreServices, providers, error]);

  return {
    providers,
    services,
    reviews,
    loading: loadingProviders || loadingServices,
    error,
    usingSampleFallback,
  };
}
