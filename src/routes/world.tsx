import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WorldExperience } from "@/components/world/WorldExperience";
import { SAMPLE_BUILDER } from "@/components/world/builder-profile";
import { useOffstageRoom } from "@/components/world/use-offstage-room";

export const Route = createFileRoute("/world")({
  head: () => ({
    meta: [
      { title: "OFFSTAGE Plaza — VARA [OFFSTAGE]" },
      {
        name: "description",
        content: "A playable first look at the VARA [OFFSTAGE] social world.",
      },
    ],
  }),
  component: WorldRoute,
});

function WorldRoute() {
  const [mounted, setMounted] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [displayName] = useState(() => `Builder ${Math.floor(Math.random() * 900 + 100)}`);
  const { status, remoteIds, onlineCount, sendMove, getPlayer, reconnect } =
    useOffstageRoom(displayName);
  useEffect(() => setMounted(true), []);
  return (
    <main
      id="story-content"
      className="relative h-[100dvh] min-h-[540px] overflow-hidden bg-[#121b27]"
    >
      {mounted ? (
        <WorldExperience
          onNearbyChange={setNearby}
          onInteract={() => setOpen(true)}
          onWorldPointerDown={() => setEntered(true)}
          onLocalMove={sendMove}
          remoteIds={remoteIds}
          getRemotePlayer={getPlayer}
        />
      ) : (
        <div className="grid h-full place-items-center bg-[#121b27] font-mono text-xs uppercase tracking-[0.22em] text-[#dceadf]">
          Loading plaza
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pt-20 sm:p-6 sm:pt-24">
        <div className="flex items-start justify-between gap-4">
          <div className="pointer-events-auto border border-white/15 bg-[#101821]/85 px-4 py-3 backdrop-blur-md">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#b4e4c3]">
              VARA [OFFSTAGE]
            </p>
            <p
              data-testid="connection-status"
              className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55"
            >
              {status === "connected"
                ? `${onlineCount} ${onlineCount === 1 ? "builder" : "builders"} online`
                : status === "connecting"
                  ? "Connecting to plaza"
                  : "Realtime server unavailable"}
            </p>
            {status === "offline" || status === "error" ? (
              <button
                type="button"
                onClick={reconnect}
                className="mt-2 border border-[#b4e4c3]/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#b4e4c3] transition hover:bg-[#b4e4c3]/10"
              >
                Reconnect
              </button>
            ) : null}
          </div>
          <Link
            to="/"
            className="pointer-events-auto border border-white/15 bg-[#101821]/85 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75 backdrop-blur-md transition hover:border-[#b4e4c3] hover:text-[#b4e4c3]"
          >
            Exit plaza
          </Link>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="border border-white/15 bg-[#101821]/85 p-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/75 backdrop-blur-md">
            <p>
              <kbd className="mr-1 border border-white/25 px-1.5 py-0.5 text-white">WASD</kbd> move
            </p>
            <p className="mt-2">
              <kbd className="mr-1 border border-white/25 px-1.5 py-0.5 text-white">Shift</kbd> run
            </p>
            <p className="mt-2">
              <kbd className="mr-1 border border-white/25 px-1.5 py-0.5 text-white">Mouse</kbd> look
            </p>
          </div>
          <div
            className="max-w-xs border-l-2 border-[#b4e4c3] bg-[#101821]/85 px-4 py-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.13em] text-[#dceadf] backdrop-blur-md"
            aria-live="polite"
          >
            {nearby ? (
              <span>
                <kbd className="mr-1 border border-[#b4e4c3]/60 px-1.5 py-0.5 text-[#b4e4c3]">
                  E
                </kbd>{" "}
                meet Aanya
              </span>
            ) : entered ? (
              "Find a builder in the plaza"
            ) : (
              "Click the plaza to enable mouse look"
            )}
          </div>
        </div>
      </div>
      {open ? (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="builder-profile-title"
          className="absolute inset-x-4 bottom-6 z-20 max-w-md border border-[#b4e4c3]/40 bg-[#101821]/95 p-5 text-[#e6f0e6] shadow-2xl backdrop-blur-xl sm:left-auto sm:right-6"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 border border-white/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70 transition hover:border-[#b4e4c3] hover:text-[#b4e4c3]"
          >
            Close
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#b4e4c3]">
            Nearby builder
          </p>
          <h1 id="builder-profile-title" className="mt-3 pr-16 font-wide text-3xl uppercase">
            {SAMPLE_BUILDER.name}
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
            {SAMPLE_BUILDER.role}
          </p>
          <p className="mt-5 text-sm leading-relaxed text-white/80">{SAMPLE_BUILDER.bio}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {SAMPLE_BUILDER.skills.map((skill) => (
              <span
                key={skill}
                className="border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/70"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#b4e4c3]">
              PASS IT ON
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{SAMPLE_BUILDER.passItOn}</p>
          </div>
        </section>
      ) : null}
      <p className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">
        Original VARA [OFFSTAGE] and PASS IT ON concepts by @adityakrx
      </p>
    </main>
  );
}
