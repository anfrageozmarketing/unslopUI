#!/usr/bin/env bash
# Validates every skill: frontmatter with name + description, name matches folder, description length.
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0
for f in skills/*/SKILL.md; do
  d=$(basename "$(dirname "$f")")
  name=$(awk '/^---$/{n++;next} n==1 && /^name:/{sub(/^name: */,"");print;exit}' "$f")
  desc=$(awk '/^---$/{n++;next} n==1 && /^description:/{sub(/^description: */,"");print;exit}' "$f")
  [ "$(head -1 "$f")" = "---" ] || { echo "FAIL $f: no frontmatter"; fail=1; }
  [ "$name" = "$d" ] || { echo "FAIL $f: name '$name' != folder '$d'"; fail=1; }
  [ -n "$desc" ] || { echo "FAIL $f: no description"; fail=1; }
  [ "${#desc}" -le 1024 ] || { echo "FAIL $f: description over 1024 chars"; fail=1; }
  echo "ok   $d (${#desc} chars)"
done
for j in .claude-plugin/plugin.json .claude-plugin/marketplace.json; do
  python3 -c "import json,sys;json.load(open('$j'))" || { echo "FAIL $j: invalid JSON"; fail=1; }
done
exit $fail
