import { doc, getDoc, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';
import type { ServiceCategory } from '../types/campusfix';
import { handleFirestoreError, OperationType } from './firebase';
import { SAMPLE_SERVICES } from './sampleServices';

interface SeedProviderDef {
  id: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  areaServed: string;
  availableWindows: string[];
  contactPhone: string;
  internalNotes: string;
}

export const DEMO_PROVIDERS: SeedProviderDef[] = [
  {
    id: 'prov_demo_laundry',
    name: 'CampusFix Sample Desk · Laundry',
    category: 'laundry',
    tagline: 'Illustrative hostel laundry and dry cleaning sample slot.',
    areaServed: 'DGU Campus Hostels & Pondha Road PGs',
    availableWindows: ['08:00-10:00', '13:00-15:00', '18:00-20:00'],
    contactPhone: 'Sample placeholder only',
    internalNotes: 'Seeded illustrative example for CampusFix prototype.',
  },
  {
    id: 'prov_demo_plumbing',
    name: 'CampusFix Sample Desk · Plumbing',
    category: 'plumbing',
    tagline: 'Illustrative tap, sink, and flush plumbing sample slot.',
    areaServed: 'DGU Hostels & Nanda Ki Chowki PGs',
    availableWindows: ['09:30-11:30', '14:00-16:00', '17:00-19:00'],
    contactPhone: 'Sample placeholder only',
    internalNotes: 'Seeded illustrative example for CampusFix prototype.',
  },
  {
    id: 'prov_demo_electrical',
    name: 'CampusFix Sample Desk · Electrical',
    category: 'electrical',
    tagline: 'Illustrative room electrical, fan, and socket sample slot.',
    areaServed: 'DGU Hostels & Pondha PG Cluster',
    availableWindows: ['09:30-11:30', '14:00-16:00', '17:00-19:00'],
    contactPhone: 'Sample placeholder only',
    internalNotes: 'Seeded illustrative example for CampusFix prototype.',
  },
  {
    id: 'prov_demo_housekeeping',
    name: 'CampusFix Sample Desk · Housekeeping',
    category: 'housekeeping',
    tagline: 'Illustrative hostel room sweeping and sanitizing sample slot.',
    areaServed: 'DGU Hostels & Prem Nagar PG Cluster',
    availableWindows: ['09:00-11:00', '11:30-13:30', '15:30-17:30'],
    contactPhone: 'Sample placeholder only',
    internalNotes: 'Seeded illustrative example for CampusFix prototype.',
  },
  {
    id: 'prov_demo_printing',
    name: 'CampusFix Sample Desk · Printing',
    category: 'printing',
    tagline: 'Illustrative assignment printing and photocopying sample slot.',
    areaServed: 'DGU Main Gate & Campus Hostels',
    availableWindows: ['08:30-10:30', '12:30-14:30', '16:30-19:00'],
    contactPhone: 'Sample placeholder only',
    internalNotes: 'Seeded illustrative example for CampusFix prototype.',
  },
  {
    id: 'prov_demo_tech_repairs',
    name: 'CampusFix Sample Desk · Tech Repairs',
    category: 'tech_repairs',
    tagline: 'Illustrative laptop and mobile diagnostic sample slot.',
    areaServed: 'DGU Campus & Nanda Ki Chowki',
    availableWindows: ['10:00-12:00', '14:00-16:00', '17:30-19:30'],
    contactPhone: 'Sample placeholder only',
    internalNotes: 'Seeded illustrative example for CampusFix prototype.',
  },
  {
    id: 'prov_demo_delivery',
    name: 'CampusFix Sample Desk · Delivery',
    category: 'delivery',
    tagline: 'Illustrative campus food and grocery drop sample slot.',
    areaServed: 'DGU Hostels & 3 km Radius',
    availableWindows: ['09:00-11:00', '13:00-15:00', '19:00-21:00'],
    contactPhone: 'Sample placeholder only',
    internalNotes: 'Seeded illustrative example for CampusFix prototype.',
  },
  {
    id: 'prov_demo_personal_care',
    providerIdPlaceholder: undefined,
    name: 'CampusFix Sample Desk · Personal Care',
    category: 'personal_care',
    tagline: 'Illustrative grooming and personal care sample slot.',
    areaServed: 'DGU Hostels & Pondha Cluster',
    availableWindows: ['10:00-12:00', '15:00-17:00', '18:00-20:00'],
    contactPhone: 'Sample placeholder only',
    internalNotes: 'Seeded illustrative example for CampusFix prototype.',
  } as SeedProviderDef,
];

const PROVIDER_BY_CATEGORY: Record<string, { id: string; name: string }> = {
  laundry: { id: 'prov_demo_laundry', name: 'CampusFix Sample Desk · Laundry' },
  plumbing: { id: 'prov_demo_plumbing', name: 'CampusFix Sample Desk · Plumbing' },
  electrical: { id: 'prov_demo_electrical', name: 'CampusFix Sample Desk · Electrical' },
  housekeeping: { id: 'prov_demo_housekeeping', name: 'CampusFix Sample Desk · Housekeeping' },
  printing: { id: 'prov_demo_printing', name: 'CampusFix Sample Desk · Printing' },
  tech_repairs: { id: 'prov_demo_tech_repairs', name: 'CampusFix Sample Desk · Tech Repairs' },
  delivery: { id: 'prov_demo_delivery', name: 'CampusFix Sample Desk · Delivery' },
  personal_care: { id: 'prov_demo_personal_care', name: 'CampusFix Sample Desk · Personal Care' },
};

export interface SeedResult {
  createdProviders: number;
  skippedProviders: number;
  createdServices: number;
  skippedServices: number;
}

export async function seedDemoCatalogIdempotent(firestore: Firestore): Promise<SeedResult> {
  const batch = writeBatch(firestore);
  let createdProviders = 0;
  let skippedProviders = 0;
  let createdServices = 0;
  let skippedServices = 0;

  for (const prov of DEMO_PROVIDERS) {
    const provRef = doc(firestore, 'providers', prov.id);
    const privRef = doc(firestore, 'providerPrivate', prov.id);
    let existsProv = false;
    try {
      const snap = await getDoc(provRef);
      existsProv = snap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `providers/${prov.id}`);
    }

    if (existsProv) {
      skippedProviders += 1;
    } else {
      batch.set(provRef, {
        id: prov.id,
        name: prov.name,
        category: prov.category,
        tagline: prov.tagline,
        areaServed: prov.areaServed,
        availableWindows: prov.availableWindows,
        active: true,
        isDemoExample: true,
        ratingAvg: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(privRef, {
        providerId: prov.id,
        assignedUid: '',
        accountEmail: '',
        contactPhone: prov.contactPhone,
        internalNotes: prov.internalNotes,
        updatedAt: serverTimestamp(),
      });
      createdProviders += 1;
    }
  }

  for (const sample of SAMPLE_SERVICES) {
    const svcId = sample.id.replace('svc_sample_', 'svc_demo_');
    const provInfo = PROVIDER_BY_CATEGORY[sample.category] ?? {
      id: 'prov_demo_laundry',
      name: 'CampusFix Sample Desk',
    };
    const svcRef = doc(firestore, 'services', svcId);
    let existsSvc = false;
    try {
      const snap = await getDoc(svcRef);
      existsSvc = snap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `services/${svcId}`);
    }

    if (existsSvc) {
      skippedServices += 1;
    } else {
      batch.set(svcRef, {
        id: svcId,
        providerId: provInfo.id,
        providerName: provInfo.name,
        category: sample.category,
        title: sample.title,
        description: sample.description,
        priceBasis: sample.priceBasis,
        estimatedMinInr: sample.estimatedMinInr,
        estimatedMaxInr: sample.estimatedMaxInr,
        turnaroundText: sample.turnaroundText,
        availableWindows: sample.availableWindows,
        active: true,
        isDemoExample: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createdServices += 1;
    }
  }

  if (createdProviders > 0 || createdServices > 0) {
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'providers/services (seed)');
    }
  }

  return {
    createdProviders,
    skippedProviders,
    createdServices,
    skippedServices,
  };
}
