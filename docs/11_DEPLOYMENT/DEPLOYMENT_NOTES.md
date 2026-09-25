# Deployment Notes (Planning)

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Implementation stage:** Stage 10  
**Stage 01 scope:** Principles and checklist only — do not deploy production yet.

---

## 1. MVP deployment principles

- Keep hosting simple (one Next.js app, one NestJS API, one PostgreSQL)
- Prefer managed PostgreSQL if available
- HTTPS everywhere in production
- Secrets via environment / secret manager — never Git
- Separate `development`, `staging` (recommended), `production` configs

Exact vendors remain `PLACEHOLDER` until chosen.

---

## 2. Runtime topology (target)

```
Browser → Next.js (storefront/admin UI)
       → NestJS API
            → PostgreSQL
            → File/object storage
            → Paystack
            → Email provider
```

Optional: reverse proxy / platform routing in front of both apps.

---

## 3. Required production secrets (checklist)

- Database URL
- Auth token/session secrets
- Paystack secret key + webhook secret
- Email provider credentials
- Storage credentials (if object storage)
- Any CSRF secrets if applicable

Public: site URL, Paystack public key (if required).

---

## 4. Launch checklist (Stage 10)

- [ ] Migrations applied
- [ ] Seed roles/permissions
- [ ] Admin bootstrap account secured
- [ ] Paystack webhook URL configured + verified
- [ ] Email sending verified
- [ ] Business placeholders replaced with real contact/payment instruction data
- [ ] Backup strategy confirmed
- [ ] Error monitoring basic setup
- [ ] Smoke test: browse → cart → checkout → pay (test mode) → receipt
- [ ] Smoke test: offline order → staff confirm → receipt
- [ ] Smoke test: delivery negotiation path
- [ ] RBAC spot-check
- [ ] Confirm no secrets in client bundle

---

## 5. What not to do early

- Do not build multi-region failover for MVP unless required
- Do not invent production domains/credentials in docs
- Do not skip webhook verification to “save time”
