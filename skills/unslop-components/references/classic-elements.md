# Classic UI elements (inventory by group)

Use to inventory what an app uses and to check each element has all states (see `unslop-states`) and one consistent style. Mark unused ones as not needed; do not add elements for completeness.

| Group | Elements |
|---|---|
| Control | Accordion · Breadcrumbs · Button · Checkbox · Color picker · Combobox · Date picker · Editable text · File upload · Floating action button · Link · Pagination · Radio button · Rating · Search bar · Segmented control · Select · Slider · Stepper · Switch · Tab · Text field · Tile · Time picker |
| View | Badge · Banner · Card · Carousel · Chip · Divider · Gallery · Grid list · Keyboard key · Loading indicator · Map pin · Progress indicator · Side navigation · Skeleton · Stacked list · Status dot · Table · Table of contents · Toolbar · Top navigation bar · Tree |
| Overlay | Coach marks · Context menu · Dialog · Drawer · Dropdown menu · Full-screen overlay · Navigation menu · Popover · Toast · Tooltip |
| Imagery | Avatar · Icon · Illustration · Logo · Photo |

Checks:
- Button, text field, tab, card, dialog, dropdown menu, toast, select, switch and search bar appear in nearly every app: they must be the best-built ones (hover, focus, disabled, loading, error, empty).
- One element per job: do not mix tabs and segmented control, or dialog and drawer, for the same kind of choice.
- Prefer our edit patterns (`unslop-foundation/references/designer-standard.md`) over a plain form: switch, segmented control, editable text, popover list.
