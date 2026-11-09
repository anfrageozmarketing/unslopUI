# Screen recipes (classic screen to composition)

Per screen: **purpose**, **composition** (parts from the element map), **primary action**, **states**, **signature idea** options. Use the screen type from `unslop-structure/references/classic-screens.md`.

| Screen | Composition | Primary action | Must have | Signature idea |
|---|---|---|---|---|
| Signup / Login | one column, 2-3 fields, provider buttons below | Create account / Sign in | error per field, show password, forgot link | product picture beside the form |
| Forgot password | email field, sent confirmation with the address | Send link | resend with timer, wrong address | the confirmation as a letter graphic |
| Verification | code input per digit, auto-advance | Verify | resend, expired, paste | countdown ring |
| Onboarding / Setup / Tour | 3-5 steps, progress path, skip | Continue | skip, back, resume | progress as a path |
| Home | one focus object, then recent items | the most frequent action | empty first run, loading | layered background of real items |
| Dashboard | the one decision first, details below | the decision's action | skeletons, empty, error | inverted urgent tile |
| Browse and discover | search on top, tiles with previews | Open item | filters, empty result | tile grid with large previews |
| Detail (article, product, note, post) | title block, content, side facts | the item's main action | not found, loading | oversized key number |
| Settings | grouped property list, in-place edit | none (autosave) | undo, per-group reset | search over settings |
| Profile / Account | avatar, name, editable properties | Edit | delete account at the end | avatar as hero |
| Billing / Pricing / Paywall | real plans in a row, one recommended | Choose plan | current plan, cancel path | comparison by difference only |
| Cart / Checkout / Order | steps with summary, one total | Pay | errors, edit, summary stays | summary pinned |
| Success / Confirmation | what happened, what next | Next step | undo where possible | one illustration, no confetti spam |
| Empty state | picture, one sentence, one verb | the verb | - | illustration from the product's world |
| Error / Not found | what, data safe?, next step | Try again / Home | code in detail only | calm illustration |
| Loading | skeleton of the real layout | - | timeout to error | skeleton shimmer, reduced motion off |
| Permission | why needed, what happens without | Allow | decline path | preview of the benefit |
| Notifications | grouped by day, unread tone | Mark all read | empty, settings link | swipe actions |
| Chat / Comments | list, composer pinned | Send | sending, failed, retry | typing and read state |
| Calendar / Timeline | grid or lane view | Add event | today marker, empty day | lanes by area |
| Kanban / Multi-column | columns by status, drag | Add card | empty column, drop target | WIP limit visible |
| Command palette | search plus grouped actions | Run | recent, no result | keyboard hints |
| Canvas / Editor workspace | tools top, structure left, properties right, strip bottom | tool-specific | autosave, undo | see designer-standard "Editor workspace" |
| Charts / Progress | one chart per question, labels direct | none | empty, partial, error | annotated highlight |

Rules: every screen answers "what is it for and what is the one action". Every data screen has empty, loading and error. Text per `unslop-copy`.
