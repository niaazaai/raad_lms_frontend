import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export interface LessonVideoPlayerProps {
  src: string;
  playbackType?: "hls" | "progressive";
  className?: string;
}

/**
 * Plays HLS (via hls.js or native Safari) or progressive MP4 in a styled video element.
 */
const LessonVideoPlayer = ({ src, playbackType, className }: LessonVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) {
      return;
    }

    setError(null);

    const isHls =
      playbackType === "hls" ||
      src.includes(".m3u8") ||
      (!playbackType && src.includes(".m3u8"));

    const cleanupHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    if (!isHls) {
      cleanupHls();
      video.src = src;
      video.load();

      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    const canNative =
      video.canPlayType("application/vnd.apple.mpegurl") !== "" ||
      video.canPlayType("application/x-mpegURL") !== "";

    if (canNative) {
      cleanupHls();
      video.src = src;
      video.load();

      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      setError("Playback is not supported in this browser.");
      return;
    }

    cleanupHls();
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
    });
    hlsRef.current = hls;

    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (data.fatal) {
        const msg =
          data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? "Network error while loading video."
            : "Playback error.";
        setError(msg);
      }
    });

    hls.loadSource(src);
    hls.attachMedia(video);

    return () => {
      cleanupHls();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, playbackType]);

  return (
    <div className={className}>
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <video
        ref={videoRef}
        className="aspect-video w-full rounded-md border border-border bg-black object-contain"
        controls
        playsInline
        preload="metadata"
      />
    </div>
  );
};

export default LessonVideoPlayer;
