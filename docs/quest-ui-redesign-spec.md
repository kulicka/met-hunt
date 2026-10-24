# The Met: Hidden Treasures — Quest Screen UI Redesign Specification

**Purpose:** Implement the approved Egyptian-themed mobile quest UI in the existing app, preserving all current adventures, saved riddles, progress, verification rules, and game mechanics. The reference mockup is a visual direction, **not** a pixel-perfect requirement. Most importantly, **continue without a photo must remain available**: a player may type the artwork's **name or museum accession number** to verify the find.

## 1. Goals and constraints

- Target ages 5–10, with a parent assisting as needed; prioritize readability, large touch targets, and a clear task flow in a museum.
- Preserve existing adventure content verbatim, including all saved riddles, gallery assignments, hints, and bonus challenges. Do not overwrite the original Egyptian master collection.
- Preserve avatar selection, menu, treasure map, detective notebook, hint progression, progress persistence, skip/retry, camera/upload, verification, parent override, and certificates.
- Apply the visual treatment to the quest screen through reusable components and theme tokens. Egyptian motifs should be scoped to Egyptian Adventure; do not impose pyramids/hieroglyphs on the Impressionist adventure.
- Avoid making the UI depend on a new paid service or a new API unless explicitly approved.

## 2. Visual direction

Warm ivory/cream page, subtle sand-colored Egyptian landscape details, soft parchment quest card, dark ink typography, deep scarlet primary action, muted antique-gold highlights, restrained line illustrations (ankh, magnifier, palm, scarab). Friendly, adventurous, polished; **not** cluttered or cartoonishly busy. Decorative artwork must not suggest or reveal the actual answer.

- Header: compact avatar + explorer name on left; notebook count and Menu on right.
- Context strip: `EGYPTIAN ADVENTURE · ROYAL TREASURES`, prominent `Gallery 111`, compact `View Map` control.
- Progress: accessible `Quest 1 of 10` text plus slim progress bar or compact ten-stop tracker; indicate completed/current/skipped distinctly.
- Mystery card: small `MYSTERY #1` badge; title; exact saved riddle with comfortable line height and responsive typography. Keep decorations outside text area.
- Secondary action: `Need a clue?` with `Hint 1 of 2` indicator, expandable inline hint.
- Primary action: prominent red `I FOUND IT!` button. Below it, an **equally discoverable but visually secondary** `Continue without a photo` action, with supporting text `Enter the artwork name or number instead`.
- Tertiary action: `Can't find it? Skip for now` at bottom. Do not conflate skipping with successful non-photo verification.
- Use simple icons with accessible text; icons alone are insufficient.

## 3. Recommended page structure (mobile)

1. Compact top bar: avatar/name, notebook count, menu.
2. Adventure eyebrow, gallery number + map button.
3. Quest progress (`1 of 10`) with bar/markers.
4. Parchment mystery card (badge, mystery title, exact riddle).
5. Hint disclosure (inline, progressive; retain revealed state).
6. Primary CTA: **I FOUND IT!** (opens photo verification choices).
7. Secondary CTA: **Continue without a photo** → artwork-name/number entry.
8. Tertiary: **Skip for now**.

The page should minimize scrolling without shrinking riddle text excessively. On short screens, scrolling is acceptable; never hide the text-entry option behind an unrelated menu. Do not use a sticky CTA if it obscures content or keyboard interactions.

## 4. Verification interaction flows (critical)

### A. Photo verification

1. Tap `I FOUND IT!`.
2. Present `Take a photo` and `Choose from library` (either in a bottom sheet or on a focused verification screen). Maintain device/browser fallbacks.
3. Display preview and `Check my discovery`; allow retake/change photo.
4. Existing verification backend evaluates the photo. Provide clear success, retry, and graceful error states.
5. On success, mark the quest completed **once**, update notebook/progress, show brief celebratory feedback, and offer `Next mystery`.

### B. **Continue without a photo — typed verification (must keep)**

1. Tap the visible `Continue without a photo` control on the quest screen.
2. Open an accessible inline form, sheet, or focused screen:
   - Heading: `Found it? Tell us what you found!`
   - Helper: `Enter the artwork's name or its museum accession number. You can find the number on the artwork label.`
   - Single text field labeled `Artwork name or number`.
   - Placeholder example: `e.g., Scarab ring or 16.1.24` (example must not reveal the current answer on an active mystery; use a generic unrelated example or remove example in production).
   - Buttons: `Check answer` and `Back`.
