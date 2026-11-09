# Element map (classic element to HeroUI, shadcn, Tailwind)

Component names follow HeroUI v3 and common shadcn names; check the installed version's exports before use. "Own" means build it from tokens.

| Element | HeroUI | shadcn pattern | Notes |
|---|---|---|---|
| Accordion | Accordion | accordion | chevron label, one open by default only if useful |
| Breadcrumbs | Breadcrumbs | breadcrumb | collapse middle items on phones |
| Button | Button | button | verbs; one primary per screen; sizes from spec (lg/md/sm) |
| Checkbox / Radio / Switch | Checkbox, Radio, Switch | same | label is clickable; switch for instant settings |
| Color picker | Own over input | - | preview, hex, contrast badge |
| Combobox / Select | ComboBox, Select | combobox, select | type to filter above 7 options |
| Date / Time picker | DatePicker, TimeField | calendar + popover | show format hint, keyboard entry |
| Editable text | Own (Input in place) | - | click to edit, Enter saves, Esc cancels |
| File upload | Own (DropZone) | - | drag, paste, progress, error per file |
| Floating action button | Button (icon + label) | - | labelled, bottom right, one per screen |
| Link | Link | - | underline on hover, external marked |
| Pagination | Pagination | pagination | prefer infinite or "more" on lists under 200 |
| Rating | Own | - | read and edit modes |
| Search bar | SearchField | input + command | clear button, recent, empty result state |
| Segmented control | ToggleButtonGroup | toggle-group | 2-4 options, labelled |
| Slider / Stepper | Slider; Own stepper | slider | value shown, keyboard steps |
| Tab | Tabs | tabs | overflow scrolls horizontally on phones |
| Text field | TextField, Input, TextArea | input, textarea | visible label, error text below, no placeholder-only |
| Tile | Own over Card | card | tone background, large radius, inset preview, caption |
| Badge / Chip / Status dot | Chip, Badge | badge | status = shape plus colour plus text |
| Banner | Alert | alert | one per screen, dismiss stores state |
| Card | Card | card | no outline: tone and space |
| Carousel | Own | carousel | arrows plus dots, swipe, no autoplay by default |
| Divider | Separator | separator | avoid; use space |
| Gallery / Grid list | Own over ListBox/GridList | - | aspect ratios fixed, lazy load |
| Loading indicator / Progress | Spinner, ProgressBar | progress | label or number, min visible fill, role progressbar |
| Skeleton | Skeleton | skeleton | same shape as content, resolves to content or error |
| Side navigation / Top bar | Own shell | sidebar | labelled items, active tile |
| Stacked list / Table | ListBox, Table | table, data-table | table only for true tabular data |
| Table of contents / Tree | Own, Tree | - | keyboard arrows |
| Toolbar | Toolbar | toolbar | labels or tooltips |
| Coach marks | Own over Popover | - | max 3 steps, skippable |
| Context menu / Dropdown | Dropdown | dropdown-menu | destructive last, keyboard |
| Dialog / Drawer / Full-screen | Modal, Drawer | dialog, sheet | dialog for decisions, drawer for detail, full-screen for workspaces |
| Popover / Tooltip | Popover, Tooltip | popover, tooltip | tooltip never carries essential info |
| Toast | Toast | sonner | under 12 words, Undo instead of confirm |
| Avatar / Icon / Illustration / Logo / Photo | Avatar; Phosphor; own | avatar | one icon weight; alt text on photos |
| Command palette | Own over Modal + SearchField | command | Cmd/Ctrl+K |
