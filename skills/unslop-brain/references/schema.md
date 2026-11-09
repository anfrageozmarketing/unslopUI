# Vault schema

Plain markdown with YAML frontmatter. Only the simple subset is used: `key: value`, `key: [a, b]`, and `key:` followed by `- item` lines.

## Layout

```
vault/
  00 Command Center.md
  Apps/
    <App>/
      _App.md
      Flows/<Area>/<Flow>.md
      Findings/<Finding>.md
      Entscheidungen/<Decision>.md
      Screens/ · API/ · Daten/        (free notes, no type required)
  Templates/                           (Obsidian templates; type ends with -template and is ignored)
```

`<Area>` is free text but should be one of: `Zugang`, `Onboarding`, `Kernablauf`, `Einstellungen`, `System`. Add areas when the app needs them (for example `Abrechnung`).

## Note types

### app (`_App.md`)

| Field | Values |
|---|---|
| `type` | `app` |
| `name` | display name |
| `score` | audit score 0-32 (number, optional) |
| `stack` | free text |
| `url` | where it runs (optional) |
| `updated` | `YYYY-MM-DD` |

### flow

| Field | Values |
|---|---|
| `type` | `flow` |
| `app` | must equal the app's `name` |
| `area` | see above |
| `title` | optional, defaults to file name |
| `status` | `missing` · `partial` · `exists` · `built` |
| `prio` | `MVP` · `V1` · `V2` |
| `screens` | list of routes or screen names |
| `endpoints` | list of API paths |
| `evidence` | what proved `built` (test, gate, link); empty otherwise |
| `updated` | `YYYY-MM-DD` |

Body: one `mermaid` diagram if the flow branches, then `## Soll`, `## Lücken`, `## Hinweise`.

Status meaning: `missing` not in the code · `partial` exists but with gaps · `exists` complete as found · `built` created or completed during the unslop work and verified (needs `evidence`).

### finding

| Field | Values |
|---|---|
| `type` | `finding` |
| `app` | app name |
| `severity` | `Blocker` · `Gap` · `Rough` · `Polish` |
| `state` | `open` · `fixed` · `wontfix` |
| `where` | file, route or endpoint |

### decision

| Field | Values |
|---|---|
| `type` | `decision` |
| `app` | app name or `all` |
| `state` | `open` · `decided` |
| `question` | one sentence |
| `answer` | filled when decided |

## Command Center rules

- Notes without a recognized `type` are shown only in search and via links.
- The app may write only: `status`, `prio` (flows), `state` (findings, decisions), `severity` (findings), and only to the allowed values.
- Coverage = (`exists` + `built` + 0.5 x `partial`) / all flows.
