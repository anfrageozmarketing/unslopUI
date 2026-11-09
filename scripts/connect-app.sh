#!/usr/bin/env bash
# Connects an app to the private brain: writes (or refreshes) a marked block in <app-dir>/CLAUDE.md
# so that every AI session in that project knows the vault exists, how to read it and what to update.
# Usage: scripts/connect-app.sh <app-dir> <app-name> [--vault DIR] [--url URL]
set -euo pipefail
app_dir="${1:?usage: connect-app.sh <app-dir> <app-name> [--vault DIR] [--url URL]}"
app_name="${2:?app name missing}"
shift 2
vault="/docker/app-brain/vault"; url=""
while [ $# -gt 0 ]; do
  case "$1" in
    --vault) vault="${2:?}"; shift 2;;
    --url) url="${2:?}"; shift 2;;
    *) echo "unknown option: $1" >&2; exit 1;;
  esac
done
[ -d "$app_dir" ] || { echo "not a directory: $app_dir" >&2; exit 1; }
[ -d "$vault/Apps/$app_name" ] || { echo "vault has no Apps/$app_name yet - create _App.md first (unslop-brain)" >&2; exit 1; }
f="$app_dir/CLAUDE.md"
start='<!-- unslop-brain:start -->'; end='<!-- unslop-brain:end -->'
block=$(cat <<MSG
$start
## Brain: Flows, Befunde, Entscheidungen

Zu dieser App gibt es ein privates Wissens-Vault (Markdown, Obsidian-kompatibel).

- App im Vault: \`$app_name\`
- Ordner: \`$vault/Apps/$app_name/\` (\`_App.md\`, \`Flows/\`, \`Findings/\`, \`Entscheidungen/\`)
- Schema der Notizen: \`$vault/Schema.md\`${url:+
- Übersicht im Browser (Passwort-geschützt): $url}

**Vor der Arbeit:** \`_App.md\`, die betroffenen Flow-Notizen, offene Befunde und offene Entscheidungen lesen. Offene Entscheidungen nicht stillschweigend selbst treffen, sondern nachfragen.

**Nach der Arbeit:** Im Frontmatter der betroffenen Flows \`status\` und \`updated\` pflegen. \`built\` nur setzen, wenn ein Test, Gate oder eine Prüfung bestanden hat, und diesen Nachweis in \`evidence\` eintragen. Neue Flows, Befunde oder Entscheidungen als neue Notiz nach dem Schema anlegen. Behobene Befunde auf \`state: fixed\` setzen.

**Regeln:** Schreiben nur unter \`Apps/$app_name/\`, andere Apps nur lesen. Keine Passwörter, Tokens oder Kundendaten in Notizen. Das Vault nie in ein öffentliches Repo kopieren. Ist das Vault nicht erreichbar (anderer Rechner), das dem Nutzer sagen statt zu raten.
$end
MSG
)
if [ -f "$f" ] && grep -qF "$start" "$f"; then
  python3 - "$f" "$start" "$end" "$block" <<'PY'
import sys,re
f,start,end,block=sys.argv[1:5]
s=open(f).read()
s=re.sub(re.escape(start)+r'.*?'+re.escape(end), lambda m: block, s, flags=re.S)
open(f,'w').write(s)
PY
  echo "Refreshed brain block in $f"
else
  { [ -f "$f" ] && printf '\n'; printf '%s\n' "$block"; } >> "$f"
  echo "Wrote brain block to $f"
fi
