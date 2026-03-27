export type VideoSourceKind = "file" | "youtube" | "vimeo" | "iframe" | "unknown";

export type VideoSource =
  | { kind: "file"; url: string }
  | { kind: "youtube"; url: string }
  | { kind: "vimeo"; url: string }
  | { kind: "iframe"; url: string }
  | { kind: "unknown"; url: string };

const FILE_REGEX = /\.(mp4|webm|og[gv]|mov|m4v)(\?|#|$)/i;
// From common production patterns (react-player style), simplified to just extract id.
const YOUTUBE_ID_REGEX = /(?:youtu\.be\/|youtube(?:-nocookie|education)?\.com\/(?:embed\/|v\/|watch\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))((\w|-){11})/;
const VIMEO_ID_REGEX = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;

function safeTrim(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

export function extractIframeSrc(raw: string): string | null {
  const s = safeTrim(raw);
  if (!s) return null;
  if (!s.toLowerCase().includes("<iframe")) return null;
  const match = s.match(/\ssrc=("|')([^"']+)("|')/i);
  return match?.[2]?.trim() || null;
}

function toYouTubeEmbedUrl(id: string): string {
  // Use youtube-nocookie for better privacy.
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

function toVimeoEmbedUrl(id: string): string {
  return `https://player.vimeo.com/video/${id}`;
}

export function resolveVideoSource(input: unknown): VideoSource | null {
  const raw = safeTrim(input);
  if (!raw) return null;

  const iframeSrc = extractIframeSrc(raw);
  if (iframeSrc) {
    return { kind: "iframe", url: iframeSrc };
  }

  // If the DB stored a YouTube/Vimeo URL, render via iframe.
  const yt = raw.match(YOUTUBE_ID_REGEX);
  if (yt?.[1]) {
    return { kind: "youtube", url: toYouTubeEmbedUrl(yt[1]) };
  }

  const vimeo = raw.match(VIMEO_ID_REGEX);
  if (vimeo?.[1]) {
    return { kind: "vimeo", url: toVimeoEmbedUrl(vimeo[1]) };
  }

  // Direct video file.
  if (FILE_REGEX.test(raw)) {
    return { kind: "file", url: raw };
  }

  // Unknown but keep the URL around (some CDNs omit extensions).
  return { kind: "unknown", url: raw };
}
