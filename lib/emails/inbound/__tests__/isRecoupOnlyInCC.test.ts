import { describe, it, expect } from "vitest";
import { isRecoupOnlyInCC } from "../isRecoupOnlyInCC";

describe("isRecoupOnlyInCC", () => {
  const recoupEmail = "hi@mail.recoupable.com";
  const otherRecoupEmail = "support@mail.recoupable.com";
  const externalEmail = "user@example.com";

  it("returns true when Recoup is only in CC (not in TO)", () => {
    const to = [externalEmail];
    const cc = [recoupEmail];
    expect(isRecoupOnlyInCC(to, cc)).toBe(true);
  });

  it("returns false when Recoup is in TO (even if also in CC)", () => {
    const to = [recoupEmail];
    const cc = [recoupEmail];
    expect(isRecoupOnlyInCC(to, cc)).toBe(false);
  });

  it("returns false when Recoup is in TO and not in CC", () => {
    const to = [recoupEmail];
    const cc = [];
    expect(isRecoupOnlyInCC(to, cc)).toBe(false);
  });

  it("returns false when Recoup is not in either TO or CC", () => {
    const to = [externalEmail];
    const cc = ["another@example.com"];
    expect(isRecoupOnlyInCC(to, cc)).toBe(false);
  });

  it("returns true when multiple recipients but Recoup only in CC", () => {
    const to = [externalEmail, "another@example.com"];
    const cc = [recoupEmail, "third@example.com"];
    expect(isRecoupOnlyInCC(to, cc)).toBe(true);
  });

  it("handles case-insensitive email matching", () => {
    const to = [externalEmail];
    const cc = ["HI@MAIL.RECOUPABLE.COM"];
    expect(isRecoupOnlyInCC(to, cc)).toBe(true);
  });

  it("returns false when empty arrays", () => {
    expect(isRecoupOnlyInCC([], [])).toBe(false);
  });

  it("handles different Recoup email addresses", () => {
    const to = [externalEmail];
    const cc = [otherRecoupEmail];
    expect(isRecoupOnlyInCC(to, cc)).toBe(true);
  });
});
