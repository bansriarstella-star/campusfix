/**
 * Phase 0 Security Test Specification for CampusFix Firestore Rules
 * Verifies the "Dirty Dozen" adversarial payloads against Firestore emulator rules.
 * Run with Firebase Emulator Suite when testing rules locally:
 *   firebase emulators:exec --only firestore "npx tsx firestore.rules.test.ts"
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  actor: 'student1' | 'student2' | 'provider1' | 'unauthenticated';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  expected: 'PERMISSION_DENIED';
  description: string;
}

export const dirtyDozenCases: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Self-Promotion on Signup',
    actor: 'student2',
    operation: 'create',
    path: 'users/student2',
    expected: 'PERMISSION_DENIED',
    description: 'Attempting to create user profile with role: "admin" instead of "student".',
  },
  {
    id: 2,
    name: 'Role Escalation on Profile Update',
    actor: 'student2',
    operation: 'update',
    path: 'users/student2',
    expected: 'PERMISSION_DENIED',
    description: 'Attempting to mutate role or providerId on an existing student profile.',
  },
  {
    id: 3,
    name: 'Ghost Field Injection',
    actor: 'student1',
    operation: 'create',
    path: 'bookings/b_ghost',
    expected: 'PERMISSION_DENIED',
    description: 'Adding an undocumented field (e.g. isFreeBypass: true) to a booking create payload.',
  },
  {
    id: 4,
    name: 'Booking Ownership Spoofing',
    actor: 'student2',
    operation: 'create',
    path: 'bookings/b_spoof',
    expected: 'PERMISSION_DENIED',
    description: 'Student 2 creating a booking with studentUid set to student1.',
  },
  {
    id: 5,
    name: 'Price Snapshot Tampering',
    actor: 'student1',
    operation: 'create',
    path: 'bookings/b_tamper',
    expected: 'PERMISSION_DENIED',
    description: 'Submitting estimatedMinInr or priceBasisSnapshot that differs from services/{serviceId}.',
  },
  {
    id: 6,
    name: 'Cross-Student Read',
    actor: 'student2',
    operation: 'get',
    path: 'bookings/b_student1',
    expected: 'PERMISSION_DENIED',
    description: 'Student 2 reading a booking belonging to Student 1.',
  },
  {
    id: 7,
    name: 'Cross-Student List Scrape',
    actor: 'student2',
    operation: 'list',
    path: 'bookings',
    expected: 'PERMISSION_DENIED',
    description: 'Student 2 listing bookings without filtering to studentUid == student2.',
  },
  {
    id: 8,
    name: 'Illegal Late Cancellation',
    actor: 'student1',
    operation: 'update',
    path: 'bookings/b_in_progress',
    expected: 'PERMISSION_DENIED',
    description: 'Owning student attempting to cancel a booking that is already In Progress.',
  },
  {
    id: 9,
    name: 'Student Self-Completion',
    actor: 'student1',
    operation: 'update',
    path: 'bookings/b_requested',
    expected: 'PERMISSION_DENIED',
    description: 'Owning student attempting to transition status to Accepted or Completed.',
  },
  {
    id: 10,
    name: 'Unauthorized Provider Action',
    actor: 'student2',
    operation: 'update',
    path: 'bookings/b_requested',
    expected: 'PERMISSION_DENIED',
    description: 'Non-provider or wrong provider attempting to accept/progress a booking.',
  },
  {
    id: 11,
    name: 'Premature Review Submission',
    actor: 'student1',
    operation: 'create',
    path: 'reviews/b_requested',
    expected: 'PERMISSION_DENIED',
    description: 'Creating a review for a booking whose status is not Completed.',
  },
  {
    id: 12,
    name: 'Duplicate or Non-Atomic Review',
    actor: 'student1',
    operation: 'create',
    path: 'reviews/b_completed',
    expected: 'PERMISSION_DENIED',
    description: 'Creating a second review for a completed booking or omitting atomic reviewSubmitted update.',
  },
];
