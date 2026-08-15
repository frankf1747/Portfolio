import SketchFilters from "@/components/SketchFilters";
import GridOverlay from "@/components/GridOverlay";
import SiteNav from "@/components/sections/SiteNav";
import Hero from "@/components/sections/Hero";
import Showreel from "@/components/sections/Showreel";
import Intro from "@/components/sections/Intro";
import Focus from "@/components/sections/Focus";
import SelectedWork from "@/components/sections/SelectedWork";
import Bio from "@/components/sections/Bio";
import Manifesto from "@/components/sections/Manifesto";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <SketchFilters />
      <div className="grain" aria-hidden="true" />
      <GridOverlay />

      <SiteNav />

      <main>
        <Hero />
        <Showreel />
        <Intro />
        <Focus />
        <SelectedWork />
        <Bio />
        <Manifesto />
        <Contact />
      </main>
    </>
  );
}
