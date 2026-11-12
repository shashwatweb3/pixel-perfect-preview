import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HandoffArt, Idea } from "@/components/story-art";
import beginning from "@/assets/beginning-world.jpg";
import workshop from "@/assets/workshop-world.jpg";
import connected from "@/assets/connected-world.jpg";
import varaLogo from "@/assets/vara-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "VARA [OFFSTAGE] — The room was just the beginning" },
    { name: "description", content: "The conversations continue. The builds continue. Meet OFFSTAGE, a space for builders across the Vara ecosystem, and discover the Pass It On philosophy." },
    { property: "og:title", content: "VARA [OFFSTAGE] — Pass it on" },
    { property: "og:description", content: "A world behind the builders. Explore, share, connect — and keep good things moving. Coming soon." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const scenes = [{ id: "beginning", label: "The beginning" }, { id: "about", label: "Behind the scenes" }, { id: "pass-it-on", label: "Pass it on" }, { id: "connection", label: "The connection" }];

function Brand({ footer = false }: { footer?: boolean }) {
  return <a className={`brand ${footer ? "brand-footer" : ""}`} href="#beginning" aria-label="VARA OFFSTAGE, back to the beginning"><img className="vara-logo" src={varaLogo.url} width={305} height={202} alt="Vara" /><span><span className="brand-divider" /><strong>[OFFSTAGE]</strong></span></a>;
}

function Index() {
  const mainRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const sections = Array.from(main.querySelectorAll<HTMLElement>(".story-scene"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); });
    }, { threshold: 0.12 });
    sections.forEach(section => observer.observe(section));
    let frame = 0;
    const update = () => {
      frame = 0;
      let nearest = 0;
      let distance = Infinity;
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const d = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
        if (d < distance) { nearest = index; distance = d; }
        const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.7 - rect.top) / (rect.height * 0.8)));
        section.style.setProperty("--scene-progress", String(reduced.matches ? 1 : progress));
        section.style.setProperty("--parallax", `${reduced.matches ? 0 : Math.max(-35, Math.min(35, -rect.top * 0.055))}px`);
      });
      setActive(nearest);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    reduced.addEventListener("change", scroll);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", scroll); window.removeEventListener("resize", scroll); reduced.removeEventListener("change", scroll); };
  }, []);

  return <>
    <a className="skip-link" href="#story-content">Skip to the story</a>
    <header className="site-header">
      <Brand />
      <nav aria-label="Main navigation"><Button asChild variant="storyNav"><a href="#about">ABOUT</a></Button><Button asChild variant="storyNav"><a href="#pass-it-on">PASS IT ON <ArrowUpRight /></a></Button></nav>
      <span className="coming-soon"><span />COMING SOON</span>
    </header>
    <main ref={mainRef} id="story-content">
      <section className="story-scene beginning is-visible" id="beginning" aria-labelledby="opening-heading">
        <img className="world-background" src={beginning} width="1536" height="1024" alt="A developer building beside a vast lavender portal, surrounded by floating islands and coral cliffs" fetchPriority="high" />
        <div className="scene-shade" />
        <div className="star-field" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="opening-idea"><Idea /></div>
        <div className="scene-content opening-content">
          <p className="eyebrow"><span className="eyebrow-line" />THE WORLD BEHIND THE BUILDERS</p>
          <h1 id="opening-heading">THE ROOM WAS<br />JUST THE<br /><span className="headline-last">BEGINNING<span className="headline-period">.</span></span></h1>
          <p className="opening-copy">OFFSTAGE is a space for the people building,<br className="desktop-break" /> experimenting and creating across the Vara ecosystem.</p>
          <p className="continuation">The conversations continue. The builds continue.</p>
          <Button asChild variant="discover" size="lg"><a href="#about">DISCOVER OFFSTAGE <span className="button-arrow"><ArrowUpRight /></span></a></Button>
        </div>
        <div className="scene-bottom"><span><span className="chapter-number">01 / 04</span> THE BEGINNING</span><a href="#about" className="scroll-cue" aria-label="Continue to behind the scenes"><span>THERE’S MORE BEYOND THE ROOM</span><ArrowDown /></a><span className="coordinates">BUILT TO KEEP BUILDING</span></div>
      </section>

      <section className="story-scene about-scene" id="about" aria-labelledby="about-heading">
        <img className="world-background" src={workshop} width="1536" height="1024" loading="lazy" alt="Three lavender portals open onto a developer's workshop, a conversation, and an experimental world" />
        <div className="scene-shade" />
        <div className="scene-content about-content reveal"><p className="eyebrow">02 — BEHIND THE SCENES</p><h2 id="about-heading">THE WORK CONTINUES<br />BEHIND THE SCENES.</h2><p className="section-copy">OFFSTAGE began with people coming together in Mumbai. It continues as a place to discover what people are building, share what they're learning and connect with others moving in the same direction.</p></div>
        <div className="concepts reveal">{[{ name: "EXPLORE", copy: "Discover projects, experiments and ideas." }, { name: "SHARE", copy: "Exchange knowledge, experiences and lessons." }, { name: "CONNECT", copy: "Find people who can help you move forward." }].map((concept, index) => <div className="concept" key={concept.name}><span className="concept-number">0{index + 1}</span><h3>{concept.name}<ArrowUpRight /></h3><p>{concept.copy}</p></div>)}</div>
        <div className="workshop-idea"><Idea /></div>
      </section>

      <section className="story-scene pass-scene" id="pass-it-on" aria-labelledby="pass-heading">
        <div className="pass-orbit" aria-hidden="true" /><div className="star-field" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="scene-content pass-content reveal"><p className="eyebrow">03 — GOOD THINGS SHOULD KEEP MOVING</p><h2 id="pass-heading">SOMETHING GOOD<br />CAME YOUR WAY.<br /><span className="pass-heading">PASS IT ON.<ArrowUpRight /></span></h2><p className="section-copy">A useful resource. A lesson you learned. An introduction that opened a door. Sometimes a small thing can make a big difference to someone else.</p></div>
        <HandoffArt />
        <p className="pass-closing reveal">OFFSTAGE believes good things should keep moving.<br />Share what you know. Help someone take the next step. <span>Pass it on.</span></p>
      </section>

      <section className="story-scene connection-scene" id="connection" aria-labelledby="connection-heading">
        <img className="world-background" src={connected} width="1536" height="1024" loading="lazy" alt="Builders on many floating islands connected by softly illuminated paths across a purple universe" />
        <div className="scene-shade" />
        <div className="scene-content connection-content reveal"><p className="eyebrow">04 — A LITTLE SHARING. A BIGGER WORLD.</p><h2 id="connection-heading">NO ONE<br />BUILDS ALONE.</h2><p className="section-copy">Every project starts somewhere. Every builder has something to learn. And everyone has something worth sharing.</p><div className="closing-idea"><Idea /></div><p className="next-chapter">THE NEXT CHAPTER IS BEING BUILT.</p><span className="coming-soon"><span />COMING SOON</span></div>
        <footer><Brand footer /><p>The building doesn't stop when the event ends.</p><Button asChild variant="storyNav"><a href="#beginning">BACK TO THE BEGINNING <MoveRight /></a></Button></footer>
      </section>
    </main>
    <nav className="chapter-nav" aria-label="Story chapters">{scenes.map((scene, index) => <a key={scene.id} href={`#${scene.id}`} className={active === index ? "chapter-active" : ""} aria-label={scene.label} aria-current={active === index ? "step" : undefined}><span className="chapter-tooltip">{scene.label}</span><span className="chapter-dot" /></a>)}</nav>
  </>;
}
