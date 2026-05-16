import { describe, it, expect } from "vitest";

import {
  filterRegistrySkills,
  normalizeSearchTerm,
} from "../../../src/renderer/services/skill-store-search";
import type { RegistrySkill } from "@prompthub/shared/types";

/**
 * Regression tests for issue #88 — users reported that skills they could
 * find yesterday were sometimes "gone" the next day. The underlying filter
 * had two gaps that this suite guards:
 *
 *   1. Naming style mismatch: a skill slug like "hello-world" could not be
 *      found when the user typed "hello world".
 *   2. Narrow field coverage: the old filter only looked at name,
 *      description and tags. Users who remembered the slug, install_name,
 *      or author missed their skill completely.
 *
 * Plus defensive checks: missing fields must not throw.
 */

function makeSkill(overrides: Partial<RegistrySkill> = {}): RegistrySkill {
  return {
    slug: overrides.slug ?? "unknown-skill",
    name: overrides.name ?? "Unknown Skill",
    install_name: overrides.install_name ?? overrides.slug ?? "unknown-skill",
    description: "",
    category: "general",
    author: "unknown",
    source_url: "https://example.com/repo",
    tags: [],
    version: "1.0.0",
    content: "# Skill",
    ...overrides,
  };
}

describe("normalizeSearchTerm", () => {
  it("lowercases and collapses non-alphanumeric runs to single spaces", () => {
    expect(normalizeSearchTerm("Hello, World!")).toBe("hello world");
  });

  it("treats hyphens and underscores as word separators", () => {
    expect(normalizeSearchTerm("hello-world_v2")).toBe("hello world v2");
  });

  it("trims leading / trailing separators", () => {
    expect(normalizeSearchTerm("  --hello--  ")).toBe("hello");
  });

  it("returns empty string for empty / whitespace-only input", () => {
    expect(normalizeSearchTerm("")).toBe("");
    expect(normalizeSearchTerm("   ")).toBe("");
    expect(normalizeSearchTerm("!!!")).toBe("");
  });

  it("preserves non-ASCII letters and digits (CJK, accented, emoji digits)", () => {
    expect(normalizeSearchTerm("中文-测试")).toBe("中文 测试");
    expect(normalizeSearchTerm("Café ☕ 2024")).toBe("café 2024");
  });
});

