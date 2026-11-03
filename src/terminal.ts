export type TerminalLabId = "network" | "dns" | "disk" | "service";
export type VirtualFile = { content: string; size?: number; mode?: string };
export type TerminalState = {
  up: boolean;
  cwd: string;
  history: { command: string; output: string; exitCode?: number }[];
  labId?: TerminalLabId;
  files?: Record<string, VirtualFile>;
  directories?: string[];
  serviceRunning?: boolean;
  observed?: string[];
  actions?: string[];
  verified?: string[];
  lastExitCode?: number;
  completed?: boolean;
  commandHistory?: string[];
};
export const terminalLabs = [
  {
    id: "network" as const,
    title: "Restore a network interface",
    description:
      "The host has an address but cannot reach its gateway. Find the fault, then restore connectivity.",
    approval:
      "You may enable eno1 after inspecting its state. Do not change addressing or reboot the host.",
    checks: [
      "Inspect the interface and route",
      "Enable the interface",
      "Verify gateway reachability",
    ],
    commands: [
      "ip link show eno1",
      "ip addr show eno1",
      "ip route",
      "ethtool eno1",
      "journalctl -u NetworkManager",
      "ping -c 4 10.120.0.1",
    ],
    solution: [
      "ip link show eno1",
      "ip route",
      "sudo ip link set eno1 up",
      "ping -c 4 10.120.0.1",
    ],
  },
  {
    id: "dns" as const,
    title: "Fix name resolution",
    description:
      "The gateway responds, but connections to training.example fail. Separate a DNS fault from a link or routing problem.",
    approval:
      "After checking the evidence, you may set /etc/resolv.conf to the approved resolver 10.120.0.53. This fictional host uses an unmanaged resolver file.",
    checks: [
      "Compare IP reachability with DNS and inspect the resolver",
      "Apply the approved resolver",
      "Verify a query using the host’s resolver",
    ],
    commands: [
      "ping -c 4 10.120.0.1",
      "dig training.example",
      "cat /etc/resolv.conf",
      "ip route",
      "dig @10.120.0.53 training.example",
    ],
    solution: [
      "ping -c 4 10.120.0.1",
      "dig training.example",
      "cat /etc/resolv.conf",
      "echo 'nameserver 10.120.0.53' | sudo tee /etc/resolv.conf",
      "dig training.example",
    ],
  },
  {
    id: "disk" as const,
    title: "Recover disk space",
    description:
      "A log archive filled the root filesystem. Locate the space usage and remove only the retired file named in the ticket.",
    approval:
      "You may delete /var/log/archive/old-debug.log after checking usage. Active logs and other system files must stay in place.",
    checks: [
      "Inspect filesystem and directory usage",
      "Remove only the approved archive",
      "Recheck available space",
    ],
    commands: [
      "df -h",
      "du -sh /var/log/*",
      "ls -lh /var/log/archive",
      "cat /home/learner/README.txt",
      'find /var/log -type f -name "*.log"',
    ],
    solution: [
      "df -h",
      "du -sh /var/log/archive",
      "sudo rm /var/log/archive/old-debug.log",
      "df -h",
    ],
  },
  {
    id: "service" as const,
    title: "Bring SSH back online",
    description:
      "The SSH service failed after a configuration change. Read its logs, inspect the config, and validate the repair before restarting.",
    approval:
      "You may change the invalid SSH Port value to 22 in /etc/ssh/sshd_config, validate it, and restart sshd. Leave other settings unchanged.",
    checks: [
      "Read service status, logs, and configuration",
      "Correct the port and restart after validation",
      "Verify service state and the listening socket",
    ],
    commands: [
      "systemctl status sshd",
      "journalctl -u sshd -n 20",
      "cat /etc/ssh/sshd_config",
      "sudo sshd -t",
      "ss -lntp",
    ],
    solution: [
      "systemctl status sshd",
      "journalctl -u sshd",
      "cat /etc/ssh/sshd_config",
      "sudo sed -i 's/222222/22/' /etc/ssh/sshd_config",
      "sudo sshd -t",
      "sudo systemctl restart sshd",
      "systemctl is-active sshd",
      "ss -lntp",
    ],
  },
];
const GiB = 1024 ** 3;
const commands = [
  "help",
  "man",
  "pwd",
  "cd",
  "ls",
  "cat",
  "echo",
  "printf",
  "tee",
  "touch",
  "mkdir",
  "cp",
  "mv",
  "rm",
  "chmod",
  "find",
  "grep",
  "head",
  "tail",
  "less",
  "sort",
  "wc",
  "stat",
  "test",
  "uname",
  "hostnamectl",
  "hostname",
  "uptime",
  "lscpu",
  "free",
  "top",
  "ps",
  "lspci",
  "lsusb",
  "ip",
  "ping",
  "traceroute",
  "mtr",
  "dig",
  "nslookup",
  "ss",
  "ethtool",
  "nmcli",
  "lsblk",
  "df",
  "du",
  "findmnt",
  "mount",
  "smartctl",
  "journalctl",
  "dmesg",
  "systemctl",
  "sshd",
  "curl",
  "which",
  "whoami",
  "id",
  "date",
  "clear",
  "history",
  "sudo",
  "sed",
];
const docs: Record<
  string,
  { purpose: string; usage: string; example: string; fields: string }
