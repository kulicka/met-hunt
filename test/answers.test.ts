import { describe, expect, it } from "vitest";
import { reveals as egyptianReveals } from "@/adventures/egyptian/reveals";
import { reveals as europeanReveals } from "@/adventures/european-paintings/reveals";
import { questAnswer, serverAdventures } from "@/adventures/registry.server";
import { POST } from "@/app/api/check-answer/route";
import { begin, freshAdventure, solve, solveBonus } from "@/lib/adventure";
import { changes } from "@/lib/analytics/derive";
import { checkAnswer, normalizeTitle, parseAccession } from "@/lib/answer-match";

const EGY = "met-egyptian-adventure";
const EUR = "european-paintings";
const check = (adventure: string, quest: number, text: string) => checkAnswer(text, questAnswer(adventure, quest));

describe("typed answers: accession numbers", () => {
  it("accepts the number as printed on the label", () => {
    expect(check(EGY, 111, "16.1.24")).toBe("match");
    expect(check(EGY, 123, "05.4.256")).toBe("match");
    expect(check(EUR, 7, "1998.325.3")).toBe("match");
  });

  it("forgives spacing and separators but keeps every digit", () => {
    expect(check(EGY, 111, "  16.1.24 ")).toBe("match");
    expect(check(EGY, 111, "16 1 24")).toBe("match");
    expect(check(EGY, 111, "16-1-24")).toBe("match");
    expect(check(EGY, 111, "No. 16.1.24")).toBe("match");
    expect(check(EGY, 123, "5.4.256")).toBe("no_match"); // the leading zero is part of the number
    expect(check(EGY, 111, "16.1.2")).toBe("no_match");
    expect(check(EGY, 111, "16.1.244")).toBe("no_match");
    expect(check(EGY, 111, "16.1")).toBe("no_match");
  });

  it("handles multi-part objects and their letters", () => {
    for (const t of ["14.10.2a, b", "14.10.2", "14.10.2a", "14.10.2 b", "14.10.2a-b", "14.10.2ab", "14.10.2 a and b"]) {
      expect(check(EGY, 114, t), t).toBe("match");
    }
    expect(check(EGY, 114, "14.10.2c")).toBe("no_match");
    // "a–c" on the label is a range
    expect(check(EGY, 112, "12.183.14a–c")).toBe("match");
    expect(check(EGY, 112, "12.183.14b")).toBe("match");
    expect(check(EGY, 112, "12.183.14d")).toBe("no_match");
    // a single-part object has no letters
    expect(check(EGY, 111, "16.1.24a")).toBe("no_match");
  });

  it("never takes the collection URL id for the accession number", () => {
    for (const s of serverAdventures) {
      for (const a of s.answers) {
        if (a.metCollectionId) expect(checkAnswer(a.metCollectionId, a), `${s.adventure.id} ${a.questId}`).toBe("no_match");
      }
    }
  });

  it("does not accept another quest's number", () => {
    expect(check(EGY, 112, "16.1.24")).toBe("no_match");
    // Gallery 114's other "Coffin of Ahmose"
    expect(check(EGY, 114, "12.181.298a, b")).toBe("no_match");
  });

  it("parses label formats", () => {
    expect(parseAccession("86.1.33a, b")).toEqual({ groups: ["86", "1", "33"], parts: ["a", "b"] });
    expect(parseAccession("12.183.14a–c")).toEqual({ groups: ["12", "183", "14"], parts: ["a", "b", "c"] });
    expect(parseAccession("545530")).toBeNull();
    expect(parseAccession("cat amulet")).toBeNull();
  });
});

