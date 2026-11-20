import { describe, expect, it } from "vitest";
import { toggleId } from "@/lib/favorites";

describe("favorites", () => {
  it("adds a route that is not saved", () => expect(toggleId(["a"], "b")).toEqual(["a", "b"]));
  it("removes a route that is already saved", () => expect(toggleId(["a", "b"], "a")).toEqual(["b"]));
});
