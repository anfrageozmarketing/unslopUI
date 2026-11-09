---
name: unslop-human
description: Makes an interface usable by people with different eyes, hands and setups - measured contrast, visible focus, keyboard operation, states (hover, press, disabled, empty, error), clear affordances (pointer cursor, native controls, names for icon-only buttons, real labels), reduced motion, 200 percent zoom and the phone keyboard. Use on every UI build or review, together with unslop-visual and unslop-layout.
---

# unslop-human

Looks are not enough: a screen is finished when people can read it, reach every control, see where they are and tell what a control does. Everything here is checkable.

## 1. Contrast (measure, never eyeball)

- Text 4.5:1 (large text, 18 px and up or 14 px bold, 3:1). Non-text parts (control edges, icons that carry meaning, focus rings, chart segments) 3:1 against their neighbours.
- Muted text is the usual failure. Check it on every surface it appears on (shell, window, raised, glass).
- Text over a picture or glass: measure the **worst spot** of the area the text covers, not the best one. Add a solid or scrim layer if it fails.
- Tool: `node skills/unslop-human/scripts/contrast.mjs "#fg" "#bg"` prints the ratio and the verdict. The palette generator already checks its own pairs (`unslop-foundation`).
- Do not claim a pair passes without a number.

## 2. Keyboard and focus

- Every control is reachable and operable with the keyboard; tab order follows the visual order; dialogs close with Esc; popovers and lists support arrows and Enter.
- A visible focus indicator on every interactive element, 3:1, in light and dark. Never `outline: none` without a replacement.
- No hover-only menus; no drag without a keyboard alternative.

## 3. States

Each control shows default, hover, pressed, focus, selected and disabled. Each data view has loading, empty and error states.

- **Empty**: says why it is empty and offers the one action that fills it.
- **Loading**: says what is loading (a skeleton in the final layout, or text), not a bare spinner.
- **Error**: says what failed, whether data is safe, what to do next.
- Never signal state by colour alone: pair it with a shape, icon or text.

## 4. Affordances

- Enabled interactive elements show `cursor: pointer` (set once in the base layer, a CSS reset removes it); disabled ones `not-allowed`.
- An action is a `button`, a navigation is a link to a real destination. No clickable `div`.
- An icon-only control has an accessible name that matches what it does (`aria-label`) and a tooltip; the icon is decorative (`aria-hidden`).
- Navigation items carry a visible text label (see `unslop-layout`).
- A field has a visible label; a placeholder is not a label.
- Things that can be changed look changeable (hover tone, caret, edit affordance on hover and focus).

## 3b. Feedback

Every change shows that it worked (a state change plus a short toast) and offers Undo for anything destructive instead of a confirm dialog.

## 5. Motion, zoom, phone

- Wrap non-essential motion in `prefers-reduced-motion: no-preference`; no loops on idle content; auto-moving things have a pause.
- Text stays readable at 200 percent zoom: no clipped containers, no fixed-px type.
- On a phone the on-screen keyboard never covers the focused field: scroll it into view with bottom padding.

## 6. Checks (all must be yes)

- [ ] Every text pair has a measured ratio at or above 4.5 (3 for large); non-text parts 3.
- [ ] Focus is visible on every control in both themes; nothing needs a mouse.
- [ ] Every control shows pointer cursor, hover, pressed and disabled states.
- [ ] Icon-only controls have names and tooltips; navigation shows labels.
- [ ] Empty, loading and error states say cause and next step.
- [ ] No colour-only signals; reduced motion is respected; 200 percent zoom holds.
