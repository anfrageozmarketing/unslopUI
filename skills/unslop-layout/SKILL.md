---
name: unslop-layout
description: Sizes, spaces and reflow for apps and sites - a spacing and type scale with a rhythm instead of one value everywhere, real states across the whole width range (phone, tablet band, desktop), tap targets, overflow rules, navigation that is understandable (icons with labels), collapsible side panels and full-screen workspaces. Use when a layout feels cramped, uniform, oversized on phones, or when an app shell, sidebar or editing mode is designed.
---

# unslop-layout

A layout is correct when it holds at every width and when a person can tell where they are. It is decided by numbers (a scale), by hierarchy (rhythm) and by reflow (a different layout on a phone, not a squeezed one).

## 1. Scales, not ad-hoc values

- **Space** from one scale: 4, 8, 12, 16, 24, 32, 48, 72. Components use only these (tokens).
- **Type**: 12, 13, 14, 16, 20, 24, 32, 44. Body 14-16, line height 1.4-1.6; headings tighter. 55-75 characters per line.
- **Radius**: 6 / 12 / 20 / 28 and pill. Nested surfaces use a smaller radius than their parent.
- **Targets**: 44 px minimum on touch, rows 48-56 px, icon buttons 40-48 px.

## 2. Rhythm: vary on purpose

Uniform spacing erases hierarchy. Use the scale in steps: 8-12 inside a group, 24-32 between groups, 48-72 between sections. A heading sits closer to the content it introduces than to the previous block. One value for everything reads as a template.

## 3. Reflow: at least three states

1. **Phone** (below about 600 px): one column, smaller type step, section padding about half of desktop, bottom navigation, window edge to edge with rounded top corners.
2. **Tablet band** (about 600 to 1024 px): two columns where cards get too wide as a stack, collapsible side panel. Never a stretched phone stack or a crammed desktop grid.
3. **Desktop**: full shell, multi-column only where the content has that many things side by side.

Place breakpoints where the content breaks, not at device widths. Check by dragging the viewport through the whole range.

## 4. Overflow and sizing rules

- Nothing is wider than the viewport: measure `document.documentElement.scrollWidth` against the viewport at 360 px (a number, not a feeling).
- `min-width: 0` on flex and grid children; fluid tracks (`minmax`, `auto-fit`), no fixed-px grids.
- Rows of controls (filters, chips) scroll sideways inside their own row or wrap; they never push the page wider.
- Tables become cards or lists on a phone.
- Use `dvh`, not `100vh`, for full-height areas. Fixed bars reserve their height (padding plus safe-area insets) so nothing is hidden behind them.
- Do not clip with `overflow: hidden` to hide a layout that does not fit; reflow instead.

## 5. Tap targets and hover

44 x 44 px targets with a gap of at least 8 px between neighbours. Everything that works on hover also works on tap, with visible pressed feedback. Row actions that appear on hover are always visible on touch.

## 6. Navigation a person understands

- **Icons carry a label.** An icon-only rail forces people to guess what a workspace is. Show icon plus a short text label (under the icon or beside it). Icon-only is allowed only for universally known utilities (search, refresh) and then with a tooltip and an accessible name.
- **The current place is named**: the window title says which area and which object.
- **Phone**: bottom bar with 3-5 labelled destinations, never a bare hamburger as the only way around.
- Fixed navigation stays compact so content remains dominant.

## 7. App shell, side panels and full-screen workspaces

- Side panels (context column, properties panel) are **collapsible**; the state persists. A visible toggle sits in the window header, not only a keyboard shortcut.
- **Workspace mode** is full screen: the shell (rail and context column) is hidden, a slim top bar offers Back (Esc), the title, the primary tools and a toggle for the properties panel. The editing surface gets every pixel.
- Entering and leaving a workspace never loses the user's place or unsaved state (autosave plus undo).
- On a phone a workspace is full screen as well, with the tool strip at the bottom.

## 8. Checks (all must be yes)

- [ ] Every space, size and radius comes from the scales.
- [ ] Spacing varies between levels; the page has a rhythm.
- [ ] Three or more states exist; the tablet band was looked at.
- [ ] `scrollWidth` equals the viewport at 360 px on every screen.
- [ ] Targets are at least 44 px with gaps; hover-only actions have a touch equivalent.
- [ ] Navigation items show a label; the window says where the person is.
- [ ] Side panels collapse; workspaces open full screen with a clear way out.