> = {
  ip: {
    purpose: "Inspect or change link, address, neighbor, and routing state.",
    usage: "ip [-br|-s] link|addr|route|neigh [show] [dev eno1]",
    example:
      "ip link show eno1\nip -br addr\nip route\nsudo ip link set eno1 up",
    fields:
      "UP is administrative state. LOWER_UP means carrier is available. A default route identifies the next hop, not proof of reachability.",
  },
  ping: {
    purpose: "Test modeled ICMP reachability.",
    usage: "ping [-c COUNT] [-W SECONDS] HOST",
    example: "ping -c 4 10.120.0.1",
    fields:
      "Replies, transmitted/received counts, loss, and RTT. Count defaults to 4 and is limited to 10 in this lab.",
  },
  grep: {
    purpose: "Select matching lines from files or piped output.",
    usage: "grep [-invEc] PATTERN [FILE...]",
    example:
      "journalctl -u sshd | grep -i error\ngrep -n Port /etc/ssh/sshd_config",
    fields:
      "Supports literal text, ^start/$end anchors, and simple | alternatives with -E. Full regular expressions are not implemented.",
  },
  journalctl: {
    purpose: "Read the simulated system journal, optionally filtered by unit.",
    usage: "journalctl [-u UNIT] [-n COUNT] [-b] [--no-pager] [-k]",
    example: "journalctl -u sshd -n 20",
    fields:
      "Each entry has a timestamp, host, unit, and event. A unit filter returns that unit’s events only.",
  },
  systemctl: {
    purpose: "Inspect service state or perform the lab’s approved SSH restart.",
    usage: "systemctl status|is-active|restart UNIT; systemctl --failed",
    example: "systemctl status sshd\nsudo systemctl restart sshd",
    fields:
      "Active state differs from enabled-at-boot state. Restarting invalid configuration fails; validate with sudo sshd -t first.",
  },
  df: {
    purpose: "Read filesystem capacity or inode use.",
    usage: "df [-h|-i] [PATH]",
    example: "df -h /",
    fields:
      "Size, Used, Avail, Use%, and mount point. Compare with du to identify where space is used.",
  },
  du: {
    purpose: "Estimate space used by files and directory trees.",
    usage: "du [-sh] [--max-depth=N] [PATH...]",
    example: "du -sh /var/log/*",
    fields:
      "The disk-space lab represents a large archive with size metadata; it does not allocate a real 16 GiB file.",
  },
  dig: {
    purpose: "Query the modeled DNS resolver.",
    usage: "dig [@SERVER] NAME [+short]",
    example: "dig training.example\ndig @10.120.0.53 training.example +short",
    fields:
      "SERVER identifies the resolver used. Querying a known-good resolver explicitly does not repair the host’s resolver configuration.",
  },
  ls: {
    purpose: "List files in the virtual filesystem.",
    usage: "ls [-lah] [PATH...]",
    example: "ls -lah /etc\nls /var/log",
    fields:
      "Long output includes mode, owner, size, and name. Paths, relative directories, and simple wildcards are supported.",
  },
  cat: {
    purpose: "Read one or more virtual files.",
    usage: "cat [FILE...]",
    example: "cat /etc/resolv.conf",
    fields:
      "Output reflects current file contents, including changes made with tee, redirection, or a permitted sed replacement.",
  },
  sed: {
    purpose: "Apply a simple text substitution to an authorized virtual file.",
    usage: "sudo sed -i 's/OLD/NEW/' FILE",
    example: "sudo sed -i 's/222222/22/' /etc/ssh/sshd_config",
    fields:
      "Only literal substitutions are implemented. SSH configuration changes are restricted to correcting the Port line to 22.",
  },
};
export function freshTerminal(labId: TerminalLabId = "network"): TerminalState {
  const lab = terminalLabs.find((l) => l.id === labId)!;
  return {
    up: labId !== "network",
    cwd: "/home/learner",
    history: [],
    labId,
    serviceRunning: labId !== "service",
    observed: [],
    actions: [],
    verified: [],
    lastExitCode: 0,
    completed: false,
    commandHistory: [],
    directories: [
      "/",
      "/home",
      "/home/learner",
      "/etc",
      "/etc/ssh",
      "/var",
      "/var/log",
      "/var/log/archive",
      "/tmp",
      "/proc",
      "/sys",
      "/dev",
      "/usr",
      "/usr/bin",
    ],
    files: {
      "/home/learner/README.txt": {
        content: `DCO Academy: ${lab.title}\n${lab.description}\n\nApproved scope\n${lab.approval}\n\nThis is a virtual host. No files or commands reach your computer.\n`,
      },
      "/home/learner/notes.txt": { content: "Investigation notes\n" },
      "/etc/hostname": { content: "dco-lab\n" },
      "/etc/resolv.conf": {
        content: `nameserver ${labId === "dns" ? "192.0.2.53" : "10.120.0.53"}\n`,
      },
      "/etc/ssh/sshd_config": {
        content: `# Training host SSH configuration\nPort ${labId === "service" ? "222222" : "22"}\nPermitRootLogin no\nPasswordAuthentication no\n`,
      },
      "/var/log/messages": {
        content:
          "Nov 03 09:10:01 dco-lab kernel: nvme0 controller ready\nNov 03 09:11:04 dco-lab NetworkManager: eno1 initialized\nNov 03 09:12:14 dco-lab sshd: configuration checked\n",
      },
      "/var/log/training.log": {
        content:
          "INFO asset R12-U18 confirmed\nINFO maintenance scope reviewed\nERROR application health check failed\nINFO investigate the underlying dependency\n",
      },
      ...(labId === "disk"
        ? {
            "/var/log/archive/old-debug.log": {
              content:
                "Retired debug archive. Deletion approved by the lab ticket.\n",
              size: 16 * GiB,
            },
          }
        : {}),
    },
  };
}
export function normalizeTerminal(input: TerminalState): TerminalState {
  const labId = terminalLabs.some((l) => l.id === input.labId)
    ? input.labId!
    : "network";
  const base = freshTerminal(labId);
  return {
    ...base,
    ...input,
    labId,
    files: input.files ? structuredClone(input.files) : base.files,
    directories: input.directories ? [...input.directories] : base.directories,
    observed: [...(input.observed || [])],
    actions: [...(input.actions || [])],
    verified: [...(input.verified || [])],
    history: input.history.slice(-250),
    commandHistory: input.commandHistory
      ? [...input.commandHistory]
      : input.history.map((h) => h.command),
  };
}
function pathOf(cwd: string, path = ".") {
  const expanded =
    path === "~"
      ? "/home/learner"
      : path.startsWith("~/")
        ? "/home/learner/" + path.slice(2)
        : path;
  const parts = (
    expanded.startsWith("/") ? expanded : cwd + "/" + expanded
  ).split("/");
  const result: string[] = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") result.pop();
    else result.push(p);
  }
  return "/" + result.join("/");
}
export function tokenize(command: string): string[] {
  const tokens: string[] = [];
  let word = "",
    active = false,
    quote = "",
    escape = false;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (escape) {
      word += c;
      active = true;
      escape = false;
      continue;
    }
    if (c === "\\" && quote !== "'") {
      if (quote === '"' && command[i + 1] === "n") {
        word += "\\n";
        i++;
        active = true;
      } else escape = true;
      continue;
    }
    if (quote) {
      if (c === quote) quote = "";
      else word += c;
      active = true;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      active = true;
      continue;
    }
    if (/\s/.test(c)) {
      if (active) {
        tokens.push(word);
        word = "";
        active = false;
      }
      continue;
    }
    if ("|;&>".includes(c)) {
      if (active) {
        tokens.push(word);
        word = "";
        active = false;
      }
      if ((c === ">" || c === "&") && command[i + 1] === c) {
        tokens.push(c + c);
        i++;
      } else tokens.push(c);
      continue;
    }
    word += c;
    active = true;
  }
  if (quote) throw Error("Unclosed quote. Finish the quoted argument.");
  if (escape) throw Error("Unfinished escape.");
  if (active) tokens.push(word);
  return tokens;
}
function patternMatch(value: string, pattern: string) {
  if (pattern.length > 150) return false;
  const start = pattern.startsWith("^"),
    end = pattern.endsWith("$");
  const p = pattern.slice(start ? 1 : 0, end ? -1 : undefined);
  return start && end
    ? value === p
    : start
      ? value.startsWith(p)
      : end
        ? value.endsWith(p)
        : value.includes(p);
}
function globMatch(value: string, pattern: string) {
  if (pattern.length > 150 || (pattern.match(/\*/g) || []).length > 6)
    return false;
  return new RegExp(
    "^" +
      pattern
        .split("*")
        .map((s) =>
          s
            .split("?")
            .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("[^/]"),
        )
        .join("[^/]*") +
      "$",
  ).test(value);
}
function modeText(mode: string) {
  return mode
    .split("")
    .map((d) => {
      const n = Number(d);
      return (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-");
    })
    .join("");
}
function bytes(file: VirtualFile) {
  return file.size ?? new TextEncoder().encode(file.content).length;
}
function human(n: number) {
  for (const [size, label] of [
    [1024 ** 4, "T"],
    [GiB, "G"],
    [1024 ** 2, "M"],
    [1024, "K"],
  ] as const)
    if (n >= size) return (n / size).toFixed(n % size === 0 ? 0 : 1) + label;
  return String(n);
}
function marked(s: TerminalState, key: string) {
  if (!s.observed!.includes(key)) s.observed!.push(key);
}
function verified(s: TerminalState, key: string) {
  if (!s.verified!.includes(key)) s.verified!.push(key);
}
function recordAction(s: TerminalState, key: string) {
  if (!s.actions!.includes(key)) s.actions!.push(key);
}
function resolver(s: TerminalState) {
  return (
    s.files!["/etc/resolv.conf"]?.content.match(/^nameserver\s+(\S+)/m)?.[1] ||
    ""
  );
}
function portValid(s: TerminalState) {
  return /^Port\s+22\s*$/m.test(
    s.files!["/etc/ssh/sshd_config"]?.content || "",
  );
}
function journals(s: TerminalState, unit: string) {
  const network = [
    `Nov 03 09:12:14 dco-lab NetworkManager[410]: eno1: administratively ${s.labId === "network" ? "down" : "up"}`,
    s.actions!.includes("link-up")
      ? "Nov 03 09:18:02 dco-lab NetworkManager[410]: eno1: carrier acquired, connection activated"
      : `Nov 03 09:12:15 dco-lab NetworkManager[410]: ${s.up ? "connection activated" : "activation blocked: interface disabled"}`,
  ];
  const ssh = [
    "Nov 03 09:12:14 dco-lab sshd[612]: " +
      (s.labId === "service"
        ? "ERROR: /etc/ssh/sshd_config line 2: Badly formatted port number."
        : "Server listening on 0.0.0.0 port 22."),
    ...(s.actions!.includes("ssh-restart")
      ? [
          "Nov 03 09:20:04 dco-lab sshd[725]: Server listening on 0.0.0.0 port 22.",
        ]
      : []),
  ];
  if (unit === "NetworkManager") return network.join("\n");
  if (unit === "sshd" || unit === "ssh") return ssh.join("\n");
  if (unit) return "-- No entries --";
  return [...network, ...ssh].sort().join("\n");
}
function canWrite(
  s: TerminalState,
  p: string,
  root: boolean,
  content?: string,
) {
  if (p.startsWith("/home/learner/") || p.startsWith("/tmp/")) return true;
  if (!root) return false;
  if (s.labId === "dns" && p === "/etc/resolv.conf")
    return (
      content !== undefined &&
      /^\s*nameserver\s+10\.120\.0\.53\s*$/.test(content)
    );
  if (s.labId === "service" && p === "/etc/ssh/sshd_config") {
    const old = s.files![p]?.content || "";
    return (
      content !== undefined &&
      old.replace(/^Port\s+\d+\s*$/m, "Port 22") === content
    );
  }
  return false;
}
function writeFile(
  s: TerminalState,
  p: string,
  content: string,
  root: boolean,
  append = false,
) {
  const actual = append ? (s.files![p]?.content || "") + content : content;
  if (!canWrite(s, p, root, actual))
    return `Permission denied: ${p}. This path or change is outside the lab’s approved scope. No host command executed.`;
  const parent = p.slice(0, p.lastIndexOf("/")) || "/";
  if (!s.directories!.includes(parent)) return `No such directory: ${parent}`;
  const textSize =
    Object.values(s.files!).reduce((n, f) => n + f.content.length, 0) -
    (s.files![p]?.content.length || 0) +
    actual.length;
  if (
    textSize > 131072 ||
    (!s.files![p] && Object.keys(s.files!).length >= 200)
  )
    return "Virtual workspace text limit reached. Remove unneeded learner files.";
  s.files![p] = { content: actual, mode: s.files![p]?.mode || "644" };
  if (p === "/etc/resolv.conf") {
    recordAction(s, "resolver-updated");
    s.verified = s.verified!.filter((x) => x !== "dns");
  }
  if (p === "/etc/ssh/sshd_config") {
    recordAction(s, "ssh-config");
    s.verified = s.verified!.filter((x) => !x.startsWith("ssh-"));
  }
  return "";
}
function expandPaths(s: TerminalState, args: string[]) {
  return args.flatMap((arg) => {
    if (!arg.includes("*") && !arg.includes("?")) return [arg];
    const p = pathOf(s.cwd, arg);
    const candidates = [...Object.keys(s.files!), ...s.directories!].filter(
      (x) => globMatch(x, p),
    );
    return candidates.length ? candidates : [arg];
  });
}
function isHostKnown(host: string) {
  return [
    "10.120.0.1",
    "10.120.0.14",
    "10.120.0.53",
    "10.120.0.80",
    "training.example",
    "localhost",
    "127.0.0.1",
  ].includes(host);
}
type Result = { output: string; code: number; stderr?: string };
const ok = (output = ""): Result => ({ output, code: 0 });
const bad = (stderr: string, code = 1): Result => ({
  output: "",
  stderr,
  code,
});
function execute(s: TerminalState, input: string[], stdin = ""): Result {
  let root = false;
  let a = [...input];
  if (a[0] === "sudo") {
    root = true;
    a.shift();
    if (String(a[0]) === "-n") a.shift();
  }
  const cmd = a.shift() || "";
  const args = a;
  const operands = () => args.filter((x) => !x.startsWith("-"));
  const read = (name: string) => {
    const path = pathOf(s.cwd, name);
    const file = s.files![path];
    if (file) {
      if (path === "/etc/resolv.conf") marked(s, "resolver");
      if (path === "/etc/ssh/sshd_config") marked(s, "service-config");
    }
    return file;
  };
  if (cmd === "help")
    return ok(
      "DCO Academy virtual Linux host\n\n" +
        commands.join("  ") +
        "\n\nUse man COMMAND for examples. Paths, common flags, pipes, ;, &&, and output redirection work within the virtual filesystem. All network targets are fictional; no commands reach your computer. Edit learner files freely. System changes must match the current lab’s approved scope.",
    );
  if (cmd === "man") {
    const d = docs[args[0]];
    return ok(
      d
        ? `${args[0].toUpperCase()} - ${d.purpose}\n\nSYNOPSIS\n${d.usage}\n\nEXAMPLES\n${d.example}\n\nREAD THE OUTPUT\n${d.fields}`
        : commands.includes(args[0])
          ? `${args[0]} - virtual Linux command\nUse the usual paths and simple flags. This lab implements a useful subset, not all Linux options. Type help for the command list.`
          : `No manual entry for ${args[0] || "(missing command)"}`,
    );
  }
  if (cmd === "whoami") return ok(root ? "root" : "learner");
  if (cmd === "id")
    return ok(
      root
        ? "uid=0(root) gid=0(root)"
        : "uid=1000(learner) gid=1000(learner) groups=1000(learner),27(sudo)",
    );
  if (cmd === "pwd") return ok(s.cwd);
  if (cmd === "date")
    return ok("Tue Nov 03 09:20:00 UTC 2026 (training clock)");
  if (cmd === "history")
    return ok(
      s.history
        .map((h, i) => `${String(i + 1).padStart(4)}  ${h.command}`)
        .join("\n"),
    );
  if (cmd === "cd") {
    const p = pathOf(s.cwd, args[0] || "~");
    if (!s.directories!.includes(p))
      return bad(`cd: ${args[0]}: No such directory`);
    s.cwd = p;
    return ok();
  }
  if (cmd === "ls") {
    const options = args.filter((x) => x.startsWith("-")).join("");
    if (
      args.some(
        (x) => x.startsWith("--") && !["--all", "--human-readable"].includes(x),
      )
    )
      return bad("ls: unsupported option in this lab");
    const paths = expandPaths(s, operands().length ? operands() : ["."]);
    const rows: string[] = [];
    for (const value of paths) {
      const p = pathOf(s.cwd, value);
      const file = s.files![p];
      if (!file && !s.directories!.includes(p))
        return bad(`ls: cannot access '${value}': No such file or directory`);
      const entries = file
        ? [p]
        : [...s.directories!, ...Object.keys(s.files!)]
            .filter(
              (x) => x !== p && (x.slice(0, x.lastIndexOf("/")) || "/") === p,
            )
            .sort();
      if (paths.length > 1) rows.push(value + ":");
      for (const x of entries) {
        const f = s.files![x];
        const name = x.split("/").at(-1)!;
        rows.push(
          options.includes("l")
            ? `${f ? "-" + modeText(f.mode || "644") : "drwxr-xr-x"} 1 ${x.startsWith("/home/") ? "learner" : "root"} ${x.startsWith("/home/") ? "learner" : "root"} ${String(f ? (options.includes("h") ? human(bytes(f)) : bytes(f)) : 4096).padStart(6)} Nov 03 09:12 ${name}`
            : name,
        );
      }
    }
    return ok(rows.join(options.includes("l") ? "\n" : "  "));
  }
  if (["cat", "less", "head", "tail", "grep", "wc", "sort"].includes(cmd)) {
    let text = stdin;
    let files: string[] = [];
    let pattern = "";
    let count = 10;
    const flags = args.filter((x) => x.startsWith("-")).join("");
    if (cmd === "grep") {
      let skip = false;
      const parts: string[] = [];
      for (let i = 0; i < args.length; i++) {
        if (skip) {
          skip = false;
          continue;
        }
        if (args[i] === "-e") {
          pattern = args[i + 1] || "";
          skip = true;
          continue;
        }
        if (args[i].startsWith("-")) continue;
        parts.push(args[i]);
      }
      if (!pattern) pattern = parts.shift() || "";
      files = expandPaths(s, parts);
      if (!pattern) return bad("grep: supply a pattern", 2);
      if (/[()[\]{}\\]/.test(pattern) || pattern.length > 150)
        return bad(
          "grep: this lab supports literal text, anchors, and simple -E alternatives; see man grep",
          2,
        );
    } else if (cmd === "head" || cmd === "tail") {
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-n") {
          count = Number(args[++i]);
        } else if (/^-[0-9]+$/.test(args[i])) count = Number(args[i].slice(1));
        else if (!args[i].startsWith("-")) files.push(args[i]);
      }
      if (!Number.isInteger(count) || count < 0 || count > 200)
        return bad(`${cmd}: use a line count from 0 to 200`, 2);
      files = expandPaths(s, files);
    } else files = expandPaths(s, operands());
    if (files.length) {
      const contents = [];
      for (const f of files) {
        const file = read(f);
        if (!file) return bad(`${cmd}: ${f}: No such file`);
        contents.push(file.content);
      }
      text = contents.join("");
    }
    if (!files.length && !stdin && cmd === "cat") return ok();
    const lines = text.replace(/\n$/, "").split("\n");
    if (cmd === "grep") {
      const pats = flags.includes("E") ? pattern.split("|") : [pattern];
      const matches = lines
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => {
          const found = pats.some((p) =>
            patternMatch(
              flags.includes("i") ? line.toLowerCase() : line,
              flags.includes("i") ? p.toLowerCase() : p,
            ),
          );
          return flags.includes("v") ? !found : found;
        });
      return {
        output: flags.includes("c")
          ? String(matches.length)
          : matches
              .map(
                ({ line, i }) =>
                  (flags.includes("n") ? i + 1 + ":" : "") + line,
              )
              .join("\n"),
        code: matches.length ? 0 : 1,
      };
    }
    if (cmd === "head" || cmd === "tail")
      return ok(
        (cmd === "head"
          ? lines.slice(0, count)
          : count
            ? lines.slice(-count)
            : []
        ).join("\n"),
      );
    if (cmd === "wc") {
      const lineCount = (text.match(/\n/g) || []).length;
      return ok(
        flags.includes("l")
          ? String(lineCount)
          : `${lineCount} ${text.trim() ? text.trim().split(/\s+/).length : 0} ${new TextEncoder().encode(text).length}`,
      );
    }
    if (cmd === "sort") {
      const multiplier: Record<string, number> = {
        K: 1024,
        M: 1024 ** 2,
        G: GiB,
        T: 1024 ** 4,
      };
      const number = (line: string) => {
        const m = line.match(/^\s*([\d.]+)([KMGT])?/);
        return m ? Number(m[1]) * (multiplier[m[2]] || 1) : 0;
      };
      lines.sort(
        flags.includes("h") || flags.includes("n")
          ? (a, b) => number(a) - number(b)
          : undefined,
      );
      if (flags.includes("r")) lines.reverse();
      return ok(lines.join("\n"));
    }
    return ok(text);
  }
  if (cmd === "echo" || cmd === "printf") {
    let text = args.join(" ");
    if (cmd === "echo") {
      const noNewline = args[0] === "-n";
      if (noNewline) text = args.slice(1).join(" ");
      text = text
        .replace(/\$\?/g, String(s.lastExitCode || 0))
        .replace(/\$PWD/g, s.cwd)
        .replace(/\$HOME/g, "/home/learner");
      return ok(text + (noNewline ? "" : "\n"));
    }
    let n = 0;
    return ok(
      (args[0] || "")
        .replace(/%s/g, () => args[++n] || "")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t"),
    );
  }
  if (cmd === "tee") {
    const files = operands();
    if (!files.length) return ok(stdin);
    for (const f of files) {
      const error = writeFile(
        s,
        pathOf(s.cwd, f),
        stdin,
        root,
        args.includes("-a"),
      );
      if (error) return bad(error);
    }
    return ok(stdin.replace(/\n$/, ""));
  }
  if (cmd === "touch" || cmd === "mkdir") {
    if (!operands().length) return bad(`${cmd}: missing operand`);
    for (const name of operands()) {
      const p = pathOf(s.cwd, name);
      if (!p.startsWith("/home/learner/") && !p.startsWith("/tmp/"))
        return bad("Permission denied: use the learner workspace or /tmp.");
      if (cmd === "mkdir") {
        const parent = p.slice(0, p.lastIndexOf("/")) || "/";
        if (!args.includes("-p") && !s.directories!.includes(parent))
          return bad("mkdir: parent directory does not exist");
        const pieces = p.split("/").filter(Boolean);
        for (let i = 1; i <= pieces.length; i++) {
          const dir = "/" + pieces.slice(0, i).join("/");
          if (!s.directories!.includes(dir)) s.directories!.push(dir);
        }
      } else {
        const error = writeFile(s, p, s.files![p]?.content || "", root);
        if (error) return bad(error);
      }
    }
    return ok();
  }
  if (cmd === "cp" || cmd === "mv") {
    const values = operands();
    if (values.length !== 2)
      return bad(`${cmd}: supply source and destination`);
    const from = pathOf(s.cwd, values[0]);
    const file = s.files![from];
    if (!file) return bad(`${cmd}: source file not found`);
    const to = pathOf(s.cwd, values[1]);
    const target = s.directories!.includes(to)
      ? to + "/" + from.split("/").at(-1)
      : to;
    if (
      cmd === "mv" &&
      !from.startsWith("/home/learner/") &&
      !from.startsWith("/tmp/")
    )
      return bad("mv: source is outside the workspace");
    const error = writeFile(s, target, file.content, root);
    if (error) return bad(error);
    s.files![target].size = file.size;
    if (cmd === "mv") delete s.files![from];
    return ok();
  }
  if (cmd === "rm") {
    const paths = expandPaths(s, operands()).map((p) => pathOf(s.cwd, p));
    if (!paths.length) return bad("rm: missing operand");
    for (const p of paths) {
      const archive =
        s.labId === "disk" && p === "/var/log/archive/old-debug.log" && root;
      if (!p.startsWith("/home/learner/") && !p.startsWith("/tmp/") && !archive)
        return bad(
          "Removal denied by the lab’s maintenance scope. No host command executed.",
        );
      if (s.directories!.includes(p))
        return bad(
          "Directory removal is not implemented; only virtual files can be removed.",
        );
      if (!s.files![p] && !args.some((x) => x.includes("f")))
        return bad(`rm: ${p}: No such file`);
    }
    for (const p of paths) {
      delete s.files![p];
      if (p === "/var/log/archive/old-debug.log")
        recordAction(s, "archive-removed");
    }
    return ok();
  }
  if (cmd === "chmod") {
    const [mode, name] = operands();
    const p = pathOf(s.cwd, name || "");
    if (!/^[0-7]{3}$/.test(mode || ""))
      return bad("chmod: use a three-digit octal mode in this lab");
    if (!s.files![p]) return bad("chmod: file not found");
    if (!p.startsWith("/home/learner/") && !p.startsWith("/tmp/"))
      return bad("chmod: system permission changes are outside this lab");
    s.files![p].mode = mode;
    return ok();
  }
  if (cmd === "stat") {
    const p = pathOf(s.cwd, operands()[0]);
    const f = s.files![p];
    return f
      ? ok(
          `File: ${p}\nSize: ${bytes(f)}\nAccess: (0${f.mode || "644"}) Uid: ${p.startsWith("/home/") ? "1000/learner" : "0/root"}`,
        )
      : bad("stat: file not found");
  }
  if (cmd === "test") {
    const p = pathOf(s.cwd, args[1] || "");
    return {
      output: "",
      code:
        args[0] === "-f"
          ? s.files![p]
            ? 0
            : 1
          : args[0] === "-d"
            ? s.directories!.includes(p)
              ? 0
              : 1
            : 1,
    };
  }
  if (cmd === "find") {
    const start = pathOf(s.cwd, args[0] || ".");
    if (!s.files![start] && !s.directories!.includes(start))
      return bad(`find: ${start}: No such file or directory`);
    const type = args.includes("-type") ? args[args.indexOf("-type") + 1] : "";
    if (type && !["f", "d"].includes(type))
      return bad("find: this lab supports -type f or -type d");
    const name = args.includes("-name") ? args[args.indexOf("-name") + 1] : "";
    const candidates =
      type === "f"
        ? Object.keys(s.files!)
        : type === "d"
          ? s.directories!
          : [...Object.keys(s.files!), ...s.directories!];
    return ok(
      candidates
        .filter(
          (p) =>
            (p === start || p.startsWith(start === "/" ? "/" : start + "/")) &&
            (!name || globMatch(p.split("/").at(-1)!, name)),
        )
        .sort()
        .join("\n"),
    );
  }
  if (cmd === "sed") {
    if (!args.includes("-i"))
      return bad("sed: this lab supports -i literal substitution; see man sed");
    const values = operands();
    const expression = values[0] || "";
    const match = expression.match(/^s\/([^/]+)\/([^/]*)\/(g?)$/);
    const name = values[1];
    if (!match || !name) return bad("sed: expected 's/OLD/NEW/' FILE");
    const p = pathOf(s.cwd, name);
    const file = read(p);
    if (!file) return bad("sed: file not found");
    const content =
      match[3] === "g"
        ? file.content.split(match[1]).join(match[2])
        : file.content.replace(match[1], match[2]);
    const error = writeFile(s, p, content, root);
    return error ? bad(error) : ok();
  }
  if (cmd === "ip") {
    const values = args.filter(
      (x) => !["-br", "-brief", "-s", "-4"].includes(x),
    );
    const action = values.shift();
    if (["link", "l"].includes(action || "")) {
      if (values[0] === "set") {
        if (!root)
          return bad(
            "RTNETLINK answers: Operation not permitted. Use the approved sudo command.",
          );
        if (s.labId !== "network")
          return bad(
            "Interface changes are outside this lab’s approved scope.",
          );
        const v = values.filter((x) => x !== "dev");
        if (v[1] !== "eno1" || !["up", "down"].includes(v[2]))
          return bad("Usage: sudo ip link set [dev] eno1 up|down", 2);
        s.up = v[2] === "up";
        recordAction(s, s.up ? "link-up" : "link-down");
        s.verified = s.verified!.filter((x) => !["gateway", "dns"].includes(x));
        return ok();
      }
      const target = values.filter((x) => !["show", "dev"].includes(x))[0];
      if (target && !["eno1", "lo"].includes(target))
        return bad(`Device "${target}" does not exist.`);
      marked(s, "link");
      if (args.includes("-br"))
        return ok(
          `lo UNKNOWN 00:00:00:00:00:00\neno1 ${s.up ? "UP" : "DOWN"} 02:00:00:12:00:14`,
        );
      return ok(
        (target === "eno1"
          ? ""
          : "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN\n") +
          (target === "lo"
            ? ""
            : `2: eno1: <BROADCAST,MULTICAST${s.up ? ",UP,LOWER_UP" : ""}> mtu 1500 state ${s.up ? "UP" : "DOWN"}\n    link/ether 02:00:00:12:00:14${args.includes("-s") ? "\n    RX: bytes packets errors dropped\n        228864  2048      0       0\n    TX: bytes packets errors dropped\n        114432  1024      0       0" : ""}`),
      );
    }
    if (["addr", "address", "a"].includes(action || "")) {
      const target = values.filter((x) => !["show", "dev"].includes(x))[0];
      if (target && !["eno1", "lo"].includes(target))
        return bad(`Device "${target}" does not exist.`);
      marked(s, "address");
      return ok(
        args.includes("-br")
          ? `lo UNKNOWN 127.0.0.1/8\neno1 ${s.up ? "UP" : "DOWN"} 10.120.0.14/24`
          : `${target === "eno1" ? "" : "1: lo: <LOOPBACK,UP,LOWER_UP>\n    inet 127.0.0.1/8 scope host lo\n"}${target === "lo" ? "" : `2: eno1: state ${s.up ? "UP" : "DOWN"}\n    inet 10.120.0.14/24 brd 10.120.0.255 scope global eno1`}`,
      );
    }
    if (["route", "r"].includes(action || "")) {
      marked(s, "route");
      if (values[0] === "get")
        return s.up
          ? ok(`${values[1]} via 10.120.0.1 dev eno1 src 10.120.0.14`)
          : bad("RTNETLINK answers: Network is unreachable");
      if (values.some((v) => v !== "show"))
        return bad(
          "Route changes are outside the lab scope. Use ip route show.",
        );
      return ok(
        `default via 10.120.0.1 dev eno1${s.up ? "" : " linkdown"}\n10.120.0.0/24 dev eno1 proto kernel scope link src 10.120.0.14`,
      );
    }
    if (["neigh", "neighbor", "n"].includes(action || ""))
      return ok(
        s.up
          ? "10.120.0.1 dev eno1 lladdr 02:00:00:12:00:01 REACHABLE"
          : "10.120.0.1 dev eno1 INCOMPLETE",
      );
    return bad("Use ip link, ip addr, ip route, or ip neigh. See man ip.", 2);
  }
  if (cmd === "ethtool") {
    const name = operands().at(-1);
    if (name !== "eno1")
      return bad(`Cannot get device settings: ${name || "missing interface"}`);
    marked(s, "link");
    return ok(
      args.includes("-S")
        ? "NIC statistics:\n rx_crc_errors: 0\n rx_dropped: 0\n tx_errors: 0"
        : `Settings for eno1:\n Speed: ${s.up ? "10000Mb/s" : "Unknown!"}\n Duplex: ${s.up ? "Full" : "Unknown!"}\n Auto-negotiation: on\n Link detected: ${s.up ? "yes" : "no"}`,
    );
  }
  if (cmd === "ping") {
    let count = 4;
    let host = "";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-c") {
        count = Number(args[++i]);
      } else if (/^-c\d+$/.test(args[i])) count = Number(args[i].slice(2));
      else if (args[i] === "-W") i++;
      else if (args[i] === "-4") continue;
      else if (args[i].startsWith("-"))
        return bad(`ping: unsupported option ${args[i]}`, 2);
      else host = args[i];
    }
    if (!Number.isInteger(count) || count < 1 || count > 10)
      return bad("ping: choose -c 1 through -c 10 in this lab", 2);
    if (!host) return bad("ping: destination required", 2);
    if (!isHostKnown(host))
      return bad(`ping: ${host}: target is not part of this virtual network`);
    if (!["localhost", "127.0.0.1"].includes(host) && !s.up)
      return bad("connect: Network is unreachable");
    if (host === "training.example" && resolver(s) !== "10.120.0.53")
      return bad(
        "ping: training.example: Temporary failure in name resolution",
      );
    if (host === "10.120.0.1") {
      marked(s, "ip-reachable");
      verified(s, "gateway");
    }
    const dest =
      host === "training.example"
        ? "10.120.0.80"
        : host === "localhost"
          ? "127.0.0.1"
          : host;
    return ok(
      `PING ${host} (${dest}) 56(84) bytes of data.\n` +
        Array.from(
          { length: count },
          (_, i) =>
            `64 bytes from ${dest}: icmp_seq=${i + 1} ttl=64 time=0.321 ms`,
        ).join("\n") +
        `\n\n--- ${host} ping statistics ---\n${count} packets transmitted, ${count} received, 0% packet loss\nrtt min/avg/max/mdev = 0.321/0.321/0.321/0.000 ms`,
    );
  }
  if (cmd === "dig" || cmd === "nslookup") {
    let name = "";
    let server = resolver(s);
    let explicit = false;
    for (const arg of args) {
      if (arg.startsWith("@")) {
        server = arg.slice(1);
        explicit = true;
      } else if (!arg.startsWith("+") && !["A", "AAAA"].includes(arg)) {
        if (!name) name = arg;
        else if (cmd === "nslookup") {
          server = arg;
          explicit = true;
        }
      }
    }
    if (!name) return bad(`${cmd}: supply a name`);
    marked(s, "dns-query");
    if (!s.up) return bad(";; communications error: network unreachable");
    if (server !== "10.120.0.53")
      return bad(
        `;; communications error to ${server || "(no resolver)"}#53: timed out\n;; no servers could be reached`,
      );
    if (!["training.example", "dco-lab"].includes(name))
      return ok(
        `;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN\n;; SERVER: ${server}#53`,
      );
    if (args.includes("AAAA"))
      return ok(
        args.includes("+short")
          ? ""
          : `;; ->>HEADER<<- opcode: QUERY, status: NOERROR\n;; ANSWER: 0\n;; SERVER: ${server}#53`,
      );
    if (!explicit) verified(s, "dns");
    const answer = name === "training.example" ? "10.120.0.80" : "10.120.0.14";
    return ok(
      args.includes("+short")
        ? answer
        : cmd === "nslookup"
          ? `Server: ${server}\nAddress: ${server}#53\n\nName: ${name}\nAddress: ${answer}`
          : `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 1242\n;; ANSWER SECTION:\n${name}. 300 IN A ${answer}\n;; Query time: 2 msec\n;; SERVER: ${server}#53`,
    );
  }
  if (cmd === "traceroute" || cmd === "mtr") {
    const host = operands().at(-1);
    if (!host || !isHostKnown(host))
      return bad(`${cmd}: use a modeled destination such as 10.120.0.80`);
    if (!s.up) return bad("Network is unreachable");
    if (host === "training.example" && resolver(s) !== "10.120.0.53")
      return bad("Temporary failure in name resolution");
    return ok(`1  10.120.0.1  0.321 ms\n2  10.120.0.80  0.611 ms`);
  }
  if (cmd === "nmcli")
    return ok(
      `DEVICE TYPE     STATE\neno1   ethernet ${s.up ? "connected" : "disconnected"}\nlo     loopback connected (externally)`,
    );
  if (cmd === "systemctl") {
    const action = args[0];
    const name = (args[1] || "").replace(/\.service$/, "");
    const ssh = ["sshd", "ssh"].includes(name);
    if (
      action === "--failed" ||
      (action === "list-units" && args.includes("--failed"))
    )
      return ok(
        s.serviceRunning
          ? "0 loaded units listed."
          : "UNIT          LOAD   ACTIVE SUB\nsshd.service loaded failed failed",
      );
    if (!["sshd", "ssh", "NetworkManager"].includes(name))
      return bad(`Unit ${name || "(missing)"}.service could not be found.`, 4);
    if (ssh) marked(s, "service-status");
    const running = ssh ? s.serviceRunning : s.up !== undefined;
    if (action === "restart") {
      if (!root) return bad("Access denied: use the approved sudo command.");
      if (!ssh || s.labId !== "service")
        return bad("This service restart is outside the lab’s approved scope.");
      if (!portValid(s)) {
        s.serviceRunning = false;
        return bad(
          "Job for sshd.service failed. See systemctl status sshd and journalctl -u sshd.",
        );
      }
      if (!s.actions!.includes("ssh-validation"))
        return bad(
          "Validate the configuration with sudo sshd -t before the approved restart.",
        );
      s.serviceRunning = true;
      recordAction(s, "ssh-restart");
      return ok();
    }
    if (action === "is-active") {
      if (running && ssh) verified(s, "ssh-active");
      return { output: running ? "active" : "failed", code: running ? 0 : 3 };
    }
    if (action !== "status")
      return bad(
        "Use systemctl status, is-active, --failed, or the approved restart.",
      );
    if (running && ssh) verified(s, "ssh-active");
    return {
      output: `${running ? "●" : "×"} ${name}.service - ${ssh ? "OpenSSH server daemon" : "Network Manager"}\n Loaded: loaded; enabled\n Active: ${running ? "active (running)" : "failed (Result: exit-code)"}\n${running ? " Main PID: " + (ssh ? "725 (sshd)" : "410 (NetworkManager)") : " Process: 612 ExecStart=/usr/sbin/sshd -D (code=exited, status=255)"}\n${ssh && !running ? " Badly formatted port number in /etc/ssh/sshd_config." : ""}`,
      code: running ? 0 : 3,
    };
  }
  if (cmd === "journalctl") {
    let unit = "";
    let n = 200;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-u" || args[i] === "--unit")
        unit = (args[++i] || "").replace(/\.service$/, "");
      else if (args[i].startsWith("--unit="))
        unit = args[i].slice(7).replace(/\.service$/, "");
      else if (args[i] === "-n") n = Number(args[++i]);
    }
    if (unit === "sshd" || unit === "ssh") marked(s, "service-logs");
    if (!Number.isFinite(n) || n < 0 || n > 200)
      return bad("journalctl: use -n 0 through 200");
    if (args.includes("-k")) return ok(kernel(s));
    return ok(
      journals(s, unit)
        .split("\n")
        .slice(-n || Infinity)
        .join("\n"),
    );
  }
  if (cmd === "sshd") {
    if (!root)
      return bad(
        "sshd: use sudo sshd -t for the approved configuration check.",
      );
    if (!args.includes("-t"))
      return bad(
        "Only the non-starting configuration check sshd -t is supported.",
      );
    marked(s, "service-config");
    if (!portValid(s))
      return bad("/etc/ssh/sshd_config line 2: Badly formatted port number.");
    recordAction(s, "ssh-validation");
    return ok();
  }
  if (cmd === "ss") {
    if (s.serviceRunning) verified(s, "ssh-listener");
    return ok(
      "State  Recv-Q Send-Q Local Address:Port Peer Address:Port\n" +
        (s.serviceRunning
          ? 'LISTEN 0      128    0.0.0.0:22         0.0.0.0:* users:(("sshd",pid=725,fd=3))'
          : ""),
    );
  }
  if (cmd === "dmesg") return ok(kernel(s));
  if (cmd === "df") {
    marked(s, "filesystem");
    const archive = s.files!["/var/log/archive/old-debug.log"];
    const used = 4 * GiB + (archive ? bytes(archive) : 0);
    if (!archive && s.labId === "disk") verified(s, "capacity");
    return ok(
      args.includes("-i")
        ? "Filesystem      Inodes IUsed IFree IUse% Mounted on\n/dev/nvme0n1p1 1310720 42000 1268720 4% /"
        : `Filesystem      Size Used Avail Use% Mounted on\n/dev/nvme0n1p1  ${human(20 * GiB)} ${human(used)} ${human(20 * GiB - used)} ${Math.round((used / (20 * GiB)) * 100)}% /`,
    );
  }
  if (cmd === "du") {
    marked(s, "directory-usage");
    let depth = Infinity;
    const names: string[] = [];
    let summary = false,
      readable = false;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--max-depth=")) depth = Number(arg.slice(12));
      else if (arg === "-d") depth = Number(args[++i]);
      else if (arg.startsWith("-")) {
        summary ||= arg.includes("s");
        readable ||= arg.includes("h");
      } else names.push(arg);
    }
    if (
      depth !== Infinity &&
      (!Number.isInteger(depth) || depth < 0 || depth > 20)
    )
      return bad("du: use a depth from 0 to 20");
    const targets = expandPaths(s, names.length ? names : ["."]);
    const rows: string[] = [];
    for (const name of targets) {
      const p = pathOf(s.cwd, name);
      if (!s.files![p] && !s.directories!.includes(p))
        return bad(`du: ${name}: No such file or directory`);
      const sum = (path: string) =>
        Object.entries(s.files!)
          .filter(
            ([x]) =>
              x === path || x.startsWith(path === "/" ? "/" : path + "/"),
          )
          .reduce((n, [, f]) => n + bytes(f), 0);
      const show = (path: string) =>
        `${readable ? human(sum(path)) : Math.ceil(sum(path) / 1024)}\t${path}`;
      if (!summary && !s.files![p])
        for (const d of s.directories!.filter(
          (d) => d !== p && d.startsWith(p === "/" ? "/" : p + "/"),
        )) {
          const level = d.slice(p === "/" ? 1 : p.length + 1).split("/").length;
          if (level <= depth) rows.push(show(d));
        }
      rows.push(
        `${readable ? human(sum(p)) : Math.ceil(sum(p) / 1024)}\t${name}`,
      );
    }
    return ok(rows.join("\n"));
  }
  if (cmd === "lsblk")
    return ok(
      "NAME        MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS\nnvme0n1     259:0    0  20G  0 disk\n└─nvme0n1p1 259:1    0  20G  0 part /",
    );
  if (cmd === "findmnt")
    return ok(
      "TARGET SOURCE           FSTYPE OPTIONS\n/      /dev/nvme0n1p1 ext4   rw,relatime",
    );
  if (cmd === "mount")
    return args.length
      ? bad("Mount changes are outside the lab’s approved scope.")
      : ok("/dev/nvme0n1p1 on / type ext4 (rw,relatime)");
  if (cmd === "smartctl")
    return ok(
      "SMART overall-health self-assessment test result: PASSED\nCritical Warning: 0\nMedia and Data Integrity Errors: 0",
    );
  if (cmd === "uname") {
    if (!args.length || args[0] === "-s") return ok("Linux");
    if (args[0] === "-a") return ok("Linux dco-lab 6.8.0 x86_64 GNU/Linux");
    if (args[0] === "-r") return ok("6.8.0");
    if (args[0] === "-m") return ok("x86_64");
    if (args[0] === "-n") return ok("dco-lab");
    return bad("uname: supported options are -a, -s, -r, -m, and -n");
  }
  if (cmd === "hostname") return ok("dco-lab");
  if (cmd === "hostnamectl")
    return ok(
      "Static hostname: dco-lab\nOperating System: Training Linux\nKernel: Linux 6.8.0\nArchitecture: x86-64",
    );
  if (cmd === "uptime")
    return ok(
      "09:20:00 up 3 days, 2:10, 1 user, load average: 0.08, 0.12, 0.09",
    );
  if (cmd === "lscpu")
    return ok(
      "Architecture: x86_64\nCPU(s): 16\nCore(s) per socket: 8\nSocket(s): 1\nThread(s) per core: 2",
    );
  if (cmd === "free")
    return ok(
      "               total used free shared buff/cache available\nMem:            64Gi 8Gi  40Gi 1Gi    16Gi       54Gi\nSwap:           4Gi  0B   4Gi",
    );
  if (cmd === "lspci")
    return ok(
      "01:00.0 Ethernet controller: Training 10G NIC\n02:00.0 Non-Volatile memory controller: Training NVMe",
    );
  if (cmd === "lsusb")
    return ok("Bus 001 Device 002: Training management keyboard");
  if (cmd === "top" || cmd === "ps")
    return ok(
      "PID USER    %CPU %MEM COMMAND\n1   root     0.0  0.1 systemd\n410 root     0.1  0.2 NetworkManager" +
        (s.serviceRunning ? "\n725 root     0.0  0.1 sshd" : ""),
    );
  if (cmd === "curl") {
    const url = operands().at(-1) || "";
    if (!/^https?:\/\/training\.example\/(health)?$/.test(url))
      return bad(
        "curl: this virtual host models only https://training.example/health",
      );
    if (!s.up) return bad("curl: (7) Network is unreachable", 7);
    if (resolver(s) !== "10.120.0.53")
      return bad("curl: (6) Could not resolve host: training.example", 6);
    return ok(
      args.some((x) => x.includes("I"))
        ? "HTTP/2 200\ncontent-type: application/json"
        : '{"status":"healthy"}',
    );
  }
  if (cmd === "which")
    return commands.includes(args[0])
      ? ok((args[0] === "sshd" ? "/usr/sbin/" : "/usr/bin/") + args[0])
      : bad("");
  return bad(
    `${cmd}: command not found in this virtual host. Type help for available commands.`,
    127,
  );
}
function kernel(s: TerminalState) {
  return `[    2.413] nvme nvme0: controller ready\n[    5.711] eno1: Link is ${s.up ? "Up 10 Gbps Full Duplex" : "Down"}\n[    5.901] EDAC: ECC memory initialized`;
}
export function runCommand(
  input: TerminalState,
  command: string,
): TerminalState {
  const s = normalizeTerminal(input);
  const text = command.trim();
  if (!text) return s;
  s.commandHistory = [...(s.commandHistory || []), text].slice(-150);
  if (text === "clear") return { ...s, history: [] };
  let result: Result = ok();
  const outputs: string[] = [];
  try {
    if (text.length > 4096) throw Error("Command is too long for this lab.");
    if (text.includes("$(") || text.includes("`"))
      throw Error(
        "Shell substitution is not implemented. No host command executed.",
      );
    const tokens = tokenize(text);
    let groups: { tokens: string[]; condition: string }[] = [];
    let group: string[] = [];
    let condition = ";";
    for (const token of tokens) {
      if (token === ";" || token === "&&") {
        groups.push({ tokens: group, condition });
        group = [];
        condition = token;
      } else if (token === "&")
        throw Error("Background jobs are not implemented.");
      else group.push(token);
    }
    groups.push({ tokens: group, condition });
    if (groups.length > 10) throw Error("Use at most ten commands per line.");
    for (const g of groups) {
      if (g.condition === "&&" && result.code !== 0) continue;
      if (!g.tokens.length) continue;
      const pipe: string[][] = [];
      let stage: string[] = [];
      let redirect = "";
      let append = false;
      for (let i = 0; i < g.tokens.length; i++) {
        const token = g.tokens[i];
        if (token === "|") {
          pipe.push(stage);
          stage = [];
        } else if (token === ">" || token === ">>") {
          redirect = g.tokens[++i] || "";
          append = token === ">>";
          if (!redirect || i !== g.tokens.length - 1)
            throw Error("Use a single output file at the end of the command.");
        } else stage.push(token);
      }
      pipe.push(stage);
      if (pipe.length > 6 || pipe.some((p) => !p.length))
        throw Error("Check the pipe syntax. Use at most six non-empty stages.");
      let stdin = "";
      for (const p of pipe) {
        result = execute(s, p, stdin);
        if (result.stderr) outputs.push(result.stderr);
        stdin = result.output;
        if (
          stdin &&
          !stdin.endsWith("\n") &&
          !["echo", "printf", "cat", "less"].includes(p[0])
        )
          stdin += "\n";
        s.lastExitCode = result.code;
      }
      if (redirect) {
        const error = writeFile(
          s,
          pathOf(s.cwd, redirect),
          stdin,
          false,
          append,
        );
        result = error ? bad(error) : ok();
        if (error) outputs.push(error);
      }
      if (result.output) outputs.push(result.output.replace(/\n$/, ""));
      s.lastExitCode = result.code;
    }
  } catch (e) {
    result = bad(
      e instanceof Error ? e.message : "Could not parse this command.",
      2,
    );
    outputs.push(result.stderr || result.output);
  }
  s.lastExitCode = result.code;
  const output = outputs.join("\n");
  s.history.push({
    command: text,
    output:
      output.length > 60000
        ? output.slice(0, 60000) + "\n[output trimmed]"
        : output,
    exitCode: result.code,
  });
  s.history = s.history.slice(-250);
  let stored = s.history.reduce(
    (n, h) => n + h.command.length + h.output.length,
    0,
  );
  while (stored > 150000 && s.history.length > 1) {
    const old = s.history.shift()!;
    stored -= old.command.length + old.output.length;
  }
  return s;
}
export function terminalCheck(input: TerminalState) {
  const s = normalizeTerminal(input);
  const seen = new Set(s.observed);
  const done = new Set(s.actions);
  const v = new Set(s.verified);
  const checks =
    s.labId === "dns"
      ? [
          seen.has("resolver") &&
            seen.has("dns-query") &&
            seen.has("ip-reachable"),
          resolver(s) === "10.120.0.53" && done.has("resolver-updated"),
          v.has("dns"),
        ]
      : s.labId === "disk"
        ? [
            seen.has("filesystem") && seen.has("directory-usage"),
            !s.files!["/var/log/archive/old-debug.log"] &&
              done.has("archive-removed"),
            v.has("capacity"),
          ]
        : s.labId === "service"
          ? [
              seen.has("service-status") &&
                seen.has("service-logs") &&
                seen.has("service-config"),
              portValid(s) &&
                Boolean(s.serviceRunning) &&
                done.has("ssh-validation") &&
                done.has("ssh-restart"),
              v.has("ssh-active") && v.has("ssh-listener"),
            ]
          : [
              seen.has("link") && seen.has("route"),
              s.up && done.has("link-up"),
              s.up && v.has("gateway"),
            ];
  return {
    checks,
    passed: checks.every(Boolean),
    score: Math.round((checks.filter(Boolean).length / 3) * 100),
  };
}
export function terminalCompletions(s: TerminalState, draft: string) {
  const space = draft.lastIndexOf(" ");
  const prefix = draft.slice(space + 1);
  const leading = draft.slice(0, space + 1);
  if (space < 0) return commands.filter((c) => c.startsWith(prefix));
  const candidates = [
    ...Object.keys(normalizeTerminal(s).files!),
    ...(s.directories || []),
  ];
  const absolute = pathOf(s.cwd, prefix);
  return candidates
    .filter((p) => p.startsWith(absolute))
    .map(
      (p) =>
        leading +
        (prefix.startsWith("/")
          ? p
          : p.slice((s.cwd === "/" ? "" : s.cwd).length + 1)) +
        (s.directories?.includes(p) ? "/" : ""),
    );
}

