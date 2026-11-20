import type { LocalSampleBooking, RichServiceItem, ServiceCategory } from '../types/campusfix';

const LOCAL_BOOKINGS_STORAGE_KEY = 'campusfix_illustrative_bookings_v1';

export const SERVICE_HIGHLIGHTS_BY_CATEGORY: Record<ServiceCategory, string[]> = {
  laundry: [
    'Hostel doorstep pickup and neatly folded return',
    'Regular wear, bedsheets, and optional steam pressing',
    'Weight confirmed at pickup; settled directly (illustrative rate)',
  ],
  plumbing: [
    'Dripping taps, shower mixers, and flush valve checks',
    'Washbasin drain trap clearing and minor seal fixes',
    'Replacement washers or spares quoted directly before fitting',
  ],
  electrical: [
    'Ceiling fan noise, regulator, and switchboard inspection',
    'Loose 6A/16A sockets, tube light holders, and MCB checks',
    'Any replacement parts confirmed directly before installation',
  ],
  housekeeping: [
    'Room sweeping, disinfectant mopping, and dust wipe-down',
    'Attached washroom sink, mirror, and floor sanitizing',
    'Scheduled during daylight hostel visitor/staff hours',
  ],
  printing: [
    'A4 black & white or colour prints and lecture photocopying',
    'Single-sided, double-sided, stapling, or spiral binding',
    'Share files directly after request review (no file upload in v1)',
  ],
  tech_repairs: [
    'Laptop OS cleanup, thermal check, and charger/port diagnostics',
    'Mobile charging port cleaning and screen/battery checkup',
    'Hardware part costs quoted transparently after inspection',
  ],
  delivery: [
    'Campus gate to hostel block drop for snacks and groceries',
    'Tiffin, stationery, or bottled water runs within Dehradun cluster',
    'Item cost + delivery fee settled directly upon handoff',
  ],
  personal_care: [
    'Haircuts, beard trims, and basic grooming appointments',
    'Clean tools and scheduled time windows near hostel/PG clusters',
    'Pricing depends on selected service; settled directly',
  ],
  repairs: [
    'Electrical switches, ceiling fans, and hostel plumbing checks',
    'Minor room maintenance within the DGU campus/PG area',
    'Parts quoted directly before replacement',
  ],
};

