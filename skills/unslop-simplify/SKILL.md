---
name: unslop-simplify
description: Keeps UI simple. Reviews a screen, component or whole app for too many cards, containers, texts, badges, colours, sizes and controls, removes or merges what does not earn its place, and moves detail one click deeper. Use whenever a design feels busy, when cards or tiles carry summaries, strips and counts, or before reporting any build as done.
---

# unslop-simplify

Simple is not empty. Every element answers one question the person has at that moment; everything else goes away or one click deeper.

## The test (per element)

Ask for each visible element: *What decision or understanding does this give, right now, on this screen?* No answer: delete it. Same answer as another element: merge. Needed rarely: move it deeper (hover, dialog, workspace, settings).

## Limits per screen (guidelines, break them only with a reason)

| Thing | Limit |
|---|---|
| Primary actions | 1 |
| Type sizes | 4 |
| Colours with meaning (besides neutrals and the accent) | 3-4, each with one meaning |
| Icon styles | 1 |
| Items in a navigation level | 5-7 |
| Words visible without scrolling | about 120 in an app, fewer in a tool |
| Controls visible at once | about 15 |
| Nesting | no card inside a card, no box around a box, 2 container levels at most |
| Text on a tile or card | the name; a subtitle only if it changes the choice |

## Cards and tiles

- A card exists because the content is a self-contained object (a file, an app, a person). Lists of similar items are rows, not cards. Settings are a property list, not cards.
- Preview tile = picture + name. Counts, status strips, summaries and badges go into the object's own view.
- Do not put a number on something just because the number exists. A number is shown when it asks for an action.
- No decoration that carries no data: no glows, no extra frames, no repeated labels, no icon on every row.

## Text

- One short label per control, no helper text unless it prevents an error, no sentence where a word does it (`unslop-copy`).
- Say it once: a title, its subtitle and the first line of content must not repeat each other.

## Structure

- One job per screen. Two jobs: two screens or a dialog.
- Progressive disclosure: overview first, detail on click, edit in place (`unslop-foundation` edit patterns), advanced options behind one "More" control.
- Defaults over choices: pick a sensible default instead of asking. Ask only what changes the result.
- Fewer states of the same thing: one way to filter, one way to add, one way to delete (with Undo).

## Process

1. List the elements on the screen (components, texts, numbers, colours, sizes). Count them.
2. Apply the test; cross out, merge, move deeper.
3. Re-check against the limits. Say what you removed and why in one line each.
4. Verify with `unslop-verify` (the `too-busy` check flags nested cards, more than five type sizes, too many words and too many controls) and look at the screenshot: does one thing lead?

## Gate

- [ ] Every element passed the test.
- [ ] No card in a card; tiles show picture and name.
- [ ] At most 4 type sizes, 1 primary action, counts only where they ask for action.
- [ ] Detail lives one click deeper, not on the overview.
- [ ] `unslop-verify` shows no `too-busy` finding.
