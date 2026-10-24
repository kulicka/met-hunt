# Adding an adventure

An adventure is one hunt in one part of the museum. Everything about it lives in
one folder under `src/adventures/`, and the game, progress, notebook, hints,
certificate and analytics read only from that. No screen names a gallery,
artwork or quest.

Two adventures exist today, and they cover both cases:

- `european-paintings/`: a map with verified doorways, so the game draws routes.
- `egyptian/`: a map traced from The Met's Egyptian Art map, with one walk
  (117 → 122) held back in `heldRoutes` until it is checked on site. It also has
  chapters, a bonus mystery, a reserve stop, and curator switches.
- An adventure with no `map` at all still works: the game lists the gallery
  numbers and shows chapter changes, and it points to The Met's own map.

## 1. Make the folder

Copy `src/adventures/egyptian/` to `src/adventures/<your-adventure>/`. Then fill
in each file:

| File | What goes in it | Reaches the browser |
| --- | --- | --- |
| `quests.ts` | Gallery, optional title, riddle lines (locked text, any number of lines), two hints | yes |
| `reveals.ts` | Artwork, optional artist, the hidden detail, fact, and Met object id and URL | only after a find, or in grown-up mode |
| `verification.server.ts` | What the photo checker looks for at each stop | never |
| `versions.ts` | One row per stop, holding a stable key, version tokens and fingerprints | yes |
| `Stamps.tsx` | One notebook stamp per stop (an original SVG) | only after a find |
| `index.ts` | The `Adventure` object: id, title, where, lineup, chapters, map, certificate titles, `launchStatus` | yes |

The fields are documented in [`src/adventures/types.ts`](../src/adventures/types.ts).
Follow these rules:

- **`id`** must be lowercase letters, digits and dashes, at most 40 characters.
  Never rename or reuse it. It keys the player's saved progress, the analytics
  `pack_id`, and the photo-check request.
- **Quest ids** are numbers and only need to be unique within the adventure. Using
  the gallery number works well (Egyptian does this). Never reuse an id for a
  different artwork.
- **`contentPackVersion`** must be unique across all adventures, so analytics can
  separate them by version alone.
- **`launchStatus: "field_test_required"`** stays on until someone has checked
  every stop and route on site. While it is on, the picker, the start screen and
  the grown-ups area say the adventure is still being tested.
- **`map`** should be left out until the doorways are read from The Met's current
  floor map. Put a `FloorMap` in `src/data/maps/` (see `src/data/maps/types.ts`
  and `met-floor1-egyptian.ts`): one outline per room in the map's own
  orientation, and one doorway per opening you can see in a shared wall. Mark an
  opening you can't read as `verified: false`. Maps belong to a floor, so two
  adventures can share one.
- **`heldRoutes`** lists quest-to-quest walks that should get no directions yet.
  The map still shows both rooms, and the player is told to use The Met's map or
  ask a guard.
- **`legacyProgressKeys`** belongs only to European Paintings. Leave it out.

### Optional features

- **`chapters`** groups the lineup. Each new chapter gets a heading between
  mysteries and in the notebook.
- **`bonus`** holds extra mysteries tied to a required quest (`atQuest`). They
  earn a star and never count toward completion.
- **`otherQuests`** holds reserve stops, and stops that have been switched off.
  Finds in them are kept and come back if the stop returns to the lineup.
- **`fieldNotes`** holds the on-site checks still owed for each stop. Only the
  grown-ups area shows them.

## 2. Register it

1. In [`src/adventures/registry.ts`](../src/adventures/registry.ts), add the
   adventure to `adventures`, in the order the picker should show it.
2. In [`src/adventures/registry.server.ts`](../src/adventures/registry.server.ts),
   add its verification targets and reveals.

## 3. Check it

Run `npm test`. The registry tests run against every adventure automatically.
They check that:

- ids are unique and safe to store, and content pack versions are unique;
- every stop has a version row with a matching gallery;
- riddle and hint fingerprints match, and the failure message names the
  fingerprint to put in `versions.ts`;
- every stop has a reveal, a stamp and a server verification target;
- quest galleries exist on the map (if there is one), and chapters cover the
  lineup in order.

Then add a row to [content-versions.md](content-versions.md), and add
adventure-specific tests next to the Egyptian ones in `test/adventures.test.ts`.

## Changing the lineup later (curators)

The Egyptian `index.ts` has three switches near the top:

- `CHAPTERS` sets the stop order.
- `SUBSTITUTIONS` swaps a stop for a reserve, e.g. `{ 125: 126 }`.
- `DISABLED` gives a shortened hunt.

Completion is recalculated from whatever is left. Saved progress is never lost:
finds in a stop that leaves the lineup move to `retiredFinds` and return with
the stop. Each change needs a deploy.

## How players' data is kept

- The profile (`met-hidden-treasures:profile:v1`) holds age, explorer and the
  chosen `adventureId`. No adventure is ever assumed: a new player picks one
  right after tapping START THE HUNT, and so does anyone whose saved adventure is
  missing or was taken down. The picker shows each adventure's saved progress.
- The grown-ups answer key lists every adventure in the registry, so a new one
  shows up there automatically.
- Progress is stored once per adventure, at
  `met-hidden-treasures:adventure:v3:<adventure id>`.
- Progress saved before adventures existed (`adventure:v2` / `progress:v1`) is
  copied into European Paintings the first time it's read. The old record is
  left in place. Those players still choose, and see their hunt on the European
  Paintings card.
- Analytics timers and play-through ids are also kept per adventure, and every
  event carries `pack_id`.

## Known gaps

- The analytics funnel's top step and the dashboard columns say "all 10". That
  is true for both adventures today; generalize it before adding one with a
  different count.
- There is no admin screen for lineup changes. They are code edits plus a deploy.
