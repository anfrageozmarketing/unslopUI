# Flow catalog

**Applicability first.** The catalog is a checklist to think with, not a quota. Judge each row against the app's scale and purpose before proposing it: roles, invites and team settings mean nothing for a one-user tool; billing means nothing for an internal app; sign-up means nothing for a closed team. Record a conscious "not needed" as `status: na` with a `reason`.

M = must, S = should, C = could. Columns: **Int** internal tool (one team), **B2B** SaaS with customers, **B2C** consumer app.

## Access

| Flow | Int | B2B | B2C | Notes |
|---|---|---|---|---|
| Login (email + password or magic link) | M | M | M | Generic error text, rate limit, lockout |
| Logout, session expiry with return URL | M | M | M | Re-auth modal must not lose input |
| Forgot / reset password | M | M | M | Same response whether the account exists or not |
| Invite accept | S | M | C | Single-use, expiring token |
| Social / SSO login | C | S | S | Central login if sibling apps exist |
| 2FA (TOTP) | C | S | S | Required for admins |
| Sign-up + email verification | C | M | M | |
| Roles and permissions enforced server-side | M | M | S | UI hiding is not security |

## Onboarding

| Flow | Int | B2B | B2C |
|---|---|---|---|
| Welcome with the loop in 3 lines | S | M | M |
| Collect what the product needs (sender, team, preferences) | S | M | S |
| Guided first success (sample data or sample run) | S | M | M |
| Checklist of next steps | C | S | S |
| Empty states that teach | M | M | M |
| Help / status explanations in place | S | M | M |

## Core loop

| Flow | Int | B2B | B2C |
|---|---|---|---|
| Start, progress (live), result | M | M | M |
| Cancel, retry, partial result handling | M | M | M |
| Deep link to each entity, share link | S | M | S |
| List with search, filter, sort, pagination | M | M | M |
| Bulk / batch input with preview and dedupe | S | S | C |
| Export (CSV, PDF) | S | M | S |
| Scheduled repeat, change comparison | C | S | C |
| Manual correction and notes | S | S | C |

## Outbound (mail, webhooks, publishing)

| Flow | Int | B2B | B2C |
|---|---|---|---|
| Draft → review → confirm → send | M | M | M |
| Test send to self | S | M | S |
| Templates and signature | S | M | C |
| History across all items, delivery status, bounces | S | M | S |
| Duplicate-recipient warning | S | M | C |
| Opt-out / suppression list | M | M | M |
| Rate limits and quotas | M | M | M |

## Settings

| Area | Int | B2B | B2C |
|---|---|---|---|
| Profile (name, email, password, sessions, language) | M | M | M |
| Team (members, roles, invites) | S | M | C |
| Sender / integrations | S | M | S |
| Defaults for the core loop (replaces env vars) | S | M | C |
| Notifications | S | M | M |
| API keys, webhooks | C | S | C |
| Billing, plan, usage | C | M | M |
| Appearance, accessibility | C | S | S |
| Data export, account deletion | S | M | M |

## System

| Flow | Int | B2B | B2C |
|---|---|---|---|
| 404 / 403 / 500 / offline pages | M | M | M |
| Admin: queue, providers, logs, audit | S | M | S |
| Audit log of sensitive actions | S | M | S |
| Backups and versioned migrations | M | M | M |
| Support contact and status page | S | M | M |
| Legal: imprint, privacy, terms, data processing | M | M | M |
| Changelog / what's new | C | S | S |
