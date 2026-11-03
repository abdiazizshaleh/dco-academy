import { describe, it, expect } from "vitest";
import {
  scenarios,
  freshLab,
  actLab,
  freshTerminal,
  runCommand,
} from "./simulation";
import { modules, lessons, principles } from "./content";
import {
  initial,
  mastery,
  parseImport,
  makeStory,
  storyFeedback,
} from "./store";
describe("incident engine", () => {
  for (const sc of scenarios) {
    it(`requires evidence and verifies ${sc.title}`, () => {
      let s = freshLab();
      s = actLab(s, sc, "repair");
      expect(s.repaired).toBe(false);
      s = actLab(s, sc, "diagnose", sc.correct);
      expect(s.correct).toBe(false);
      for (let i = 0; i < 3; i++) s = actLab(s, sc, "inspect", i);
      s = actLab(s, sc, "diagnose", (sc.correct + 1) % 3);
      expect(s.correct).toBe(false);
      s = actLab(s, sc, "diagnose", sc.correct);
      expect(s.correct).toBe(true);
      s = actLab(s, sc, "close");
      expect(s.closed).toBe(false);
      s = actLab(s, sc, "repair");
      s = actLab(s, sc, "verify");
      s = actLab(
        s,
        sc,
        "note",
        "Asset verified. Evidence identifies the fault. Approved correction completed; service verified healthy. Next owner is shift lead.",
      );
      s = actLab(s, sc, "close");
      expect(s.closed).toBe(true);
      expect(s.penalties).toBeGreaterThan(0);
      expect(actLab(s, sc, "unsafe")).toEqual(s);
    });
  }
});
it("terminal has state but never runs shell code", () => {
  let s = freshTerminal();
  s = runCommand(s, "ping 10.120.0.1");
  expect(s.history.at(-1)?.output).toContain("unreachable");
  s = runCommand(s, "sudo ip link set eno1 up");
  s = runCommand(s, "ip link");
  expect(s.history.at(-1)?.output).toContain("LOWER_UP");
  s = runCommand(s, "ping 10.120.0.1");
  expect(s.history.at(-1)?.output).toContain("0% packet loss");
  s = runCommand(s, "rm -rf /");
  expect(s.history.at(-1)?.output).toContain("No host command");
});
it("mastery uses performance, not page completions", () => {
  expect(mastery({ ...initial, completed: ["1-1"] }, "Hardware")).toBe(null);
  expect(
    mastery(
      {
        ...initial,
        attempts: [
          {
            id: "a",
            domain: "Hardware",
            score: 100,
            at: Date.now(),
            kind: "quiz",
          },
          {
            id: "b",
            domain: "Hardware",
            score: 0,
            at: Date.now(),
            kind: "lab",
          },
        ],
      },
      "Hardware",
    ),
  ).toBe(33);
});
it("rejects invalid backups and accepts round trips", () => {
  expect(parseImport(JSON.stringify(initial))).toEqual(initial);
  expect(() => parseImport('{"version":1}')).toThrow();
  expect(() =>
    parseImport(JSON.stringify({ ...initial, attempts: [{ score: 999 }] })),
  ).toThrow();
});
it("story coaching asks for genuine evidence", () => {
  expect(storyFeedback(makeStory())).toContain(
    "What supports the result? Add a real observation or verified measurement.",
  );
});
it("curriculum answer indexes and source mappings are valid", () => {
  expect(modules).toHaveLength(16);
  expect(principles).toHaveLength(16);
  expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
  for (const l of lessons) {
    expect(l.options[l.answer]).toBeTruthy();
    expect(l.concept.length).toBeGreaterThan(100);
  }
});
