import React, { useMemo, forwardRef } from 'react';
import { resolveVideoSource } from "../utils/videoSource";

type Props = {
  source: string | undefined | null;
  className?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  preload?: string;
  style?: React.CSSProperties;
};

const VideoPlayer = forwardRef<HTMLVideoElement, Props>(function VideoPlayer(props, ref) {
  const { source, className, poster, autoPlay = false, muted = false, controls = true, playsInline = true, preload = "metadata", style } = props;
  const resolved = useMemo(() => resolveVideoSource(source), [source]);
  if (!resolved) return null;

  // Prefer iframe-like sources if given; otherwise render a simple HTML5 video
  if ((resolved as any).kind === 'iframe' || (resolved as any).kind === 'youtube' || (resolved as any).kind === 'vimeo') {
    const url = (resolved as any).url;
    return (
      <iframe
        className={className}
        src={url}
        title="Video"
        style={{ width: '100%', height: '100%', border: 0, ...style }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={() => {
           console.log('[VIDEO DEBUG] iframe onLoad');
           if ((props as any).onReady) (props as any).onReady();
        }}
      />
    );
  }

  // Default to HTML5 video; forwardRef lets parent control playback
  return (
    <video
      ref={ref}
      className={className}
      src={(resolved as any).url}
      poster={poster}
      autoPlay={autoPlay}
      muted={muted}
      controls={controls}
      playsInline={playsInline}
      preload={preload as any}
      style={{ width: '100%', height: '100%', ...style }}
      onLoadStart={() => {
        if ((props as any).onLoadStart) (props as any).onLoadStart();
      }}
      onCanPlay={() => {
        if ((props as any).onReady) (props as any).onReady();
      }}
    />
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
