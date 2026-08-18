import SmartText from "../SmartText";

/* §11 statement — two offset 245rem lines, 8 and 7 columns,
   the second with margin-top 100rem. This is a --yellow ground
   inversion: type and rules switch to --ink here. */

export default function Statement() {
  return (
    <section className="statement is-invert-yellow" aria-label="Statement">
      {/* length-tuned to the column spans: at super scale an 8-column
          line holds ~7 characters and a 7-column line ~6. Written to the
          metric first, then for meaning. */}
      <SmartText className="super statement__a">CURIOSITY</SmartText>
      <SmartText className="super statement__b" delay={120}>
        LEARN.
      </SmartText>
    </section>
  );
}
