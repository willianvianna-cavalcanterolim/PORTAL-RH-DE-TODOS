# Security Specification & Payload-First TDD — Cavalcante & Rolim Portal

## 1. Data Invariants
1. **Identity Integrity**: No user may create or mutate a record claiming another user's `uid` or `authorUid`.
2. **Privilege Escalation Prevention**: Regular collaborators cannot create or modify `/admins/{uid}`, `/announcements`, `/trainings`, `/documents`, `/birthdays`, or `/portal_settings`.
3. **PII Isolation**: Email addresses, phone numbers, FCM tokens, and encrypted personal vaults are stored exclusively in `/users_private/{uid}` and readable only by the owner or verified Admin.
4. **Immutable Audit Trail**: `/audit_logs/{logId}` entries cannot be updated or deleted by any client, including admins, preserving forensic integrity.
5. **Temporal Integrity**: `createdAt` and `updatedAt` fields must match `request.time`.
6. **Point Farming Prevention**: `/activities/{activityId}` uses deterministic IDs (`${uid}_${targetType}_${targetId}`) and cannot be updated or deleted once created; points updates on `/collaborators/{uid}` are strictly bounded.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Admin Registration**: Non-admin attempts `SET /admins/attackerUid` -> `PERMISSION_DENIED`.
2. **Email Spoof Bypass**: User with `email: willian.vianna@cavalcanterolim.com.br` and `email_verified: false` attempts admin write -> `PERMISSION_DENIED`.
3. **PII Harvesting**: Collaborator A calls `GET /users_private/collaboratorB` -> `PERMISSION_DENIED`.
4. **Mass PII Listing**: Collaborator A calls `LIST /users_private` -> `PERMISSION_DENIED`.
5. **Audit Log Tampering**: User or Admin attempts `UPDATE /audit_logs/log1` or `DELETE /audit_logs/log1` -> `PERMISSION_DENIED`.
6. **Ghost Field Injection**: User submits `points: 999999` + `shadowAdmin: true` on `/collaborators/{uid}` -> `PERMISSION_DENIED` (`hasOnly` check).
7. **ID Poisoning**: Attacker writes to `/announcements/<1500-char-id>` -> `PERMISSION_DENIED` (`isValidId` check).
8. **Payload Exhaustion (Denial of Wallet)**: Attacker writes 500KB string into `title` -> `PERMISSION_DENIED` (`size()` bounds).
9. **Draft Scraping**: Regular collaborator queries `LIST /announcements` without `status == 'published'` -> `PERMISSION_DENIED`.
10. **Forged Activity Attribution**: User A creates `/activities/act1` with `userId: 'userB'` -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: Client sends backdated `createdAt` instead of `serverTimestamp()` -> `PERMISSION_DENIED`.
12. **Impersonated Document Publishing**: Non-admin attempts `CREATE /documents/doc1` -> `PERMISSION_DENIED`.
