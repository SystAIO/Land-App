const VIDEO_ID = /(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/;

export function youtubeVideoId(raw: string): string | null {
  const match = raw.match(VIDEO_ID);
  return match ? match[1] : null;
}

/** URL that renders the privacy-enhanced player. */
export function youtubeEmbedUrl(raw: string): string | null {
  const id = youtubeVideoId(raw);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** True for any youtube.com / youtu.be link (video, channel, playlist…). */
export function isYoutubeUrl(raw: string): boolean {
  return /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\//i.test(raw.trim());
}
