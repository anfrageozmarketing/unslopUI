---
name: unslop-components
description: Makes app UIs creative and domain-specific instead of looking like a form, a thousand tables and rows of KPI cards. Gives a process to pick a signature component per screen from the shape of the data (route map, strip, lanes, matrix, timeline, graph, stream), bans the default table/card/dropdown look, and sets a gate. Use when an app screen is built from tables, uniform card grids, stat tiles and form fields, or when the user asks for more creative, less "admin template" components.
---

# unslop-components

AI-generated apps share one silhouette: a page title, a row of four KPI cards, a table, a form with dropdowns. It is correct and forgettable. Components should be shaped by **what the data is**, not by what the component library offers.

Build on the foundation first (`unslop-foundation`): palette tokens, icon style, illustration system, motion language and an approved component sheet. Components here use those tokens and parts; they do not invent colours or styles.

## The ban list (default look)

Do not ship a screen whose main content is any of these, unless the data truly is that:

- a row of KPI/stat cards (use one sentence, or show the number inside the thing it measures)
- a table with edit dropdowns in cells (tables are for comparing many attributes of many rows)
- a uniform grid of identical cards
- a form as the primary interface (forms are for entering data, not for looking at it)
- status as plain coloured text or pills with only a name (give status a shape, see below)
- pie charts for progress, gauges, donut rings as decoration

## Process (per screen)

1. **Name the data shape.** Sequence/journey, parts of a whole, comparison, relationship, change over time, ranking, location, hierarchy, or a stream of things needing attention.
2. **Pick the form that fits the shape** from `references/patterns.md`. Write one line: "This screen is a *route map* because the data is an ordered flow per area."
3. **Define one signature component** per screen: the thing a user would remember. It carries the richness; everything around it is quiet text and thin lines.
4. **Give status a visual language** with at least two channels (shape/fill and colour, not colour alone), used identically on every screen.
5. **Show, then edit.** The default view is read-first. Editing lives one step deeper (a details block, a drawer, a detail page), not in every row.
6. **Direct manipulation over controls.** Filters that are also the legend. Click the thing instead of a "View" button. Drag only if it replaces a dropdown with something faster.
7. **Vary density.** One big moment, a quiet middle, small supporting detail. Not five equal boxes.
8. **Check against the gate** below.

## Gate

- The screen's main element is not a table, a card grid, a stat row or a form.
- A one-line reason ties the chosen component to the shape of the data.
- Status uses shape/fill plus colour and is consistent across screens.
- Read-first: no screen has more than a handful of dropdowns or inputs visible without a click.
- The component still works at 360 px (wraps, stacks or scrolls on purpose) and is keyboard-reachable with visible focus.
- Reduced motion is respected; nothing animates just to decorate.
- **You have looked at it**: screenshots taken with the Playwright MCP (`claude mcp add playwright npx @playwright/mcp@latest`) at 360 px and 1280 px. If you could not look, say so; do not call a screen creative or finished from code alone.

## When tables are right

Many rows, many comparable columns, sorting matters (audit logs, price lists, exports). Then design the table: tabular numbers, aligned columns, quiet rules, row hover, no zebra stripes or boxed cells, and no controls in cells.

## Files

- `references/patterns.md` - data shape to component catalogue, status language, worked example (route map for product flows)
