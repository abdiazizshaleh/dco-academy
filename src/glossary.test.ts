import { it, expect } from "vitest";
import { glossary, searchGlossary, glossaryCategories } from "./glossary";
import { lessons } from "./content";
import sources from "../research/sources.json";
import { initial, parseImport } from "./store";
import { freshTerminal } from "./terminal";
it("contains at least 100 substantive, distinct entries with valid links", () => {
  expect(glossary.length).toBeGreaterThanOrEqual(100);
  expect(new Set(glossary.map((t) => t.id)).size).toBe(glossary.length);
  expect(glossaryCategories).toHaveLength(6);
  for (const e of glossary) {
    expect(e.definition.length).toBeGreaterThan(80);
    expect(e.example.length).toBeGreaterThan(25);
    expect(e.watchFor.length).toBeGreaterThan(25);
    expect(lessons.some((l) => l.id === e.lessonId)).toBe(true);
    expect(e.sourceIds.every((id) => sources.some((s) => s.id === id))).toBe(
      true,
    );
    expect(
      e.related.every((id) => glossary.some((t) => t.id === id) && id !== e.id),
    ).toBe(true);
  }
});
it("searches acronyms, expanded terms, examples, topics, and letters", () => {
  expect(searchGlossary("baseboard management").map((e) => e.id)).toContain(
    "bmc",
  );
  expect(searchGlossary("ECC").map((e) => e.id)).toContain("ecc");
  expect(searchGlossary("", "Fiber").every((e) => e.category === "Fiber")).toBe(
    true,
  );
  expect(
    searchGlossary("", "All", "R").every((e) => e.term.startsWith("R")),
  ).toBe(true);
  expect(searchGlossary("nonexistent-zzzzz")).toEqual([]);
});
it("exports and imports glossary notes, bookmarks, and multiple terminal sessions", () => {
  const state = {
    ...initial,
    notes: { "term:ecc": "Compare inventory, firmware and OS." },
    bookmarks: ["term:ecc"],
    terminal: freshTerminal("dns"),
    terminals: { network: freshTerminal(), dns: freshTerminal("dns") },
  };
  expect(parseImport(JSON.stringify(state))).toEqual(state);
});
it("rejects malformed virtual file state before it can break a restored session", () => {
  expect(() =>
    parseImport(
      JSON.stringify({
        ...initial,
        terminal: {
          ...freshTerminal(),
          files: { "/etc/resolv.conf": { content: 42 } },
        },
      }),
    ),
  ).toThrow();
  expect(() =>
    parseImport(
      JSON.stringify({ ...initial, terminals: { dns: { up: true } } }),
    ),
  ).toThrow();
});
