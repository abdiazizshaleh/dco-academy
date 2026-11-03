import { ArrowRight, ArrowUpRight, Briefcase } from "lucide-react";
export const googleRoleUrl =
  "https://www.google.com/about/careers/applications/jobs/results/118500840158700230-data-center-technician-iii-hardware-operations";
export function companyScope(moduleId: number) {
  return moduleId === 1
    ? "AWS role context"
    : moduleId === 14
      ? "AWS / Amazon"
      : "Shared · AWS & Google";
}
export function CompanyNote({ moduleId }: { moduleId: number }) {
  return (
    <div className="company-note">
      <span className="pill">{companyScope(moduleId)}</span>
      <p>
        {moduleId === 1
          ? "DCO, DCEO, Regions, and Availability Zones are explained here in the AWS context. See Career Readiness for Google’s technician role."
          : moduleId === 14
            ? "These are Amazon’s Leadership Principles, used in Amazon/AWS interview preparation. They are not Google’s interview framework."
            : "These skills are useful preparation for both companies. The examples teach general methods, not an employer’s internal procedures."}
      </p>
    </div>
  );
}
const googleChecks = [
  [
    "posting",
    "Compare the minimum and preferred qualifications in your chosen Google posting.",
  ],
  [
    "examples",
    "Prepare examples of hardware repair, OS troubleshooting, and network diagnosis.",
  ],
  [
    "media",
    "Be ready to explain how you protect data when handling storage media.",
  ],
  [
    "recruiter",
    "Ask your recruiter about the interview, shifts, travel, and site requirements.",
  ],
] as const;
export function RoleGuide({
  notes,
  onNote,
  onLesson,
  onInterview,
}: {
  notes: Record<string, string>;
  onNote: (key: string, value: string) => void;
  onLesson: (id: string) => void;
  onInterview: () => void;
}) {
  const done = (notes["google-career-checks"] || "").split("|");
  return (
    <section className="role-guide" aria-labelledby="role-guide-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Role comparison</p>
          <h2 id="role-guide-title">
            AWS and Google: where the preparation overlaps
          </h2>
        </div>
        <Briefcase size={24} />
      </div>
      <p className="muted">
        Start with the shared skills, then check the requirements and interview
        guidance for the company you’re applying to.
      </p>
      <div className="employer-grid">
        <article className="panel employer-card">
          <span className="pill company-aws">AWS / Amazon</span>
          <h3>Data Center Technician / DCO</h3>
          <p>
            The AWS example posting covers rack installation, hardware repairs,
            network faults, incident response, on-call work, and documentation.
          </p>
          <p>
            Use the Amazon Leadership Principles section to prepare examples of
            your decisions and results.
          </p>
          <button className="text-button" onClick={() => onLesson("14-1")}>
            Study Amazon’s principles <ArrowRight size={14} />
          </button>
          <a
            href="https://www.amazon.jobs/en/jobs/10589512/data-center-technician"
            target="_blank"
            rel="noreferrer"
          >
            Read the AWS example posting <ArrowUpRight size={14} />
          </a>
        </article>
        <article className="panel employer-card">
          <span className="pill company-google">Google</span>
          <h3>Data Center Technician</h3>
          <p>
            The Google Hardware Operations posting covers component repair, OS
            and network diagnosis, infrastructure deployment, maintenance, and
            secure media handling. Linux experience appears among its preferred
            qualifications.
          </p>
          <p className="muted small-text">
            Example: Technician III, Hardware Operations, Cedar Rapids, Iowa.
            This posting’s preferred four years of server experience is not a
            requirement for every Google technician role.
          </p>
          <a href={googleRoleUrl} target="_blank" rel="noreferrer">
            Read the Google example posting <ArrowUpRight size={14} />
          </a>
          <a
            href="https://www.google.com/about/careers/applications/jobs/results/?q=data%20center%20technician"
            target="_blank"
            rel="noreferrer"
          >
            Find current Google technician roles <ArrowUpRight size={14} />
          </a>
        </article>
        <article className="panel employer-card">
          <span className="pill">Shared · AWS & Google</span>
          <h3>Start with the same core skills</h3>
          <p>
            Practice server components, Linux, cabling, networking, fault
            isolation, clear notes, and explaining how you verified a repair.
          </p>
          <p>
            These are study connections drawn from the roles, not a shared
            official syllabus or a promised interview format.
          </p>
          <button className="text-button" onClick={() => onLesson("3-1")}>
            Review server hardware <ArrowRight size={14} />
          </button>
          <button className="text-button" onClick={onInterview}>
            Practice a technical answer <ArrowRight size={14} />
          </button>
        </article>
      </div>
      <div className="employer-details">
        <section className="panel">
          <span className="pill company-google">Google</span>
          <h3>Google application checklist</h3>
          {googleChecks.map(([id, label]) => (
            <label className="plan-task" key={id}>
              <input
                type="checkbox"
                checked={done.includes(id)}
                onChange={() =>
                  onNote(
                    "google-career-checks",
                    (done.includes(id)
                      ? done.filter((x) => x !== id)
                      : [...done.filter(Boolean), id]
                    ).join("|"),
                  )
                }
              />
              {label}
            </label>
          ))}
          <p className="muted small-text">
            Checks save with the rest of your progress.
          </p>
          <a
            className="text-button"
            href="https://www.google.com/about/careers/applications/how-we-hire/interview-tips"
            target="_blank"
            rel="noreferrer"
          >
            Google interview preparation <ArrowUpRight size={14} />
          </a>
        </section>
        <section className="panel">
          <h3>Read the title and requirements together</h3>
          <p>
            AWS levels and Google’s numbered technician titles are not a
            one-to-one comparison. Check each posting’s minimum qualifications,
            preferred experience, location, shifts, and physical demands.
          </p>
          <p>
            At AWS, DCEO describes facilities work distinct from IT hardware
            operations. For either company, check whether a vacancy is about
            servers and networks or electrical and mechanical systems.
          </p>
          <p className="muted small-text">
            Official pages reviewed November 3, 2026. Openings can close and
            requirements vary by posting. Ask your recruiter about your specific
            interview.
          </p>
        </section>
      </div>
    </section>
  );
}
