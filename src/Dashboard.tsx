import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { companyModules } from "./companyStudy";
import { modules, lessons } from "./content";
import { scenarios } from "./simulation";
import { mastery, type State } from "./store";
export function Dashboard({
  state: s,
  account = false,
  go,
  learn,
  startExam,
  openIncident,
}: {
  state: State;
  account?: boolean;
  go: (p: string) => void;
  learn: (id: string) => void;
  startExam: () => void;
  openIncident: (id: string) => void;
}) {
  const studyModules = companyModules(s.targetCompany || "aws");
  const studyLessons = studyModules.flatMap((m) => m.lessons);
  const domains = [...new Set(studyModules.map((m) => m.domain))];
  const weak = domains
    .filter((d) => mastery(s, d) !== null)
    .sort((a, b) => mastery(s, a)! - mastery(s, b)!);
  const next =
    (weak.length && mastery(s, weak[0])! < 70
      ? studyModules
          .filter((m) => m.domain === weak[0])
          .flatMap((m) => m.lessons)
          .find((l) => !s.completed.includes(l.id))
      : null) ||
    studyLessons.find((l) => !s.completed.includes(l.id)) ||
    studyLessons[0];
  const active = scenarios.find(
    (sc) =>
      s.labs[sc.id] && !s.labs[sc.id].closed && s.labs[sc.id].history.length,
  );
  const due = lessons.filter((l) => s.reviews[l.id]?.due <= Date.now()).length;
  const doneLabs = new Set(
    s.attempts
      .filter((a) => a.kind === "lab" && scenarios.some((sc) => sc.id === a.id))
      .map((a) => a.id),
  ).size;
  const nextMod = modules.find((m) => m.lessons.includes(next))!;
  return (
    <div className="study-home">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DCO Academy</p>
          <h1>{s.attempts.length ? "Welcome back." : "Ready when you are."}</h1>
          <p className="muted">
            {s.attempts.length
              ? "Pick up a lesson, work through a fault, or review what you missed."
              : "Prepare for an AWS or Google data center technician interview with lessons, troubleshooting labs, and practice questions."}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => go("Study Planner")}
        >
          <CalendarDays size={17} />
          Study plan
        </button>
      </div>
      <div className="company-home-banner">
        <div>
          <span className="pill">AWS / Amazon</span>
          <span className="pill company-google">Google</span>
          <p>
            One technical foundation, with each company’s role and interview
            context clearly marked.
          </p>
        </div>
        <button className="text-button" onClick={() => go("Career Readiness")}>
          Compare the roles <ArrowRight size={15} />
        </button>
      </div>
      <div className="home-layout">
        <section className="home-primary">
          <section className="feature-lesson">
            <div className="feature-photo">
              <img
                src={`${import.meta.env.BASE_URL}images/server-interior.jpg`}
                alt="Illustration of a rack server with its cover removed, showing heatsinks, memory, fans, and drive bays"
              />
              <span className="photo-label">Hardware lab</span>
            </div>
            <div className="feature-description">
              <div className="feature-meta">
                <span className="category-dot" />
                Server hardware<span>12 min</span>
              </div>
              <h2>Inside a rack server</h2>
              <p>
                Find the DIMMs, power supplies, and cooling fans. Learn what
                each part does and what to check when it fails.
              </p>
              <button
                className="button primary"
                onClick={() => go("Hardware Lab")}
              >
                Explore the server
                <ArrowRight size={17} />
              </button>
              <button className="text-button" onClick={() => learn("3-1")}>
                Read the memory lesson <ChevronRight size={14} />
              </button>
            </div>
          </section>
          <div className="section-heading">
            <h2>{active ? "Continue your work" : "Start here"}</h2>
            <span className="muted small-text">
              {s.attempts.length
                ? "Based on your recent practice"
                : "A lesson and a hands-on exercise"}
            </span>
          </div>
          <div className="resume-list">
            <button onClick={() => learn(next.id)} className="resume-item">
              <span className="resume-symbol">
                <BookOpen size={21} />
              </span>
              <div>
                <small>Next lesson · {nextMod.domain}</small>
                <h3>{next.title}</h3>
                <p>
                  {weak.length && mastery(s, weak[0])! < 70
                    ? "A useful topic to revisit after your last assessment."
                    : nextMod.description}
                </p>
              </div>
              <ArrowRight size={19} />
            </button>
            <button
              onClick={() => openIncident(active?.id || "inc-9")}
              className="resume-item"
            >
              <span className="resume-symbol blue">
                <Terminal size={21} />
              </span>
              <div>
                <small>
                  {active ? "In progress" : "Incident lab"} · about 15 min
                </small>
                <h3>
                  {active?.title ||
                    "The link is up. Why is the server offline?"}
                </h3>
                <p>
                  {active
                    ? "Your observations and notes are saved."
                    : "Check the interface, gateway, and switch port to find the fault."}
                </p>
              </div>
              <ArrowRight size={19} />
            </button>
          </div>
          <div className="section-heading spaced">
            <h2>Practice labs</h2>
            <button
              className="text-button"
              onClick={() => go("Incident Simulator")}
            >
              All 15 incidents <ArrowRight size={14} />
            </button>
          </div>
          <div className="practice-grid">
            <button
              className="photo-card"
              onClick={() => go("Network & Fiber Lab")}
            >
              <div className="photo-card-image">
                <img
                  loading="lazy"
                  src={`${import.meta.env.BASE_URL}images/fiber-optics.jpg`}
                  alt="Optical transceivers beside a duplex fiber cable"
                />
                <span className="photo-label">Networking & fiber</span>
              </div>
              <div>
                <h3>Trace a failed optical link</h3>
                <p>
                  Check the optics, compare power readings, and work out where
                  the signal is lost.
                </p>
                <span className="link">
                  Open fiber lab <ArrowRight size={15} />
                </span>
              </div>
            </button>
            <button className="photo-card" onClick={() => go("Linux Terminal")}>
              <div className="terminal-card-image" aria-hidden="true">
                <div>
                  <i />
                  <i />
                  <i />
                </div>
                <pre>
                  <span>$ ip link show eno1</span>
                  {"\n"}2: eno1: &lt;BROADCAST,MULTICAST&gt;{"\n"} state DOWN
                  {"\n\n"}
                  <span>$ journalctl -u NetworkManager</span>
                  {"\n"}eno1: interface disabled
                  <span className="cursor-block">▌</span>
                </pre>
              </div>
              <div>
                <h3>Find out why Linux is offline</h3>
                <p>
                  Use the terminal to inspect the interface, make an approved
                  change, and test it.
                </p>
                <span className="link">
                  Open terminal <ArrowRight size={15} />
                </span>
              </div>
            </button>
          </div>
          <div className="section-heading spaced">
            <h2>Course modules</h2>
            <button className="text-button" onClick={() => go("Learning Path")}>
              View course <ArrowRight size={14} />
            </button>
          </div>
          <div className="home-course-list">
            {studyModules.slice(0, 4).map((m) => (
              <button
                key={m.id}
                className="module-row"
                onClick={() =>
                  learn(
                    m.lessons.find((l) => !s.completed.includes(l.id))?.id ||
                      m.lessons[0].id,
                  )
                }
              >
                <span className="module-number">
                  {String(m.id).padStart(2, "0")}
                </span>
                <div>
                  <b>{m.title}</b>
                  <small>
                    {m.lessons.length} lessons ·{" "}
                    {
                      s.completed.filter((id) =>
                        m.lessons.some((l) => l.id === id),
                      ).length
                    }{" "}
                    complete
                  </small>
                </div>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </section>
        <aside className="home-secondary">
          <section className="panel progress-summary">
            <div className="section-heading">
              <h2>Your progress</h2>
              <span className="pill">
                {account ? "Account" : "This device"}
              </span>
            </div>
            <div className="course-total">
              <strong>
                {Math.round((s.completed.length / lessons.length) * 100)}
                <span>%</span>
              </strong>
              <div>
                <b>
                  {s.completed.length} / {lessons.length}
                </b>
                <small>lessons completed</small>
              </div>
            </div>
            <div className="progress">
              <i
                style={{
                  width: `${(s.completed.length / lessons.length) * 100}%`,
                }}
              />
            </div>
            <div className="progress-details">
              <span>
                <CheckCircle2 size={16} />
                {doneLabs} incidents solved
              </span>
              <span>
                <MessageSquare size={16} />
                {s.stories.length} STAR stories
              </span>
            </div>
          </section>
          <section className="panel skill-overview">
            <h2>Topics to work on</h2>
            <p className="muted">
              {s.attempts.length
                ? "Scores come from quizzes and practical work."
                : "Take the diagnostic to see which topics need more practice."}
            </p>
            {(weak.length
              ? weak.slice(0, 5)
              : ["Hardware", "Networking", "Fiber", "Linux", "Safety"]
            ).map((d) => (
              <button
                key={d}
                className="topic-progress"
                onClick={() => {
                  const m = modules.find((m) => m.domain === d);
                  if (m) learn(m.lessons[0].id);
                }}
              >
                <div>
                  <b>{d}</b>
                  <span>
                    {mastery(s, d) === null
                      ? "Not assessed"
                      : mastery(s, d) + "%"}
                  </span>
                </div>
                <div className="progress">
                  <i style={{ width: `${mastery(s, d) || 0}%` }} />
                </div>
              </button>
            ))}
            <button className="button secondary full" onClick={startExam}>
              {s.exam?.questionIds.length && !s.exam.finished
                ? "Continue practice test"
                : s.attempts.length
                  ? "Retake diagnostic"
                  : "Take diagnostic"}
              <ArrowRight size={15} />
            </button>
            <small className="muted">12 questions · about 10 min</small>
          </section>
          <button
            className="review-banner"
            onClick={() => go("Practice Exams")}
          >
            <RotateCcw size={23} />
            <div>
              <h3>
                {due
                  ? `${due} ${due === 1 ? "concept" : "concepts"} to review`
                  : "No reviews due"}
              </h3>
              <p>
                {due
                  ? "Revisit the questions you’ve practiced."
                  : "Reviews appear after you answer a quiz."}
              </p>
            </div>
            <ChevronRight size={16} />
          </button>
          <section className="panel interview-prompt">
            <span className="label-icon">
              <MessageSquare size={17} />
              Interview prep
            </span>
            <h2>Have a support incident in mind?</h2>
            <p>
              Write down what happened, what you did, and how it turned out. You
              can shape it into a STAR answer from there.
            </p>
            <button
              className="text-button"
              onClick={() => go("STAR Story Vault")}
            >
              Open story vault <ArrowRight size={15} />
            </button>
          </section>
          <button
            className="facility-teaser"
            onClick={() => go("Data Center Explorer")}
          >
            <img
              loading="lazy"
              src={`${import.meta.env.BASE_URL}images/data-center.jpg`}
              alt="Illustrated cold aisle between rows of server racks"
            />
            <span>
              Look around the data center <ArrowUpRightIcon />
            </span>
          </button>
        </aside>
      </div>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={16} style={{ transform: "rotate(-35deg)" }} />;
}
