import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Cloud,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Library,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Network,
  Play,
  Search,
  Server as ServerIcon,
  ShieldCheck,
  Sun,
  Target,
  Terminal,
  Upload,
  X,
  Bookmark,
  CalendarDays,
  MessageSquare,
  FolderOpen,
  Briefcase,
  Activity,
  RotateCcw,
} from "lucide-react";
import {
  modules,
  lessons,
  principles,
  principleNotes,
  type Lesson,
} from "./content";
import { scenarios, actLab, freshLab } from "./simulation";
import {
  initial,
  emptyExam,
  emptyInterview,
  type ExamDraft,
  type InterviewDraft,
  type InterviewPractice,
  mastery,
  makeStory,
  storyFeedback,
  parseImport,
  type Story,
} from "./store";
import { Rack, Topology, Server } from "./Diagram";
import { CompanyPicker } from "./CompanyPicker";
import {
  companyNames,
  companyModules,
  interviewPrompts,
  planTaskId,
} from "./companyStudy";
import { RoleGuide, CompanyNote, companyScope } from "./RoleGuide";
import { Dashboard } from "./Dashboard";
import sources from "../research/sources.json";
import "./style.css";
import { Glossary } from "./GlossaryView";
import { glossary, searchGlossary } from "./glossary";
import { TerminalLab } from "./TerminalLab";
import { freshTerminal } from "./terminal";
import { useLearningState, syncLabel } from "./useLearningState";
import { CloudAccount } from "./CloudAccount";
const nav = [
  ["Dashboard", LayoutDashboard],
  ["Learning Path", BookOpen],
  ["Glossary", Library],
  ["Data Center Explorer", ServerIcon],
  ["Hardware Lab", FlaskConical],
  ["Network & Fiber Lab", Network],
  ["Linux Terminal", Terminal],
  ["Incident Simulator", Activity],
  ["Interview Academy", MessageSquare],
  ["STAR Story Vault", FolderOpen],
  ["Practice Exams", Target],
  ["Study Planner", CalendarDays],
  ["Resource Library", BookOpen],
  ["Career Readiness", Briefcase],
] as const;
const domains = [...new Set(modules.map((m) => m.domain))];
const sourceMap: Record<string, string[]> = {
  "rfc-tcp": ["rfc-tcp"],
  "rfc-dhcp": ["rfc-dhcp"],
  "rfc-dns": ["rfc-dns"],
  "aws-role": ["aws-dct", "aws-dceo"],
  "aws-infra": ["aws-regions"],
  dell: ["intel-ecc", "dell-raid"],
  hpe: ["intel-ecc"],
  "linux-man": [
    "linux-link",
    "linux-route",
    "linux-systemctl",
    "linux-journal",
  ],
  cisco: ["cisco-optics"],
  fluke: ["fluke-fiber", "fluke-clean"],
  redhat: ["linux-systemctl", "linux-journal"],
  "amazon-lp": ["aws-lp"],
  "amazon-loop": ["aws-interview", "aws-interview-faq"],
};
function pageSlug(page: string) {
  return page.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
function readRoute() {
  const [path, query = ""] = location.hash.replace(/^#\//, "").split("?");
  const params = new URLSearchParams(query);
  return {
    page: nav.find(([name]) => pageSlug(name) === path)?.[0] || "Dashboard",
    termId: glossary.some((e) => e.id === params.get("term"))
      ? params.get("term")
      : null,
    lessonId: lessons.some((l) => l.id === params.get("lesson"))
      ? params.get("lesson")
      : null,
    scenarioId: scenarios.some((sc) => sc.id === params.get("incident"))
      ? params.get("incident")!
      : scenarios[8].id,
  };
}
function routeUrl(
  page: string,
  lesson: string | null = null,
  incident?: string,
  term?: string | null,
) {
  return (
    "#/" +
    pageSlug(page) +
    (page === "Glossary" && term
      ? "?term=" + term
      : lesson
        ? "?lesson=" + lesson
        : page === "Incident Simulator" && incident
          ? "?incident=" + incident
          : "")
  );
}
const initialRoute = readRoute();
function App() {
  const learningStore = useLearningState();
  const {
    state: s,
    setState: S,
    ready: loaded,
    error: saveError,
  } = learningStore;
  const company = s.targetCompany || "aws";
  const planModules = companyModules(company);
  const practiceKey =
    company === "google" ? "googleInterviewPractice" : "interviewPractice";
  const [page, P] = useState<string>(initialRoute.page);
  const [lessonId, LI] = useState<string | null>(initialRoute.lessonId);
  const [termId, TI] = useState<string | null>(initialRoute.termId);
  const [mobile, M] = useState(false);
  const [toast, T] = useState("");
  const [query, Q] = useState("");
  const [filter, F] = useState("All");
  const [modal, MO] = useState(false);
  const [scenarioId, SI] = useState(initialRoute.scenarioId);
  const [incidentFilter, IF] = useState("All");
  const storyId = s.activeStoryId || "";
  const ST = (id: string) => S((p) => ({ ...p, activeStoryId: id }));
  const exam = s.exam || emptyExam;
  function examField<K extends keyof ExamDraft>(
    key: K,
    value: React.SetStateAction<ExamDraft[K]>,
  ) {
    S((p) => {
      const e = p.exam || emptyExam;
      return {
        ...p,
        exam: {
          ...e,
          [key]:
            typeof value === "function"
              ? (value as (v: ExamDraft[K]) => ExamDraft[K])(e[key])
              : value,
        },
      };
    });
  }
  const examMode = exam.mode,
    examIndex = exam.index,
    examAnswers = exam.answers,
    examChoice = exam.choice,
    examFeedback = exam.feedback,
    examFinished = exam.finished,
    examStart = exam.startedAt;
  const examQuestions = exam.questionIds
    .map((id) => lessons.find((l) => l.id === id)!)
    .filter(Boolean);
  const EM = (v: string) => examField("mode", v),
    EQ = (v: Lesson[]) =>
      examField(
        "questionIds",
        v.map((l) => l.id),
      ),
    EI = (v: React.SetStateAction<number>) => examField("index", v),
    EA = (v: React.SetStateAction<number[]>) => examField("answers", v),
    EC = (v: number | null) => examField("choice", v),
    EF = (v: boolean) => examField("feedback", v),
    ED = (v: boolean) => examField("finished", v),
    ES = (v: number) => examField("startedAt", v);
  const [tick, Tick] = useState(Date.now());
  const practice = s[practiceKey] || emptyInterview;
  const interviewMode =
    company === "google" && practice.mode === "Principles"
      ? "Behavioral"
      : practice.mode;
  const practiceMode =
    interviewMode === "Technical" ? "Technical" : "Behavioral";
  const questionIndex = practice.indices[practiceMode];
  const practiceBank = interviewPrompts(company, practiceMode);
  const draftKey = `${practiceMode}:${questionIndex}`;
  const draft = practice.drafts[draftKey] || {
    answer: "",
    follow: "",
    followAnswer: "",
    coaching: [],
  };
  const answer = draft.answer,
    follow = draft.follow,
    followAnswer = draft.followAnswer,
    coaching = draft.coaching;
  function interviewField<K extends keyof InterviewDraft>(
    key: K,
    value: InterviewDraft[K],
  ) {
    S((p) => {
      const v = p[practiceKey] || emptyInterview;
      const d = v.drafts[draftKey] || {
        answer: "",
        follow: "",
        followAnswer: "",
        coaching: [],
      };
      return {
        ...p,
        [practiceKey]: {
          ...v,
          drafts: { ...v.drafts, [draftKey]: { ...d, [key]: value } },
        },
      };
    });
  }
  const IM = (mode: InterviewPractice["mode"]) =>
    S((p) => ({
      ...p,
      [practiceKey]: { ...(p[practiceKey] || emptyInterview), mode },
    }));
  const QI = (value: React.SetStateAction<number>) =>
    S((p) => {
      const v = p[practiceKey] || emptyInterview;
      return {
        ...p,
        [practiceKey]: {
          ...v,
          indices: {
            ...v.indices,
            [practiceMode]:
              typeof value === "function"
                ? value(v.indices[practiceMode])
                : value,
          },
        },
      };
    });
  const A = (v: string) => interviewField("answer", v),
    FO = (v: string) => interviewField("follow", v),
    FA = (v: string) => interviewField("followAnswer", v),
    CO = (v: string[]) => interviewField("coaching", v);
  const [rehearsal, RH] = useState<number | null>(null);
  const [rehearsalLength, RL] = useState(120);
  const optical = s.optical || { tx: -2, rx: -8, budget: 8 };
  const optTx = optical.tx,
    optRx = optical.rx,
    budget = optical.budget;
  function opticalField(key: "tx" | "rx" | "budget", value: number) {
    if (Number.isFinite(value))
      S((p) => ({
        ...p,
        optical: {
          ...(p.optical || { tx: -2, rx: -8, budget: 8 }),
          [key]: value,
        },
      }));
  }
  const OT = (v: number) => opticalField("tx", v),
    OR = (v: number) => opticalField("rx", v),
    BU = (v: number) => opticalField("budget", v);
  const [explore, EX] = useState("Rack");
  const inputFile = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = s.theme;
  }, [s.theme]);
  useEffect(() => {
    const id = setInterval(() => Tick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => T(""), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  function go(p: string) {
    history.pushState(null, "", routeUrl(p, null, scenarioId));
    P(p);
    LI(null);
    M(false);
    Q("");
    F("All");
    window.scrollTo(0, 0);
  }
  function openTerm(id: string) {
    history.pushState(null, "", routeUrl("Glossary", null, undefined, id));
    P("Glossary");
    LI(null);
    TI(id);
    M(false);
    Q("");
    F("All");
    window.scrollTo(0, 0);
  }
  function learn(id: string) {
    history.pushState(null, "", routeUrl("Learning Path", id));
    P("Learning Path");
    LI(id);
    M(false);
    Q("");
    F("All");
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const back = () => {
      const r = readRoute();
      P(r.page);
      LI(r.lessonId);
      SI(r.scenarioId);
      TI(r.termId);
      M(false);
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => {
    history.replaceState(
      null,
      "",
      routeUrl(page, lessonId, scenarioId, termId),
    );
  }, [page, lessonId, scenarioId, termId]);
  useEffect(() => {
    const search = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        go("Resource Library");
        setTimeout(
          () => document.getElementById("resource-search")?.focus(),
          0,
        );
      }
    };
    document.addEventListener("keydown", search);
    return () => document.removeEventListener("keydown", search);
  }, []);
  function attempt(
    id: string,
    domain: string,
    score: number,
    kind: "quiz" | "lab" | "terminal" | "interview",
  ) {
    S((p) => ({
      ...p,
      attempts: [...p.attempts, { id, domain, score, kind, at: Date.now() }],
    }));
  }
  function bookmark(id: string) {
    S((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(id)
        ? p.bookmarks.filter((x) => x !== id)
        : [...p.bookmarks, id],
    }));
  }
  function startExam(mode = examMode) {
    if (examQuestions.length && !examFinished) {
      go("Practice Exams");
      return;
    }
    EM(mode);
    const qs =
      mode === "Weak-topic practice"
        ? [...lessons]
            .sort(
              (a, b) =>
                (mastery(
                  s,
                  modules.find((m) => m.lessons.includes(a))!.domain,
                ) ?? 0) -
                (mastery(
                  s,
                  modules.find((m) => m.lessons.includes(b))!.domain,
                ) ?? 0),
            )
            .slice(0, 10)
        : mode === "Mock B"
          ? lessons.filter((_, i) => i % 2 === 1)
          : mode === "Mock C"
            ? [...lessons].reverse().slice(0, 20)
            : mode === "Mock A"
              ? lessons.filter((_, i) => i % 2 === 0)
              : lessons.filter((_, i) => i % 2 === 0).slice(0, 12);
    EQ(qs);
    EI(0);
    EA([]);
    EC(null);
    EF(false);
    ED(false);
    ES(Date.now());
    go("Practice Exams");
  }
  function gradeExam() {
    if (examChoice === null || examFeedback) return;
    const l = examQuestions[examIndex];
    const score = examChoice === l.answer ? 100 : 0;
    EA((p) => [...p, examChoice]);
    EF(true);
    const d = modules.find((m) => m.lessons.includes(l))!.domain;
    attempt(l.id, d, score, "quiz");
    S((p) => ({
      ...p,
      reviews: {
        ...p.reviews,
        [l.id]: {
          due: Date.now() + (score ? 3 : 0.25) * 86400000,
          interval: score ? 3 : 0.25,
        },
      },
    }));
  }
  const currentLesson = lessons.find((l) => l.id === lessonId);
  const mod = modules.find((m) => m.lessons.some((l) => l.id === lessonId));
  const scenario = scenarios.find((x) => x.id === scenarioId)!;
  const lab = s.labs[scenarioId] || freshLab();
  const story = s.stories.find((x) => x.id === storyId) || s.stories[0];
  const resourceTerms = searchGlossary(query).filter(
    (e) => filter !== "Bookmarks" || s.bookmarks.includes("term:" + e.id),
  );
  const due = lessons.filter((l) => s.reviews[l.id]?.due <= Date.now());
  function labAction(action: string, value?: number | string) {
    const n = actLab(lab, scenario, action, value);
    S((p) => ({
      ...p,
      labs: { ...p.labs, [scenarioId]: n },
      attempts:
        !lab.closed && n.closed
          ? [
              ...p.attempts,
              {
                id: scenarioId,
                domain: scenario.domain,
                score: Math.max(0, 100 - n.penalties * 12),
                kind: "lab",
                at: Date.now(),
              },
            ]
          : p.attempts,
    }));
  }
  function updateStory(patch: Partial<Story>) {
    if (story)
      S((p) => ({
        ...p,
        stories: p.stories.map((x) =>
          x.id === story.id ? { ...x, ...patch } : x,
        ),
      }));
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "dco-academy-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    T("Backup exported");
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      const v = parseImport(await file.text());
      S(v);
      T("Backup imported");
    } catch (e) {
      T(
        "That file isn’t a valid DCO Academy backup. Choose a JSON file exported from the academy.",
      );
    }
  }
  function interviewNext() {
    const combined = answer + " " + followAnswer;
    const flags: string[] = [];
    if (combined.split(/\s+/).length < 60)
      flags.push(
        "Add a little more detail so someone can follow your reasoning.",
      );
    if (!/\bI\b/i.test(combined))
      flags.push("Explain what you were responsible for and what you did.");
    if (!/because|chose|decid|reason|alternative/i.test(combined))
      flags.push(
        "Explain why you chose your actions and what alternatives you considered.",
      );
    if (
      interviewMode === "Technical" &&
      !/safe|approv|authoriz|escalat|verify|evidence/i.test(combined)
    )
      flags.push(
        "Say what you checked, which changes were approved, and how you tested the fix.",
      );
    if (!/result|verified|observed|improved|restored|learn/i.test(combined))
      flags.push("Describe the observed result and what you learned.");
    if (!follow) {
      FO(
        interviewMode === "Technical"
          ? "What result would contradict your diagnosis, and how would you verify recovery?"
          : "Which action was yours personally, why did you choose it, and what evidence supports your result?",
      );
      return;
    }
    CO(
      flags.length
        ? flags
        : [
            "Your answer explains your role, decisions, and outcome. A reviewer can help you check the technical details and trim anything unclear.",
          ],
    );
    const bank = practiceBank;
    const score = Math.max(0, 100 - flags.length * 20);
    if (draft.recorded) return;
    interviewField("recorded", true);
    S((p) => ({
      ...p,
      interviews: [
        ...p.interviews,
        {
          question: bank[questionIndex % bank.length],
          company,
          answer,
          followup: followAnswer,
          score,
          at: Date.now(),
        },
      ],
      attempts: [
        ...p.attempts,
        {
          id: "interview",
          domain: "Interview",
          score,
          kind: "interview",
          at: Date.now(),
        },
      ],
    }));
  }
  useEffect(() => {
    if (!modal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") MO(false);
      if (e.key === "Tab") {
        const els = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".modal button,.modal input:not([hidden]),.modal summary",
          ),
        );
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modal]);
  if (!loaded) return <div className="loading">Loading your workspace...</div>;
  return (
    <div className="app">
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Dashboard");
          }}
        >
          <span className="brand-symbol">
            <ServerIcon size={22} />
          </span>
          <span>
            DCO<span className="brand-light"> Academy</span>
            <small>DATA CENTER TRAINING</small>
          </span>
        </a>
        <div className="workspace">
          <span className="avatar">AS</span>
          <div>
            <b>Personal workspace</b>
            <small>IT Support → Data Center Operations</small>
          </div>
        </div>
        <small className="nav-label">LEARN</small>
        <nav>
          {nav.map(([n, Icon], i) => (
            <React.Fragment key={n}>
              {n === "Data Center Explorer" && (
                <small className="nav-label divider">HANDS-ON LABS</small>
              )}
              {n === "Interview Academy" && (
                <small className="nav-label divider">
                  INTERVIEW & PROGRESS
                </small>
              )}
              <button
                aria-label={n}
                onClick={() => go(n)}
                className={page === n ? "active" : ""}
              >
                <Icon size={17} />
                <span>{n}</span>
                {n === "Incident Simulator" && (
                  <span className="nav-count">15</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div role="status" aria-live="polite">
            <span
              className={"status-dot " + (saveError ? "status-warning" : "")}
            />
            {syncLabel(
              learningStore.status,
              Boolean(learningStore.user),
              saveError,
            )}
          </div>
          <p>35 lessons · 15 incident labs</p>
          <button className="text-button" onClick={() => MO(true)}>
            Data & preferences <ChevronRight size={13} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => M(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-toggle"
            aria-label="Open navigation"
            onClick={() => M(!mobile)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <span>{page}</span>
          </div>
          <div className="top-actions">
            <button
              className="account-trigger"
              onClick={() => MO(true)}
              aria-label="Account and sync"
            >
              <Cloud size={17} />
              <span>{learningStore.user ? "Account" : "Sign in to sync"}</span>
            </button>
            <button
              className="search-trigger"
              onClick={() => {
                go("Resource Library");
                setTimeout(
                  () => document.getElementById("resource-search")?.focus(),
                  0,
                );
              }}
            >
              <Search size={16} />
              <span>Search lessons and resources</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={() =>
                S((p) => ({
                  ...p,
                  theme: p.theme === "dark" ? "light" : "dark",
                }))
              }
            >
              <Sun size={18} />
            </button>
            <span className="avatar small">AS</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <CompanyPicker
            value={company}
            onChange={(targetCompany) => S((p) => ({ ...p, targetCompany }))}
          />

          {[
            "Data Center Explorer",
            "Hardware Lab",
            "Network & Fiber Lab",
            "Linux Terminal",
            "Incident Simulator",
          ].includes(page) && (
            <p className="shared-lab-label">
              <span className="pill">Shared · AWS & Google</span> General
              technical practice. These simulations are not company runbooks.
            </p>
          )}
          {saveError && (
            <div role="alert" className="error-banner">
              {saveError}
            </div>
          )}
          {page === "Dashboard" && (
            <Dashboard
              state={s}
              account={Boolean(learningStore.user)}
              go={go}
              learn={learn}
              startExam={() => startExam("Diagnostic")}
              openIncident={(id) => {
                SI(id);
                go("Incident Simulator");
              }}
            />
          )}
          {page === "Glossary" && (
            <>
              <PageTitle
                eyebrow="Reference"
                title="Glossary"
                description="Look up a term, check an example, and connect it to what you’re learning."
              />
              <Glossary
                selectedId={termId}
                onSelect={TI}
                bookmarks={s.bookmarks}
                onBookmark={bookmark}
                notes={s.notes}
                onNote={(id, text) =>
                  S((p) => ({ ...p, notes: { ...p.notes, [id]: text } }))
                }
                onLesson={learn}
              />
            </>
          )}
          {page === "Learning Path" && (
            <>
              <PageTitle
                eyebrow="Course"
                title={currentLesson?.title || "Learning path"}
                description={
                  currentLesson
                    ? "Read the lesson, try the activity, and check your understanding."
                    : "Choose a topic or work through the modules in order. You can skip familiar material after taking the diagnostic."
                }
              />
              {currentLesson && mod ? (
                <>
                  <button
                    className="text-button"
                    onClick={() => go("Learning Path")}
                  >
                    ← All modules
                  </button>
                  <div className="lesson-layout">
                    <article className="panel lesson-body">
                      <span className="pill">
                        MODULE {mod.id} · {mod.domain}
                      </span>
                      <CompanyNote moduleId={mod.id} />
                      <h2>{currentLesson.title}</h2>
                      <LessonBody
                        key={"body:" + currentLesson.id}
                        lesson={currentLesson}
                        domain={mod.domain}
                      />
                      <h3>Practice</h3>
                      <p>
                        Choose two possible causes from this lesson. What would
                        you check to tell them apart? Write down the next step
                        and how you would confirm the fix.
                      </p>
                      <textarea
                        aria-label="Lesson practice notes"
                        value={s.notes[currentLesson.id] || ""}
                        onChange={(e) =>
                          S((p) => ({
                            ...p,
                            notes: {
                              ...p.notes,
                              [currentLesson.id]: e.target.value,
                            },
                          }))
                        }
                        placeholder="What I found, what I would check next, and how I would test the fix"
                      />
                      <KnowledgeCheck
                        key={"check:" + currentLesson.id}
                        lesson={currentLesson}
                        saved={s.quizChoices?.[currentLesson.id]}
                        onChange={(value) =>
                          S((p) => ({
                            ...p,
                            quizChoices: {
                              ...p.quizChoices,
                              [currentLesson.id]: value,
                            },
                          }))
                        }
                        onGrade={(score) => {
                          attempt(currentLesson.id, mod.domain, score, "quiz");
                          S((p) => ({
                            ...p,
                            completed:
                              score === 100
                                ? [
                                    ...new Set([
                                      ...p.completed,
                                      currentLesson.id,
                                    ]),
                                  ]
                                : p.completed,
                            reviews: {
                              ...p.reviews,
                              [currentLesson.id]: {
                                due: Date.now() + (score ? 3 : 0.25) * 86400000,
                                interval: score ? 3 : 0.25,
                              },
                            },
                          }));
                          T(
                            score
                              ? "Correct. Lesson completed."
                              : "Review the explanation, then try again when you’re ready.",
                          );
                        }}
                      />
                      <div className="lesson-navigation">
                        <button
                          className="button secondary"
                          disabled={lessons.indexOf(currentLesson) === 0}
                          onClick={() =>
                            learn(
                              lessons[lessons.indexOf(currentLesson) - 1].id,
                            )
                          }
                        >
                          Previous lesson
                        </button>
                        <button
                          className="button primary"
                          disabled={
                            lessons.indexOf(currentLesson) ===
                            lessons.length - 1
                          }
                          onClick={() =>
                            learn(
                              lessons[lessons.indexOf(currentLesson) + 1].id,
                            )
                          }
                        >
                          Next lesson <ArrowRight size={15} />
                        </button>
                      </div>
                      <h3>Sources and applicability</h3>
                      <p className="muted">
                        These references support the underlying concepts. The
                        examples and diagnostic sequences above are academy
                        instruction, not internal AWS or Google procedures.
                      </p>
                      <SourceList
                        ids={[
                          ...new Set(
                            mod.sourceIds.flatMap((id) => sourceMap[id] || []),
                          ),
                        ]}
                      />
                    </article>
                    <aside className="lesson-aside">
                      <div className="panel">
                        <h3>In this module</h3>
                        {mod.lessons.map((l) => (
                          <button
                            className={
                              "list-button " +
                              (l.id === lessonId ? "selected" : "")
                            }
                            key={l.id}
                            onClick={() => learn(l.id)}
                          >
                            {s.completed.includes(l.id) ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              <BookOpen size={15} />
                            )}{" "}
                            {l.title}
                          </button>
                        ))}
                        <button
                          className="button secondary full"
                          onClick={() => bookmark(currentLesson.id)}
                        >
                          <Bookmark size={15} />
                          {s.bookmarks.includes(currentLesson.id)
                            ? "Bookmarked"
                            : "Bookmark lesson"}
                        </button>
                      </div>
                      <div className="panel">
                        <h3>Key terms</h3>
                        <div className="lesson-key-terms">
                          {glossary
                            .filter((e) => e.lessonId === currentLesson.id)
                            .slice(0, 8)
                            .map((e) => (
                              <button key={e.id} onClick={() => openTerm(e.id)}>
                                {e.term}
                                <ArrowUpRight size={12} />
                              </button>
                            ))}
                        </div>
                        <h3>Apply what you learned</h3>
                        <button
                          className="list-button"
                          onClick={() => {
                            const match = scenarios.find(
                              (sc) => sc.domain === mod.domain,
                            );
                            const id = match?.id || scenarios[0].id;
                            SI(id);
                            history.pushState(
                              null,
                              "",
                              routeUrl("Incident Simulator", null, id),
                            );
                            P("Incident Simulator");
                            LI(null);
                            M(false);
                            window.scrollTo(0, 0);
                          }}
                        >
                          Open a related incident <ArrowRight size={15} />
                        </button>
                        <button
                          className="list-button"
                          onClick={() => go("Linux Terminal")}
                        >
                          Practice Linux diagnostics <ArrowRight size={15} />
                        </button>
                      </div>
                    </aside>
                  </div>
                </>
              ) : (
                <>
                  <div className="toolbar">
                    <SearchInput
                      value={query}
                      onChange={Q}
                      placeholder="Search lessons and concepts"
                    />
                    <select
                      aria-label="Filter curriculum domain"
                      value={filter}
                      onChange={(e) => F(e.target.value)}
                    >
                      <option>All</option>
                      {domains.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  {!modules.some(
                    (m) =>
                      (filter === "All" || m.domain === filter) &&
                      (
                        m.title +
                        " " +
                        m.lessons
                          .map((l) => l.title + " " + l.concept)
                          .join(" ")
                      )
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  ) && (
                    <section className="panel empty-state">
                      <h2>No lessons found</h2>
                      <p>Try a shorter search or choose another topic.</p>
                      <button
                        className="button secondary"
                        onClick={() => {
                          Q("");
                          F("All");
                        }}
                      >
                        Show all lessons
                      </button>
                    </section>
                  )}
                  <div className="module-grid">
                    {modules
                      .filter(
                        (m) =>
                          (filter === "All" || m.domain === filter) &&
                          (
                            m.title +
                            " " +
                            m.lessons
                              .map((l) => l.title + " " + l.concept)
                              .join(" ")
                          )
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .map((m) => (
                        <section className="panel curriculum-card" key={m.id}>
                          <div className="section-heading">
                            <span className="module-number">
                              {String(m.id).padStart(2, "0")}
                            </span>
                            <span className="pill">{m.domain}</span>
                          </div>
                          <span className="company-label">
                            {companyScope(m.id)}
                          </span>
                          <h2>{m.title}</h2>
                          <p className="muted">{m.description}</p>
                          <small className="muted">
                            {m.id === 1
                              ? "Start here"
                              : `Recommended prerequisite: module ${m.id - 1}`}{" "}
                            · {m.id < 5 ? "Foundation" : "Technician"}
                          </small>
                          {m.lessons.map((l) => (
                            <button
                              className="lesson-link"
                              key={l.id}
                              onClick={() => learn(l.id)}
                            >
                              {s.completed.includes(l.id) ? (
                                <CheckCircle2
                                  size={16}
                                  className="green-text"
                                />
                              ) : (
                                <BookOpen size={16} />
                              )}
                              <span>{l.title}</span>
                              <ChevronRight size={14} />
                            </button>
                          ))}
                        </section>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
          {page === "Data Center Explorer" && (
            <>
              <PageTitle
                eyebrow="Data center explorer"
                title="Get familiar with the floor"
                description="Look at the racks, server components, and network connections you’ll work with."
              />
              <div className="tabs">
                {["Rack", "Server", "Network"].map((t) => (
                  <button
                    key={t}
                    className={explore === t ? "selected" : ""}
                    onClick={() => EX(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <section className="panel">
                {explore === "Rack" ? (
                  <Rack />
                ) : explore === "Server" ? (
                  <Server />
                ) : (
                  <Topology />
                )}
              </section>
              <div className="two-cards">
                <div className="panel">
                  <h3>Cold aisle → intake → exhaust → hot aisle</h3>
                  <p>
                    Follow the platform’s documented airflow direction. Blanking
                    panels reduce recirculation; cable routing must preserve
                    intakes and service access.
                  </p>
                  <button className="text-button" onClick={() => learn("2-1")}>
                    Learn rack and airflow fundamentals <ArrowRight size={14} />
                  </button>
                </div>
                <div className="panel">
                  <h3>Know the boundary</h3>
                  <p>
                    Trace A/B power from approved records. UPS, switchgear,
                    generators, and electrical work belong with qualified
                    facilities teams.
                  </p>
                  <button className="text-button" onClick={() => learn("2-2")}>
                    Learn redundant power paths <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
          {page === "Hardware Lab" && (
            <>
              <PageTitle
                eyebrow="Hardware lab"
                title="Server hardware"
                description="Select a component to learn what it does, then try identifying it from a fault report."
              />
              <section className="panel">
                <Server
                  state={s.hardware}
                  onChange={(hardware) => S((p) => ({ ...p, hardware }))}
                  onAssess={(score) =>
                    attempt(
                      "component-identification",
                      "Hardware",
                      score,
                      "lab",
                    )
                  }
                />
              </section>
              <div className="lab-grid">
                {scenarios
                  .filter((sc) =>
                    ["Hardware", "Boot & firmware", "Storage"].includes(
                      sc.domain,
                    ),
                  )
                  .map((sc) => (
                    <button
                      className="panel interactive-card"
                      key={sc.id}
                      onClick={() => {
                        SI(sc.id);
                        go("Incident Simulator");
                      }}
                    >
                      <span className="pill">{sc.domain}</span>
                      <h3>{sc.title}</h3>
                      <p className="muted">{sc.symptom}</p>
                      <span className="link">
                        Investigate <ArrowRight size={14} />
                      </span>
                    </button>
                  ))}
              </div>
            </>
          )}
          {page === "Network & Fiber Lab" && (
            <>
              <PageTitle
                eyebrow="Network & fiber lab"
                title="Network and fiber troubleshooting"
                description="Follow the network path, compare optical readings, or investigate a failed link."
              />
              <div className="fiber-intro">
                <img
                  src={`${import.meta.env.BASE_URL}images/fiber-optics.jpg`}
                  alt="Illustrative SFP+ transceivers and capped duplex LC connectors"
                />
                <div>
                  <span className="eyebrow">Before you swap an optic</span>
                  <h2>Check both ends of the link</h2>
                  <p>
                    Compare the module type, fiber, wavelength, speed, and
                    receive power. Matching connector shapes aren’t enough.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => learn("7-1")}
                  >
                    Review optical compatibility <ArrowRight size={15} />
                  </button>
                </div>
              </div>
              <section className="panel">
                <h2>The packet journey</h2>
                <Topology />
                <button
                  className="button primary"
                  onClick={() => {
                    SI("inc-9");
                    go("Incident Simulator");
                  }}
                >
                  Diagnose the VLAN incident <ArrowRight size={15} />
                </button>
              </section>
              <div className="two-cards">
                <section className="panel">
                  <span className="eyebrow cyan-text">Optical readings</span>
                  <h2>Calculate optical loss</h2>
                  <p>
                    Estimate loss from matching directional Tx and Rx readings.
                    Real certification requires calibrated instruments and the
                    approved link design.
                  </p>
                  <div className="optical-path">
                    <span>Tx →</span>
                    <div className="fiber-line" />
                    <span>→ Rx</span>
                  </div>
                  <div className="input-grid">
                    <label>
                      Tx power (dBm)
                      <input
                        type="number"
                        value={optTx}
                        onChange={(e) => OT(Number(e.target.value))}
                      />
                    </label>
                    <label>
                      Rx power (dBm)
                      <input
                        type="number"
                        value={optRx}
                        onChange={(e) => OR(Number(e.target.value))}
                      />
                    </label>
                    <label>
                      Loss allowance (dB)
                      <input
                        type="number"
                        min="0"
                        value={budget}
                        onChange={(e) => BU(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="callout">
                    <strong>
                      {(optTx - optRx).toFixed(1)} dB estimated loss
                    </strong>
                    <p>
                      {optTx - optRx < 0
                        ? "Negative path loss is unexpected for a passive link. Recheck direction, units, and measurement accuracy."
                        : optTx - optRx > budget
                          ? "Exceeds allowance. Investigate approved inspection, loss tests, and compatibility evidence."
                          : "Within this loss allowance. Also verify receiver sensitivity, overload, and the full design margin."}
                    </p>
                  </div>
                  <button className="text-button" onClick={() => learn("7-2")}>
                    Learn dB, dBm, OLTS, and OTDR <ArrowRight size={14} />
                  </button>
                </section>
                <section className="panel">
                  <h2>Fiber troubleshooting cases</h2>
                  {scenarios
                    .filter(
                      (sc) =>
                        sc.domain === "Fiber" || sc.domain === "Networking",
                    )
                    .map((sc) => (
                      <button
                        className="module-row"
                        key={sc.id}
                        onClick={() => {
                          SI(sc.id);
                          go("Incident Simulator");
                        }}
                      >
                        <Network size={19} />
                        <div>
                          <b>{sc.title}</b>
                          <small>{sc.domain} · Practice incident</small>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  <div className="callout warning">
                    <ShieldCheck size={18} />
                    <p>
                      Never look into optical ports or connectors. Use approved
                      inspection equipment and trained procedures.
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "Linux Terminal" && (
            <>
              <PageTitle
                eyebrow="Linux lab"
                title="Linux terminal"
                description="Work through a fault on a practice host. Commands change its files, network state, and services, so you can test your diagnosis."
              />
              <TerminalLab
                state={s.terminal}
                sessions={s.terminals}
                onChange={(terminal) =>
                  S((p) => ({
                    ...p,
                    terminal,
                    terminals: {
                      ...p.terminals,
                      [terminal.labId || "network"]: terminal,
                    },
                  }))
                }
                onChoose={(id) =>
                  S((p) => ({
                    ...p,
                    terminal: p.terminals?.[id] || freshTerminal(id),
                  }))
                }
                onComplete={(id) => {
                  attempt("terminal-" + id, "Linux", 100, "terminal");
                }}
              />
            </>
          )}
          {page === "Incident Simulator" && (
            <>
              <PageTitle
                eyebrow="Incident lab"
                title="Work the incident queue"
                description="Pick a ticket, inspect the evidence, and decide what to do next. Your investigation saves as you work."
              />
              <div className="incident-layout">
                <aside className="panel incident-queue">
                  <h3>
                    Incident queue <span className="pill">15</span>
                  </h3>
                  <input
                    aria-label="Search incidents"
                    placeholder="Search tickets"
                    value={query}
                    onChange={(e) => Q(e.target.value)}
                  />
                  <select
                    aria-label="Incident status"
                    value={incidentFilter}
                    onChange={(e) => IF(e.target.value)}
                  >
                    <option>All</option>
                    <option>Open</option>
                    <option>Closed</option>
                  </select>
                  {scenarios
                    .filter(
                      (sc) =>
                        (sc.title + " " + sc.domain)
                          .toLowerCase()
                          .includes(query.toLowerCase()) &&
                        (incidentFilter === "All" ||
                          (incidentFilter === "Closed"
                            ? s.labs[sc.id]?.closed
                            : !s.labs[sc.id]?.closed)),
                    )
                    .map((sc) => (
                      <button
                        className={
                          "queue-item " +
                          (scenarioId === sc.id ? "selected" : "")
                        }
                        key={sc.id}
                        onClick={() => SI(sc.id)}
                      >
                        <small>
                          DC-{104 + scenarios.indexOf(sc)} · {sc.domain}
                        </small>
                        <b>{sc.title}</b>
                        <span>
                          {s.labs[sc.id]?.closed
                            ? "Verified & closed"
                            : "Open investigation"}
                        </span>
                      </button>
                    ))}
                </aside>
                <section>
                  <div className="panel">
                    <div className="section-heading">
                      <span className="pill orange">
                        {lab.closed ? "Closed" : "Open"}
                      </span>
                      <button
                        className="text-button"
                        onClick={() => {
                          S((p) => ({
                            ...p,
                            labs: { ...p.labs, [scenarioId]: freshLab() },
                          }));
                          T(
                            "Incident restarted. Earlier attempts are still in your history.",
                          );
                        }}
                      >
                        <RotateCcw size={14} />
                        Restart
                      </button>
                    </div>
                    <div className="incident-stepper">
                      {[
                        { name: "Inspect", done: lab.seen.length === 3 },
                        { name: "Diagnose", done: lab.correct },
                        { name: "Repair", done: lab.repaired },
                        { name: "Verify", done: lab.verified },
                      ].map((step, i) => (
                        <div
                          key={step.name}
                          className={step.done ? "done" : ""}
                        >
                          <span>{step.done ? <Check size={12} /> : i + 1}</span>
                          {step.name}
                        </div>
                      ))}
                    </div>
                    <h2>{scenario.title}</h2>
                    <p>{scenario.symptom}</p>
                    <div className="callout">
                      <b>Impact & context</b>
                      <p>
                        {scenario.impact}. All actions in this environment are
                        simulated instructional examples.
                      </p>
                    </div>
                    {["Networking", "Fiber"].includes(scenario.domain) && (
                      <Topology recovered={lab.verified} />
                    )}
                    <h3>1. Gather diagnostic evidence</h3>
                    <div className="evidence-grid">
                      {scenario.evidence.map(([title, text], i) => (
                        <div className="evidence" key={title}>
                          <button
                            className="button secondary"
                            disabled={lab.closed}
                            onClick={() => labAction("inspect", i)}
                          >
                            {lab.seen.includes(i) ? (
                              <Check size={14} />
                            ) : (
                              <Search size={14} />
                            )}{" "}
                            {title}
                          </button>
                          {lab.seen.includes(i) && <p>{text}</p>}
                        </div>
                      ))}
                    </div>
                    <h3>2. Support your diagnosis</h3>
                    <div className="answer-options">
                      {scenario.causes.map((c, i) => (
                        <button
                          disabled={lab.closed}
                          key={c}
                          className={lab.diagnosis === i ? "selected" : ""}
                          onClick={() => labAction("diagnose", i)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {lab.diagnosis !== null && (
                      <p className={lab.correct ? "green-text" : "orange-text"}>
                        {lab.correct
                          ? "That fits the evidence. Review the approved action below."
                          : "That doesn’t fit all the observations yet. Check the evidence before making a change."}
                      </p>
                    )}
                    <h3>3. Repair and check recovery</h3>
                    {lab.correct && (
                      <div className="approved-action">
                        <ShieldCheck size={18} />
                        <div>
                          <b>Approved action</b>
                          <p>{scenario.repair}</p>
                        </div>
                      </div>
                    )}
                    <div className="toolbar wrap">
                      <button
                        className="button primary"
                        disabled={lab.closed}
                        onClick={() => labAction("repair")}
                      >
                        Apply approved action
                      </button>
                      <button
                        className="button secondary"
                        disabled={lab.closed}
                        onClick={() => labAction("verify")}
                      >
                        Verify recovery
                      </button>
                    </div>
                    <details className="alternative-actions">
                      <summary>What if I skip the approved procedure?</summary>
                      <p>
                        This option shows how an unapproved action affects the
                        incident and your practice score.
                      </p>{" "}
                      <button
                        className="button danger"
                        disabled={lab.closed}
                        onClick={() => labAction("unsafe")}
                      >
                        Try unapproved restart
                      </button>
                    </details>
                    <label>
                      Incident handoff
                      <textarea
                        value={lab.note}
                        disabled={lab.closed}
                        onChange={(e) => labAction("note", e.target.value)}
                        placeholder="Which asset was affected? What did you find and change? How did you test it? Include any remaining risk and who owns the follow-up."
                      />
                    </label>
                    <p className="muted small-text">
                      {lab.note.trim().length < 60
                        ? `${60 - lab.note.trim().length} more characters needed for the handoff.`
                        : "Handoff length is sufficient. Check the details before closing."}
                    </p>
                    <button
                      className="button secondary"
                      disabled={lab.closed}
                      onClick={() => labAction("close")}
                    >
                      Close ticket with evidence <CheckCircle2 size={16} />
                    </button>
                    {lab.closed && (
                      <div className="callout">
                        <span className="pill green">
                          Practice score {Math.max(0, 100 - lab.penalties * 12)}{" "}
                          / 100
                        </span>
                        <h3>Debrief: why the diagnosis fits</h3>
                        <p>{scenario.debrief}</p>
                        <p>
                          <b>Verification:</b> {scenario.verify}
                        </p>
                        <p>
                          You might choose a different order in a real incident.
                          Here, reviewing all three evidence groups helps you
                          compare the possible causes before making a change.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="panel spaced">
                    <h3>Decision history</h3>
                    {lab.history.length ? (
                      lab.history.map((h, i) => (
                        <p className="history-item" key={i}>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          {h}
                        </p>
                      ))
                    ) : (
                      <p className="muted">
                        Inspected evidence and actions will appear here.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "Interview Academy" && (
            <>
              <PageTitle
                eyebrow="Interview practice"
                title="Talk through your answer"
                description="Practice a question, answer a follow-up, and get feedback on your answer’s structure."
              />
              <div className="company-note">
                <span className="pill">
                  {companyNames[company]} ·{" "}
                  {interviewMode === "Technical"
                    ? "Technical practice"
                    : "Interview practice"}
                </span>
                <p>
                  {company === "google"
                    ? "Practice hardware, operating-system, network, and teamwork examples for your Google application. These are original rehearsal questions based on the role guide."
                    : "Behavioral questions use Amazon’s Leadership Principles. Technical questions help you explain your diagnosis, decisions, and verification."}
                </p>
                <button
                  className="text-button"
                  onClick={() => go("Career Readiness")}
                >
                  Compare AWS and Google <ArrowRight size={14} />
                </button>
              </div>
              <div className="tabs">
                {(company === "google"
                  ? ["Behavioral", "Technical"]
                  : ["Behavioral", "Technical", "Principles"]
                ).map((t) => (
                  <button
                    className={interviewMode === t ? "selected" : ""}
                    key={t}
                    onClick={() => {
                      IM(t as InterviewPractice["mode"]);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {interviewMode === "Principles" ? (
                <div className="module-grid">
                  {principles.map((p, i) => (
                    <section key={p} className="panel">
                      <span className="eyebrow">
                        PRINCIPLE {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2>{p}</h2>
                      <p>{principleNotes[i]}</p>
                      <p className="muted">
                        <b>Strong evidence:</b> a specific decision, your own
                        action, an observed result, and reflection.{" "}
                        <b>Weak evidence:</b> a slogan or a claim without a
                        concrete example.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => {
                          const n = {
                            ...makeStory(),
                            title: `${p} - my experience`,
                            principles: [p],
                            questions: `Tell me about a time you demonstrated ${p}.`,
                          };
                          S((v) => ({ ...v, stories: [...v.stories, n] }));
                          ST(n.id);
                          go("STAR Story Vault");
                        }}
                      >
                        Develop a real story <ArrowRight size={14} />
                      </button>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="lesson-layout">
                  <section className="panel interview-panel">
                    <span className="pill">
                      {interviewMode.toUpperCase()} PRACTICE ·{" "}
                      {questionIndex + 1}
                    </span>
                    <h2>{practiceBank[questionIndex % practiceBank.length]}</h2>
                    <label>
                      Your response
                      <textarea
                        rows={8}
                        value={answer}
                        onChange={(e) => A(e.target.value)}
                        placeholder={
                          interviewMode === "Technical"
                            ? "Clarify the symptom, explain assumptions, collect evidence, and verify safely."
                            : "Use a real experience. Explain situation, task, your actions, result, and reflection."
                        }
                      />
                    </label>
                    {follow && (
                      <>
                        <div className="callout">
                          <b>Follow-up</b>
                          <p>{follow}</p>
                        </div>
                        <textarea
                          aria-label="Follow-up response"
                          value={followAnswer}
                          onChange={(e) => FA(e.target.value)}
                          rows={4}
                        />
                      </>
                    )}
                    <div className="toolbar wrap">
                      <button
                        className="button primary"
                        disabled={
                          answer.trim().length < 20 ||
                          (Boolean(follow) && followAnswer.trim().length < 20)
                        }
                        onClick={interviewNext}
                      >
                        {follow ? "Get practice feedback" : "Ask a follow-up"}
                        <ArrowRight size={15} />
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => {
                          QI((i) => (i + 1) % practiceBank.length);
                        }}
                      >
                        Next question
                      </button>
                      <button
                        className="text-button"
                        disabled={questionIndex === 0}
                        onClick={() => QI((i) => i - 1)}
                      >
                        Previous question
                      </button>
                    </div>
                    <p className="muted small-text">
                      Your answers save as you type. You can leave and return to
                      this question.
                    </p>
                    {coaching.length > 0 && (
                      <div className="callout">
                        <h3>Feedback on your answer</h3>
                        {coaching.map((c) => (
                          <p key={c}>{c}</p>
                        ))}
                        <small>
                          This checks the structure of your answer. Ask someone
                          familiar with the work to review the technical
                          details.
                        </small>
                      </div>
                    )}
                  </section>
                  <aside className="panel lesson-aside">
                    <h3>What to include</h3>
                    {[
                      "Explain what happened and who was affected.",
                      "Make your part in the work clear.",
                      "Say what you chose to do and why.",
                      "Describe what changed and how you knew.",
                      "Finish with what you learned.",
                    ].map((t, i) => (
                      <p className="checklist-item" key={t}>
                        <span>{i + 1}</span>
                        {t}
                      </p>
                    ))}
                    <button
                      className="button secondary full"
                      onClick={() => go("STAR Story Vault")}
                    >
                      Open your story vault <ArrowRight size={14} />
                    </button>
                    <p className="muted small-text">
                      These are practice questions. Your recruiter can confirm
                      what to expect in your interview.
                    </p>
                    <SourceList
                      ids={
                        company === "google"
                          ? ["google-dct", "google-interview"]
                          : ["aws-lp", "aws-interview"]
                      }
                    />
                  </aside>
                </div>
              )}
            </>
          )}
          {page === "STAR Story Vault" && (
            <>
              <PageTitle
                eyebrow="STAR story vault"
                title="Keep your interview stories here"
                description="Start with something that happened at work or in your homelab. Leave out names, credentials, and private company information."
              />
              <div className="toolbar wrap">
                <button
                  className="button primary"
                  onClick={() => {
                    const st = makeStory();
                    S((p) => ({ ...p, stories: [...p.stories, st] }));
                    ST(st.id);
                  }}
                >
                  Create a story <ArrowRight size={15} />
                </button>
                <select
                  aria-label="Story starting point"
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const st = {
                      ...makeStory(),
                      title: e.target.value,
                      questions: `Recall a real experience: ${e.target.value}. What was your role and what actually happened?`,
                    };
                    S((p) => ({ ...p, stories: [...p.stories, st] }));
                    ST(st.id);
                    e.target.value = "";
                  }}
                >
                  <option value="">Use an experience prompt...</option>
                  {[
                    "A difficult hardware incident",
                    "Troubleshooting connectivity",
                    "Supporting a user during an outage",
                    "Managing competing tickets",
                    "Improving onboarding documentation",
                    "Identity and access troubleshooting",
                    "Escalating with detailed evidence",
                    "Learning an unfamiliar technology",
                    "Preventing repeat incidents",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <button
                  className="button secondary"
                  onClick={() => window.print()}
                >
                  Print story summaries
                </button>
              </div>
              <div className="print-stories">
                {s.stories.map((st) => (
                  <article key={st.id}>
                    <h2>{st.title}</h2>
                    {(
                      [
                        "situation",
                        "task",
                        "actions",
                        "result",
                        "lesson",
                        "evidence",
                        "questions",
                      ] as const
                    ).map((field) => (
                      <section key={field}>
                        <h3>
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </h3>
                        <p>{st[field] || "Not added"}</p>
                      </section>
                    ))}
                    <p>
                      Principles: {st.principles.join(", ") || "Not selected"}
                    </p>
                  </article>
                ))}
              </div>
              <div className="story-layout">
                <aside className="panel">
                  <h3>
                    Your stories{" "}
                    <span className="pill">{s.stories.length}</span>
                  </h3>
                  {s.stories.length ? (
                    s.stories.map((st) => (
                      <button
                        key={st.id}
                        className={
                          "list-button " +
                          (story?.id === st.id ? "selected" : "")
                        }
                        onClick={() => ST(st.id)}
                      >
                        <FolderOpen size={16} />
                        {st.title}
                      </button>
                    ))
                  ) : (
                    <p className="muted">
                      Start with one incident you remember well. Add other
                      examples as you practice.
                    </p>
                  )}
                  <h3 className="spaced">Amazon principle coverage</h3>
                  {principles.map((p) => (
                    <div className="coverage" key={p}>
                      <span>{p}</span>
                      <b>
                        {
                          s.stories.filter((st) => st.principles.includes(p))
                            .length
                        }
                      </b>
                    </div>
                  ))}
                </aside>
                {story ? (
                  <section className="panel">
                    <label>
                      Story title
                      <input
                        value={story.title}
                        onChange={(e) => updateStory({ title: e.target.value })}
                      />
                    </label>
                    <div className="input-grid">
                      {(
                        [
                          "situation",
                          "task",
                          "actions",
                          "result",
                          "lesson",
                          "evidence",
                          "questions",
                        ] as const
                      ).map((field) => (
                        <label
                          key={field}
                          className={field === "actions" ? "wide" : ""}
                        >
                          {
                            {
                              situation: "Situation",
                              task: "Task & personal responsibility",
                              actions: "Actions and why you chose them",
                              result: "Result",
                              lesson: "Lesson learned",
                              evidence: "What you observed or measured",
                              questions: "Questions this story could answer",
                            }[field]
                          }
                          <textarea
                            value={story[field]}
                            rows={field === "actions" ? 5 : 3}
                            onChange={(e) =>
                              updateStory({ [field]: e.target.value })
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <h3>Amazon Leadership Principles (optional)</h3>
                    <p className="muted small-text">
                      Use these tags for Amazon/AWS preparation. Your story can
                      also be used for Google without a principle tag.
                    </p>
                    <div className="chips">
                      {principles.map((p) => (
                        <button
                          key={p}
                          className={
                            story.principles.includes(p) ? "selected" : ""
                          }
                          onClick={() =>
                            updateStory({
                              principles: story.principles.includes(p)
                                ? story.principles.filter((x) => x !== p)
                                : [...story.principles, p],
                            })
                          }
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="callout">
                      <h3>Details worth adding</h3>
                      {storyFeedback(story).length ? (
                        storyFeedback(story).map((f) => <p key={f}>{f}</p>)
                      ) : (
                        <p>
                          You’ve covered the main points. Read it aloud and ask
                          someone who knows the work whether the story is clear
                          and accurate.
                        </p>
                      )}
                    </div>
                    <div className="rehearsal">
                      <div>
                        <b>Rehearse out loud</b>
                        <small>{story.uses} rehearsal starts recorded</small>
                      </div>
                      <select
                        aria-label="Rehearsal duration"
                        value={rehearsalLength}
                        onChange={(e) => RL(Number(e.target.value))}
                      >
                        <option value={120}>2 minutes</option>
                        <option value={240}>4 minutes</option>
                      </select>
                      <button
                        className="button primary"
                        onClick={() => {
                          RH(Date.now());
                          updateStory({ uses: story.uses + 1 });
                        }}
                      >
                        <Play size={15} />
                        Start
                      </button>
                      {rehearsal !== null && (
                        <strong aria-live="polite">
                          {Math.max(
                            0,
                            rehearsalLength -
                              Math.floor((tick - rehearsal) / 1000),
                          )}
                          s
                        </strong>
                      )}
                    </div>
                    <button
                      className="text-button spaced"
                      onClick={() =>
                        T(
                          `Follow-up: ${["What did you personally do that another person might not have done?", "Why did you reject the alternative?", "How do you know the result followed from your actions?", "What would you change next time?"][Math.floor(Math.random() * 4)]}`,
                        )
                      }
                    >
                      Practice a follow-up question <MessageSquare size={15} />
                    </button>
                    <p className="muted small-text">
                      {learningStore.user
                        ? "Your stories save to your account automatically."
                        : "Your stories save in this browser automatically. Sign in to keep them across devices."}{" "}
                      Export a backup if you want a separate copy.
                    </p>
                  </section>
                ) : (
                  <section className="panel empty-state">
                    <FolderOpen size={42} />
                    <h2>No stories yet</h2>
                    <p>
                      Think of a difficult incident, an improved process, or a
                      time you learned something unfamiliar.
                    </p>
                    <button
                      className="button primary"
                      onClick={() => {
                        const st = makeStory();
                        S((p) => ({ ...p, stories: [st] }));
                        ST(st.id);
                      }}
                    >
                      Write your first story
                    </button>
                  </section>
                )}
              </div>
            </>
          )}
          {page === "Practice Exams" && (
            <>
              <PageTitle
                eyebrow="Practice exams"
                title="Check what you know"
                description="Take a diagnostic, focus on a weak topic, or try a longer practice test."
              />
              {examQuestions.length && !examFinished ? (
                <section className="panel exam-panel">
                  <div className="section-heading">
                    <span className="pill">
                      {examMode} · {examIndex + 1} / {examQuestions.length}
                    </span>
                    <span className="muted">
                      <Clock size={14} />{" "}
                      {Math.floor((tick - examStart) / 60000)} min elapsed
                    </span>
                  </div>
                  <div className="progress">
                    <i
                      style={{
                        width: `${(examIndex / examQuestions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="muted small-text">
                    Your answers save as you go. Leave this page and return here
                    to continue.
                  </p>
                  <small className="company-label">
                    {companyScope(
                      modules.find((m) =>
                        m.lessons.includes(examQuestions[examIndex]),
                      )!.id,
                    )}
                  </small>
                  <h2>{examQuestions[examIndex].question}</h2>
                  <div className="answer-options">
                    {examQuestions[examIndex].options.map((o, i) => (
                      <button
                        key={o}
                        disabled={examFeedback}
                        className={examChoice === i ? "selected" : ""}
                        onClick={() => EC(i)}
                      >
                        {String.fromCharCode(65 + i)}. {o}
                      </button>
                    ))}
                  </div>
                  {examFeedback ? (
                    <>
                      <div className="callout">
                        <b>
                          {examChoice === examQuestions[examIndex].answer
                            ? "Correct"
                            : "Review this concept"}
                        </b>
                        <p>{examQuestions[examIndex].explanation}</p>
                      </div>
                      <button
                        className="button primary"
                        onClick={() => {
                          if (examIndex === examQuestions.length - 1) ED(true);
                          else {
                            EI((i) => i + 1);
                            EC(null);
                            EF(false);
                          }
                        }}
                      >
                        {examIndex === examQuestions.length - 1
                          ? "View results"
                          : "Next question"}
                        <ArrowRight size={15} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="button primary"
                      disabled={examChoice === null}
                      onClick={gradeExam}
                    >
                      Check answer
                    </button>
                  )}
                  <button
                    className="text-button spaced"
                    onClick={() => go("Dashboard")}
                  >
                    Save and finish later
                  </button>
                </section>
              ) : (
                <>
                  {examFinished && (
                    <section className="panel">
                      <span className="pill green">Practice complete</span>
                      <h2>
                        {
                          examAnswers.filter(
                            (a, i) => a === examQuestions[i].answer,
                          ).length
                        }{" "}
                        / {examQuestions.length} correct
                      </h2>
                      <p>
                        Questions you missed return for review in six hours.
                        Correct answers return in three days.
                      </p>
                      <button
                        className="button primary"
                        onClick={() => go("Study Planner")}
                      >
                        Build your study plan <ArrowRight size={15} />
                      </button>
                    </section>
                  )}
                  <div className="lab-grid">
                    {[
                      "Diagnostic",
                      "Weak-topic practice",
                      "Mock A",
                      "Mock B",
                      "Mock C",
                    ].map((t, i) => (
                      <button
                        key={t}
                        className="panel interactive-card"
                        onClick={() => startExam(t)}
                      >
                        <Target
                          className={i ? "cyan-text" : "orange-text"}
                          size={25}
                        />
                        <h2>{t}</h2>
                        <p className="muted">
                          {i === 0
                            ? "12 questions to find your starting point."
                            : i === 1
                              ? "10 questions on the topics you’ve practiced least or found difficult."
                              : `${t === "Mock C" ? 20 : t === "Mock A" ? Math.ceil(lessons.length / 2) : Math.floor(lessons.length / 2)} questions · work at your own pace.`}
                        </p>
                        <span className="link">
                          Start assessment <ArrowRight size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="panel spaced">
                    <h2>
                      Spaced review{" "}
                      <span className="pill">{due.length} due</span>
                    </h2>
                    {due.length ? (
                      due.map((l) => (
                        <ReviewCard
                          key={l.id}
                          lesson={l}
                          onReview={(correct) => {
                            const interval = correct
                              ? Math.min(
                                  30,
                                  (s.reviews[l.id]?.interval || 1) * 2,
                                )
                              : 0.25;
                            S((p) => ({
                              ...p,
                              reviews: {
                                ...p.reviews,
                                [l.id]: {
                                  due: Date.now() + interval * 86400000,
                                  interval,
                                },
                              },
                            }));
                            attempt(
                              l.id,
                              modules.find((m) => m.lessons.includes(l))!
                                .domain,
                              correct ? 100 : 0,
                              "quiz",
                            );
                          }}
                        />
                      ))
                    ) : (
                      <p className="muted">
                        Answer assessment questions to start a review schedule.
                      </p>
                    )}
                  </div>
                  <details className="panel spaced">
                    <summary>How mastery is calculated</summary>
                    <p>
                      The latest eight scored attempts per domain are averaged
                      with a 30-day exponential recency weight. Practical lab
                      and terminal attempts count twice as much as quizzes.
                      Incorrect answers reduce the average and trigger a
                      six-hour review; correct answers return after three days.
                      Lesson reads and completion counts do not contribute to
                      mastery. Interview scores check structure only.
                    </p>
                  </details>
                </>
              )}
            </>
          )}
          {page === "Study Planner" && (
            <>
              <PageTitle
                eyebrow="Study planner"
                title="Plan your study time"
                description="Choose a pace that fits your week, then check off tasks as you finish them."
              />
              <section className="panel">
                <h2>{companyNames[company]} study plan</h2>
                <p className="muted">
                  {company === "google"
                    ? "Start with hardware, Linux, and networking, then practice maintenance, media handling, and explaining your work. Behavioral practice uses Google role examples."
                    : "Build the technical foundation, then work through Amazon Leadership Principles and your own examples."}
                </p>
                <div className="input-grid">
                  <label>
                    Pathway
                    <select
                      value={s.planner.days}
                      onChange={(e) =>
                        S((p) => ({
                          ...p,
                          planner: {
                            ...p.planner,
                            days: Number(e.target.value),
                          },
                        }))
                      }
                    >
                      <option value={14}>14-day interview preparation</option>
                      <option value={30}>30-day technical readiness</option>
                      <option value={60}>
                        Self-paced development (60 sessions)
                      </option>
                    </select>
                  </label>
                  <label>
                    Available hours per day
                    <input
                      type="number"
                      min="0.25"
                      max="8"
                      step="0.25"
                      value={s.planner.hours}
                      onChange={(e) =>
                        S((p) => ({
                          ...p,
                          planner: {
                            ...p.planner,
                            hours: Math.max(
                              0.25,
                              Math.min(8, Number(e.target.value)),
                            ),
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Target interview date (optional)
                    <input
                      type="date"
                      value={s.planner.target}
                      onChange={(e) =>
                        S((p) => ({
                          ...p,
                          planner: { ...p.planner, target: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Plan start date
                    <input
                      type="date"
                      value={s.planner.start}
                      onChange={(e) =>
                        S((p) => ({
                          ...p,
                          planner: {
                            ...p.planner,
                            start: e.target.value || p.planner.start,
                          },
                        }))
                      }
                    />
                  </label>
                </div>
                <p className="muted">
                  You have {Math.round(s.planner.hours * 60)} minutes per
                  session: about {Math.round(s.planner.hours * 24)} for reading,{" "}
                  {Math.round(s.planner.hours * 21)} for a lab, and{" "}
                  {Math.round(s.planner.hours * 15)} for review or interview
                  practice. The target date is a reminder; it won’t change the
                  schedule for you.
                </p>
              </section>
              <div className="module-grid">
                {Array.from({ length: s.planner.days }, (_, i) => {
                  const m = planModules[i % planModules.length];
                  const lesson =
                    m.lessons[
                      Math.floor(i / planModules.length) % m.lessons.length
                    ];
                  const related = scenarios.filter(
                    (sc) => sc.domain === m.domain,
                  );
                  const sc =
                    company === "google" && related.length
                      ? related[i % related.length]
                      : scenarios[i % scenarios.length];
                  const start = new Date(s.planner.start + "T12:00:00");
                  start.setDate(start.getDate() + i);
                  const overdue =
                    start.getTime() <
                    new Date(new Date().toDateString()).getTime();
                  return (
                    <section key={i} className="panel">
                      <span className="eyebrow">
                        DAY {i + 1} ·{" "}
                        {start.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <small className="company-label">
                        {companyScope(m.id)}
                      </small>
                      <h3>{m.title}</h3>
                      {overdue &&
                        ![0, 1, 2].every((n) =>
                          s.planner.done.includes(
                            planTaskId(company, s.planner.start, i, n),
                          ),
                        ) && (
                          <span className="pill orange">
                            Unfinished - catch up when you can
                          </span>
                        )}
                      {[
                        `Learn: ${lesson.title}`,
                        `Lab: ${sc.title}`,
                        company === "google"
                          ? "Rehearse a Google behavioral example"
                          : "Review a difficult topic and rehearse a story",
                      ].map((task, j) => {
                        const id = planTaskId(company, s.planner.start, i, j);
                        return (
                          <div className="plan-task" key={id}>
                            <input
                              aria-label={`Complete day ${i + 1} ${task}`}
                              type="checkbox"
                              checked={s.planner.done.includes(id)}
                              onChange={() =>
                                S((p) => ({
                                  ...p,
                                  planner: {
                                    ...p.planner,
                                    done: p.planner.done.includes(id)
                                      ? p.planner.done.filter((x) => x !== id)
                                      : [...p.planner.done, id],
                                  },
                                }))
                              }
                            />
                            <button
                              className="text-button"
                              onClick={() =>
                                j === 0
                                  ? learn(lesson.id)
                                  : j === 1
                                    ? (SI(sc.id), go("Incident Simulator"))
                                    : company === "google"
                                      ? (IM("Behavioral"),
                                        go("Interview Academy"))
                                      : go("STAR Story Vault")
                              }
                            >
                              {task}
                            </button>
                          </div>
                        );
                      })}
                    </section>
                  );
                })}
              </div>
            </>
          )}
          {page === "Resource Library" && (
            <>
              <PageTitle
                eyebrow="Resource library"
                title="Look something up"
                description="Find a lesson, revisit a bookmark, or check the documentation behind an explanation."
              />
              <div className="toolbar">
                <SearchInput
                  id="resource-search"
                  value={query}
                  onChange={Q}
                  placeholder="Search ECC, optics, Linux, leadership..."
                />
                <select
                  aria-label="Resource filter"
                  value={filter}
                  onChange={(e) => F(e.target.value)}
                >
                  {[
                    "All",
                    "Lessons",
                    "Glossary",
                    "Sources",
                    "Bookmarks",
                    "official",
                    "vendor-documented",
                    "community-reported",
                  ].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              {[
                "All",
                "Sources",
                "official",
                "vendor-documented",
                "community-reported",
              ].includes(filter) && (
                <section className="panel">
                  <h2>Documentation and study guides</h2>
                  {!query &&
                    ["All", "Sources", "community-reported"].includes(
                      filter,
                    ) && (
                      <div className="callout">
                        <b>Using the community study guide</b>
                        <p>
                          The GitHub guide is useful for choosing topics and
                          practice questions. Check technical details against
                          the documentation below, and use your own experiences
                          for interview answers. Its interview percentages are
                          community estimates.
                        </p>
                      </div>
                    )}
                  {!sources.some(
                    (sc) =>
                      (filter === "All" ||
                        filter === "Sources" ||
                        sc.type === filter) &&
                      (sc.title + " " + sc.publisher + " " + sc.applicability)
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  ) && (
                    <p className="muted">
                      No documentation matches this search. Try another term.
                    </p>
                  )}
                  <SourceList
                    ids={sources
                      .filter(
                        (sc) =>
                          (filter === "All" ||
                            filter === "Sources" ||
                            sc.type === filter) &&
                          (
                            sc.title +
                            " " +
                            sc.publisher +
                            " " +
                            sc.applicability
                          )
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .map((sc) => sc.id)}
                  />
                </section>
              )}
              {["All", "Glossary", "Bookmarks"].includes(filter) && (
                <section className="panel spaced">
                  <div className="section-heading">
                    <h2>Glossary</h2>
                    <button
                      className="text-button"
                      onClick={() => go("Glossary")}
                    >
                      Browse all {glossary.length} terms{" "}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  {resourceTerms.length ? (
                    <div className="resource-terms">
                      {resourceTerms.slice(0, query ? 12 : 6).map((e) => (
                        <button key={e.id} onClick={() => openTerm(e.id)}>
                          <div>
                            <b>{e.term}</b>
                            <p>{e.definition}</p>
                          </div>
                          <ArrowRight size={16} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">
                      No glossary terms match this search.
                    </p>
                  )}
                </section>
              )}
              {["All", "Lessons", "Bookmarks"].includes(filter) && (
                <div className="module-grid">
                  {!lessons.some(
                    (l) =>
                      (filter !== "Bookmarks" || s.bookmarks.includes(l.id)) &&
                      (l.title + " " + l.concept + " " + l.mechanism)
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  ) && (
                    <section className="panel">
                      <h2>
                        {filter === "Bookmarks" && !query
                          ? "No saved lessons yet"
                          : "No lessons found"}
                      </h2>
                      <p className="muted">
                        {filter === "Bookmarks" && !query
                          ? "Use the bookmark button on a lesson to keep it here."
                          : "Try a shorter search or another topic."}
                      </p>
                    </section>
                  )}
                  {lessons
                    .filter(
                      (l) =>
                        (filter !== "Bookmarks" ||
                          s.bookmarks.includes(l.id)) &&
                        (l.title + " " + l.concept + " " + l.mechanism)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                    )
                    .map((l) => (
                      <section className="panel" key={l.id}>
                        <span className="eyebrow">
                          {modules.find((m) => m.lessons.includes(l))?.domain}
                        </span>
                        <small className="company-label">
                          {companyScope(
                            modules.find((m) => m.lessons.includes(l))!.id,
                          )}
                        </small>
                        <h3>{l.title}</h3>
                        <p className="muted">{l.concept}</p>
                        <div className="section-heading">
                          <button
                            className="text-button"
                            onClick={() => learn(l.id)}
                          >
                            Read and practice <ArrowRight size={14} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Bookmark ${l.title}`}
                            onClick={() => bookmark(l.id)}
                          >
                            <Bookmark
                              size={17}
                              fill={
                                s.bookmarks.includes(l.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        </div>
                      </section>
                    ))}
                </div>
              )}
              <p className="muted small-text">
                References were checked in November 2026. Check current job
                postings and ask your recruiter about the interview.
              </p>
            </>
          )}
          {page === "Career Readiness" && (
            <>
              <PageTitle
                eyebrow="Career readiness"
                title="Get ready to apply"
                description="Compare the role with your experience and keep track of what you still need to prepare."
              />
              <RoleGuide
                notes={s.notes}
                onNote={(key, value) =>
                  S((p) => ({ ...p, notes: { ...p.notes, [key]: value } }))
                }
                onLesson={learn}
                onInterview={() => {
                  IM("Technical");
                  go("Interview Academy");
                }}
              />
              <div className="two-cards spaced">
                <section className="panel">
                  <h2>Experience you can build on</h2>
                  <p>
                    Support tickets, hardware repairs, networking courses, and
                    homelab projects can all give you useful examples. Pick work
                    you know well and explain what you did.
                  </p>
                  {[
                    "Hardware triage → server component isolation",
                    "Network troubleshooting → Layer 1/2 and optical evidence",
                    "Service tickets → incident ownership and shift handoff",
                    "Identity support → access discipline and confidentiality",
                    "Homelab → Linux diagnostics and documented experiments",
                  ].map((t) => (
                    <p className="checklist-item" key={t}>
                      <CheckCircle2 size={17} />
                      {t}
                    </p>
                  ))}
                  <button
                    className="button primary"
                    onClick={() => go("STAR Story Vault")}
                  >
                    Write about your experience
                  </button>
                </section>
                <section className="panel">
                  <span className="pill company-aws">AWS / Amazon</span>
                  <h2>AWS application checklist</h2>
                  {[
                    "Read the specific current job posting and location requirements",
                    "Match the requirements to examples from your work or study",
                    "Ask the recruiter about level, shifts, and loop format",
                    "Write up a lab project and make clear that it was a simulation",
                    "AWS / Amazon: review the 16 Leadership Principles and practice your own stories",
                    "Practice optics, Linux, and safe physical troubleshooting",
                    "Confirm interview time zone, format, location or meeting link, and recruiter contact",
                    "Test microphone, webcam, connection, and backup communication plan",
                    "Review your stories and check any numbers you plan to mention",
                    "Prepare concise questions about training, team responsibilities, and shift expectations",
                  ].map((t, i) => (
                    <label className="plan-task" key={t}>
                      <input
                        type="checkbox"
                        checked={(s.notes["career-checklist"] || "")
                          .split("|")
                          .includes(String(i))}
                        onChange={() => {
                          const a = (s.notes["career-checklist"] || "")
                            .split("|")
                            .filter(Boolean);
                          S((p) => ({
                            ...p,
                            notes: {
                              ...p.notes,
                              "career-checklist": (a.includes(String(i))
                                ? a.filter((x) => x !== String(i))
                                : [...a, String(i)]
                              ).join("|"),
                            },
                          }));
                        }}
                      />
                      {t}
                    </label>
                  ))}
                  <SourceList ids={["aws-dct", "aws-dceo", "aws-interview"]} />
                </section>
              </div>
              <section className="panel spaced">
                <h2>Show how you worked through a problem</h2>
                <p>
                  Describe the problem, the affected equipment, what you
                  checked, the fix, and how you tested it. Add what you’d do
                  differently next time. Label academy exercises as simulations.
                </p>
                <button className="button secondary" onClick={exportData}>
                  <Download size={16} />
                  Export your learning record
                </button>
              </section>
            </>
          )}
          <footer>
            <span>
              DCO Academy <span className="muted">/</span> Data center
              operations training
            </span>
            <span>
              Independent of Amazon, AWS, and Google · Sign in to save across
              devices
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div role="status" className="toast">
          {toast}
          <button aria-label="Dismiss notification" onClick={() => T("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop">
          <section
            className="panel modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preferences-title"
          >
            <div className="section-heading">
              <h2 id="preferences-title">Your data & preferences</h2>
              <button
                autoFocus
                aria-label="Close preferences"
                className="icon-button"
                onClick={() => MO(false)}
              >
                <X />
              </button>
            </div>
            <CloudAccount store={learningStore} />
            <h3>Backups and device data</h3>
            <p>
              Keep a separate copy of your saved work, or import a backup from
              the old website. Signed-in changes save to your account;
              signed-out changes stay in this browser.
            </p>
            <div className="toolbar wrap">
              <button className="button primary" onClick={exportData}>
                <Download size={16} />
                Export backup
              </button>
              <button
                className="button secondary"
                onClick={() => inputFile.current?.click()}
              >
                <Upload size={16} />
                Import backup
              </button>
              <input
                ref={inputFile}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => importData(e.target.files?.[0])}
              />
            </div>
            <p className="muted">
              Import replaces the current progress with the selected backup.
              When you’re signed in, that copy also saves to your account.
            </p>
            <details>
              <summary>
                {learningStore.user
                  ? "Reset account progress"
                  : "Reset browser progress"}
              </summary>
              <p>
                {learningStore.user
                  ? "This clears the lessons, notes, stories, and practice history saved to this account. The change syncs to your other devices. Export a backup first if you want to keep a copy."
                  : "This clears the progress and stories saved in this browser. Export a backup first if you want to keep a copy."}
              </p>
              <button
                className="button danger"
                onClick={() => {
                  S({ ...initial });
                  MO(false);
                  T(
                    learningStore.user
                      ? "Account progress reset. The change will sync."
                      : "Browser progress reset",
                  );
                }}
              >
                {learningStore.user
                  ? "Reset account progress"
                  : "Reset browser progress"}
              </button>
            </details>
          </section>
        </div>
      )}
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
    </div>
  );
}
function SearchInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  id?: string;
}) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
function SourceList({ ids }: { ids: string[] }) {
  return (
    <div className="source-list">
      {sources
        .filter((sc) => ids.includes(sc.id))
        .map((sc) => (
          <div key={sc.id}>
            <span className="pill">{sc.type}</span>
            <a href={sc.url} target="_blank" rel="noreferrer">
              {sc.title}
              <ArrowUpRight size={13} />
            </a>
            <small>
              {sc.publisher} · Reviewed {sc.verified}
            </small>
            <p>{sc.applicability}</p>
          </div>
        ))}
      {!ids.length && <p className="muted">No sources match this search.</p>}
    </div>
  );
}
function LessonBody({ lesson: l, domain }: { lesson: Lesson; domain: string }) {
  const [level, Level] = useState("Technician");
  return (
    <>
      <div className="tabs">
        {["Foundation", "Technician", "Deep Dive"].map((t) => (
          <button
            key={t}
            className={level === t ? "selected" : ""}
            onClick={() => Level(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <h3>The basics</h3>
      <p>{l.concept}</p>
      {level !== "Foundation" && (
        <>
          <h3>How it works</h3>
          <p>{l.mechanism}</p>
        </>
      )}
      <h3>Take a closer look</h3>
      {["Networking", "Fiber", "Linux"].includes(domain) ? (
        <Topology />
      ) : domain === "Hardware" ||
        domain === "Boot & firmware" ||
        domain === "Storage" ? (
        <Server />
      ) : (
        <div className="process-diagram">
          {[
            "Scope & authorize",
            "Gather evidence",
            "Isolate & act",
            "Verify & document",
          ].map((t, i) => (
            <div key={t}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{t}</b>
            </div>
          ))}
        </div>
      )}
      <h3>What can go wrong?</h3>
      <p>{l.failure}</p>
      <h3>Where to start</h3>
      <p>{l.diagnosis}</p>
      {level === "Deep Dive" && (
        <div className="callout">
          <b>Check your reasoning</b>
          <p>
            Imagine one of the parts or connections above fails. What would
            still work? What result would make you reconsider the cause? Write
            down a check that would help you tell the difference.
          </p>
        </div>
      )}
      <h3>Try explaining it aloud</h3>
      <p>
        {l.question} Explain why you chose your answer and what you would check
        next.
      </p>
      <div className="callout">
        <b>Key takeaway</b>
        <p>{l.explanation}</p>
      </div>
    </>
  );
}
function KnowledgeCheck({
  lesson,
  onGrade,
  saved,
  onChange,
}: {
  lesson: Lesson;
  onGrade: (s: number) => void;
  saved?: { choice: number | null; graded: boolean };
  onChange: (value: { choice: number | null; graded: boolean }) => void;
}) {
  const c = saved?.choice ?? null,
    graded = saved?.graded ?? false;
  return (
    <section className="knowledge-check">
      <span className="eyebrow">KNOWLEDGE CHECK</span>
      <h3>{lesson.question}</h3>
      <div className="answer-options">
        {lesson.options.map((o, i) => (
          <button
            key={o}
            className={c === i ? "selected" : ""}
            disabled={graded}
            onClick={() => onChange({ choice: i, graded: false })}
          >
            {o}
          </button>
        ))}
      </div>
      <button
        className="button primary"
        disabled={c === null || graded}
        onClick={() => {
          onChange({ choice: c, graded: true });
          onGrade(c === lesson.answer ? 100 : 0);
        }}
      >
        Check understanding
      </button>
      {graded && (
        <div className="callout">
          <b>{c === lesson.answer ? "Correct" : "Review the reasoning"}</b>
          <p>{lesson.explanation}</p>
          <p>Correct answer: {lesson.options[lesson.answer]}</p>
          <button
            className="text-button"
            onClick={() => {
              onChange({ choice: null, graded: false });
            }}
          >
            Try the question again
          </button>
        </div>
      )}
    </section>
  );
}
function ReviewCard({
  lesson,
  onReview,
}: {
  lesson: Lesson;
  onReview: (c: boolean) => void;
}) {
  const [show, S] = useState(false);
  const [c, C] = useState<number | null>(null);
  return (
    <div className="review-item">
      <h3>{lesson.question}</h3>
      {!show ? (
        <div className="answer-options">
          {lesson.options.map((o, i) => (
            <button
              key={o}
              onClick={() => {
                C(i);
                S(true);
              }}
            >
              {o}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p>{lesson.explanation}</p>
          <button
            className="button secondary"
            onClick={() => onReview(c === lesson.answer)}
          >
            Record {c === lesson.answer ? "correct recall" : "missed recall"}
          </button>
        </>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
