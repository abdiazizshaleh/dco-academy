import { it, expect } from "vitest";
import { companyModules, interviewPrompts, planTaskId } from "./companyStudy";
import { modules, technicalPrompts, behavioralPrompts } from "./content";
import {
  initial,
  emptyInterview,
  parseImport,
  hasLearningProgress,
} from "./store";
it("keeps the AWS plan and prompt order while Google avoids Amazon-only modules", () => {
  expect(companyModules("aws")).toEqual(modules);
  expect(interviewPrompts("aws", "Technical")).toEqual(technicalPrompts);
  expect(interviewPrompts("aws", "Behavioral")).toEqual(behavioralPrompts);
  expect(companyModules("google").some((m) => [1, 14].includes(m.id))).toBe(
    false,
  );
  expect(companyModules("google")[0].id).toBe(3);
  expect(
    interviewPrompts("google", "Technical").some((q) =>
      /DCO, DCEO|principles through|judgment, trust/.test(q),
    ),
  ).toBe(false);
  expect(interviewPrompts("google", "Behavioral")[0]).toContain(
    "repaired a hardware problem",
  );
});
it("keeps earlier AWS completion IDs and separates Google checklist tasks", () => {
  expect(planTaskId("aws", "2026-11-03", 0, 1)).toBe("2026-11-03-0-1");
  expect(planTaskId("google", "2026-11-03", 0, 1)).not.toBe(
    planTaskId("aws", "2026-11-03", 0, 1),
  );
});
it("round trips the company choice and independent drafts while accepting older records", () => {
  const aws = {
    ...emptyInterview,
    drafts: {
      "Behavioral:0": {
        answer: "AWS draft",
        follow: "",
        followAnswer: "",
        coaching: [],
      },
    },
  };
  const google = {
    ...emptyInterview,
    drafts: {
      "Behavioral:0": {
        answer: "Google draft",
        follow: "",
        followAnswer: "",
        coaching: [],
      },
    },
  };
  const value = {
    ...initial,
    targetCompany: "google" as const,
    interviewPractice: aws,
    googleInterviewPractice: google,
  };
  expect(parseImport(JSON.stringify(value))).toEqual(value);
  expect(parseImport(JSON.stringify(initial)).targetCompany).toBeUndefined();
  expect(hasLearningProgress({ ...initial, targetCompany: "google" })).toBe(
    true,
  );
  expect(() =>
    parseImport(JSON.stringify({ ...initial, targetCompany: "unknown" })),
  ).toThrow();
  expect(() =>
    parseImport(
      JSON.stringify({
        ...value,
        googleInterviewPractice: { mode: "invalid" },
      }),
    ),
  ).toThrow();
});
