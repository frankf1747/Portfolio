import { describe, expect, it } from "vitest";
import { verdictMessage } from "./passcode";

describe("verdictMessage", () => {
  it("says nothing when the database accepted", () => expect(verdictMessage("ok")).toBeNull());
  it("explains each refusal", () => {
    expect(verdictMessage("wrong")).toBe("Wrong passcode.");
    expect(verdictMessage("locked")).toBe("Too many wrong tries. Wait 10 minutes, then try again.");
    expect(verdictMessage("bad order")).toBe("That order didn't match the current projects. Reload and try again.");
  });
  it("passes through anything unexpected", () => expect(verdictMessage("boom")).toBe("boom"));
});
