import { doc, getDoc, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';
import type { ServiceCategory } from '../types/campusfix';
import { handleFirestoreError, OperationType } from './firebase';

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

interface SeedServiceDef {
  id: string;
  providerId: string;
  providerName: string;
  category: ServiceCategory;
  title: string;
  description: string;
  priceBasis: string;
  estimatedMinInr: number;
  estimatedMaxInr: number;
  turnaroundText: string;
  availableWindows: string[];
}

export const DEMO_PROVIDERS: SeedProviderDef[] = [
  {
    id: 'prov_demo_laundry',
    name: 'Pondha Wash & Fold (Demo Example)',
    category: 'laundry',
    tagline: 'Weight-based hostel laundry pickup and folded return.',
    areaServed: 'DGU Campus Hostels & Pondha Road PGs',
    availableWindows: ['08:00-10:00', '13:00-15:00', '18:00-20:00'],
    contactPhone: '+91-98XXX-00101 (Demo placeholder)',
    internalNotes: 'Demo example provider seeded by admin. Link a real provider UID in providerAccounts to test provider workflows.',
  },
  {
    id: 'prov_demo_repairs',
    name: 'DGU Cluster Fix-It Desk (Demo Example)',
    category: 'repairs',
    tagline: 'Electrical switches, ceiling fans, taps, and minor hostel plumbing.',
    areaServed: 'DGU Hostels & Nanda Ki Chowki PGs',
    availableWindows: ['09:30-11:30', '14:00-16:00', '17:00-19:00'],
    contactPhone: '+91-98XXX-00102 (Demo placeholder)',
    internalNotes: 'Demo example provider seeded by admin. Inspection quote shared directly with student before parts replacement.',
  },
  {
    id: 'prov_demo_printing',
    name: 'Nanda Chowk Print Hub (Demo Example)',
    category: 'printing',
    tagline: 'Assignment printouts, lecture packets, and spiral binding.',
    areaServed: 'DGU Main Gate, Hostels & Nearby PGs',
    availableWindows: ['08:30-10:30', '12:30-14:30', '16:30-19:00'],
    contactPhone: '+91-98XXX-00103 (Demo placeholder)',
    internalNotes: 'Demo example provider seeded by admin. Student shares PDF/DOC via WhatsApp or counter after booking acceptance.',
  },
  {
    id: 'prov_demo_housekeeping',
    name: 'Hostel Care Crew (Demo Example)',
    category: 'housekeeping',
    tagline: 'Room sweeping, mopping, desk dusting, and washroom sanitizing.',
    areaServed: 'DGU Hostels & Prem Nagar PG Cluster',
    availableWindows: ['09:00-11:00', '11:30-13:30', '15:30-17:30'],
    contactPhone: '+91-98XXX-00104 (Demo placeholder)',
    internalNotes: 'Demo example provider seeded by admin.',
  },
];

export const DEMO_SERVICES: SeedServiceDef[] = [
  {
    id: 'svc_demo_laundry_wash_fold',
    providerId: 'prov_demo_laundry',
    providerName: 'Pondha Wash & Fold (Demo Example)',
    category: 'laundry',
    title: 'Everyday Wash & Fold (Per Kg)',
    description:
      'Demo service example: Machine wash, spin dry, and neat folding for everyday clothes. Minimum 2 kg recommended per bag; settled directly on delivery.',
    priceBasis: 'Demo estimate: ₹75 / kg (min 2 kg)',
    estimatedMinInr: 150,
    estimatedMaxInr: 300,
    turnaroundText: '24-hour turnaround',
    availableWindows: ['08:00-10:00', '13:00-15:00', '18:00-20:00'],
  },
  {
    id: 'svc_demo_laundry_steam_press',
    providerId: 'prov_demo_laundry',
    providerName: 'Pondha Wash & Fold (Demo Example)',
    category: 'laundry',
    title: 'Wash + Steam Ironing Bundle',
    description:
      'Demo service example: Wash, dry, and crisp steam pressing for formal shirts, trousers, and blazer sets ahead of DGU presentations.',
    priceBasis: 'Demo estimate: ₹110 / kg',
    estimatedMinInr: 110,
    estimatedMaxInr: 330,
    turnaroundText: '24-36 hours',
    availableWindows: ['08:00-10:00', '18:00-20:00'],
  },
  {
    id: 'svc_demo_repairs_electrical',
    providerId: 'prov_demo_repairs',
    providerName: 'DGU Cluster Fix-It Desk (Demo Example)',
    category: 'repairs',
    title: 'Electrical Fan, Switch & Socket Check',
    description:
      'Demo service example: Troubleshooting noisy ceiling fans, loose power sockets, MCB trips, or desk lamp wiring inside hostel/PG rooms.',
    priceBasis: 'Demo estimate: ₹150 visit + parts at actuals',
    estimatedMinInr: 150,
    estimatedMaxInr: 350,
    turnaroundText: 'Same-window inspection',
    availableWindows: ['09:30-11:30', '14:00-16:00', '17:00-19:00'],
  },
  {
    id: 'svc_demo_repairs_plumbing',
    providerId: 'prov_demo_repairs',
    providerName: 'DGU Cluster Fix-It Desk (Demo Example)',
    category: 'repairs',
    title: 'Tap, Flush & Sink Leak Repair',
    description:
      'Demo service example: Fixing dripping hostel/PG taps, blocked washbasin traps, or slow flush tanks. Replacement washers/valves billed at actuals.',
    priceBasis: 'Demo estimate: ₹180 visit + parts at actuals',
    estimatedMinInr: 180,
    estimatedMaxInr: 400,
    turnaroundText: '1-2 hour fix window',
    availableWindows: ['09:30-11:30', '14:00-16:00', '17:00-19:00'],
  },
  {
    id: 'svc_demo_printing_bw',
    providerId: 'prov_demo_printing',
    providerName: 'Nanda Chowk Print Hub (Demo Example)',
    category: 'printing',
    title: 'B&W Lecture Notes & Assignments',
    description:
      'Demo service example: A4 75gsm single/double-sided black & white printing with staple or clip finishing. File upload is outside v1; share file after acceptance.',
    priceBasis: 'Demo estimate: ₹2 / B&W page',
    estimatedMinInr: 20,
    estimatedMaxInr: 200,
    turnaroundText: 'Same-day pickup/drop',
    availableWindows: ['08:30-10:30', '12:30-14:30', '16:30-19:00'],
  },
  {
    id: 'svc_demo_printing_color_bind',
    providerId: 'prov_demo_printing',
    providerName: 'Nanda Chowk Print Hub (Demo Example)',
    category: 'printing',
    title: 'Colour Report & Spiral Binding',
    description:
      'Demo service example: MBA/UG project reports with colour charts, clear cover sheet, and spiral binding. Final page count verified at print desk.',
    priceBasis: 'Demo estimate: ₹10 / colour page + ₹40 spiral',
    estimatedMinInr: 90,
    estimatedMaxInr: 450,
    turnaroundText: '2-4 hours after file handoff',
    availableWindows: ['08:30-10:30', '12:30-14:30', '16:30-19:00'],
  },
  {
    id: 'svc_demo_housekeeping_room',
    providerId: 'prov_demo_housekeeping',
    providerName: 'Hostel Care Crew (Demo Example)',
    category: 'housekeeping',
    title: 'Room Sweep, Mop & Desk Sanitize',
    description:
      'Demo service example: Thorough floor sweep, disinfectant mopping, study desk wipe-down, and bin clearing for single or shared hostel/PG rooms.',
    priceBasis: 'Demo estimate: ₹120 / room visit',
    estimatedMinInr: 120,
    estimatedMaxInr: 160,
    turnaroundText: '30-45 min visit',
    availableWindows: ['09:00-11:00', '11:30-13:30', '15:30-17:30'],
  },
  {
    id: 'svc_demo_housekeeping_deep',
    providerId: 'prov_demo_housekeeping',
    providerName: 'Hostel Care Crew (Demo Example)',
    category: 'housekeeping',
    title: 'Room + Washroom Deep Clean',
    description:
      'Demo service example: Complete room floor scrub plus attached bathroom descaling, mirror/sink polish, and balcony sweep.',
    priceBasis: 'Demo estimate: ₹220 / deep clean',
    estimatedMinInr: 220,
    estimatedMaxInr: 280,
    turnaroundText: '60-75 min visit',
    availableWindows: ['09:00-11:00', '11:30-13:30', '15:30-17:30'],
  },
];

export interface SeedResult {
  createdProviders: number;
  skippedProviders: number;
  createdServices: number;
  skippedServices: number;
}

/**
 * Idempotent one-time catalog seeding restricted to trusted administrators.
 * Checks document existence first so existing admin customizations are preserved.
 */
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

  for (const svc of DEMO_SERVICES) {
    const svcRef = doc(firestore, 'services', svc.id);
    let existsSvc = false;
    try {
      const snap = await getDoc(svcRef);
      existsSvc = snap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `services/${svc.id}`);
    }

    if (existsSvc) {
      skippedServices += 1;
    } else {
      batch.set(svcRef, {
        id: svc.id,
        providerId: svc.providerId,
        providerName: svc.providerName,
        category: svc.category,
        title: svc.title,
        description: svc.description,
        priceBasis: svc.priceBasis,
        estimatedMinInr: svc.estimatedMinInr,
        estimatedMaxInr: svc.estimatedMaxInr,
        turnaroundText: svc.turnaroundText,
        availableWindows: svc.availableWindows,
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
