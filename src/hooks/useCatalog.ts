import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, getReadableFirebaseError, isFirebaseConfigured } from '../lib/firebase';
import type {
  ProviderPublic,
  ServiceCatalogItem,
  ServiceReview,
} from '../types/campusfix';

export interface CatalogState {
  providers: ProviderPublic[];
  services: ServiceCatalogItem[];
  reviews: ServiceReview[];
  loading: boolean;
  error: string | null;
}

export function useCatalog(): CatalogState {
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
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
        setServices(items);
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
        const items = snap.docs.map((d) => d.data() as ServiceReview);
        setReviews(items);
      },
      () => {
        // Non-fatal if reviews fail to load
      },
    );

    return () => {
      unsubProviders();
      unsubServices();
      unsubReviews();
    };
  }, []);

  return {
    providers,
    services,
    reviews,
    loading: loadingProviders || loadingServices,
    error,
  };
}
