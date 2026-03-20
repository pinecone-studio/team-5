# EBMS App Checklist (TDD Requirements)

## FR-01 — Employee Benefits Dashboard

| # | Requirement | Status |
|---|------------|--------|
| 1 | Browse all benefits grouped by category (Wellness, Equipment, Career, Financial, Flexibility) | Done |
| 2 | Each benefit shows: name, description, subsidy %, vendor, eligibility criteria, contract link | Done |
| 3 | Four statuses displayed: ACTIVE, ELIGIBLE, LOCKED, PENDING | Done |
| 4 | Locked benefits show human-readable blocking reason | Done |
| 5 | Tap benefit for detailed eligibility breakdown (all rules + pass/fail) | Done |

## FR-02 — Benefit Request Flow

| # | Requirement | Status |
|---|------------|--------|
| 1 | Eligible employees submit request from dashboard | Done |
| 2 | Vendor-subsidized requests show contract PDF for digital acceptance | Missing |
| 3 | Contract acceptance logged with timestamp, employee ID, version hash | Partial |
| 4 | Multi-stage requests route to Finance Manager approval queue | Done |
| 5 | In-app notifications on request status changes | Done |
| 6 | Email notifications on request status changes | Missing |

## FR-03 — Eligibility Engine

| # | Requirement | Status |
|---|------------|--------|
| 1 | Rules-based engine with AND logic (all rules must pass) | Done |
| 2 | Rules configured per-benefit by HR without code deployment | Done |
| 3 | Re-evaluates on: login, OKR sync, attendance import, HR override, responsibility change | Partial |
| 4 | All decisions written to immutable audit log | Done |

## FR-04 — Performance-Gated Access Rules

| # | Requirement | Status |
|---|------------|--------|
| 1 | Probation Rule — Block: Gym, Insurance, Down Payment, Extra Resp, MacBook, Remote, Travel | Done |
| 2 | Probation Rule — Allow: Digital Wellness, Shit Happened Days (1 day max) | Done |
| 3 | OKR Gate — Lock non-core benefits if OKR not submitted | Done |
| 4 | OKR Sync — Webhook from OKR Dashboard | Missing |
| 5 | Attendance Gate — Teacher: late after 09:00, Non-teacher: late after 10:00, 3-strike/30-day | Done |
| 6 | Attendance Import — CSV/API ingestion | Missing |

## FR-05 — Benefit-to-Responsibility Mapping

| # | Requirement | Status |
|---|------------|--------|
| 1 | Benefits mapped to responsibility levels (1=Standard, 2=Senior, 3=Lead) | Done |
| 2 | Extra Responsibility gated at level >= 2 | Done |
| 3 | UX Engineer gated to role = ux_engineer | Done |
| 4 | Demotion auto-suspends higher-tier benefits | Partial |
| 5 | Declarative config — no code deployment needed | Done |

## FR-06 — Vendor Contract Management

| # | Requirement | Status |
|---|------------|--------|
| 1 | HR uploads/versions contract PDFs via admin panel | Missing |
| 2 | Employee sees contract before requesting subsidized benefit | Missing |
| 3 | Acceptance logged with timestamp, IP, contract version hash | Partial |
| 4 | HR alerted 60 days before contract expiry | Missing |
| 5 | Contracts stored in Cloudflare R2 with signed URLs (TTL 7 days) | Missing |
| 6 | Re-acceptance creates new record (never overwrites) | Done |

## FR-07 — HR Administration Panel

| # | Requirement | Status |
|---|------------|--------|
| 1 | View any employee's full eligibility snapshot | Done |
| 2 | Manual override with mandatory reason + audit log | Done |
| 3 | Temporary exceptions with configurable expiry | Done |
| 4 | Configure rules via UI (no-code) | Done |
| 5 | Rule changes require dual HR admin approval | Missing |
| 6 | Export audit logs (by employee, date, benefit, rule) | Missing |

## All 11 Benefits Seed Data

| # | Benefit | Rules Defined? |
|---|---------|---------------|
| 1 | Gym (PineFit) 50% | Needs config |
| 2 | Private Insurance 50% | Needs config |
| 3 | Digital Wellness 100% (Core) | Needs config |
| 4 | MacBook 50% | Needs config |
| 5 | Extra Responsibility | Needs config |
| 6 | UX Engineer Tools 100% | Needs config |
| 7 | Down Payment Assistance | Needs config |
| 8 | Shit Happened Days | Needs config |
| 9 | Remote Work | Needs config |
| 10 | Travel 50% | Needs config |
| 11 | Bonus Based on OKR | Needs config |

## Non-Functional / Infrastructure

| # | Requirement | Status |
|---|------------|--------|
| 1 | Cloudflare D1 database | Done |
| 2 | Cloudflare R2 for contracts | Missing |
| 3 | Cloudflare Workers backend | Done |
| 4 | Cloudflare Pages frontend | Done |
| 5 | GraphQL API (Hono + graphql-yoga) | Done |
| 6 | Clerk/Auth.js authentication | Done |
| 7 | KV Cache for eligibility | Missing |
| 8 | Email dispatch (MailChannels) | Missing |
| 9 | OKR sync Cron Trigger | Missing |
| 10 | Eligibility < 500ms | Not verified |
| 11 | PII masking in logs | Missing |

## Summary

| Category | Done | Partial | Missing |
|----------|------|---------|---------|
| FR-01 Dashboard | 5/5 | 0 | 0 |
| FR-02 Request Flow | 3/6 | 1 | 2 |
| FR-03 Eligibility Engine | 3/4 | 1 | 0 |
| FR-04 Performance Gates | 4/6 | 0 | 2 |
| FR-05 Responsibility Map | 4/5 | 1 | 0 |
| FR-06 Contracts | 1/6 | 1 | 4 |
| FR-07 Admin Panel | 4/6 | 0 | 2 |
| Infra | 5/11 | 0 | 6 |
| Benefits Seed Data | 0/11 | 0 | 11 |

## Top Priorities (Hackathon MVP)

1. Seed all 11 benefits with their eligibility rules
2. Contract PDF upload + viewer (R2 integration)
3. OKR sync webhook endpoint
4. Attendance CSV import
5. Email notifications
