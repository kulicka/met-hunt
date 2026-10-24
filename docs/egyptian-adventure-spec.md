# The Met: Hidden Treasures — Egyptian Adventure
## Implementation specification for Claude

**Version:** 1.0 draft · 2026-10-23  
**Status:** Content complete; NOT cleared for public launch until on-site route and visibility QA.  
**Scope:** Add an Egyptian Adventure to the existing children's museum scavenger-hunt app. Preserve all existing adventures, stored progress, and original riddles.

## 1. Implementation directive

Implement this adventure **using the existing app's architecture, data model, components, persistence, and photo-verification service**. Inspect the repository first; adapt the content schema below to the existing conventions. Do not replace working features or invent new APIs. Add the adventure as a distinct, versioned content record and use the existing adventure picker, hints, detective notebook, star awards, certificate, restart/resume, parent override, and progress tracking.

**Important:** The 10-stop launch itinerary below is *proposed*, not yet physically verified. Default to `launchStatus: "field_test_required"` and do not label it "verified accessible". Implement a way to disable individual stops and substitute reserve stops without deleting saved content. Never direct visitors through Galleries 118–120 while closed.

## 2. Adventure identity and UX

- ID: `met-egyptian-adventure`; display name: **Egyptian Adventure**; collection name: **The Met: Hidden Treasures**.
- Venue: The Metropolitan Museum of Art, Fifth Avenue, New York City; department: Egyptian Art.
- Intended age range: 5–12+; recommended 5–10 with adult supervision.
- Suggested playtime target: 45–60 minutes **unverified estimate**.
- Intro concept: *Travel through ancient Egypt as a treasure detective. Decode riddles, find tiny secrets hidden in real artworks, and collect ten discoveries!*
- 10 required mysteries, 1 optional bonus, 1 reserve mystery. Group into two chapters:
  - Chapter 1 **Royal Treasures**: Galleries 111, 112, 114, 115, 116, 117 (six stops).
  - Chapter 2 **Secrets of the Pharaohs**: Galleries 122, 123, 124, 125 (four stops).
- Optional bonus in Gallery 117 does **not** affect completion count; award a bonus star.
- Reserve: Gallery 126, selectable by curator/admin if a main stop is unsuitable. It has a beetle theme similar to Gallery 111.
- Display the gallery number and riddle first. Hide artwork title, direct answer, and reference image until a hint or reveal action is requested. A parent/curator mode may show complete artwork details and verification status.
- Do not assume numeric gallery order equals a connected walkable path. Show chapter transitions without turn-by-turn directions until route edges are field-verified.

## 3. Launch edition: exact content

**The `riddleLines` below are editorially locked. Preserve spelling, punctuation, contractions, and line breaks exactly. Do not auto-rewrite or translate them.** Gallery 111 intentionally has four lines; the other mysteries have two.

