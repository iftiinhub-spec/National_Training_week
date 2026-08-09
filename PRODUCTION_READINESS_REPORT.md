# National Training Week Production Readiness Check

**Checked:** 9 August 2026

## Passed

- Real SMTP delivery to the designated participant test address.
- Administrator, moderator, and participant authentication.
- Anonymous users cannot access administrator settings.
- Participant and moderator accounts cannot access administrator settings.
- Participants cannot access moderator operations.
- Administrator accounts cannot use participant-only endpoints.
- SMTP App Password is encrypted at rest and never returned by an API.
- Public settings expose no private email delivery fields.
- Certificate generation, PDF download, public verification, and accessible revocation dialog.
- Public mobile, tablet, and desktop layouts have no horizontal overflow.
- Participant mobile navigation renders five usable bottom tabs.
- Production frontend build and backend syntax validation.

## Implemented during this pass

- Added an administrator **Send test email** control and protected API endpoint.
- Added repeatable readiness testing via `npm run test:e2e:readiness`.
- Replaced runtime `hu_ntw_*` browser-storage keys with `ntw_*` keys.
- Removed remaining runtime/package HU and Hormuud branding references.
- Restricted production CORS to the configured frontend origin.
- Increased new and reset password minimum length to eight characters.

## Non-blocking findings

- Frontend lint completes without errors but reports existing unused-code and React hook dependency warnings. These should be cleaned incrementally.
- Gmail confirms SMTP acceptance, but inbox placement (Inbox versus Spam) must be confirmed by the recipient.
- Production deployment still requires a real HTTPS domain, production database, backups, and durable upload storage.
