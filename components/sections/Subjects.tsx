import SmartText from "../SmartText";

/* §11 "people / clients" slot. Framed honestly as case subjects —
   these are analyses and case studies built on public and course data,
   not client engagements, and the label says so. */

const NAMES = [
  "STARBUCKS",
  "DOORDASH",
  "DELL",
  "MICROSOFT",
  "APPLE",
  "CEDAR",
  "META"
];

export default function Subjects() {
  return (
    <section className="subjects" id="subjects">
      <div className="subjects__head">
        <SmartText className="small">06 — CASE SUBJECTS</SmartText>
        <SmartText className="small">ANALYSES, NOT ENGAGEMENTS</SmartText>
      </div>
      <div className="subjects__strip" role="list">
        {NAMES.map((n) => (
          <div className="subjects__item" role="listitem" key={n}>
            <SmartText className="h1">{n}</SmartText>
          </div>
        ))}
      </div>
      <p className="subjects__note">
        Companies studied in coursework and independent analysis using public
        and provided datasets. Not client work.
      </p>
    </section>
  );
}
