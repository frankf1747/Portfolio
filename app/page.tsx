import Preloader from "@/components/Preloader";
import ScrollProvider from "@/components/ScrollProvider";
import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import Reel from "@/components/sections/Reel";
import About from "@/components/sections/About";
import Statement from "@/components/sections/Statement";
import Capabilities from "@/components/sections/Capabilities";
import Work from "@/components/sections/Work";
import Approach from "@/components/sections/Approach";
import Subjects from "@/components/sections/Subjects";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Preloader />
      <ScrollProvider />
      <Nav />

      <main>
        <Hero />
        <Reel />
        <About />
        <Statement />
        <Capabilities />
        <Work />
        <Approach />
        <Subjects />
        <Contact />
      </main>
    </>
  );
}
