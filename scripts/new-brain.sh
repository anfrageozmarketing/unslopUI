#!/usr/bin/env bash
# Scaffolds a private brain: empty vault + Command Center app. Run on the server, outside the skill pack repo.
# Usage: scripts/new-brain.sh <target-dir>      e.g. /docker/app-brain
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
target="${1:?usage: new-brain.sh <target-dir>}"
case "$(cd "$(dirname "$target")" 2>/dev/null && pwd)/$(basename "$target")" in
  "$here"|"$here"/*) echo "Refusing: target is inside the skill pack repo. The brain must stay private." >&2; exit 1;;
esac
[ -e "$target/vault" ] && { echo "Refusing: $target/vault already exists." >&2; exit 1; }
mkdir -p "$target/command-center"
cp -R "$here/skills/unslop-brain/templates/vault" "$target/vault"
cp -R "$here/skills/unslop-brain/templates/command-center/." "$target/command-center/"
cp "$target/command-center/.env.example" "$target/command-center/.env"
chmod 600 "$target/command-center/.env"
printf '.env\nnode_modules/\n.DS_Store\n' > "$target/.gitignore"
cat <<MSG
Brain scaffolded in $target
  vault:           $target/vault          (open in Obsidian; keep in a PRIVATE git repo)
  command center:  $target/command-center

Next:
  1. cd $target/command-center && CC_PASSWORD='<12+ chars>' node hash-password.mjs <name>   -> put into .env as CC_USERS
  2. Fill CC_HOST and CC_ALLOW_IPS in .env, set VAULT_PATH=$target/vault
  3. Try locally: VAULT_DIR=$target/vault CC_USERS=... node server.mjs  (binds to 127.0.0.1)
  4. Deploy only after reading skills/unslop-brain/references/deploy.md
MSG
