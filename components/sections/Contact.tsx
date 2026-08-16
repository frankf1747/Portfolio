import SmartText from "../SmartText";

/* §11 contact + footer. Footer links are Type B (§7): present at rest,
   wiping away on hover. Navigation gains an underline, content loses one. */

const LINKS = [
  { label: "LINKEDIN", href: "https://www.linkedin.com/" },
  { label: "GITHUB", href: "https://github.com/" },
  { label: "EMAIL", href: "mailto:frankfu1747@gmail.com" }
];

export default function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-section__head">
        <SmartText className="small index">06 — CONTACT</SmartText>
        <SmartText className="small">OPEN TO 2026 ROLES</SmartText>
      </div>

      <SmartText className="super-small contact-section__big">SAY HELLO</SmartText>

      <a className="contact-section__email" href="mailto:frankfu1747@gmail.com">
        frankfu1747@gmail.com
      </a>

      <footer className="foot">
        <span className="foot__group">
          {LINKS.map((l) => (
            <a className="link-b" key={l.label} href={l.href} target="_blank" rel="noreferrer noopener">
              {l.label}
            </a>
          ))}
        </span>
        <SmartText as="span" className="small">LOS ANGELES, CA</SmartText>
        <SmartText as="span" className="small">©2026 FRANK FU</SmartText>
      </footer>
    </section>
  );
}
