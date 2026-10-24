# The Met: Hidden Treasures — Four New Egyptian Adventure Quests

**Status:** Approved content; implementation handoff for Claude  
**Date:** October 24, 2026  
**Scope:** Add four new mysteries to the Egyptian Adventure without changing any existing mysteries, riddles, bonuses, or game behavior.

## Approved quests

| Gallery | Quest title | Target artwork | Met collection URL | Hidden detail | Exact approved riddle |
|---|---|---|---|---|---|
| **105** | **The Flour-Covered Hands** | Model Bakery and Brewery (Meketre) | https://www.metmuseum.org/art/collection/search/544258 | White flour painted on a baker's hands | **My hands are white, but there's no snow,**<br>**I'm making something you all know!** |
| **107** | **The Ancient Shopping List** | Heqanakht Papyrus Fragments | https://www.metmuseum.org/art/collection/search/545452 | Ancient writing recording grain and household accounts/supplies | **No carts, no stores, no checkout line,**<br>**I counted grain in ancient time!** |
| **108** | **The Cows Crossing the Water** | Relief of Fowl and Herds Crossing Water | https://www.metmuseum.org/art/collection/search/546098 | Cattle being led through water in a carved relief | **We have four hooves, but here's the twist,**<br>**We're walking where the fish exist!** |
| **110** | **The Girl with a Secret Braid** | Statuette of Reniseneb | https://www.metmuseum.org/art/collection/search/329884 | A child's distinctive side braid | **I'm just a child from long ago,**<br>**One special braid I have to show!** |

**Important:** The Met URLs above use collection **object IDs**, not accession numbers. Do not treat `544258`, `545452`, `546098`, or `329884` as accession numbers. Verify official accession numbers against Met records before enabling accession-number text validation. Do not fabricate them.

## Implementation requirements

1. **Append, do not overwrite.** Preserve the existing Egyptian master set (15 main mysteries + 1 bonus), the existing launch subset/configuration, and all existing riddle text verbatim. These four quests are additive content. The expanded master set will contain **19 main mysteries + 1 bonus** if all four are added to the existing 15.
2. **Route/order.** Associate each quest with its gallery number and insert in gallery order when an expanded route is enabled: **105 → 107 → 108 → 110 → 111…**. Do not assume adjacent gallery doorways or walkability; confirm the museum route in person before showing turn-by-turn directions. Respect gallery closures and availability configuration.
3. **Quest data.** Give each quest a stable unique ID; store gallery, title, exact two-line riddle, artwork name, official Met URL/object ID, hidden-detail description, approved alternate artwork titles (if verified), and accession number (only when verified). Existing progress must remain valid after content changes; avoid index-only persistence.
4. **Photo validation.** The image verification should look for the specific artwork/detail, not merely any Egyptian object or gallery label. Maintain existing parent override and privacy protections.
5. **Continue without a photo.** Keep the existing visible option to enter the artwork **name or verified accession number**; correct text earns the same full credit as a photo. Accept case/punctuation-insensitive approved title aliases. Do not accept the Met collection object ID as an accession number by accident. Wrong answers permit retry without revealing the answer.
6. **Hints.** Supply progressive, non-spoiler hints consistent with existing game behavior. Suggested first hints: Gallery 105 — “Look for someone preparing food.”; Gallery 107 — “Find a message written on papyrus.”; Gallery 108 — “Look carefully at a carved scene with animals.”; Gallery 110 — “Look at the child's hairstyle.” Do not reveal the answer until the existing reveal rules permit it.
7. **Navigation.** Keep the **Treasure Map icon permanently visible in the top navigation**, next to the Detective Notebook and menu. It must work on every quest and hint screen, preserve current progress, and highlight current/completed galleries. Avoid a redundant large View Map button on the quest screen.
8. **Do not alter** avatar onboarding, hints, skip, notebook, certificates, restart/end confirmation, anonymous analytics, responsive styling, or other established flows. Quest counts/progress indicators should derive from the currently selected adventure configuration, not the full master collection.
9. **On-site verification required before publishing as live:** Confirm all four objects are physically on display in the stated galleries, that the flour/side braid/cattle are visible from visitor areas, and that the Gallery 107 text makes sense as a child-facing “shopping list” metaphor rather than a literal modern list. If an artwork is unavailable, mark that quest inactive rather than silently substituting another.

## Suggested content records (adapt to actual schema)

```json
[
  {
    "id": "egypt-105-flour-hands",
    "gallery": 105,
    "title": "The Flour-Covered Hands",
    "artworkTitle": "Model Bakery and Brewery",
    "metObjectId": "544258",
    "metUrl": "https://www.metmuseum.org/art/collection/search/544258",
    "accessionNumber": null,
    "hiddenDetail": "White flour painted on a baker's hands",
    "riddle": ["My hands are white, but there's no snow,", "I'm making something you all know!"]
  },
  {
    "id": "egypt-107-shopping-list",
    "gallery": 107,
    "title": "The Ancient Shopping List",
    "artworkTitle": "Heqanakht Papyrus Fragments",
    "metObjectId": "545452",
    "metUrl": "https://www.metmuseum.org/art/collection/search/545452",
    "accessionNumber": null,
    "hiddenDetail": "Papyrus records of grain and household accounts",
    "riddle": ["No carts, no stores, no checkout line,", "I counted grain in ancient time!"]
  },
  {
    "id": "egypt-108-cows-water",
    "gallery": 108,
    "title": "The Cows Crossing the Water",
    "artworkTitle": "Relief of Fowl and Herds Crossing Water",
    "metObjectId": "546098",
    "metUrl": "https://www.metmuseum.org/art/collection/search/546098",
    "accessionNumber": null,
    "hiddenDetail": "Cattle being led through water in a carved relief",
    "riddle": ["We have four hooves, but here's the twist,", "We're walking where the fish exist!"]
  },
  {
    "id": "egypt-110-secret-braid",
    "gallery": 110,
    "title": "The Girl with a Secret Braid",
    "artworkTitle": "Statuette of Reniseneb",
    "metObjectId": "329884",
    "metUrl": "https://www.metmuseum.org/art/collection/search/329884",
    "accessionNumber": null,
    "hiddenDetail": "Distinctive side braid on a child figure",
    "riddle": ["I'm just a child from long ago,", "One special braid I have to show!"]
  }
]
```

## Acceptance checklist

- [ ] All four quests display the **exact approved riddles** above with correct line breaks.
- [ ] Existing Egyptian and Impressionist riddles are unchanged.
- [ ] Correct gallery numbers, artwork links, and hidden details are associated with each quest.
- [ ] Quest count, progress, map, notebook, and certificate work for the selected active route.
- [ ] Photo and artwork-name validation work; accession numbers work only after verification.
- [ ] Skip remains separate from “Continue without a photo.”
- [ ] Persistent map icon is available on quest/hint screens.
- [ ] Existing saved player progress survives deployment.
- [ ] Museum floor/display checks are completed before activation.

## Claude implementation instruction

> Add the four approved Egyptian Adventure mysteries in this specification to the existing content registry. Preserve all existing riddles, bonuses, game mechanics, and saved progress. Do not overwrite the current live 10-quest adventure without an explicit configuration decision; make the new mysteries available in the expanded adventure configuration, initially gated by on-site artwork verification. Preserve both photo and text (artwork title/verified accession number) completion methods, and keep the Treasure Map icon in the top navigation. Implement and test the acceptance checklist above.
