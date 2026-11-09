# Private deployment

Goal: only the owner's team can reach the Command Center, and nothing about the apps leaves the server.

## Checklist

1. **Separate repo for the vault.** Private. Never the skill pack repo. Remote optional, but keep backups (see below).
2. **Users.** `node hash-password.mjs <name>` prints `name=salt.hash`. Put one or more, comma-separated, in `.env` as `CC_USERS`. No users, no start.
3. **Network.** Pick one:
   - **Localhost + SSH tunnel** (safest): `HOST=127.0.0.1`, publish no port, reach it with `ssh -L 8080:127.0.0.1:8080 server`.
   - **Reverse proxy with TLS** (Traefik example in `docker-compose.yml`): enable the IP allow-list middleware with the team's fixed IPs or a VPN range. Basic auth in the app is the second layer, not the only one.
4. **TLS.** Never serve the login over plain HTTP outside localhost. Set `TRUST_PROXY=1` only behind your own proxy so the rate limit sees real client IPs.
5. **Files.** Mount the vault read-write into the container; mount nothing else. The container runs as uid 1000 (`node`), so the vault must be writable for it: `chown -R 1000:1000 <vault>` (`new-brain.sh` does this when run as root). Without it, reading works but status changes fail.
6. **Backups.** Daily copy of the vault directory (and `git push` to the private remote if used). Obsidian Sync or a git plugin on the laptop is fine; the server copy stays the reference.
7. **Updates.** The app has no runtime dependencies; update by replacing `server.mjs` and `public/`. Browser libraries are pinned CDN versions; vendor them into `public/vendor/` if the team's browsers must not call a CDN.
8. **Audit.** Proxy access logs are the audit trail. Keep them.

## Do not

- Publish the port (`0.0.0.0:8080` on the host).
- Put the vault in a web root, a public bucket or a public repo.
- Reuse a password from another system for `CC_USERS`.
- Put API keys or customer data into notes.

## Obsidian on the laptop

Open the vault folder (cloned from the private repo, or synced) as an Obsidian vault. The notes are plain markdown, so Obsidian, the Command Center and the agent skills all work on the same files. Mermaid blocks render natively in Obsidian; `00 Command Center.md` uses Dataview queries if the plugin is installed and degrades to plain text otherwise.
