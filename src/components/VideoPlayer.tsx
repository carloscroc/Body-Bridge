import React, { useMemo, forwardRef, useCallback, type Ref } from 'react';
import { resolveVideoSource } from "../utils/videoSource";

type Props = {
  videoUrl: string | undefined | null;
  className?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  preload?: string;
  style?: React.CSSProperties;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
};

const VideoPlayer = forwardRef<HTMLVideoElement, Props>(function VideoPlayer(props, ref) {
  const { 
    videoUrl, 
    className, 
    poster, 
    autoPlay = false, 
    muted = false, 
    controls = true, 
    playsInline = true, 
    preload = "metadata", 
    style,
    onLoadStart,
    onCanPlay,
    onReady,
    onPlay,
    onPause
  } = props;
  
  const resolved = useMemo(() => resolveVideoSource(videoUrl), [videoUrl]);
  
  const handleLoadStart = useCallback(() => {
    if (onLoadStart) onLoadStart();
  }, [onLoadStart]);

  const handleCanPlay = useCallback(() => {
    if (onReady) onReady();
    if (onCanPlay) onCanPlay();
  }, [onReady, onCanPlay]);

  const handlePlay = useCallback(() => {
    if (onPlay) onPlay();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    if (onPause) onPause();
  }, [onPause]);

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
        onLoad={handleLoadStart}
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
      onLoadStart={handleLoadStart}
      onCanPlay={handleCanPlay}
      onPlay={handlePlay}
      onPause={handlePause}
    />
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
