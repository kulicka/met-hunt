# Content versions

Published content, so analytics can compare results by version. Versions and
fingerprints live in each adventure's `versions.ts` (e.g.
[`src/adventures/european-paintings/versions.ts`](../src/adventures/european-paintings/versions.ts));
the server also records them in the `analytics_content_versions` table at start.

To publish a change (only after the owner approves any riddle edit):

1. Edit the text in `quests.ts` or the assignment in `reveals.ts` / `verification.server.ts`.
2. Bump that quest's `riddleVersion`, `hintSetVersion` or `artworkAssignmentVersion`
   (a new artwork also gets a new `artworkId`), and update its fingerprint
   (`npm test` prints a failure that names what changed).
3. Bump `CONTENT_PACK_VERSION`. It must stay unique across adventures (a test checks).
4. Add a row below.

| Content pack | Date | Change | Approved by |
| --- | --- | --- | --- |
| 2026.10.22-1 | 2026-10-22 | European Paintings: first published set: 10 quests, riddles `r1`, hints `h1`, artworks `a1` (spec v2.0) | Alex |
| 1.0.0-draft | 2026-10-24 | Egyptian Adventure: 10 stops, Gallery 117 bonus, Gallery 126 reserve, riddles `r1`, draft hints `h1`, artworks `a1` (Egyptian spec v1.0 draft). Field test required. | Alex |

The original Egyptian master collection (`src/adventures/egyptian/master.ts`) is an
archive and never changes; a test fails if it does.

Route graph: `ROUTE_GRAPH_VERSION` in `src/data/maps/met-floor2-european-paintings.ts`
(currently `2026.10.22-1`). Bump it whenever a gallery or doorway changes.
