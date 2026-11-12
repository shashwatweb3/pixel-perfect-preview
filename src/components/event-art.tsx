import community from "@/assets/offstage-community.webp";
import communitySm from "@/assets/offstage-community-sm.webp";
import banner from "@/assets/offstage-banner.webp";
import bannerSm from "@/assets/offstage-banner-sm.webp";
import merch from "@/assets/pass-it-on-merch.webp";
import merchSm from "@/assets/pass-it-on-merch-sm.webp";
import sharing from "@/assets/offstage-sharing.webp";
import sharingSm from "@/assets/offstage-sharing-sm.webp";
import gathering from "@/assets/offstage-gathering.webp";
import gatheringSm from "@/assets/offstage-gathering-sm.webp";
import moments from "@/assets/offstage-moments.webp";
import momentsSm from "@/assets/offstage-moments-sm.webp";
import filmPoster from "@/assets/offstage-film-poster.jpg";
import filmPosterSm from "@/assets/offstage-film-poster-sm.jpg";

export type EventArt = { src: string; srcSet: string };

const art = (src: string, small: string): EventArt => ({
  src,
  srcSet: `${small} 800w, ${src} 1600w`,
});

export const eventArt = {
  community: art(community, communitySm),
  banner: art(banner, bannerSm),
  merch: art(merch, merchSm),
  sharing: art(sharing, sharingSm),
  gathering: art(gathering, gatheringSm),
  moments: art(moments, momentsSm),
  film: {
    src: filmPoster,
    srcSet: `${filmPosterSm} 640w, ${filmPoster} 1280w`,
  },
};

export function EventImage({
  src,
  caption,
  label,
  className = "",
  position = "center 30%",
  sizes = "(max-width: 700px) 92vw, 760px",
}: {
  src: EventArt;
  caption: string;
  label: string;
  className?: string;
  position?: string;
  sizes?: string;
}) {
  return (
    <figure className={`event-frame reveal ${className}`}>
      <img
        src={src.src}
        srcSet={src.srcSet}
        sizes={sizes}
        alt={label}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: position }}
      />
      <figcaption>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}

export function VideoStage({
  src,
  poster,
  title = "OFFSTAGE FILM",
}: {
  /** MP4/WebM file URL or hosted video URL. Leave empty to show the coming-soon state. */
  src?: string;
  poster: EventArt;
  title?: string;
}) {
  return (
    <div className="video-stage reveal">
      <div className="video-frame">
        {src ? (
          <video controls playsInline preload="metadata" poster={poster.src} aria-label={title}>
            <source src={src} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <>
            <img
              className="video-poster"
              src={poster.src}
              srcSet={poster.srcSet}
              sizes="(max-width: 700px) 92vw, 1200px"
              alt="Builders gathered at the Vara OFFSTAGE event, illustrated in the OFFSTAGE universe style"
              loading="lazy"
              decoding="async"
            />
            <div className="video-placeholder">
              <span className="video-kicker">{title}</span>
              <span className="video-status">
                <span className="video-dot" />
                VIDEO COMING SOON
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
