import { ArrowOut } from "../SketchFilters";

const LINKS = [
  { href: "#intro", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#bio", label: "Bio" },
  { href: "#contact", label: "Contact" }
];

export default function SiteNav() {
  return (
    <nav className="sk-nav" aria-label="Primary">
      <ul className="sk-nav__links">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>

      <span className="sk-nav__mark">Frank Fu</span>

      <div className="sk-nav__cta">
        <span className="sk-nav__vert" aria-hidden="true">
          Get in touch
        </span>
        <a href="#contact" className="sk-nav__ring" aria-label="Get in touch">
          <ArrowOut />
        </a>
      </div>
    </nav>
  );
}
