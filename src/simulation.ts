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
export {freshTerminal,runCommand} from './terminal';
export type {TerminalState} from './terminal';
