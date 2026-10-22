# The Met: Hidden Treasures

A mobile-first scavenger hunt for kids (about 8–10) in The Met's 19th- and
Early 20th-Century European Paintings galleries on Floor 2. Each gallery hides
one small detail in one painting. The child reads a riddle, finds the detail,
photographs it, and an AI vision check confirms the discovery.

The full product spec is in [`docs/spec.txt`](docs/spec.txt) (v2.0; its routing section overrides earlier map text).

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Framer Motion ·
Lucide icons · Anthropic SDK (server-side photo check) · react-zoom-pan-pinch
(map).

## Content

Quest content is data, not UI code, and is split by who may see it:

| File | Contents | Reaches the browser |
| --- | --- | --- |
| `src/data/hidden-treasures/quests.ts` | gallery, riddle, hints | yes |
| `src/data/hidden-treasures/reveals.ts` | artist, title, answer, fact | only after a find, or in grown-up mode |
| `src/data/hidden-treasures/verification.server.ts` | AI verification targets | never |
| `src/data/maps/met-floor2-european-paintings.ts` | map nodes, verified doorways, route validations | yes |
| `data/closures.json` | current temporary gallery closures, read at runtime | yes |

Quest order (game sequence) and gallery connections (physical doorways) are
separate. Routes only use doorways marked `verified: true`; unknown doorways are
shown with a "?" and never routed through. When no verified route exists, the
map tells the player to use The Met's official map or ask a guard.

### Artwork check

Each time a server starts, `src/instrumentation.ts` looks up every quest artwork
in The Met's open [Collection API](https://metmuseum.github.io/) in the
background, and checks it again every 6 hours while the server runs. It flags
artworks that are not on view, or that The Met lists in a different gallery. The
results are in `GET /api/artworks` and in the grown-ups screen, and appear in the
server logs as `[artworks] ...` lines. The check also fills in the Met link and,
for public-domain works only, the image on reveal screens. The API has no gallery
closures, so those stay in `data/closures.json`. Set `ARTWORK_CHECK=off` to turn
the check off, or `MET_API_BASE` to point it at a mock.

## Privacy

No accounts, names, emails, GPS, or facial recognition. Photos are resized and
stripped of EXIF on the phone, sent only to check the find, and discarded after.

## Development

```bash
npm install
npm run dev          # VERIFY_MOCK_STATUS=verified npm run dev fakes photo checks locally
npm test             # LAUNCH_CHECK=1 npm test also requires all route validations
```

Set `ANTHROPIC_API_KEY` for real photo checks. Deployment: [DEPLOYMENT.md](DEPLOYMENT.md).
