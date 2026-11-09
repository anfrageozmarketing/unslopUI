# Discovery: ask first, then decide what goes in

Before any screen, find out what the app or feature must do. Ask **one batch of at most seven questions** (skip what the code or the user already answered), then run `scripts/scope.mjs`.

## Questions

1. **Purpose in one sentence**: what does it do, for whom, instead of what?
2. **Kind**: internal tool, B2B product, consumer app, or marketing site?
3. **Features** (tick all): accounts, teams, payments, content (create/edit/organise), search, files, social, chat, notifications, data and charts, scheduling, AI, admin, onboarding. Anything else: name it.
4. **Devices**: desktop only, phone too, phone first?
5. **Feeling**: calm, bold, warm or cool; brand colour or existing logo; font preference.
6. **Language and form of address**: German Du or Sie, English; one language or several.
7. **The one action** a user must complete in the first minute.

If the app already exists: derive answers from the code first (`unslop-ui` inventory), then ask only about the gaps.

## Decide

1. Write `design/BRIEF.md` with the answers (5-10 lines).
2. Write `brief.json` (name, kind, audience, feeling, features, devices) and run
   `node scripts/scope.mjs brief.json --out design/SCOPE.md`.
   It lists the flows, screens and UI elements that fit, the design-system settings (density, type ratio, navigation, phone layout, command palette) and what is **not** needed.
3. Review `SCOPE.md` with the user in one pass: tick, strike with a reason, or add. Unticked items are not built.
4. Run the settings from `SCOPE.md`: `spec.mjs` (sizes), `palette.mjs` (colours), then flows, elements, screens as in `SKILL.md`.
5. For an existing app, compare `SCOPE.md` with what exists: every line without a screen or flow is a gap finding (`unslop-flows`, severity by risk).

## Rules

- Do not build what the brief does not need; a missing feature is a question, not a default.
- Always-needed items (empty, error, loading, success, confirmation, settings, help, dark mode, language) are in every scope.
- The scope is a proposal. The user decides; record decisions in the brain (`unslop-brain`).
