import type { HardwareProgress } from "./store";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
export function EquipmentIcon({
  kind = "server",
  size = 46,
}: {
  kind?: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 48" aria-hidden="true">
      <defs>
        <linearGradient id={`equip-${kind}`} x2="0" y2="1">
          <stop stopColor="#73838e" />
          <stop offset="1" stopColor="#293945" />
        </linearGradient>
      </defs>
      {kind === "switch" ? (
        <>
          <rect
            x="2"
            y="12"
            width="60"
            height="25"
            rx="3"
            fill={`url(#equip-${kind})`}
            stroke="#a2b3be"
          />
          <rect x="6" y="17" width="47" height="15" rx="1" fill="#111e27" />
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <rect x={9 + i * 5} y="20" width="3" height="5" fill="#879ba5" />
              <circle cx={10 + i * 5} cy="28" r=".8" fill="#79d4ac" />
            </g>
          ))}
          <circle cx="58" cy="25" r="1.5" fill="#79d4ac" />
        </>
      ) : kind === "memory" ? (
        <>
          <rect
            x="3"
            y="12"
            width="58"
            height="25"
            rx="2"
            fill="#356a52"
            stroke="#70a286"
          />
          {Array.from({ length: 6 }, (_, i) => (
            <rect
              key={i}
              x={7 + i * 8}
              y="17"
              width="6"
              height="12"
              rx="1"
              fill="#14251f"
            />
          ))}
          <path d="M7 37H29M34 37H57" stroke="#d5b66f" strokeWidth="5" />
        </>
      ) : kind === "cpu" ? (
        <>
          <rect
            x="15"
            y="5"
            width="35"
            height="36"
            fill="#657763"
            stroke="#a3b29a"
          />
          <rect
            x="20"
            y="10"
            width="25"
            height="25"
            rx="2"
            fill="#b1bac0"
            stroke="#e0e6e9"
          />
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M${22 + i * 3} 13v19`} stroke="#73828c" />
          ))}
        </>
      ) : kind === "fan" ? (
        <>
          <rect
            x="12"
            y="3"
            width="40"
            height="41"
            rx="3"
            fill="#23323b"
            stroke="#80929b"
          />
          <circle cx="32" cy="23" r="16" stroke="#6c818d" fill="#15242c" />
          {[0, 90, 180, 270].map((r) => (
            <path
              key={r}
              transform={`rotate(${r} 32 23)`}
              d="M32 23 Q16 7 22 9 Q37 3 34 20Z"
              fill="#718994"
            />
          ))}
          <circle cx="32" cy="23" r="4" fill="#2e414b" />
        </>
      ) : (
        <>
          {[6, 22].map((y) => (
            <g key={y}>
              <rect
                x="3"
                y={y}
                width="58"
                height="14"
                rx="2"
                fill={`url(#equip-${kind})`}
                stroke="#899ba6"
              />
              <rect x="8" y={y + 3} width="32" height="8" fill="#192731" />
              {Array.from({ length: 7 }, (_, i) => (
                <path
                  key={i}
                  d={`M${11 + i * 4} ${y + 5}v4`}
                  stroke="#70818c"
                />
              ))}
              <circle cx="48" cy={y + 7} r="1.3" fill="#84d3a9" />
              <rect x="54" y={y + 4} width="3" height="6" fill="#a7b7bf" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
export function Rack({ compact = false }: { compact?: boolean }) {
  const [part, P] = useState(0);
  const zones = [
    {
      name: "Network switches",
      u: "U41–42",
      detail:
        "Top-of-rack switches connect servers to the rest of the network. Trace both the server port and the upstream path before assuming a host fault.",
      kind: "switch",
    },
    {
      name: "Compute servers",
      u: "U17–40",
      detail:
        "Rack units identify vertical positions. Match the ticket, rack position, and asset serial before working on a server.",
      kind: "server",
    },
    {
      name: "Storage servers",
      u: "U05–16",
      detail:
        "A storage system may contain several drives behind one controller. Match a logical disk fault to the exact bay and serial before replacement.",
      kind: "server",
    },
    {
      name: "Power feeds",
      u: "Rear A / B",
      detail:
        "Two PSUs should follow the approved A/B power design. Shared upstream equipment can still be a single point of failure. Facilities teams own distribution work.",
      kind: "server",
    },
  ];
  return (
    <div className={`rack-explorer ${compact ? "compact" : ""}`}>
      <figure className="facility-photo">
        <img
          src={`${import.meta.env.BASE_URL}images/data-center.jpg`}
          alt="Illustrative data center cold aisle with server racks and overhead cable trays"
        />
        <figcaption>Generic facility illustration</figcaption>
      </figure>
      {!compact && (
        <div className="rack-detail">
          <span className="eyebrow">Example rack layout</span>
          <h2>Follow the connections</h2>
          <p className="muted">
            Select a section to see what it does and where to start a check.
          </p>
          <div className="rack-zone-list">
            {zones.map((z, i) => (
              <button
                key={z.name}
                onClick={() => P(i)}
                className={i === part ? "selected" : ""}
              >
                <EquipmentIcon kind={z.kind} size={37} />
                <div>
                  <b>{z.name}</b>
                  <small>{z.u}</small>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          <div className="rack-zone-info">
            <h3>{zones[part].name}</h3>
            <p>{zones[part].detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}
export function Topology({ recovered = false }: { recovered?: boolean }) {
  const [selected, S] = useState(0);
  const names = ["Server eno1", "Access switch", "Gateway", "Service"];
  const detail = [
    "Read the interface state, address, routes, and error counters. An address alone does not prove the interface can send traffic.",
    "Compare the port’s actual VLAN with the intended VLAN. A link can be up even when the host is on the wrong network.",
    "Check whether the host can resolve and reach its next hop. Then test a destination beyond the local subnet.",
    "Test the application itself. Working DNS and a successful ping are useful checks, but neither proves that the service is working.",
  ];
  return (
    <div className="network-map">
      <div className="network-map-heading">
        <span>Example network path</span>
        <span className={recovered ? "green-text" : "muted"}>
          {recovered ? "Recovery verified" : "Select a device to inspect"}
        </span>
      </div>
      <div className="topology">
        {names.map((n, i) => (
          <button
            key={n}
            onClick={() => S(i)}
            className={selected === i ? "selected" : ""}
            aria-pressed={selected === i}
          >
            <EquipmentIcon
              kind={i === 1 || i === 2 ? "switch" : "server"}
              size={59}
            />
            <b>{n}</b>
            <small>
              {i === 0
                ? "10.120.0.14"
                : i === 1
                  ? "Port 14 · VLAN 120"
                  : i === 2
                    ? "10.120.0.1"
                    : "training.example"}
            </small>
            <span className={"node-light " + (recovered ? "ok" : "")} />
          </button>
        ))}
      </div>
      <div className="network-observation">
        <b>{names[selected]}</b>
        <p>{detail[selected]}</p>
      </div>
    </div>
  );
}
const parts = [
  {
    key: "CPU",
    name: "CPU & heatsink",
    kind: "cpu",
    x: 34,
    y: 34,
    about:
      "The processor runs instructions. The heatsink transfers heat into the airflow. Memory channels and some PCIe lanes connect through the CPU.",
    symptoms:
      "Thermal throttling, initialization errors, or missing devices on a socket’s channels.",
    check:
      "Compare temperature, fan speed, and firmware events. Check socket and slot dependencies in the service manual.",
  },
  {
    key: "DIMM",
    name: "Memory (DIMMs)",
    kind: "memory",
    x: 23,
    y: 35,
    about:
      "DIMMs provide working memory. ECC can correct certain errors, but it cannot prevent every memory failure.",
    symptoms:
      "Less memory than expected, POST stops, or repeated correctable and uncorrectable memory events.",
    check:
      "Compare installed, firmware-recognized, and OS memory. Match the event’s slot label to the platform documentation.",
  },
  {
    key: "PSU",
    name: "Power supplies",
    kind: "server",
    x: 27,
    y: 13,
    about:
      "Redundant PSUs can keep a host running after a supported single failure, provided the remaining supply has enough capacity.",
    symptoms:
      "Missing input, an internal PSU fault, or degraded redundancy while the host still runs.",
    check:
      "Separate a missing feed from an internal fault using input indicators and BMC events. Confirm the power design and approved service procedure.",
  },
  {
    key: "Fans",
    name: "Cooling fans",
    kind: "fan",
    x: 56,
    y: 55,
    about:
      "Fans move air through the chassis and heatsinks. Platforms adjust speed using component temperatures and cooling requirements.",
    symptoms:
      "A fan reports zero RPM, other fans speed up, or the CPU begins throttling.",
    check:
      "Compare fan RPM with inlet and component temperatures. Check for a blockage before assuming the room cooling has failed.",
  },
  {
    key: "Drives",
    name: "Drive bays",
    kind: "server",
    x: 51,
    y: 85,
    about:
      "Front bays hold drives. The physical bay, OS block device, and controller logical volume can identify different things.",
    symptoms:
      "A degraded array, a failed member, I/O errors, or a disk missing from inventory.",
    check:
      "Match the fault to the controller, bay, and serial. Check surviving members and the approved replacement plan.",
  },
  {
    key: "PCIe",
    name: "PCIe riser",
    kind: "switch",
    x: 75,
    y: 16,
    about:
      "A riser positions expansion cards inside the chassis. Its lanes, supported devices, and CPU dependencies are platform-specific.",
    symptoms:
      "A network or storage adapter is missing from firmware or OS inventory.",
    check:
      "Compare firmware inventory with lspci. Check the slot map, supported card, firmware, and service procedure before reseating.",
  },
];
const identify = [
  {
    prompt:
      "The BMC reports an uncorrectable memory error. Which component would you investigate?",
    answer: "DIMM",
    why: "Start with memory inventory and the event’s slot label. A memory event does not justify immediately moving or replacing every DIMM.",
  },
  {
    prompt:
      "Fan 3 reports zero RPM while inlet temperature is normal. Which component should you check?",
    answer: "Fans",
    why: "The evidence points toward cooling inside the chassis. Correlate RPM, thermal events, and the vendor’s cooling procedure.",
  },
  {
    prompt:
      "The controller reports a failed array member in bay 3. Which area needs its physical identity confirmed?",
    answer: "Drives",
    why: "Match the controller fault to the exact bay and serial before a replacement. Removing a healthy drive can exceed the array’s fault tolerance.",
  },
];
export function Server({
  onAssess,
  state,
  onChange,
}: {
  onAssess?: (score: number) => void;
  state?: HardwareProgress;
  onChange?: (value: HardwareProgress) => void;
}) {
  const [local, L] = useState<HardwareProgress>({
    part: "DIMM",
    quiz: null,
    result: null,
  });
  const value = state || local;
  const { part, quiz, result } = value;
  function update(patch: Partial<HardwareProgress>) {
    const next = { ...value, ...patch };
    if (onChange) onChange(next);
    else L(next);
  }
  const chosen = parts.find((p) => p.key === part)!;
  function choose(key: string) {
    if (quiz !== null && result === null) {
      const pass = key === identify[quiz].answer;
      update({ part: key, result: pass });
      onAssess?.(pass ? 100 : 0);
    } else update({ part: key });
  }
  return (
    <section className="hardware-viewer">
      <div className="hardware-toolbar">
        <div>
          <span className="eyebrow">2U rack server</span>
          <h2>What’s inside?</h2>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            update({
              quiz: quiz === null ? 0 : (quiz + 1) % identify.length,
              result: null,
            });
          }}
        >
          {quiz === null ? "Test component identification" : "Next question"}
          <ArrowRight size={15} />
        </button>
      </div>
      {quiz !== null && (
        <div className="identify-question">
          <span className="pill">Identify the component</span>
          <p>{identify[quiz].prompt}</p>
          {result !== null && (
            <div className={result ? "green-text" : "orange-text"}>
              <b>{result ? "That’s right." : "Take another look."}</b>{" "}
              {identify[quiz].why}
            </div>
          )}
          {result === false && (
            <button
              className="text-button"
              onClick={() => update({ result: null })}
            >
              Try this question again
            </button>
          )}
          <button
            className="text-button"
            onClick={() => {
              update({ quiz: null, result: null });
            }}
          >
            Back to exploring
          </button>
        </div>
      )}
      <div className="hardware-layout">
        <div>
          <div className="hardware-photo">
            <img
              loading="lazy"
              src={`${import.meta.env.BASE_URL}images/server-interior.jpg`}
              alt="Illustrative rack server showing two CPU heatsinks, banks of DIMMs, a row of fans, front drive bays, redundant PSUs, and a PCIe riser"
            />
            {parts.map((p, i) => (
              <button
                key={p.key}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={
                  "hardware-hotspot " + (p.key === part ? "active" : "")
                }
                aria-label={`Inspect ${p.name}`}
                aria-pressed={p.key === part}
                onClick={() => choose(p.key)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="image-caption">
            <span>Select a number or component name.</span>
            <span>Illustrative layout; check your platform’s manual.</span>
          </div>
          <div className="component-selector">
            {parts.map((p, i) => (
              <button
                key={p.key}
                className={part === p.key ? "selected" : ""}
                onClick={() => choose(p.key)}
                aria-pressed={part === p.key}
              >
                <span>{i + 1}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <aside className="component-details">
          <div className="component-title">
            <EquipmentIcon kind={chosen.kind} />
            <div>
              <small>Component {parts.indexOf(chosen) + 1}</small>
              <h3>{chosen.name}</h3>
            </div>
          </div>
          <p>{chosen.about}</p>
          <h4>Signs of a problem</h4>
          <p>{chosen.symptoms}</p>
          <h4>What to check</h4>
          <p>{chosen.check}</p>
        </aside>
      </div>
    </section>
  );
}