```json
{
  "adventureId": "met-egyptian-adventure",
  "contentVersion": "1.0.0-draft",
  "launchStatus": "field_test_required",
  "requiredMysteryCount": 10,
  "chapters": [
    {"id":"royal-treasures","title":"Royal Treasures","stopIds":["egy-111","egy-112","egy-114","egy-115","egy-116","egy-117"]},
    {"id":"pharaoh-secrets","title":"Secrets of the Pharaohs","stopIds":["egy-122","egy-123","egy-124","egy-125"]}
  ],
  "stops": [
    {
      "id":"egy-111","gallery":"111","title":"The Princess's Golden Beetle",
      "artwork":"Scarab ring of Sithathoryunet","metObjectId":"545530",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/545530",
      "target":"Tiny scarab beetle on a royal ring, with red and blue decoration",
      "riddleLines":["Among a princess's treasures bright,","A tiny beetle catches the light.","With red and blue upon my back,","Find the jewel in the royal pack."],
      "hint1":"Look for something a princess could wear.","hint2":"Find a small beetle-shaped ring among royal jewelry.",
      "verificationNotes":"Very small (reported about 1.7 cm); confirm sightline and photographability."
    },
    {
      "id":"egy-112","gallery":"112","title":"The Chest with Golden Eyes",
      "artwork":"Canopic chest of Hapiankhtifi","metObjectId":"544327",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/544327",
      "target":"Gilded eyes and stars decorating the chest/lid",
      "riddleLines":["I have no face, but eyes that see,","A thousand stars look down on me."],
      "hint1":"Find an ancient chest rather than a statue.","hint2":"Look for painted or gilded eyes and stars.",
      "verificationNotes":"Confirm both visual details can be seen from the visitor's viewing position."
    },
    {
      "id":"egy-114","gallery":"114","title":"The Bird with Spread Wings",
      "artwork":"Coffin of Ahmose","metObjectId":"543865",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/543865",
      "target":"Vulture with outstretched wings on the coffin's chest",
      "riddleLines":["I never flutter, never fly,","My wings spread wide as years go by."],
      "hint1":"Look at the decoration on a coffin.","hint2":"Find the bird spreading its wings across the chest.",
      "verificationNotes":"Confirm target is visible and not obscured by glass glare."
    },
    {
      "id":"egy-115","gallery":"115","title":"The Double Queen",
      "artwork":"Head of an Osiride Statue of Hatshepsut","metObjectId":"549030",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/549030",
      "target":"Hatshepsut wearing the double crown of Egypt",
      "riddleLines":["One royal head, two crowns to show,","A double queen from long ago."],
      "hint1":"Search for a sculpture of a ruler.","hint2":"Find the tall crown combining two shapes on Hatshepsut's head.",
      "verificationNotes":"Multiple sculptures may have double crowns; anchor validation to object 549030 and its display photograph."
    },
    {
      "id":"egy-116","gallery":"116","title":"The Mirror's Secret",
      "artwork":"Mirror with Hathor emblem","metObjectId":"545128",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/545128",
      "target":"Hathor goddess emblem on the mirror handle",
      "riddleLines":["I once reflected every face,","A goddess guards my holding place."],
      "hint1":"Find a beauty tool from ancient Egypt.","hint2":"Look closely at the handle of a mirror.",
      "verificationNotes":"Check handle detail and display orientation."
    },
    {
      "id":"egy-117","gallery":"117","title":"The Cat on the Handle",
      "artwork":"Cosmetic spoon with feline handle","metObjectId":"554745",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/554745",
      "target":"Small feline carved into the cosmetic spoon handle",
      "riddleLines":["I'm not a pet, I never roam,","A beauty tool became my home."],
      "hint1":"Look for something used to hold cosmetics.","hint2":"Search the handle of a small spoon for a cat-like animal.",
      "verificationNotes":"Confirm small feline detail is visible from child height."
    },
    {
      "id":"egy-122","gallery":"122","title":"The King with Two Keys",
      "artwork":"Funerary Figure of Akhenaten","metObjectId":"544684",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/544684",
      "target":"Two ankh symbols held by the royal figure",
      "riddleLines":["No locks to open, no doors to see,","Two ancient keys belong to me."],
      "hint1":"Find a small royal figure holding something.","hint2":"Look for two loop-topped ankh symbols, shaped like keys.",
      "verificationNotes":"Verify both symbols are visible, not just one."
    },
    {
      "id":"egy-123","gallery":"123","title":"The Roof of Cobras",
      "artwork":"Jubilee Relief of Ramesses II","metObjectId":"548209",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/548209",
      "target":"Row of upright cobra figures along the roof of the shrine above the king",
      "riddleLines":["We have no feet, but stand in line,","Above a king in stone design."],
      "hint1":"Look for a large carved stone scene featuring a king.","hint2":"Inspect the top of the shrine for a row of snakes.",
      "verificationNotes":"Check that the cobra row is identifiable from visitor distance."
    },
    {
      "id":"egy-124","gallery":"124","title":"The Lion and the Pharaoh",
      "artwork":"Ostracon with Pharaoh Spearing a Lion","metObjectId":"544076",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/544076",
      "target":"Lion in a royal hunting scene drawn on a limestone fragment",
      "riddleLines":["A mighty king is hunting me,","But I’m as still as still can be."],
      "hint1":"Look for a drawing, not a large statue.","hint2":"Find the lion beside a pharaoh in a hunting scene.",
      "verificationNotes":"Check drawing is legible through the case."
    },
    {
      "id":"egy-125","gallery":"125","title":"The Spotted Cat",
      "artwork":"Cat amulet","metObjectId":"553799",
      "artworkUrl":"https://www.metmuseum.org/art/collection/search/553799",
      "target":"Tiny cat-shaped amulet with spotted decoration",
      "riddleLines":["I'm small enough to hide from you,","With spotted fur that isn't true."],
      "hint1":"Look for a very small animal amulet.","hint2":"Find the cat decorated with little spots.",
      "verificationNotes":"High-risk tiny target: test visibility, accessible height, and camera verification; prepare alternate."
    }
  ],
  "bonus": {
    "id":"egy-117-bonus-heart","gallery":"117","title":"The Heart That Never Beats",
    "artwork":"Heart amulet","metObjectId":"545417",
    "artworkUrl":"https://www.metmuseum.org/art/collection/search/545417",
    "target":"Tiny heart-shaped glass amulet",
    "riddleLines":["I never beat, yet memories keep,","A tiny heart that cannot sleep."],
    "optional":true,"award":"bonus_star",
    "hint1":"Search for a small glass amulet.","hint2":"Find the tiny heart shape.",
    "verificationNotes":"Very small (reported 2.1 × 1.9 cm); bonus only, never blocks completion."
  },
  "reserve": {
    "id":"egy-126","gallery":"126","title":"The Beetle on the Head",
    "artwork":"Inner Coffin of Kharushere","metObjectId":"550805",
    "artworkUrl":"https://www.metmuseum.org/art/collection/search/550805",
    "target":"Scarab beetle at the top of the coffin's head",
    "riddleLines":["I'm not a hairpin, not a hat,","But on a head is where I'm at."],
    "hint1":"Find a brightly decorated coffin.","hint2":"Look at the top of the coffin's head for a beetle.",
    "verificationNotes":"Reserve because it repeats Gallery 111's beetle theme."
  }
}
```

