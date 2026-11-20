# CampusFix Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Role Integrity**: Every newly created `users/{uid}` profile MUST have `role == 'student'` and `providerId == ''` (unless created by a bootstrapped admin). Users CANNOT modify their own `role`, `providerId`, `uid`, `email`, or `createdAt`.
2. **Booking Ownership & Catalog Integrity**: A booking MUST belong to `request.auth.uid`, start in `status == 'Requested'` with `reviewSubmitted == false`, reference an existing active `serviceId` and active `providerId`, and copy exact immutable `priceBasisSnapshot`, `estimatedMinInr`, and `estimatedMaxInr` values from the authoritative `services/{serviceId}` document.
3. **Strict State Transitions & Terminal Locking**:
   - Students may ONLY cancel (`Requested -> Cancelled` or `Accepted -> Cancelled`). Cancellation from `In Progress`, `Completed`, `Rejected`, or `Cancelled` MUST be rejected.
   - Only the assigned active provider (`providerAccounts/{request.auth.uid}`) may advance `Requested -> Accepted`, `Requested -> Rejected`, `Accepted -> In Progress`, or `In Progress -> Completed`.
   - Terminal statuses (`Completed`, `Rejected`, `Cancelled`) cannot be transitioned further by students or providers.
4. **One Review Per Completed Booking**: Reviews use `reviewId == bookingId`. Creation succeeds ONLY if the booking exists, belongs to `request.auth.uid`, has `status == 'Completed'`, has no existing review (`!exists(/reviews/{bookingId})`), and atomically updates `bookings/{bookingId}.reviewSubmitted = true` in the same batch (`getAfter`).
5. **PII & Private Provider Contact Isolation**: `users/{uid}` and `bookings/{bookingId}` cannot be read or listed by other students. `providerPrivate/{providerId}` cannot be read by students or unauthenticated visitors.
6. **Public Catalog Scoping**: Unauthenticated and student reads on `providers` and `services` are restricted strictly to `active == true`.

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Self-Promotion on Signup**: `create /users/student2` with `{ role: "admin", ... }`.
2. **Role Escalation on Profile Update**: `update /users/student2` changing `{ role: "provider", providerId: "prov_laundry_dgu" }`.
3. **Ghost Field Injection**: `create /bookings/b1` with extra undocumented field `{ isFreeBypass: true }`.
4. **Booking Ownership Spoofing**: `create /bookings/b2` by `student2` with `{ studentUid: "student1" }`.
5. **Price Snapshot Tampering**: `create /bookings/b3` with `{ estimatedMinInr: 1, priceBasisSnapshot: "₹1" }` differing from `services/{serviceId}`.
6. **Cross-Student Read**: `get /bookings/student1BookingId` signed in as `student2`.
7. **Cross-Student List Scrape**: `list /bookings` signed in as `student2` without `where("studentUid", "==", "student2")`.
8. **Illegal Late Cancellation**: `update /bookings/b_in_progress` by owning student setting `{ status: "Cancelled" }` when `status == "In Progress"`.
9. **Student Self-Completion**: `update /bookings/b_requested` by owning student setting `{ status: "Completed" }`.
10. **Unauthorized Provider Action**: `update /bookings/b_requested` by `student2` or wrong provider setting `{ status: "Accepted" }`.
11. **Unverified / Premature Review**: `create /reviews/b_requested` when `bookings/b_requested.status == "Requested"`.
12. **Duplicate / Non-Atomic Review**: `create /reviews/b_completed` without updating `bookings/b_completed.reviewSubmitted = true` in the same batch, or creating a second review for the same `bookingId`.
