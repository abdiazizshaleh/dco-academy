import { get, set } from "idb-keyval";
import { isTerminalState, terminalLabs } from "./terminal";
import type { LabState, TerminalState } from "./simulation";
export type Attempt = {
  id: string;
  domain: string;
  score: number;
  kind: "quiz" | "lab" | "terminal" | "interview";
  at: number;
};
export type Story = {
  id: string;
  title: string;
  situation: string;
  task: string;
  actions: string;
  result: string;
  lesson: string;
  evidence: string;
  principles: string[];
  questions: string;
  uses: number;
};
export type State = {
  version: 1;
  theme: "dark" | "light";
  completed: string[];
  attempts: Attempt[];
  labs: Record<string, LabState>;
  terminal?: TerminalState;
  terminals?: Record<string, TerminalState>;
  stories: Story[];
  bookmarks: string[];
  notes: Record<string, string>;
  planner: {
    days: number;
    hours: number;
    target: string;
    start: string;
    done: string[];
  };
  reviews: Record<string, { due: number; interval: number }>;
  interviews: {
    question: string;
    answer: string;
    followup: string;
    score: number;
    at: number;
  }[];
};
export const initial: State = {
  version: 1,
  theme: "dark",
  completed: [],
  attempts: [],
  labs: {},
  stories: [],
  bookmarks: [],
  notes: {},
  planner: {
    days: 14,
    hours: 1,
    target: "",
    start: new Date().toISOString().slice(0, 10),
    done: [],
  },
  reviews: {},
  interviews: [],
};
export async function readState() {
  return (await get<State>("dco-academy-v1")) || initial;
}
export async function writeState(s: State) {
  await set("dco-academy-v1", s);
}
export function mastery(s: State, domain: string) {
  const a = s.attempts.filter((x) => x.domain === domain).slice(-8);
  if (!a.length) return null;
  let total = 0,
    weight = 0;
  for (const x of a) {
    const w =
      Math.exp(-(Date.now() - x.at) / (1000 * 60 * 60 * 24 * 30)) *
      (x.kind === "lab" || x.kind === "terminal" ? 2 : 1);
    total += x.score * w;
    weight += w;
  }
  return Math.round(total / weight);
}
export function parseImport(input: string): State {
  const x = JSON.parse(input);
  if (
    x.version !== 1 ||
    !Array.isArray(x.completed) ||
    !x.completed.every((v: unknown) => typeof v === "string") ||
    !Array.isArray(x.attempts) ||
    !x.attempts.every(
      (a: Attempt) =>
        typeof a.id === "string" &&
        typeof a.domain === "string" &&
        ["quiz", "lab", "terminal", "interview"].includes(a.kind) &&
        Number.isFinite(a.score) &&
        a.score >= 0 &&
        a.score <= 100 &&
        Number.isFinite(a.at),
    ) ||
    !Array.isArray(x.stories) ||
    !x.stories.every(
      (s: Story) =>
        [
          "id",
          "title",
          "situation",
          "task",
          "actions",
          "result",
          "lesson",
          "evidence",
          "questions",
        ].every((k) => typeof (s as any)[k] === "string") &&
        Array.isArray(s.principles) &&
        s.principles.every((p) => typeof p === "string") &&
        Number.isFinite(s.uses),
    ) ||
    !x.planner ||
    ![14, 30, 60].includes(x.planner.days) ||
    !Number.isFinite(x.planner.hours) ||
    typeof x.planner.start !== "string" ||
    !Array.isArray(x.planner.done) ||
    !Array.isArray(x.bookmarks) ||
    !x.bookmarks.every((v: unknown) => typeof v === "string") ||
    !Array.isArray(x.interviews) ||
    !x.notes ||
    !x.labs ||
    !x.reviews
  )
    throw new Error("Not a valid DCO Academy version 1 backup.");
  const strings = (v: unknown) =>
    Array.isArray(v) && v.every((t) => typeof t === "string");
  const object = (v: unknown) =>
    v !== null && typeof v === "object" && !Array.isArray(v);
  if (
    !["dark", "light"].includes(x.theme) ||
    !strings(x.planner.done) ||
    typeof x.planner.target !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(x.planner.start) ||
    x.planner.hours < 0.25 ||
    x.planner.hours > 8 ||
    !object(x.notes) ||
    !Object.values(x.notes).every((v) => typeof v === "string") ||
    !object(x.labs) ||
    !Object.values(x.labs).every(
      (v: any) =>
        object(v) &&
        strings(v.history) &&
        Array.isArray(v.seen) &&
        v.seen.every(
          (n: unknown) =>
            Number.isInteger(n) && Number(n) >= 0 && Number(n) < 3,
        ) &&
        ["correct", "repaired", "verified", "closed"].every(
          (k) => typeof v[k] === "boolean",
        ) &&
        typeof v.note === "string" &&
        Number.isFinite(v.penalties) &&
        (v.diagnosis === null || Number.isInteger(v.diagnosis)),
    ) ||
    !object(x.reviews) ||
    !Object.values(x.reviews).every(
      (v: any) =>
        object(v) && Number.isFinite(v.due) && Number.isFinite(v.interval),
    ) ||
    !x.interviews.every(
      (v: any) =>
        object(v) &&
        typeof v.question === "string" &&
        typeof v.answer === "string" &&
        typeof v.followup === "string" &&
        Number.isFinite(v.score) &&
        Number.isFinite(v.at),
    ) ||
    (x.terminal !== undefined && !isTerminalState(x.terminal)) ||
    (x.terminals !== undefined &&
      (!object(x.terminals) ||
        !Object.entries(x.terminals).every(
          ([key, value]) =>
            terminalLabs.some((l) => l.id === key) && isTerminalState(value),
        )))
  )
    throw new Error("Backup contains invalid learning records.");
  return { ...initial, ...x };
}
export const makeStory = (): Story => ({
  id: crypto.randomUUID(),
  title: "Untitled story",
  situation: "",
  task: "",
  actions: "",
  result: "",
  lesson: "",
  evidence: "",
  principles: [],
  questions: "",
  uses: 0,
});
export function storyFeedback(s: Story) {
  const out: string[] = [];
  if (s.situation.length < 40)
    out.push("What was the specific context, impact, and constraint?");
  if (s.task.length < 30) out.push("What were you personally responsible for?");
  if (s.actions.length < 80)
    out.push("Describe your decisions, alternatives, and specific actions.");
  if (!/\bI\b/i.test(s.actions))
    out.push("Distinguish your personal contribution from the team’s work.");
  if (s.result.length < 40)
    out.push(
      "What observable outcome followed? State measurement limits honestly.",
    );
  if (!s.evidence.trim())
    out.push(
      "What supports the result? Add a real observation or verified measurement.",
    );
  if (s.lesson.length < 30)
    out.push("What did you learn, and what would you change?");
  if (!s.principles.length)
    out.push("Choose the principles demonstrated by your actual actions.");
  if (
    [s.situation, s.task, s.actions, s.result].join(" ").split(/\s+/).length >
    600
  )
    out.push(
      "This is long for a four-minute answer. Focus on the decisive actions.",
    );
  return out;
}
