import Preloader from "@/components/Preloader";
import ScrollProvider from "@/components/ScrollProvider";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Statement from "@/components/sections/Statement";
import Capabilities from "@/components/sections/Capabilities";
import Work from "@/components/sections/Work";
import Approach from "@/components/sections/Approach";
import Studies from "@/components/sections/Studies";
import Contact from "@/components/sections/Contact";
import SketchFilters from "@/components/SketchFilters";
import Dog from "@/components/Dog";

/* The whole site, as one composition. It lives here rather than in
   app/page.tsx because it is rendered at more than one path: "/" and each
   outreach slug in app/[invite]. Nothing below reads the pathname, so the
   two are byte-identical apart from the <head>. */
export default function Landing() {
  return (
    <>
      <Preloader />
      <ScrollProvider />
      <Cursor />
      <Nav />
      {/* the #wob1–3 filters every hand-drawn mark on the page refers to —
          mounted once, here, so any section can use them */}
      <SketchFilters />
      {/* wanders the screen after the intro — see Dog.tsx */}
      <Dog />

      <main>
        <Hero />
        {/* §11 reel band held back until there is a film to put in it.
            Re-enable by importing Reel and dropping it back here — the
            section indices below shift by one when it returns. */}
        <About />
        <Statement />
        <Capabilities />
        <Work />
        <Approach />
        <Studies />
        <Contact />
      </main>
    </>
  );
}
