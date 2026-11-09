// Shared vocabulary of the vault: status, priority, severity, areas, state labels.
export const STATUS = [['missing', 'Fehlt'], ['partial', 'Teilweise'], ['exists', 'Vorhanden'], ['built', 'Gebaut'], ['na', 'Nicht nötig']];
export const STATUS_LABEL = Object.fromEntries(STATUS);
export const PRIOS = ['MVP', 'V1', 'V2'];
export const AREA_ORDER = ['Zugang', 'Onboarding', 'Kernablauf', 'Einstellungen', 'System'];
export const AREA_ICON = { Zugang: 'key', Onboarding: 'flag', Kernablauf: 'route', Einstellungen: 'sliders', System: 'server' };
export const SEVERITIES = ['Blocker', 'Gap', 'Rough', 'Polish'];
export const SEV_RANK = { Blocker: 0, Gap: 1, Rough: 2, Polish: 3 };
export const FSTATES = [['open', 'Offen'], ['fixed', 'Behoben'], ['wontfix', 'Wird nicht behoben']];
export const DSTATES = [['open', 'Offen'], ['decided', 'Entschieden']];