3. Validate on submission, not on every keystroke. Trim whitespace; compare case-insensitively; normalize punctuation/typographic apostrophes and accession-number separators without erasing meaningful digits or letter suffixes.
4. Compare against a **curated answer set for that quest**: canonical artwork title, approved alternative titles/common names, and The Met accession/object number(s). Note that The Met **collection URL search ID is not necessarily the accession number**. Store and validate these fields separately.
5. Allow sensible spelling variations for artwork titles only when confidently unambiguous; never accept a vague generic answer such as `beetle` or `painting` when it could match many objects. Use a deterministic matcher or existing server-side verifier; do not send children's typed text to new third parties without approval.
6. On match: show the **same completion and rewards** as successful photo verification. Record verification method `text` (vs `photo`), avoid duplicate awards, and advance normally.
7. On mismatch: friendly, non-punitive message: `Not quite! Check the artwork label and try again.` Keep typed input and allow retries, hints, or parent override. Do **not** expose the canonical answer in an error.
8. On service/network failure: preserve input and progress; show `Couldn't check right now. Try again or ask a grown-up.` Do not silently count the answer as correct.
9. `Continue without a photo` means **complete by entering the artwork name/number**, not automatically bypassing verification. If the existing app also supports a trusted parent-approved photo-free completion, keep that as a **separate explicitly labeled path**.

### C. Skip and return

`Skip for now` records a skipped/unresolved mystery and navigates onward without awarding a solved treasure. Allow return from the notebook or adventure navigation. Skips must not be conflated with successful text answers.

## 5. Answer data contract

For each quest, add/confirm these fields without changing the saved riddle:

```ts
interface QuestArtworkAnswer {
  metCollectionId: string; // Met collection search URL ID, e.g. "545530"; NOT automatically a valid label answer
  accessionNumbers: string[]; // verified museum label/accession numbers, e.g. "16.1.24"
  canonicalTitle: string; // exact official artwork title
  acceptedTitles: string[]; // curator-approved title aliases, translated/shortened if appropriate
}

type VerificationMethod = 'photo' | 'text' | 'parent_override';
```

Do **not** invent missing accession numbers. For a quest with unverified answer metadata, flag it for curator review and provide an honest fallback; do not accept arbitrary strings. Do not put answer lists in public-facing clue UI or error messages. If answers are bundled client-side, recognize that determined users can inspect them; for stronger answer protection, validate server-side using the app's existing architecture.

## 6. States and edge cases

- Loading, photo permissions denied, camera unavailable, file invalid/too large, offline/network error, text mismatch, text success, photo success, hint reveal, skipped, revisited, completed, and parent override.
- Maintain a single quest completion state independent of verification method; completion and certificate counts must be idempotent.
- Save draft text while the form is open; do not clear it after an unsuccessful attempt.
- Support museum-label variations and multi-part accession identifiers. If a gallery has multiple similar artworks, match **only the intended target** or explicit curator-approved equivalents.
- Avoid exposing answers through accessibility labels, image filenames, placeholders, or client-side hints.

## 7. Responsive and accessible behavior

- Test 320, 375, 390, 430 px mobile widths and desktop; no horizontal scrolling.
- Tap targets at least 44×44 px; visible focus states; semantic headings/buttons/forms; sufficient contrast (WCAG AA where practical).
- Riddle font scales responsively; line-height ~1.4–1.6; preserve authored line breaks without overflow.
- Screen-reader announcements for hint revealed, verification result, progress change, and completion; decorative imagery hidden from assistive technology.
- Respect reduced-motion preferences; avoid heavy animations that delay the next quest.
- Keyboard opens without covering input/submission; `Enter` submits text, focus moves to result, and back navigation retains state.

## 8. Suggested component decomposition

`QuestHeader`, `GalleryLocationBar`, `QuestProgress`, `MysteryCard`, `HintDisclosure`, `VerificationActions`, `PhotoVerificationFlow`, `TextArtworkVerificationForm`, `QuestResult`, `SkipQuestAction`.

Use existing components/state management/routes where possible. Do not rebuild the application or duplicate verification logic.

## 9. Acceptance criteria

- [ ] The new screen visually follows the approved mockup's warm parchment/Egyptian adventure style.
- [ ] Existing quest title, gallery, and riddle render verbatim.
- [ ] `I FOUND IT!` supports camera and library photo verification.
- [ ] **`Continue without a photo` is visibly present on the quest screen** and opens artwork name/number input.
- [ ] Correct **official artwork title or accession number** completes the quest with full credit, exactly like a valid photo.
- [ ] Wrong, blank, generic, or malformed text does not complete the quest; retries are easy.
- [ ] The Met collection search ID is not mistaken for the accession number.
- [ ] `Skip for now` does not award completion; skipped quests remain revisitable.
- [ ] Hints, map, notebook, menu, avatar, persistence, bonus, parent override, and certificate continue to work.
- [ ] No original riddles or existing adventure content are changed.
- [ ] UI is accessible and functional on small phones, including keyboard and offline/error states.
- [ ] Tests cover title aliases, accession-number normalization, mismatches, idempotent completion, and photo/text parity.

## 10. Implementation prompt for Claude

> Inspect the existing Met: Hidden Treasures project and implement the attached quest-screen UI specification using the current stack, routes, state, and design system. Use the supplied visual mockup as art direction. **Keep a visible “Continue without a photo” option that lets a player enter the artwork's name or accession number and receive the same completion credit as photo verification after a correct match.** Preserve photo verification, skip, parent override, all existing adventure data, and exact riddles. Do not invent accession numbers or treat collection URL IDs as accession numbers. Scope Egyptian decoration to the Egyptian adventure. Add tests for both verification paths and report changed files, test results, and any unverified artwork metadata requiring curator input.
