import { useCallback, useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const links = [
  { href: "#about", label: "ABOUT", detail: "Behind the scenes" },
  { href: "#pass-it-on", label: "PASS IT ON", detail: "The story keeps moving" },
];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>("a[href], button:not([tabindex='-1'])"),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    const timer = window.setTimeout(() => firstLinkRef.current?.focus(), 90);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      restoreRef.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  return (
    <div className={`mobile-menu-root ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="mobile-backdrop"
        tabIndex={-1}
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        id="mobile-menu"
        ref={panelRef}
        className="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!open}
      >
        <p className="mobile-menu-kicker">MENU</p>
        <nav aria-label="Mobile navigation" className="mobile-menu-links">
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              ref={index === 0 ? firstLinkRef : undefined}
              onClick={onClose}
            >
              <span className="mobile-menu-index">0{index + 1}</span>
              <span className="mobile-menu-label">{link.label}</span>
              <span className="mobile-menu-detail">
                {link.detail}
                <ArrowUpRight aria-hidden="true" />
              </span>
            </a>
          ))}
        </nav>
        <div className="mobile-menu-status">
          <span className="coming-soon">
            <span />
            COMING SOON
          </span>
          <p>The conversations continue. The builds continue.</p>
        </div>
        <a
          className="mobile-menu-network"
          href="https://vara.network"
          target="_blank"
          rel="noreferrer"
        >
          VARA NETWORK <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
