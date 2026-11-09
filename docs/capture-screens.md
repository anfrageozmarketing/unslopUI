# Capture screens (instructions for a session that has a browser tool)

Your only job: take screenshots and report facts. **Do not judge the design, do not change any code, do not optimise.**
The designing agent reads your screenshots and decides what to change, then asks for a new capture.

## Do

1. Start the preview if the task names it: `node scripts/dev-preview.mjs` (demo data only) and open `http://127.0.0.1:18091`.
   Never use credentials in the URL, never touch a real server or its password.
2. For every route in the task, take **full-page** screenshots at **1280x900** and **360x800**, in **light and dark**
   (set the colour scheme through the browser tool's emulation; if the tool cannot, say so).
3. Take the extra states the task lists (open popover, command palette, hover on a row, focus ring, empty state).
4. Save PNGs to the folder named in the task, as `<route>-<width>-<scheme>[-<state>].png`
   (for example `flow-login-1280-dark.png`). Create the folder if needed.
5. Per screenshot also record: document `scrollWidth` versus viewport width (horizontal overflow), console errors and warnings, failed requests.
6. Stop the preview when done.

## Report (and nothing else)

A list: file path, route, width, scheme, state, `scrollWidth`, console errors. Plus anything that stopped you from capturing.
No opinions, no fixes, no commits.
