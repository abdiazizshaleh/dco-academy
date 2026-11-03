# DCO Academy research and curriculum decisions

Verified 2026-11-02. Sources are identified in sources.json. Lessons and scenarios must be original instructional examples, not AWS internal procedures.

## Role evidence

The official Data Center Technician listing (job 10589512) describes server installation, component break/fix, network diagnosis, operational incident response, stakeholder communication, documentation, change management, and escalation. This listing asks for two years of hardware and layer 1/2 networking experience; Linux administration is preferred. Physical and scheduling requirements are specific to this listing, not universal requirements for every opening. It does not establish a universal job level mapping. Compare the actual requisition with the learner's experience before applying. [Amazon DCT](https://www.amazon.jobs/en/jobs/10589512/data-center-technician)

The DCEO listing (job 10377504) centers on electrical/mechanical infrastructure, HVAC, fire suppression, and facilities work. Teach power and cooling awareness to DCO learners, with electrical intervention reserved for authorized qualified personnel. [Amazon DCEO](https://amazon.jobs/en/jobs/10377504/data-center-engineering-operations-technician)

Regions contain multiple Availability Zones; an AZ can include multiple separate data centers. Do not equate a rack, room, building, AZ, and Region. [AWS infrastructure documentation](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions-availability-zones.html)

## Interview evidence and corrections

Amazon's official interview-loop page identifies individual meetings, assessment of different competencies, behavioral questions, and STAR preparation. It does not substantiate a universal technical/behavioral percentage or duration. Confirm the agenda with the recruiting contact. [Interview loop](https://amazon.jobs/content/en/how-we-hire/interview-loop)

Cover all 16 official Leadership Principles. Their names, checked against the current official page, are: Customer Obsession; Ownership; Invent and Simplify; Are Right, A Lot; Learn and Be Curious; Hire and Develop the Best; Insist on the Highest Standards; Think Big; Bias for Action; Frugality; Earn Trust; Dive Deep; Have Backbone; Disagree and Commit; Deliver Results; Strive to be Earth's Best Employer; Success and Scale Bring Broad Responsibility. These describe leadership behaviors. Application to technician scenarios is Academy interpretation. [Leadership Principles](https://amazon.jobs/content/en/our-workplace/leadership-principles)

## Attached community guide analysis

The supplied Reddit post offers useful curriculum seeds: POST/UEFI, DIMM recognition, CPU/PSU/storage, BMC/IPMI, ESD, RAID, OSI layers, TCP handshake, DNS/DHCP, routing, fiber types, optics/VFL, Linux inspection, escalation, verified closure, and STAR rehearsal. Its nine-part diagnostic framework is useful when adapted to non-linear incidents: clarify, impact, safety, physical evidence, isolate, approved procedure, verify, document, escalate.

The thread itself contains contradictory descriptions of fixed shifts and rotating schedules across locations. It also contains different interview counts for trainees and other openings. Therefore reject the guide's universal 70-80% behavioral split, interview duration, fixed story count, and universal rotation claims. Some comments conflate mechanical/facilities roles with DCO. Workplace-culture reports are individual accounts, not validated organization-wide facts. One commenter advocates invented stories; the Academy must explicitly coach authentic experiences instead. Story reuse is a rehearsal coverage concern, not a published automatic rejection rule. Certification advice in comments is optional community advice, not an official prerequisite.

[Community thread](https://www.reddit.com/r/datacenter/comments/1szr3ds/aws_data_center_technician_prep_the_complete/) was analyzed from the user-supplied JSON, including comments; it was not independently authenticated as an official Amazon source.

## Technical guardrails

Intel documents ECC correction and log-based investigation, with thresholds tied to its supported systems. Explain correctable versus uncorrectable errors, identify the physical slot and population rules, and consult platform documentation. Do not turn one vendor's numeric replacement threshold into a universal rule. Any invasive DIMM activity in a scenario requires approved maintenance, safe shutdown/isolation, and ESD controls. [Intel ECC guide](https://www.intel.com/content/www/us/en/support/articles/000038234/server-products.html)

Dell describes RAID 0 striping without redundancy, RAID 1 mirroring, RAID 5 single parity, RAID 6 double parity, and RAID 10 striped mirror sets. Failure tolerance in RAID 10 depends on which mirror members fail. RAID is not backup. Drive replacement exercises must require matching slot and serial evidence and assessing remaining redundancy; replacement should not magically imply an instantaneous healthy array. [Dell RAID reference](https://www.dell.com/support/kbdoc/en-us/000128635/dell-servers-what-are-the-raid-levels-and-their-specifications)

Fluke distinguishes end-face inspection/cleaning, connectivity and polarity checks, loss certification, and fault localization. A VFL can help trace continuity and visible faults but does not certify end-to-end insertion loss. Teach loss budget in dB versus absolute optical power in dBm, and distinguish optical power measurements from OTDR event/location analysis. [Fluke fiber testing](https://www.flukenetworks.com/expertise/learn-about/fiber-testing)

Cisco's installation notes document optical-module families, supported media and wavelengths, operating limits, and safety. A matching physical form factor alone does not prove compatibility. Use approved test equipment, never look into fiber or energized optical ports, and check both receiver minimum and overload limits in the specific module datasheet. [Cisco optics notes](https://www.cisco.com/c/en/us/td/docs/interfaces_modules/transceiver_modules/installation/note/78_15160.pdf)

Linux command examples should identify what each observation can prove: ip link shows link state, ip route shows routing decisions, systemctl status reports unit state, and journalctl provides journal evidence. Distinguish administratively UP from carrier availability, route presence from remote reachability, and an IP reachability failure from DNS failure. Simulate commands in browser state only. [ip link](https://www.man7.org/linux/man-pages/man8/ip-link.8.html), [ip route](https://man7.org/linux/man-pages/man8/ip-route.8.html), [systemctl](https://man7.org/linux/man-pages/man1/systemctl.1.html), [journalctl](https://man7.org/linux/man-pages/man1/journalctl.1.html)

## Curriculum expansion beyond the post

Add rack elevations/airflow/feed redundancy, physical access and asset chain of custody, storage rebuild risk, IPv6/VLAN/ARP/interface counters, optical budget and tool selection, Linux services/log/storage investigation, incident queue prioritization and handoffs, telemetry correlation, evidence-based mastery, spaced review, and authentic STAR reflection. Teach facilities topics at awareness level. Any diagrams of AWS-style infrastructure must be labeled fictional generic training environments.

Content coverage is separate from implementation coverage. The product should inventory actual lessons, exercises, and questions and explicitly document gaps against the requested target rather than inflate counts with repeated filler.


## Additional GitHub context reviewed November 2, 2026

Repository: https://github.com/dco-study-guide/aws-dco-interview-prep
Reviewed default-branch tree dfb37df4f3875fdd3051a727e4e420ed55723f37: README, hardware-and-networking-glossary, interview-day-checklist, leadership-principles, lp-star-bank, technical-cheatsheet, and troubleshooting-flowcharts. This is a community study guide, not an Amazon publication or authenticated interview bank.

Useful additions: dedicated protocol explanations (TCP handshake, DHCP allocation, DNS transport), explanations of diagnostic intent, interview logistics, and linking a real incident to the decision and evidence that demonstrate a principle. Original lessons and checklist items were authored; sample STAR prose and metrics were not copied or represented as learner experience.

Corrections and boundaries:

- The 70-80% behavioral weighting and priority-principle claims are not verified official policy. Keep all 16 principles and recruiter-specific process guidance.
- Five stories and exact STAR time percentages are optional rehearsal ideas, not universal requirements. Never invent metrics to satisfy a template.
- A technically reversible swap can still interrupt service. Patching, DIMM movement, optics replacement, and power operations require scope, approval, and platform procedure. Do not combine no-power and no-POST into one unconditional replacement sequence.
- Correctable ECC events do not alone prove that a DIMM caused reboots. Correlate the event, platform thresholds, and fault-isolation evidence.
- CRC errors do not alone prove optical degradation. A received value such as -3 dBm is not universally optimal; compare specific receiver limits and design margins.
- Fiber jacket colors are hints, not definitive identity. VFL inspection does not reliably expose every microbend and does not certify loss. Never look into a fiber or energized optical port.
- BMC availability still requires suitable power and management connectivity. ESD wrist-strap use must follow task-specific safety procedures; it is not an instruction to approach energized electrical hazards.
- TCP reliability does not guarantee an application transaction will finish. DHCP initial DORA is not every renewal path. DNS requires TCP support as well as traditional UDP operation.

Protocol primary references: RFC 9293 (TCP), RFC 2131 (DHCPv4), RFC 7766 (DNS TCP transport). They are linked in the new lessons and the source library.
