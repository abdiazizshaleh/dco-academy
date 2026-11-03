export type Scenario = {
  id: string;
  title: string;
  domain: string;
  impact: string;
  symptom: string;
  evidence: [string, string][];
  causes: string[];
  correct: number;
  repair: string;
  verify: string;
  debrief: string;
};
const rows: [
  string,
  string,
  string,
  string,
  [string, string][],
  string[],
  number,
  string,
  string,
  string,
][] = [
  [
    "No host power",
    "Boot & firmware",
    "Single compute host unavailable",
    "Host is off; management responds.",
    [
      [
        "Identity & scope",
        "Ticket DC-104, asset R12-U18. Compute service drained. Diagnostic access approved; no facilities work permitted.",
      ],
      [
        "Management telemetry",
        "PSU 1 input present; PSU 2 input present. Board power fault event at 09:14.",
      ],
      ["Physical indicators", "Both PSU input LEDs green. Host power LED off."],
    ],
    ["Missing building feed", "System-board power fault", "DNS outage"],
    1,
    "Escalate board fault for authorized service",
    "Post-service management health normal; POST completes and host service checks pass.",
    "Both inputs were present. The board event supports escalation for board service rather than an upstream electrical intervention.",
  ],
  [
    "POST stops on memory",
    "Boot & firmware",
    "Single host cannot return to service",
    "Power and fans on; POST does not complete.",
    [
      ["Identity & scope", "R12-U20. Host drained and maintenance authorized."],
      [
        "POST log",
        "Memory initialization stopped: unsupported DIMM population at A2.",
      ],
      [
        "Inventory",
        "New module installed in A2; platform procedure requires A1 first.",
      ],
    ],
    ["Wrong VLAN", "Unsupported memory population", "OS filesystem full"],
    1,
    "Apply approved vendor memory population procedure",
    "POST completes, expected memory enumerates, diagnostics and host health pass.",
    "POST failed before OS startup. Slot population evidence supports the memory branch.",
  ],
  [
    "Half the RAM is missing",
    "Hardware",
    "Capacity degraded on one host",
    "OS reports 128 GiB of 256 GiB installed.",
    [
      [
        "Identity & scope",
        "R12-U22. Read-only diagnosis approved; replacement requires drained maintenance.",
      ],
      [
        "Inventory",
        "Firmware recognizes 128 GiB; installed inventory totals 256 GiB.",
      ],
      [
        "Hardware events",
        "Uncorrectable memory event; channel B disabled. B1 mapped in platform service documentation.",
      ],
    ],
    [
      "DNS cache",
      "Memory channel disabled after hardware error",
      "Full filesystem",
    ],
    1,
    "Escalate channel fault with slot evidence for approved service",
    "Firmware and OS recognize 256 GiB; diagnostics pass and no new memory events appear in observation window.",
    "Firmware also missed memory, narrowing the fault below the OS. Channel evidence does not justify blindly replacing all DIMMs.",
  ],
  [
    "Blank video console",
    "Boot & firmware",
    "Local display unavailable; service healthy",
    "Monitor shows no signal.",
    [
      [
        "Identity & scope",
        "Local console issue, no customer impact. Read-only tests approved.",
      ],
      [
        "Host reachability",
        "SSH and application health checks pass. Uptime 31 days.",
      ],
      [
        "Console evidence",
        "Remote console displays login. Local monitor input set to unused port.",
      ],
    ],
    ["Failed CPU", "Local display input mismatch", "No host power"],
    1,
    "Correct the approved local display input",
    "Local login display visible; application remains healthy without reboot.",
    "The host was already serving traffic. A disruptive reboot was unnecessary.",
  ],
  [
    "Redundant PSU warning",
    "Hardware",
    "Host running with reduced redundancy",
    "PSU 2 status amber.",
    [
      [
        "Identity & scope",
        "R09-U10. PSU swap only under approved hot-swap procedure after capacity validation.",
      ],
      [
        "Management telemetry",
        "PSU 1 healthy, sufficient supported capacity. PSU 2 internal fault; input present.",
      ],
      [
        "Power-path records",
        "A/B inputs documented independent; no shared upstream alarm.",
      ],
    ],
    ["Failed PSU 2", "OS bootloader", "Wrong DNS resolver"],
    0,
    "Use approved PSU replacement procedure",
    "Both PSUs healthy, redundancy restored, host stable and event checks clear.",
    "Input present plus internal PSU fault supports the component diagnosis; healthy capacity and procedure still gate service.",
  ],
  [
    "Degraded RAID array",
    "Storage",
    "Data accessible with reduced fault tolerance",
    "RAID 5 virtual disk degraded.",
    [
      [
        "Identity & scope",
        "Controller C0, array V0. Approved replacement plan requires exact bay and serial.",
      ],
      ["Controller inventory", "Bay 3 serial D03 FAILED; bays 0,1,2 online."],
      [
        "Health review",
        "Backups reviewed by service owner; survivors healthy. No second failure indicated.",
      ],
    ],
    ["Failed member bay 3", "All four disks failed", "DNS outage"],
    0,
    "Replace confirmed failed member under approved procedure",
    "Rebuild completes after simulated observation interval; virtual disk optimal and workload reads/writes verified.",
    "Removing a healthy member would exceed RAID 5 tolerance. Real rebuilds take time and require monitoring.",
  ],
  [
    "Kernel I/O errors",
    "Storage",
    "One host reports failed storage reads",
    "Application logs show read errors.",
    [
      ["Identity & scope", "R05-U08; collect evidence, no destructive tests."],
      [
        "Kernel logs",
        "09:18 nvme0 timeout; repeated controller reset and I/O errors.",
      ],
      [
        "Path evidence",
        "Other host devices healthy. nvme0 identity mapped; filesystem not full.",
      ],
    ],
    [
      "Full filesystem",
      "NVMe device/path fault needing escalation",
      "Wrong access VLAN",
    ],
    1,
    "Escalate identified storage path with logs",
    "Authorized service completed; no new I/O errors and approved workload validation succeeds.",
    "Timeouts and resets identify a path needing isolation. They do not by themselves prove a specific flash cell failure.",
  ],
  [
    "Ethernet has no carrier",
    "Networking",
    "One host disconnected",
    "eno1 is UP but LOWERLAYERDOWN.",
    [
      [
        "Identity & scope",
        "R07-U12 to switch A port 12; approved patch replacement available.",
      ],
      [
        "Interface evidence",
        "ethtool: Link detected no. Switch admin enabled; correct speed configured.",
      ],
      [
        "Cable test",
        "Approved isolated cable test fails continuity; known-good patch restores carrier.",
      ],
    ],
    ["Bad cable", "DNS failure", "Wrong filesystem permissions"],
    0,
    "Replace identified patch with approved equivalent",
    "Carrier up, stable counters, gateway and service reachable.",
    "Administrative state was enabled. Continuity and known-good comparison support the physical cable diagnosis.",
  ],
  [
    "Carrier up, traffic isolated",
    "Networking",
    "One host unavailable",
    "Link up; host cannot reach its gateway.",
    [
      [
        "Identity & scope",
        "R07-U14, expected access VLAN 120. Network change requires authorized owner.",
      ],
      [
        "Host evidence",
        "IP 10.120.0.14/24, gateway 10.120.0.1, carrier up. Neighbor unresolved.",
      ],
      [
        "Switch evidence",
        "Port access VLAN 130; approved intent VLAN 120. Other VLAN 120 hosts healthy.",
      ],
    ],
    ["Wrong access VLAN", "Failed DIMM", "Failed PSU"],
    0,
    "Request approved VLAN correction by network owner",
    "Neighbor resolves; gateway and application reachable; port counters stable.",
    "Link presence does not validate Layer 2 membership. Actual and intended VLAN disagree.",
  ],
  [
    "IP works, DNS fails",
    "Networking",
    "Name-based connections fail",
    "Destination reachable by IP but not hostname.",
    [
      ["Identity & scope", "R07-U16, only resolver settings changed recently."],
      ["Reachability", "ping 10.120.0.1 succeeds; destination IP reachable."],
      [
        "Resolver evidence",
        "dig times out against 192.0.2.53. Approved resolver is 10.120.0.53.",
      ],
    ],
    ["Wrong resolver configuration", "Broken power feed", "No carrier"],
    0,
    "Apply approved resolver configuration",
    "Name resolves to expected address and application connects by name.",
    "IP reachability and resolver mismatch isolate DNS; replacing the NIC is unsupported.",
  ],
  [
    "Optical receive power low",
    "Fiber",
    "Inter-rack link flaps",
    "Receiver reports low optical power.",
    [
      [
        "Identity & scope",
        "Link F-22. Optical work limited to trained staff using approved inspection procedure.",
      ],
      [
        "DOM readings",
        "Tx -2 dBm, peer Rx -14 dBm; estimated loss 12 dB, design allowance 6 dB.",
      ],
      [
        "Approved inspection",
        "Contamination found on isolated connector with appropriate inspection equipment. Compatible optics and polarity confirmed.",
      ],
    ],
    ["Connector contamination", "Wrong CPU speed", "Healthy optical budget"],
    0,
    "Perform approved inspect-clean-inspect and retest",
    "Rx returns within module limits; certified loss within allowance and link stable.",
    "DOM narrowed the problem; safe inspection identified contamination. Never inspect a port by eye.",
  ],
  [
    "Incompatible optics",
    "Fiber",
    "New link cannot establish",
    "Link remains down after deployment.",
    [
      [
        "Identity & scope",
        "Link F-24. Approved design uses matched 10G LR optics on single-mode fiber.",
      ],
      [
        "Module inventory",
        "End A 10GBASE-LR 1310 nm; end B 10GBASE-SR 850 nm.",
      ],
      [
        "Cable evidence",
        "Single-mode duplex path, polarity traced correctly; connectors inspected per procedure.",
      ],
    ],
    ["Optical mismatch", "RAID fault", "DNS cache"],
    0,
    "Install approved compatible module pair",
    "Supported module inventory matches design; optical levels within limits and service tests pass.",
    "Physical cage fit did not imply wavelength or medium compatibility.",
  ],
  [
    "Thermal throttling",
    "Hardware",
    "One server performance degraded",
    "CPU temperature rises; throttling recorded.",
    [
      [
        "Identity & scope",
        "R04-U06. Follow vendor cooling service procedure; escalate if thresholds unsafe.",
      ],
      [
        "Sensor readings",
        "Fan 3 at 0 RPM; other fans elevated; inlet temperature normal.",
      ],
      [
        "Airflow observation",
        "No visible blockage; correct blanks and airflow; fan fault log predates thermal alarm.",
      ],
    ],
    ["Failed fan", "Hot room only", "Wrong resolver"],
    0,
    "Follow approved fan service procedure",
    "Fan RPM restored; temperature returns within vendor range and throttling stops.",
    "Normal inlet plus failed fan evidence localizes a cooling problem inside the host.",
  ],
  [
    "Many hosts unreachable",
    "Incidents",
    "Ten hosts unavailable simultaneously",
    "Multiple alarms begin within 20 seconds.",
    [
      [
        "Identity & scope",
        "All affected hosts attached to access switch S2; adjacent switch S1 hosts healthy.",
      ],
      [
        "Correlated telemetry",
        "Host BMC power and local health normal. S2 uplink down at first alarm timestamp.",
      ],
      [
        "Topology evidence",
        "Common upstream link outage; network team owns uplink intervention.",
      ],
    ],
    [
      "Ten simultaneous board failures",
      "Shared switch uplink outage",
      "Ten full disks",
    ],
    1,
    "Escalate shared uplink with affected asset list",
    "Network owner restores path; all affected services pass reachability checks and alarms settle.",
    "Common topology and timing favor a shared dependency. Avoid independent host restarts.",
  ],
  [
    "Shift under pressure",
    "Incidents",
    "Broad outage, redundant alert, and routine work",
    "Three tickets compete for attention.",
    [
      [
        "Identity & scope",
        "T1: eight hosts unreachable. T2: one PSU failed, peer healthy. T3: scheduled inventory. No immediate personnel hazard reported.",
      ],
      [
        "Impact assessment",
        "T1 shared uplink suspected; customer service affected. T2 redundancy degraded, service healthy.",
      ],
      [
        "Ownership & constraints",
        "Network owner on call. T2 replacement waits for approved window. Inventory can be deferred.",
      ],
    ],
    [
      "Inventory first",
      "Broad outage triage and owner escalation first",
      "Unapproved PSU change first",
    ],
    1,
    "Escalate broad outage, assign owners and defer routine task",
    "Customer service recovery confirmed; PSU risk handed off with window and owner; inventory rescheduled.",
    "Impact and risk guide priority. Coordination prevents conflicting changes and forgotten residual risk.",
  ],
];
export const scenarios: Scenario[] = rows.map((r, i) => ({
  id: `inc-${i + 1}`,
  title: r[0],
  domain: r[1],
  impact: r[2],
  symptom: r[3],
  evidence: r[4],
  causes: r[5],
  correct: r[6],
  repair: r[7],
  verify: r[8],
  debrief: r[9],
}));
export type LabState = {
  seen: number[];
  history: string[];
  diagnosis: number | null;
  correct: boolean;
  repaired: boolean;
  verified: boolean;
  closed: boolean;
  penalties: number;
  note: string;
};
export const freshLab = (): LabState => ({
  seen: [],
  history: [],
  diagnosis: null,
  correct: false,
  repaired: false,
  verified: false,
  closed: false,
  penalties: 0,
  note: "",
});
export function actLab(
  s: LabState,
  scenario: Scenario,
  action: string,
  value?: number | string,
): LabState {
  const n = { ...s, seen: [...s.seen], history: [...s.history] };
  if (s.closed) return s;
  if (
    action === "inspect" &&
    typeof value === "number" &&
    !n.seen.includes(value)
  ) {
    n.seen.push(value);
    n.history.push(`Inspected: ${scenario.evidence[value][0]}`);
  }
  if (action === "diagnose") {
    n.diagnosis = Number(value);
    n.correct = n.diagnosis === scenario.correct && n.seen.length === 3;
    if (!n.correct) n.penalties += 1;
    n.history.push(
      n.correct
        ? "Diagnosis supported by evidence"
        : "Diagnosis unsupported or incomplete; reassess evidence",
    );
  }
  if (action === "repair") {
    if (n.correct) {
      n.repaired = true;
      n.history.push(scenario.repair);
    } else {
      n.penalties++;
      n.history.push(
        "Change blocked: collect evidence and support the diagnosis first.",
      );
    }
  }
  if (action === "verify") {
    if (n.repaired) {
      n.verified = true;
      n.history.push(scenario.verify);
    } else {
      n.penalties++;
      n.history.push(
        "Recovery not established; no authorized correction recorded.",
      );
    }
  }
  if (action === "unsafe") {
    n.penalties += 3;
    n.history.push(
      "Unsafe/unapproved restart rejected. Confirm scope and authorization.",
    );
  }
  if (action === "note") n.note = String(value);
  if (action === "close") {
    if (n.verified && n.note.trim().length >= 60) {
      n.closed = true;
      n.history.push("Ticket closed with verified recovery and handoff.");
    } else {
      n.penalties++;
      n.history.push(
        "Closure blocked: verify recovery and write a substantive note (60+ characters).",
      );
    }
  }
  return n;
}
export type TerminalState = {
  up: boolean;
  cwd: string;
  history: { command: string; output: string }[];
};
export const freshTerminal = (): TerminalState => ({
  up: false,
  cwd: "/home/learner",
  history: [],
});
export function runCommand(s: TerminalState, command: string): TerminalState {
  const c = command.trim();
  let output = "";
  let up = s.up,
    cwd = s.cwd;
  const ip = "10.120.0.14";
  if (c === "help")
    output =
      "Safe fictional host. Try: ip link, ip addr, ip route, ethtool eno1, ping 10.120.0.1, journalctl -u NetworkManager, sudo ip link set eno1 up. Then verify link, route and gateway. No commands reach your computer. Also: uname, hostnamectl, uptime, lscpu, free, top, ps, lspci, lsusb, lsblk, df, du, findmnt, smartctl, systemctl, dmesg, ss, dig, nslookup, traceroute, mtr, nmcli, ls, pwd, cd, cat, find, which, man, tail, grep, less, curl.";
  else if (c === "sudo ip link set eno1 up") {
    up = true;
    output =
      "Simulated approved change: eno1 administratively UP. Verify carrier and gateway.";
  } else if (c === "sudo ip link set eno1 down") {
    up = false;
    output = "Simulated interface DOWN.";
  } else if (c === "ip link" || c === "ip link show")
    output = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n2: eno1: <BROADCAST,MULTICAST,${up ? "UP,LOWER_UP" : "NO-CARRIER"}> mtu 1500 state ${up ? "UP" : "DOWN"}\n    link/ether 02:00:00:12:00:14`;
  else if (c === "ip addr" || c === "ip addr show")
    output = `eno1: state ${up ? "UP" : "DOWN"}\n inet ${ip}/24 scope global eno1\nAddress configured does not prove a usable link.`;
  else if (c === "ip route" || c === "ip route show")
    output = `default via 10.120.0.1 dev eno1${up ? "" : " linkdown"}\n10.120.0.0/24 dev eno1 proto kernel src ${ip}`;
  else if (c === "ethtool eno1")
    output = `Settings for eno1:\n Speed: ${up ? "10000Mb/s" : "Unknown"}\n Duplex: ${up ? "Full" : "Unknown"}\n Link detected: ${up ? "yes" : "no"}`;
  else if (
    c.startsWith("ping ") &&
    !["10.120.0.1", "10.120.0.80", "training.example"].includes(
      c.split(" ").at(-1)!,
    )
  )
    output =
      "This lab only models 10.120.0.1, 10.120.0.80, and training.example. No packet was sent.";
  else if (c.startsWith("ping "))
    output = up
      ? "64 bytes from " +
        c.split(" ").at(-1) +
        ": icmp_seq=1 ttl=64 time=0.321 ms\n3 transmitted, 3 received, 0% packet loss"
      : "connect: Network is unreachable";
  else if (c.startsWith("dig ") || c.startsWith("nslookup "))
    output = up
      ? "Name: training.example\nAddress: 10.120.0.80\nQuery time: 2 msec"
      : "connection timed out; no servers could be reached";
  else if (c === "uname -a" || c === "uname")
    output = "Linux dco-lab 6.8.0 x86_64 GNU/Linux (simulated)";
  else if (c === "hostnamectl")
    output =
      "Static hostname: dco-lab\nOperating System: Training Linux\nArchitecture: x86-64";
  else if (c === "uptime")
    output = "09:42 up 3 days, 2:10, 1 user, load average: 0.08, 0.12, 0.09";
  else if (c === "lscpu")
    output =
      "Architecture: x86_64\nCPU(s): 16\nCore(s) per socket: 8\nSocket(s): 1\nThread(s) per core: 2";
  else if (c === "free -h" || c === "free")
    output =
      "       total used free shared buff/cache available\nMem:   64Gi  8Gi  40Gi  1Gi    16Gi       54Gi\nSwap:  4Gi   0B   4Gi";
  else if (c === "lsblk")
    output =
      "NAME    SIZE TYPE MOUNTPOINTS\nnvme0n1 480G disk\n└─nvme0n1p1 480G part /";
  else if (c === "df -h" || c === "df")
    output =
      "Filesystem      Size Used Avail Use% Mounted on\n/dev/nvme0n1p1  480G  42G  438G   9% /";
  else if (c.startsWith("du"))
    output =
      "42G /var\nNote: usage is fictional and bounded to this lab snapshot.";
  else if (c.startsWith("journalctl"))
    output = `Nov 02 09:12:14 dco-lab NetworkManager: eno1: administratively ${up ? "up" : "down"}\nNov 02 09:12:15 dco-lab NetworkManager: ${up ? "carrier acquired, connection activated" : "activation blocked: interface disabled"}`;
  else if (c === "dmesg")
    output = `[  2.413] nvme nvme0: controller ready\n[  5.711] eno1: Link is ${up ? "Up 10 Gbps Full Duplex" : "Down"}`;
  else if (c.startsWith("systemctl"))
    output =
      "● NetworkManager.service - Network Manager\n Active: active (running)\nAn active daemon does not prove an interface is connected.";
  else if (c.startsWith("ss"))
    output =
      "State  Recv-Q Send-Q Local Address:Port\nLISTEN 0      128    0.0.0.0:22";
  else if (c === "lspci")
    output =
      "01:00.0 Ethernet controller: Training 10G NIC\n02:00.0 Non-Volatile memory controller: Training NVMe";
  else if (c === "lsusb")
    output = "Bus 001 Device 002: Training management keyboard";
  else if (c === "top" || c.startsWith("ps"))
    output =
      "PID USER   %CPU %MEM COMMAND\n1   root    0.0  0.1 systemd\n410 root    0.1  0.2 NetworkManager";
  else if (c.startsWith("nmcli"))
    output = `DEVICE TYPE     STATE\neno1   ethernet ${up ? "connected" : "disconnected"}`;
  else if (c.startsWith("traceroute ") || c.startsWith("mtr "))
    output = up
      ? "1  10.120.0.1 0.321 ms\n2  10.120.0.80 0.611 ms"
      : "Network is unreachable";
  else if (c === "pwd") output = cwd;
  else if (c === "cd /var/log") {
    cwd = "/var/log";
    output = "";
  } else if (c === "cd" || c === "cd ~") {
    cwd = "/home/learner";
    output = "";
  } else if (c === "ls" || c === "ls -la")
    output =
      cwd === "/var/log" ? "messages  training.log" : "README.txt  notes";
  else if (c === "cat README.txt")
    output =
      "Training host: diagnose the administrative state of eno1. A fictional change to enable this interface is approved for this lab.";
  else if (
    c.startsWith("cat ") ||
    c.startsWith("tail ") ||
    c.startsWith("less ") ||
    c.startsWith("grep ")
  )
    output =
      "09:12 eno1 administrative state DOWN. Consult journalctl -u NetworkManager for context. (Fixed lab log snapshot)";
  else if (c.startsWith("find ")) output = "/var/log/training.log";
  else if (c.startsWith("which ")) output = "/usr/bin/" + c.split(" ")[1];
  else if (c.startsWith("man "))
    output =
      "Training reference: " +
      c.split(" ")[1] +
      "\nUse help to see supported commands. This bounded interpreter does not implement a full Linux shell.";
  else if (c === "findmnt")
    output = "TARGET SOURCE FSTYPE OPTIONS\n/ /dev/nvme0n1p1 ext4 rw,relatime";
  else if (c.startsWith("smartctl"))
    output =
      "Training NVMe: SMART overall-health: PASSED\nCritical Warning: 0\nMedia and Data Integrity Errors: 0";
  else if (c === "curl https://training.example/health")
    output = up
      ? 'HTTP/2 200\n{"status":"healthy"}'
      : "curl: (6) Could not resolve host: training.example";
  else if (c === "clear") return { ...s, history: [] };
  else if (
    c.startsWith("chmod") ||
    c.startsWith("mount") ||
    c.startsWith("sudo") ||
    c.startsWith("rm") ||
    c.includes("|") ||
    c.includes(";")
  )
    output =
      "Unsupported change or shell syntax. This simulation permits only the scoped network change shown in help. No host command executed.";
  else
    output = `Unsupported command in this bounded simulation: ${c}. Type help.`;
  return { up, cwd, history: [...s.history, { command: c, output }] };
}