export function isTerminalState(value: unknown): value is TerminalState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as Record<string, unknown>;
  const strings = (v: unknown) =>
    Array.isArray(v) && v.every((x) => typeof x === "string");
  if (
    typeof s.up !== "boolean" ||
    typeof s.cwd !== "string" ||
    !Array.isArray(s.history) ||
    !s.history.every(
      (h: unknown) =>
        h &&
        typeof h === "object" &&
        typeof (h as Record<string, unknown>).command === "string" &&
        typeof (h as Record<string, unknown>).output === "string" &&
        ((h as Record<string, unknown>).exitCode === undefined ||
          Number.isInteger((h as Record<string, unknown>).exitCode)),
    )
  )
    return false;
  if (s.labId !== undefined && !terminalLabs.some((l) => l.id === s.labId))
    return false;
  if (s.files !== undefined) {
    if (!s.files || typeof s.files !== "object" || Array.isArray(s.files))
      return false;
    for (const [p, file] of Object.entries(s.files)) {
      if (
        !p.startsWith("/") ||
        !file ||
        typeof file !== "object" ||
        typeof file.content !== "string" ||
        (file.size !== undefined &&
          (!Number.isFinite(file.size) ||
            file.size < 0 ||
            file.size > 64 * GiB)) ||
        (file.mode !== undefined &&
          (typeof file.mode !== "string" || !/^[0-7]{3}$/.test(file.mode)))
      )
        return false;
    }
  }
  for (const key of [
    "observed",
    "actions",
    "verified",
    "directories",
    "commandHistory",
  ])
    if (s[key] !== undefined && !strings(s[key])) return false;
  if (
    s.directories !== undefined &&
    !(s.directories as string[]).every((p) => p.startsWith("/"))
  )
    return false;
  for (const key of ["completed", "serviceRunning"])
    if (s[key] !== undefined && typeof s[key] !== "boolean") return false;
  return s.lastExitCode === undefined || Number.isInteger(s.lastExitCode);
}
