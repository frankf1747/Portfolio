import SmartText from "../SmartText";

export default function About() {
  return (
    <section className="about" id="about">
      <div className="about__head">
        <SmartText className="small index">01 — ABOUT</SmartText>
        <SmartText className="small">LOS ANGELES, CA</SmartText>
      </div>
      <div className="about__body">
        <SmartText as="h2" className="h2" isBody>
          I build the thing the analysis points to. Finding the cause is half
          the job. The other half is deciding what&apos;s worth fixing and
          shipping something people will actually use: a model, a dashboard, an
          agent, an app. The best ones stop being tools and become how the work
          runs.
        </SmartText>
      </div>
    </section>
  );
}
