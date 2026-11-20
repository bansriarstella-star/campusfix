import type { Timestamp } from 'firebase/firestore';

export type ServiceCategory = 'laundry' | 'repairs' | 'printing' | 'housekeeping';

export type BookingStatus =
  | 'Requested'
  | 'Accepted'
  | 'In Progress'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export type UserRole = 'student' | 'provider' | 'admin';

export type PrintingColorOption = 'none' | 'bw' | 'color';

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
    label: 'Laundry & Ironing',
    shortLabel: 'Laundry',
    summary: 'Hostel pickup and return for daily wear, bedsheets, and steam pressing.',
    exampleScope: 'Demo rates around ₹75–₹110 per kg',
  },
  repairs: {
    id: 'repairs',
    label: 'Electrical & Plumbing',
    shortLabel: 'Repairs',
    summary: 'Room fans, sockets, switches, taps, flush valves, and minor sink leaks.',
    exampleScope: 'Demo visit fee ₹150–₹180 + parts',
  },
  printing: {
    id: 'printing',
    label: 'Printing & Binding',
    shortLabel: 'Printing',
    summary: 'Lecture notes, assignments, B&W or colour prints, and spiral binding.',
    exampleScope: 'Demo rates from ₹2 / B&W page',
  },
  housekeeping: {
    id: 'housekeeping',
    label: 'Housekeeping',
    shortLabel: 'Housekeeping',
    summary: 'Hostel room sweeping, mopping, desk wipe-down, and washroom sanitizing.',
    exampleScope: 'Demo visits ₹120–₹220 per session',
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
