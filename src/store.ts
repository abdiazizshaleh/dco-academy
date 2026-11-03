import { lessons } from "./content";
const lessonIds = new Set(lessons.map((l) => l.id));
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
export type ExamDraft = {
  mode: string;
  questionIds: string[];
  index: number;
  answers: number[];
  choice: number | null;
  feedback: boolean;
  finished: boolean;
  startedAt: number;
};
export const emptyExam: ExamDraft = {
  mode: "Diagnostic",
  questionIds: [],
  index: 0,
  answers: [],
  choice: null,
  feedback: false,
  finished: false,
  startedAt: 0,
};
export type InterviewDraft = {
  answer: string;
  follow: string;
  followAnswer: string;
  coaching: string[];
  recorded?: boolean;
};
export type InterviewPractice = {
  mode: "Behavioral" | "Technical" | "Principles";
  indices: { Behavioral: number; Technical: number };
  drafts: Record<string, InterviewDraft>;
};
export const emptyInterview: InterviewPractice = {
  mode: "Behavioral",
  indices: { Behavioral: 0, Technical: 0 },
  drafts: {},
};
export type HardwareProgress = {
  part: string;
  quiz: number | null;
  result: boolean | null;
};
export type State = {
  version: 1;
  theme: "dark" | "light";
  exam?: ExamDraft;
  hardware?: HardwareProgress;
  optical?: { tx: number; rx: number; budget: number };
  interviewPractice?: InterviewPractice;
  quizChoices?: Record<string, { choice: number | null; graded: boolean }>;
  completed: string[];
  attempts: Attempt[];
  labs: Record<string, LabState>;
  terminal?: TerminalState;
  terminals?: Record<string, TerminalState>;
  stories: Story[];
  activeStoryId?: string;
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
    start: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
    done: [],
  },
  reviews: {},
  interviews: [],
};
export function hasLearningProgress(s: State) {
  return Boolean(
    s.completed.length ||
    s.attempts.length ||
    s.stories.length ||
    s.bookmarks.length ||
    Object.keys(s.notes).length ||
    Object.keys(s.labs).length ||
    s.terminal ||
    s.optical ||
    s.hardware ||
    s.exam?.questionIds.length ||
    (s.interviewPractice && Object.keys(s.interviewPractice.drafts).length) ||
    (s.quizChoices && Object.keys(s.quizChoices).length) ||
    s.planner.done.length ||
    s.planner.target ||
    s.planner.hours !== 1 ||
    s.planner.days !== 14 ||
    s.planner.start !== initial.planner.start ||
    s.theme !== initial.theme ||
    s.interviews.length ||
    Object.keys(s.reviews).length ||
    (s.terminals && Object.keys(s.terminals).length),
  );
}
// A synchronous recovery copy closes the small gap between a UI change and an
// IndexedDB transaction committing. Remove it only after that exact copy commits.
export function stagePending(key: string, value: unknown) {
  try {
    const json = JSON.stringify(value);
    localStorage.setItem("dco-pending:" + key, json);
    return json;
  } catch {
    return null;
  }
}
export function readPending<T>(key: string): T | null {
  try {
    const json = localStorage.getItem("dco-pending:" + key);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}
export function clearPending(key: string, value: unknown) {
  try {
    const keyName = "dco-pending:" + key;
    if (localStorage.getItem(keyName) === JSON.stringify(value))
      localStorage.removeItem(keyName);
  } catch {
    /* IndexedDB remains the durable store if localStorage is unavailable. */
  }
}
export async function readState() {
  const pending = readPending<State>("dco-academy-v1");
  return pending
    ? parseImport(JSON.stringify(pending))
    : (await get<State>("dco-academy-v1")) || initial;
}
export async function writeState(s: State) {
  await set("dco-academy-v1", s);
  clearPending("dco-academy-v1", s);
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
  if (!x || typeof x !== "object" || Array.isArray(x))
    throw new Error("Not a valid DCO Academy backup.");
  if (x.activeStoryId !== undefined && typeof x.activeStoryId !== "string")
    throw new Error("Backup contains an invalid story selection.");
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
  if (
    x.hardware !== undefined &&
    (!object(x.hardware) ||
      !["CPU", "DIMM", "PSU", "Fans", "Drives", "PCIe"].includes(
        x.hardware.part,
      ) ||
      !(
        x.hardware.quiz === null ||
        (Number.isInteger(x.hardware.quiz) &&
          x.hardware.quiz >= 0 &&
          x.hardware.quiz < 3)
      ) ||
      !(x.hardware.result === null || typeof x.hardware.result === "boolean"))
  )
    throw new Error("Backup contains an invalid hardware exercise.");
  if (x.exam !== undefined) {
    const e = x.exam;
    const answer = (v: unknown) =>
      Number.isInteger(v) && Number(v) >= 0 && Number(v) < 3;
    if (
      !object(e) ||
      ![
        "Diagnostic",
        "Weak-topic practice",
        "Mock A",
        "Mock B",
        "Mock C",
      ].includes(e.mode) ||
      !strings(e.questionIds) ||
      e.questionIds.length > 35 ||
      !e.questionIds.every((id: string) => lessonIds.has(id)) ||
      !Number.isInteger(e.index) ||
      e.index < 0 ||
      e.index >= Math.max(1, e.questionIds.length) ||
      !Array.isArray(e.answers) ||
      !e.answers.every(answer) ||
      !(e.choice === null || answer(e.choice)) ||
      typeof e.feedback !== "boolean" ||
      typeof e.finished !== "boolean" ||
      !Number.isFinite(e.startedAt) ||
      e.answers.length !==
        (e.questionIds.length ? e.index + (e.feedback ? 1 : 0) : 0) ||
      (e.feedback && e.choice !== e.answers[e.index]) ||
      (e.finished && (!e.feedback || e.index !== e.questionIds.length - 1))
    )
      throw new Error("Backup contains an invalid practice exam.");
  }
  if (x.interviewPractice !== undefined) {
    const v = x.interviewPractice;
    if (
      !object(v) ||
      !["Behavioral", "Technical", "Principles"].includes(v.mode) ||
      !object(v.indices) ||
      ![v.indices.Behavioral, v.indices.Technical].every(
        (n) => Number.isInteger(n) && n >= 0 && n < 1000,
      ) ||
      !object(v.drafts) ||
      !Object.entries(v.drafts).every(
        ([key, d]: [string, any]) =>
          /^(Behavioral|Technical):\d+$/.test(key) &&
          object(d) &&
          [d.answer, d.follow, d.followAnswer].every(
            (t) => typeof t === "string",
          ) &&
          strings(d.coaching) &&
          (d.recorded === undefined || typeof d.recorded === "boolean"),
      )
    )
      throw new Error("Backup contains invalid interview drafts.");
  }
  if (
    x.quizChoices !== undefined &&
    (!object(x.quizChoices) ||
      !Object.entries(x.quizChoices).every(
        ([id, d]: [string, any]) =>
          lessonIds.has(id) &&
          object(d) &&
          (d.choice === null ||
            (Number.isInteger(d.choice) && d.choice >= 0 && d.choice < 3)) &&
          typeof d.graded === "boolean" &&
          (!d.graded || d.choice !== null),
      ))
  )
    throw new Error("Backup contains invalid quiz answers.");
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
    out.push("What happened, who was affected, and what made it difficult?");
  if (s.task.length < 30) out.push("What were you personally responsible for?");
  if (s.actions.length < 80)
    out.push("Walk through what you did and why you chose that approach.");
  if (!/\bI\b/i.test(s.actions))
    out.push("Use “I” to explain your part in the team’s work.");
  if (s.result.length < 40)
    out.push(
      "What changed after your actions? Include numbers if you measured them.",
    );
  if (!s.evidence.trim())
    out.push("What did you see or measure that showed the result?");
  if (s.lesson.length < 30)
    out.push("What did you learn, and what would you change?");
  if (
    [s.situation, s.task, s.actions, s.result].join(" ").split(/\s+/).length >
    600
  )
    out.push(
      "This is long for a four-minute answer. Focus on the decisive actions.",
    );
  return out;
}