describe("typed answers: titles", () => {
  it("ignores case, accents, quotes, punctuation and a leading article", () => {
    expect(normalizeTitle("The Manneporte (Étretat)")).toBe("manneporte etretat");
    expect(normalizeTitle("Head of an Osiride Statue")).toBe("head of an osiride statue");
    expect(check(EUR, 6, "the manneporte (étretat)")).toBe("match");
    expect(check(EUR, 6, "MANNEPORTE ETRETAT")).toBe("match");
    expect(check(EUR, 2, "Collector of Prints")).toBe("match");
    expect(check(EGY, 125, "Cat Amulet")).toBe("match");
  });

  it("accepts curated aliases", () => {
    expect(check(EUR, 4, "Madame Thadee Natanson at the Theater")).toBe("match");
    expect(check(EUR, 7, "The Daughters of Catulle Mendes")).toBe("match");
    expect(check(EGY, 124, "Ostracon with Pharaoh Spearing a Lion")).toBe("match");
    expect(check(EGY, 116, "Mirror with Hathor emblem")).toBe("match");
  });

  it("forgives a small typo in a long title only", () => {
    expect(check(EUR, 2, "The Colector of Prints")).toBe("match");
    expect(check(EGY, 111, "Scarab ring of Sithathoryunett")).toBe("match");
    expect(check(EGY, 111, "Scarab ring of Sithat")).toBe("no_match");
    expect(check(EUR, 10, "Oleander")).toBe("no_match"); // short titles must be exact
  });

  it("never matches vague or generic answers", () => {
    for (const t of ["beetle", "painting", "scarab", "ring", "cat", "amulet", "statue", "a", "???", "the"]) {
      expect(check(EGY, 111, t), t).toBe("no_match");
      expect(check(EGY, 125, t), t).toBe("no_match");
    }
    expect(check(EGY, 111, "Scarab ring")).toBe("no_match"); // six more scarab rings in Gallery 111
    expect(check(EGY, 116, "Mirror")).toBe("no_match");
    expect(check(EGY, 125, "Cat with kittens amulet")).toBe("no_match");
  });

  it("matches only the intended object when look-alikes share the gallery", () => {
    expect(check(EUR, 6, "The Manneporte near Etretat")).toBe("no_match");
    expect(check(EGY, 115, "Head from an Osiride Statue of Hatshepsut")).toBe("no_match");
    expect(check(EGY, 115, "Head of an Osiride Statue of Hatshepsut")).toBe("match");
    // Shared titles count only by number.
    expect(check(EGY, 114, "Coffin of Ahmose")).toBe("no_match");
    expect(check(EGY, 1171, "Heart amulet")).toBe("no_match");
    expect(check(EGY, 1171, "10.130.1782")).toBe("match");
    expect(check(EGY, 122, "Funerary Figure of Akhenaten")).toBe("no_match");
  });

  it("accepts either Degas \"Dancer with a Fan\" in Gallery 816, as Alex chose", () => {
    expect(check(EUR, 3, "29.100.557")).toBe("match");
    expect(check(EUR, 3, "29.100.188")).toBe("match");
    expect(check(EUR, 3, "Dancer with a Fan")).toBe("match");
    expect(check(EUR, 3, "29.100.555")).toBe("no_match"); // Fan Mount: Dancers, same gallery
    expect(check(EUR, 3, "Dancer")).toBe("no_match");
    expect(check(EUR, 3, "436136")).toBe("no_match");
  });

  it("is honest when a quest has no curated answers", () => {
    expect(checkAnswer("16.1.24", undefined)).toBe("unchecked");
    expect(checkAnswer("anything", { questId: 1, metCollectionId: "", accessionNumbers: [], canonicalTitle: "Painting", acceptedTitles: [], titleUnique: false })).toBe("unchecked");
  });

  it("treats blank input as a miss", () => {
    expect(check(EGY, 111, "   ")).toBe("no_match");
  });
});

