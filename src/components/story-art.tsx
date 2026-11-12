import lavenderDeveloper from "@/assets/developer-lavender.webp";
import tealDeveloper from "@/assets/developer-teal.webp";
import coralDeveloper from "@/assets/developer-coral.webp";

export function Idea({ className = "" }: { className?: string }) {
  return (
    <svg className={`idea ${className}`} viewBox="0 0 80 90" fill="none" aria-hidden="true">
      <path className="idea-face" d="M40 4 70 24 70 61 40 84 10 61 10 24Z" />
      <path className="idea-light" d="M40 4 40 40 10 24Z" />
      <path className="idea-mid" d="M40 40 70 24 70 61 40 84Z" />
      <path className="idea-edge" d="M10 24 40 40 70 24M40 40V84" />
    </svg>
  );
}

export function Builder({ variant = 0 }: { variant?: number }) {
  const developers = [lavenderDeveloper, tealDeveloper, coralDeveloper];
  return (
    <img className={`builder builder-${variant} character-idle`} src={developers[variant] ?? lavenderDeveloper} width={512} height={768} loading="lazy" alt={variant === 1 ? "A curly-haired developer in a teal hoodie and glasses, receiving an idea beside his laptop" : variant === 2 ? "A developer in a coral jacket sharing an idea from his floating workstation" : "A developer in a lavender overshirt offering a discovery from his laptop"} />
  );
}

export function HandoffArt() {
  return (
    <div className="handoff-art">
      <svg className="connection-lines" viewBox="0 0 1000 320" fill="none" aria-hidden="true">
        <path className="connection-ghost" d="M150 170Q320 0 500 170T850 170" />
        <path className="connection-live" pathLength="1" d="M150 170Q320 0 500 170T850 170" />
        <circle className="connection-node" cx="150" cy="170" r="5" /><circle className="connection-node" cx="500" cy="170" r="5" /><circle className="connection-node" cx="850" cy="170" r="5" />
      </svg>
      <svg className="connection-lines-mobile" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true"><path className="connection-ghost-mobile" pathLength="1" d="M31 14C62 22 72 38 72 52C72 66 31 72 31 86" vectorEffect="non-scaling-stroke" /><path className="connection-live-mobile" pathLength="1" d="M31 14C62 22 72 38 72 52C72 66 31 72 31 86" vectorEffect="non-scaling-stroke" /><circle className="connection-node-mobile" cx="31" cy="14" r="1.1" /><circle className="connection-node-mobile" cx="72" cy="52" r="1.1" /><circle className="connection-node-mobile" cx="31" cy="86" r="1.1" /></svg>
      <div className="builder-station station-one"><Builder /><span>A little discovery.</span></div>
      <div className="builder-station station-two"><Builder variant={1} /><span>A new possibility.</span></div>
      <div className="builder-station station-three"><Builder variant={2} /><span>And on it goes.</span></div>
      <div className="travelling-idea"><Idea /><span className="idea-trail" /></div>
    </div>
  );
}