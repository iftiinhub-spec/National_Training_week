# National Training Week — End-to-End Workflow Report

**Test date:** 9 August 2026  
**Environment:** Local frontend `localhost:5173`, backend `localhost:5000`, MongoDB development database, headless Google Chrome.

## Database preparation

The database was first cleaned so only the administrator account remained. Events, event days, categories, trainers, moderators, participants, trainings, registrations, attendance, meetings, feedback, certificates, recordings, and related operational data were removed.

The browser workflow then created one complete set of test records. Those records remain in the development database so they can be inspected in the UI.

## Workflow results

| Stage | Result |
|---|---|
| Administrator sign-in | Passed |
| Create event edition and event day | Passed |
| Create category and trainer profile | Passed |
| Create moderator account | Passed |
| Create and publish training session | Passed |
| Participant account registration | Passed |
| Participant training registration enters Pending | Passed |
| Administrator approves registration | Passed |
| Moderator views assigned session | Passed |
| Moderator creates and releases meeting details | Passed |
| Moderator launches live QR attendance | Passed |
| Participant confirms QR check-in | Passed |
| Participant attendance record is visible | Passed |
| Administrator reports and export control render | Passed |
| Frontend production build | Passed |

## Problems found

### High priority

1. **The global API rate limiter is too aggressive.** Repeated normal role changes and page requests caused HTTP `429` responses for `/api/auth/login` and `/api/public/current-event`. This can prevent legitimate users from signing in or loading public event data. Authentication and public read endpoints should use separate, appropriately sized limits; authenticated requests should not share one anonymous/IP budget.

### Medium priority

2. **Missing meeting is represented as HTTP 404 during normal moderator page loading.** Before a meeting is created, the session page requests the meeting endpoint and receives 404. The UI catches it, but browser monitoring reports a failed request. Consider returning `200` with `meeting: null` for this expected empty state.

3. **MongoDB reports duplicate index definitions** for `certificateId` and `sessionToken` during maintenance scripts. Define each index in only one place (field option or `schema.index`) to avoid warnings and future migration confusion.

4. **The production JavaScript bundle is large.** Vite reports approximately `981 kB` before gzip (`263 kB` gzip). Route-level lazy loading would reduce the initial public-page download.

### Workflow coverage still required

5. Certificate generation was not completed in this run because eligibility correctly requires a training with `completed` status plus approved and present attendance. The test event is future-dated. A dedicated completed-event fixture should cover certificate generation, PDF download, and public verification.

6. Real email delivery was not asserted. Registration/approval email triggers should be verified with a test SMTP inbox so delivery, content, and failure handling are all covered.

## Test records left for review

- Event: **National Training Week 2027**
- Event day: **Digital Skills Day**
- Training: **E2E Digital Skills Foundations**
- Trainer: **E2E Expert Trainer**
- Moderator and participant: generated `*.e2e.*@example.com` accounts
- Registration: approved
- Attendance: present through QR check-in

## Evidence

Screenshots and machine-readable results are stored in `frontend/test-results/full-workflow/`.

