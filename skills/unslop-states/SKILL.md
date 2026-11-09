---
name: unslop-states
description: Gives every screen and action its missing states - empty, first-run, loading, in-progress, partial, error, offline, session expired, no permission, limit reached, success - with specific wording and a next action. Use when a UI only shows the happy path, shows raw backend errors, or dies silently.
---

# unslop-states

## State matrix

For each screen and each async action fill the row. A blank cell is a finding.

| State | Must show | Must offer |
|---|---|---|
| First run / empty | What this is for, one example | The primary action, sample data |
| Empty after filter | The filter that caused it | Clear filter |
| Loading | Skeleton in the final layout, no spinner-only pages | Cancel for long work |
| In progress | Which step, what is next, live count | Cancel |
| Partial | What worked, what did not | Retry the failed part, manual route |
| Error | What happened in plain words, whether data is safe | Retry, contact |
| Offline / connection lost | A small persistent notice | Auto-reconnect, keep input |
| Session expired | Notice without losing input | Sign in in place |
| No permission | Why, who can grant | Request access |
| Limit reached | Which limit, when it resets | Contact admin / upgrade |
| Success | What changed | Next step, undo where possible |

## Rules

- Map backend error codes to user text in one table; never print exception text. Unknown codes fall back to one safe sentence plus a reference id.
- Do not promise a support channel that does not exist; add the channel or change the sentence.
- Destructive actions say what is lost and for whom ("for all users" is a smell, ownership is missing).
- Optimistic updates must roll back visibly on failure.
- Motion respects `prefers-reduced-motion`.
- Pages for 404, 403, 500 and offline exist and keep the app shell.
- Test each state: write it down as a screenshot or a test case, not as a hope.

## Progress and loading bars

- Track at least 3:1 against its surround; fill clearly stronger than the track.
- Show a minimum visible fill for any value above 0, clamp to 0-100 %, never wider than the track.
- Always a label or number ("Abdeckung 42 %"); `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Unknown duration: an indeterminate bar with text of what is loading; it must end in a result or an error.
- Check by looking at the rendered pixels at 0 %, 1 %, 50 % and 100 %, in light and dark.