describe("typed answers: Egyptian Daily Life stops", () => {
  it("accepts the accession numbers from The Met's data, never the collection ids", () => {
    expect(check(EGY, 105, "20.3.12")).toBe("match");
    expect(check(EGY, 107, "22.3.523a–f")).toBe("match");
    expect(check(EGY, 107, "22.3.523 c")).toBe("match");
    expect(check(EGY, 108, "15.3.1164")).toBe("match");
    expect(check(EGY, 110, "2021.41.106")).toBe("match");
    for (const [q, id] of [[105, "544258"], [107, "545452"], [108, "546098"], [110, "329884"]] as const) expect(check(EGY, q, id)).toBe("no_match");
    expect(check(EGY, 107, "22.3.521")).toBe("no_match"); // Heqanakht Account VI, same gallery
  });

  it("accepts the Met titles and the spec's shorter names", () => {
    expect(check(EGY, 105, "model bakery and brewery")).toBe("match");
    expect(check(EGY, 105, "Model Bakery and Brewery from the Tomb of Meketre")).toBe("match");
    expect(check(EGY, 107, "heqanakht papyrus fragments")).toBe("match");
    expect(check(EGY, 108, "Relief of Fowl and Herds Crossing Water")).toBe("match");
    expect(check(EGY, 110, "statuette of reniseneb")).toBe("match");
  });

  it("does not land on look-alikes in the same gallery", () => {
    expect(check(EGY, 105, "Model of a Granary with Scribes")).toBe("no_match");
    expect(check(EGY, 107, "Heqanakht Account VI")).toBe("no_match");
    expect(check(EGY, 110, "Stela of Reniseneb")).toBe("no_match");
  });
});

describe("answer data", () => {
  it("covers every stop that has a photo check, with parseable numbers", () => {
    for (const s of serverAdventures) {
      for (const t of s.targets) {
        const a = s.answers.find((x) => x.questId === t.questId);
        expect(a, `${s.adventure.id} ${t.questId}`).toBeDefined();
        for (const n of a!.accessionNumbers) expect(parseAccession(n), n).not.toBeNull();
        if (!a!.accessionNumbers.length) expect(a!.curatorReview).toBeTruthy();
      }
    }
  });

  it("uses the same Met objects as the answers players see after a find", () => {
    for (const r of egyptianReveals) expect(questAnswer(EGY, r.id)?.metCollectionId).toBe(String(r.metObjectId));
    for (const r of europeanReveals) expect(questAnswer(EUR, r.id)?.metCollectionId).toBe(String(r.metObjectId));
  });
});

describe("photo and typed answers earn the same credit", () => {
  const ids = [1, 2, 3];
  const started = begin(freshAdventure(1));

  it("completes the quest the same way", () => {
    const byPhoto = solve(started, 1, "ai-photo", 2, ids);
    const byText = solve(started, 1, "text", 2, ids);
    expect({ ...byText, verificationMethod: {} }).toEqual({ ...byPhoto, verificationMethod: {} });
    expect(byText.verificationMethod[1]).toBe("text");
    expect(changes(started, byText)).toEqual([{ type: "quest_completed", questId: 1, method: "text_verified", hintsUsed: 0 }]);
  });

  it("awards a find once, whatever confirms it second", () => {
    const once = solve(started, 1, "text", 2, ids);
    expect(solve(once, 1, "ai-photo", 3, ids)).toBe(once);
    expect(changes(once, solve(once, 1, "ai-photo", 3, ids))).toEqual([]);
    const bonus = solveBonus(started, 1171, "text");
    expect(solveBonus(bonus, 1171, "ai-photo")).toBe(bonus);
  });
});

describe("POST /api/check-answer", () => {
  const post = (body: unknown) =>
    POST(new Request("http://localhost/api/check-answer", { method: "POST", headers: { "x-forwarded-for": "10.0.0.9" }, body: JSON.stringify(body) }));

  it("says only whether it matched", async () => {
    const hit = await post({ adventure: EGY, quest: 111, answer: "16.1.24" });
    expect(await hit.json()).toEqual({ result: "match" });
    const miss = await (await post({ adventure: EGY, quest: 111, answer: "beetle" })).text();
    expect(JSON.parse(miss)).toEqual({ result: "no_match" });
    expect(miss).not.toMatch(/16\.1\.24|Sithathoryunet/i);
  });

  it("rejects unknown quests and bad bodies", async () => {
    expect((await post({ adventure: EGY, quest: 999, answer: "x" })).status).toBe(400);
    expect((await post({ adventure: EGY, quest: 111 })).status).toBe(400);
    expect((await post({ adventure: EGY, quest: 111, answer: "x".repeat(201) })).status).toBe(400);
  });
});