export const SAMPLE_SERVICES: RichServiceItem[] = [
  {
    id: 'svc_sample_laundry',
    providerId: 'prov_sample_laundry',
    providerName: 'Illustrative Sample · No real vendor assigned',
    category: 'laundry',
    title: 'Laundry & Dry Cleaning',
    description:
      'Everyday hostel wash & fold, bedsheets, and dry cleaning/steam press pickup for DGU hostels and nearby PGs.',
    priceBasis: 'Starting from ₹75 / kg (Illustrative)',
    startingPriceLabel: '₹75 / kg',
    estimatedMinInr: 75,
    estimatedMaxInr: 350,
    turnaroundText: '24-hour illustrative turnaround',
    availableWindows: ['08:00-10:00', '13:00-15:00', '18:00-20:00'],
    areaServed: 'DGU Hostels & Pondha Road PGs',
    highlights: SERVICE_HIGHLIGHTS_BY_CATEGORY.laundry,
    active: true,
    isDemoExample: true,
    source: 'sample',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'svc_sample_plumbing',
    providerId: 'prov_sample_plumbing',
    providerName: 'Illustrative Sample · No real vendor assigned',
    category: 'plumbing',
    title: 'Plumbing Services',
    description:
      'Quick room requests for dripping taps, blocked washbasin drains, slow flush tanks, and bathroom pipe leaks.',
    priceBasis: 'Starting from ₹149 / visit (Illustrative)',
    startingPriceLabel: '₹149 / visit',
    estimatedMinInr: 149,
    estimatedMaxInr: 450,
    turnaroundText: 'Same-window visit estimate',
    availableWindows: ['09:30-11:30', '14:00-16:00', '17:00-19:00'],
    areaServed: 'DGU Hostels & Nanda Ki Chowki PGs',
    highlights: SERVICE_HIGHLIGHTS_BY_CATEGORY.plumbing,
    active: true,
    isDemoExample: true,
    source: 'sample',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'svc_sample_electrical',
    providerId: 'prov_sample_electrical',
    providerName: 'Illustrative Sample · No real vendor assigned',
    category: 'electrical',
    title: 'Electrical Repairs',
    description:
      'Troubleshooting ceiling fans, loose study sockets, MCB trips, tube lights, and hostel switchboard faults.',
    priceBasis: 'Starting from ₹129 / visit (Illustrative)',
    startingPriceLabel: '₹129 / visit',
    estimatedMinInr: 129,
    estimatedMaxInr: 400,
    turnaroundText: '1-2 hour visit estimate',
    availableWindows: ['09:30-11:30', '14:00-16:00', '17:00-19:00'],
    areaServed: 'DGU Hostels & Pondha PG Cluster',
    highlights: SERVICE_HIGHLIGHTS_BY_CATEGORY.electrical,
    active: true,
    isDemoExample: true,
    source: 'sample',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'svc_sample_housekeeping',
    providerId: 'prov_sample_housekeeping',
    providerName: 'Illustrative Sample · No real vendor assigned',
    category: 'housekeeping',
    title: 'Housekeeping & Cleaning',
    description:
      'Hostel and PG room sweeping, disinfectant mopping, study desk cleaning, and attached washroom sanitizing.',
    priceBasis: 'Starting from ₹120 / visit (Illustrative)',
    startingPriceLabel: '₹120 / visit',
    estimatedMinInr: 120,
    estimatedMaxInr: 300,
    turnaroundText: '30-60 min room session',
    availableWindows: ['09:00-11:00', '11:30-13:30', '15:30-17:30'],
    areaServed: 'DGU Hostels & Prem Nagar PGs',
    highlights: SERVICE_HIGHLIGHTS_BY_CATEGORY.housekeeping,
    active: true,
    isDemoExample: true,
    source: 'sample',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'svc_sample_printing',
    providerId: 'prov_sample_printing',
    providerName: 'Illustrative Sample · No real vendor assigned',
    category: 'printing',
    title: 'Printing & Photocopying',
    description:
      'Black & white or colour lecture notes, assignment printouts, photocopying, and spiral binding for submissions.',
    priceBasis: 'Starting from ₹2 / page (Illustrative)',
    startingPriceLabel: '₹2 / page',
    estimatedMinInr: 20,
    estimatedMaxInr: 400,
    turnaroundText: 'Same-day pickup/drop estimate',
    availableWindows: ['08:30-10:30', '12:30-14:30', '16:30-19:00'],
    areaServed: 'DGU Main Gate & Campus Hostels',
    highlights: SERVICE_HIGHLIGHTS_BY_CATEGORY.printing,
    active: true,
    isDemoExample: true,
    source: 'sample',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'svc_sample_tech_repairs',
    providerId: 'prov_sample_tech_repairs',
    providerName: 'Illustrative Sample · No real vendor assigned',
    category: 'tech_repairs',
    title: 'Laptop & Mobile Repairs',
    description:
      'Basic diagnostics for charging ports, laptop keyboards, battery health, screen checks, and OS slowdowns.',
    priceBasis: 'Starting from ₹199 / diagnostic (Illustrative)',
    startingPriceLabel: '₹199 / check',
    estimatedMinInr: 199,
    estimatedMaxInr: 1200,
    turnaroundText: 'Diagnostic within 24 hours',
    availableWindows: ['10:00-12:00', '14:00-16:00', '17:30-19:30'],
    areaServed: 'DGU Campus & Nanda Ki Chowki',
    highlights: SERVICE_HIGHLIGHTS_BY_CATEGORY.tech_repairs,
    active: true,
    isDemoExample: true,
    source: 'sample',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'svc_sample_delivery',
    providerId: 'prov_sample_delivery',
    providerName: 'Illustrative Sample · No real vendor assigned',
    category: 'delivery',
    title: 'Food & Grocery Delivery',
    description:
      'Campus-cluster pickup for daily hostel groceries, drinking water jars, tiffins, and evening snacks.',
    priceBasis: 'Starting from ₹30 / delivery (Illustrative)',
    startingPriceLabel: '₹30 / delivery',
    estimatedMinInr: 30,
    estimatedMaxInr: 250,
    turnaroundText: '30-45 min window estimate',
    availableWindows: ['09:00-11:00', '13:00-15:00', '19:00-21:00'],
    areaServed: 'DGU Hostels & 3 km Campus Radius',
    highlights: SERVICE_HIGHLIGHTS_BY_CATEGORY.delivery,
    active: true,
    isDemoExample: true,
    source: 'sample',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'svc_sample_personal_care',
    providerId: 'prov_sample_personal_care',
    providerName: 'Illustrative Sample · No real vendor assigned',
    category: 'personal_care',
    title: 'Beauty & Personal Care',
    description:
      'Scheduled haircuts, beard trims, and basic personal grooming arranged for hostel and nearby PG students.',
    priceBasis: 'Starting from ₹149 / session (Illustrative)',
    startingPriceLabel: '₹149 / session',
    estimatedMinInr: 149,
    estimatedMaxInr: 600,
    turnaroundText: '45 min scheduled slot',
    availableWindows: ['10:00-12:00', '15:00-17:00', '18:00-20:00'],
    areaServed: 'DGU Hostels & Pondha Cluster',
    highlights: SERVICE_HIGHLIGHTS_BY_CATEGORY.personal_care,
    active: true,
    isDemoExample: true,
    source: 'sample',
    createdAt: null,
    updatedAt: null,
  },
];

export function loadLocalSampleBookings(): LocalSampleBooking[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_BOOKINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalSampleBooking[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalSampleBooking(booking: LocalSampleBooking): void {
  try {
    const existing = loadLocalSampleBookings();
    const updated = [booking, ...existing.filter((b) => b.id !== booking.id)];
    window.localStorage.setItem(LOCAL_BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function cancelLocalSampleBooking(bookingId: string): void {
  try {
    const existing = loadLocalSampleBookings();
    const updated = existing.map((b) =>
      b.id === bookingId ? { ...b, status: 'Cancelled' as const } : b,
    );
    window.localStorage.setItem(LOCAL_BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}
