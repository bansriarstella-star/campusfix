import type { Timestamp } from 'firebase/firestore';

export type ServiceCategory =
  | 'laundry'
  | 'plumbing'
  | 'electrical'
  | 'housekeeping'
  | 'printing'
  | 'tech_repairs'
  | 'delivery'
  | 'personal_care'
  | 'repairs';

export type PrimaryServiceCategory = Exclude<ServiceCategory, 'repairs'>;

export type BookingStatus =
  | 'Requested'
  | 'Accepted'
  | 'In Progress'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export type UserRole = 'student' | 'provider' | 'admin';

export type PrintingColorOption = 'none' | 'bw' | 'color';

export const PRIMARY_CATEGORIES: PrimaryServiceCategory[] = [
  'laundry',
  'plumbing',
  'electrical',
  'housekeeping',
  'printing',
  'tech_repairs',
  'delivery',
  'personal_care',
];

export const CATEGORY_META: Record<
  ServiceCategory,
  {
    id: ServiceCategory;
    label: string;
    shortLabel: string;
    summary: string;
    exampleScope: string;
  }
> = {
  laundry: {
    id: 'laundry',
    label: 'Laundry & Dry Cleaning',
    shortLabel: 'Laundry',
    summary: 'Wash & fold, bedsheets, stain care, and steam pressing for hostel rooms.',
    exampleScope: 'Illustrative from ₹75 / kg',
  },
  plumbing: {
    id: 'plumbing',
    label: 'Plumbing Services',
    shortLabel: 'Plumbing',
    summary: 'Dripping taps, blocked washbasins, flush valves, and bathroom fittings.',
    exampleScope: 'Illustrative from ₹149 / visit',
  },
  electrical: {
    id: 'electrical',
    label: 'Electrical Repairs',
    shortLabel: 'Electrical',
    summary: 'Ceiling fans, switches, power sockets, tube lights, and MCB checks.',
    exampleScope: 'Illustrative from ₹129 / visit',
  },
  housekeeping: {
    id: 'housekeeping',
    label: 'Housekeeping & Cleaning',
    shortLabel: 'Housekeeping',
    summary: 'Room sweeping, disinfectant mopping, desk wipe-down, and bath cleaning.',
    exampleScope: 'Illustrative from ₹120 / visit',
  },
  printing: {
    id: 'printing',
    label: 'Printing & Photocopying',
    shortLabel: 'Printing',
    summary: 'A4 B&W or colour prints, lecture packets, photocopying, and spiral binding.',
    exampleScope: 'Illustrative from ₹2 / page',
  },
  tech_repairs: {
    id: 'tech_repairs',
    label: 'Laptop & Mobile Repairs',
    shortLabel: 'Tech Repairs',
    summary: 'Charging port cleaning, screen/battery checks, and OS troubleshooting.',
    exampleScope: 'Illustrative from ₹199 / check',
  },
  delivery: {
    id: 'delivery',
    label: 'Food & Grocery Delivery',
    shortLabel: 'Delivery',
    summary: 'Campus-gate tiffin pickup, drinking water, snacks, and daily essentials.',
    exampleScope: 'Illustrative from ₹30 / drop',
  },
  personal_care: {
    id: 'personal_care',
    label: 'Beauty & Personal Care',
    shortLabel: 'Personal Care',
    summary: 'Scheduled haircuts, beard trims, and basic personal grooming near campus.',
    exampleScope: 'Illustrative from ₹149 / visit',
  },
  repairs: {
    id: 'repairs',
    label: 'Electrical & Plumbing',
    shortLabel: 'Repairs',
    summary: 'Room fans, sockets, switches, taps, flush valves, and minor sink leaks.',
    exampleScope: 'Illustrative from ₹129 / visit',
  },
};

export const VALIDATION_LIMITS = {
  idMax: 128,
  idPattern: /^[a-zA-Z0-9_-]+$/,
  displayNameMax: 100,
  emailMax: 150,
  photoUrlMax: 500,
  hostelBuildingMax: 100,
  roomNumberMax: 50,
  phoneMax: 30,
  providerNameMax: 120,
  taglineMax: 180,
  areaServedMax: 120,
  serviceTitleMax: 120,
  serviceDescriptionMin: 10,
  serviceDescriptionMax: 600,
  priceBasisMax: 120,
  turnaroundMax: 80,
  buildingMin: 2,
  buildingMax: 120,
  roomMin: 1,
  roomMax: 100,
  instructionsMax: 600,
  printingDescriptionMax: 300,
  printingPageCountMax: 5000,
  statusNoteMax: 300,
  cancellationReasonMax: 300,
  reviewCommentMax: 500,
  scheduledDatePattern: /^\d{4}-\d{2}-\d{2}$/,
  referenceCodePattern: /^CF-\d{4}-[A-Z0-9]{4,8}$/,
} as const;

export const DGU_HOSTEL_SUGGESTIONS = [
  'DGU Boys Hostel — Block A',
  'DGU Boys Hostel — Block B',
  'DGU Girls Hostel — Block C',
  'DGU Girls Hostel — Block D',
  'Pondha Road Student PG',
  'Nanda Ki Chowki PG Cluster',
  'Prem Nagar Student Residence',
];

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  providerId: string;
  hostelBuilding: string;
  roomNumber: string;
  phone: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ProviderAccount {
  uid: string;
  providerId: string;
  providerName: string;
  email: string;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ProviderPublic {
  id: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  areaServed: string;
  availableWindows: string[];
  active: boolean;
  isDemoExample: boolean;
  ratingAvg: number;
  reviewCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ProviderPrivate {
  providerId: string;
  assignedUid: string;
  accountEmail: string;
  contactPhone: string;
  internalNotes: string;
  updatedAt: Timestamp | null;
}

export interface ServiceCatalogItem {
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
  active: boolean;
  isDemoExample: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface RichServiceItem extends ServiceCatalogItem {
  startingPriceLabel: string;
  areaServed: string;
  highlights: string[];
  source: 'firestore' | 'sample';
}

export interface BookingRequest {
  id: string;
  referenceCode: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  category: ServiceCategory;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  providerName: string;
  priceBasisSnapshot: string;
  estimatedMinInr: number;
  estimatedMaxInr: number;
  scheduledDate: string;
  timeWindow: string;
  building: string;
  roomOrPickupPoint: string;
  instructions: string;
  printingDescription: string;
  printingPageCount: number;
  printingColor: PrintingColorOption;
  status: BookingStatus;
  statusNote: string;
  cancellationReason: string;
  reviewSubmitted: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  acceptedAt: Timestamp | null;
  inProgressAt: Timestamp | null;
  completedAt: Timestamp | null;
  rejectedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
}

export interface LocalSampleBooking {
  id: string;
  referenceCode: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  category: ServiceCategory;
  serviceId: string;
  serviceTitle: string;
  priceBasisSnapshot: string;
  scheduledDate: string;
  timeWindow: string;
  building: string;
  roomOrPickupPoint: string;
  instructions: string;
  printingDescription: string;
  printingPageCount: number;
  printingColor: PrintingColorOption;
  status: 'Requested' | 'Cancelled';
  createdAtIso: string;
  isIllustrativeSample: true;
}

export interface ServiceReview {
  id: string;
  bookingId: string;
  studentUid: string;
  studentName: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | null;
}
