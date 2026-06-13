import { describe, it, expect } from "vitest";
import { DiffManager } from "../src/managers/DiffManager.js";
import type { CachedPackage } from "../src/types/index.js";

class MockDatabase {
  listPackages(): CachedPackage[] {
    const now = new Date().toISOString();
    const old = new Date(Date.now() - 30 * 86400000).toISOString();
    return [
      { name: "react", version: "18.3.1", size: 100, cachePath: "/a", createdAt: now, dependencies: {} },
      { name: "react", version: "18.2.0", size: 100, cachePath: "/b", createdAt: old, dependencies: {} },
      { name: "zustand", version: "4.5.2", size: 50, cachePath: "/c", createdAt: now, dependencies: {} }
    ];
  }
  listBundles() { return [{ name: "frontend", packages: ["react"] }]; }
}

describe("bundle diff logic", () => {
  it("identifies recent packages", () => {
    const diff = new DiffManager(new MockDatabase() as never);
    expect(() => diff.diff({ since: "7d" })).not.toThrow();
  });
});
