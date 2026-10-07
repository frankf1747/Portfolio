import { describe, expect, it } from "vitest";
import { moveItem, positionChanges } from "./order";

describe("moveItem", () => {
  it("moves an item down", () => expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]));
  it("moves an item up", () => expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]));
  it("returns a copy, leaving the input alone", () => {
    const list = ["a", "b"];
    expect(moveItem(list, 0, 1)).toEqual(["b", "a"]);
    expect(list).toEqual(["a", "b"]);
  });
  it("ignores out-of-range indexes", () => expect(moveItem(["a", "b"], 0, 5)).toEqual(["a", "b"]));
});

describe("positionChanges", () => {
  it("numbers the new order from 1 and returns only what changed", () => {
    const current = { a: 1, b: 2, c: 3 };
    expect(positionChanges(["b", "a", "c"], current)).toEqual([
      { slug: "b", position: 1 },
      { slug: "a", position: 2 }
    ]);
  });
  it("places unplaced (null) projects", () => {
    expect(positionChanges(["new", "a"], { new: null, a: 1 })).toEqual([
      { slug: "new", position: 1 },
      { slug: "a", position: 2 }
    ]);
  });
  it("returns nothing when the order is unchanged", () => {
    expect(positionChanges(["a", "b"], { a: 1, b: 2 })).toEqual([]);
  });
});