describe("filterRegistrySkills (issue #88)", () => {
  const skills: RegistrySkill[] = [
    makeSkill({ slug: "hello-world", name: "Hello World", tags: ["intro"] }),
    makeSkill({
      slug: "pdf-extractor",
      name: "PDF Extractor",
      description: "Extract text from PDFs",
      category: "office",
      author: "acme",
      install_name: "pdf_extractor",
      tags: ["pdf", "office"],
    }),
    makeSkill({
      slug: "security-audit",
      name: "Security Audit",
      description: "Scans repositories for vulnerabilities",
      category: "security",
      author: "Sec Corp",
      tags: ["security", "scan"],
    }),
    makeSkill({
      slug: "figma-design",
      name: "Figma Design Helper",
      description: "Helps design UI in Figma",
      category: "design",
      tags: ["figma", "ui", "design"],
    }),
  ];

  it("returns all skills when no filter / query is provided", () => {
    const result = filterRegistrySkills(skills);
    expect(result).toHaveLength(4);
  });

  it("treats category 'all' as no-op", () => {
    const result = filterRegistrySkills(skills, { category: "all" });
    expect(result).toHaveLength(4);
  });

  it("filters by category", () => {
    const result = filterRegistrySkills(skills, { category: "security" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("security-audit");
  });

  it("matches the skill name", () => {
    const result = filterRegistrySkills(skills, { searchQuery: "Figma" });
    expect(result.map((s) => s.slug)).toEqual(["figma-design"]);
  });

  it("matches the description", () => {
    const result = filterRegistrySkills(skills, {
      searchQuery: "vulnerabilities",
    });
    expect(result.map((s) => s.slug)).toEqual(["security-audit"]);
  });

  it("matches tags", () => {
    const result = filterRegistrySkills(skills, { searchQuery: "ui" });
    expect(result.map((s) => s.slug)).toContain("figma-design");
  });

  it("matches the slug (was broken before #88)", () => {
    const result = filterRegistrySkills(skills, {
      searchQuery: "security-audit",
    });
    expect(result.map((s) => s.slug)).toEqual(["security-audit"]);
  });

  it("matches install_name (was broken before #88)", () => {
    const result = filterRegistrySkills(skills, {
      searchQuery: "pdf_extractor",
    });
    expect(result.map((s) => s.slug)).toEqual(["pdf-extractor"]);
  });

  it("matches author (was broken before #88)", () => {
    const result = filterRegistrySkills(skills, { searchQuery: "acme" });
    expect(result.map((s) => s.slug)).toEqual(["pdf-extractor"]);
  });

  it("bridges naming style differences so 'hello world' matches 'hello-world'", () => {
    // Core regression of #88 — the user types the skill name naturally
    // but the slug uses hyphens. The old filter would return nothing.
    const result = filterRegistrySkills(skills, {
      searchQuery: "hello world",
    });
    expect(result.map((s) => s.slug)).toEqual(["hello-world"]);
  });

  it("treats hyphens and underscores as equivalent tokens", () => {
    expect(
      filterRegistrySkills(skills, { searchQuery: "pdf-extractor" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["pdf-extractor"]);
    expect(
      filterRegistrySkills(skills, { searchQuery: "pdf extractor" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["pdf-extractor"]);
    expect(
      filterRegistrySkills(skills, { searchQuery: "pdf_extractor" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["pdf-extractor"]);
  });

  it("requires all tokens to match (AND semantics) but not in order", () => {
    // Both tokens appear in the haystack (name + description + author) of
    // the PDF skill; they must both match for the skill to be returned.
    expect(
      filterRegistrySkills(skills, { searchQuery: "pdf acme" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["pdf-extractor"]);
    expect(
      filterRegistrySkills(skills, { searchQuery: "acme pdf" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["pdf-extractor"]);
  });

  it("returns no matches when at least one AND token is absent", () => {
    expect(
      filterRegistrySkills(skills, { searchQuery: "pdf figma" }),
    ).toHaveLength(0);
  });

  it("combines category AND search filters", () => {
    const result = filterRegistrySkills(skills, {
      category: "design",
      searchQuery: "figma",
    });
    expect(result.map((s) => s.slug)).toEqual(["figma-design"]);
  });

  it("empty / whitespace-only query is treated as 'no search'", () => {
    expect(filterRegistrySkills(skills, { searchQuery: "" })).toHaveLength(4);
    expect(
      filterRegistrySkills(skills, { searchQuery: "   " }),
    ).toHaveLength(4);
    expect(
      filterRegistrySkills(skills, { searchQuery: "!!!" }),
    ).toHaveLength(4);
  });

  it("does not throw when a skill has an undefined description (#88 crash guard)", () => {
    // The old implementation called `.toLowerCase()` directly on description
    // and would crash on ill-formed remote entries with no description.
    const weird = makeSkill({
      slug: "no-desc",
      name: "No Description",
      description: undefined as unknown as string,
      tags: undefined as unknown as string[],
    });
    expect(() =>
      filterRegistrySkills([weird], { searchQuery: "description" }),
    ).not.toThrow();
    expect(
      filterRegistrySkills([weird], { searchQuery: "no description" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["no-desc"]);
  });

  it("handles CJK queries (shipping as remote community skills)", () => {
    const cjk = makeSkill({
      slug: "zh-translator",
      name: "中英互译",
      description: "Translate between Chinese and English",
      tags: ["翻译", "中文"],
    });
    expect(
      filterRegistrySkills([cjk], { searchQuery: "中英" }).map((s) => s.slug),
    ).toEqual(["zh-translator"]);
    expect(
      filterRegistrySkills([cjk], { searchQuery: "翻译" }).map((s) => s.slug),
    ).toEqual(["zh-translator"]);
  });

  it("is case-insensitive across all fields", () => {
    expect(
      filterRegistrySkills(skills, { searchQuery: "HELLO" }).map((s) => s.slug),
    ).toEqual(["hello-world"]);
    expect(
      filterRegistrySkills(skills, { searchQuery: "sec corp" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["security-audit"]);
  });

  // Regression: repeated filter calls across many keystrokes previously
  // rebuilt the normalized haystack for every skill on every call,
  // which caused typing lag on large remote registries (review feedback
  // on #126). The implementation now memoizes the haystack per skill
  // reference. This test exercises the cache path via a large dataset
  // and verifies that filtering semantics remain unchanged when the
  // same skill references are filtered repeatedly with different
  // queries.
  it("produces stable results across repeated filter calls on the same skill references", () => {
    const bulk: RegistrySkill[] = [];
    for (let i = 0; i < 300; i += 1) {
      bulk.push(
        makeSkill({
          slug: `perf-alpha-${i}`,
          name: `Perf Alpha ${i}`,
          description: `cached-haystack fixture ${i}`,
          tags: ["performance"],
        }),
      );
    }

    // First pass populates the WeakMap cache. Token "alpha" matches
    // every skill via the slug.
    const firstAll = filterRegistrySkills(bulk, { searchQuery: "alpha" });
    expect(firstAll).toHaveLength(bulk.length);

    // Second pass with a different query. If the cache ever returned a
    // stale or mutated haystack, these results would drift.
    const cacheFixture = filterRegistrySkills(bulk, {
      searchQuery: "cached-haystack",
    });
    expect(cacheFixture).toHaveLength(bulk.length);

    // Third pass that matches nothing. A broken cache could accidentally
    // let some skill's old haystack satisfy this.
    expect(
      filterRegistrySkills(bulk, { searchQuery: "no-such-thing-xyzzy" }),
    ).toHaveLength(0);

    // Repeat the first query — results must still match exactly, proving
    // cache writes don't corrupt the shared state.
    expect(filterRegistrySkills(bulk, { searchQuery: "alpha" })).toEqual(
      firstAll,
    );
  });
});
