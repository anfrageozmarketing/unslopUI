# Gate (all true before done)

- [ ] `tokens.css` and `spec.css` exist and are the only source of colour and size; grep finds no hex or arbitrary px in components.
- [ ] Type: at most 4 sizes per screen; line heights on the grid.
- [ ] Controls use the spec heights; tap targets at least 44 px; gaps between targets.
- [ ] Every element used appears on the component sheet with default, hover, focus, active, disabled, loading, empty and error where relevant.
- [ ] Every screen has one primary action and one signature idea (or a reason for none), and all its states.
- [ ] Contrast measured (`unslop-human`): text 4.5:1, non-text 3:1, progress tracks and boundaries included.
- [ ] No borders as separators; no glow, gradient text, emoji labels; icons one weight and labelled.
- [ ] 360 px: no horizontal scroll; reflow states across the width range.
- [ ] Rendered screenshots reviewed (light and dark): no clipped text, broken bars, overlaps (`docs/ui-review.md` section 3b).
- [ ] Copy checked (`unslop-copy`): nothing invented, errors say cause and next step.
- [ ] Say what was not checked.
- [ ] `references/pitfalls.md` ticked: round badges, inset active tile with edge bar, edge collapse handle, docked panels, aligned bars, tonal focus, create at top, persisted state.
- [ ] `unslop-verify` run with `scenarios.default.json` plus one scenario per promised function; clean.
- [ ] No full page reload after any action (scenario with `mark` and `kept`); changes are optimistic with rollback and Undo.
- [ ] No bare "Loading" text anywhere: boot screen, skeletons and progress exist for every wait (`plain-loading-text` is clean).
- [ ] Text is editable by clicking it, without a pencil or Edit button.
- [ ] Spacing per `references/spacing.md`: nothing within 16 px (phone 12 px) of its window or card edge, full-bleed only marked `data-edge`; `unslop-verify` has no `edge-touch`.
- [ ] `unslop-simplify` gate passed: no card in a card, tiles show picture and name, detail one click deeper, no `too-busy` finding.