### Editorial note

The first Gallery 111 riddle is the original **four-line provisional wording**, not a two-line couplet. The Gallery 117 bonus riddle is also provisional, but has been preserved verbatim. Neither should be silently rewritten.

## 4. Separate original master collection — immutable archive

Store as a separate dataset, e.g. `met-egyptian-original-master-v1`. **Never overwrite its riddles when building the launch edition.** References to the same artwork can be shared by ID, but riddle content must be separately versioned.

| Gallery | Original mystery | Exact saved/provisional riddle | Object | Master status |
|---|---|---|---|---|
| 111 | The Princess's Golden Beetle | Among a princess's treasures bright, / A tiny beetle catches the light. / With red and blue upon my back, / Find the jewel in the royal pack. | 545530 | Provisional four-line riddle |
| 112 | The Chest with Golden Eyes | I have no face, but eyes that see, / A thousand stars look down on me. | 544327 | Saved |
| 113 | The Ancient Baboon | I never climb, I never leap, / An ancient monkey with secrets to keep. | **Unconfirmed** | Do not enable until specific on-view object identified |
| 114 | The Bird with Spread Wings | I never flutter, never fly, / My wings spread wide as years go by. | 543865 | Saved |
| 115 | The Double Queen | One royal head, two crowns to show, / A double queen from long ago. | 549030 candidate | Exact target sculpture should be validated |
| 116 | The Mirror's Secret | I once reflected every face, / A goddess guards my holding place. | 545128 | Saved |
| 117 | The Cat on the Handle | I'm not a pet, I never roam, / A beauty tool became my home. | 554745 | Saved |
| 118 | The Royal Cats | Nine lives to live, but none to chase, / Among bright jewels, I have my place. | 548681 | Gallery reported closed 2026-10-23 |
| 119 | The Secret Name Inside Life | Find a blue symbol shaped like a key, / A king's name waits inside of me. | 548476 | Gallery reported closed 2026-10-23 |
| 120 | The Ancient Puzzle | No puzzle box, no missing clue, / Just ancient pieces dressed in blue. | 551605 | Gallery reported closed 2026-10-23 |

Master optional bonus in Gallery 117: **The Heart That Never Beats**, object 545417, “I never beat, yet memories keep, / A tiny heart that cannot sleep.”

## 5. Availability and routing safeguards

- The Met's gallery closure notice (checked in project research on 2026-10-23) listed **118, 119, and 120 closed**. Do not treat this as a live API or permanent state; check the official notice before every public session: https://www.metmuseum.org/plan-your-visit/gallery-closures
- Galleries 111–117 and 122–126 were not on that particular closure list. **Absence from a closure list does not guarantee that a gallery, case, or object is accessible.**
- **Route blocker:** A traversable connection from Gallery 117 to Gallery 122 has not been verified. Do not draw a line through closed galleries or through walls. Until a field-verified adjacency graph exists, display gallery destinations and a chapter transition message rather than step-by-step navigation.
- Proposed stop order is editorial only. Store a `routeVerified` flag, optional `nextGalleryConnection`, and `accessibilityCheckedAt` for each edge.
- If a gallery is unavailable, allow curator to hide that stop, activate Gallery 126, reorder stops, or run a shortened adventure with dynamically recalculated completion requirements. Do not automatically change the immutable master collection.
- Consider checking whether the Gallery 111 tiny scarab or Gallery 125 spotted cat is too small for young children; they are priority substitutions if field testing fails.

