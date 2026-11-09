# Illustration and image system

Goal: pictures that carry information and give the product a face. Two families, both built from your palette.

## 1. Spot illustrations (empty states, onboarding, success, errors)

- **Palette:** ink, accent, spark, accent-soft, paper. Nothing else. Recolouring the set must only mean swapping tokens.
- **Language:** geometric shapes (circle, rounded rect, arc, line) with one organic gesture. One outline weight or none. Flat fills, no gradients, no glow, no stock-person style.
- **Concept per state:** the picture says what is missing or achieved. Empty list: an open route with a dashed segment and a single node. Success: the node filled and the line completed. Error: a broken line with the loose end highlighted in `bad`.
- **Composition:** one focal shape, generous space, text sits on calm ground. 3-5 shapes are enough.
- **Size:** designed at 320 x 240, must still read at 160 x 120.

## 2. Generative images from data

- Derive the picture from the product's own data so every item gets its own, honest image: an app's flows as a constellation, a document's sections as a skyline, a timeline as a ridge.
- Deterministic (seed from the name), no randomness at render time. Insert only numbers and whitelisted names into the SVG, never raw user text.
- **Bold, not hairline:** large fills and arcs with real colour from the palette at moderate opacity; thick route lines; big nodes. Thin grey lines on a pale ground read as artefacts, not imagery.
- Use as hero behind a glass layer, as row image, as card cover. Check that text on top keeps its contrast.

## Anti-slop

No purple-blue mesh gradients, no floating 3D blobs, no stock isometric offices, no emoji as pictures, no AI-looking faces. If the picture could belong to any product, redraw it from this product's objects.

## Checks

- Squint test: one shape dominates.
- Dark and light: the same image works in both through tokens.
- Weight: an illustration must not out-shout the primary action next to it.
- File: inline SVG or a local file, no remote images.
