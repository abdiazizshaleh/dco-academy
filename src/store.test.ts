import { describe, it, expect, vi } from "vitest";
import {
  initial,
  emptyExam,
  emptyInterview,
  hasLearningProgress,
  parseImport,
  stagePending,
  readPending,
  clearPending,
} from "./store";
describe("saved student work", () => {
  it("keeps old backups compatible and round trips unfinished practice", () => {
    expect(parseImport(JSON.stringify(initial))).toEqual(initial);
    const state = {
      ...initial,
      exam: {
        ...emptyExam,
        questionIds: ["1-1", "1-2"],
        index: 1,
        answers: [0],
        choice: 1,
        startedAt: Date.now(),
      },
      interviewPractice: {
        ...emptyInterview,
        drafts: {
          "Behavioral:0": {
            answer: "My answer",
            follow: "Why?",
            followAnswer: "Because",
            coaching: [],
          },
        },
      },
      quizChoices: { "1-1": { choice: 0, graded: true } },
      hardware: { part: "DIMM", quiz: 0, result: true },
    };
    expect(parseImport(JSON.stringify(state))).toEqual(state);
    expect(hasLearningProgress(state)).toBe(true);
  });
  it("rejects impossible exam states and malformed drafts before loading them", () => {
    for (const exam of [
      { ...emptyExam, questionIds: ["not-a-lesson"] },
      { ...emptyExam, questionIds: ["1-1"], index: 2 },
      {
        ...emptyExam,
        questionIds: ["1-1"],
        feedback: true,
        choice: 0,
        answers: [],
      },
      { ...emptyExam, finished: true },
    ])
      expect(() => parseImport(JSON.stringify({ ...initial, exam }))).toThrow();
    expect(() =>
      parseImport(
        JSON.stringify({
          ...initial,
          interviewPractice: {
            ...emptyInterview,
            drafts: { "Behavioral:0": { answer: 4 } },
          },
        }),
      ),
    ).toThrow();
    expect(() =>
      parseImport(
        JSON.stringify({
          ...initial,
          hardware: { part: "missing", quiz: 0, result: true },
        }),
      ),
    ).toThrow();
  });
  it("recognizes guest progress even when it is only a bookmark or planner change", () => {
    expect(hasLearningProgress(initial)).toBe(false);
    expect(hasLearningProgress({ ...initial, bookmarks: ["term:ecc"] })).toBe(
      true,
    );
    expect(
      hasLearningProgress({
        ...initial,
        planner: { ...initial.planner, hours: 2 },
      }),
    ).toBe(true);
  });
});

it("keeps the newest recovery copy until that exact state commits", () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  try {
    const oldState = { ...initial, notes: { draft: "old" } },
      newState = { ...initial, notes: { draft: "new" } };
    stagePending("test", oldState);
    stagePending("test", newState);
    clearPending("test", oldState);
    expect(readPending("test")).toEqual(newState);
    clearPending("test", newState);
    expect(readPending("test")).toBeNull();
  } finally {
    vi.unstubAllGlobals();
  }
});
