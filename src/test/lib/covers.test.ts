import { describe, it, expect } from "vitest";
import { getOpenLibraryCover } from "../../lib/covers";

describe("getOpenLibraryCover", () => {
  it("sin isbn no hay portada de Open Library", () => {
    expect(getOpenLibraryCover(null)).toBeNull();
  });

  it("pide default=false, que es lo que hace fallar a un isbn que no tienen", () => {
    const url = getOpenLibraryCover("9788437604572");
    expect(url).toContain("9788437604572");
    expect(url).toContain("default=false");
  });
});
