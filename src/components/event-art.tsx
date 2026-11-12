import community from "@/assets/offstage-community.png.asset.json";
import banner from "@/assets/offstage-banner.png.asset.json";
import merch from "@/assets/pass-it-on-merch.png.asset.json";
import sharing from "@/assets/offstage-sharing.png.asset.json";
import gathering from "@/assets/offstage-gathering.png.asset.json";
import moments from "@/assets/offstage-moments.png.asset.json";

export const eventArt = { community, banner, merch, sharing, gathering, moments };

export function EventImage({ src, caption, label, className = "", position = "center 30%" }: {
  src: { url: string };
  caption: string;
  label: string;
  className?: string;
  position?: string;
}) {
  return (
    <figure className={`event-frame reveal ${className}`}>
      <img src={src.url} alt={label} loading="lazy" style={{ objectPosition: position }} />
      <figcaption><span>{caption}</span></figcaption>
    </figure>
  );
}

export function VideoStage({ src, poster, title = "OFFSTAGE FILM" }: {
  /** MP4/WebM file URL or hosted video URL. Leave empty to show the coming-soon state. */
  src?: string;
  poster: { url: string };
  title?: string;
}) {
  return (
    <div className="video-stage reveal">
      <div className="video-frame">
        {src ? (
          <video controls preload="metadata" poster={poster.url} aria-label={title}>
            <source src={src} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <>
            <img className="video-poster" src={poster.url} alt="Builders gathered at the Vara OFFSTAGE event, illustrated in the OFFSTAGE universe style" loading="lazy" />
            <div className="video-placeholder">
              <span className="video-kicker">{title}</span>
              <span className="video-status"><span className="video-dot" />VIDEO COMING SOON</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
