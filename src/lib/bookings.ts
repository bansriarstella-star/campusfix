import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import {
  VALIDATION_LIMITS,
  type BookingRequest,
  type BookingStatus,
  type PrintingColorOption,
  type ServiceCatalogItem,
} from '../types/campusfix';
import { handleFirestoreError, OperationType } from './firebase';

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTomorrowIsoDate(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isStrictlyFutureDate(dateStr: string): boolean {
  if (!VALIDATION_LIMITS.scheduledDatePattern.test(dateStr)) {
    return false;
  }
  return dateStr > getTodayIsoDate();
}

export function generateReferenceCode(): string {
  const year = new Date().getFullYear();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CF-${year}-${suffix}`;
}

export interface CreateBookingInput {
  studentUid: string;
  studentName: string;
  studentEmail: string;
  service: ServiceCatalogItem;
  scheduledDate: string;
  timeWindow: string;
  building: string;
  roomOrPickupPoint: string;
  instructions: string;
  printingDescription: string;
  printingPageCount: number;
  printingColor: PrintingColorOption;
}

export async function createBookingRequest(
  firestore: Firestore,
  input: CreateBookingInput,
): Promise<{ bookingId: string; referenceCode: string }> {
  const bookingRef = doc(collection(firestore, 'bookings'));
  const bookingId = bookingRef.id;
  const referenceCode = generateReferenceCode();

  const building = input.building.trim().slice(0, VALIDATION_LIMITS.buildingMax);
  const roomOrPickupPoint = input.roomOrPickupPoint.trim().slice(0, VALIDATION_LIMITS.roomMax);
  const instructions = input.instructions.trim().slice(0, VALIDATION_LIMITS.instructionsMax);
  const isPrinting = input.service.category === 'printing';

  const payload = {
    id: bookingId,
    referenceCode,
    studentUid: input.studentUid,
    studentName: (input.studentName || 'DGU Student').trim().slice(0, VALIDATION_LIMITS.displayNameMax),
    studentEmail: input.studentEmail.trim().slice(0, VALIDATION_LIMITS.emailMax),
    category: input.service.category,
    serviceId: input.service.id,
    serviceTitle: input.service.title.slice(0, VALIDATION_LIMITS.serviceTitleMax),
    providerId: input.service.providerId,
    providerName: input.service.providerName.slice(0, VALIDATION_LIMITS.providerNameMax),
    priceBasisSnapshot: input.service.priceBasis.slice(0, VALIDATION_LIMITS.priceBasisMax),
    estimatedMinInr: input.service.estimatedMinInr,
    estimatedMaxInr: input.service.estimatedMaxInr,
    scheduledDate: input.scheduledDate,
    timeWindow: input.timeWindow.trim().slice(0, 60),
    building,
    roomOrPickupPoint,
    instructions,
    printingDescription: isPrinting
      ? input.printingDescription.trim().slice(0, VALIDATION_LIMITS.printingDescriptionMax)
      : '',
    printingPageCount: isPrinting ? Math.max(1, Math.min(5000, Math.round(input.printingPageCount))) : 0,
    printingColor: isPrinting ? input.printingColor : 'none',
    status: 'Requested' as BookingStatus,
    statusNote: '',
    cancellationReason: '',
    reviewSubmitted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    acceptedAt: null,
    inProgressAt: null,
    completedAt: null,
    rejectedAt: null,
    cancelledAt: null,
  };

  try {
    await setDoc(bookingRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `bookings/${bookingId}`);
  }

  return { bookingId, referenceCode };
}

export async function cancelBookingByStudent(
  firestore: Firestore,
  bookingId: string,
  reason: string,
): Promise<void> {
  const bookingRef = doc(firestore, 'bookings', bookingId);
  const cleanReason = (reason.trim() || 'Cancelled by student before service start.').slice(
    0,
    VALIDATION_LIMITS.cancellationReasonMax,
  );
  try {
    await updateDoc(bookingRef, {
      status: 'Cancelled',
      cancellationReason: cleanReason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

export async function transitionBookingByProvider(
  firestore: Firestore,
  bookingId: string,
  nextStatus: 'Accepted' | 'Rejected' | 'In Progress' | 'Completed',
  statusNote: string,
): Promise<void> {
  const bookingRef = doc(firestore, 'bookings', bookingId);
  const cleanNote = statusNote.trim().slice(0, VALIDATION_LIMITS.statusNoteMax);

  const patch: Record<string, unknown> = {
    status: nextStatus,
    statusNote: cleanNote,
    updatedAt: serverTimestamp(),
  };

  if (nextStatus === 'Accepted') patch.acceptedAt = serverTimestamp();
  if (nextStatus === 'Rejected') patch.rejectedAt = serverTimestamp();
  if (nextStatus === 'In Progress') patch.inProgressAt = serverTimestamp();
  if (nextStatus === 'Completed') patch.completedAt = serverTimestamp();

  try {
    await updateDoc(bookingRef, patch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

export async function submitCompletedBookingReview(
  firestore: Firestore,
  booking: BookingRequest,
  rating: number,
  comment: string,
): Promise<void> {
  const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
  const cleanComment = comment.trim().slice(0, VALIDATION_LIMITS.reviewCommentMax);

  const batch = writeBatch(firestore);
  const reviewRef = doc(firestore, 'reviews', booking.id);
  const bookingRef = doc(firestore, 'bookings', booking.id);

  batch.set(reviewRef, {
    id: booking.id,
    bookingId: booking.id,
    studentUid: booking.studentUid,
    studentName: booking.studentName.slice(0, VALIDATION_LIMITS.displayNameMax),
    providerId: booking.providerId,
    serviceId: booking.serviceId,
    rating: clampedRating,
    comment: cleanComment,
    createdAt: serverTimestamp(),
  });

  batch.update(bookingRef, {
    reviewSubmitted: true,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reviews/${booking.id}`);
  }
}
