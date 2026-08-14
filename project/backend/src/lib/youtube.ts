import { config } from '../config.js';

export interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export async function searchEducationalVideo(query: string): Promise<VideoResult | null> {
  if (!config.youtubeApiKey) return null;

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '1',
    safeSearch: 'strict',
    videoEmbeddable: 'true',
    relevanceLanguage: 'en',
    q: query,
    key: config.youtubeApiKey,
  });

  let response: Response;
  try {
    response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  } catch (err) {
    console.error('YouTube search failed (network):', err instanceof Error ? err.message : err);
    return null;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('YouTube search failed:', response.status, body.slice(0, 300));
    return null;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return null;
  }

  const items = (json as { items?: unknown[] }).items;
  const first = items?.[0] as
    | { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string } } } }
    | undefined;

  const videoId = first?.id?.videoId;
  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) return null;

  return {
    videoId,
    title: first?.snippet?.title || 'Untitled video',
    channelTitle: first?.snippet?.channelTitle || '',
    thumbnailUrl: first?.snippet?.thumbnails?.medium?.url || '',
  };
}
