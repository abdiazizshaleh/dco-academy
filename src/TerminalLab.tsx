import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Terminal as TerminalIcon,
} from "lucide-react";
import {
  freshTerminal,
  normalizeTerminal,
  runCommand,
  terminalCheck,
  terminalCompletions,
  terminalLabs,
  type TerminalState,
  type TerminalLabId,
} from "./terminal";
export function TerminalLab({
  state,
  sessions,
  onChange,
  onChoose,
  onComplete,
}: {
  state?: TerminalState;
  sessions?: Record<string, TerminalState>;
  onChange: (s: TerminalState) => void;
  onChoose: (id: TerminalLabId) => void;
  onComplete: (id: TerminalLabId) => void;
}) {
  const s = normalizeTerminal(state || freshTerminal());
  const lab = terminalLabs.find((l) => l.id === s.labId)!;
  const grade = terminalCheck(s);
  const [draft, D] = useState("");
  const [index, I] = useState(-1);
  const [hint, H] = useState(0);
  const [feedback, F] = useState("");
  const [savedDraft, SD] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (output.current) output.current.scrollTop = output.current.scrollHeight;
  }, [s.history.length]);
  useEffect(() => {
    D("");
    I(-1);
    H(0);
    F("");
  }, [s.labId]);
  function run() {
    if (!draft.trim()) return;
    onChange(runCommand(s, draft));
    D("");
    I(-1);
    SD("");
    F("");
  }
  function fill(cmd: string) {
    D(cmd);
    I(-1);
    input.current?.focus();
  }
  function keydown(e: React.KeyboardEvent<HTMLInputElement>) {
    const history = s.commandHistory || s.history.map((h) => h.command);
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === -1) SD(draft);
      const n = Math.min(index + 1, history.length - 1);
      I(n);
      D(history[history.length - 1 - n] || "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = Math.max(-1, index - 1);
      I(n);
      D(n < 0 ? savedDraft : history[history.length - 1 - n] || "");
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const examples = lab.commands.filter((c) => c.startsWith(draft));
      if (examples.length === 1) {
        D(examples[0]);
        return;
      }
      const options = terminalCompletions(s, draft);
      if (options.length === 1)
        D(options[0] + (!draft.includes(" ") ? " " : ""));
      else if (options.length > 1) {
        let prefix = options[0];
        while (prefix && !options.every((c) => c.startsWith(prefix)))
          prefix = prefix.slice(0, -1);
        if (prefix.length > draft.length) D(prefix);
        else F("Matches: " + options.slice(0, 8).join("   "));
      }
    }
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      onChange({ ...s, history: [] });
    }
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      D("");
      I(-1);
      onChange({
        ...s,
        history: [
          ...s.history,
          { command: draft + "^C", output: "", exitCode: 130 },
        ],
        lastExitCode: 130,
      });
    }
  }
  return (
    <div className="linux-workbench">
      <div className="terminal-lab-picker" aria-label="Linux exercises">
        {terminalLabs.map((l, i) => (
          <button
            key={l.id}
            className={s.labId === l.id ? "selected" : ""}
            onClick={() => onChoose(l.id)}
            aria-pressed={s.labId === l.id}
          >
            <span>
              {sessions?.[l.id]?.completed ? (
                <CheckCircle2 size={15} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <div>
              <b>{l.title}</b>
              <small>
                {
                  [
                    "Interface state & routes",
                    "IP versus DNS",
                    "Filesystem usage",
                    "Logs & service state",
                  ][i]
                }
              </small>
            </div>
          </button>
        ))}
      </div>
      <div className="terminal-mission">
        <div>
          <span className="eyebrow">
            Ticket LX-{terminalLabs.indexOf(lab) + 201} ·{" "}
            {s.completed ? "Completed" : "In progress"}
          </span>
          <h2>{lab.title}</h2>
          <p>{lab.description}</p>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            onChange(freshTerminal(lab.id));
            D("");
            I(-1);
            H(0);
            F("Lab reset. Your earlier scored attempts are still saved.");
          }}
          title="Reset this lab’s virtual host. Other labs and scored attempts are kept."
        >
          <RotateCcw size={15} />
          Reset lab
        </button>
      </div>
      <div className="terminal-scope">
        <CheckCircle2 size={17} />
        <p>
          <b>Approved work:</b> {lab.approval}
        </p>
      </div>
      <div className="terminal-work-grid">
        <section>
          <div className="terminal-window">
            <div className="terminal-bar">
              <span>
                <i />
                <i />
                <i />
              </span>
              <span>learner@dco-lab: {s.cwd}</span>
              <span>Virtual host</span>
            </div>
            <div className="terminal-output" ref={output}>
              <p className="terminal-intro">
                DCO Academy Linux host
                <br />
                Type help for commands or man COMMAND for examples.
                <br />
                Files and network state are simulated and saved with this lab.
              </p>
              <div
                role="log"
                aria-label="Terminal output"
                aria-live="polite"
                aria-relevant="additions"
              >
                {s.history.map((h, i) => (
                  <div className="terminal-entry" key={i}>
                    <div className="terminal-prompt-line">
                      <span className="green-text">learner@dco-lab</span>
                      <span className="muted">:$</span>
                      <span>{h.command}</span>
                      {Boolean(h.exitCode) && (
                        <small className="terminal-exit">
                          exit {h.exitCode}
                        </small>
                      )}
                    </div>
                    <pre>{h.output}</pre>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run();
                }}
              >
                <label className="green-text" htmlFor="command">
                  $
                </label>
                <input
                  ref={input}
                  id="command"
                  aria-label="Terminal command"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={draft}
                  onChange={(e) => {
                    D(e.target.value);
                    I(-1);
                  }}
                  onKeyDown={keydown}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (text.includes("\n")) {
                      e.preventDefault();
                      D(text.trim().replace(/\r?\n/g, "; "));
                    }
                  }}
                />
                <button
                  type="submit"
                  className="terminal-run"
                  aria-label="Run terminal command"
                >
                  <ChevronRight size={18} />
                </button>
              </form>
            </div>
            <div className="terminal-key-hints">
              <span>↑ ↓ History</span>
              <span>Tab Complete</span>
              <span>Ctrl L Clear output</span>
              <span>Ctrl C Cancel line</span>
            </div>
          </div>
          <div className="terminal-verification">
            <button
              className="button primary"
              disabled={s.completed}
              onClick={() => {
                if (grade.passed) {
                  onChange({ ...s, completed: true });
                  onComplete(lab.id);
                  F(
                    lab.id === "network"
                      ? "The gateway is reachable. Lab completed."
                      : "Lab completed. Your Linux practice score is saved.",
                  );
                } else
                  F(
                    "Still to do: " +
                      lab.checks.filter((_, i) => !grade.checks[i]).join("; ") +
                      ".",
                  );
              }}
            >
              {s.completed ? "Lab completed" : "Verify the challenge"}
              <CheckCircle2 size={16} />
            </button>
            <button
              className="text-button"
              onClick={() => onChange({ ...s, history: [] })}
            >
              Clear output
            </button>
          </div>
          {feedback && (
            <p className="terminal-feedback" role="status">
              {feedback}
            </p>
          )}
        </section>
        <aside className="panel terminal-guide">
          <h3>What to check</h3>
          <div className="terminal-objectives">
            {lab.checks.map((step, i) => (
              <div key={step} className={grade.checks[i] ? "done" : ""}>
                <span>{grade.checks[i] ? <Check size={13} /> : i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
          <h3>Useful commands</h3>
          <p className="muted small-text">
            Select one to put it in the terminal, then press Enter.
          </p>
          <div className="command-shortcuts">
            {lab.commands.map((cmd) => (
              <button key={cmd} onClick={() => fill(cmd)}>
                <code>{cmd}</code>
                <ChevronRight size={13} />
              </button>
            ))}
          </div>
          <button
            className="text-button"
            onClick={() => H((n) => Math.min(n + 1, 3))}
          >
            <Lightbulb size={15} />
            Show a hint
          </button>
          {hint > 0 && (
            <div className="terminal-hint">
              <p>
                {hint === 1
                  ? [
                      "Start with administrative state and carrier. An address can be present even when the interface is disabled.",
                      "Compare a query by name with a ping to the gateway IP. Then inspect the configured resolver.",
                      "Use df to find the full filesystem and du to locate the space. Match the file to the approved deletion.",
                      "Read the unit’s journal and its configuration. The service cannot start with an invalid port.",
                    ][terminalLabs.indexOf(lab)]
                  : hint === 2
                    ? lab.approval
                    : "After the approved correction, rerun the checks that demonstrate recovery. Earlier successful checks may no longer describe the current state."}
              </p>
            </div>
          )}
          <details className="terminal-walkthrough">
            <summary>Walk through the solution</summary>
            <p>Run these in order and read the output at each step.</p>
            {lab.solution.map((cmd) => (
              <button
                className="solution-command"
                key={cmd}
                onClick={() => fill(cmd)}
              >
                <code>{cmd}</code>
                <ChevronRight size={13} />
              </button>
            ))}
          </details>
          <details className="terminal-walkthrough">
            <summary>What this terminal supports</summary>
            <p>
              Virtual files, relative paths, common flags, simple pipes, output
              redirection, and the approved repairs. There is no connection to
              your computer or an external host. Programs such as top and less
              show snapshots rather than an interactive process.
            </p>
            <button className="text-button" onClick={() => fill("help")}>
              View all commands <TerminalIcon size={14} />
            </button>
          </details>
        </aside>
      </div>
    </div>
  );
}
