# The Met: Hidden Treasures

A mobile-first scavenger hunt for kids (about 8–10) in The Met's 19th- and
Early 20th-Century European Paintings galleries on Floor 2. Each gallery hides
one small detail in one painting. The child reads a riddle, finds the detail,
photographs it, and an AI vision check confirms the discovery.

The full product spec is in [`docs/spec.txt`](docs/spec.txt).

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
| `src/data/maps/met-floor2-european-paintings.ts` | map rooms and doorways | yes |

## Privacy

No accounts, names, emails, GPS, or facial recognition. Photos are resized and
stripped of EXIF on the phone, sent only to check the find, and discarded after.

## Development

```bash
npm install
npm run dev
```
