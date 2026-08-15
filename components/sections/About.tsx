import SmartText from "../SmartText";

export default function About() {
  return (
    <section className="about" id="about">
      <div className="about__head">
        <SmartText className="small">02 — ABOUT</SmartText>
        <SmartText className="small">LOS ANGELES, CA</SmartText>
      </div>
      <div className="about__body">
        <SmartText as="h2" className="h2" isBody>
          I work between the analysis and the interface — search relevance, causal
          inference and agent systems on one side, the flows and screens they turn
          into on the other. Most of what I build exists to make one decision
          easier to make, and to leave the reasoning behind it legible to whoever
          has to make it.
        </SmartText>
      </div>
    </section>
  );
}
