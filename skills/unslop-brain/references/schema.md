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
| `score` | audit score 0-36 (number, optional) |
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
| `status` | `missing` · `partial` · `exists` · `built` · `na` |
| `prio` | `MVP` · `V1` · `V2` |
| `screens` | list of routes or screen names |
| `endpoints` | list of API paths |
| `evidence` | what proved `built` (test, gate, link); empty otherwise |
| `reason` | one line, required in spirit for `na`: why this app does not need the flow |
| `updated` | `YYYY-MM-DD` |

Body: one `mermaid` diagram if the flow branches, then `## Soll`, `## Lücken`, `## Hinweise`.

Status meaning: `na` the flow does not make sense for this app (for example roles in a one-user tool); it is excluded from coverage and must not be proposed again.  `missing` not in the code · `partial` exists but with gaps · `exists` complete as found · `built` created or completed during the unslop work and verified (needs `evidence`).

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
- The app may write only whitelisted fields, validated: flows `status`, `prio`, `screens`, `endpoints`, `evidence`; findings `state`, `severity`, `where`; decisions `state`, `answer`, `question`. It also creates flows (`Apps/<App>/Flows/<Area>/<Title>.md`), findings (`Findings/<Title>.md`) and decisions (`Entscheidungen/<Title>.md`), replaces the text below the frontmatter of flows, findings and decisions, and **archives** them to `Apps/<App>/_Archiv/` (never deletes; archived notes are ignored by the index).
- Every write sets `updated` to today. Lists cannot contain commas, quotes or brackets; text fields are single-line, up to 300 characters.
- Coverage = (`exists` + `built` + 0.5 x `partial`) / (all flows - `na`).
- The app writes `Apps/<App>/_Overview.md` after every change: one file with blockers, open decisions and all flows by area and status, meant for AI readers. It is generated, never edited by hand (type `overview`, ignored by the index).
