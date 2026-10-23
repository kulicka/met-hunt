# Content versions

Published content, so analytics can compare results by version. Versions and
fingerprints live in [`src/data/hidden-treasures/versions.ts`](../src/data/hidden-treasures/versions.ts);
the server also records them in the `analytics_content_versions` table at start.

To publish a change (only after the owner approves any riddle edit):

1. Edit the text in `quests.ts` or the assignment in `reveals.ts` / `verification.server.ts`.
2. Bump that quest's `riddleVersion`, `hintSetVersion` or `artworkAssignmentVersion`
   (a new artwork also gets a new `artworkId`), and update its fingerprint
   (`npm test` prints a failure that names what changed).
3. Bump `CONTENT_PACK_VERSION`.
4. Add a row below.

| Content pack | Date | Change | Approved by |
| --- | --- | --- | --- |
| 2026.10.22-1 | 2026-10-22 | First published set: 10 quests, riddles `r1`, hints `h1`, artworks `a1` (spec v2.0) | Alex |

Route graph: `ROUTE_GRAPH_VERSION` in `src/data/maps/met-floor2-european-paintings.ts`
(currently `2026.10.22-1`). Bump it whenever a gallery or doorway changes.
