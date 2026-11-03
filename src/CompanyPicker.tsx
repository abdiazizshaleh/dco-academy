import { companyNames, type TargetCompany } from "./companyStudy";
export function CompanyPicker({
  value,
  onChange,
}: {
  value: TargetCompany;
  onChange: (value: TargetCompany) => void;
}) {
  return (
    <section className="study-company" aria-label="Study company">
      <label>
        Applying to
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as TargetCompany)}
          aria-describedby="company-choice-help"
        >
          <option value="aws">{companyNames.aws}</option>
          <option value="google">{companyNames.google}</option>
        </select>
      </label>
      <p id="company-choice-help">
        Your study plan and interview practice follow this choice. It saves with
        your progress.
      </p>
    </section>
  );
}
