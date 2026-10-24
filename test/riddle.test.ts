import { describe, expect, it } from "vitest";
import { adventures } from "@/adventures/registry";
import { riddleFontSize } from "@/lib/riddle";

const fit = (lines: string[]) => Number(riddleFontSize(lines).match(/([\d.]+)cqi/)![1]);

describe("riddle font size", () => {
  it("shrinks as the longest line grows, within readable bounds", () => {
    expect(riddleFontSize(["Short"])).toMatch(/^clamp\(1rem, [\d.]+cqi, 1\.75rem\)$/);
    const long = ["A tiny beetle catches the light.", "x", "y"];
    expect(fit(long)).toBeLessThan(fit(["Find the cat.", "x", "y"]));
  });

  it("lets a short riddle of one or two lines stay big and wrap", () => {
    expect(fit(["A tiny beetle catches the light.", "x"])).toBeGreaterThan(fit(["A tiny beetle catches the light.", "x", "y"]));
  });

  it("counts the quote marks on the first and last lines", () => {
    expect(fit(["abcd", "abcde"])).toBe(fit(["abcde", "abcd"]));
    expect(fit(["abcdef", "a", "a"])).toBeLessThan(fit(["abcd", "abcdef", "abcd"]));
  });

  it("gives every riddle a size", () => {
    for (const a of adventures) for (const q of a.quests) expect(riddleFontSize(q.riddle)).toContain("cqi");
  });
});
