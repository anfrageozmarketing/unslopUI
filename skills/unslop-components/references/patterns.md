# Patterns: from data shape to component

| Data shape | Instead of | Use | Notes |
|---|---|---|---|
| Ordered flow per area (steps, journeys, pipelines) | table of steps | **Route map**: one lane per area, one node per step, node marker = status, node size = priority | Wrap lanes on narrow screens; line behind nodes shows order |
| Whole at a glance (coverage, health of many parts) | donut + stat cards | **Strip**: one thin tick per part, grouped, coloured by status | Works at 4 px in a sidebar and at 30 px on a home screen |
| Things needing attention | alert list with icons | **Stream**: plain statements, one per line, strongest first, left bar for severity | Questions set as headlines, context as quiet text |
| Parts of a whole over several dimensions | grouped table | **Matrix / heat grid** with labelled axes | Only when both axes mean something |
| Relationships (depends on, feeds, owns) | foreign-key columns | **Graph or adjacency strip**; start simple with indented lists plus links | Do not draw a hairball |
| Change over time | line chart by default | **Timeline** with events, or small multiples | Annotate causes, not just values |
| Ranking | bar chart in a card | **Sorted list with inline bars** (the bar is the row background) | |
| Hierarchy | nested table | **Outline / tree** with counts at branches | |
| Document-like content | card per paragraph | **Reading layout**, 60-75 characters, real headings | |
| Choices with consequences | dropdown | **Segmented choice** showing the effect next to each option | |

## Status language (one for the whole product)

Use at least two channels. Example set:

| Meaning | Fill/shape | Colour role |
|---|---|---|
| Missing | dashed empty ring | danger |
| Partial | half-filled ring | warning |
| Exists | filled disc | positive, softer |
| Built and verified | filled disc with check | positive, strong |
| Not needed | dotted ring, label struck through | neutral |

Priority is size and weight, not another colour.

## Worked example: product flows

Problem: 24 flows in 5 areas, shown as a table with dropdowns.
Shape: ordered steps grouped by area, each with a status and a priority.
Component: **route map** (lane per area, node per flow). A **strip** above summarises the app; the status legend doubles as the filter; one sentence replaces the KPI cards ("24 flows, 10 % covered, 3 open blockers"). A node opens a read-first page; editing sits behind a "Bearbeiten" disclosure.

## Anti-patterns that look creative but are not

- Gradients and glow on cards (decoration, not structure)
- Charts with no question behind them
- Animated counters
- Emoji or icon on every row
- Novel navigation that hides the primary action