## 6. Hint, photo, and completion behavior

1. Start mystery: display gallery number, mystery title, and exact riddle; avoid displaying the answer or object photo by default.
2. Hint 1: general object category. Hint 2: more precise location/detail. Use the `hint1` and `hint2` fields above as **draft copy**, editable without changing `riddleLines`.
3. Photo check: reuse existing secure backend validation against the correct Met object and target detail. Store approved reference image(s) and real museum test examples only after confirming usage rights. Do not scrape or hotlink unapproved image assets.
4. On uncertainty or failed recognition, provide a retry, hint, and adult override. Never shame children for failed attempts.
5. Mark solved, add collectible Detective Notebook entry and star, and persist progress by adventure ID + content version + stable stop ID. Prevent double-awarding.
6. Optional bonus may be completed while visiting Gallery 117 or later if allowed by the existing UX; it never counts toward the required ten.
7. After all enabled required mysteries: award personalized **Detective Certificate** using chosen avatar name (not a real child's name). Offer restart and exit. Early exit may produce a partial certificate if supported by the existing app.
8. Keep age and avatar selection conventions from the existing app (avatars Scout, Fig, Otto, Milo, Cleo, Pip, Dash, Remy); never require a child's real name.
9. Preserve privacy: do not retain children's museum photos permanently; avoid collecting precise location or identifiable personal information. Respect museum photography rules and child privacy safeguards.

## 7. Analytics (anonymous, existing infrastructure only)

Track `adventure_started`, `stop_viewed`, `hint_used`, `photo_check_attempted`, `stop_solved`, `adult_override_used`, `stop_skipped`, `bonus_solved`, `adventure_exited`, `adventure_completed`; include adventure version, stable stop ID, age band, attempt count, and coarse elapsed time. No photos or real names in analytics. Follow the app's existing consent/retention policies.

## 8. Required field-test checklist

For every proposed stop and the bonus/reserve, curator must confirm:

- Artwork is physically present in the named gallery and matches the linked Met object record.
- Gallery and approach corridor are open on the visit day.
- Specific riddle detail is visible from typical child eye level, without unsafe reaching or flash photography.
- Case reflections and lighting allow a reasonable phone photo, or there is a safe adult override.
- No near-identical artwork makes the answer ambiguous (especially Gallery 115).
- Exact room-to-room connections are walkable; verify the 117 → 122 transition separately.
- Record a curator reference photo (where permitted), case location, timestamp, confidence, and any necessary alternate stop.

**Do not change `launchStatus` to `ready` until the required route and all enabled targets pass this checklist.**

## 9. Acceptance criteria

- Egyptian Adventure appears as a separate selectable adventure; all existing adventures still work.
- Original master ten mysteries plus original bonus remain retrievable and unmodified, including closed-gallery content and the unverified Gallery 113 baboon.
- Launch edition shows exactly ten required stops by default, grouped 6 + 4, plus Gallery 117 bonus and Gallery 126 reserve.
- Exact riddle text and line breaks are preserved, including the curly apostrophe in Gallery 124's “I’m”.
- Parent/curator view exposes Met artwork title, collection link, verification status, and target detail; child view avoids spoilers until reveal.
- Closed galleries 118–120 are absent from the default playable launch route.
- Navigation never claims a verified passage from 117 to 122 until evidence is entered.
- Hint, verification, skip, adult override, resume, restart, stars, and certificate flows are tested.
- Disabling/replacing a stop recalculates completion and does not corrupt existing saved progress.
- Automated content tests assert 10 default required stops, 1 bonus, 1 reserve, and no duplicate IDs; validate every object URL and editorially locked riddle.

## 10. Claude handoff instruction

> Inspect the existing app and implement the Egyptian Adventure as a new versioned adventure using its current architecture and UX patterns. Use the exact content in Sections 3 and 4. Do not modify any existing adventure or original Egyptian master riddle. Preserve closed-gallery mysteries as archived content, not playable stops. Respect the `field_test_required` status and unverified Gallery 117→122 connection. Implement or adapt content loading, chapter transitions, hint and photo verification, adult override, notebook, stars, progress persistence, optional bonus, reserve-stop substitution, and certificate as supported by the existing app. Add tests and document any missing infrastructure or unresolved field-test requirements. Do not claim the adventure is launch-ready without on-site verification.
