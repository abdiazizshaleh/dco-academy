import { modules, behavioralPrompts, technicalPrompts } from "./content";
export type TargetCompany = "aws" | "google";
export const companyNames = { aws: "AWS / Amazon", google: "Google" };
// Original rehearsal prompts based on the responsibilities in the linked role,
// not questions supplied by Google or a prediction of an interview format.
export const googleBehavioralPrompts = [
  "Tell me about a time you repaired a hardware problem. How did you identify the failed component and test the repair?",
  "Describe a time Linux or operating-system evidence changed your diagnosis. What did you check next?",
  "Tell me about a network fault you worked on. How did you narrow it down and explain what you found?",
  "Describe a time you handled equipment or storage media containing sensitive data. How did you protect it?",
  "Tell me about a handoff between technicians or teams. What information helped the next person continue the work?",
  "Describe a maintenance or deployment task that did not go to plan. How did you adapt and check the result?",
  "Tell me about a time you learned an unfamiliar system while solving a problem. When did you ask for help?",
  "Describe a recurring fault you helped prevent. What changed, and how did you know it helped?",
];
const googleOrder = [3, 4, 8, 6, 7, 5, 9, 10, 11, 12, 2, 13, 15, 16];
export function companyModules(company: TargetCompany) {
  return company === "aws"
    ? modules
    : googleOrder.map((id) => modules.find((m) => m.id === id)!);
}
export function interviewPrompts(
  company: TargetCompany,
  mode: "Behavioral" | "Technical",
) {
  if (company === "aws")
    return mode === "Technical" ? technicalPrompts : behavioralPrompts;
  return mode === "Behavioral"
    ? googleBehavioralPrompts
    : companyModules(company)
        .filter((m) => m.domain !== "Interview")
        .flatMap((m) => m.lessons)
        .flatMap((l) => [
          `Explain ${l.title.toLowerCase()} to another technician.`,
          `A ticket involves ${l.title.toLowerCase()}. What evidence would you collect before changing anything?`,
        ]);
}
export function planTaskId(
  company: TargetCompany,
  start: string,
  day: number,
  task: number,
) {
  // Retain every pre-selector AWS checklist ID for existing students.
  return `${company === "google" ? "google-" : ""}${start}-${day}-${task}`;
}
