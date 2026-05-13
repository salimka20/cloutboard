const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const BASE = 'https://www.googleapis.com/youtube/v3';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, channelId } = req.query;

  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  try {
    if (q) {
      return await searchChannels(q, res);
    } else if (channelId) {
      return await getChannelStats(channelId, res);
    } else {
      return res.status(400).json({ error: 'Provide ?q=searchterm or ?channelId=UC...' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function searchChannels(query, res) {
  const cacheKey = `yt-search-${query}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const searchUrl = `${BASE}/search?part=snippet&type=channel&maxResults=8&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.items || searchData.items.length === 0) {
    return res.json({ results: [] });
  }

  const channelIds = searchData.items.map(i => i.snippet.channelId).join(',');
  const statsUrl = `${BASE}/channels?part=statistics,snippet,brandingSettings&id=${channelIds}&key=${YOUTUBE_API_KEY}`;
  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json();

  const results = (statsData.items || []).map(ch => ({
    id: ch.id,
    name: ch.snippet.title,
    handle: ch.snippet.customUrl || '@' + ch.snippet.title.toLowerCase().replace(/\s/g, ''),
    avatar: ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url,
    description: ch.snippet.description?.substring(0, 150),
    subscribers: parseInt(ch.statistics.subscriberCount) || 0,
    totalViews: parseInt(ch.statistics.viewCount) || 0,
    videoCount: parseInt(ch.statistics.videoCount) || 0,
    country: ch.snippet.country || 'Unknown',
  }));

  setCache(cacheKey, { results });
  return res.json({ results });
}

async function getChannelStats(channelId, res) {
  const cacheKey = `yt-channel-${channelId}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const channelUrl = `${BASE}/channels?part=statistics,snippet,brandingSettings,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  const channelRes = await fetch(channelUrl);
  const channelData = await channelRes.json();

  if (!channelData.items || channelData.items.length === 0) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const ch = channelData.items[0];
  const stats = ch.statistics;
  const uploadsPlaylist = ch.contentDetails?.relatedPlaylists?.uploads;

  let recentVideos = [];
  let shortsViews = 0;
  let longformViews = 0;
  let shortsCount = 0;
  let longformCount = 0;

  if (uploadsPlaylist) {
    const plUrl = `${BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylist}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    const plRes = await fetch(plUrl);
    const plData = await plRes.json();

    if (plData.items && plData.items.length > 0) {
      const videoIds = plData.items.map(i => i.contentDetails.videoId).join(',');
      const vidUrl = `${BASE}/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      const vidRes = await fetch(vidUrl);
      const vidData = await vidRes.json();

      for (const vid of (vidData.items || [])) {
        const duration = vid.contentDetails.duration;
        const views = parseInt(vid.statistics.viewCount) || 0;
        const likes = parseInt(vid.statistics.likeCount) || 0;
        const isShort = isShortVideo(duration);

        if (isShort) {
          shortsViews += views;
          shortsCount++;
        } else {
          longformViews += views;
          longformCount++;
        }

        recentVideos.push({
          id: vid.id,
          title: vid.snippet.title,
          views,
          likes,
          publishedAt: vid.snippet.publishedAt,
          isShort,
          duration: parseDuration(duration),
        });
      }
    }
  }

  const totalViews = parseInt(stats.viewCount) || 0;
  const subscribers = parseInt(stats.subscriberCount) || 0;

  const totalLongformViews = Math.round(totalViews * (longformCount / Math.max(longformCount + shortsCount, 1)));
  const totalShortsViews = totalViews - totalLongformViews;

  const avgLongformCpm = estimateYouTubeCpm(subscribers);
  const shortsRpm = 0.06;

  const monthlyLongformViews = longformViews;
  const monthlyShortsViews = shortsViews;
  const longformRevenue = (monthlyLongformViews / 1000) * avgLongformCpm;
  const shortsRevenue = (monthlyShortsViews / 1000) * shortsRpm;

  const result = {
    id: ch.id,
    name: ch.snippet.title,
    handle: ch.snippet.customUrl || '',
    avatar: ch.snippet.thumbnails?.medium?.url,
    banner: ch.brandingSettings?.image?.bannerExternalUrl,
    description: ch.snippet.description?.substring(0, 300),
    country: ch.snippet.country || 'Unknown',
    subscribers,
    totalViews,
    videoCount: parseInt(stats.videoCount) || 0,
    longform: {
      totalViews: totalLongformViews,
      recentViews: longformViews,
      count: longformCount,
      avgViews: longformCount > 0 ? Math.round(longformViews / longformCount) : 0,
      cpm: avgLongformCpm,
      monthlyRevenue: longformRevenue,
      perViewEarning: avgLongformCpm / 1000,
    },
    shorts: {
      totalViews: totalShortsViews,
      recentViews: shortsViews,
      count: shortsCount,
      avgViews: shortsCount > 0 ? Math.round(shortsViews / shortsCount) : 0,
      rpm: shortsRpm,
      monthlyRevenue: shortsRevenue,
      perViewEarning: shortsRpm / 1000,
    },
    estimatedMonthlyRevenue: longformRevenue + shortsRevenue,
    estimatedYearlyRevenue: (longformRevenue + shortsRevenue) * 12,
    recentVideos: recentVideos.slice(0, 10),
  };

  setCache(cacheKey, result);
  return res.json(result);
}

function isShortVideo(duration) {
  const seconds = parseDuration(duration);
  return seconds > 0 && seconds <= 61;
}

function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 3600) + (parseInt(match[2] || 0) * 60) + parseInt(match[3] || 0);
}

function estimateYouTubeCpm(subscribers) {
  if (subscribers > 50000000) return 7.0;
  if (subscribers > 10000000) return 6.0;
  if (subscribers > 1000000) return 5.0;
  if (subscribers > 100000) return 4.0;
  return 3.0;
}
