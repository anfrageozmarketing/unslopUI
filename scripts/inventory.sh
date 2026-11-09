#!/usr/bin/env bash
# Seeds an unslopUI audit: lists routes, API endpoints, auth hints, env vars, tables and big components.
# Usage: scripts/inventory.sh <app-dir>
set -euo pipefail
dir="${1:-.}"
[ -d "$dir" ] || { echo "not a directory: $dir" >&2; exit 1; }
cd "$dir"
ex=(--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=.next --exclude-dir=__pycache__ --exclude-dir=.venv)

echo "## Frontend routes / pages"
find . \( -path ./node_modules -o -path ./.git -o -path '*/node_modules' \) -prune -o \
  \( -path '*/app/*/page.*' -o -path '*/pages/*' -o -name 'routes.*' -o -name 'router.*' \) -type f -print 2>/dev/null | head -60
grep -rnE "<Route |createBrowserRouter|path: *['\"]/" "${ex[@]}" --include=*.jsx --include=*.tsx --include=*.js --include=*.ts . 2>/dev/null | head -30 || true

echo; echo "## API endpoints"
grep -rnE "@(app|router)\.(get|post|put|patch|delete)\(|\.(get|post|put|patch|delete)\(['\"]/|app\.(get|post|put|delete)\(" \
  "${ex[@]}" --include=*.py --include=*.js --include=*.ts . 2>/dev/null | head -80 || true

echo; echo "## Auth hints (absence is a finding)"
grep -rniE "login|logout|password|session|jwt|bearer|oauth|basicauth|forward-auth|X-Forwarded-User|csrf|rate.?limit" \
  "${ex[@]}" --include=*.py --include=*.js --include=*.jsx --include=*.ts --include=*.tsx --include=*.yml --include=*.yaml . 2>/dev/null | head -40 || true

echo; echo "## Env vars read"
grep -rhoE "(os\.environ(\.get)?\(|os\.getenv\(|process\.env\.)['\"]?[A-Z][A-Z0-9_]+" "${ex[@]}" . 2>/dev/null \
  | grep -oE "[A-Z][A-Z0-9_]{2,}$" | sort -u | head -60 || true

echo; echo "## Tables"
grep -rniE "CREATE TABLE( IF NOT EXISTS)? +[a-z_]+" "${ex[@]}" . 2>/dev/null | head -30 || true

echo; echo "## Largest source files (monolith smell)"
find . \( -name node_modules -o -name .git -o -name dist \) -prune -o -type f \
  \( -name '*.jsx' -o -name '*.tsx' -o -name '*.vue' -o -name '*.py' -o -name '*.ts' -o -name '*.js' \) -print0 2>/dev/null \
  | xargs -0 wc -l 2>/dev/null | sort -rn | sed -n 2,11p

echo; echo "## State coverage hints"
for w in "empty" "loading" "skeleton" "offline" "404" "403" "forbidden" "unauthorized" "onboarding" "settings"; do
  n=$(grep -rniE "$w" "${ex[@]}" --include=*.jsx --include=*.tsx --include=*.vue --include=*.js --include=*.ts . 2>/dev/null | wc -l || true)
  printf '%-14s %s\n' "$w" "$n"
done
